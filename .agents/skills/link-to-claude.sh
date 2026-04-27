#!/bin/bash
# link-to-claude.sh — Create symlink in .claude/skills/ for a new .agents skill
# Usage: ./link-to-claude.sh <skill-name>
set -e
SKILL_NAME="${1:?Usage: $0 <skill-name>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="${SCRIPT_DIR}/../../.claude/skills"
mkdir -p "$CLAUDE_DIR"
if [ -e "$CLAUDE_DIR/$SKILL_NAME" ]; then
  echo "Already exists: $CLAUDE_DIR/$SKILL_NAME"
  exit 0
fi
ln -s "../../.agents/skills/$SKILL_NAME" "$CLAUDE_DIR/$SKILL_NAME"
echo "Linked: .claude/skills/$SKILL_NAME"
if [ ! -e "$CLAUDE_DIR/RESOLVER.md" ]; then
  ln -s "../../.agents/skills/RESOLVER.md" "$CLAUDE_DIR/RESOLVER.md"
fi
