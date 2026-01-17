#!/usr/bin/env bash

# create-skill.sh - Helper script to create a new skill from the template
# Usage: ./create-skill.sh <skill-name>

set -e

if [ -z "$1" ]; then
	echo "Usage: $0 <skill-name>"
	echo "Example: $0 my-awesome-skill"
	exit 1
fi

SKILL_NAME=$1
SKILL_DIR="skills/${SKILL_NAME}"

# Check if skill already exists
if [ -d "${SKILL_DIR}" ]; then
	echo "Error: Skill '${SKILL_NAME}' already exists at ${SKILL_DIR}"
	exit 1
fi

# Create skill directory from template
echo "Creating skill: ${SKILL_NAME}"
cp -r template "${SKILL_DIR}"

# Update SKILL.md with skill name
sed -i '' "s/your-skill-name/${SKILL_NAME}/g" "${SKILL_DIR}/SKILL.md"
sed -i '' "s/# Skill Name/# $(echo ${SKILL_NAME} | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')/g" "${SKILL_DIR}/SKILL.md"

echo "✓ Skill created at ${SKILL_DIR}"
echo ""
echo "Next steps:"
echo "  1. Edit ${SKILL_DIR}/SKILL.md to add your skill content"
echo "  2. Update ${SKILL_DIR}/metadata.json with skill information"
echo "  3. Add any scripts to ${SKILL_DIR}/scripts/"
echo "  4. Add any references to ${SKILL_DIR}/references/"
echo "  5. Test your skill locally"
