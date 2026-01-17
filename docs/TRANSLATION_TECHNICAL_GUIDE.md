# KIAAN Chat Translation - Technical Implementation Guide

## Architecture Overview

The translation feature is implemented using a three-tier architecture:

```
┌─────────────────┐
│   Frontend UI   │  MessageBubble, TranslateButton
└────────┬────────┘
         │
┌────────▼────────┐
│  React Hooks    │  useMessageTranslation
└────────┬────────┘
         │
┌────────▼────────┐
│ Translation     │  TranslationService (with caching)
│ Service (TS)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Backend API    │  FastAPI endpoints
└────────┬────────┘
         │
┌────────▼────────┐
│ Google Translate│  External API
└─────────────────┘
```

## Component Details

### 1. Frontend Components

#### TranslateButton Component
**Location**: `components/chat/TranslateButton.tsx`

**Purpose**: Reusable button for triggering translation

**Key Features**:
- Loading states with spinner animation
- Toggle between original and translated
- Visual feedback (colors, icons)
- Keyboard accessible

**Usage**:
```tsx
<TranslateButton
  text="Hello, how can I help you?"
  onTranslate={(translatedText, isTranslated) => {
    console.log('Translated:', translatedText);
  }}
/>
```

**Props**:
- `text`: string - Original text to translate
- `onTranslate`: (text: string, isTranslated: boolean) => void - Callback
- `className`: string (optional) - Additional CSS classes

#### MessageBubble Component
**Location**: `components/chat/MessageBubble.tsx`

**Integration**:
- Uses `useMessageTranslation` hook
- Displays translated text inline
- Shows translation indicator
- Handles auto-translation

**Key Changes**:
```tsx
const {
  translatedText,
  isTranslating,
  error,
  isTranslated,
  toggleTranslation
} = useMessageTranslation({
  messageId: message.id,
  originalText: message.text,
  sourceLang: 'en',
  autoTranslate: userPreference.autoTranslate
});

const displayText = translatedText || originalText;
```

### 2. React Hooks

#### useMessageTranslation Hook
**Location**: `hooks/useMessageTranslation.ts`

**Purpose**: Manages translation state for individual messages

**API**:
```typescript
interface UseMessageTranslationOptions {
  messageId: string;
  originalText: string;
  sourceLang?: string;
  autoTranslate?: boolean;
}

interface UseMessageTranslationReturn {
  translatedText: string | null;
  isTranslating: boolean;
  error: string | null;
  isTranslated: boolean;
  translate: () => Promise<void>;
  toggleTranslation: () => void;
  reset: () => void;
}
```

**Usage**:
```typescript
const translation = useMessageTranslation({
  messageId: 'msg-123',
  originalText: 'Hello world',
  sourceLang: 'en',
  autoTranslate: false
});

// Manual translation
await translation.translate();

// Toggle display
translation.toggleTranslation();

// Reset state
translation.reset();
```

**State Management**:
- Tracks translation status
- Handles loading states
- Manages errors
- Controls display toggle

### 3. Translation Service

#### TranslationService Class
**Location**: `services/TranslationService.ts`

**Purpose**: Core translation logic with caching and retry

**Key Features**:
- Singleton pattern
- LRU cache (1000 entries, 24hr expiry)
- Exponential backoff retry (3 attempts)
- Rate limiting (client-side)
- localStorage persistence

**API**:
```typescript
class TranslationService {
  // Main translation method
  async translate(options: TranslationOptions): Promise<TranslationResult>
  
  // Language validation
  isSupportedLanguage(lang: string): boolean
  getSupportedLanguages(): string[]
  
  // Cache management
  clearCache(): void
  getCacheStats(): { size: number; maxSize: number }
  
  // Enable/disable
  setEnabled(enabled: boolean): void
  isEnabled(): boolean
}
```

**Usage**:
```typescript
import { getTranslationService } from '@/services/TranslationService';

const service = getTranslationService();

const result = await service.translate({
  text: 'Hello world',
  targetLang: 'es',
  sourceLang: 'en'
});

if (result.success) {
  console.log(result.translatedText); // "Hola mundo"
}
```

**Caching Strategy**:
```typescript
// Cache key format
const cacheKey = `${sourceLang}:${targetLang}:${text.substring(0, 100)}`;

// Cache entry structure
interface TranslationCacheEntry {
  translatedText: string;
  timestamp: number;
  provider: string;
}
```

**Rate Limiting**:
```typescript
interface RateLimitState {
  count: number;
  resetTime: number;
}

// 30 requests per 60 seconds
const MAX_REQUESTS_PER_WINDOW = 30;
const RATE_LIMIT_WINDOW_MS = 60000;
```

### 4. Backend API

#### Translation Routes
**Location**: `backend/routes/translation.py`

**Endpoints**:

##### POST /api/translation/translate
Translate text to target language

**Request**:
```json
{
  "text": "Hello world",
  "target_lang": "es",
  "source_lang": "en"
}
```

**Response**:
```json
{
  "success": true,
  "translated_text": "Hola mundo",
  "original_text": "Hello world",
  "source_lang": "en",
  "target_lang": "es",
  "provider": "google"
}
```

**Rate Limit**: 30/minute

##### POST /api/translation/preferences
Update user language preferences

**Request**:
```json
{
  "language": "es",
  "auto_translate": true
}
```

##### GET /api/translation/preferences
Get user language preferences

##### GET /api/translation/languages
List supported languages

**Response**:
```json
{
  "languages": {
    "en": "English",
    "es": "Spanish",
    ...
  }
}
```

##### DELETE /api/translation/cache
Clear translation cache (admin)

#### Translation Service (Backend)
**Location**: `backend/services/translation_service.py`

**Purpose**: Backend translation logic using Google Translate

**Implementation**:
```python
class TranslationService:
    def __init__(self):
        self.translator = Translator()
        self.cache = {}
        self.enabled = True
    
    async def translate_text(
        self,
        text: str,
        target_lang: str,
        source_lang: str = 'en'
    ) -> dict:
        # Validation
        # Cache check
        # Google Translate API call
        # Cache result
        # Return formatted response
```

**Key Features**:
- Async/await support
- In-memory caching
- Error handling with fallback
- Support for 17 languages

### 5. Database Schema

**Users Table Update**:
```sql
ALTER TABLE users 
ADD COLUMN locale VARCHAR(10) DEFAULT 'en',
ADD COLUMN auto_translate BOOLEAN DEFAULT FALSE;
```

**Chat Messages Update**:
```sql
ALTER TABLE chat_messages
ADD COLUMN translated_text TEXT,
ADD COLUMN target_lang VARCHAR(10);
```

## Testing

### Frontend Tests

**Location**: `tests/frontend/services/TranslationService.test.ts`

**Coverage**:
- All 17 languages
- API integration
- Cache management
- Error handling
- Rate limiting
- Special cases (long text, special chars)

**Running Tests**:
```bash
npm test -- tests/frontend/services/TranslationService.test.ts
```

### Backend Tests

**Location**: 
- `tests/unit/test_translation_service.py`
- `tests/integration/test_translation_all_languages.py`

**Coverage**:
- All 17 languages
- Translation accuracy
- Cache functionality
- Error scenarios
- Concurrent translations

**Running Tests**:
```bash
python -m pytest tests/unit/test_translation_service.py -v
python -m pytest tests/integration/test_translation_all_languages.py -v
```

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```bash
# API endpoint
NEXT_PUBLIC_API_URL=https://api.mindvibe.com

# Enable/disable translation
NEXT_PUBLIC_TRANSLATION_ENABLED=true
```

**Backend** (`.env`):
```bash
# Enable translation service
TRANSLATION_ENABLED=true

# Google Translate API credentials (if needed)
GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

### Feature Flags

Check `backend/config/feature_config.py`:
```python
FEATURES = {
    'translation': {
        'enabled': True,
        'supported_languages': 17,
        'cache_enabled': True,
        'auto_translate_default': False
    }
}
```

## Performance Optimization

### 1. Caching Strategy
- **Frontend**: LocalStorage (persistent across sessions)
- **Backend**: In-memory (fast access, cleared on restart)
- **Cache Key**: Based on first 100 chars of text
- **Expiry**: 24 hours automatic cleanup

### 2. Lazy Loading
```typescript
// Load translation service only when needed
const service = useMemo(() => getTranslationService(), []);
```

### 3. Debouncing
```typescript
// Debounce rapid translation requests
const debouncedTranslate = useMemo(
  () => debounce(translate, 300),
  [translate]
);
```

### 4. Request Batching
```typescript
// Batch multiple translation requests
const batchTranslate = async (messages: Message[]) => {
  return Promise.all(
    messages.map(msg => service.translate({
      text: msg.text,
      targetLang: language
    }))
  );
};
```

## Error Handling

### Frontend Error Handling
```typescript
try {
  const result = await service.translate(options);
  if (!result.success) {
    showError(result.error);
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      showError('Rate limit exceeded. Please wait.');
    } else {
      showError('Translation failed. Please try again.');
    }
  }
}
```

### Backend Error Handling
```python
try:
    result = await translation_service.translate_text(text, target_lang)
    return TranslateResponse(**result)
except Exception as e:
    logger.error(f"Translation error: {e}")
    return TranslateResponse(
        success=False,
        translated_text=text,
        original_text=text,
        source_lang=source_lang,
        target_lang=target_lang,
        error=str(e)
    )
```

## Security Considerations

### 1. Input Sanitization
```python
def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS attacks."""
    return html.escape(text).strip()
```

### 2. Rate Limiting
- **Client-side**: 30 requests/minute
- **Server-side**: 30 requests/minute (FastAPI SlowAPI)
- **Protection**: Prevents API abuse

### 3. Content Length Limits
```python
MAX_TRANSLATION_LENGTH = 5000  # characters
```

### 4. CORS Configuration
```python
ALLOWED_ORIGINS = [
    "https://mind-vibe-universal.vercel.app",
    "http://localhost:3000"
]
```

## Debugging

### Enable Debug Logging

**Frontend**:
```typescript
// In TranslationService.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[Translation]', 'Translating:', text);
  console.log('[Translation]', 'Target:', targetLang);
  console.log('[Translation]', 'Result:', result);
}
```

**Backend**:
```python
# In translation_service.py
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
```

### Common Issues

**Issue**: Translation returns original text
- **Check**: API response status
- **Check**: Network connection
- **Check**: Rate limit status
- **Debug**: `console.log(result)` to see error

**Issue**: Cache not working
- **Check**: LocalStorage quota
- **Check**: Cache key generation
- **Debug**: `service.getCacheStats()`

**Issue**: Slow translation
- **Check**: Network latency
- **Check**: API response time
- **Optimize**: Enable caching
- **Optimize**: Use auto-translate sparingly

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Google Translate API credentials set
- [ ] Database migrations run
- [ ] Frontend build includes translation service
- [ ] Backend includes translation routes
- [ ] Rate limiting configured
- [ ] CORS headers set correctly
- [ ] Error logging enabled
- [ ] Cache strategy verified
- [ ] All tests passing

## Monitoring

### Metrics to Track
- Translation request volume
- Translation success rate
- Cache hit rate
- Average response time
- Error rate by language
- Rate limit violations

### Logging
```python
logger.info(f"Translation request: {source_lang} -> {target_lang}")
logger.info(f"Cache hit rate: {cache_hits / total_requests}")
logger.error(f"Translation failed: {error}")
```

## Future Improvements

### Planned Enhancements
1. **Offline Translation**: Use local models (e.g., ONNX)
2. **Custom Glossary**: Domain-specific terminology
3. **Translation Memory**: Learn from user corrections
4. **Streaming Translation**: Real-time as text generates
5. **Quality Metrics**: Translation confidence scores
6. **A/B Testing**: Compare translation providers

### Performance Improvements
1. **CDN Caching**: Cache popular translations globally
2. **Service Worker**: Offline translation support
3. **WebAssembly**: Client-side translation models
4. **GraphQL**: Batch translation requests efficiently

---

**Maintained by**: MindVibe Development Team  
**Last Updated**: January 2, 2026  
**Version**: 1.0.0
