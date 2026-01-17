# Contributing

Thank you for your interest in contributing to this skills repository!

## Adding a New Skill

1. **Use the Template**
   ```bash
   cp -r template skills/your-skill-name
   ```

2. **Edit SKILL.md**
   - Update the `name` in frontmatter
   - Write a comprehensive `description`
   - Add your guidelines and instructions
   - Include examples and use cases

3. **Update metadata.json**
   - Set the version
   - Add organization info
   - Include relevant references

4. **Add Scripts (Optional)**
   - Place scripts in `scripts/`
   - Make them executable: `chmod +x scripts/your-script.sh`
   - Document them in SKILL.md

5. **Add References (Optional)**
   - Place supporting docs in `references/`
   - Link to them from SKILL.md

6. **Add Sub-rules (Optional)**
   - For complex skills, break down into smaller rules
   - Place in `rules/` directory
   - Reference from main SKILL.md

## Skill Guidelines

### Quality Standards

- **Clear Purpose**: Each skill should have a single, well-defined purpose
- **Comprehensive**: Cover all relevant scenarios and edge cases
- **Examples**: Include concrete examples and code snippets
- **Actionable**: Provide specific, actionable guidelines
- **Tested**: Verify that agents can use the skill effectively

### Frontmatter Requirements

Every SKILL.md must include:
- `name`: Unique identifier (lowercase, hyphens)
- `description`: Clear, comprehensive description

Optional:
- `license`: License type
- `metadata`: Author, version, etc.

### Content Structure

1. **Introduction**: What the skill does
2. **When to Apply**: Triggers and use cases
3. **Guidelines**: Core rules and instructions
4. **Examples**: Concrete examples
5. **Best Practices**: Recommended approaches
6. **Common Pitfalls**: What to avoid

## Testing Your Skill

1. **Test Locally**
   - Install skill: `npx add-skill file://$(pwd)`
   - Test with various prompts
   - Verify agent uses skill correctly

2. **Get Feedback**
   - Share with team members
   - Test with different agents
   - Iterate based on feedback

## Submission Process

1. Fork the repository
2. Create a feature branch
3. Add your skill
4. Update README.md with your skill
5. Submit a pull request

## Code of Conduct

Be respectful, constructive, and welcoming to all contributors.

## Questions?

Open an issue with your question or reach out to the maintainers.
