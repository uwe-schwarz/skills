---
name: github-pr-review-workflow
description: Complete workflow for handling GitHub PR reviews using gh pr-review extension
---

# GitHub PR Review Workflow

Complete workflow for reviewing, addressing feedback, and resolving threads in GitHub pull requests using the `gh-pr-review` extension from agynio/gh-pr-review.

**For gh-pr-review documentation, see:** https://github.com/agynio/gh-pr-review

---

## Installation

**Install gh-pr-review extension (if not already installed):**

```bash
gh extension install agynio/gh-pr-review
```

**Verify installation:**

```bash
gh pr-review --help
```

---

## Workflow Overview

```
PR Review Request
  ├─ Get PR number/repo context
  ├─ List all review threads
  ├─ Analyze feedback and comments
  ├─ Implement fixes in code
  ├─ Run tests (unit + lint + typecheck)
  ├─ Reply to review threads with explanations
  ├─ Resolve review threads
  └─ Commit and push changes
```

---

## Step-by-Step Process

### 1. Get PR Context

**Get current PR details:**

```bash
# Get PR number
gh pr view --json number

# Get PR title and status
gh pr view --json title,author,state,reviews

# Get repository info (for gh pr-review)
git remote get-url origin
```

**Output:** PR number (e.g., `174`) and repo (e.g., `degitag/schlaufabrik-de`)

---

### 2. List Review Threads

**List all review threads (active and outdated):**

```bash
# From PR root directory
gh pr-review threads list --pr <PR_NUMBER> --repo <OWNER/REPO>

# Example:
gh pr-review threads list --pr 174 --repo degitag/schlaufabrik-de
```

**Response format:**

```json
[
  {
    "threadId": "PRRT_kwDOQkQlKs5p24lu",
    "isResolved": false,
    "updatedAt": "2026-01-17T22:48:36Z",
    "path": "lib/emails/from-address.ts",
    "line": 11,
    "isOutdated": false
  }
]
```

**Key fields:**

- `threadId`: GraphQL node ID for resolving/replying
- `isResolved`: Current status
- `isOutdated`: Whether code has changed since comment
- `path` + `line`: File location

---

### 3. Read and Analyze Feedback

**Get review comments via GitHub API:**

```bash
# Get all review comments for PR
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/comments

# With jq for cleaner output
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/comments \
  --jq '.[] | {id,body,author,created_at,line,path}'
```

**Read the specific files mentioned:**

```bash
# Read the file context to understand feedback
cat <path>
# or use Read tool
```

**Categorize feedback:**

- **High priority**: Security issues, bugs, breaking changes
- **Medium priority**: Code quality, maintainability, test coverage
- **Low priority**: Style, documentation, nice-to-haves

---

### 4. Implement Fixes

**Edit the files mentioned in review:**

```bash
# Use Edit tool or bash
edit <file_path> <oldString> <newString>
```

**Follow repository conventions:**

- Check existing patterns in similar files
- Follow AGENTS.md guidelines
- Maintain code style consistency
- Add/update tests for new logic

---

### 5. Verify Changes (CRITICAL)

**Always run tests before replying:**

```bash
# Run project tests
bun run test

# Or specific test suites
bun run test:unit
bun run test:unit:watch
bun run test:e2e
```

**Run type checking:**

```bash
bun run typecheck
# or
tsc --noEmit
```

**Run linting:**

```bash
bun run lint
# or
eslint
```

**Verify all pass:**

- ✓ No TypeScript errors
- ✓ No ESLint warnings/errors
- ✓ All unit tests pass
- ✓ E2E tests pass (if relevant)

---

### 6. Reply to Review Threads

**Reply with explanation of fixes:**

```bash
gh pr-review comments reply \
  --pr <PR_NUMBER> \
  --repo <OWNER/REPO> \
  --thread-id <THREAD_ID> \
  --body "<your explanation>"
```

**Best practices for replies:**

- Acknowledge the feedback
- Explain what was changed
- Reference specific commit(s) if relevant
- Be concise but clear
- Use code fences for code snippets

**Example reply:**

```bash
gh pr-review comments reply \
  --pr 174 \
  --repo degitag/schlaufabrik-de \
  --thread-id PRRT_kwDOQkQlKs5p24lu \
  --body "$(cat <<'EOF'
@gemini-code-assist Thanks for the feedback! I've addressed your suggestions:

1. Extracted RESEND_FROM_NAME constant to lib/emails/from-address.ts
2. Replaced duplicated logic in both lib/auth.ts and app/actions/contact.ts
3. Improved sanitization to strip RFC 5322 unsafe chars
4. Added test coverage for new patterns

Changes committed in abc1234, all tests pass.
EOF
)"
```

**Note:** Use heredoc for multi-line bodies to avoid shell escaping issues.

---

### 7. Resolve Review Threads

**After implementing fixes and replying, resolve the thread:**

```bash
gh pr-review threads resolve \
  --pr <PR_NUMBER> \
  --repo <OWNER/REPO> \
  --thread-id <THREAD_ID>
```

**Response:**

```json
{
  "thread_node_id": "PRRT_kwDOQkQlKs5p24lu",
  "is_resolved": true
}
```

**Batch resolve multiple threads:**

```bash
# Resolve outdated threads first
gh pr-review threads resolve --pr 174 --repo degitag/schlaufabrik-de --thread-id PRRT_kwDOQkQlKs5p23X5
gh pr-review threads resolve --pr 174 --repo degitag/schlaufabrik-de --thread-id PRRT_kwDOQkQlKs5p23X7

# Then resolve active threads after replying
gh pr-review threads resolve --pr 174 --repo degitag/schlaufabrik-de --thread-id PRRT_kwDOQkQlKs5p24lu
```

**Strategy:**

1. Resolve outdated threads (isOutdated: true) - no reply needed
2. Reply to active threads explaining fixes
3. Resolve active threads after reply

---

### 8. Commit and Push Changes

**Stage and commit changes:**

```bash
# Check status
git status

# Stage modified files
git add <files>

# Commit with clear message
git commit -m "<type>(<scope>): <description>

# Example:
git commit -m "refactor(emails): centralize from name logic and improve sanitization

- Extract RESEND_FROM_NAME constant to lib/emails/from-address.ts
- Replace duplicated logic in lib/auth.ts and app/actions/contact.ts
- Improve formatFromAddress sanitization (RFC 5322 chars)
- Add test cases for additional sanitization patterns"
```

**Push to remote:**

```bash
git push
```

**Verify working tree:**

```bash
git status
# Should show: "nothing to commit, working tree clean"
```

---

### 9. Verify All Threads Resolved

**Final check:**

```bash
gh pr-review threads list --pr <PR_NUMBER> --repo <OWNER/REPO>
```

**Expected output:** All threads show `isResolved: true`

---

## Complete Example Workflow

```bash
# 1. Get PR context
gh pr view --json number
git remote get-url origin

# 2. List review threads
gh pr-review threads list --pr 174 --repo degitag/schlaufabrik-de

# 3. Read comments and files
gh api repos/degitag/schlaufabrik-de/pulls/174/comments --jq '.[] | {id,body,path,line}'
cat lib/emails/from-address.ts

# 4. Implement fixes
edit lib/emails/from-address.ts <oldString> <newString>

# 5. Run tests
bun run test:unit -- tests/lib/emails-from-address.test.ts
bun run typecheck
bun run lint

# 6. Reply to threads
gh pr-review comments reply --pr 174 --repo degitag/schlaufabrik-de \
  --thread-id PRRT_kwDOQkQlKs5p24lu --body "$(cat <<'EOF'
Thanks for review! I've addressed all feedback:
1. Centralized logic
2. Improved sanitization
3. Added tests

Changes in abc1234.
EOF
)"

# 7. Resolve threads
gh pr-review threads resolve --pr 174 --repo degitag/schlaufabrik-de \
  --thread-id PRRT_kwDOQkQlKs5p24lu

# 8. Commit and push
git add lib/emails/from-address.ts
git commit -m "fix: address PR review feedback"
git push

# 9. Verify
gh pr-review threads list --pr 174 --repo degitag/schlaufabrik-de
git status
```

---

## gh-pr-review Commands Reference

| Command                          | Purpose                   |
| -------------------------------- | ------------------------- |
| `gh pr-review threads list`      | List all review threads   |
| `gh pr-review threads resolve`   | Resolve a specific thread |
| `gh pr-review threads unresolve` | Reopen a resolved thread  |
| `gh pr-review comments reply`    | Reply to a review thread  |
| `gh pr-review review`            | Manage pending reviews    |

**Common flags:**

- `--pr <number>`: Pull request number
- `-R, --repo <owner/repo>`: Repository identifier
- `--thread-id <id>`: GraphQL thread node ID

---

## Troubleshooting

| Issue                                                    | Solution                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| `command not found: gh-pr-review`                        | Install extension: `gh extension install agynio/gh-pr-review` |
| `must specify a pull request via --pr`                   | Run from PR directory or add `--pr <number>`                  |
| `--repo must be owner/repo when using numeric selectors` | Add `-R <owner/repo>` or run from authenticated repo          |
| Shell escaping issues with `--body`                      | Use heredoc: `--body "$(cat <<'EOF'\n...\nEOF)"`              |
| Thread not found                                         | Check threadId is exact GraphQL ID, not PR number             |

---

## Best Practices

**Before replying:**

- ✓ Read all review comments carefully
- ✓ Understand the intent (suggestion vs. blocker)
- ✓ Check if similar issues exist elsewhere

**When implementing fixes:**

- ✓ Follow existing code patterns
- ✓ Update/add tests for changes
- ✓ Run full test suite
- ✓ Check lint and type errors

**When replying:**

- ✓ Be polite and appreciative
- ✓ Explain what was changed
- ✓ Reference specific files/lines
- ✓ Keep it concise

**Before resolving:**

- ✓ Ensure all issues are addressed
- ✓ Verify tests pass
- ✓ Commit changes to branch

---

## Resources

- [gh-pr-review GitHub](https://github.com/agynio/gh-pr-review)
- [GitHub GraphQL API: Pull Requests](https://docs.github.com/en/graphql/guides/using-the-graphql-api-for-pull-requests)
- [gh CLI Documentation](https://cli.github.com/manual/)
