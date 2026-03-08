#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install root dependencies
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  echo "Installing root dependencies..."
  cd "$CLAUDE_PROJECT_DIR"
  npm install
fi

# Install app dependencies (includes Storybook, Vitest, ESLint)
if [ -f "$CLAUDE_PROJECT_DIR/app/package.json" ]; then
  echo "Installing app dependencies..."
  cd "$CLAUDE_PROJECT_DIR/app"
  npm install
  echo "Installing Playwright browsers (best effort)..."
  npx playwright install chromium || echo "Playwright browser install skipped (restricted environment)"
fi
