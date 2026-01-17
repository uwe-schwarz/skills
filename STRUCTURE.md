# Repository Structure

```
skills/
├── .gitignore
├── README.md                 # Main repository documentation
├── package.json              # Package metadata
├── CONTRIBUTING.md           # Contribution guidelines
├── create-skill.sh           # Script to create new skills
│
├── template/                 # Template for creating new skills
│   ├── README.md
│   ├── SKILL.md
│   ├── metadata.json
│   ├── scripts/
│   ├── references/
│   └── rules/
│
└── skills/                   # Collection of skills
    ├── example-skill/
    │   ├── SKILL.md          # Main skill file with instructions
    │   ├── metadata.json     # Additional metadata
    │   ├── scripts/          # Helper scripts (optional)
    │   │   └── example.sh
    │   ├── references/       # Supporting docs (optional)
    │   └── rules/            # Sub-rules (optional)
    │
    ├── code-review/
    │   ├── SKILL.md
    │   └── rules/
    │
    ├── documentation/
    │   ├── SKILL.md
    │   └── scripts/
    │       └── generate.sh
    │
    └── github-pr-review-workflow/
        └── SKILL.md
```

## File Descriptions

### Root Files

- **README.md**: Main documentation for the repository
- **package.json**: NPM package metadata
- **CONTRIBUTING.md**: Guidelines for contributors
- **create-skill.sh**: Helper script to create new skills from template

### Template Directory

Contains a complete template for creating new skills. Copy this directory and customize.

### Skills Directory

Contains all individual skills. Each skill is self-contained with:
- **SKILL.md**: Required - Main skill file with YAML frontmatter and instructions
- **metadata.json**: Optional - Additional metadata about the skill
- **scripts/**: Optional - Helper scripts for automation
- **references/**: Optional - Supporting documentation
- **rules/**: Optional - Sub-rules for complex skills

## Creating a New Skill

### Using the Script

```bash
./create-skill.sh my-new-skill
```

### Manual Method

```bash
cp -r template skills/my-new-skill
cd skills/my-new-skill
# Edit SKILL.md and metadata.json
```

## Required SKILL.md Frontmatter

```yaml
---
name: skill-name
description: Clear description of what this skill does
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---
```

## Installation

Users can install your skills using:

```bash
bunx skills i username/skills-repo
```

or

```bash
npx add-skill username/skills-repo
```

This will copy all skills to the appropriate agent directories.
