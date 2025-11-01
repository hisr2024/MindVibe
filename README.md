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

## Running Tests

MindVibe uses pytest for automated testing. The test suite includes unit tests and integration tests for all core functionality.

### Run all tests:
```bash
python -m pytest tests/
```

### Run tests with coverage report:
```bash
python -m pytest tests/ --cov=. --cov-report=html
```

### Run specific test categories:
```bash
# Unit tests only
python -m pytest tests/unit/

# Integration tests only
python -m pytest tests/integration/

# Specific test file
python -m pytest tests/unit/test_wisdom_kb.py
```

### Run tests in verbose mode:
```bash
python -m pytest tests/ -v
```

For more detailed testing information, see QUICKSTART.md.

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


## Context Transformation Pipeline

MindVibe includes a modern **Context Transformation Pipeline** for processing Bhagavad Gita verses into structured, searchable content for universal mental health applications. The pipeline:

- **Validates** verse data for completeness and correctness
- **Sanitizes** religious references for universal appeal (e.g., "Krishna" → "the teacher")
- **Enriches** content with metadata, keywords, and search optimization
- **Structures** data for semantic search and context-aware applications

See [docs/pipeline.md](docs/pipeline.md) for complete documentation and [examples/pipeline/](examples/pipeline/) for usage examples.

## AI-Powered Mental Health Chatbot

MindVibe includes an AI-powered chatbot that provides compassionate mental health guidance based on timeless wisdom from the Bhagavad Gita, presented in a completely secular, universally applicable way.

### Features

- **Conversational AI**: Multi-turn conversations with context awareness
- **Universal Wisdom**: Ancient teachings without religious terminology
- **Multi-Language Support**: English, Hindi, and Sanskrit
- **Smart Search**: Semantic search finds relevant verses for your concerns
- **Offline Mode**: Works with or without OpenAI API (fallback to templates)
- **Session Management**: Maintains conversation history across messages

### Quick Start

1. **Seed the database** with wisdom verses:
   ```bash
   python scripts/seed_wisdom.py
   ```

2. **(Optional) Configure OpenAI** for AI-powered responses:
   ```bash
   echo "OPENAI_API_KEY=sk-your-key-here" >> .env
   ```

3. **Start the server**:
   ```bash
   uvicorn main:app --reload
   ```

4. **Start chatting** at `POST /api/chat/message`:
   ```bash
   curl -X POST http://localhost:8000/api/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message": "I am feeling anxious about work"}'
   ```

### API Endpoints

#### Chatbot Endpoints
- `POST /api/chat/message` - Send a message and get guidance
- `GET /api/chat/history/{session_id}` - View conversation history
- `DELETE /api/chat/history/{session_id}` - Clear conversation
- `POST /api/chat/start` - Start a new session
- `GET /api/chat/health` - Check chatbot status

#### Wisdom API Endpoints
- `GET /api/wisdom/verses` - List wisdom verses with filtering and pagination
- `GET /api/wisdom/verses/{verse_id}` - Get a specific verse by ID
- `POST /api/wisdom/search` - Perform semantic search over wisdom content
- `POST /api/wisdom/query` - Get AI-powered guidance with relevant verses
- `GET /api/wisdom/themes` - List all available themes
- `GET /api/wisdom/applications` - List all mental health applications

**Example Wisdom API Usage:**
```bash
# Search for verses about anxiety
curl -X POST http://localhost:8000/api/wisdom/search \
  -H "Content-Type: application/json" \
  -d '{"query": "managing anxiety and stress"}'

# Get verses filtered by theme
curl http://localhost:8000/api/wisdom/verses?theme=equanimity_in_adversity&limit=5

# Get a specific verse in Hindi with Sanskrit
curl "http://localhost:8000/api/wisdom/verses/2.47?language=hindi&include_sanskrit=true"
```

### Documentation

- **Chatbot Guide**: [docs/chatbot.md](docs/chatbot.md) - Complete chatbot documentation
- **Wisdom API**: [docs/wisdom_api.md](docs/wisdom_api.md) - Comprehensive Wisdom API reference
- **Wisdom Guide**: [docs/wisdom_guide.md](docs/wisdom_guide.md) - Background on wisdom verses
- **Interactive Docs**: Visit `http://localhost:8000/docs` after starting the server

Need help?
If you want, I can commit and push these files to the proofread-docs branch for you and open a PR. I will not commit any private key files.
