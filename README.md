# MindVibe

[![CI](https://github.com/hisr2024/MindVibe/actions/workflows/ci.yml/badge.svg)](https://github.com/hisr2024/MindVibe/actions/workflows/ci.yml)
[![Linting](https://github.com/hisr2024/MindVibe/actions/workflows/lint.yml/badge.svg)](https://github.com/hisr2024/MindVibe/actions/workflows/lint.yml)

MindVibe is a privacy-first, real-time social audio platform for short-form voice conversations, moderated rooms, and ephemeral public channels.

## CI/CD Pipeline

This repository uses automated CI/CD workflows to ensure code quality and reliability:

### Workflows
- **CI Workflow** (`.github/workflows/ci.yml`): Runs automated tests on push and pull requests
  - Python: Type checking with mypy, unit and integration tests with pytest, coverage reporting
  - TypeScript: ESLint linting for code quality
  
- **Linting Workflow** (`.github/workflows/lint.yml`): Enforces code style standards
  - Python: flake8 linting (max line length: 120)
  - TypeScript: ESLint with Next.js configuration

### Test Coverage
- Test results and coverage reports are automatically uploaded as artifacts
- Coverage reports are posted as comments on pull requests
- View detailed coverage reports in the workflow run artifacts

### Status Checks
All workflows must pass before merging pull requests to the main branch.

Quickstart (local)
1. Clone the repo:
   git clone https://github.com/hisr2024/MindVibe.git
   cd MindVibe

2. Checkout the dev branch:
   git checkout -b dev

3. Create and activate a Python virtual environment:
   python -m venv .venv
   .venv\Scripts\Activate.ps1    # Windows PowerShell
   source .venv/bin/activate     # macOS / Linux

4. Install dev dependencies:
   python -m pip install -r requirements-dev.txt

5. Generate a dev Ed25519 key (keeps private key local):
   python scripts/generate_eddsa_key.py --dir keyset_eddsa

6. Create a public-only key JSON (commit only the `*-pub.json` file). See docs/KEYS.md.

7. Run the focused JWT tests:
   $env:EDDSA_KEYSET_DIR = (Resolve-Path ./keyset_eddsa).Path
   $env:EDDSA_ENABLED = "true"
   $env:EDDSA_DUAL_SIGN = "true"
   $env:JWT_SECRET = "dev-jwt-secret-please-change"
   python -m pytest -q tests/test_jwt_dualsign_issue_verify.py tests/test_jwt_failure_paths.py tests/test_jwks.py

Repository layout (high-level)
- scripts/                - helper scripts (key generation, setup)
- keyset_eddsa/           - local EdDSA key JSON files (private keys must remain local)
- security/               - JWT and EdDSA logic
- tests/                  - unit tests (pytest)
- docs/                   - documentation and technical notes
- .github/workflows/      - CI/CD workflows (ci.yml for tests, lint.yml for linting)

## AI Vibe Bot

MindVibe now includes the AI Vibe Bot that provides mental health guidance based on timeless teachings from the Bhagavad Gita.

To use the AI Vibe Bot:

1. Set up your OpenAI API key in .env
2. Seed the database with Gita verses: python seed_gita.py
3. Start the server: uvicorn main:app --reload
4. Access the AI Vibe Bot at POST /chat/message

For more details, see docs/wisdom_guide.md

Need help?
If you want, I can commit and push these files to the proofread-docs branch for you and open a PR. I will not commit any private key files.