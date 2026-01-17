# KIAAN Multilingual Enhancement - Implementation Guide

## Overview

KIAAN Chat now supports truly universal and multilingual experiences with comprehensive features for input, output, translation, and caching across 17+ languages.

## Supported Languages

- **Indian Languages**: Hindi (hi), Tamil (ta), Telugu (te), Bengali (bn), Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa), Sanskrit (sa)
- **International Languages**: English (en), Spanish (es), French (fr), German (de), Portuguese (pt), Japanese (ja), Chinese Simplified (zh-CN)

## Features Implemented

### 1. Multilingual Input Support ✅

**Voice Input:**
- Browser-based speech-to-text with language detection
- Automatic language mapping for 17+ languages
- Real-time transcription with interim results
- Microphone permission handling and error messages

**Text Input:**
- Client-side language detection utility (`utils/languageDetection.ts`)
- Character pattern matching for accurate detection
- Mixed language support detection
- Browser language preference detection

**Usage:**
```typescript
import { detectLanguage } from '@/utils/languageDetection';

const detected = detectLanguage("मुझे शांति चाहिए");
// Returns: { code: 'hi', confidence: 0.95, name: 'Hindi' }
```

### 2. Natural Voice Reading (TTS) ✅

**Features:**
- Browser-native speech synthesis
- Language-specific voice selection
- Playback controls (pause, resume, stop)
- Speed adjustment (0.75x - 1.5x)
- Volume and pitch control

**Components:**
- `VoiceOutputButton` - Read responses aloud
- `VoiceSettingsPanel` - Advanced voice controls
- `SpeechSynthesisService` - Core TTS service

**Usage:**
```tsx
import { VoiceOutputButton } from '@/components/voice';

<VoiceOutputButton 
  text={response} 
  language={language} 
/>
```

### 3. Translation Options in Chat ✅

**Features:**
- Inline message translation toggle
- Language selector in chat header
- Real-time translation with caching
- Toggle between original and translated text
- Visual indicators for translated content

**Components:**
- `LanguageSelector` - Dropdown with 17+ languages
- `TranslateButton` - Per-message translation
- `useMessageTranslation` - Translation hook with caching

**Usage:**
```tsx
import { LanguageSelector } from '@/components/chat';

// Compact mode for header
<LanguageSelector compact />

// Full mode for settings
<LanguageSelector />
```

### 4. Full-App Language Switching ✅

**Implementation:**
- next-intl i18n framework
- 17 language locales with translation files
- Persistent language preference
- Dynamic UI updates across the app

**Locale Files Structure:**
```
locales/
  ├── en/
  │   ├── common.json
  │   ├── kiaan.json
  │   ├── navigation.json
  │   └── ...
  ├── hi/
  ├── es/
  └── ...
```

**Usage:**
```typescript
const { t, language, setLanguage } = useLanguage();

// Translate text
const title = t('kiaan.chat.title', 'Talk to KIAAN');

// Change language
setLanguage('hi');
```

### 5. Bhagwad Gita Wisdom Integration ✅

**Validation System:**
- `GitaValidator` - Ensures Gita-rooted responses
- Requires 2+ Sanskrit/Gita terms per response
- Wisdom markers validation (e.g., "ancient wisdom teaches")
- Forbidden terms check (no modern psychology jargon)
- Word count validation (200-500 words)
- Citation prohibition (never cite verses directly)

**Verse Integration:**
- `WisdomKnowledgeBase` - 700+ Gita verses indexed
- Vector search for relevant verses
- Context building from top 5 verses
- Fallback mechanism for low-quality matches

**Example Validation:**
```python
# Response must include:
- 2+ Gita terms: dharma, karma, atman, yoga, etc.
- Wisdom markers: "ancient wisdom", "timeless truth"
- 200-500 words
- NO citations: "Bhagavad Gita", "verse", "chapter"
```

### 6. Caching Multilingual Responses ✅

**Multi-Layer Caching:**

1. **Client-Side Cache:**
   - LocalStorage for translation results
   - LRU eviction (max 1000 entries)
   - 24-hour expiry

2. **Redis Cache (Backend):**
   - In-memory caching for fastest access
   - Language-specific cache keys
   - Configurable TTL

3. **Database Cache:**
   - PostgreSQL ChatTranslation table
   - Long-term storage
   - Query optimization for common Q&A

**Service:**
```python
# backend/services/multilingual_cache_service.py

multilingual_cache_service = MultilingualCacheService()

# Get cached response
cached = await multilingual_cache_service.get_cached_response(
    message="Help me find peace",
    language="hi",
    db=db
)

# Cache new response
await multilingual_cache_service.cache_response(
    message="Help me find peace",
    language="hi",
    response="शांति पाने के लिए...",
    verses_used=["2.47", "2.48"],
    db=db
)
```

**Pre-caching:**
```python
# Pre-cache common Q&A for offline use
count = await multilingual_cache_service.pre_cache_common_qa(
    languages=['hi', 'es', 'fr'],
    db=db
)
```

## API Endpoints

### Language Detection
```http
POST /api/language/detect
Content-Type: application/json

{
  "text": "मुझे मार्गदर्शन चाहिए"
}

Response:
{
  "detected_language": "hi",
  "confidence": 0.95,
  "supported": true,
  "language_name": "Hindi"
}
```

### Supported Languages List
```http
GET /api/language/supported

Response:
{
  "supported_languages": {
    "en": "English",
    "hi": "Hindi",
    ...
  },
  "count": 17
}
```

### Chat with Translation
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "I need guidance",
  "language": "hi"
}

Response:
{
  "status": "success",
  "response": "...", // Translated to Hindi
  "language": "hi",
  "gita_powered": true,
  "verses_used": ["2.47", "2.48"],
  "translation": {
    "original_text": "...",
    "translated_text": "...",
    "success": true,
    "cached": false
  }
}
```

## User Guide

### For Users

**Changing Response Language:**
1. Click the language selector (globe icon) in the chat header
2. Search or scroll to find your preferred language
3. Click to select - KIAAN will now respond in that language

**Using Voice Input:**
1. Click the microphone button in the input area
2. Grant microphone permissions if prompted
3. Speak clearly in any supported language
4. Speech will be automatically transcribed

**Translating Messages:**
1. Each KIAAN response has a "Translate" button
2. Click to translate to your current language
3. Click "Original" to see the English version
4. Translation is cached for faster access

**Listening to Responses:**
1. Click the "Listen" button on any KIAAN response
2. Control playback with pause/resume/stop
3. Adjust speed with the speed selector (0.75x - 1.5x)

### For Developers

**Adding a New Language:**

1. Add to i18n configuration:
```typescript
// i18n.ts
export const locales = [..., 'new-lang'] as const;
export const localeNames = {
  ...,
  'new-lang': 'Language Name'
};
```

2. Create locale files:
```bash
mkdir -p locales/new-lang
cp locales/en/*.json locales/new-lang/
# Translate the JSON files
```

3. Add to language detection:
```typescript
// utils/languageDetection.ts
const LANGUAGE_PATTERNS = {
  ...,
  'new-lang': {
    name: 'Language Name',
    chars: /[unicode-range]/,
    commonWords: ['word1', 'word2']
  }
};
```

4. Add to speech mapping:
```typescript
// utils/speech/languageMapping.ts
export const SPEECH_LANGUAGE_MAP = {
  ...,
  'new-lang': 'new-lang-REGION'
};
```

## Performance Considerations

**Caching Strategy:**
- Client-side: Instant translation for repeated content
- Redis: Sub-millisecond cache hits for active users
- Database: Fallback for cold cache, still <100ms

**Translation API:**
- Rate limiting: 30 requests/minute per user
- Retry logic: Exponential backoff (3 attempts)
- Fallback: Original text if translation fails

**Voice Features:**
- Browser-native APIs (no external dependencies)
- Offline capable once loaded
- No API costs or rate limits

## Security

**Input Sanitization:**
- HTML escaping for XSS prevention
- SQL injection prevention via ORM
- Maximum message length: 2000 characters

**API Security:**
- Rate limiting on all endpoints
- User authentication (optional)
- CORS configuration for allowed origins

**Privacy:**
- Voice processing happens in-browser
- Translations cached locally first
- No voice data sent to external servers (browser-native TTS/STT)

## Testing

**Manual Testing Checklist:**
- [ ] Voice input in 5+ languages
- [ ] Voice output (TTS) in 5+ languages
- [ ] Text translation accuracy
- [ ] Cache hit rates
- [ ] Language detection accuracy
- [ ] Gita wisdom validation
- [ ] UI language switching
- [ ] Error handling (no microphone, no internet)

**Automated Tests:**
```bash
# Frontend tests
npm run test

# Backend tests
pytest backend/tests/

# Translation integration tests
pytest backend/tests/integration/test_translation_api.py
```

## Troubleshooting

**Voice Input Not Working:**
- Check browser compatibility (Chrome, Edge, Safari)
- Ensure HTTPS or localhost
- Grant microphone permissions
- Check browser console for errors

**Translation Failing:**
- Check internet connection
- Verify language is supported
- Check rate limits
- Review backend logs

**Cache Issues:**
- Clear browser cache: `localStorage.clear()`
- Clear Redis cache (backend)
- Check database connectivity

## Future Enhancements

**Planned Features:**
- Offline mode with pre-cached responses
- Audio response streaming
- Custom voice selection per language
- Translation quality feedback
- Multilingual Gita verse database
- Speech-to-speech translation (voice input → translated voice output)

## Resources

**Documentation:**
- [Next-Intl Documentation](https://next-intl-docs.vercel.app/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Google Translate API](https://cloud.google.com/translate/docs)

**Support:**
- GitHub Issues: Report bugs or request features
- Discord: Community support channel

## License

Part of MindVibe - © 2024 All Rights Reserved
