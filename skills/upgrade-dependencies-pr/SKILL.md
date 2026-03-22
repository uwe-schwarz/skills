---
name: upgrade-dependencies-pr
description: Update a JavaScript or TypeScript project's dependencies to the latest published versions, remove exact pinned semver specs, evaluate release impact against the codebase and official release notes, apply required small upgrade fixes, open GitHub issues for larger or optional follow-up work, and finish by creating a branch, commit, push, and PR. Use when asked to upgrade dependencies, refresh packages, unpin dependency versions, or ship an end-to-end dependency maintenance PR.
license: MIT
metadata:
  author: uwe
  version: "1.0.0"
---

# Upgrade Dependencies PR

Use this skill to take a JS or TS repository from outdated dependencies to a reviewable dependency-upgrade PR in one pass.

## Preconditions

- Confirm the repository uses Git and GitHub, and that `gh` is authenticated before attempting issue or PR creation.
- Stop if the working tree contains unrelated user changes that would be risky to mix into the dependency branch.
- Detect the package manager from `packageManager`, lockfiles, and workspace config before changing anything.
- Read [references/package-manager-playbook.md](references/package-manager-playbook.md) after detection and use only the relevant section.

## Workflow

### 1. Inventory the project

- Find every tracked `package.json` that belongs to the repo and identify whether the repo is a single package or a workspace/monorepo.
- Record the current branch, package manager, lockfiles, workspace layout, and available validation scripts such as `typecheck`, `lint`, `test`, `test:unit`, and `build`.
- Flag framework- or runtime-critical packages first: frameworks, bundlers, test runners, linters, TypeScript, Node tooling, auth, database clients, SDKs, and deployment libraries.

### 2. Create the branch first

- Create a fresh branch before editing anything. Prefer `codex/deps-<project>-<yyyymmdd>` unless the repo already uses a different branch convention.
- Keep the branch scoped to dependency maintenance and directly related upgrade fallout.

### 3. Upgrade manifests and lockfiles

- Use the package-manager-specific commands from the reference file to move direct dependencies to their latest published versions.
- Update dependency entries in `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies` when the manifest owns those versions. Preserve `workspace:`, `file:`, `link:`, `portal:`, `catalog:`, git, URL, and alias specs unless there is a clear reason to change them.
- After the main upgrade step, run `node <skill-dir>/scripts/unpin-semver-ranges.mjs <repo-root>` to convert exact `x.y.z` specs into ranged versions. Re-run the package manager install or update step if the manifests changed.
- Do not leave exact pinned semver strings in package manifests unless the repo explicitly requires exact versions and the user asked to keep them.

### 4. Assess relevance before writing the summary

- Compare manifests and lockfiles before and after the upgrade to get the set of changed packages.
- For each changed package that has a major bump, is runtime-critical, or is used directly in code or config, inspect official changelogs, migration guides, or release notes. Use primary sources only.
- Search the codebase for actual package usage before deciding whether a release is relevant to this project.
- Classify relevance as one of:
  - required compatibility work to keep the repo green,
  - small project-specific cleanup worth doing in the same PR,
  - optional follow-up or new feature worth tracking separately.

### 5. Fix required fallout now

- Apply compatibility fixes that are necessary for installs, builds, tests, or runtime correctness.
- Also apply very small project-relevant cleanup directly when it is obvious and low risk.
- Keep fixes tightly coupled to the upgrade. Avoid unrelated refactors.

### 6. Create follow-up issues for larger or optional work

- Open a GitHub issue when an upgrade reveals a useful new feature worth adopting later, a migration that is too large for the dependency PR, or cleanup that would materially expand review scope.
- Use `gh issue create`.
- The issue body should name the package and version jump, explain why it matters to this repo, summarize the deferred work, and link the official source material plus the upgrading PR when available.
- Do not create issues for noise. File issues only when the package change is genuinely relevant to the project.

### 7. Verify aggressively

- Run the smallest complete validation set the repo supports. Prefer, in order when available: `typecheck`, `lint`, `test`, `test:unit`, `build`.
- If the repo has a documented CI entrypoint, use it.
- If an upgrade breaks validation, fix it if the remediation is required to keep the repository healthy. Do not ship a knowingly broken dependency PR.

### 8. Commit, push, and open the PR

- Stage only the dependency upgrade work and directly related fixes.
- Use a commit title like `chore(deps): upgrade dependencies to latest`.
- Push the branch and create a PR with `gh pr create`.
- Make the PR body include notable package upgrades, required code or config fixes, issues created for deferred relevant work, and the validation commands that were run.
- Respect existing issue or PR templates when present.

## Decision Rules

- Prefer primary documentation over blog posts or secondary summaries for release impact.
- Required compatibility work belongs in the PR. Optional adoption work belongs in an issue.
- If the repo is not JavaScript or TypeScript, or does not use a supported package manager, stop and say so rather than forcing the workflow.
- If GitHub auth, push access, or PR creation is unavailable, finish the local upgrade work and report the blocker clearly.

## Scripts

### `scripts/unpin-semver-ranges.mjs`

Normalize exact semver strings in `package.json` files to caret ranges while preserving workspace, file, git, URL, alias, and already-ranged specs.

Usage:
```bash
node /absolute/path/to/upgrade-dependencies-pr/scripts/unpin-semver-ranges.mjs /path/to/repo
```

## References

- Use [references/package-manager-playbook.md](references/package-manager-playbook.md) for package-manager-specific upgrade commands.
- Use official package changelogs or migration guides for impact assessment.
