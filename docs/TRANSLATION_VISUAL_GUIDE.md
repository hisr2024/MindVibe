# Multi-Language Translation Feature - Visual Guide

## User Journey

### 1. Language Selection
```
┌─────────────────────────────────────┐
│  MindVibe Header                 🌐│ ← Globe icon for language menu
├─────────────────────────────────────┤
│  Click globe icon to see dropdown  │
│                                     │
│  ┌───────────────────────────────┐│
│  │ 🇺🇸 English          [Default]││
│  │ 🇮🇳 हिन्दी (Hindi)            ││
│  │ 🇮🇳 தமிழ் (Tamil)             ││
│  │ 🇮🇳 తెలుగు (Telugu)           ││
│  │ 🇮🇳 বাংলা (Bengali)           ││
│  │ 🇮🇳 मराठी (Marathi)           ││
│  │ 🇮🇳 ગુજરાતી (Gujarati)        ││
│  │ 🇮🇳 ಕನ್ನಡ (Kannada)           ││
│  │ 🇮🇳 മലയാളം (Malayalam)        ││
│  │ 🇮🇳 ਪੰਜਾਬੀ (Punjabi)          ││
│  │ 🇮🇳 संस्कृत (Sanskrit)        ││
│  │ 🇪🇸 Español (Spanish)         ││
│  │ 🇫🇷 Français (French)         ││
│  │ 🇩🇪 Deutsch (German)          ││
│  │ 🇵🇹 Português (Portuguese)    ││
│  │ 🇯🇵 日本語 (Japanese)          ││
│  │ 🇨🇳 简体中文 (Chinese)         ││
│  └───────────────────────────────┘│
└─────────────────────────────────────┘
```

### 2. Chat Interface (Before Translation)
```
┌─────────────────────────────────────┐
│  KIAAN Chat                    [🌐] │
│  Your Guide to Inner Peace          │
├─────────────────────────────────────┤
│                                     │
│  You: How can I find inner peace?  │
│  (10:30 AM)                         │
│                                     │
│  🕉️ KIAAN: [Ancient Wisdom]        │
│  Inner peace begins with           │
│  understanding that you are not    │
│  your thoughts...                  │
│  (10:30 AM)                         │
│                                     │
├─────────────────────────────────────┤
│  Type your message...          [>]  │
└─────────────────────────────────────┘
```

### 3. Chat Interface (After Selecting Spanish)
```
┌─────────────────────────────────────┐
│  KIAAN Chat              [🌐 ES]    │
│  Tu Guía para la Paz Interior       │
├─────────────────────────────────────┤
│                                     │
│  You: ¿Cómo puedo encontrar paz    │
│       interior?                     │
│  (10:30 AM)                         │
│                                     │
│  🕉️ KIAAN: [Sabiduría Antigua]    │
│  La paz interior comienza con      │
│  entender que no eres tus          │
│  pensamientos...                   │
│  (10:30 AM)                         │
│                                     │
│  [ 🌐 Translated | ● ]             │ ← Translation toggle
│                                     │
├─────────────────────────────────────┤
│  Escribe tu mensaje...         [>]  │
└─────────────────────────────────────┘
```

### 4. Translation Toggle (Expanded View)
```
┌─────────────────────────────────────┐
│  KIAAN's Response:                  │
│  ┌─────────────────────────────┐  │
│  │ La paz interior comienza con│  │
│  │ entender que no eres tus    │  │
│  │ pensamientos...             │  │
│  └─────────────────────────────┘  │
│                                     │
│  Toggle View:                       │
│  ┌─────────────┐  ┌──────────────┐│
│  │ 🌐 Original │  │ Translated ● ││ ← Currently showing translated
│  │   (English) │  │  (Español)   ││
│  └─────────────┘  └──────────────┘│
│                                     │
│  [Click to switch]                  │
└─────────────────────────────────────┘
```

### 5. Viewing Original Text
```
After clicking "Original" toggle:

┌─────────────────────────────────────┐
│  🕉️ KIAAN: [Ancient Wisdom]        │
│  Inner peace begins with           │
│  understanding that you are not    │
│  your thoughts...                  │
│  (10:30 AM)                         │
│                                     │
│  [ Original ● | 🌐 Translated ]    │ ← Now showing original
│                                     │
└─────────────────────────────────────┘
```

## Mobile View

### Collapsed Chat (Mobile)
```
┌─────────────────┐
│                 │
│    (App UI)     │
│                 │
│                 │
│                 │
│           ┌───┐ │
│           │ K │ │ ← Floating KIAAN button
│           └───┘ │
└─────────────────┘
```

### Expanded Chat (Mobile)
```
┌───────────────────────────┐
│ KIAAN Chat         [🌐] [×]│
│ Your Guide               │
├───────────────────────────┤
│                           │
│ [Messages scroll here]    │
│                           │
│ 🕉️ KIAAN:                │
│ Inner peace begins...     │
│                           │
│ [ 🌐 Translated | ● ]    │
│                           │
├───────────────────────────┤
│ Type message...      [>]  │
└───────────────────────────┘
```

## Translation Status Indicators

### Success State
```
┌────────────────────────────┐
│ Response delivered         │
│ ✓ Translated to Spanish    │
│ [ 🌐 Translated | ● ]      │
└────────────────────────────┘
```

### Loading State
```
┌────────────────────────────┐
│ Response translating...    │
│ ⟳ Please wait              │
│ [ ⋯ ⋯ ⋯ ]                  │
└────────────────────────────┘
```

### Error State (Fallback)
```
┌────────────────────────────┐
│ Response (Original)        │
│ ⚠ Translation unavailable  │
│ Showing English version    │
└────────────────────────────┘
```

## Translation Badge

When a message is translated, a small badge appears:

```
┌────────────────────────────────┐
│ 🕉️ KIAAN: [Ancient Wisdom]    │
│ La paz interior comienza...    │
│                                │
│ [ 🌐 Translated ]              │ ← Badge
└────────────────────────────────┘
```

## Language Selector Tooltip

Hovering over language selector:

```
┌──────────────────────────────────┐
│              🌐                   │
│  ┌─────────────────────────────┐│
│  │ Select your preferred        ││
│  │ language for chat responses  ││
│  │                              ││
│  │ Current: Español             ││
│  │ Available: 17 languages      ││
│  └─────────────────────────────┘│
└──────────────────────────────────┘
```

## Quick Translation Flow

```
User Flow:
1. User selects language (e.g., Spanish) → 🌐
2. User types message in any language
3. KIAAN responds in English (internal)
4. Backend translates to Spanish
5. User sees Spanish response
6. User can toggle to see original English

Technical Flow:
[User Input] → [Chat API] → [KIAAN Core]
       ↓
[English Response] → [Translation Service]
       ↓
[Translated Response] → [Database Cache]
       ↓
[Return to User] → [Display with Toggle]
```

## Color Coding

- **Translation Toggle**: Blue/Orange theme
  - Blue = Translated view (active)
  - Orange = Original view (English)

- **Status Indicators**:
  - Green checkmark = Success
  - Orange spinner = Loading
  - Red warning = Error/Fallback

## Accessibility Features

```
┌──────────────────────────────────┐
│ All interactive elements have:   │
│ • aria-label attributes          │
│ • Keyboard navigation support    │
│ • Screen reader announcements    │
│ • High contrast mode support     │
│ • Focus indicators               │
└──────────────────────────────────┘
```

## Settings Integration (Future)

```
┌─────────────────────────────────┐
│ Language Preferences            │
├─────────────────────────────────┤
│                                 │
│ Preferred Language:             │
│ [ Español ▼ ]                   │
│                                 │
│ □ Auto-translate all messages   │
│ ☑ Show translation toggle       │
│ □ Always show original first    │
│                                 │
│ [ Save Preferences ]            │
└─────────────────────────────────┘
```

---

## Visual Summary

The translation feature integrates seamlessly with the existing KIAAN chat interface:

1. **Minimal UI Changes**: Only a globe icon and small toggle button
2. **Clear Feedback**: Status indicators for translation state
3. **User Control**: Easy toggle between original and translated
4. **Persistent**: Language preference saved across sessions
5. **Accessible**: Fully keyboard and screen reader compatible

The design follows MindVibe's existing aesthetic with warm orange tones and calming gradients.
