#!/usr/bin/env bash
set -euo pipefail

# Install Aider (best-effort)
python -m pip install --upgrade pip || true
pip install --upgrade git+https://github.com/get-aider/aider.git || true

# Ensure reports dir exists
mkdir -p reports

# Run Aider suggestion using the 'code-review' prompt from .aider/config.yml
if command -v aider >/dev/null 2>&1; then
  echo "Running aider suggestion..."
  aider suggestion --prompt code-review > reports/aider-suggestions.txt || true
  echo "Wrote reports/aider-suggestions.txt"
else
  echo "aider CLI not found after install; please install manually."
  exit 0
fi
