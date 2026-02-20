# Developer Onboarding Guide

Welcome to MindVibe! This guide will help you get started with the project quickly. MindVibe is a spiritual wellness app that uses wisdom from the Bhagavad Gita to provide AI-powered guidance in a secular, universally applicable way.

## Project Overview

MindVibe consists of:
- **Backend**: FastAPI-based Python application with PostgreSQL database
- **Frontend**: Next.js (TypeScript) web application
- **AI Features**: Chatbot with wisdom-based responses
- **Security**: Encrypted journals, user authentication

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: TypeScript, Next.js 13, React 18
- **Database**: PostgreSQL 16+
- **AI**: OpenAI GPT-4
- **Deployment**: Docker, Vercel (frontend), Render (backend)
- **Testing**: pytest, Jest
- **Linting**: Black, Ruff, ESLint

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Git
- OpenAI API key (for AI features)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hisr2024/MindVibe.git
   cd MindVibe
   ```

2. **Set up Python environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # For development
   ```

3. **Set up Node.js environment**:
   ```bash
   npm install
   ```

4. **Set up PostgreSQL**:
   - Install PostgreSQL locally, or use Docker:
     ```bash
     docker run --name mindvibe-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
     ```
   - Create database: `createdb mindvibe`

5. **Environment variables**:
   Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - Other secrets

## Database Setup

1. Run migrations:
   ```bash
   alembic upgrade head
   ```

2. Seed initial data (wisdom verses):
   ```bash
   python scripts/seed_wisdom.py
   ```

## Running the Application

1. **Backend**:
   ```bash
   uvicorn main:app --reload
   ```
   API available at http://localhost:8000

2. **Frontend**:
   ```bash
   npm run dev
   ```
   App available at http://localhost:3000

3. **Full stack with Docker**:
   ```bash
   docker-compose up
   ```

## Running Tests

- **Backend tests**:
  ```bash
  pytest tests/
  ```

- **Frontend tests**:
  ```bash
  npm test
  ```

- **With coverage**:
  ```bash
  pytest tests/ --cov=. --cov-report=html
  npm run test -- --coverage
  ```

## Code Style and Linting

- **Python**: Black for formatting, Ruff for linting, mypy for type checking
  ```bash
  black .
  ruff check .
  mypy .
  ```

- **TypeScript/JavaScript**: ESLint and Prettier
  ```bash
  npm run lint
  npm run format
  ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and write tests
4. Run tests and linting
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Common Issues and Troubleshooting

- **Import errors**: Ensure you're in the project root and virtual env is activated
- **Database connection**: Check DATABASE_URL and PostgreSQL is running
- **AI features not working**: Verify OPENAI_API_KEY
- **Tests failing**: Run `pip install -r requirements-dev.txt`
- **Linting issues**: Run formatters before committing

For more help, check the README.md or open an issue.