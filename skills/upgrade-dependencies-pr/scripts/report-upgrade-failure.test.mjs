import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildReportPlan,
  invokeProducer,
  parseProducerOutput,
  producerInvocation,
  reportUpgradeOutcome,
  usageFailure,
} from "./report-upgrade-failure.mjs";

const unresolved = {
  outcome: "unresolved-failure",
  runId: "scheduler-run-2026-08-30T08:00:00.000Z",
  repository: "owner/project",
  project: "project",
  phase: "validation",
  errorClass: "test-failure",
  observedAt: "2026-08-30T08:12:00.000Z",
  primaryExitCode: 17,
  failureCount: 2,
};

test("reports only terminal unresolved failures", async () => {
  for (const outcome of [
    "success",
    "no-change",
    "review-waiting",
    "repaired",
  ]) {
    let calls = 0;
    const result = await reportUpgradeOutcome(
      { outcome },
      {
        invokeProducer: async () => {
          calls++;
          return { exitCode: 0, output: { ok: true } };
        },
      },
    );
    assert.equal(result.exitCode, 0);
    assert.equal(result.output.reported, false);
    assert.equal(calls, 0);
  }

  let calls = 0;
  await reportUpgradeOutcome(unresolved, {
    invokeProducer: async () => {
      calls++;
      return { exitCode: 0, output: { ok: true } };
    },
  });
  assert.equal(calls, 1);
});

test("deduplicates retries but separates scheduled occurrences", () => {
  const first = buildReportPlan(unresolved).envelope.sourceIncidentId;
  const retry = buildReportPlan({ ...unresolved }).envelope.sourceIncidentId;
  const later = buildReportPlan({
    ...unresolved,
    runId: "scheduler-run-2026-09-06T08:00:00.000Z",
  }).envelope.sourceIncidentId;

  assert.equal(first, retry);
  assert.notEqual(first, later);
  assert.ok(first.length <= 120);

  const reclassifiedRetry = buildReportPlan({
    ...unresolved,
    phase: "pr-creation",
    errorClass: "push-failure",
  }).envelope.sourceIncidentId;
  assert.equal(first, reclassifiedRetry);
});

test("bounds and redacts diagnostic metadata", () => {
  const plan = buildReportPlan({
    ...unresolved,
    phase: "x".repeat(120),
    errorClass: "Authorization: Bearer abcdefghijklmnop",
  });

  assert.equal(plan.envelope.diagnostics.phase.length, 80);
  assert.equal(plan.envelope.diagnostics.errorClass, "[redacted]");
  assert.deepEqual(plan.envelope.allowedActions, ["inspect"]);
  assert.ok(JSON.stringify(plan.envelope).length < 2000);
  assert.equal(JSON.stringify(plan.envelope).includes("abcdefghijklmnop"), false);
});

test("simulation dry-run cannot select the production producer mode", () => {
  const invocation = producerInvocation({
    simulation: true,
    dryRun: true,
    opsTriageDir: "/tmp/versioned-ops-triage",
  });

  assert.deepEqual(invocation.args, [
    "run",
    "producer",
    "--simulation",
    "--dry-run",
  ]);
  assert.equal(invocation.cwd, "/tmp/versioned-ops-triage");
});

test("producer failure stays secondary to the primary upgrade failure", async () => {
  const result = await reportUpgradeOutcome(unresolved, {
    invokeProducer: async () => ({
      exitCode: 7,
      output: { ok: false, error: "service_unavailable" },
    }),
  });

  assert.equal(result.exitCode, unresolved.primaryExitCode);
  assert.equal(result.output.primaryExitCode, unresolved.primaryExitCode);
  assert.equal(result.output.primaryFailurePreserved, true);
  assert.deepEqual(result.output.incidentReporting, {
    ok: false,
    producerExitCode: 7,
    result: { ok: false, error: "service_unavailable" },
  });

  const thrown = await reportUpgradeOutcome(unresolved, {
    invokeProducer: async () => {
      throw new Error("unexpected producer failure");
    },
  });
  assert.equal(thrown.exitCode, unresolved.primaryExitCode);
  assert.deepEqual(thrown.output.incidentReporting, {
    ok: false,
    producerExitCode: null,
    result: { ok: false, error: "producer_invocation_failed" },
  });

  const malformed = parseProducerOutput(
    "runtime error: Authorization: Bearer abcdefghijklmnop",
  );
  assert.deepEqual(malformed, { ok: false, error: "invalid_producer_output" });
  assert.equal(JSON.stringify(malformed).includes("abcdefghijklmnop"), false);
});

test("bounds a stalled producer process", async () => {
  const startedAt = Date.now();
  const result = await invokeProducer(
    {
      command: process.execPath,
      args: ["-e", "setInterval(() => {}, 1000)"],
      cwd: process.cwd(),
    },
    {},
    { timeoutMs: 50 },
  );

  assert.ok(Date.now() - startedAt < 1000);
  assert.deepEqual(result, {
    exitCode: null,
    output: { ok: false, error: "producer_timeout" },
  });
});

test("waits for the SIGKILL fallback when the producer ignores SIGTERM", async () => {
  const startedAt = Date.now();
  const result = await invokeProducer(
    {
      command: process.execPath,
      args: [
        "-e",
        "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)",
      ],
      cwd: process.cwd(),
    },
    {},
    { timeoutMs: 50, forceKillMs: 50 },
  );

  const elapsed = Date.now() - startedAt;
  assert.ok(elapsed >= 90);
  assert.ok(elapsed < 1000);
  assert.deepEqual(result, {
    exitCode: null,
    output: { ok: false, error: "producer_timeout" },
  });
});

test("preserves the primary exit code on CLI usage errors", () => {
  assert.deepEqual(
    usageFailure(["--primary-exit-code", "17", "--bogus"]),
    {
      exitCode: 17,
      output: {
        ok: false,
        primaryExitCode: 17,
        primaryFailurePreserved: true,
        incidentReporting: { ok: false, error: "usage" },
      },
    },
  );
  assert.deepEqual(usageFailure(["--bogus"]), {
    exitCode: 2,
    output: { ok: false, error: "usage" },
  });
});

test(
  "terminates the producer process tree",
  { skip: process.platform === "win32" },
  async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "upgrade-producer-test-"));
    const pidFile = path.join(tempDir, "grandchild.pid");
    const grandchildCode =
      "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)";
    const parentCode = [
      "const { spawn } = require('node:child_process');",
      "const { writeFileSync } = require('node:fs');",
      `const child = spawn(process.execPath, ['-e', ${JSON.stringify(grandchildCode)}], { stdio: 'ignore' });`,
      `writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));`,
      "process.on('SIGTERM', () => {});",
      "setInterval(() => {}, 1000);",
    ].join("");

    try {
      const result = await invokeProducer(
        {
          command: process.execPath,
          args: ["-e", parentCode],
          cwd: process.cwd(),
        },
        {},
        { timeoutMs: 100, forceKillMs: 50 },
      );
      const grandchildPid = Number(await readFile(pidFile, "utf8"));
      await new Promise((resolve) => setTimeout(resolve, 25));

      assert.deepEqual(result, {
        exitCode: null,
        output: { ok: false, error: "producer_timeout" },
      });
      assert.throws(
        () => process.kill(grandchildPid, 0),
        (error) => error?.code === "ESRCH",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  },
);
