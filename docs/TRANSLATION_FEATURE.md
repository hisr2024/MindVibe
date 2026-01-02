# Multi-Language Translation Feature Documentation

## Overview

The MindVibe application now supports real-time translation of chatbot responses into 17 different languages. This feature enables users from different linguistic backgrounds to interact with KIAAN in their preferred language while maintaining the wisdom and context of the original responses.

## Features

### 1. Language Selection
- Users can select their preferred language from 17 supported languages
- Language selection is persisted across sessions
- Seamless language switching without page reloads
- Globe icon (🌐) in the UI for easy language access

### 2. Supported Languages
- **English** (en) - Default
- **Indian Languages**: Hindi (hi), Tamil (ta), Telugu (te), Bengali (bn), Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa), Sanskrit (sa)
- **European Languages**: Spanish (es), French (fr), German (de), Portuguese (pt)
- **Asian Languages**: Japanese (ja), Chinese Simplified (zh-CN)

### 3. Translation System

#### Backend Components

**Translation Service** (`backend/services/translation_service.py`)
- Provides real-time translation using Google Translate API
- In-memory caching for frequently translated phrases
- Error handling and graceful fallbacks
- Support for all 17 languages

**Translation Middleware** (`backend/middleware/translation.py`)
- Intercepts chatbot responses before sending to user
- Translates responses to user's preferred language
- Stores original and translated text in database
- Implements database-level caching for translations

**Database Model** (`backend/models.py` - ChatTranslation)
- Stores original and translated chat responses
- Tracks translation success/failure status
- Links translations to users and sessions
- Supports soft deletion for data management

#### Frontend Components

**Translation Toggle** (`components/chat/TranslationToggle.tsx`)
- Visual toggle button to switch between original and translated text
- Only shown when translation is available
- Status indicator showing current view (original/translated)
- Tooltip with usage instructions

**Language Selector** (`components/MinimalLanguageSelector.tsx`)
- Dropdown menu with all 17 languages
- Native language names for better accessibility
- Persistence using localStorage
- Event-based system for instant updates

### 4. API Integration

#### Chat Endpoint
**Endpoint**: `POST /api/chat/message`

**Request Body**:
```json
{
  "message": "How can I find inner peace?",
  "language": "es"
}
```

**Response**:
```json
{
  "status": "success",
  "response": "La paz interior comienza con...",
  "bot": "KIAAN",
  "version": "13.0",
  "model": "GPT-4",
  "gita_powered": true,
  "language": "es",
  "translation": {
    "original_text": "Inner peace begins with...",
    "translated_text": "La paz interior comienza con...",
    "target_language": "es",
    "success": true,
    "cached": false
  }
}
```

### 5. Caching Strategy

#### Two-Level Caching

1. **In-Memory Cache** (Translation Service)
   - Fast access for repeated translations within a session
   - Cleared on service restart
   - Automatic cache key generation

2. **Database Cache** (Translation Middleware)
   - Persistent cache across sessions
   - Lookup before calling translation API
   - Reduces API costs and improves response time

### 6. Error Handling

#### Fallback Mechanisms

1. **Translation Failure**: Returns original text if translation fails
2. **Unsupported Language**: Returns original text with error message
3. **API Unavailable**: Gracefully degrades to original language
4. **Database Error**: Continues with translation but logs storage failure

#### Error Logging
- All translation errors logged with context
- Success/failure metrics tracked for monitoring
- User experience not disrupted by backend errors

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Translation Service
TRANSLATION_ENABLED=true

# Optional: Google Cloud Translation API (for future enhancement)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Backend Configuration

The translation service is automatically initialized when the backend starts. No additional configuration required for basic functionality.

## Database Schema

### ChatTranslation Table

```sql
CREATE TABLE chat_translations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Original message
    original_text TEXT NOT NULL,
    original_language VARCHAR(10) DEFAULT 'en',
    
    -- Translated message
    translated_text TEXT,
    target_language VARCHAR(10),
    
    -- Metadata
    translation_success BOOLEAN DEFAULT FALSE,
    translation_error TEXT,
    translation_provider VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes

- `idx_chat_translations_user_id` - Efficient user queries
- `idx_chat_translations_session_id` - Session-based lookups
- `idx_chat_translations_message_id` - Unique message identification
- `idx_chat_translations_original_language` - Language filtering
- `idx_chat_translations_target_language` - Target language queries

## Migration

Run the migration script to create the database table:

```bash
psql -d mindvibe -f migrations/20260102_add_chat_translations.sql
```

## Usage Examples

### Frontend Usage

```typescript
import { useLanguage } from '@/hooks/useLanguage';

function ChatComponent() {
  const { language, setLanguage } = useLanguage();
  
  // Send message with language preference
  const sendMessage = async (text: string) => {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        language: language || 'en'
      })
    });
    
    const data = await response.json();
    
    // Use translated response
    console.log('Original:', data.translation?.original_text);
    console.log('Translated:', data.response);
  };
}
```

### Backend Usage

```python
from backend.middleware.translation import translation_middleware
from backend.services.translation_service import translation_service

# Direct translation
result = await translation_service.translate_text(
    text="Hello, how are you?",
    target_lang="es"
)

# Translation with middleware (includes database storage)
result = await translation_middleware.translate_response(
    response="Hello, how are you?",
    target_lang="es",
    db=db_session,
    user_id="user123"
)
```

## Testing

### Unit Tests

Run translation service tests:
```bash
pytest tests/unit/test_translation_service.py -v
```

Run translation middleware tests:
```bash
pytest tests/unit/test_translation_middleware.py -v
```

### Integration Tests

Test the complete translation workflow:
```bash
pytest tests/integration/test_chat_api.py -k translation -v
```

### Manual Testing Checklist

- [ ] Select a non-English language from dropdown
- [ ] Send a message to KIAAN
- [ ] Verify response is in selected language
- [ ] Check translation toggle button appears
- [ ] Toggle between original and translated text
- [ ] Switch to different language and test again
- [ ] Verify translation persists on page refresh
- [ ] Test with long messages (>500 characters)
- [ ] Test with special characters and emojis
- [ ] Test error handling (disable translation service)

## Performance Considerations

### Optimization Tips

1. **Caching**: Most frequently used responses are cached in database
2. **Async Processing**: All translations are asynchronous
3. **Error Handling**: Failures don't block the user experience
4. **Rate Limiting**: Translation API calls are managed efficiently

### Monitoring

Monitor these metrics:
- Translation success rate
- Average translation time
- Cache hit rate
- API call volume
- Error rates by language

## Security

### Data Privacy

1. **User Data**: All translations linked to user IDs are encrypted
2. **Soft Deletion**: Translations can be soft-deleted for GDPR compliance
3. **Sanitization**: Input is sanitized before translation
4. **No Third-Party Storage**: Translations stored only in our database

### API Security

1. **Rate Limiting**: Translation requests are rate-limited
2. **Input Validation**: All inputs validated before processing
3. **Error Masking**: Sensitive errors not exposed to frontend
4. **Authentication**: Translation requires valid user session

## Future Enhancements

### Planned Features

1. **Redis Caching**: Implement Redis for distributed caching
2. **Real-time Translation**: Stream translations as they're generated
3. **Language Detection**: Auto-detect user's language preference
4. **Translation Quality**: Add quality scoring for translations
5. **Offline Support**: Cache common translations for offline use
6. **Custom Translations**: Allow admins to override translations
7. **Translation Memory**: Learn from user corrections
8. **Analytics Dashboard**: Track translation usage and patterns

### Alternative Translation Providers

The system is designed to support multiple translation providers:
- Google Cloud Translation API
- AWS Translate
- DeepL API
- Microsoft Translator

To switch providers, implement the translation interface in a new service class.

## Troubleshooting

### Common Issues

**Issue**: Translation not working
- **Check**: Verify `TRANSLATION_ENABLED=true` in `.env`
- **Check**: Ensure googletrans package is installed
- **Check**: Review backend logs for translation errors

**Issue**: Translation takes too long
- **Solution**: Check cache hit rate, may need Redis
- **Solution**: Verify translation API latency
- **Solution**: Consider batch translation for multiple messages

**Issue**: Database errors during translation
- **Check**: Verify migration has been run
- **Check**: Ensure database connection is stable
- **Check**: Review database logs for specific errors

**Issue**: Frontend not showing translated text
- **Check**: Verify API response includes translation object
- **Check**: Ensure language selector is working
- **Check**: Check browser console for JavaScript errors

## Support

For issues or questions about the translation feature:
1. Check this documentation first
2. Review test files for usage examples
3. Check backend logs for error details
4. Contact the development team with specific error messages

## Changelog

### Version 1.0.0 (2026-01-02)
- Initial release of translation feature
- Support for 17 languages
- Database-backed caching
- Translation toggle in UI
- Comprehensive error handling
- Unit and integration tests
