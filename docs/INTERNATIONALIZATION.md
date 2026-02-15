# Internationalization (i18n) Documentation

## Overview

KIAAN MindVibe supports 8 languages out of the box:
- 🇬🇧 English (en) - Default
- 🇮🇳 Hindi (hi) - हिन्दी
- 🇪🇸 Spanish (es) - Español  
- 🇫🇷 French (fr) - Français
- 🇩🇪 German (de) - Deutsch
- 🇯🇵 Japanese (ja) - 日本語
- 🇨🇳 Chinese (zh) - 简体中文
- 🇸🇦 Arabic (ar) - العربية

## Architecture

The i18n system uses a client-side approach that:
- Stores user language preference in localStorage
- Loads translation files dynamically
- Updates HTML lang and dir attributes for accessibility
- Supports RTL (Right-to-Left) layouts for Arabic

## File Structure

```
locales/
├── en/
│   ├── common.json      # General UI, buttons, status messages
│   ├── kiaan.json       # KIAAN chat interface, guidance modes
│   ├── dashboard.json   # Dashboard, analytics, profile
│   ├── features.json    # Ardha, Viyog, Sacred Reflections, etc.
│   ├── navigation.json  # Menu items, navigation labels
│   └── errors.json      # Error messages, notifications
├── hi/ (same structure)
├── es/ (same structure)
├── fr/ (same structure)
├── de/ (same structure)
├── ja/ (same structure)
├── zh/ (same structure)
└── ar/ (same structure)
```

## Adding a New Language

1. **Create locale directory**:
   ```bash
   mkdir locales/[locale-code]
   ```

2. **Add locale to i18n.ts**:
   ```typescript
   export const locales = ['en', 'hi', ..., 'your-locale'] as const;
   export const localeNames: Record<Locale, string> = {
     // ... existing locales
     'your-locale': 'Native Language Name',
   };
   ```

3. **Add flag emoji** to `LanguageSwitcher.tsx`:
   ```typescript
   const flagEmojis: Record<Locale, string> = {
     // ... existing flags
     'your-locale': '🏴',
   };
   ```

4. **Copy and translate JSON files**:
   ```bash
   cp -r locales/en/* locales/[locale-code]/
   # Then translate the content in each JSON file
   ```

5. **Test the new language** by selecting it from the language switcher.

## Adding New Translation Keys

1. **Add the key** to the appropriate JSON file in the `locales/en/` directory:
   ```json
   {
     "myNewFeature": {
       "title": "My New Feature",
       "description": "This is a new feature"
     }
   }
   ```

2. **Add the same key structure** to all other language files:
   ```bash
   # Update locales/hi/features.json, locales/es/features.json, etc.
   ```

3. **Use in your component** with the `useTranslations` hook (when implemented) or direct import:
   ```typescript
   import messages from '@/locales/en/features.json';
   const title = messages.myNewFeature.title;
   ```

## Translation File Categories

### common.json
Contains:
- App metadata (name, tagline)
- Common buttons (submit, cancel, save, delete, edit, close, etc.)
- Status messages (loading, saving, error, success)
- Basic words (hello, welcome, yes, no, or, and)
- Privacy/security labels (encrypted, private, secure)

### kiaan.json
Contains:
- Welcome messages and KIAAN descriptions
- Chat interface text (placeholder, send button, thinking state)
- Guidance modes (Inner Peace, Mind Control, Self Kindness)
- Clarity Pause overlay text
- Mood check responses
- Quick prompt scenarios

### dashboard.json
Contains:
- Dashboard navigation
- Analytics and insights labels
- Profile and settings text
- Subscription and billing labels
- Statistics labels (journal entries, chat sessions, etc.)

### features.json
Contains:
- Ardha (Cognitive Reframing) text
- Viyoga (Detachment Coach) text
- Relationship Compass text
- Sacred Reflections (Journal) text
- Other feature descriptions (Karma Footprint, Karmic Tree, etc.)

### navigation.json
Contains:
- Main navigation items
- Feature navigation
- Action buttons
- Mobile navigation
- Footer links

### errors.json
Contains:
- Error messages
- Validation messages
- Notifications (success, info, warning)
- Connection status messages

## RTL Support

For Right-to-Left languages like Arabic:

1. **Automatic direction** is set via HTML `dir` attribute based on locale
2. **CSS classes** are available in `globals.css`:
   ```css
   [dir="rtl"] .rtl-mirror { transform: scaleX(-1); }
   [dir="rtl"] .text-left { text-align: right; }
   ```

3. **Font support** is configured for better rendering:
   ```css
   [lang="ar"] {
     font-family: 'Cairo', 'Noto Sans Arabic', 'Arial', sans-serif;
   }
   ```

## Testing Translations

1. **Switch language** using the language switcher in the top-right corner
2. **Check localStorage**: Open DevTools → Application → Local Storage → `preferredLocale`
3. **Verify HTML attributes**: Check that `<html lang="xx" dir="...">` updates correctly
4. **Test all pages**: Navigate through key pages to ensure translations load
5. **Test RTL**: Switch to Arabic and verify layout mirrors correctly

## Locale Routing

Currently, the app uses client-side locale switching:
- User preference is stored in `localStorage`
- Page reloads when language changes to apply new translations
- All existing routes continue to work without modification
- No URL changes (/en/, /es/, etc.) - keeps backward compatibility

## Browser Language Detection

The system can detect browser language preferences from the `Accept-Language` header, but currently defers to:
1. User's saved preference in localStorage (if exists)
2. Default language (English) if no preference is saved

## Contributing Translations

To contribute translations for a language:

1. Fork the repository
2. Create/update translation files for your language
3. Ensure all 6 JSON files are translated
4. Test thoroughly in the app
5. Submit a pull request with:
   - Language code and native name
   - All 6 translated JSON files
   - Screenshots showing the app in your language

## Translation Guidelines

- **Keep formatting**: Maintain placeholders like `{mood}`, `{seconds}`, `{min}`, `{max}`
- **Preserve tone**: KIAAN should sound calm, compassionate, and supportive
- **Cultural sensitivity**: Adapt metaphors and examples to your culture when appropriate
- **Technical terms**: Keep technical UI terms consistent with platform conventions
- **Length**: Try to keep translations similar in length to avoid layout issues
- **Testing**: Always test your translations in the actual interface

## Accessibility

The i18n system supports:
- Screen readers via proper `lang` attributes
- Keyboard navigation in the language switcher
- ARIA labels in native languages
- RTL screen reader support for Arabic

## Performance

- Translation files are loaded dynamically
- Only the selected language is loaded at a time
- Files are cached by the browser
- Total size per language: ~15-20KB
- Load time impact: Minimal (<100ms)

## Future Enhancements

Potential improvements:
- URL-based locale routing (`/en/dashboard`, `/es/dashboard`)
- Server-side rendering with locale support
- Translation management system integration
- Community translation platform
- Automatic translation quality checks
- Missing translation detection and fallbacks

## Support

For translation-related issues:
1. Check this documentation
2. Review existing translation files for examples
3. Open an issue on GitHub with the `i18n` label
4. Contact the maintainers for complex translation questions

## Using Translations in Components

### Client Components

Use the `useTranslation` hook in client components:

```typescript
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function MyComponent() {
  const { t, locale, isLoading } = useTranslation();

  if (isLoading) {
    return <div>Loading translations...</div>;
  }

  return (
    <div>
      <h1>{t('kiaan', 'welcome.title')}</h1>
      <p>{t('kiaan', 'welcome.subtitle')}</p>
      <button>{t('common', 'buttons.submit')}</button>
      
      {/* With parameters */}
      <p>{t('dashboard', 'stats.streakDays', { count: 5 })}</p>
    </div>
  );
}
```

### Translation Key Structure

Access nested keys using dot notation:

```typescript
// For this JSON structure:
{
  "kiaan": {
    "chat": {
      "placeholder": "Type your message..."
    }
  }
}

// Use:
t('kiaan', 'chat.placeholder')
```

### Parameter Interpolation

Use curly braces in translation strings for dynamic values:

```json
{
  "moodCheck": {
    "logged": "Logged: {mood}"
  }
}
```

```typescript
t('kiaan', 'moodCheck.logged', { mood: 'Happy' })
// Output: "Logged: Happy"
```

### Loading States

The hook provides an `isLoading` state for better UX:

```typescript
const { t, isLoading } = useTranslation();

if (isLoading) {
  return <LoadingSpinner />;
}

return <TranslatedContent />;
```

### Current Locale

Access the current locale:

```typescript
const { locale } = useTranslation();

// Use for conditional rendering
if (locale === 'ar') {
  // RTL-specific layout
}
```

## Example: Translating a Button

Before (hardcoded):
```typescript
<button>Save</button>
```

After (translated):
```typescript
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function SaveButton() {
  const { t } = useTranslation();
  
  return (
    <button>{t('common', 'buttons.save')}</button>
  );
}
```

## Example: Translating KIAAN Chat Interface

```typescript
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function KiaanChat() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('kiaan', 'chat.title')}</h2>
      <p>{t('kiaan', 'chat.subtitle')}</p>
      <input 
        placeholder={t('kiaan', 'chat.placeholder')}
      />
      <button>{t('kiaan', 'chat.send')}</button>
    </div>
  );
}
```

## Best Practices

1. **Always use the hook**: Don't import JSON files directly
2. **Keep keys semantic**: Use descriptive key names like `kiaan.chat.send` not `btn1`
3. **Handle loading states**: Show loading indicators while translations load
4. **Test all languages**: Switch between languages to verify translations display correctly
5. **Keep translations short**: UI space is limited, especially in mobile views
6. **Use parameters**: For dynamic content like names, counts, dates
7. **Consistent tone**: Maintain KIAAN's calm, supportive voice across languages

## Common Pitfalls

❌ **Don't**: Hardcode text in components
```typescript
<button>Submit</button>
```

✅ **Do**: Use translation keys
```typescript
<button>{t('common', 'buttons.submit')}</button>
```

❌ **Don't**: Import translations directly
```typescript
import messages from '@/locales/en/common.json';
```

✅ **Do**: Use the useTranslation hook
```typescript
const { t } = useTranslation();
```

❌ **Don't**: Forget about RTL languages
```typescript
<div className="text-left">Content</div>
```

✅ **Do**: Use RTL-aware classes or check locale
```typescript
<div className={locale === 'ar' ? 'text-right' : 'text-left'}>Content</div>
```
