# MindVibe Developer Onboarding Guide

**Welcome to the MindVibe team! 🎉**

This comprehensive guide will help you get started with developing MindVibe, a privacy-first mental health platform combining AI-powered guidance with timeless wisdom.

---

## 1. Stack Overview

### Backend
- **FastAPI** 0.100+ - Modern, fast web framework for building APIs
- **Python** 3.11+ - Programming language
- **SQLAlchemy** 2.0 - SQL toolkit and ORM
- **PostgreSQL** 16+ - Relational database
- **Uvicorn** - ASGI server

### Frontend
- **Next.js** 13.4.19 - React framework with server-side rendering
- **React** 18.2.0 - UI library
- **TypeScript** 5.9.3 - Type-safe JavaScript
- **Tailwind CSS** 3.4.15 - Utility-first CSS framework

### Authentication & Security
- **JWT** with EdDSA (Ed25519) - Cryptographic signing
- **bcrypt** - Password hashing
- **python-jose** - JWT handling

### AI Integration
- **OpenAI** 1.3+ - GPT-powered chatbot and wisdom guidance

### Deployment
- **Docker** - Containerization
- **Render.com** - Backend deployment
- **Fly.io** - Alternative backend deployment
- **Vercel** - Frontend deployment

---

## 2. Quick Start Local Development

### Prerequisites
- Python 3.11 or higher
- Node.js 20 or higher
- PostgreSQL 16 or higher (or Docker)
- Git

### Setup Instructions

```bash
# Clone repository
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe

# Python setup
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Node.js setup
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL: PostgreSQL connection string (required for Alembic; no SQLite fallback)
# - OPENAI_API_KEY: Your OpenAI API key
# - JWT_SECRET: Random secret for JWT signing
# - Other environment variables as needed

# Apply database migrations after DATABASE_URL is set
alembic upgrade head

# Generate EdDSA keys for JWT signing
python scripts/generate_eddsa_key.py --dir keyset_eddsa

# Seed database with wisdom verses
python scripts/seed_wisdom.py

# Start backend (port 8000)
uvicorn backend.main:app --reload

# Start frontend (new terminal, port 3000)
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc

---

## 3. Core Authentication/Session Flows

### JWT Token Generation
MindVibe uses **EdDSA (Ed25519)** for JWT signing, providing:
- Strong cryptographic security
- Smaller token sizes
- Better performance than RSA

### Authentication Flow
1. **User Registration** (`POST /api/auth/register`)
   - User provides email, password, name
   - Password hashed with bcrypt
   - User account created
   - JWT token returned

2. **User Login** (`POST /api/auth/login`)
   - User provides email, password
   - Password verified with bcrypt
   - JWT token generated and signed with Ed25519 private key
   - Token returned to client

3. **Protected Endpoints**
   - Client includes token in Authorization header: `Bearer <token>`
   - Backend verifies token signature with Ed25519 public key
   - User identity extracted from token payload

### Session Management
- Managed in `backend/routes/auth.py`
- Token expiration configurable via `JWT_EXPIRATION_HOURS`
- Refresh token mechanism available

### Public Key Endpoint
- **JWK endpoint**: `/.well-known/jwks.json`
- Provides public keys for token verification
- Used by frontend and external services

---

## 4. Code Map of Major Files

```
MindVibe/
├── backend/
│   ├── main.py              # FastAPI app entry point, registers 8 routers
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── deps.py              # Dependency injection (DB sessions, auth)
│   ├── routes/              # API route handlers (8 routers)
│   │   ├── auth.py         # Authentication & user management
│   │   ├── jwk.py          # JWK public key endpoint
│   │   ├── moods.py        # Mood tracking API
│   │   ├── content.py      # Content packs API
│   │   ├── journal.py      # Encrypted journal/blob storage
│   │   ├── chat.py         # AI chatbot conversations
│   │   ├── wisdom_guide.py # Universal wisdom guide API
│   │   └── gita_api.py     # Bhagavad Gita verses API
│   └── services/            # Business logic layer
│       ├── chatbot.py      # AI chatbot service
│       ├── wisdom_kb.py    # Wisdom knowledge base
│       └── pipeline/       # Content transformation pipeline
├── tests/
│   ├── conftest.py         # Pytest fixtures and test configuration
│   ├── unit/               # Unit tests for models and services
│   └── integration/        # Integration tests for API endpoints
├── scripts/                 # Utility scripts
│   ├── generate_eddsa_key.py  # Generate Ed25519 key pairs
│   ├── seed_wisdom.py      # Seed wisdom verses into database
│   ├── seed_content.py     # Seed content packs
│   └── verify_wisdom.py    # Verify wisdom implementation
├── data/                    # Data files
│   └── wisdom/             # Wisdom verses JSON files
├── docs/                    # Documentation
├── app/                     # Next.js frontend
├── migrations/              # Database migration files
├── .env.example            # Environment variable template
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Multi-stage Docker build
└── requirements.txt        # Python dependencies
```

---

## 5. Adding New Endpoints

Follow these steps to add a new API endpoint:

### Step 1: Create Route Handler
Create a new file in `backend/routes/` or add to an existing router:

```python
# backend/routes/your_route.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend import schemas
from backend.deps import get_db, get_current_user

router = APIRouter(prefix="/api/your-resource", tags=["your-resource"])

@router.get("/", response_model=list[schemas.YourResponse])
async def list_resources(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Your logic here
    return results
```

### Step 2: Define Pydantic Schemas
Add schemas in `backend/schemas.py`:

```python
class YourRequest(BaseModel):
    field1: str
    field2: int

class YourResponse(BaseModel):
    id: int
    field1: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Step 3: Add Database Models (if needed)
Add models in `backend/models.py`:

```python
class YourModel(Base):
    __tablename__ = "your_table"
    
    id = Column(Integer, primary_key=True, index=True)
    field1 = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Step 4: Register Router
Register in `backend/main.py`:

```python
from backend.routes import your_route

app.include_router(your_route.router)
```

### Step 5: Write Tests
Create tests in `tests/integration/test_your_route.py`:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_resources(client: AsyncClient, auth_headers):
    response = await client.get("/api/your-resource/", headers=auth_headers)
    assert response.status_code == 200
```

### Step 6: Update Documentation
- API docs auto-generate from FastAPI decorators
- Update this guide or README if needed

---

## 6. Safe Debugging Practices

### DO:
✅ Use environment variables for all secrets
✅ Log at appropriate levels (DEBUG, INFO, WARNING, ERROR)
✅ Sanitize error messages before returning to users
✅ Use debugger breakpoints instead of print statements
✅ Use structured logging with context
✅ Set up proper log rotation

### Example: Good Logging
```python
import logging

logger = logging.getLogger(__name__)

# Good
logger.info("User login attempt", extra={"user_id": user.id})
logger.error("Database connection failed", extra={"error": str(e)})

# Bad - Don't do this
print(f"Password: {password}")  # Never log passwords!
logger.debug(f"Token: {jwt_token}")  # Never log tokens!
```

### DON'T:
❌ Log passwords, tokens, or API keys
❌ Return stack traces in production
❌ Commit .env files
❌ Use `debug=True` in production
❌ Log full request/response bodies with sensitive data
❌ Use print() for debugging in production code

### Debug Mode
```python
# Development
uvicorn backend.main:app --reload --log-level debug

# Production
uvicorn backend.main:app --workers 4 --log-level info
```

---

## 7. Test Coverage Targets

### Coverage Goals
- **Minimum**: 60% overall coverage
- **Target**: 90%+ for critical paths
- **Current**: Comprehensive coverage of models, services, and API routes

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=backend --cov-report=html

# View HTML coverage report
open htmlcov/index.html  # macOS/Linux
start htmlcov/index.html  # Windows

# Run specific test categories
pytest tests/unit/ -v           # Unit tests only
pytest tests/integration/ -v    # Integration tests only
pytest tests/unit/test_models.py -v  # Specific file
```

### Test Categories

**Unit Tests** (`tests/unit/`)
- Database models
- Business logic services
- Utility functions
- Data validation

**Integration Tests** (`tests/integration/`)
- API endpoints
- Database operations
- Authentication flows
- External service integrations

### Writing Tests

```python
# tests/unit/test_service.py
import pytest
from backend.services import your_service

def test_business_logic():
    result = your_service.calculate(10, 20)
    assert result == 30

# tests/integration/test_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_api_endpoint(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/resource/",
        json={"field": "value"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["field"] == "value"
```

---

## 8. Troubleshooting Tips

### Import Errors

```bash
# Ensure you're in project root
cd /path/to/MindVibe

# Reinstall dependencies
pip install -r requirements.txt -r requirements-dev.txt

# Check Python path
python -c "import sys; print(sys.path)"

# Verify virtual environment is activated
which python  # Should point to .venv/bin/python
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
# For local PostgreSQL:
pg_ctl status

# For Docker:
docker ps | grep postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
python -c "from sqlalchemy import create_engine; engine = create_engine('your_db_url'); engine.connect()"

# Run migrations
alembic upgrade head

# Check migration status
alembic current
```

### JWT Token Validation Problems

```bash
# Regenerate EdDSA keys
python scripts/generate_eddsa_key.py --dir keyset_eddsa

# Check JWT_SECRET in .env
grep JWT_SECRET .env

# Verify key files exist
ls -l keyset_eddsa/

# Test token generation
python -c "from backend.services.auth import create_access_token; print(create_access_token({'sub': 'test'}))"
```

### Frontend-Backend CORS Issues

- Check CORS configuration in `backend/main.py`
- Ensure frontend origin is in allowed origins list
- Verify CORS middleware is properly configured

```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Docker Container Debugging

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Shell into container
docker-compose exec backend bash
docker-compose exec frontend sh

# Rebuild containers
docker-compose up --build

# Remove and rebuild from scratch
docker-compose down -v
docker-compose up --build

# Check container status
docker-compose ps
```

### OpenAI API Issues

```bash
# Verify API key
echo $OPENAI_API_KEY

# Test API connection
python -c "import openai; client = openai.OpenAI(); print(client.models.list())"

# Check rate limits in logs
# Implement exponential backoff for retries
```

---

## 9. Contribution Conventions

### Branch Naming
Use descriptive branch names with prefixes:

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Production hotfixes
- `docs/documentation-update` - Documentation changes
- `refactor/code-improvement` - Code refactoring
- `test/test-addition` - Test additions

Examples:
- `feature/mood-analytics-dashboard`
- `bugfix/login-validation-error`
- `docs/api-documentation-update`

### Commit Messages

Follow the Conventional Commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality

Implements password reset flow with email verification.
Adds new endpoints for reset request and confirmation.

Closes #123

fix(chatbot): resolve streaming response timeout

Increased timeout from 30s to 60s for long responses.

refactor(models): simplify user model relationships

docs(readme): update installation instructions
```

### Code Formatting

**Python:**
```bash
# Format code with Black
black backend/

# Lint with Ruff
ruff check backend/ --fix

# Type check with mypy
mypy backend/

# Run all formatting/linting
black backend/ && ruff check backend/ --fix && mypy backend/
```

**JavaScript/TypeScript:**
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck

# Run all checks
npm run lint && npm run typecheck
```

### Pre-commit Hooks

Set up pre-commit hooks to automatically format and lint code:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files
pre-commit run --all-files

# Update hook versions
pre-commit autoupdate
```

The `.pre-commit-config.yaml` file configures:
- Black (Python formatting)
- Ruff (Python linting)
- Prettier (JS/TS formatting)
- ESLint (JS/TS linting)
- Trailing whitespace removal
- End-of-file fixer

### Pull Request Process

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/MindVibe.git
   cd MindVibe
   git remote add upstream https://github.com/hisr2024/MindVibe.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes with tests**
   - Write code
   - Add/update tests
   - Update documentation

4. **Ensure all tests pass**
   ```bash
   pytest
   npm test
   ```

5. **Format code**
   ```bash
   black backend/
   ruff check backend/ --fix
   npm run format
   ```

6. **Commit with descriptive message**
   ```bash
   git add .
   git commit -m "feat(scope): descriptive message"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in PR template
   - Request reviews

### Code Review Guidelines

**For Authors:**
- Keep PRs focused and small
- Write clear descriptions
- Include screenshots for UI changes
- Respond to feedback promptly
- Update based on review comments

**For Reviewers:**
- Be constructive and respectful
- Test the changes locally if possible
- Check for edge cases
- Verify tests are adequate
- Approve when satisfied

---

## 10. Security Do's and Don'ts

### DO: ✅

✅ **Use environment variables for all secrets**
```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
```

✅ **Validate and sanitize all user inputs**
```python
from pydantic import BaseModel, validator

class UserInput(BaseModel):
    content: str
    
    @validator('content')
    def validate_content(cls, v):
        if len(v) > 10000:
            raise ValueError("Content too long")
        return v.strip()
```

✅ **Use parameterized queries (SQLAlchemy ORM)**
```python
# Good - ORM protects against SQL injection
user = await db.query(User).filter(User.email == email).first()

# Bad - Never use string formatting for SQL
# query = f"SELECT * FROM users WHERE email = '{email}'"
```

✅ **Implement rate limiting on APIs**
```python
from fastapi_limiter.depends import RateLimiter

@router.post("/api/auth/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def login():
    ...
```

✅ **Keep dependencies updated**
```bash
pip list --outdated
npm outdated
```

✅ **Use HTTPS in production**
- Configure SSL/TLS certificates
- Redirect HTTP to HTTPS
- Set secure cookies

✅ **Rotate JWT secrets regularly**
- Update JWT_SECRET periodically
- Implement key rotation strategy

✅ **Hash passwords with bcrypt**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(plain_password)
```

✅ **Implement proper CORS policies**
```python
# Restrict to known origins
allow_origins=["https://yourdomain.com"]

# Don't use wildcard in production
# allow_origins=["*"]  # Bad!
```

### DON'T: ❌

❌ **Commit .env files or secrets**
```bash
# Add to .gitignore
.env
.env.local
*.key
*.pem
secrets/
```

❌ **Log sensitive information**
```python
# Bad
logger.info(f"User logged in: {user.email}, password: {password}")

# Good
logger.info(f"User logged in: {user.id}")
```

❌ **Use default/weak secrets**
```python
# Bad
JWT_SECRET = "secret123"

# Good - Generate strong random secret
import secrets
JWT_SECRET = secrets.token_urlsafe(32)
```

❌ **Trust user input without validation**
```python
# Bad
content = request.json["content"]
execute_sql(f"INSERT INTO posts VALUES ('{content}')")

# Good
content = validated_input.content  # Pydantic validation
db.add(Post(content=content))  # ORM protection
```

❌ **Expose internal error details to users**
```python
# Bad
except Exception as e:
    return {"error": str(e), "traceback": traceback.format_exc()}

# Good
except Exception as e:
    logger.error(f"Error processing request: {e}", exc_info=True)
    return {"error": "An internal error occurred"}
```

❌ **Use debug=True in production**
```python
# Development
if __name__ == "__main__":
    uvicorn.run("main:app", reload=True, debug=True)

# Production
if __name__ == "__main__":
    uvicorn.run("main:app", workers=4, debug=False)
```

❌ **Store passwords in plain text**
```python
# Bad
user.password = plain_password

# Good
user.hashed_password = pwd_context.hash(plain_password)
```

❌ **Allow SQL injection vulnerabilities**
```python
# Bad
query = f"SELECT * FROM users WHERE id = {user_id}"

# Good
user = await db.query(User).filter(User.id == user_id).first()
```

### Security Checklist

Before deploying:
- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Database backups configured
- [ ] Logging configured (no sensitive data)

---

## 11. Phase 2 Roadmap Links

See <a href="https://github.com/hisr2024/MindVibe/blob/main/README.md">README.md</a> for the complete roadmap.

**Planned Features:**

- [ ] **Frontend Reorganization** - Restructure `frontend/src/` for better maintainability
- [ ] **Enhanced CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- [ ] **Comprehensive Security Audit** - Third-party security review
- [ ] **Mobile App** - React Native mobile application
- [ ] **Real-time Features** - WebSocket support for live updates
- [ ] **Advanced Analytics Dashboard** - Comprehensive mood and usage analytics
- [ ] **Multi-Factor Authentication** - Additional security layer
- [ ] **Enhanced AI Features** - Improved chatbot capabilities
- [ ] **Performance Optimizations** - Caching, query optimization
- [ ] **Internationalization (i18n)** - Multi-language support

**How to Contribute:**
- Check the [GitHub Issues](https://github.com/hisr2024/MindVibe/issues) for planned features
- Comment on issues you'd like to work on
- Submit proposals for new features

---

## Additional Resources

### Documentation
- <a href="https://github.com/hisr2024/MindVibe/blob/main/README.md">README.md</a> - Main project documentation
- <a href="https://github.com/hisr2024/MindVibe/blob/main/QUICKSTART.md">QUICKSTART.md</a> - Quick setup guide
- <a href="https://github.com/hisr2024/MindVibe/blob/main/SECURITY.md">SECURITY.md</a> - Security policies and reporting
- <a href="https://github.com/hisr2024/MindVibe/blob/main/tests/README.md">tests/README.md</a> - Comprehensive testing guide
- <a href="https://github.com/hisr2024/MindVibe/blob/main/scripts/README.md">scripts/README.md</a> - Utility scripts documentation

### Guides
- <a href="https://github.com/hisr2024/MindVibe/blob/main/docs/chatbot.md">Chatbot Guide</a> - AI chatbot documentation
- <a href="https://github.com/hisr2024/MindVibe/blob/main/docs/wisdom_api.md">Wisdom API</a> - Wisdom guide API reference
- <a href="https://github.com/hisr2024/MindVibe/blob/main/docs/pipeline.md">Pipeline</a> - Content transformation pipeline
- <a href="https://github.com/hisr2024/MindVibe/blob/main/docs/SECURITY_ARCH.md">Security Architecture</a> - Security implementation details

### Community
- <a href="https://github.com/hisr2024/MindVibe/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a> - How to contribute
- <a href="https://github.com/hisr2024/MindVibe/blob/main/CODE_OF_CONDUCT.md">CODE_OF_CONDUCT.md</a> - Community guidelines
- <a href="https://github.com/hisr2024/MindVibe/blob/main/PRIVACY.md">PRIVACY.md</a> - Privacy policy
- <a href="https://github.com/hisr2024/MindVibe/blob/main/TERMS.md">TERMS.md</a> - Terms of service

### External Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## Getting Help

### GitHub Issues
Report bugs or request features: <a href="https://github.com/hisr2024/MindVibe/issues">GitHub Issues</a>

**Before Creating an Issue:**
- Search existing issues first
- Include reproduction steps
- Provide error messages/logs
- Specify your environment

### GitHub Discussions
Community discussions: <a href="https://github.com/hisr2024/MindVibe/discussions">GitHub Discussions</a>

**Discussion Categories:**
- General questions
- Feature ideas
- Show and tell
- Development help

### API Documentation
Interactive API documentation (when running locally):
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Development Tips
- Join our community discussions
- Review existing PRs to learn best practices
- Start with "good first issue" labeled issues
- Ask questions in discussions before starting major work
- Read through existing code to understand patterns

---

**Welcome to the MindVibe team! 🎉**

We're excited to have you contribute to making mental health support more accessible through technology and timeless wisdom. If you have any questions or need help getting started, don't hesitate to reach out through GitHub Issues or Discussions.

Happy coding! 💻✨
