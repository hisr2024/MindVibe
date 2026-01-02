# KIAAN Chat Translation Feature - User Guide

## Overview

The KIAAN Chat now supports multi-language translation for all assistant responses across **17 languages**. Users can translate KIAAN's responses to their preferred language with a single click.

## Supported Languages

### Indian Languages (10)
- **Hindi (hi)** - हिन्दी
- **Tamil (ta)** - தமிழ்
- **Telugu (te)** - తెలుగు
- **Bengali (bn)** - বাংলা
- **Marathi (mr)** - मराठी
- **Gujarati (gu)** - ગુજરાતી
- **Kannada (kn)** - ಕನ್ನಡ
- **Malayalam (ml)** - മലയാളം
- **Punjabi (pa)** - ਪੰਜਾਬੀ
- **Sanskrit (sa)** - संस्कृत

### International Languages (7)
- **English (en)** - English
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Portuguese (pt)** - Português
- **Japanese (ja)** - 日本語
- **Chinese Simplified (zh-CN)** - 简体中文

## Features

### 1. Inline Translation Button
Every KIAAN response includes a "Translate" button that:
- Translates the response to your currently selected language
- Shows a loading indicator during translation
- Displays a visual indicator when content is translated
- Allows toggling between original and translated text

### 2. Auto-Translation
- Optionally enable auto-translation in language settings
- New responses are automatically translated as they arrive
- Seamless experience for non-English speakers

### 3. Translation Caching
- Translations are cached locally for faster repeated access
- Reduces API calls and improves performance
- Cache automatically expires after 24 hours

### 4. Offline Support
- Previously translated content remains available offline
- Cache persists across browser sessions

## How to Use

### Changing Your Language
1. Click the language selector in the top navigation
2. Choose your preferred language from the dropdown
3. The entire interface will update to your language

### Translating a Response
1. Read a KIAAN response in English
2. Click the "Translate" button below the response
3. The response is translated to your selected language
4. Click "Original" to view the English version again

### Visual Indicators
- **Globe Icon (🌐)**: Ready to translate
- **Spinning Globe**: Translation in progress
- **Globe with Check (✓)**: Currently showing translated text
- **Blue Border**: Indicates translated content

## Technical Details

### Backend API
- **Endpoint**: `POST /api/translation/translate`
- **Provider**: Google Translate API
- **Rate Limit**: 30 requests per minute per user
- **Timeout**: 10 seconds
- **Retry Logic**: Up to 3 attempts with exponential backoff

### Response Format
```json
{
  "success": true,
  "translated_text": "Translated content here",
  "original_text": "Original content here",
  "source_lang": "en",
  "target_lang": "hi",
  "provider": "google"
}
```

### Frontend Components
- **TranslateButton**: Reusable button component for translation
- **useMessageTranslation**: React hook for translation state management
- **TranslationService**: Service class handling API calls and caching

## Configuration

### Environment Variables
```bash
# Enable/disable translation service
TRANSLATION_ENABLED=true

# API endpoint (defaults to /api)
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

### Language Preferences
Language preferences are stored in:
- **Local Storage** (for unauthenticated users)
- **Database** (for authenticated users)

## Error Handling

### Common Errors and Solutions

#### "Translation unavailable"
- **Cause**: API connection issue or rate limit exceeded
- **Solution**: Wait a moment and try again

#### "Already in EN"
- **Cause**: Trying to translate when language is already English
- **Solution**: Change language in settings first

#### Translation shows original text
- **Cause**: API returned an error
- **Solution**: Check network connection, try again later

## Performance

### Caching Strategy
- **Cache Size**: Up to 1000 entries
- **Cache Expiry**: 24 hours
- **Storage**: LocalStorage (frontend), Memory (backend)
- **LRU Eviction**: Oldest entries removed when cache is full

### Rate Limiting
- **Per User**: 30 translations per minute
- **Window**: 60 seconds rolling window
- **Exceeded Response**: HTTP 429 with retry-after header

## Testing

### Automated Tests
- **Frontend**: 22 passing tests covering all languages
- **Backend**: Comprehensive test suite for all 17 languages
- **Integration**: API endpoint tests with mocked responses

### Manual Testing Checklist
1. ✅ Select each language from dropdown
2. ✅ Translate a response to each language
3. ✅ Toggle between original and translated
4. ✅ Verify cache works (instant second translation)
5. ✅ Test with long text (>500 characters)
6. ✅ Test with special characters and emojis
7. ✅ Verify offline cache persistence

## Accessibility

### Screen Reader Support
- Translation button has proper ARIA labels
- Loading states announced to screen readers
- Language changes announced

### Keyboard Navigation
- All translation controls keyboard accessible
- Focus indicators visible
- Tab order logical and intuitive

## Troubleshooting

### Translation Not Working
1. Check browser console for errors
2. Verify TRANSLATION_ENABLED=true in environment
3. Check API endpoint is accessible
4. Verify Google Translate API credentials (backend)

### Slow Translation
1. Check network connection speed
2. Review rate limiting status
3. Consider enabling auto-translation for faster UX

### Cache Issues
1. Clear browser localStorage
2. Check cache stats: `translationService.getCacheStats()`
3. Manually clear cache: `translationService.clearCache()`

## Future Enhancements

### Planned Features
- [ ] Offline translation using local models
- [ ] Custom translations for domain-specific terms
- [ ] Translation quality feedback mechanism
- [ ] Support for additional languages
- [ ] Voice output in translated language
- [ ] Translation history and favorites

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages in browser console
3. Check backend logs for API errors
4. Report issues with:
   - Browser and version
   - Language being translated to/from
   - Example text that failed
   - Error message (if any)

## Credits

Translation powered by **Google Translate API**
- High-quality machine translation
- Support for 100+ languages
- Continuous improvements from Google AI

---

**Version**: 1.0.0  
**Last Updated**: January 2, 2026  
**Maintained by**: MindVibe Team
