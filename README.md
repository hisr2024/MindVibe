# MindVibe

MindVibe is a privacy-first, real-time social audio platform for short-form voice conversations, moderated rooms, and ephemeral public channels.

## Features

### 🧘 AI Chatbot for Mental Health
An AI-powered chatbot that provides mental health guidance based on Bhagavad Gita wisdom:
- Multi-language support (English, Hindi, Sanskrit)
- Semantic search for relevant verses
- Practical guidance for modern challenges
- Respects cultural sensitivity and universal principles

See [docs/CHATBOT.md](docs/CHATBOT.md) for detailed documentation.

### Quick Setup for Chatbot

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed the database with Bhagavad Gita verses
python seed_gita.py

# 4. Start the server
uvicorn main:app --reload

# 5. Test the chatbot
python example_chatbot_usage.py
```

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
- .github/workflows/ci.yml - CI for tests on PRs

Need help?
If you want, I can commit and push these files to the proofread-docs branch for you and open a PR. I will not commit any private key files.