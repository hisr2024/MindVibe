# MindVibe Chatbot - Integration Guide

## Overview

This guide provides step-by-step instructions for integrating and deploying the Bhagavad Gita-based AI chatbot feature.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│            (Web, Mobile, or CLI Interface)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Server                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST /chat/message                                    │ │
│  │  - Validates user input                                │ │
│  │  - Authenticates user via X-Auth-UID                   │ │
│  └────────────┬───────────────────────────────────────────┘ │
└───────────────┼─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│              GitaKnowledgeBase Service                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Generate query embedding (OpenAI)                  │ │
│  │  2. Search database for similar verses                 │ │
│  │  3. Calculate cosine similarity scores                 │ │
│  │  4. Return top relevant verses                         │ │
│  └────────────┬───────────────────────────────────────────┘ │
└───────────────┼─────────────────────────────────────────────┘
                │
                ├─────────────────┬───────────────────────┐
                ▼                 ▼                       ▼
┌───────────────────┐  ┌──────────────────┐  ┌────────────────┐
│   PostgreSQL DB   │  │   OpenAI API     │  │ Fallback Logic │
│   (GitaVerse)     │  │   (Embeddings    │  │  (Keyword      │
│   - 12+ verses    │  │    & Chat)       │  │   Search)      │
│   - Embeddings    │  │                  │  │                │
└───────────────────┘  └──────────────────┘  └────────────────┘
```

## Prerequisites

1. **Python 3.10+**
2. **PostgreSQL Database** (local or remote)
3. **OpenAI API Key** (optional but recommended)

## Installation Steps

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Key dependencies:
- `fastapi>=0.99.0` - Web framework
- `sqlalchemy>=2.0.0` - ORM
- `asyncpg>=0.29.0` - PostgreSQL async driver
- `openai>=1.0.0` - OpenAI API client
- `pydantic>=2.0.0` - Data validation

### 3. Database Setup

Run migrations (if using Alembic) or create tables directly:

```bash
python seed_gita.py
```

This will:
- Create the `gita_verses` table
- Load verses from `data/gita_verses.json`
- Generate embeddings for semantic search (if API key is set)

### 4. Start the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

For production:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Integration

### Endpoint Details

**URL:** `POST /chat/message`

**Headers:**
- `Content-Type: application/json`
- `X-Auth-UID: <user_id>` (required for authentication)

**Request Body:**
```json
{
  "query": "How do I deal with anxiety?",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "AI-generated guidance...",
  "verses": [
    {
      "chapter": 2,
      "verse": 47,
      "sanskrit": "...",
      "english": "...",
      "hindi": "...",
      "principle": "detachment_action",
      "theme": "duty, action, detachment",
      "relevance_score": 0.87
    }
  ],
  "language": "en"
}
```

### Client Examples

#### Python
```python
import requests

url = "http://localhost:8000/chat/message"
headers = {
    "Content-Type": "application/json",
    "X-Auth-UID": "user123"
}
data = {
    "query": "How do I find peace?",
    "language": "en"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()
print(result["response"])
```

#### JavaScript/TypeScript
```typescript
const response = await fetch('http://localhost:8000/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-UID': 'user123'
  },
  body: JSON.stringify({
    query: 'How do I find peace?',
    language: 'en'
  })
});

const data = await response.json();
console.log(data.response);
```

#### curl
```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Auth-UID: user123" \
  -d '{"query": "How do I find peace?", "language": "en"}'
```

## Configuration Options

### Language Support

Set the `language` parameter to:
- `"en"` - English (default)
- `"hi"` - Hindi (Devanagari)
- `"sa"` - Sanskrit

### OpenAI Model Selection

Set in `.env`:
```bash
OPENAI_MODEL=gpt-4        # Best quality, slower
OPENAI_MODEL=gpt-3.5-turbo  # Good quality, faster, cheaper
```

### Search Parameters

Edit `services/gita_kb.py`:
```python
# Number of verses to return
await kb_service.search_relevant_verses(db, query, limit=3)

# Similarity threshold (0.0 to 1.0)
if similarity > 0.5:  # Only return verses with >50% similarity
    results.append(verse)
```

## Deployment

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t mindvibe-chatbot .
docker run -p 8000:8000 --env-file .env mindvibe-chatbot
```

### Cloud Deployment

#### Heroku
```bash
# Add Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
git push heroku main
```

#### Railway/Render
- Set environment variables in dashboard
- Connect GitHub repository
- Deploy automatically

#### AWS/GCP/Azure
- Use container registry (ECR, GCR, ACR)
- Deploy to container service (ECS, Cloud Run, Container Instances)
- Set up load balancer and auto-scaling

## Monitoring

### Health Check Endpoint

Add to `main.py`:
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Logging

Add logging to `routes/chat.py`:
```python
import logging

logger = logging.getLogger(__name__)

@router.post("/message", response_model=ChatResponse)
async def chat_message(...):
    logger.info(f"Chat request from user {user_id}: {message.query[:50]}...")
    # ... rest of code
```

### Metrics

Track:
- Total requests
- Response time
- Error rate
- OpenAI API usage
- Cache hit rate

## Optimization

### Caching

Add Redis for caching frequent queries:
```python
import redis
cache = redis.Redis(host='localhost', port=6379)

# Cache responses for 1 hour
cache_key = f"chat:{hash(query)}"
cached = cache.get(cache_key)
if cached:
    return json.loads(cached)
```

### Rate Limiting

Add rate limiting middleware:
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/chat/message")
@limiter.limit("10/minute")
async def chat_message(...):
    ...
```

### Database Indexing

Ensure indexes exist:
```sql
CREATE INDEX idx_gita_principle ON gita_verses(principle);
CREATE INDEX idx_gita_chapter_verse ON gita_verses(chapter, verse);
```

## Troubleshooting

### Common Issues

**1. OpenAI API errors**
- Check API key is valid
- Verify rate limits
- Use fallback mode if API is down

**2. Database connection errors**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database exists

**3. Import errors**
- Ensure all `__init__.py` files exist
- Check Python path
- Verify dependencies are installed

**4. Slow response times**
- Enable caching
- Optimize database queries
- Use faster OpenAI model
- Pre-generate embeddings

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Security Considerations

1. **API Keys**: Never commit `.env` files
2. **Input Validation**: All inputs validated via Pydantic
3. **Rate Limiting**: Implement per-user limits
4. **Authentication**: Use proper auth beyond X-Auth-UID
5. **CORS**: Configure allowed origins
6. **SQL Injection**: SQLAlchemy ORM prevents this
7. **Content Filtering**: Monitor for misuse

## Future Enhancements

- [ ] Conversation history/context
- [ ] User preference learning
- [ ] Mood-based verse recommendations
- [ ] Voice interface integration
- [ ] More ancient texts (Upanishads, etc.)
- [ ] Commentary and explanations
- [ ] Multilingual embeddings
- [ ] Advanced search filters

## Support

For issues or questions:
1. Check [docs/CHATBOT.md](CHATBOT.md)
2. Review error logs
3. Test with `test_chatbot.py`
4. Open GitHub issue

## License

See main repository LICENSE file.
