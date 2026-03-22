# Package Manager Playbook

Use only the section that matches the detected package manager.

## Detect the package manager

- Prefer the root `packageManager` field when present.
- Fall back to lockfiles:
  - `pnpm-lock.yaml` -> pnpm
  - `bun.lock` or `bun.lockb` -> Bun
  - `yarn.lock` -> Yarn
  - `package-lock.json` or `npm-shrinkwrap.json` -> npm
- If detection is ambiguous, inspect workspace config and existing scripts before changing anything.

## npm

- Use npm when the repo is clearly npm-managed.
- `npm update` alone is not enough for "latest across majors" because it respects existing ranges.
- Preferred workflow:

```bash
npx npm-check-updates -u --target latest
npm install
```

- For npm workspaces, run from the workspace root first. If nested manifests are not governed by npm workspaces, iterate the remaining package directories explicitly.

## pnpm

- For single-package repos:

```bash
pnpm up --latest
pnpm install
```

- For workspace repos:

```bash
pnpm up -r --latest
pnpm install
```

## Yarn Berry or Yarn 4+

- Upgrade manifest ranges across the project:

```bash
yarn up '*'
```

- If the lockfile needs a full resolution refresh for the changed packages, also run:

```bash
yarn up -R '*'
```

- Then install if needed:

```bash
yarn install
```

- `yarn up` does not update `peerDependencies`; handle exact or stale peer ranges manually.

## Yarn Classic

```bash
yarn upgrade --latest
yarn install
```

## Bun

- For a single-package repo:

```bash
bun update --latest
```

- For workspace repos, start at the root. If Bun does not update nested workspace manifests non-interactively, enumerate the workspace directories and run the same command inside each affected package directory.

```bash
bun update --latest
```

- Re-run install if lockfile regeneration or lifecycle execution is needed:

```bash
bun install
```

## Sources

- pnpm: https://pnpm.io/cli/update
- Yarn: https://yarnpkg.com/cli/up
- npm: https://docs.npmjs.com/cli/v8/commands/npm-update/
- Bun: https://bun.sh/docs/pm/cli/update
