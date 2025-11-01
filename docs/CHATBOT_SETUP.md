# AI Chatbot Setup Guide

This guide will help you set up and use the MindVibe AI Chatbot for mental health guidance based on Bhagavad Gita wisdom.

## Prerequisites

- Python 3.8 or higher
- PostgreSQL database (or SQLite for development)
- (Optional) OpenAI API key for AI-powered responses

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
# Install all dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mindvibe

# OpenAI Configuration (optional)
OPENAI_API_KEY=sk-your-api-key-here

# JWT Configuration (for existing auth features)
JWT_SECRET=your-jwt-secret-here
```

**Note**: The chatbot works with or without OpenAI API key:
- **With API key**: AI-powered, context-aware responses using GPT-4
- **Without API key**: Template-based responses tailored to verse themes

### 5. Setup Database

#### Option A: PostgreSQL (Recommended for Production)

```bash
# Create database
createdb mindvibe

# Update .env with your PostgreSQL credentials
DATABASE_URL=postgresql+asyncpg://yourusername:yourpassword@localhost:5432/mindvibe
```

#### Option B: SQLite (Quick Start)

```bash
# Use SQLite for development
DATABASE_URL=sqlite+aiosqlite:///./mindvibe.db
```

### 6. Seed Wisdom Verses

```bash
# Populate database with Bhagavad Gita wisdom verses
python seed_wisdom.py
```

Expected output:
```
Loaded 10 verses from data/wisdom/verses.json
Inserted verse 2.47
Inserted verse 2.56
...
Wisdom verses seeding completed!
```

### 7. Verify Installation

```bash
# Run verification script
python verify_chatbot.py
```

All checks should pass (✓).

### 8. Start the Server

```bash
# Start FastAPI server
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

### 9. Test the Chatbot

#### Option A: Interactive API Documentation

Visit `http://localhost:8000/docs` in your browser to access the interactive API documentation.

#### Option B: Command Line (curl)

```bash
# Check chatbot health
curl http://localhost:8000/api/chat/health

# Send a message
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I am feeling anxious about work"}'
```

#### Option C: Python Example Script

```bash
# Run example conversation script
python examples/chatbot_example.py
```

## Quick Start for Development

If you just want to test quickly without database setup:

```bash
# 1. Install minimal dependencies
pip install fastapi uvicorn sqlalchemy aiosqlite pydantic

# 2. Use SQLite
export DATABASE_URL="sqlite+aiosqlite:///./test.db"

# 3. Seed database
python seed_wisdom.py

# 4. Start server
uvicorn main:app --reload

# 5. Test in another terminal
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I find peace?"}'
```

## Configuration Options

### OpenAI Settings

```bash
# .env file
OPENAI_API_KEY=sk-your-key-here
```

**Models Supported:**
- `gpt-4` (default) - Best quality, higher cost
- `gpt-3.5-turbo` - Faster, lower cost (modify in `services/chatbot.py`)

### Database Settings

```bash
# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname

# SQLite (development)
DATABASE_URL=sqlite+aiosqlite:///./mindvibe.db

# PostgreSQL with Docker
DATABASE_URL=postgresql+asyncpg://navi:navi@db:5432/navi
```

### Server Settings

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Testing

### Run All Tests

```bash
# Run all tests with coverage
pytest tests/ -v --cov=. --cov-report=html

# Run specific test files
pytest tests/unit/test_chatbot.py -v
pytest tests/integration/test_chat_api.py -v
```

### Run Specific Test Categories

```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v

# Tests with specific marker
pytest -m asyncio -v
```

## Docker Deployment

### Using Docker Compose

```bash
# Start all services (API + Database)
docker-compose up -d

# Seed database in container
docker-compose exec api python seed_wisdom.py

# Check logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## Troubleshooting

### Issue: "No module named 'fastapi'"

**Solution**: Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: "No relevant wisdom verses found"

**Solution**: Seed the database
```bash
python seed_wisdom.py
```

### Issue: "Connection refused" or "Database error"

**Solution**: Check database connection
```bash
# Verify DATABASE_URL in .env
# For PostgreSQL, ensure server is running:
pg_isready

# For SQLite, check file permissions
ls -l mindvibe.db
```

### Issue: Template responses instead of AI responses

**Cause**: OpenAI API key not configured or invalid

**Solution**:
1. Check `.env` has valid `OPENAI_API_KEY`
2. Verify API key at https://platform.openai.com/api-keys
3. Check `/api/chat/health` endpoint for status

### Issue: Import errors in tests

**Solution**: Install test dependencies
```bash
pip install -r requirements-dev.txt
```

## API Usage Examples

### Example 1: Basic Conversation

```python
import requests

# Start a session
session_response = requests.post("http://localhost:8000/api/chat/start")
session_id = session_response.json()["session_id"]

# Send message
response = requests.post(
    "http://localhost:8000/api/chat/message",
    json={
        "message": "I'm feeling stressed about work",
        "session_id": session_id
    }
)

print(response.json()["response"])
```

### Example 2: Multi-Language

```python
# Hindi conversation
response = requests.post(
    "http://localhost:8000/api/chat/message",
    json={
        "message": "मुझे चिंता हो रही है",
        "language": "hindi",
        "include_sanskrit": True
    }
)
```

### Example 3: Managing Sessions

```python
# Get conversation history
history = requests.get(
    f"http://localhost:8000/api/chat/history/{session_id}"
).json()

print(f"Total messages: {history['total_messages']}")

# Clear conversation
requests.delete(f"http://localhost:8000/api/chat/history/{session_id}")
```

## Production Deployment

### Environment Variables

```bash
# Production .env
DATABASE_URL=postgresql+asyncpg://prod_user:secure_pass@db_host:5432/mindvibe
OPENAI_API_KEY=sk-production-key
JWT_SECRET=production-secret-key-here
ENVIRONMENT=production
```

### Performance Optimization

1. **Use PostgreSQL**: Better performance than SQLite
2. **Enable Connection Pooling**: Already configured in SQLAlchemy
3. **Use Multiple Workers**: `uvicorn main:app --workers 4`
4. **Add Caching**: Consider Redis for session storage
5. **Rate Limiting**: Implement API rate limits

### Security Considerations

1. **HTTPS Only**: Use TLS/SSL in production
2. **API Key Protection**: Never commit API keys to git
3. **Database Security**: Use strong passwords and restricted access
4. **Session Security**: Implement user authentication
5. **Input Validation**: Already implemented in Pydantic models

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:8000/api/chat/health

# Expected response:
{
  "status": "healthy",
  "openai_enabled": true,
  "fallback_mode": "ai-powered",
  "active_sessions": 5,
  "supported_languages": ["english", "hindi", "sanskrit"]
}
```

### Logging

Add logging configuration in production:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## Next Steps

1. **Add More Verses**: Expand `data/wisdom/verses.json` with more teachings
2. **Implement User Auth**: Connect sessions to authenticated users
3. **Add Persistence**: Store sessions in database instead of memory
4. **Enhance Search**: Implement embeddings-based semantic search
5. **Add Analytics**: Track usage patterns and user satisfaction

## Support & Resources

- **Documentation**: `docs/chatbot.md` - Complete feature documentation
- **Examples**: `examples/chatbot_example.py` - Usage examples
- **API Docs**: `http://localhost:8000/docs` - Interactive API documentation
- **Tests**: `tests/` - Test suite for reference
- **Issues**: Report issues on GitHub

## Contributing

To contribute improvements:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

See LICENSE file in repository root.
