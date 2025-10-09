# AI Chatbot Feature - Bhagavad Gita Wisdom for Mental Health

## Overview

This feature implements an AI-powered chatbot that provides mental health guidance based on the timeless wisdom of the Bhagavad Gita. The chatbot:

- Draws exclusively from authentic Bhagavad Gita teachings
- Avoids direct references to specific individuals (using terms like "the teacher" and "the student")
- Applies ancient wisdom to modern mental health challenges
- Provides practical, actionable guidance

## Features

1. **Multi-language Support**: Responses available in English, Hindi, and Sanskrit
2. **Semantic Search**: Uses embeddings to find the most relevant verses for each query
3. **AI-Powered Responses**: Integrates with OpenAI GPT-4/GPT-3.5 for contextual responses
4. **Verse References**: Returns both the AI response and relevant Bhagavad Gita verses
5. **Fallback Mode**: Works without OpenAI API using keyword-based search

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo
DATABASE_URL=postgresql+asyncpg://navi:navi@db:5432/navi
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Key dependencies:
- `openai>=1.0.0` - For AI response generation and embeddings
- `asyncpg>=0.29.0` - For PostgreSQL async support

### 3. Seed the Database

Load the Bhagavad Gita verses into the database:

```bash
python seed_gita.py
```

This will:
- Create the necessary database tables
- Load verses from `data/gita_verses.json`
- Generate embeddings for semantic search (if OpenAI API key is set)

## API Usage

### Endpoint: POST `/chat/message`

Send a message to the chatbot and receive AI-generated guidance with relevant verses.

**Request Body:**

```json
{
  "query": "I'm feeling anxious about my future and can't focus on my work",
  "language": "en"
}
```

**Parameters:**
- `query` (string, required): The user's question or concern
- `language` (string, optional): Response language - "en" (English), "hi" (Hindi), or "sa" (Sanskrit). Default: "en"

**Response:**

```json
{
  "response": "When anxiety about the future distracts you from present duties, remember this teaching: Focus on your actions rather than worrying about outcomes...",
  "verses": [
    {
      "chapter": 2,
      "verse": 47,
      "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन...",
      "english": "You have the right to perform your prescribed duties...",
      "hindi": "तुम्हारा अधिकार केवल कर्म करने में है...",
      "principle": "detachment_action",
      "theme": "duty, action, detachment",
      "relevance_score": 0.87
    }
  ],
  "language": "en"
}
```

### Example Requests

**English:**
```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Auth-UID: user123" \
  -d '{"query": "How do I deal with anger?", "language": "en"}'
```

**Hindi:**
```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Auth-UID: user123" \
  -d '{"query": "मैं क्रोध से कैसे निपटूं?", "language": "hi"}'
```

## Architecture

### Components

1. **GitaVerse Model** (`models.py`): Database model for storing verses with embeddings
2. **GitaKnowledgeBase Service** (`services/gita_kb.py`): 
   - Verse loading and management
   - Embedding generation
   - Semantic and keyword search
3. **Chat Router** (`routes/chat.py`): API endpoint for chat interactions
4. **Chat Schemas** (`schemas.py`): Pydantic models for request/response validation

### Data Flow

1. User sends query via POST `/chat/message`
2. System generates embedding for the query (if OpenAI available)
3. Knowledge base searches for most relevant verses using cosine similarity
4. AI generates contextual response based on query and verses
5. Response returned with AI-generated text and verse references

### Search Strategy

- **Primary**: Semantic search using OpenAI embeddings (cosine similarity)
- **Fallback**: Keyword-based search when embeddings unavailable
- **Default**: Returns general verses if no match found

## Database Schema

```sql
CREATE TABLE gita_verses (
    id SERIAL PRIMARY KEY,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    sanskrit TEXT NOT NULL,
    english TEXT NOT NULL,
    hindi TEXT NOT NULL,
    principle VARCHAR(64) NOT NULL,
    theme VARCHAR(256) NOT NULL,
    embedding TEXT,  -- JSON array of floats
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gita_chapter ON gita_verses(chapter);
CREATE INDEX idx_gita_verse ON gita_verses(verse);
CREATE INDEX idx_gita_principle ON gita_verses(principle);
```

## Customization

### Adding More Verses

Edit `data/gita_verses.json` and add verses in the following format:

```json
{
  "chapter": 2,
  "verse": 47,
  "sanskrit": "sanskrit text",
  "english": "english translation",
  "hindi": "hindi translation",
  "principle": "principle_name",
  "theme": "comma, separated, themes"
}
```

Then run `python seed_gita.py` to update the database.

### Adjusting AI Behavior

Edit the system prompt in `routes/chat.py` (`generate_ai_response` function) to adjust:
- Tone and style
- Response length
- Focus areas
- Cultural adaptations

### Search Parameters

In `services/gita_kb.py`, adjust:
- `limit` parameter in `search_relevant_verses()` for number of verses returned
- Similarity thresholds for filtering results
- Keyword scoring weights

## Testing

### 1. Run Basic Tests

Run the test suite to verify the implementation:

```bash
python test_chatbot.py
```

This tests:
- Verse data loading from JSON
- Cosine similarity calculations
- Fallback response generation
- Schema definitions

### 2. Start the Server

```bash
# Make sure you're in the project root
cd /home/runner/work/MindVibe/MindVibe

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`

### 3. Interactive Testing

Use the example script for interactive testing:

```bash
python example_chatbot_usage.py
```

This provides an interactive interface to test the chatbot with various queries.

### 4. API Testing with curl

Test the API directly:

```bash
# Test with English
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Auth-UID: dev-user" \
  -d '{"query": "How do I deal with anxiety?", "language": "en"}'

# Test with Hindi
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Auth-UID: dev-user" \
  -d '{"query": "मैं चिंता से कैसे निपटूं?", "language": "hi"}'
```

The chatbot can be tested without OpenAI API key:
1. It will use keyword-based search instead of semantic search
2. It will provide fallback responses with verse summaries
3. All functionality works, just with reduced intelligence

With OpenAI API key:
- Full semantic search using embeddings
- AI-generated contextual responses
- Better relevance matching

## Privacy and Security

- User queries are sent to OpenAI API (when configured)
- Verse data is stored locally in the database
- No user data is stored in chat logs by default
- Authentication handled via `X-Auth-UID` header

## Limitations

1. Requires OpenAI API key for full functionality
2. API rate limits apply to OpenAI calls
3. Semantic search requires embeddings to be pre-generated
4. Response quality depends on verse database completeness

## Future Enhancements

- [ ] Add conversation history/context
- [ ] Implement verse recommendations based on user mood
- [ ] Add more verses from all 18 chapters
- [ ] Support for verse commentary and context
- [ ] Integration with mood tracking for personalized guidance
- [ ] Caching for frequently asked questions
- [ ] Support for other ancient texts (Upanishads, etc.)
