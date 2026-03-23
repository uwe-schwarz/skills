---
name: cost-estimate
description: Estimate the replacement cost, engineering effort, calendar time, and market-rate value of a software project by analyzing a repository's size, architecture, complexity, and delivery maturity. Use when asked for a build-cost estimate, rebuild quote, delivery timeline, stakeholder-facing budget range, pricing sanity check, or ROI/value analysis for work produced by Claude, Codex, OpenCode, Crush, or another AI coding agent.
license: MIT
metadata:
  author: uwe
  version: "1.0.0"
---

# Cost Estimate

Estimate what it would cost a competent team to build, replace, or meaningfully advance the current codebase. Produce a professional report grounded in measured repository facts, explicit assumptions, and current market rates.

## Core Rules

### Stay Generic

- Analyze the actual repository instead of assuming a specific stack, language, or company shape.
- Use the file-reading, search, counting, git, and web-research tools available in the current agent environment. Do not depend on tool names from a single platform.
- Support repositories built mainly by humans, mainly by AI agents, or a mix of both.

### Separate Facts From Inference

- Distinguish measured facts from judgment calls.
- Exclude obvious vendor code, generated artifacts, caches, lockfiles, build outputs, and bundled dependencies from primary LOC counts unless the user explicitly wants them included.
- Report uncertainty with ranges and a confidence level instead of pretending the estimate is precise.

## Workflow

### 1. Scope the Estimate

- Determine whether the user wants the full repository, the shipped product surface, an MVP subset, or a specific subsystem.
- Identify the current maturity level: prototype, internal tool, beta, production system, or partially complete implementation.
- Note what appears finished, what appears missing, and what would still need to be built for the requested target state.

### 2. Inventory the Codebase

- Count non-generated lines of code by major language or layer.
- Review architecture, module boundaries, dependencies, integrations, deployment surface, testing, and documentation.
- Flag complexity drivers such as:
  - native/mobile development,
  - security-sensitive or regulated workflows,
  - real-time systems,
  - graphics, rendering, audio, or video pipelines,
  - distributed systems or infrastructure automation,
  - data engineering or ML/AI integrations,
  - third-party APIs with operational risk,
  - migrations, legacy constraints, or platform-specific interop.
- Summarize test depth and delivery confidence:
  - automated tests,
  - CI or release automation,
  - observability and operational tooling,
  - docs and onboarding quality.

### 3. Convert the Repo to Engineering Hours

- Start with low, base, and high estimates instead of a single point estimate.
- Use broad productivity buckets that work across languages:
  - straightforward UI, CRUD, or glue code: 30-60 lines/hour,
  - standard product and business logic: 20-40 lines/hour,
  - infrastructure, data, platform, security, or performance-critical work: 10-25 lines/hour,
  - specialized systems work such as native interop, rendering, low-level networking, device integration, or real-time media: 8-20 lines/hour,
  - comprehensive automated tests: 25-50 lines/hour.
- Adjust for non-coding work:
  - architecture and design: +10-20%,
  - debugging and troubleshooting: +15-30%,
  - review and refactoring: +10-15%,
  - documentation and handoff: +5-15%,
  - integration, QA, and release hardening: +15-30%,
  - learning curve for unfamiliar or niche technology: +5-20%.
- If the repo is obviously incomplete, estimate both:
  - replacement value of what exists today,
  - total effort to reach the likely intended scope.

### 4. Convert Raw Engineering Hours to Calendar Time

- Explain that raw development hours do not equal calendar time.
- Model at least these execution environments:
  - solo or founder-led,
  - lean startup,
  - growth-stage company,
  - enterprise team.
- Use realistic focused-coding efficiency factors such as:
  - 60-70% for lean environments,
  - 50-60% for growth-stage teams,
  - 40-50% for enterprise teams,
  - 30-40% for highly process-heavy organizations.
- Show calendar impact in weeks or months using:

```text
Calendar Time = Raw Engineering Hours / Effective Engineering Hours Per Week
```

### 5. Research Current Market Rates

- Use current web research when available. Prefer recent sources and include concrete dates.
- Look up rates relevant to the project's stack and the estimate's audience, such as:
  - senior full-stack or platform engineers,
  - specialized domain engineers relevant to the repo,
  - US remote, SF Bay Area, NYC, Austin, or other requested markets,
  - contractor, consultancy, and employee-equivalent comparisons when useful.
- Use primary or reputable market sources and cite them in the report.
- If live research is unavailable, say so and clearly label rate assumptions as lower confidence.

Suggested search patterns:

```text
"senior software engineer hourly rate <year>"
"freelance <stack> developer rate <year>"
"software development consulting rates <year>"
"<specialty> contractor rate United States <year>"
```

### 6. Calculate Full Team Cost

- Do not present engineering-only cost as total product cost unless that is explicitly what the user asked for.
- Model supporting roles as ratios to engineering effort when appropriate:
  - product: 0.20-0.40x,
  - design: 0.15-0.35x,
  - engineering management: 0.10-0.20x,
  - QA: 0.15-0.30x,
  - project or program management: 0.05-0.15x,
  - technical writing or enablement: 0.03-0.10x,
  - DevOps or platform: 0.08-0.20x.
- Provide a team multiplier for at least:
  - solo: 1.0x,
  - lean startup: about 1.3-1.6x,
  - growth company: about 1.8-2.3x,
  - enterprise: about 2.2-2.8x.

### 7. Add Optional AI-Agent ROI Analysis

- Include this section only when the user asks for it or when the repository appears to have been produced substantially by an AI coding agent.
- Use the agent label that best fits the evidence or request:
  - Claude,
  - Codex,
  - OpenCode,
  - Crush,
  - AI coding agent when the brand is unclear.
- Estimate active agent time using one or more of:
  - git commit clustering,
  - file modification clustering,
  - issue or PR history,
  - fallback LOC-based heuristics when timestamp evidence is weak.
- Keep the assumptions explicit. Do not imply precise time tracking when only heuristics are available.

Useful heuristics:

```text
Session clustering window: 3-4 hours
1-2 commits in a session: ~1 hour
3-5 commits: ~2 hours
6-10 commits: ~3 hours
10+ commits: ~4 hours
Fallback AI-agent active hours: meaningful LOC / 250-500
```

- Calculate:

```text
Value per Agent Hour = Estimated Human/Team Value / Estimated Agent Active Hours
Speed Multiplier = Estimated Human Hours / Estimated Agent Active Hours
```

### 8. Write the Report

- Write for stakeholders, not just engineers.
- Include:
  - analysis date,
  - scope and maturity,
  - codebase metrics by language or subsystem,
  - major complexity drivers,
  - engineering hours with low/base/high ranges,
  - calendar-time scenarios,
  - market-rate research,
  - engineering-only cost,
  - fully loaded team cost,
  - assumptions, exclusions, and confidence,
  - optional AI-agent ROI.
- Make the headline numbers easy to scan.
- Include a short narrative explaining what most drives cost.

## Example Usage

```bash
"Use $cost-estimate to estimate what it would cost a US-based team to rebuild this repo to production quality."
```

```bash
"Use $cost-estimate to produce a stakeholder-facing budget range and calendar estimate for this MVP, including a lean-startup and enterprise scenario."
```

```bash
"Use $cost-estimate to estimate the value created by Codex in this repository and compute ROI per agent hour."
```

## Best Practices

- Prefer ranges over false precision.
- Keep engineering cost and full-team cost separate.
- Call out whether the estimate reflects current code only or the likely complete product scope.
- Cite current rate research with dates.
- Reconcile LOC with architecture and operational complexity instead of using LOC alone.

## Common Pitfalls

- Treating generated code or vendored dependencies as core product effort.
- Quoting hourly rates without geography, specialty, or year context.
- Ignoring non-coding time such as design, debugging, integration, and release hardening.
- Presenting AI-agent ROI as exact when it is based on heuristics.
