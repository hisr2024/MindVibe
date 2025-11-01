# AI Chatbot - Mental Health Guidance

## Overview

The MindVibe AI Chatbot provides conversational mental health guidance based on timeless wisdom from the Bhagavad Gita, presented in a completely secular, universally applicable way. The chatbot maintains conversation context, remembers previous interactions, and provides empathetic, actionable guidance.

## Key Features

### 1. **Conversational AI**
- Multi-turn conversations with context awareness
- Remembers previous messages in the conversation
- Natural, empathetic responses like a caring counselor
- Builds on previous exchanges for coherent dialogue

### 2. **Universal Wisdom Integration**
- Draws from authentic Bhagavad Gita verses
- All religious references automatically sanitized
- Presents wisdom as universal principles
- Focuses on practical mental health applications

### 3. **Multi-Language Support**
- **English**: Modern, accessible language
- **Hindi**: Original Hindi translations (Devanagari script)
- **Sanskrit**: Original Sanskrit verses (optional)

### 4. **Intelligent Search**
- Semantic search finds relevant verses for queries
- Theme-based matching for mental health concerns
- Context-aware verse selection

### 5. **Fallback Mechanisms**
- **AI-Powered Mode**: Uses OpenAI GPT-4 when API key configured
- **Offline Mode**: Template-based responses when API unavailable
- Graceful degradation ensures service continuity

### 6. **Session Management**
- Unique session IDs for conversation tracking
- Conversation history retrieval
- Session clearing and management

## API Endpoints

### 1. Send Message to Chatbot

**POST** `/api/chat/message`

Send a message to the AI chatbot and receive guidance.

**Request Body:**
```json
{
  "message": "I'm feeling overwhelmed with work and don't know how to cope",
  "session_id": "optional-session-uuid",
  "language": "english",
  "include_sanskrit": false
}
```

**Parameters:**
- `message` (required): User's message or question
- `session_id` (optional): Session ID for continuing a conversation. If omitted, a new session is created.
- `language` (optional): `english`, `hindi`, or `sanskrit` (default: `english`)
- `include_sanskrit` (optional): Include Sanskrit verses in response (default: `false`)

**Response:**
```json
{
  "response": "I hear that you're feeling overwhelmed, and that's a completely valid response to a demanding situation. There's a powerful principle that might help: focusing on your actions rather than outcomes...",
  "verses": [
    {
      "verse_id": "2.47",
      "theme": "Action Without Attachment",
      "text": "You have the right to perform your duties, but you are not entitled to the fruits of your actions...",
      "context": "This verse teaches the principle of performing one's duties without attachment to outcomes...",
      "language": "english",
      "applications": ["anxiety_management", "stress_reduction", "letting_go"]
    }
  ],
  "session_id": "abc-123-def-456",
  "language": "english",
  "conversation_length": 2
}
```

### 2. Get Conversation History

**GET** `/api/chat/history/{session_id}`

Retrieve the complete conversation history for a session.

**Response:**
```json
{
  "session_id": "abc-123-def-456",
  "messages": [
    {
      "role": "user",
      "content": "I'm feeling overwhelmed with work",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "I hear that you're feeling overwhelmed...",
      "timestamp": "2024-01-15T10:30:05.000Z"
    }
  ],
  "total_messages": 2
}
```

### 3. Clear Conversation

**DELETE** `/api/chat/history/{session_id}`

Clear the conversation history for a specific session.

**Response:**
```json
{
  "message": "Conversation history cleared for session abc-123-def-456",
  "session_id": "abc-123-def-456"
}
```

### 4. Start New Session

**POST** `/api/chat/start`

Start a new chat session and receive a session ID.

**Response:**
```json
{
  "session_id": "new-uuid-here",
  "message": "New chat session started. Use this session_id in your /message requests.",
  "expires": "Session will persist until cleared or server restart"
}
```

### 5. List Active Sessions

**GET** `/api/chat/sessions`

List all active chat sessions.

**Response:**
```json
[
  {
    "session_id": "session-1",
    "message_count": 4
  },
  {
    "session_id": "session-2",
    "message_count": 2
  }
]
```

### 6. Health Check

**GET** `/api/chat/health`

Check chatbot service health and configuration.

**Response:**
```json
{
  "status": "healthy",
  "openai_enabled": true,
  "fallback_mode": "ai-powered",
  "active_sessions": 5,
  "supported_languages": ["english", "hindi", "sanskrit"]
}
```

## Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# OpenAI API Key (optional - system works without it)
OPENAI_API_KEY=sk-your-api-key-here

# Database URL
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mindvibe
```

**Note**: The chatbot works with or without OpenAI API key:
- **With API key**: AI-powered, context-aware responses
- **Without API key**: Template-based, theme-specific guidance

### 2. Database Setup

Seed the database with wisdom verses:

```bash
python scripts/seed_wisdom.py
```

This populates the database with Bhagavad Gita verses in Sanskrit, Hindi, and English.

### 3. Start the Server

```bash
uvicorn main:app --reload
```

The chatbot API will be available at `http://localhost:8000/api/chat/`

### 4. API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

## Usage Examples

### Example 1: Starting a Conversation

```python
import requests

# Start a new session
response = requests.post("http://localhost:8000/api/chat/start")
session_id = response.json()["session_id"]

# Send first message
response = requests.post(
    "http://localhost:8000/api/chat/message",
    json={
        "message": "I'm struggling with anxiety about my future",
        "session_id": session_id,
        "language": "english"
    }
)

data = response.json()
print(f"Chatbot: {data['response']}")
print(f"\nRelevant Wisdom:")
for verse in data['verses']:
    print(f"- {verse['theme']}: {verse['text'][:100]}...")
```

### Example 2: Multi-Turn Conversation

```python
# Continue the conversation
messages = [
    "I'm struggling with anxiety about my future",
    "How can I stop worrying about things I can't control?",
    "That's helpful. What about when I feel overwhelmed by daily tasks?"
]

for msg in messages:
    response = requests.post(
        "http://localhost:8000/api/chat/message",
        json={
            "message": msg,
            "session_id": session_id
        }
    )
    print(f"\nUser: {msg}")
    print(f"Chatbot: {response.json()['response']}\n")
```

### Example 3: Hindi Language Support

```python
response = requests.post(
    "http://localhost:8000/api/chat/message",
    json={
        "message": "मुझे तनाव हो रहा है",
        "language": "hindi",
        "include_sanskrit": True
    }
)

data = response.json()
print(data['response'])
# Response will reference Hindi verses and include Sanskrit when relevant
```

### Example 4: Retrieving Conversation History

```python
# Get conversation history
response = requests.get(
    f"http://localhost:8000/api/chat/history/{session_id}"
)

history = response.json()
print(f"Total messages: {history['total_messages']}")
for msg in history['messages']:
    print(f"{msg['role']}: {msg['content']}")
```

## Mental Health Applications

The chatbot provides guidance for the following mental health concerns:

### Anxiety & Stress
- anxiety_management
- stress_reduction
- present_moment_focus
- letting_go
- worry_reduction

### Emotional Regulation
- emotional_regulation
- anger_management
- impulse_control
- distress_tolerance
- emotional_tolerance

### Depression & Mood
- depression_recovery
- inner_joy
- intrinsic_happiness
- inner_fulfillment
- hope_building

### Self-Development
- self_empowerment
- self_compassion
- personal_growth
- self_awareness
- consciousness_exploration

### Mindfulness & Meditation
- mindfulness
- mindfulness_practice
- meditation_support
- mental_stillness
- present_moment_awareness

### Resilience & Equanimity
- resilience
- equanimity
- acceptance
- impermanence_awareness
- inner_peace

### Focus & Discipline
- adhd_management
- racing_thoughts
- habit_formation
- behavioral_change
- self_discipline

### And many more...

## How It Works

### 1. Message Processing
```
User Message → Session Context → Semantic Search → Verse Selection → AI Response Generation
```

### 2. Conversation Context
The chatbot maintains conversation history (last 6 messages) to:
- Understand context and reference previous messages
- Provide coherent multi-turn dialogue
- Build on previous guidance
- Show empathy and understanding

### 3. AI Response Generation

**With OpenAI API Key:**
- Uses GPT-4 for natural, context-aware responses
- Strict system prompts ensure no religious terminology
- Conversational, empathetic tone
- Personalized to user's specific situation

**Without OpenAI API Key (Fallback):**
- Template-based responses matched to verse themes
- Still provides valuable guidance
- Contextual to the wisdom theme
- Actionable advice and steps

### 4. Cultural Sensitivity

The chatbot follows strict guidelines to ensure universal applicability:

**Prohibited Terms:**
- Krishna, Arjuna, Hindu deities
- "Lord", "God" (in religious context)
- "Divine", "Holy" (in religious context)
- Any religious or sectarian references

**Replacement Strategy:**
- "Krishna" → "the teacher"
- "Arjuna" → "the student"
- "God" → "inner wisdom"
- Religious concepts → Universal principles

### 5. Verse Selection Algorithm

1. **Keyword Matching**: Match query terms to verse themes
2. **Semantic Similarity**: Calculate text overlap between query and verse content
3. **Context Matching**: Compare query to verse application contexts
4. **Weighted Scoring**: Combine all factors for relevance score
5. **Top Results**: Return 3 most relevant verses

## Best Practices

### For Users

1. **Be Specific**: Describe your situation or concern clearly
2. **Continue Conversations**: Use the same session_id for related questions
3. **Try Different Languages**: Explore verses in Hindi or Sanskrit for authentic feel
4. **Reflect on Verses**: Take time to understand the wisdom teachings provided
5. **Take Action**: Implement the suggested guidance in your daily life

### For Developers

1. **Session Management**: In production, tie sessions to authenticated users
2. **Rate Limiting**: Implement rate limits to prevent API abuse
3. **Caching**: Cache verse searches for common queries
4. **Monitoring**: Track API usage and response times
5. **Privacy**: Don't log personal conversations
6. **Testing**: Test both AI-powered and fallback modes

## Privacy & Security

### Data Handling
- Conversation histories are stored in memory (not persisted)
- Sessions are cleared on server restart
- No conversation data is sent to external services except OpenAI (if configured)
- Users can clear their conversation history at any time

### OpenAI Integration
- Only when API key is configured
- Conversations sent to OpenAI for response generation
- System prompts ensure appropriate responses
- No personal data is stored by the application

### Recommendations
- In production, implement user authentication
- Encrypt sensitive data in transit and at rest
- Comply with healthcare data regulations (HIPAA, GDPR)
- Provide clear privacy policy to users
- Allow users to download/delete their data

## Troubleshooting

### Issue: "No relevant wisdom verses found"

**Solution**: 
- Ensure database is seeded: `python scripts/seed_wisdom.py`
- Check database connection
- Verify DATABASE_URL environment variable

### Issue: Template responses instead of AI responses

**Cause**: OpenAI API key not configured or invalid

**Solution**:
1. Check `.env` file has valid `OPENAI_API_KEY`
2. Verify API key is active on OpenAI platform
3. Check `/api/chat/health` endpoint to confirm status

### Issue: Conversation history lost

**Cause**: Server restart clears in-memory sessions

**Solution**: 
- In production, implement persistent session storage (Redis, PostgreSQL)
- For development, this is expected behavior

### Issue: Responses contain religious terms

**Cause**: Verse not properly sanitized in English translation

**Solution**:
1. Check `data/wisdom/verses.json` for religious terms in English text
2. Update the verse entry with sanitized language
3. Re-run `python scripts/seed_wisdom.py`
4. Or rely on the `WisdomKnowledgeBase.sanitize_text()` method

## Future Enhancements

### Planned Features
- [ ] **Persistent Sessions**: Store conversations in database
- [ ] **User Authentication**: Tie sessions to user accounts
- [ ] **Voice Interface**: Voice input/output for conversations
- [ ] **Verse Recommendations**: Proactive verse suggestions
- [ ] **Daily Wisdom**: Scheduled wisdom notifications
- [ ] **Progress Tracking**: Track user's mental health journey
- [ ] **Advanced Search**: Use sentence-transformers for embeddings
- [ ] **Multi-Modal**: Support images, videos, audio recordings
- [ ] **Crisis Detection**: Identify crisis situations and provide resources
- [ ] **Therapist Integration**: Option to connect with human therapist

### Potential Integrations
- Mental health assessment tools
- Mood tracking visualization
- Journaling features
- Meditation timers
- Community support forums
- Professional therapist referrals

## Support & Contribution

### Getting Help
- Check the documentation first
- Review API documentation at `/docs`
- Check server logs for error details
- Test with `/api/chat/health` endpoint

### Contributing
- Add more wisdom verses to `data/wisdom/verses.json`
- Improve semantic search algorithms
- Enhance template responses
- Add support for more languages
- Improve documentation

## Disclaimer

**Important**: This chatbot provides guidance based on universal wisdom principles and is intended for **general mental health support only**. It is **not a substitute for professional mental health care**.

### When to Seek Professional Help
- If you're experiencing severe depression or anxiety
- If you're having thoughts of self-harm or suicide
- If mental health issues interfere with daily functioning
- If you need diagnosis or treatment for a mental health condition

### Crisis Resources
- **National Suicide Prevention Lifeline**: 988 (US)
- **Crisis Text Line**: Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

---

**Remember**: This chatbot is here to support your mental wellness journey with timeless wisdom, but professional mental health care is irreplaceable when needed.
