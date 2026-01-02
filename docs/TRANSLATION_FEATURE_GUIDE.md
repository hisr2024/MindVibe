# Multi-Language Translation Feature - Complete Guide

## Overview

The MindVibe multi-language translation feature enables users to communicate with the KIAAN Chat in their preferred language. The system provides real-time translation of messages with caching, rate limiting, and comprehensive error handling.

## Table of Contents

1. [Architecture](#architecture)
2. [Supported Languages](#supported-languages)
3. [API Documentation](#api-documentation)
4. [Frontend Components](#frontend-components)
5. [Usage Examples](#usage-examples)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

---

## Architecture

### Components

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend Layer                       │
├──────────────────────────────────────────────────────────┤
│  - TranslationService (services/TranslationService.ts)   │
│  - TranslationCache (utils/TranslationCache.ts)          │
│  - useMessageTranslation Hook                             │
│  - LanguageSettings Component                             │
│  - Enhanced MessageBubble Component                       │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP/REST API
┌─────────────────────┴────────────────────────────────────┐
│                      Backend Layer                        │
├──────────────────────────────────────────────────────────┤
│  - Translation API Routes (routes/translation.py)        │
│  - TranslationService (services/translation_service.py)  │
│  - Database Models & Migrations                           │
│  - Rate Limiting & Security Middleware                    │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action**: User clicks translate button or enables auto-translation
2. **Frontend Check**: Check local cache for existing translation
3. **API Request**: If not cached, send translation request to backend
4. **Backend Processing**: Backend validates, translates via Google Translate
5. **Caching**: Both frontend and backend cache the result
6. **Display**: Translated text is displayed to user

---

## Supported Languages

The system supports 17 languages across multiple regions:

### Indian Languages
- 🇮🇳 Hindi (hi) - हिन्दी
- 🇮🇳 Tamil (ta) - தமிழ்
- 🇮🇳 Telugu (te) - తెలుగు
- 🇮🇳 Bengali (bn) - বাংলা
- 🇮🇳 Marathi (mr) - मराठी
- 🇮🇳 Gujarati (gu) - ગુજરાતી
- 🇮🇳 Kannada (kn) - ಕನ್ನಡ
- 🇮🇳 Malayalam (ml) - മലയാളം
- 🇮🇳 Punjabi (pa) - ਪੰਜਾਬੀ
- 🇮🇳 Sanskrit (sa) - संस्कृत

### European Languages
- 🇬🇧 English (en) - English
- 🇪🇸 Spanish (es) - Español
- 🇫🇷 French (fr) - Français
- 🇩🇪 German (de) - Deutsch
- 🇵🇹 Portuguese (pt) - Português

### East Asian Languages
- 🇯🇵 Japanese (ja) - 日本語
- 🇨🇳 Chinese Simplified (zh-CN) - 简体中文

---

## API Documentation

### Base URL
```
https://mindvibe-api.onrender.com/api/translation
```

### Authentication
All endpoints support both authenticated and unauthenticated access. Authenticated users can save preferences to the server.

### Rate Limits
- Translation: 30 requests/minute
- Preferences: 10 requests/minute  
- Languages: 60 requests/minute
- Cache operations: 5 requests/minute

### Endpoints

#### 1. Translate Text
**POST** `/api/translation/translate`

Translate text from one language to another.

**Request:**
```json
{
  "text": "Hello, how are you?",
  "target_lang": "es",
  "source_lang": "en"
}
```

**Response:**
```json
{
  "success": true,
  "translated_text": "Hola, ¿cómo estás?",
  "original_text": "Hello, how are you?",
  "source_lang": "en",
  "target_lang": "es",
  "provider": "google"
}
```

#### 2. Get Supported Languages
**GET** `/api/translation/languages`

Returns all supported language codes and names.

**Response:**
```json
{
  "languages": {
    "en": "English",
    "es": "Spanish",
    "hi": "Hindi"
  }
}
```

#### 3. Update Preferences
**POST** `/api/translation/preferences`

Save user language preferences.

**Request:**
```json
{
  "language": "es",
  "auto_translate": true
}
```

#### 4. Get Preferences
**GET** `/api/translation/preferences`

Retrieve saved preferences.

#### 5. Cache Stats
**GET** `/api/translation/cache/stats`

Get cache statistics (monitoring).

#### 6. Clear Cache
**DELETE** `/api/translation/cache`

Clear translation cache (admin).

---

## Frontend Components

### TranslationService

Main service for translation operations.

```typescript
import { getTranslationService } from '@/services/TranslationService';

const service = getTranslationService();
const result = await service.translate({
  text: 'Hello',
  targetLang: 'es'
});
```

**Features:**
- LRU caching with persistence
- Exponential backoff retries
- Rate limiting
- Input sanitization

### useMessageTranslation Hook

React hook for message translation.

```tsx
const {
  translatedText,
  isTranslating,
  error,
  toggleTranslation
} = useMessageTranslation({
  messageId: 'msg-1',
  originalText: 'Hello',
  autoTranslate: true
});
```

### LanguageSettings Component

UI for managing language preferences.

```tsx
<LanguageSettings onClose={() => {}} />
```

### Enhanced MessageBubble

Chat message component with translation support.

---

## Configuration

### Environment Variables

```bash
TRANSLATION_ENABLED=true
GOOGLE_TRANSLATE_API_KEY=your_key
LIBRE_TRANSLATE_URL=https://libretranslate.de
```

### Frontend Config

Edit `config/translation.ts`:

```typescript
export const TRANSLATION_CONFIG = {
  rateLimitWindow: 60000,
  maxRequestsPerWindow: 30,
  cacheExpiryTime: 86400000,
  maxCacheSize: 1000,
  maxRetries: 3
};
```

---

## Troubleshooting

### Translation Not Working

1. Check `TRANSLATION_ENABLED=true`
2. Verify API endpoint accessible
3. Check rate limits not exceeded
4. Validate language codes

### Cache Issues

1. Check localStorage enabled
2. Verify cache size limits
3. Try clearing cache
4. Check expiry time

### Rate Limiting

Wait 1 minute and retry. Enable caching to reduce API calls.

### Auto-Translation

1. Check language preference set
2. Verify auto_translate enabled
3. Ensure source ≠ target language

---

## Security

### Input Sanitization
All input is HTML-escaped to prevent XSS.

### Rate Limiting
Multiple levels of rate limiting protect against abuse.

### Data Privacy
- Translations cached locally and server-side
- HTTPS encryption for all API calls
- No sensitive data to third parties

### Authentication
Optional for translation, required for saving preferences.

---

## Performance Tips

1. **Enable Caching** - Reduce API calls
2. **Lazy Loading** - Translate visible messages only
3. **Debouncing** - Debounce user input
4. **Error Handling** - Always provide fallbacks

---

## Migration

```bash
# Run database migrations
psql -d db -f migrations/20260102_add_chat_translations.sql
psql -d db -f migrations/20260102_enhance_translation_support.sql
```

---

## Support

- Issues: https://github.com/hisr2024/MindVibe/issues
- Docs: https://github.com/hisr2024/MindVibe
- Email: support@mindvibe.com

---

## License

MIT License - Part of MindVibe Project
