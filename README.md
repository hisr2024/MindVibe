# MindVibe 🧠✨

**A privacy-first mental health platform combining AI-powered guidance with timeless wisdom for universal well-being.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)

---

## 🌟 **Overview**

MindVibe is a comprehensive mental health platform that provides:
- 🤖 **AI-Powered Chatbot** - Compassionate mental health guidance
- 📊 **Mood Tracking** - Track and analyze your emotional patterns
- 📝 **Encrypted Journal** - Private, secure journaling
- 🌍 **Universal Wisdom** - Ancient teachings without religious terminology
- 🔒 **Privacy-First** - End-to-end encryption for sensitive data
- 🌐 **Multi-Language** - English, Hindi, and Sanskrit support

---

## 📁 **Project Structure**

```
MindVibe/
├── backend/                    # FastAPI Backend (NEW!)
│   ├── __init__.py            # Package initialization
│   ├── main.py                # FastAPI app with 8 routers
│   ├── models.py              # Database models (SQLAlchemy)
│   ├── schemas.py             # Pydantic schemas
│   ├── deps.py                # Dependency injection
│   ├── routes/                # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication & sessions
│   │   ├── jwk.py            # JWK public key endpoint
│   │   ├── moods.py          # Mood tracking API
│   │   ├── content.py        # Content packs API
│   │   ├── journal.py        # Encrypted journal/blob storage
│   │   ├── chat.py           # AI chatbot conversations
│   │   ├── wisdom_guide.py   # Universal wisdom guide API
│   │   └── gita_api.py       # Gita verses API
│   ├── services/              # Business logic
│   │   ├── chatbot.py        # AI chatbot service
│   │   ├── wisdom_kb.py      # Wisdom knowledge base
│   │   └── pipeline/         # Content transformation
│   └── models/                # Additional model definitions
├── tests/                     # Pytest test suite
│   ├── conftest.py           # Test fixtures
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── scripts/                   # Utility scripts (Python package)
│   ├── generate_eddsa_key.py # Generate Ed25519 keys
│   ├── seed_wisdom.py        # Seed wisdom verses
│   ├── seed_content.py       # Seed content packs
│   └── verify_wisdom.py      # Verify implementation
├── data/                      # Data files
│   └── wisdom/               # Wisdom verses JSON
├── docs/                      # Documentation
├── migrations/                # Database migrations
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker orchestration
├── render.yaml               # Render.com deployment config
├── requirements.txt          # Python dependencies
└── package.json              # Node.js dependencies (frontend)
```

---

## 🚀 **Quick Start**

### **Prerequisites**

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- Git

### **Option 1: Local Development**

```bash
# 1. Clone the repository
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe

# 2. Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install Node.js dependencies
npm install

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 6. Generate EdDSA keys for JWT signing
python scripts/generate_eddsa_key.py --dir keyset_eddsa

# 7. Seed the database with wisdom verses
python scripts/seed_wisdom.py

# 8. Start the backend server
uvicorn backend.main:app --reload

# 9. Start the frontend (in another terminal)
npm run dev
```

**Access the application:**
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Frontend: http://localhost:3000

### **Option 2: Docker Compose** (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe

# 2. Start all services (PostgreSQL, Backend, Frontend)
docker-compose up --build

# Access the application:
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - Frontend: http://localhost:3000

# 3. Stop services
docker-compose down
```

### **Option 3: Deploy to Render.com** (Production)

```bash
# 1. Fork the repository to your GitHub account

# 2. Connect your GitHub repository to Render.com

# 3. Render will automatically detect render.yaml and deploy:
#    - Backend API (Python/FastAPI)
#    - PostgreSQL Database

# 4. Set environment variables in Render dashboard:
#    - DATABASE_URL (auto-configured from database)
#    - JWT_SECRET (generate a secure secret)
#    - OPENAI_API_KEY (optional, for AI features)

# Your app will be live at: https://mindvibe-api.onrender.com
```

---

## 🔌 **API Documentation**

### **All 8 API Routers:**

MindVibe backend includes **8 comprehensive API routers**:

#### **1. Authentication & Sessions** (`/api/auth`)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - End session
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh access token

#### **2. JWK Public Keys** (`/.well-known/jwks.json`)
- `GET /.well-known/jwks.json` - Get public keys for JWT verification

#### **3. Mood Tracking** (`/moods`)
- `POST /moods` - Create mood entry
- `GET /moods` - List mood history
- `GET /moods/{mood_id}` - Get specific mood
- `DELETE /moods/{mood_id}` - Delete mood entry

#### **4. Content Packs** (`/content`)
- `GET /content/packs` - List available content packs
- `GET /content/packs/{pack_id}` - Get specific content pack
- `GET /content/locales` - List supported locales

#### **5. Encrypted Journal** (`/journal`)
- `POST /journal/upload` - Upload encrypted blob
- `GET /journal/blobs` - List user's encrypted blobs
- `GET /journal/blobs/{blob_id}` - Retrieve encrypted blob
- `DELETE /journal/blobs/{blob_id}` - Delete encrypted blob

#### **6. AI Chatbot** (`/api/chat`)
- `POST /api/chat/message` - Send message and get AI guidance
- `POST /api/chat/start` - Start new conversation session
- `GET /api/chat/history/{session_id}` - Get conversation history
- `DELETE /api/chat/history/{session_id}` - Clear conversation
- `GET /api/chat/health` - Check chatbot status

#### **7. Universal Wisdom Guide** (`/api/wisdom`)
- `GET /api/wisdom/verses` - List wisdom verses (with filtering)
- `GET /api/wisdom/verses/{verse_id}` - Get specific verse
- `POST /api/wisdom/search` - Semantic search for verses
- `POST /api/wisdom/query` - AI-powered guidance with verses
- `GET /api/wisdom/themes` - List all themes
- `GET /api/wisdom/applications` - List mental health applications

#### **8. Gita Verses API** (`/api/gita`)
- `GET /api/gita/verses` - List Bhagavad Gita verses
- `GET /api/gita/verses/{verse_id}` - Get specific verse
- `GET /api/gita/chapters` - List all chapters
- `GET /api/gita/chapters/{chapter_id}` - Get chapter details

### **Interactive API Documentation:**

Visit `http://localhost:8000/docs` (Swagger UI) or `http://localhost:8000/redoc` (ReDoc) for interactive API documentation with:
- Live API testing
- Request/response schemas
- Authentication flows
- Example requests

---

## 🧪 **Testing**

MindVibe has a comprehensive test suite with **100% updated imports** for the new backend structure.

## Testing Standards & CI Enforcement

### Code Coverage Requirements
- **Minimum coverage enforced by CI: 49%** (current baseline)
- **Target coverage goal: 60%** (to be achieved incrementally)
- CI builds will **fail** if coverage drops below the minimum threshold
- Run tests: `pytest --cov=backend --cov-report=html`
- View report: `open htmlcov/index.html`

### Type Checking with MyPy
- **MyPy strict mode enabled** with pragmatic relaxations for gradual adoption
- CI builds will **fail** if mypy type checking finds errors
- Run: `mypy backend/`
- Configuration: See `mypy.ini` for current settings
- Core type safety features enabled:
  - No implicit optional types
  - Warn on missing return types
  - Strict equality checks
  - Type checking for all definitions
- Gradually increasing strictness as codebase improves

### CI/CD Quality Gates
The following checks are **blocking** in CI (builds will fail if they don't pass):
- ✅ Type checking (mypy) - must pass with 0 errors
- ✅ Coverage threshold - must meet minimum 49% coverage
- ⚠️  Linting (ruff) - currently non-blocking (warnings only)
- ⚠️  Formatting (black) - currently non-blocking (warnings only)

### Running Quality Checks Locally
```bash
# Run all tests with coverage (must pass for CI)
pytest --cov=backend --cov-report=html --cov-fail-under=49

# Type checking (must pass for CI)
mypy backend/

# Linting (recommended but not blocking)
ruff check backend/ --fix

# Formatting (recommended but not blocking)
black backend/
```

### Improving Code Quality
To help reach our 60% coverage target:
1. Add tests for new features
2. Improve test coverage for existing code
3. Focus on critical paths and business logic
4. See `tests/README.md` for testing best practices

To help improve type safety:
1. Add type annotations to new functions
2. Fix type errors in files currently excluded from checking
3. See `mypy.ini` for files with `ignore_errors = True` that need improvement

### **Run All Tests:**

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx aiosqlite

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=backend --cov-report=html

# Open coverage report
open htmlcov/index.html
```

### **Run Specific Test Categories:**

```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v

# Specific test file
pytest tests/unit/test_models.py -v
pytest tests/integration/test_chat_api.py -v
```

### **Test Coverage:**

Current test coverage includes:
- ✅ Database models (User, Mood, WisdomVerse, etc.)
- ✅ Business logic services (Chatbot, WisdomKB)
- ✅ API endpoints (all 8 routers)
- ✅ Text sanitization & transformation
- ✅ Authentication flows
- ✅ Encryption/decryption

**See:** `tests/README.md` for detailed testing documentation.

---

## 🐳 **Docker Deployment**

### **Build & Run with Docker Compose:**

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

### **Services Included:**

- **PostgreSQL Database** - Port 5432
- **Backend API (FastAPI)** - Port 8000
- **Frontend (Next.js)** - Port 3000

All services are networked and include health checks.

---

## 🌍 **Deployment**

### **Render.com** (Recommended - Free Tier Available)

Your `render.yaml` is already configured. Simply:

1. **Push to GitHub**
2. **Connect to Render.com**
3. **Deploy automatically**

Render will create:
- ✅ Backend API service (Python/FastAPI)
- ✅ PostgreSQL database
- ✅ Automatic HTTPS
- ✅ Auto-deploy on push

### **Fly.io**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

### **Railway**

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

---

## 🔒 **Security**

MindVibe implements multiple security layers:

- ✅ **JWT Authentication** - Ed25519 signature algorithm
- ✅ **End-to-End Encryption** - For journal entries
- ✅ **Password Hashing** - bcrypt for secure storage
- ✅ **Input Validation** - Pydantic schemas
- ✅ **SQL Injection Prevention** - SQLAlchemy ORM
- ✅ **CORS Configuration** - Restricted origins
- ✅ **Rate Limiting** - API request throttling
- ✅ **Secret Management** - Environment variables

### Automated Security Scanning

MindVibe uses comprehensive automated security scanning:
- **CodeQL** - Advanced code analysis
- **Bandit** - Python security linting
- **Safety** - Dependency vulnerability checking
- **TruffleHog** - Secrets detection
- **Trivy** - Container security scanning

### Running Security Checks Locally

```bash
# All security checks
bash scripts/security_check.sh

# Individual checks
safety check --file requirements.txt
bandit -r backend/ -ll
npm audit
```

**Security Best Practices:**
- Never commit `.env` files
- Rotate JWT secrets regularly
- Keep dependencies updated
- Use HTTPS in production
- Review `docs/SECURITY_ARCH.md`
- See [SECURITY_AUDIT_CHECKLIST.md](docs/SECURITY_AUDIT_CHECKLIST.md) for the complete security audit checklist

---

## 📚 **Documentation**

### **Core Documentation:**
- [Developer Onboarding Guide](docs/developer_onboarding.md) - **Start here!** Complete guide for new developers
- [Testing Guide](tests/README.md) - Comprehensive testing documentation
- [Scripts Package](scripts/README.md) - Utility scripts reference
- [Chatbot Guide](docs/chatbot.md) - AI chatbot documentation
- [Wisdom API](docs/wisdom_api.md) - Wisdom guide API reference
- [Pipeline](docs/pipeline.md) - Content transformation pipeline
- [Security Architecture](docs/SECURITY_ARCH.md) - Security implementation
- [Gita Corpus Pipeline](docs/GITA_CORPUS_README.md) - Bhagavad Gita corpus validation, import, and maintenance

### **Additional Resources:**
- [Backend Reorganization](BACKEND_REORGANIZATION_COMPLETE.md) - Migration details
- [Cleanup Progress](CLEANUP_PROGRESS.md) - Project cleanup tracking
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines

---

## 🛠️ **Development**

### **Backend Development:**

Set `DATABASE_URL` in your environment (or `.env`) first, then keep the database schema up to date with Alembic before launching services. Alembic now requires an explicit `DATABASE_URL`—there is no SQLite fallback—to avoid running migrations against the wrong database.

```bash
# Start backend with hot reload
uvicorn backend.main:app --reload

# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Seed database
python scripts/seed_wisdom.py
python scripts/seed_content.py
```

### **Frontend Development:**

```bash
# Start Next.js dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run typecheck
```

### **Code Quality:**

```bash
# Python formatting
black backend/

# Python linting
ruff check backend/ --fix

# Python type checking
mypy backend/

# JavaScript/TypeScript
npm run lint
npm run format
```

---

## 🤝 **Contributing**

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### **Quick Contribution Guide:**

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write tests** for new features
5. **Ensure all tests pass** (`pytest`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

---

## 📊 **Project Status**

### **Current Version: v2.0.0** 🎉

- ✅ Backend 100% reorganized into `backend/` package
- ✅ All 8 API routers registered and tested
- ✅ Comprehensive test suite (updated for new structure)
- ✅ Docker deployment ready
- ✅ Render.com deployment configured
- ✅ Production-ready release published

### **Roadmap:**

- [ ] Frontend reorganization (`frontend/src/` structure)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Comprehensive security audit
- [ ] Mobile app (React Native)
- [ ] Real-time features (WebSockets)
- [ ] Advanced analytics dashboard

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend powered by [Next.js](https://nextjs.org/)
- Database with [PostgreSQL](https://www.postgresql.org/)
- AI integration via [OpenAI](https://openai.com/)
- Deployment on [Render.com](https://render.com/)

---

## 📧 **Contact & Support**

- **GitHub Issues**: [Report bugs or request features](https://github.com/hisr2024/MindVibe/issues)
- **Discussions**: [Join community discussions](https://github.com/hisr2024/MindVibe/discussions)
- **Documentation**: [Full documentation](https://github.com/hisr2024/MindVibe/tree/main/docs)

---

**Made with ❤️ for mental health and well-being**

---

## 🚀 **Get Started Now!**

```bash
# Quick start with Docker
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe
docker-compose up --build

# Access at http://localhost:8000/docs
```

**Happy coding! 🎉**
