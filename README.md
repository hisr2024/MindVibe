# MindVibe

MindVibe is a privacy-first, real-time social audio platform for short-form voice conversations, moderated rooms, and ephemeral public channels.

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
- scripts/                - Python package containing utility scripts:
  - generate_eddsa_key.py - Generate Ed25519 keypairs for JWT signing
  - seed_wisdom.py        - Seed database with wisdom verses
  - seed_content.py       - Seed database with content packs
  - verify_wisdom.py      - Verify wisdom guide implementation
- keyset_eddsa/           - local EdDSA key JSON files (private keys must remain local)
- security/               - JWT and EdDSA logic
- tests/                  - unit tests (pytest)
- docs/                   - documentation and technical notes
- .github/workflows/ci.yml - CI for tests on PRs

## Scripts Usage

The `scripts/` directory is now a Python package containing all utility scripts. Scripts can be run in two ways:

**Method 1: Direct execution**
```bash
python scripts/generate_eddsa_key.py
python scripts/seed_wisdom.py
python scripts/seed_content.py
python scripts/verify_wisdom.py
```

**Method 2: As a module**
```bash
python -m scripts.generate_eddsa_key
python -m scripts.seed_wisdom
python -m scripts.seed_content
python -m scripts.verify_wisdom
```

## AI Vibe Bot

MindVibe now includes the AI Vibe Bot that provides mental health guidance based on timeless teachings from the Bhagavad Gita.

To use the AI Vibe Bot:

1. Set up your OpenAI API key in .env
2. Seed the database with Gita verses: python scripts/seed_wisdom.py
3. Start the server: uvicorn main:app --reload
4. Access the AI Vibe Bot at POST /chat/message

For more details, see docs/wisdom_guide.md

Need help?
If you want, I can commit and push these files to the proofread-docs branch for you and open a PR. I will not commit any private key files.