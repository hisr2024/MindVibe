# Quick Start Guide: AI Vibe Bot

## Prerequisites

1. Python 3.10+
2. PostgreSQL database running
3. (Optional) OpenAI API key for AI-powered responses

## Installation Steps

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create or update your `.env` file:

```bash
# Required
DATABASE_URL=postgresql+asyncpg://mindvibe:password@db:5432/mindvibe

# Optional - for AI-powered responses
OPENAI_API_KEY=sk-your-api-key-here

# Frontend (if applicable)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Seed the Database

Load the wisdom verses into your database:

```bash
python scripts/seed_wisdom.py
```

Expected output:
```
Loaded 10 verses from data/wisdom/verses.json
Inserted verse 2.47
Inserted verse 2.56
...
Wisdom verses seeding completed!
```

### 4. Start the API Server

```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Using the API

### Example 1: Query for Guidance

```bash
curl -X POST http://localhost:8000/api/wisdom/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I feel anxious about my future and cannot stop worrying",
    "language": "english",
    "include_sanskrit": false
  }'
```

Response:
```json
{
  "response": "Your concern touches on a fundamental principle of inner peace: learning to act without being attached to outcomes. This ancient wisdom teaches us to focus on our efforts and actions, which we can control, rather than results, which we cannot...",
  "verses": [
    {
      "verse_id": "2.47",
      "theme": "Action Without Attachment",
      "text": "You have the right to perform your duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, nor be attached to not doing your duty.",
      "context": "This verse teaches the principle of performing one's duties without attachment to outcomes, a key concept for reducing anxiety and maintaining inner peace.",
      "language": "english",
      "applications": ["anxiety_management", "stress_reduction", "letting_go", "present_moment_focus"]
    }
  ],
  "language": "english"
}
```

### Example 2: Get Available Themes

```bash
curl http://localhost:8000/api/wisdom/themes
```

Response:
```json
{
  "themes": [
    {"id": "action_without_attachment", "name": "Action Without Attachment"},
    {"id": "control_of_mind", "name": "Control Of Mind"},
    {"id": "equanimity_in_adversity", "name": "Equanimity In Adversity"},
    ...
  ]
}
```

### Example 3: Get Specific Verse in Hindi

```bash
curl "http://localhost:8000/api/wisdom/verses/2.47?language=hindi&include_sanskrit=true"
```

Response:
```json
{
  "verse_id": "2.47",
  "theme": "Action Without Attachment",
  "text": "तुम्हारा अधिकार केवल कर्म करने में है, फल में कभी नहीं...",
  "context": "This verse teaches the principle of performing one's duties...",
  "language": "hindi",
  "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन...",
  "applications": ["anxiety_management", "stress_reduction", "letting_go", "present_moment_focus"]
}
```

## Python Client Example

```python
import requests

class WisdomClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def query(self, question, language="english", include_sanskrit=False):
        """Ask a question and get wisdom guidance."""
        response = requests.post(
            f"{self.base_url}/api/wisdom/query",
            json={
                "query": question,
                "language": language,
                "include_sanskrit": include_sanskrit
            }
        )
        return response.json()
    
    def get_themes(self):
        """Get all available wisdom themes."""
        response = requests.get(f"{self.base_url}/api/wisdom/themes")
        return response.json()
    
    def get_verse(self, verse_id, language="english", include_sanskrit=False):
        """Get a specific verse by ID."""
        response = requests.get(
            f"{self.base_url}/api/wisdom/verses/{verse_id}",
            params={
                "language": language,
                "include_sanskrit": include_sanskrit
            }
        )
        return response.json()

# Usage
client = WisdomClient()

# Ask a question
result = client.query("How can I stay calm during difficult times?")
print(result["response"])
for verse in result["verses"]:
    print(f"\nVerse {verse['verse_id']}: {verse['theme']}")
    print(verse["text"])

# List themes
themes = client.get_themes()
print("\nAvailable themes:")
for theme in themes["themes"]:
    print(f"  - {theme['name']}")

# Get specific verse
verse = client.get_verse("2.47", language="english", include_sanskrit=True)
print(f"\nVerse: {verse['text']}")
print(f"Sanskrit: {verse.get('sanskrit', 'N/A')}")
```

## JavaScript/TypeScript Client Example

```typescript
interface WisdomQuery {
  query: string;
  language?: 'english' | 'hindi' | 'sanskrit';
  include_sanskrit?: boolean;
}

interface WisdomResponse {
  response: string;
  verses: Array<{
    verse_id: string;
    theme: string;
    text: string;
    context: string;
    language: string;
    sanskrit?: string;
    applications: string[];
  }>;
  language: string;
}

class WisdomClient {
  constructor(private baseUrl: string = 'http://localhost:8000') {}

  async query(queryData: WisdomQuery): Promise<WisdomResponse> {
    const response = await fetch(`${this.baseUrl}/api/wisdom/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryData)
    });
    return response.json();
  }

  async getThemes() {
    const response = await fetch(`${this.baseUrl}/api/wisdom/themes`);
    return response.json();
  }

  async getVerse(
    verseId: string,
    language: string = 'english',
    includeSanskrit: boolean = false
  ) {
    const params = new URLSearchParams({
      language,
      include_sanskrit: String(includeSanskrit)
    });
    const response = await fetch(
      `${this.baseUrl}/api/wisdom/verses/${verseId}?${params}`
    );
    return response.json();
  }
}

// Usage
const client = new WisdomClient();

client.query({
  query: 'How do I deal with anger?',
  language: 'english'
}).then(result => {
  console.log('Guidance:', result.response);
  result.verses.forEach(verse => {
    console.log(`\nVerse ${verse.verse_id}: ${verse.theme}`);
    console.log(verse.text);
  });
});
```

## Integration with Frontend

### React Component Example

```typescript
import { useState } from 'react';

export function WisdomChatbot() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const askWisdom = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wisdom/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: 'english' })
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wisdom-chatbot">
      <h2>AI Vibe Bot</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What's on your mind?"
      />
      <button onClick={askWisdom} disabled={loading}>
        {loading ? 'Searching...' : 'Ask for Wisdom'}
      </button>
      
      {response && (
        <div className="response">
          <div className="guidance">
            <h3>Guidance</h3>
            <p>{response.response}</p>
          </div>
          
          <div className="verses">
            <h3>Relevant Wisdom</h3>
            {response.verses.map(verse => (
              <div key={verse.verse_id} className="verse">
                <h4>{verse.theme}</h4>
                <p>{verse.text}</p>
                <small>Applications: {verse.applications.join(', ')}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Testing

Run the verification script to ensure everything is set up correctly:

```bash
python scripts/verify_wisdom.py
```

Expected output:
```
============================================================
Wisdom Guide Implementation Verification
============================================================

[1/5] Testing model imports...
✓ WisdomVerse model imported successfully

[2/5] Testing service imports...
✓ WisdomKnowledgeBase service imported successfully

[3/5] Testing text sanitization...
✓ Text sanitization works correctly

[4/5] Testing text similarity...
✓ Text similarity computation works

[5/5] Testing verse data loading...
✓ Verse data loaded and validated

============================================================
All verification tests passed! ✓
============================================================
```

### Running the Full Test Suite

MindVibe includes comprehensive unit and integration tests. To run all tests:

```bash
# Run all tests
python -m pytest tests/

# Run with coverage report
python -m pytest tests/ --cov=. --cov-report=html

# Run specific test categories
python -m pytest tests/unit/              # Unit tests only
python -m pytest tests/integration/       # Integration tests only

# Run specific test files
python -m pytest tests/unit/test_wisdom_kb.py
python -m pytest tests/integration/test_wisdom_guide_api.py

# Verbose mode
python -m pytest tests/ -v
```

The test suite covers:
- **Unit tests**: Models, services (wisdom_kb.py), and utilities
- **Integration tests**: API endpoints (wisdom_guide, journal, moods, content)
- **Coverage**: Overall test coverage is tracked and reported

All tests use an in-memory SQLite database, so no external database setup is required for testing.

## Troubleshooting

### Database Connection Error
```
ERROR: Connection to database failed
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct in .env

### No Verses Found
```
404: No relevant wisdom verses found
```
**Solution**: Run `python scripts/seed_wisdom.py` to populate the database

### OpenAI API Error
```
OpenAI API error: Rate limit exceeded
```
**Solution**: This is normal. The system will fall back to template responses.

### Import Errors
```
ModuleNotFoundError: No module named 'openai'
```
**Solution**: Run `pip install -r requirements.txt`

## Common Spiritual Wellness Applications

The wisdom verses cover these applications:

- **Anxiety**: anxiety_management, stress_reduction, worry
- **Emotional**: emotional_regulation, emotional_tolerance
- **Mind Control**: racing_thoughts, impulse_control, adhd_management
- **Peace**: inner_peace, mental_stillness, contentment
- **Growth**: personal_growth, self_empowerment, self_discipline
- **Mindfulness**: present_moment_focus, mindfulness, meditation
- **Resilience**: resilience, persistence, equanimity

Use these keywords in your queries for best results.

## Support

For more details, see:
- `docs/wisdom_guide.md` - Full API documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `data/wisdom/verses.json` - All available verses

## Adding More Verses

To add new wisdom verses:

1. Edit `data/wisdom/verses.json`
2. Add new verse entry following the existing structure
3. Run `python scripts/seed_wisdom.py` to update database
4. Restart the API server

Example verse structure:
```json
{
  "verse_id": "X.YY",
  "chapter": X,
  "verse_number": YY,
  "theme": "theme_name",
  "english": "Universal wisdom text...",
  "hindi": "हिन्दी अनुवाद...",
  "sanskrit": "संस्कृत श्लोक...",
  "context": "Explanation...",
  "mental_health_applications": ["app1", "app2"]
}
```

Remember to sanitize any religious references in the English text!
