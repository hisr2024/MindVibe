#!/usr/bin/env bash
# Script to mark PR #28 as ready for review
# Requires: gh CLI installed and authenticated

set -euo pipefail

PR_NUMBER="${1:-28}"
REPO="hisr2024/MindVibe"

echo "Marking PR #$PR_NUMBER as ready for review..."

if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "Error: GitHub CLI is not authenticated."
    echo "Please run: gh auth login"
    exit 1
fi

# Mark the PR as ready
gh pr ready "$PR_NUMBER" --repo "$REPO"

echo "✓ PR #$PR_NUMBER has been marked as ready for review!"
echo "View it at: https://github.com/$REPO/pull/$PR_NUMBER"
