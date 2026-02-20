# Language Switching User Guide

## Overview

MindVibe supports 17 languages to ensure spiritual wellness support is accessible to users worldwide. This guide explains how to switch languages and what features are available in your preferred language.

## Supported Languages

MindVibe is available in the following languages:

### Indian Languages (11)
- 🇮🇳 **हिन्दी** (Hindi)
- 🇮🇳 **தமிழ்** (Tamil)
- 🇮🇳 **తెలుగు** (Telugu)
- 🇮🇳 **বাংলা** (Bengali)
- 🇮🇳 **मराठी** (Marathi)
- 🇮🇳 **ગુજરાતી** (Gujarati)
- 🇮🇳 **ಕನ್ನಡ** (Kannada)
- 🇮🇳 **മലയാളം** (Malayalam)
- 🇮🇳 **ਪੰਜਾਬੀ** (Punjabi)
- 🇮🇳 **संस्कृत** (Sanskrit)

### International Languages (6)
- 🇬🇧 **English**
- 🇪🇸 **Español** (Spanish)
- 🇫🇷 **Français** (French)
- 🇩🇪 **Deutsch** (German)
- 🇵🇹 **Português** (Portuguese)
- 🇯🇵 **日本語** (Japanese)
- 🇨🇳 **简体中文** (Chinese Simplified)

## How to Switch Languages

### Method 1: Using the Language Selector

1. **Locate the Language Selector**
   - On desktop: Look for the language dropdown in the top navigation bar
   - On mobile: Open the menu and find the language settings

2. **Choose Your Language**
   - Click on the language selector
   - Browse or search for your preferred language
   - Click to select

3. **Confirmation**
   - The interface will immediately update to your selected language
   - Your choice is automatically saved to your browser

### Method 2: Auto-Detection

MindVibe automatically detects your browser's language settings:
- On your first visit, MindVibe will display in your browser's default language (if supported)
- If your browser language isn't supported, English will be used as the default

## What Gets Translated

### Fully Translated
✅ **User Interface**
- Navigation menus
- Buttons and labels
- Settings and preferences
- Footer links

✅ **Dashboard & Tools**
- Dashboard sections
- Tool names and descriptions
- Instructions and guidance

✅ **Common Elements**
- Status messages
- Confirmation dialogs
- Form labels
- Privacy notices

### KIAAN Multi-Language Support

KIAAN, our AI spiritual companion, provides multi-language support:

- **Language Detection**: KIAAN automatically detects the language you're typing in
- **Response Language**: KIAAN responds in the same language you use
- **Supported Languages**: All 17 supported languages
- **Fallback**: If KIAAN can't detect your language, it will respond in English

## Language Preferences

### Storage
- Your language preference is stored locally in your browser
- It persists across sessions and page refreshes
- No account or login required

### Privacy
- Language preferences are stored only on your device
- No data is sent to external servers
- You can clear your preference by clearing browser data

## Troubleshooting

### Language Not Displaying Correctly

**Problem**: Characters appear as boxes or gibberish

**Solution**:
1. Ensure your device supports the language's script
2. Update your operating system and browser
3. Try a different browser

### Wrong Language Selected

**Problem**: Interface is in the wrong language

**Solution**:
1. Open the language selector
2. Select your preferred language from the list
3. Refresh the page if needed

### Language Reverts to English

**Problem**: Language resets to English after closing the browser

**Solution**:
1. Check if cookies/localStorage is enabled
2. Ensure your browser isn't in private/incognito mode
3. Check browser settings for data persistence

### Translation Missing

**Problem**: Some text is still in English

**Solution**:
- Some features are still being translated
- Report missing translations through our feedback form
- Check for updates - we're continuously adding translations

## Keyboard Input

### Typing in Your Language

Most modern operating systems support input in multiple languages:

**Windows**:
1. Press `Windows + Space` to switch input language
2. Or click the language icon in the taskbar

**macOS**:
1. Press `Control + Space` to switch input language
2. Or click the input menu in the menu bar

**Android/iOS**:
1. Long-press the space bar on the keyboard
2. Select your language from the list

**Linux**:
1. Varies by distribution
2. Usually through keyboard settings or IBus/fcitx

## Best Practices

### For Optimal Experience

1. **Set Browser Language**: Match your browser language to your MindVibe preference
2. **Enable Fonts**: Install language-specific fonts for better readability
3. **Use Native Keyboard**: Use your OS's native input method for your language
4. **Regular Updates**: Keep MindVibe updated for the latest translations

### When Using KIAAN

1. **Consistent Language**: Use one language per conversation for best results
2. **Clear Input**: Type clearly to help language detection
3. **Be Patient**: Language processing may take a moment
4. **Fallback**: If unsure, KIAAN defaults to English

## Accessibility

MindVibe's language support includes accessibility features:

- **Screen Readers**: All languages support screen reader navigation
- **Keyboard Navigation**: Full keyboard support in all languages
- **Font Sizing**: Text scales properly in all scripts
- **Color Contrast**: WCAG AA compliance in all languages

## Contributing Translations

We welcome community contributions to improve translations:

1. **Report Issues**: Found a mistranslation? Let us know!
2. **Suggest Improvements**: Native speakers can help refine translations
3. **Add Languages**: Request support for additional languages
4. **Join Beta**: Test new translations before release

## Support

Need help with language settings?

- **Email**: care@mindvibe.app
- **Documentation**: https://github.com/hisr2024/MindVibe
- **FAQ**: Check our comprehensive FAQ section

## Technical Details

For developers interested in how multi-language support works:

### Language Detection
- Character-based pattern matching
- Browser language preference detection
- localStorage persistence

### Translation Loading
- Lazy loading of translation files
- Caching for performance
- Fallback to English for missing keys

### KIAAN Language Support
- API endpoint: `/api/language/detect`
- Supported languages endpoint: `/api/language/supported`
- Confidence scoring for detection accuracy

---

**Last Updated**: January 2026

**Version**: 1.0

**Supported in**: MindVibe v0.1.0+
