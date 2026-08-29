#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_OPS_TRIAGE_DIR = "/home/uwe/dev/ops-triage";
const PRODUCER_TIMEOUT_MS = 45_000;
const REPORTABLE_OUTCOME = "unresolved-failure";
const QUIET_OUTCOMES = new Set([
  "success",
  "no-change",
  "review-waiting",
  "repaired",
]);
const secretValuePattern =
  /(?:authorization\s*[:=]\s*(?:basic|bearer)\s+\S+|(?:basic|bearer)\s+[a-z0-9._~+/=-]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----|(?:token|secret|pass(?:[_\s-]*word)?|api[_\s-]*key|private[_\s-]*key|access[_\s-]*key|session[_\s-]*id|credential)\s*[:=]\s*\S+|\b(?:gh[oprsu]_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[A-Z0-9]{16})\b)/i;

function normalizeText(value, name, maxLength, { redact = false } = {}) {
  if (typeof value !== "string") {
    throw new Error(`invalid_${name}`);
  }

  const normalized = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0);
    return codePoint < 32 || codePoint === 127 ? " " : character;
  })
    .join("")
    .trim();
  if (!normalized) {
    throw new Error(`invalid_${name}`);
  }

  if (redact && secretValuePattern.test(normalized)) {
    return "[redacted]";
  }

  if (normalized.length > maxLength) {
    if (redact) {
      return normalized.slice(0, maxLength);
    }
    throw new Error(`${name}_too_large`);
  }

  return normalized;
}

function isoTimestamp(value, name) {
  const normalized = normalizeText(value, name, 40);
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== normalized) {
    throw new Error(`invalid_${name}`);
  }
  return normalized;
}

function optionalInteger(value, name, minimum, maximum) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`invalid_${name}`);
  }
  return parsed;
}

export function buildReportPlan(input) {
  const outcome = normalizeText(input.outcome, "outcome", 40);
  if (QUIET_OUTCOMES.has(outcome)) {
    return { report: false, outcome };
  }
  if (outcome !== REPORTABLE_OUTCOME) {
    throw new Error("invalid_outcome");
  }

  const primaryExitCode = optionalInteger(
    input.primaryExitCode,
    "primaryExitCode",
    1,
    255,
  );
  if (primaryExitCode === undefined) {
    throw new Error("missing_primaryExitCode");
  }

  const repository = normalizeText(input.repository, "repository", 160);
  const project = normalizeText(input.project ?? repository, "project", 120, {
    redact: true,
  });
  const runId = normalizeText(input.runId, "runId", 160);
  const phase = normalizeText(input.phase, "phase", 80, { redact: true });
  const errorClass = normalizeText(input.errorClass, "errorClass", 120, {
    redact: true,
  });
  const observedAt = isoTimestamp(input.observedAt, "observedAt");
  const firstFailureAt = input.firstFailureAt
    ? isoTimestamp(input.firstFailureAt, "firstFailureAt")
    : undefined;
  const failureCount = optionalInteger(
    input.failureCount,
    "failureCount",
    1,
    1_000_000,
  );
  const identity = createHash("sha256")
    .update([repository, project, runId].join("\0"))
    .digest("hex")
    .slice(0, 40);

  const envelope = {
    source: "upgrade-dependencies-pr",
    sourceIncidentId: `scheduled-run:${identity}`,
    service: "dependency-upgrade",
    check: "scheduled-upgrade",
    repository,
    observedAt,
    ...(firstFailureAt ? { firstFailureAt } : {}),
    ...(failureCount ? { failureCount } : {}),
    exitCode: primaryExitCode,
    summary: `Scheduled dependency upgrade failed for ${repository} during ${phase}`,
    severity: "warning",
    diagnostics: {
      project,
      phase,
      errorClass,
      runIdentity: identity,
    },
    allowedActions: ["inspect"],
  };

  return {
    report: true,
    outcome,
    primaryExitCode,
    envelope,
  };
}

export function producerInvocation(input) {
  const opsTriageDir = path.resolve(
    input.opsTriageDir ?? DEFAULT_OPS_TRIAGE_DIR,
  );
  const args = ["run", "producer"];
  if (input.simulation) {
    args.push("--simulation");
  }
  if (input.dryRun) {
    args.push("--dry-run");
  }
  return { command: "bun", args, cwd: opsTriageDir };
}

export function invokeProducer(
  invocation,
  envelope,
  { timeoutMs = PRODUCER_TIMEOUT_MS, forceKillMs = 1_000 } = {},
) {
  return new Promise((resolve) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      detached: process.platform !== "win32",
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let settled = false;
    let timedOut = false;
    let forceKill;
    const timeoutResult = {
      exitCode: null,
      output: { ok: false, error: "producer_timeout" },
    };
    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      clearTimeout(forceKill);
      resolve(result);
    };
    const timeout = setTimeout(() => {
      timedOut = true;
      terminateProducer(child, "SIGTERM");
      forceKill = setTimeout(() => {
        terminateProducer(child, "SIGKILL");
        finish(timeoutResult);
      }, forceKillMs);
    }, timeoutMs);
    timeout.unref();

    child.stdout.on("data", (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-4096);
    });
    child.stderr.resume();
    child.on("error", (error) => {
      finish({
        exitCode: null,
        output: { ok: false, error: error.code ?? "producer_spawn_failed" },
      });
    });
    child.on("close", (exitCode) => {
      if (timedOut) {
        finish(timeoutResult);
        return;
      }
      const output = parseProducerOutput(stdout);
      finish({ exitCode, output });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(`${JSON.stringify(envelope)}\n`);
  });
}

export function terminateProducer(child, signal) {
  if (process.platform !== "win32" && Number.isInteger(child.pid)) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch (error) {
      if (error?.code === "ESRCH") {
        return;
      }
    }
  }
  child.kill(signal);
}

export function parseProducerOutput(stdout) {
  try {
    return JSON.parse(stdout.trim());
  } catch {
    return { ok: false, error: "invalid_producer_output" };
  }
}

export async function reportUpgradeOutcome(input, dependencies = {}) {
  let plan;
  try {
    plan = buildReportPlan(input);
  } catch (error) {
    const numericExitCode = Number(input.primaryExitCode);
    const primaryExitCode = Number.isInteger(numericExitCode)
      && numericExitCode >= 1
      && numericExitCode <= 255
      ? numericExitCode
      : 1;
    return {
      exitCode: primaryExitCode,
      output: {
        ok: false,
        primaryExitCode,
        incidentReporting: {
          ok: false,
          error: error instanceof Error ? error.message : "invalid_report_input",
        },
      },
    };
  }

  if (!plan.report) {
    return {
      exitCode: 0,
      output: { ok: true, outcome: plan.outcome, reported: false },
    };
  }

  const invocation = producerInvocation(input);
  const runProducer = dependencies.invokeProducer ?? invokeProducer;
  let producerResult;
  try {
    producerResult = await runProducer(invocation, plan.envelope);
  } catch {
    producerResult = {
      exitCode: null,
      output: { ok: false, error: "producer_invocation_failed" },
    };
  }
  const producerSucceeded = producerResult.exitCode === 0 && producerResult.output?.ok;

  return {
    exitCode: plan.primaryExitCode,
    output: {
      ok: false,
      outcome: plan.outcome,
      primaryExitCode: plan.primaryExitCode,
      primaryFailurePreserved: true,
      incidentReporting: producerSucceeded
        ? { ok: true, result: producerResult.output }
        : {
            ok: false,
            producerExitCode: producerResult.exitCode,
            result: producerResult.output,
          },
    },
  };
}

function parseArgs(args) {
  const result = {};
  const booleanArgs = new Map([
    ["--simulation", "simulation"],
    ["--dry-run", "dryRun"],
  ]);
  const valueArgs = new Map([
    ["--outcome", "outcome"],
    ["--run-id", "runId"],
    ["--repository", "repository"],
    ["--project", "project"],
    ["--phase", "phase"],
    ["--error-class", "errorClass"],
    ["--observed-at", "observedAt"],
    ["--first-failure-at", "firstFailureAt"],
    ["--failure-count", "failureCount"],
    ["--primary-exit-code", "primaryExitCode"],
    ["--ops-triage-dir", "opsTriageDir"],
  ]);

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (booleanArgs.has(arg) && result[booleanArgs.get(arg)] === undefined) {
      result[booleanArgs.get(arg)] = true;
      continue;
    }

    const key = valueArgs.get(arg);
    const value = args[index + 1];
    if (!key || result[key] !== undefined || !value || value.startsWith("--")) {
      throw new Error("usage");
    }
    result[key] = value;
    index++;
  }

  return result;
}

export function usageFailure(args) {
  let primaryExitCode;
  for (let index = 0; index < args.length - 1; index++) {
    if (args[index] !== "--primary-exit-code") {
      continue;
    }
    const candidate = Number(args[index + 1]);
    if (Number.isInteger(candidate) && candidate >= 1 && candidate <= 255) {
      primaryExitCode = candidate;
      break;
    }
  }

  if (primaryExitCode === undefined) {
    return { exitCode: 2, output: { ok: false, error: "usage" } };
  }

  return {
    exitCode: primaryExitCode,
    output: {
      ok: false,
      primaryExitCode,
      primaryFailurePreserved: true,
      incidentReporting: { ok: false, error: "usage" },
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  let input;
  try {
    input = parseArgs(args);
  } catch {
    const result = usageFailure(args);
    process.stdout.write(`${JSON.stringify(result.output)}\n`);
    return result.exitCode;
  }

  const result = await reportUpgradeOutcome(input);
  process.stdout.write(`${JSON.stringify(result.output)}\n`);
  return result.exitCode;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
