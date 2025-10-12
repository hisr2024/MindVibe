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
- scripts/                - helper scripts (key generation, setup)
- keyset_eddsa/           - local EdDSA key JSON files (private keys must remain local)
- security/               - JWT and EdDSA logic
- tests/                  - unit tests (pytest)
- docs/                   - documentation and technical notes
- .github/workflows/ci.yml - CI for tests on PRs

## Universal Wisdom Guide (AI Chatbot)

MindVibe includes a comprehensive AI-powered wisdom guide that provides mental health guidance based on **all 701 verses** from the Bhagavad Gita, presented in a secular, universally applicable format.

### Features
- **Complete Dataset**: All 700+ verses from 18 chapters
- **Multilingual**: Sanskrit, English, and Hindi translations
- **Mental Health Focus**: 56 applications mapped across 18 themes
- **Sanitized Content**: Religious references removed from English for universal applicability
- **Authentic Sources**: Translations from renowned scholars (Swami Sivananda, Swami Gambirananda, etc.)

### Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up your OpenAI API key in .env (optional - for AI-powered responses):
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. Seed the database with all 701 verses:
   ```bash
   python seed_wisdom.py
   ```
   
   Expected output:
   ```
   Loaded 701 verses from data/wisdom/verses.json
   Inserted batch: 100/701 verses
   ...
   Seeding completed!
   ```

4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

5. Use the API endpoints:
   - `POST /api/wisdom/query` - Get guidance for a mental health question
   - `GET /api/wisdom/themes` - List all available themes
   - `GET /api/wisdom/verses/{verse_id}` - Get specific verse

### Documentation
- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)
- **Wisdom Guide**: See [docs/wisdom_guide.md](docs/wisdom_guide.md)
- **Dataset Summary**: See [BHAGAVAD_GITA_DATASET_SUMMARY.md](BHAGAVAD_GITA_DATASET_SUMMARY.md)

Need help?
If you want, I can commit and push these files to the proofread-docs branch for you and open a PR. I will not commit any private key files.