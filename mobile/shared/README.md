# Shared Mobile Resources

This directory contains shared resources, documentation, and specifications for both Android and iOS applications.

## 📁 Contents

### API Specifications
- OpenAPI/Swagger specifications for code generation
- Shared data models and schemas
- API endpoint documentation

### Utilities
- Common constants (API endpoints, timeout values, etc.)
- Error codes and handling
- Validation rules

### Documentation
- API integration guides
- Platform-agnostic business logic documentation
- Common flows and use cases

## 🔗 API Client Generation

Both Android and iOS apps can generate type-safe API clients from OpenAPI specifications.

### Android (OpenAPI Generator)

```bash
openapi-generator generate \
  -i ../../backend/openapi.json \
  -g kotlin \
  -o generated/kotlin \
  --additional-properties=library=jvm-retrofit2
```

### iOS (OpenAPI Generator)

```bash
openapi-generator generate \
  -i ../../backend/openapi.json \
  -g swift5 \
  -o generated/swift \
  --additional-properties=library=urlsession
```

## 📝 Common Data Models

### User Model
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2024-01-02T19:45:00Z",
  "preferences": {
    "language": "en",
    "theme": "auto"
  }
}
```

### Mood Entry Model
```json
{
  "id": "uuid",
  "score": 7,
  "tags": ["happy", "energetic"],
  "note": "Had a great day!",
  "timestamp": "2024-01-02T19:45:00Z",
  "user_id": "uuid"
}
```

### Chat Message Model
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "role": "user",
  "content": "I'm feeling anxious",
  "timestamp": "2024-01-02T19:45:00Z",
  "metadata": {
    "language": "en",
    "sentiment": "negative"
  }
}
```

### Bhagavad Gita Verse Model
```json
{
  "id": "2.47",
  "chapter": 2,
  "verse_number": 47,
  "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
  "transliteration": "karmaṇy evādhikāras te mā phaleṣu kadācana",
  "translation": {
    "en": "You have the right to perform your duties, but not to the fruits of your actions.",
    "hi": "तुम्हारा कर्म करने में अधिकार है, परन्तु फल में कभी नहीं।"
  },
  "mental_health_tags": ["anxiety", "outcome_detachment", "work_stress"]
}
```

## 🌐 Language Codes

ISO 639-1 language codes used across the platform:

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| hi | Hindi | हिन्दी |
| ta | Tamil | தமிழ் |
| te | Telugu | తెలుగు |
| bn | Bengali | বাংলা |
| mr | Marathi | मराठी |
| gu | Gujarati | ગુજરાતી |
| kn | Kannada | ಕನ್ನಡ |
| ml | Malayalam | മലയാളം |
| pa | Punjabi | ਪੰਜਾਬੀ |
| sa | Sanskrit | संस्कृत |
| es | Spanish | Español |
| fr | French | Français |
| de | German | Deutsch |
| pt | Portuguese | Português |
| ja | Japanese | 日本語 |
| zh | Chinese | 简体中文 |

## ⚙️ Common Constants

### API Endpoints
```
BASE_URL_DEV = "http://localhost:8000"
BASE_URL_STAGING = "https://staging-api.mindvibe.com"
BASE_URL_PROD = "https://api.mindvibe.com"
```

### Timeouts
```
CONNECT_TIMEOUT = 10 seconds
READ_TIMEOUT = 30 seconds
WRITE_TIMEOUT = 30 seconds
```

### Rate Limits
```
AUTH_RATE_LIMIT = 10 requests/minute
CHAT_RATE_LIMIT = 60 requests/minute
MOOD_RATE_LIMIT = 100 requests/minute
GENERAL_RATE_LIMIT = 300 requests/minute
```

### Pagination
```
DEFAULT_PAGE_SIZE = 30
MAX_PAGE_SIZE = 100
```

## 🔐 Security Constants

### Token Expiry
```
ACCESS_TOKEN_EXPIRY = 3600 seconds (1 hour)
REFRESH_TOKEN_EXPIRY = 2592000 seconds (30 days)
```

### Encryption
```
ALGORITHM = "AES-256-GCM"
KEY_SIZE = 256 bits
IV_SIZE = 12 bytes
TAG_SIZE = 16 bytes
```

## 🎨 Design Tokens

### Colors (Hex values)
```
PRIMARY_LIGHT = #6750A4
PRIMARY_DARK = #D0BCFF
BACKGROUND_LIGHT = #FFFBFE
BACKGROUND_DARK = #1C1B1F
ERROR = #B3261E
SUCCESS = #4CAF50
WARNING = #FF9800
```

### Spacing
```
SPACING_XS = 4dp/pt
SPACING_SM = 8dp/pt
SPACING_MD = 16dp/pt
SPACING_LG = 24dp/pt
SPACING_XL = 32dp/pt
```

### Typography
```
FONT_SIZE_DISPLAY = 57sp/pt
FONT_SIZE_HEADLINE = 32sp/pt
FONT_SIZE_TITLE = 22sp/pt
FONT_SIZE_BODY = 16sp/pt
FONT_SIZE_LABEL = 14sp/pt
```

## 🧪 Test Data

### Mock Users
```json
[
  {
    "email": "test@mindvibe.com",
    "password": "Test123!",
    "name": "Test User"
  }
]
```

### Mock Responses
Sample API responses for testing without backend connection.

## 📚 Documentation References

- [API Integration Guide](../docs/API_INTEGRATION.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Backend API Documentation](../../docs/MOBILE_BFF.md)
- [Main README](../../README.md)

---

**Shared resources for seamless cross-platform development**
