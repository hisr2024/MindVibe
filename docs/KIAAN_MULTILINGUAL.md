# KIAAN Multilingual Capabilities

## Overview

KIAAN (Knowledge-Infused AI for Authentic Navigation) is MindVibe's AI-powered mental health companion that provides support in 17 languages. This document details KIAAN's multilingual capabilities, technical implementation, and best practices.

## Language Support

### Supported Languages

KIAAN provides full support for:

| Language | Code | Script | Status |
|----------|------|--------|--------|
| English | en | Latin | ✅ Full |
| Hindi | hi | Devanagari | ✅ Full |
| Tamil | ta | Tamil | ✅ Full |
| Telugu | te | Telugu | ✅ Full |
| Bengali | bn | Bengali | ✅ Full |
| Marathi | mr | Devanagari | ✅ Full |
| Gujarati | gu | Gujarati | ✅ Full |
| Kannada | kn | Kannada | ✅ Full |
| Malayalam | ml | Malayalam | ✅ Full |
| Punjabi | pa | Gurmukhi | ✅ Full |
| Sanskrit | sa | Devanagari | ✅ Full |
| Spanish | es | Latin | ✅ Full |
| French | fr | Latin | ✅ Full |
| German | de | Latin | ✅ Full |
| Portuguese | pt | Latin | ✅ Full |
| Japanese | ja | Kanji/Hiragana/Katakana | ✅ Full |
| Chinese (Simplified) | zh-CN | Hanzi | ✅ Full |

## How It Works

### 1. Language Detection

KIAAN automatically detects the language of user input using:

#### Character-Based Detection
```
Input: "मुझे मदद चाहिए"
Detection: Hindi (Devanagari script)
Confidence: 0.98
```

#### Pattern Matching
- Each language has unique character ranges
- Common words and patterns are identified
- Context-aware detection for mixed inputs

#### API Endpoint
```http
POST /api/language/detect
Content-Type: application/json

{
  "text": "Your input text here"
}

Response:
{
  "detected_language": "hi",
  "confidence": 0.98,
  "supported": true,
  "language_name": "Hindi"
}
```

### 2. Response Generation

Once language is detected, KIAAN:

1. **Context Preservation**: Maintains conversation context in the detected language
2. **Cultural Awareness**: Adapts responses to cultural norms
3. **Emotional Intelligence**: Recognizes and responds to emotional cues in any language
4. **Wisdom Integration**: Provides culturally appropriate wisdom and guidance

### 3. Translation Middleware

KIAAN's backend includes translation middleware that:

- Detects user input language
- Processes requests with language context
- Generates responses in the same language
- Falls back to English if needed

## Technical Architecture

### Backend Components

#### Language Detection Service
```python
# Location: backend/routes/language_detection.py

- Provides language detection API
- Character pattern matching
- Confidence scoring
- Supports all 17 languages
```

#### KIAAN Core
```python
# Location: backend/services/kiaan_core.py

- Central wisdom engine
- Language-aware response generation
- Gita verse integration
- Multi-language support
```

### Frontend Integration

#### Translation Loading
```typescript
// Location: hooks/useLanguage.tsx

- Lazy loads translation files
- Caches translations for performance
- Provides translation function (t)
- Handles language switching
```

#### Chat Interface
```typescript
// Chat components automatically detect and use:
- User's preferred language
- Message translations
- UI element translations
```

## Language Detection Examples

### Indian Languages

#### Hindi (Devanagari)
```
Input: "आज मुझे बहुत चिंता हो रही है"
Detection: ✅ Hindi
Response: "मैं समझ सकता हूँ कि चिंता कैसी महसूस होती है..."
```

#### Tamil
```
Input: "எனக்கு உதவி தேவை"
Detection: ✅ Tamil
Response: "நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்..."
```

#### Telugu
```
Input: "నాకు సహాయం కావాలి"
Detection: ✅ Telugu
Response: "నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను..."
```

### International Languages

#### Spanish
```
Input: "Me siento muy ansioso hoy"
Detection: ✅ Spanish
Response: "Entiendo cómo te sientes..."
```

#### French
```
Input: "J'ai besoin d'aide"
Detection: ✅ French
Response: "Je suis là pour vous aider..."
```

#### Japanese
```
Input: "助けが必要です"
Detection: ✅ Japanese
Response: "お手伝いさせていただきます..."
```

## Best Practices

### For Users

1. **Use One Language**: Stick to one language per conversation for best results
2. **Clear Input**: Type clearly to improve detection accuracy
3. **Be Patient**: Language processing may take an extra moment
4. **Provide Feedback**: Report any language detection issues

### For Developers

1. **Language Context**: Always pass language context to KIAAN API
2. **Fallback Handling**: Implement graceful fallbacks for unsupported languages
3. **Error Logging**: Log language detection failures for analysis
4. **Performance**: Cache translations to reduce API calls

## API Reference

### Detect Language

**Endpoint**: `POST /api/language/detect`

**Request**:
```json
{
  "text": "string (1-1000 characters)"
}
```

**Response**:
```json
{
  "detected_language": "string (language code)",
  "confidence": "number (0-1)",
  "supported": "boolean",
  "language_name": "string"
}
```

**Rate Limit**: Same as chat rate limit

### Get Supported Languages

**Endpoint**: `GET /api/language/supported`

**Response**:
```json
{
  "supported_languages": {
    "en": "English",
    "hi": "Hindi",
    ...
  },
  "count": 17
}
```

## Language Detection Algorithm

### Character Pattern Matching

Each language has defined character ranges:

```python
LANGUAGE_PATTERNS = {
  'hi': {
    'chars': r'[\u0900-\u097F]',  # Devanagari
    'sample': 'है हैं का'
  },
  'ta': {
    'chars': r'[\u0B80-\u0BFF]',  # Tamil
    'sample': 'இது அது'
  },
  # ... more languages
}
```

### Confidence Scoring

Confidence is calculated based on:
- Character match ratio
- Pattern frequency
- Context clues

```python
score = len(matches) / len(text)
confidence = min(score * 2, 1.0)
```

## Cultural Adaptations

KIAAN adapts responses to cultural contexts:

### Greetings
- Hindi: "नमस्ते" (Namaste)
- Japanese: "こんにちは" (Konnichiwa)
- Spanish: "Hola"

### Emotional Expression
- Different cultures express emotions differently
- KIAAN recognizes these nuances
- Responds appropriately

### Wisdom Integration
- Bhagavad Gita references for Indian languages
- Universal wisdom for international languages
- Culturally appropriate metaphors

## Performance Considerations

### Caching Strategy

1. **Translation Cache**: Loaded translations are cached
2. **Language Detection Cache**: Common phrases cached
3. **Response Cache**: Frequently used responses cached

### Load Times

| Operation | Time (ms) |
|-----------|-----------|
| Language Detection | 50-100 |
| Translation Load (cached) | 5-10 |
| Translation Load (uncached) | 100-200 |
| Response Generation | 2000-4000 |

## Troubleshooting

### Common Issues

#### Wrong Language Detected

**Symptoms**: KIAAN responds in wrong language

**Causes**:
- Mixed language input
- Very short input
- Ambiguous characters

**Solutions**:
1. Use clear, complete sentences
2. Stick to one language
3. Provide more context

#### Response in English Despite Input in Another Language

**Symptoms**: You type in Hindi, KIAAN responds in English

**Causes**:
- Detection confidence too low
- Translation service error
- Fallback triggered

**Solutions**:
1. Check language detection API
2. Verify translation files loaded
3. Review error logs

#### Slow Response Times

**Symptoms**: Long wait for responses

**Causes**:
- Translation files loading
- Network latency
- API rate limiting

**Solutions**:
1. Enable caching
2. Check network connection
3. Monitor API usage

## Future Enhancements

### Planned Features

1. **Context-Aware Detection**: Better handling of code-switching
2. **Dialect Support**: Regional variations of languages
3. **Voice Support**: Speech recognition in all languages
4. **Improved Wisdom**: More culturally specific guidance
5. **Translation Memory**: Learn from user corrections

### Language Additions

Considering support for:
- Urdu (اردو)
- Korean (한국어)
- Arabic (العربية)
- Italian (Italiano)
- More regional Indian languages

## Contributing

### Improving Translations

1. **Report Issues**: Found mistranslations? Create an issue
2. **Submit PRs**: Improve existing translations
3. **Add Languages**: Request new language support

### Testing

Help test KIAAN in different languages:

1. Use KIAAN in your native language
2. Report detection accuracy
3. Provide feedback on responses
4. Suggest improvements

## Resources

### For Users
- [Language Switching Guide](LANGUAGE_GUIDE.md)
- [FAQ](../README.md#faq)
- Support: care@mindvibe.app

### For Developers
- [Translation Files](../locales/)
- [Backend API](../backend/routes/language_detection.py)
- [Frontend Hook](../hooks/useLanguage.tsx)

### External Resources
- [Unicode Character Ranges](https://unicode.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [i18n Best Practices](https://www.i18next.com/)

---

**Last Updated**: January 2026

**Version**: 1.0

**Maintained by**: MindVibe Team

**Questions?**: Open an issue or contact care@mindvibe.app
