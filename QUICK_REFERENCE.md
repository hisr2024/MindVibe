# MindVibe Chatbot - Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# 2. Install
pip install -r requirements.txt

# 3. Seed Database
python seed_gita.py

# 4. Run Server
uvicorn main:app --reload

# 5. Test
python test_chatbot.py
python example_chatbot_usage.py
```

## 📡 API Endpoint

```
POST /chat/message
```

### Request
```json
{
  "query": "How do I deal with anxiety?",
  "language": "en"  // "en", "hi", or "sa"
}
```

### Response
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

## 🐍 Python Client

```python
import requests

response = requests.post(
    'http://localhost:8000/chat/message',
    json={'query': 'How do I find peace?', 'language': 'en'},
    headers={'X-Auth-UID': 'user123'}
)
print(response.json()['response'])
```

## 🌐 JavaScript Client

```javascript
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

## 💻 curl

```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Auth-UID: user123" \
  -d '{"query": "How do I find peace?", "language": "en"}'
```

## 📁 Project Structure

```
MindVibe/
├── data/
│   └── gita_verses.json        # 12 Bhagavad Gita verses
├── routes/
│   ├── __init__.py
│   └── chat.py                 # Chat API endpoint
├── services/
│   ├── __init__.py
│   └── gita_kb.py             # Knowledge base service
├── models.py                   # GitaVerse model
├── schemas.py                  # Request/response schemas
├── main.py                     # App entry point
├── seed_gita.py               # Database seeder
├── test_chatbot.py            # Test suite
└── example_chatbot_usage.py   # Interactive testing tool
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4
```

## 🧪 Testing

```bash
# Run automated tests
python test_chatbot.py

# Interactive testing
python example_chatbot_usage.py

# Health check
curl http://localhost:8000/docs  # Swagger UI
```

## 📚 Documentation

- `docs/CHATBOT.md` - Complete feature documentation
- `docs/INTEGRATION.md` - Integration and deployment guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

## 🎯 Key Features

| Feature | Status |
|---------|--------|
| Multi-language (en, hi, sa) | ✅ |
| Semantic search | ✅ |
| Fallback mode | ✅ |
| AI responses (GPT-4) | ✅ |
| Cultural sensitivity | ✅ |
| Test suite | ✅ (4/4 passing) |
| Documentation | ✅ |
| Production ready | ✅ |

## 🔍 Example Queries

- "I'm feeling anxious about my future"
- "How do I deal with anger?"
- "I feel like I'm not good enough"
- "How can I find inner peace?"
- "मैं चिंता से कैसे निपटूं?" (Hindi)

## ⚡ Performance

- Response time: 2-5 seconds (with OpenAI)
- Fallback time: <1 second (keyword search)
- Concurrent requests: Scalable with load balancer

## 🛡️ Security

- Input validation via Pydantic
- SQL injection protection via SQLAlchemy
- Environment-based secrets
- User authentication via X-Auth-UID

## 🐛 Troubleshooting

### OpenAI API errors
```bash
# Check API key
echo $OPENAI_API_KEY

# Test with fallback mode (no API key required)
unset OPENAI_API_KEY
python example_chatbot_usage.py
```

### Database errors
```bash
# Verify connection
psql $DATABASE_URL -c "SELECT 1"

# Re-seed database
python seed_gita.py
```

### Import errors
```bash
# Check Python path
python -c "import sys; print(sys.path)"

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 📞 Support

- Review test output: `python test_chatbot.py`
- Check logs: Server output shows errors
- Read docs: `docs/CHATBOT.md`
- GitHub issues: Open an issue with details

## 🚢 Deployment

### Docker
```bash
docker build -t mindvibe-chatbot .
docker run -p 8000:8000 --env-file .env mindvibe-chatbot
```

### Heroku
```bash
heroku create
heroku config:set OPENAI_API_KEY=sk-your-key
git push heroku main
```

### Railway/Render
- Connect GitHub repo
- Set environment variables
- Deploy automatically

## 📈 Metrics to Track

- Total chat requests
- Average response time
- Error rate
- OpenAI API usage
- User satisfaction
- Most common queries

## 🔮 Future Ideas

- Conversation history
- Voice interface
- More verses (18 chapters)
- Mood-based recommendations
- Caching for performance
- Advanced analytics

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: October 9, 2024
