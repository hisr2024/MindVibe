# Developer Guide: Adding New Languages

This guide explains how to add support for a new language to MindVibe.

## Prerequisites

- Familiarity with JSON
- Basic understanding of i18n (internationalization)
- Native speaker or reliable translator for the target language
- Knowledge of the language's Unicode character range

## Step-by-Step Process

### 1. Update Language Configuration

#### Add Language to useLanguage Hook

File: `hooks/useLanguage.tsx`

```typescript
export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'sa' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh-CN' | 'YOUR_LANG_CODE'

export const LANGUAGES: Record<Language, LanguageConfig> = {
  // ... existing languages
  'YOUR_LANG_CODE': {
    code: 'YOUR_LANG_CODE',
    name: 'Language Name in English',
    nativeName: 'Language Name in Native Script',
    dir: 'ltr' // or 'rtl' for right-to-left languages
  },
}
```

**Example for Italian**:
```typescript
'it': {
  code: 'it',
  name: 'Italian',
  nativeName: 'Italiano',
  dir: 'ltr'
},
```

### 2. Create Translation Directory

Create a new directory for your language:

```bash
mkdir -p locales/YOUR_LANG_CODE
```

### 3. Create Translation Files

You need to create these JSON files in your language directory:

#### Required Files

1. **common.json** - Common UI elements
2. **navigation.json** - Navigation menus and links
3. **home.json** - Home page content
4. **dashboard.json** - Dashboard content
5. **kiaan.json** - KIAAN chat interface
6. **features.json** - Feature descriptions
7. **errors.json** - Error messages

### 4. Translation File Templates

#### common.json Template

```json
{
  "app": {
    "name": "MindVibe",
    "tagline": "[Your translation of 'Mental Health App']"
  },
  "buttons": {
    "submit": "[Submit]",
    "cancel": "[Cancel]",
    "save": "[Save]",
    "delete": "[Delete]",
    "edit": "[Edit]",
    "close": "[Close]",
    "next": "[Next]",
    "previous": "[Previous]",
    "confirm": "[Confirm]",
    "back": "[Back]",
    "continue": "[Continue]",
    "learnMore": "[Learn More]",
    "getStarted": "[Get Started]",
    "tryNow": "[Try Now]",
    "tools": "[Tools]"
  },
  "status": {
    "loading": "[Loading...]",
    "saving": "[Saving...]",
    "saved": "[Saved]",
    "error": "[Error]",
    "success": "[Success]",
    "processing": "[Processing...]"
  },
  "common": {
    "hello": "[Hello]",
    "welcome": "[Welcome]",
    "goodbye": "[Goodbye]",
    "thankyou": "[Thank you]",
    "yes": "[Yes]",
    "no": "[No]",
    "or": "[or]",
    "and": "[and]",
    "optional": "[Optional]",
    "required": "[Required]"
  },
  "privacy": {
    "encrypted": "[Encrypted]",
    "private": "[Private by design]",
    "secure": "[Secure]",
    "localOnly": "[Local only]",
    "offlineReady": "[Offline-ready]"
  }
}
```

#### navigation.json Template

```json
{
  "mainNav": {
    "home": "[Home]",
    "dashboard": "[Dashboard]",
    "features": "[Features]",
    "about": "[About]",
    "contact": "[Contact]",
    "pricing": "[Subscriptions]",
    "profile": "[Profile]",
    "settings": "[Settings]",
    "account": "[Account Access]",
    "theme": "[Theme]"
  },
  "features": {
    "kiaan": "KIAAN",
    "ardha": "Ardha",
    "viyog": "Viyoga",
    "relationshipCompass": "[Relationship Compass]",
    "sacredReflections": "[Sacred Reflections]",
    "karmaFootprint": "[Karma Footprint]",
    "karmicTree": "[Karmic Tree]",
    "emotionalReset": "[Emotional Reset]",
    "deepInsights": "[Deep Insights]",
    "wisdomRooms": "[Wisdom Rooms]"
  },
  "actions": {
    "openChat": "[Open Chat]",
    "startCheckin": "[Start check-in]",
    "instantGuidance": "[Instant guidance]",
    "spotYourState": "[Spot your state]",
    "menu": "[Menu]",
    "toggleMenu": "[Toggle navigation menu]"
  },
  "mobileNav": {
    "chat": "[Chat]",
    "pause": "[Pause]",
    "journal": "[Sacred Reflections]"
  },
  "footer": {
    "allRightsReserved": "[All rights reserved]",
    "privacy": "[Privacy Policy]",
    "terms": "[Terms of Service]",
    "support": "[Support]",
    "explore": "[Explore]",
    "safety": "[Safety]",
    "description": "[Designed for calm, privacy-first mental health support. Built with focus on WCAG accessibility, encryption, and gentle experience.]",
    "emailUs": "[Email us]",
    "encryptedJournals": "[Encrypted journals]",
    "noTracking": "[No tracking ads]"
  }
}
```

### 5. Add Language Detection Pattern

File: `backend/routes/language_detection.py`

```python
LANGUAGE_PATTERNS = {
    # ... existing patterns
    'YOUR_LANG_CODE': {
        'name': 'Language Name',
        'chars': r'[\uXXXX-\uYYYY]',  # Unicode range for your language
        'sample': 'common words'       # Sample text in your language
    }
}
```

**Example for Italian**:
```python
'it': {
    'name': 'Italian',
    'chars': r'[a-zA-ZàèéìòùÀÈÉÌÒÙ]',
    'sample': 'il la di'
}
```

### 6. Update i18n Configuration

File: `i18n.ts`

```typescript
export const locales = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
  'es', 'fr', 'de', 'pt', 'ja', 'zh-CN',
  'YOUR_LANG_CODE'  // Add your language code
] as const;

export const localeNames: Record<string, string> = {
  // ... existing languages
  'YOUR_LANG_CODE': 'Native Language Name',
};
```

### 7. Testing Your Translation

#### Manual Testing

1. **Browser Testing**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` and select your language

2. **Check localStorage**:
   - Open browser DevTools → Application → Local Storage
   - Look for `preferredLocale` key
   - Verify it updates when you change language

3. **Test UI Elements**:
   - [ ] Navigation menu items
   - [ ] Buttons and labels
   - [ ] Footer links
   - [ ] Dashboard content
   - [ ] Error messages

#### Automated Testing

Add test cases for your language:

```typescript
// In tests/frontend/hooks/useLanguage.test.tsx

it('should support YOUR_LANG_CODE language', async () => {
  localStorage.setItem('preferredLocale', 'YOUR_LANG_CODE');
  
  const { result } = renderUseLanguage();
  
  await waitFor(() => {
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.language).toBe('YOUR_LANG_CODE');
  });
});
```

### 8. Translation Quality Checklist

#### Before Submitting

- [ ] All required JSON files created
- [ ] No syntax errors in JSON files
- [ ] Translations are natural and culturally appropriate
- [ ] Special characters properly encoded (UTF-8)
- [ ] Consistency in terminology across files
- [ ] Proper formatting (quotes, commas, brackets)
- [ ] No hardcoded English text remaining

#### Cultural Considerations

- [ ] Formal vs. informal language appropriate for context
- [ ] Gender-neutral where applicable
- [ ] Cultural references make sense
- [ ] Idioms translated appropriately
- [ ] Tone matches original (supportive, warm)

### 9. Unicode Character Ranges

Common Unicode ranges for languages:

| Language | Unicode Range | Regex Pattern |
|----------|---------------|---------------|
| Latin-based | U+0000-U+024F | `[a-zA-Z]` with diacritics |
| Devanagari (Hindi) | U+0900-U+097F | `[\u0900-\u097F]` |
| Tamil | U+0B80-U+0BFF | `[\u0B80-\u0BFF]` |
| Arabic | U+0600-U+06FF | `[\u0600-\u06FF]` |
| Chinese | U+4E00-U+9FFF | `[\u4E00-\u9FFF]` |
| Japanese | U+3040-U+30FF, U+4E00-U+9FAF | Complex |
| Korean | U+AC00-U+D7AF | `[\uAC00-\uD7AF]` |

Find more: https://unicode.org/charts/

### 10. File Structure Example

After adding Italian, your directory structure would look like:

```
locales/
├── en/
│   ├── common.json
│   ├── navigation.json
│   └── ...
├── it/
│   ├── common.json
│   ├── navigation.json
│   ├── home.json
│   ├── dashboard.json
│   ├── kiaan.json
│   ├── features.json
│   └── errors.json
└── ...other languages
```

### 11. Submitting Your Translation

#### Pull Request Guidelines

1. **Branch Naming**:
   ```bash
   git checkout -b feature/add-language-CODE
   ```

2. **Commit Message**:
   ```
   feat: Add [Language Name] translation support

   - Add language configuration
   - Create translation files
   - Update language detection
   - Add tests
   ```

3. **PR Description**:
   ```markdown
   ## Language Addition: [Language Name]

   ### Changes
   - Added [Language Name] (CODE) support
   - Created all required translation files
   - Updated language detection patterns
   - Added test coverage

   ### Testing
   - [x] Manual testing completed
   - [x] All UI elements translated
   - [x] No JSON syntax errors
   - [x] Language detection works

   ### Native Speaker
   - [ ] I am a native speaker
   - [ ] Reviewed by native speaker: @username
   ```

### 12. Maintenance

#### Updating Translations

When new features are added:

1. Check for new keys in English files
2. Add corresponding translations
3. Maintain consistency with existing translations
4. Test thoroughly

#### Translation Memory

Keep a glossary of terms:

```json
{
  "mental health": "YOUR_TRANSLATION",
  "dashboard": "YOUR_TRANSLATION",
  "meditation": "YOUR_TRANSLATION"
}
```

## Common Pitfalls

### 1. JSON Syntax Errors

❌ **Wrong**:
```json
{
  "key": "value",  // trailing comma
}
```

✅ **Correct**:
```json
{
  "key": "value"
}
```

### 2. Missing Required Keys

All keys from English files must be present in your translation, even if some remain in English temporarily.

### 3. Character Encoding

Always save files as UTF-8 without BOM.

### 4. RTL Languages

For right-to-left languages (Arabic, Hebrew):
```typescript
dir: 'rtl'
```

And test thoroughly - UI elements may need adjustments.

## Resources

### Translation Tools

- **Google Translate**: Quick first pass (requires review)
- **DeepL**: Better for European languages
- **Native Speakers**: Always best option

### Testing Tools

- **Browser DevTools**: Network tab to see loaded translations
- **React DevTools**: Check component props
- **Vitest**: Run automated tests

### Unicode Resources

- [Unicode Character Table](https://unicode-table.com/)
- [Unicode Ranges](https://unicode.org/charts/)
- [i18n Best Practices](https://www.i18next.com/)

## Support

Need help adding a language?

- **GitHub Issues**: Open an issue with `[translation]` tag
- **Email**: care@mindvibe.app
- **Discord**: Join our community (link in README)

## Example: Complete Italian Addition

See the complete example in `/examples/adding-italian-translation/` (if available) or check the Spanish translation as a reference.

---

**Questions?** Open an issue or reach out to the maintainers.

**Thank you for helping make MindVibe accessible to more people! 🌍💙**
