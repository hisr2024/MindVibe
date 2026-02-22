# Contributing to MindVibe

Thank you for your interest in contributing to MindVibe! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 16+
- Redis (optional, for caching)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe

# Frontend setup
npm install
cp .env.example .env.local
npm run dev          # Starts Next.js on http://localhost:3000

# Backend setup (in a separate terminal)
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Or use Docker
docker compose up
```

### Running Tests

```bash
# Frontend tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Backend tests
python -m pytest tests/     # All tests
python -m pytest tests/unit/         # Unit only
python -m pytest tests/integration/  # Integration only

# Type checking
npm run typecheck           # TypeScript
mypy backend/               # Python
```

## Code Style

### TypeScript/React
- Strict TypeScript (`strict: true`, `noImplicitAny: true`)
- No `any` types — use `unknown` or proper types
- No `console.log` — use `console.error`/`console.warn` only for real errors
- Prefer server components; use `'use client'` only when necessary
- Use `next/dynamic` for heavy components (recharts, framer-motion)

### Python
- Format with Black (line length 88)
- Lint with Ruff
- Type hints on all function signatures
- Use Pydantic models for request/response validation
- Never use bare `except:` — always specify exception types

### Commits
- Use clear, descriptive commit messages
- Format: `type: short description` (e.g., `fix: resolve auth token expiration`, `feat: add journey completion animation`)
- Keep commits focused — one logical change per commit

## Pull Request Guidelines

1. Branch from `main`
2. Keep PRs small and focused (<500 lines when possible)
3. Include tests for new behavior
4. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
5. Add a clear description of what changed and why

## Project Structure

```
MindVibe/
├── app/           # Next.js App Router pages and API routes
├── components/    # Shared React components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── types/         # TypeScript type definitions
├── backend/       # FastAPI backend
│   ├── routes/    # API endpoint handlers
│   ├── services/  # Business logic
│   ├── models/    # SQLAlchemy ORM models
│   └── middleware/ # Request middleware
├── tests/         # Backend test suite
└── data/          # Static data files
```

## Security

- Never commit secrets, API keys, or `.env` files
- Use environment variables for all configuration
- Validate all user input with Pydantic
- Use parameterized SQL queries (SQLAlchemy ORM)

## Questions?

Open an issue on GitHub or check the documentation in `/docs/`.
