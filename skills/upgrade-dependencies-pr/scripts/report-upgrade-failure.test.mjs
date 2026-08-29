import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReportPlan,
  parseProducerOutput,
  producerInvocation,
  reportUpgradeOutcome,
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
