# Agent Skills

A collection of custom skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### example-skill

An example skill demonstrating the Agent Skills format. Use this as a template for creating your own skills.

**Use when:**
- Creating new skills
- Understanding the skill format
- Learning best practices for skill development

### code-review

Comprehensive code review guidelines for ensuring code quality, security, and maintainability.

**Use when:**
- Reviewing pull requests
- Refactoring existing code
- Conducting code audits
- Ensuring code quality standards

**Categories covered:**
- Code Quality (style, error handling, naming)
- Security (injection, validation, auth)
- Performance (bottlenecks, efficiency)
- Testing (coverage, quality)
- Documentation (comments, README, API docs)

### documentation

Automated documentation generation and management guidelines.

**Use when:**
- Creating new documentation
- Updating existing docs
- Documenting APIs
- Adding inline comments
- Maintaining README files

**Documentation types:**
- README files
- API documentation
- Code comments
- Inline documentation (JSDoc/Docstring)

### github-pr-review-workflow

Complete workflow for handling GitHub PR reviews using the gh-pr-review extension.

**Use when:**
- Reviewing pull requests and addressing feedback
- Resolving review threads with explanations
- Managing PR review process systematically
- Using GitHub CLI gh-pr-review extension

**Workflow covers:**
- Listing and analyzing review threads
- Implementing fixes based on feedback
- Running tests (unit, lint, typecheck)
- Replying to review threads with explanations
- Resolving threads and committing changes

## Installation

```bash
bunx skills i <username>/skills
```

or

```bash
npx add-skill <username>/skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

## Skill Structure

Each skill contains:
- `SKILL.md` - Instructions for the agent (with YAML frontmatter)
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)
- `metadata.json` - Additional metadata (optional)
- `rules/` - Sub-rules and guidelines (optional)

## License

MIT
