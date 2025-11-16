#!/bin/bash
set -e

echo "🔒 Running Security Checks..."

echo "📦 Checking Python dependencies..."
pip install safety
safety check --file requirements.txt

echo "🔍 Running Bandit security scan..."
pip install bandit[toml]
bandit -r backend/ -ll

echo "📝 Checking for secrets..."
pip install detect-secrets
detect-secrets scan --baseline .secrets.baseline

echo "🐳 Checking Docker security..."
docker run --rm -v $(pwd):/project aquasec/trivy fs /project

echo "✅ Security checks complete!"
