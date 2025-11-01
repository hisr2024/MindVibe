# AI Vibe Bot

## Overview

The AI Vibe Bot provides AI-powered mental health guidance based on timeless wisdom teachings from the Bhagavad Gita, presented in a universally applicable, non-religious way.

## Features

- **Universal Presentation**: All wisdom is sanitized to remove religious references and presented as timeless principles
- **Multi-language Support**: Access wisdom in English, Hindi, or Sanskrit
- **Semantic Search**: Find relevant verses for specific mental health concerns
- **AI-Powered Responses**: Get personalized guidance using GPT-4 (when configured)
- **Mental Health Applications**: Each verse is tagged with applicable mental health topics

## API Endpoints

### POST `/api/wisdom/query`

Query the wisdom guide with a question or concern.

**Request Body:**
```json
{
  "query": "How can I deal with anxiety?",
  "language": "english",
  "include_sanskrit": false
}
```

**Response:**
```json
{
  "response": "AI-generated guidance...",
  "verses": [
    {
      "verse_id": "2.47",
      "theme": "Action Without Attachment",
      "text": "You have the right to perform your duties...",
      "context": "This verse teaches the principle...",
      "language": "english",
      "applications": ["anxiety_management", "stress_reduction"]
    }
  ],
  "language": "english"
}
```

### GET `/api/wisdom/themes`

List all available wisdom themes.

**Response:**
```json
{
  "themes": [
    {
      "id": "action_without_attachment",
      "name": "Action Without Attachment"
    }
  ]
}
```

### GET `/api/wisdom/verses/{verse_id}`

Get a specific verse by ID.

**Query Parameters:**
- `language`: english, hindi, or sanskrit (default: english)
- `include_sanskrit`: boolean (default: false)

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for AI-powered responses (optional)
  - If not set, the system will use template-based responses

### Database Setup

Run the seed script to populate wisdom verses:

```bash
python scripts/seed_wisdom.py
```

## Implementation Details

### Sanitization

The `WisdomKnowledgeBase` service automatically sanitizes religious references:

- "Krishna" → "the teacher"
- "Arjuna" → "the student"  
- "Lord" → "the wise one"
- "God" → "inner wisdom"
- "Divine" → "universal"

### Verse Data Structure

Verses are stored in `data/wisdom/verses.json` with the following structure:

```json
{
  "verse_id": "2.47",
  "chapter": 2,
  "verse_number": 47,
  "theme": "action_without_attachment",
  "english": "English translation...",
  "hindi": "हिन्दी अनुवाद...",
  "sanskrit": "संस्कृत श्लोक...",
  "context": "Explanation of the verse...",
  "mental_health_applications": ["anxiety_management", "stress_reduction"]
}
```

## Mental Health Applications

The following mental health applications are supported:

- anxiety_management
- stress_reduction
- letting_go
- present_moment_focus
- emotional_regulation
- resilience
- mindfulness
- equanimity
- anger_management
- addiction_recovery
- impulse_control
- cognitive_awareness
- self_empowerment
- depression_recovery
- self_compassion
- personal_growth
- meditation_support
- adhd_management
- racing_thoughts
- mindfulness_practice
- habit_formation
- behavioral_change
- persistence
- self_discipline
- acceptance
- emotional_tolerance
- distress_tolerance
- impermanence_awareness
- inner_peace
- contentment
- desire_management
- mental_stillness
- self_awareness
- metacognition
- inner_wisdom
- consciousness_exploration
- intrinsic_happiness
- inner_fulfillment

## Usage Example

```python
import requests

response = requests.post(
    "http://localhost:8000/api/wisdom/query",
    json={
        "query": "I feel overwhelmed by my responsibilities",
        "language": "english",
        "include_sanskrit": False
    }
)

data = response.json()
print(data["response"])
for verse in data["verses"]:
    print(f"\n{verse['theme']}: {verse['text']}")
```

## Adding New Verses

1. Edit `data/wisdom/verses.json`
2. Add new verse entries following the existing structure
3. Ensure religious references are already sanitized in the English text
4. Run `python scripts/seed_wisdom.py` to update the database

## Future Enhancements

- Embedding-based semantic search using sentence-transformers
- User-specific verse recommendations based on history
- Daily wisdom notifications
- Verse bookmarking and favorites
- Audio versions of verses in different languages
