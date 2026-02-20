# Wisdom API Reference

The Wisdom API provides access to universal wisdom verses from ancient teachings, presented in a secular, universally applicable way. The API supports semantic search, filtering by themes and spiritual wellness applications, and multi-language support (English, Hindi, Sanskrit).

## Base URL

```
http://localhost:8000/api/wisdom
```

For production deployments, replace with your actual domain.

## Authentication

Currently, the Wisdom API endpoints are public and do not require authentication. For production use, consider implementing appropriate authentication mechanisms.

## Endpoints Overview

- **GET /verses** - List wisdom verses with filtering and pagination
- **GET /verses/{verse_id}** - Get a specific verse by ID
- **POST /search** - Perform semantic search over wisdom content
- **POST /query** - Get AI-powered guidance with relevant verses
- **GET /themes** - List all available themes
- **GET /applications** - List all spiritual wellness applications

---

## Endpoint Details

### 1. List Wisdom Verses

```http
GET /api/wisdom/verses
```

List wisdom verses with optional filtering and pagination.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | `english` | Preferred language: `english`, `hindi`, or `sanskrit` |
| `theme` | string | none | Filter by specific theme (e.g., `action_without_attachment`) |
| `application` | string | none | Filter by spiritual wellness application (e.g., `anxiety_management`) |
| `include_sanskrit` | boolean | `false` | Include Sanskrit text in response |
| `limit` | integer | `10` | Number of verses to return (1-100) |
| `offset` | integer | `0` | Number of verses to skip for pagination |

#### Response

```json
{
  "verses": [
    {
      "verse_id": "2.47",
      "theme": "Action Without Attachment",
      "text": "You have the right to perform your duties...",
      "context": "This verse teaches the principle of...",
      "language": "english",
      "applications": ["anxiety_management", "stress_reduction"]
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0,
  "has_more": true
}
```

#### Examples

**Get first 5 verses:**
```bash
curl http://localhost:8000/api/wisdom/verses?limit=5
```

**Get verses about equanimity:**
```bash
curl http://localhost:8000/api/wisdom/verses?theme=equanimity_in_adversity
```

**Get verses for anxiety management:**
```bash
curl http://localhost:8000/api/wisdom/verses?application=anxiety_management
```

**Get Hindi verses with Sanskrit:**
```bash
curl "http://localhost:8000/api/wisdom/verses?language=hindi&include_sanskrit=true"
```

**Pagination example (page 2):**
```bash
curl http://localhost:8000/api/wisdom/verses?limit=10&offset=10
```

---

### 2. Get Specific Verse

```http
GET /api/wisdom/verses/{verse_id}
```

Retrieve a specific wisdom verse by its ID.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `verse_id` | string | Verse identifier (e.g., `2.47`, `6.35`) |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | `english` | Preferred language |
| `include_sanskrit` | boolean | `false` | Include Sanskrit text |

#### Response

```json
{
  "verse_id": "2.47",
  "theme": "Action Without Attachment",
  "text": "You have the right to perform your duties...",
  "context": "This verse teaches the principle of performing one's duties...",
  "language": "english",
  "applications": ["anxiety_management", "stress_reduction", "emotional_resilience"]
}
```

#### Examples

**Get verse in English:**
```bash
curl http://localhost:8000/api/wisdom/verses/2.47
```

**Get verse with Sanskrit:**
```bash
curl http://localhost:8000/api/wisdom/verses/2.47?include_sanskrit=true
```

**Get verse in Hindi:**
```bash
curl http://localhost:8000/api/wisdom/verses/2.47?language=hindi
```

---

### 3. Semantic Search

```http
POST /api/wisdom/search
```

Perform semantic search to find the most relevant verses for a query.

#### Request Body

```json
{
  "query": "how to deal with anxiety and stress"
}
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | string | `english` | Preferred language for results |
| `theme` | string | none | Filter results by specific theme |
| `application` | string | none | Filter results by spiritual wellness application |
| `include_sanskrit` | boolean | `false` | Include Sanskrit text in results |
| `limit` | integer | `5` | Number of results to return (1-20) |

#### Response

```json
{
  "query": "how to deal with anxiety and stress",
  "results": [
    {
      "verse_id": "2.47",
      "theme": "Action Without Attachment",
      "text": "You have the right to perform your duties...",
      "context": "This verse teaches the principle of...",
      "language": "english",
      "applications": ["anxiety_management", "stress_reduction"],
      "relevance_score": 0.847
    }
  ],
  "total_results": 3,
  "language": "english"
}
```

The `relevance_score` ranges from 0 to 1, with higher scores indicating greater relevance.

#### Examples

**Basic search:**
```bash
curl -X POST http://localhost:8000/api/wisdom/search \
  -H "Content-Type: application/json" \
  -d '{"query": "how to find inner peace"}'
```

**Search with limit:**
```bash
curl -X POST "http://localhost:8000/api/wisdom/search?limit=3" \
  -H "Content-Type: application/json" \
  -d '{"query": "managing stress at work"}'
```

**Search filtered by theme:**
```bash
curl -X POST "http://localhost:8000/api/wisdom/search?theme=control_of_mind" \
  -H "Content-Type: application/json" \
  -d '{"query": "controlling my thoughts"}'
```

**Search filtered by application:**
```bash
curl -X POST "http://localhost:8000/api/wisdom/search?application=anxiety_management" \
  -H "Content-Type: application/json" \
  -d '{"query": "feeling worried all the time"}'
```

**Search in Hindi:**
```bash
curl -X POST "http://localhost:8000/api/wisdom/search?language=hindi" \
  -H "Content-Type: application/json" \
  -d '{"query": "मन की शांति कैसे पाएं"}'
```

---

### 4. AI-Powered Wisdom Query

```http
POST /api/wisdom/query
```

Get AI-powered guidance based on your question, along with relevant wisdom verses.

#### Request Body

```json
{
  "query": "I'm feeling anxious about my future",
  "language": "english",
  "include_sanskrit": false
}
```

#### Response

```json
{
  "response": "Your concern about the future is a common human experience...",
  "verses": [
    {
      "verse_id": "2.47",
      "theme": "Action Without Attachment",
      "text": "You have the right to perform your duties...",
      "context": "This verse teaches the principle of...",
      "language": "english",
      "applications": ["anxiety_management", "stress_reduction"]
    }
  ],
  "language": "english"
}
```

The `response` field contains AI-generated guidance (when OpenAI API is configured) or a template-based response.

#### Examples

**Basic query:**
```bash
curl -X POST http://localhost:8000/api/wisdom/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I am feeling stressed about work",
    "language": "english"
  }'
```

**Query with Sanskrit:**
```bash
curl -X POST http://localhost:8000/api/wisdom/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How can I stay calm under pressure?",
    "include_sanskrit": true
  }'
```

**Query in Hindi:**
```bash
curl -X POST http://localhost:8000/api/wisdom/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "मुझे काम में तनाव हो रहा है",
    "language": "hindi"
  }'
```

---

### 5. List Themes

```http
GET /api/wisdom/themes
```

Get a list of all available wisdom themes.

#### Response

```json
{
  "themes": [
    {
      "id": "action_without_attachment",
      "name": "Action Without Attachment"
    },
    {
      "id": "equanimity_in_adversity",
      "name": "Equanimity In Adversity"
    },
    {
      "id": "control_of_mind",
      "name": "Control Of Mind"
    }
  ]
}
```

#### Example

```bash
curl http://localhost:8000/api/wisdom/themes
```

---

### 6. List Spiritual Wellness Applications

```http
GET /api/wisdom/applications
```

Get a list of all spiritual wellness applications covered by wisdom verses.

#### Response

```json
{
  "applications": [
    "anxiety_management",
    "emotional_regulation",
    "emotional_resilience",
    "meditation",
    "mindfulness",
    "resilience_building",
    "stress_management",
    "stress_reduction"
  ],
  "total": 8
}
```

#### Example

```bash
curl http://localhost:8000/api/wisdom/applications
```

---

## Common Themes

The wisdom database includes verses on the following themes:

- **action_without_attachment** - Performing duties without attachment to outcomes
- **equanimity_in_adversity** - Maintaining mental balance in all circumstances
- **control_of_mind** - Managing thoughts and mental patterns
- **self_empowerment** - Building inner strength and self-reliance
- **mastering_the_mind** - Developing mental discipline
- **practice_and_persistence** - Consistent effort and dedication
- **impermanence** - Understanding the temporary nature of experiences
- **inner_peace** - Finding tranquility from within
- **self_knowledge** - Understanding oneself deeply
- **inner_joy** - Accessing happiness independent of external circumstances

## Spiritual Wellness Applications

Verses are tagged with spiritual wellness applications including:

- **anxiety_management** - Managing worry and anxious thoughts
- **stress_reduction** - Reducing and coping with stress
- **emotional_regulation** - Managing emotional responses
- **emotional_resilience** - Building emotional strength
- **mindfulness** - Developing present-moment awareness
- **meditation** - Supporting meditation practice
- **resilience_building** - Developing psychological resilience
- **stress_management** - Coping with stressful situations

## Error Responses

All endpoints return standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (resource doesn't exist) |
| 422 | Validation Error (invalid request body) |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Interactive Documentation

FastAPI provides interactive API documentation at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to:
- Explore all endpoints
- View request/response schemas
- Test API calls directly in your browser
- See example requests and responses

## Rate Limiting

Currently, there are no rate limits on the API. For production deployments, consider implementing rate limiting to prevent abuse.

## Best Practices

### 1. Pagination
Always use pagination for list endpoints to avoid large responses:
```bash
# Good: Request small pages
curl "http://localhost:8000/api/wisdom/verses?limit=10&offset=0"

# Avoid: Requesting all verses at once
curl "http://localhost:8000/api/wisdom/verses?limit=100"
```

### 2. Caching
The wisdom data is relatively static. Consider caching responses for:
- Theme lists
- Application lists
- Individual verses

### 3. Search Specificity
For better semantic search results, use specific queries:
```bash
# Good: Specific query
{"query": "how to manage work-related anxiety and stress"}

# Less effective: Vague query
{"query": "help me"}
```

### 4. Language Selection
Always specify the language parameter when you know your user's preference:
```bash
curl "http://localhost:8000/api/wisdom/verses?language=hindi"
```

### 5. Error Handling
Always handle potential errors gracefully in your client code:
```javascript
try {
  const response = await fetch('/api/wisdom/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: userInput })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API error:', error.detail);
    // Handle error appropriately
  }
  
  const data = await response.json();
  // Process successful response
} catch (error) {
  console.error('Network error:', error);
  // Handle network errors
}
```

## Examples in Different Languages

### Python

```python
import requests

# List verses with filtering
response = requests.get(
    'http://localhost:8000/api/wisdom/verses',
    params={
        'theme': 'action_without_attachment',
        'language': 'english',
        'limit': 5
    }
)
verses = response.json()

# Semantic search
response = requests.post(
    'http://localhost:8000/api/wisdom/search',
    json={'query': 'dealing with anxiety'},
    params={'limit': 3}
)
results = response.json()
```

### JavaScript (fetch)

```javascript
// List verses
const verses = await fetch(
  'http://localhost:8000/api/wisdom/verses?limit=5'
).then(r => r.json());

// Semantic search
const searchResults = await fetch(
  'http://localhost:8000/api/wisdom/search?limit=3',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'managing stress' })
  }
).then(r => r.json());

// Get specific verse
const verse = await fetch(
  'http://localhost:8000/api/wisdom/verses/2.47?include_sanskrit=true'
).then(r => r.json());
```

### cURL

```bash
# List all themes
curl http://localhost:8000/api/wisdom/themes

# Search for verses about peace
curl -X POST http://localhost:8000/api/wisdom/search \
  -H "Content-Type: application/json" \
  -d '{"query": "finding inner peace"}'

# Get wisdom guidance
curl -X POST http://localhost:8000/api/wisdom/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I feel overwhelmed by life",
    "language": "english",
    "include_sanskrit": false
  }'
```

## Support

For issues, questions, or contributions:
- **GitHub Issues**: [https://github.com/hisr2024/MindVibe/issues](https://github.com/hisr2024/MindVibe/issues)
- **Documentation**: See `/docs` directory in the repository

## Version History

- **v1.0.0** - Initial release with full CRUD operations, semantic search, and filtering capabilities
