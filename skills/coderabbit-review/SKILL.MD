---
name: coderabbit-review
description: coderabbit code review (severity-gated)
---

Goal: Run coderabbit for a bounded, practical local code review. Prevent endless nit loops.

Execution:
- Run: coderabbit --prompt-only
- Timeout: 8 minutes
- Max iterations: 4 (initial run + one rerun after fixes)

Triage policy:
- Only consider findings with severity >= MEDIUM.
- Treat LOW / INFO / STYLE / NIT as automatically skipped and do not fix them.
- Do not escalate LOW issues into refactors just to satisfy the tool.

Fix policy (for severity >= MEDIUM only):
Fix if the issue affects:
- Correctness / logic
- Security
- Crashes / exceptions / undefined behavior
- Data loss or corruption
- Concurrency / race conditions
- CI, build, or test failures
- Clearly harmful performance problems in hot paths

Skip even if severity >= MEDIUM when:
- It is a purely stylistic or subjective refactor
- It is a “nice-to-have” readability improvement
- It would require large-scale redesign or >100 LOC change without a real bug
- It is a false positive or based on incorrect assumptions

Loop prevention:
- Apply minimal, targeted fixes.
- Do not introduce refactors that trigger new waves of suggestions.
- Do not chase new MEDIUM issues that are side-effects of cosmetic changes.

Process:
1) Run coderabbit --prompt-only and collect results.
2) Filter: keep only findings with severity >= MEDIUM.
3) For each, classify: correctness, impact, effort.
4) Fix all valid and relevant ones.
5) Rerun coderabbit once.
6) Stop if the remaining findings are:
   - only LOW/STYLE, or
   - repeats, or
   - false positives, or
   - out-of-scope by the rules above.

Finish:
- Provide a short summary of:
  - Fixed issues (severity, short description)
  - Skipped issues (severity, reason: false positive / stylistic / out of scope)
