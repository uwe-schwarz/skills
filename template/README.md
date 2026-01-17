# Skills Template

This directory contains a template for creating new skills.

## How to Use

1. Copy the `template` directory to `skills/your-skill-name`
2. Rename the `SKILL.md` file and update its content
3. Update `metadata.json` with your skill's information
4. Add your scripts to `scripts/` (optional)
5. Add references to `references/` (optional)
6. Add sub-rules to `rules/` (optional)

## Required Files

- `SKILL.md` - Main skill file with instructions and frontmatter

## Optional Files/Directories

- `metadata.json` - Additional metadata about the skill
- `scripts/` - Helper scripts for automation
- `references/` - Supporting documentation
- `rules/` - Sub-rules and guidelines

## SKILL.md Format

The SKILL.md file must include YAML frontmatter:

```yaml
---
name: your-skill-name
description: A clear description of what this skill does
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---
```

## Publishing

Once your skill is ready:

1. Commit and push to GitHub
2. Users can install with: `bunx skills i username/repo`
3. Or: `npx add-skill username/repo`
