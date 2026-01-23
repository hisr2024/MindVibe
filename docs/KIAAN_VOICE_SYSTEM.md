# KIAAN Voice System Documentation

## Overview

The KIAAN Voice System is a comprehensive, Siri/Alexa-class voice AI interface that enables hands-free interaction with KIAAN's wisdom guidance. This document covers the architecture, features, and usage of the voice system.

## Table of Contents

1. [Features](#features)
2. [Wake Words](#wake-words)
3. [Voice Commands](#voice-commands)
4. [Sound Effects](#sound-effects)
5. [Architecture](#architecture)
6. [Browser Support](#browser-support)
7. [Privacy & Security](#privacy--security)
8. [Troubleshooting](#troubleshooting)
9. [Developer Guide](#developer-guide)

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Wake Word Detection** | Say "Hey KIAAN" to activate hands-free mode |
| **Speech-to-Text** | Real-time voice transcription with interim results |
| **Text-to-Speech** | Natural voice responses using Web Speech API |
| **Voice Commands** | Control playback, volume, speed, and more |
| **Offline Support** | Works offline with cached wisdom responses |
| **Multi-language** | Supports 17+ languages |
| **Sound Effects** | Audio feedback for all interactions |
| **Haptic Feedback** | Vibration patterns on mobile devices |

### Voice Interface States

```
idle -> wakeword -> listening -> thinking -> speaking -> idle
                                    |
                                    v
                                  error
```

---

## Wake Words

KIAAN responds to multiple wake word variations for natural interaction:

### Primary Wake Words
- "Hey KIAAN" / "Hey Kian"
- "Hi KIAAN" / "Hi Kian"
- "OK KIAAN" / "Okay KIAAN"

### MindVibe Variations
- "Hey MindVibe"
- "Hi MindVibe"
- "OK MindVibe"

### Cultural/Spiritual Variations
- "Namaste KIAAN"
- "Om KIAAN"

### Casual Variations
- "Hello KIAAN"
- "Yo KIAAN"

### Action Variations
- "KIAAN help"
- "Ask KIAAN"

### Fuzzy Matching

The system includes fuzzy matching to handle common speech recognition errors:
- "Kion", "Keaan", "Kean", "Kyaan" are recognized as "KIAAN"
- "Mind vibe", "Mindfi" are recognized as "MindVibe"
- "Namastay", "Namasthe" are recognized as "Namaste"

---

## Voice Commands

Say these commands during a conversation for special actions:

### Playback Control

| Command | Variations | Action |
|---------|------------|--------|
| **Stop** | "stop", "be quiet", "silence", "enough" | Stop speaking |
| **Pause** | "wait", "hold on", "one moment" | Pause interaction |
| **Repeat** | "repeat", "say that again", "what did you say" | Repeat last response |

### Volume & Speed

| Command | Variations | Action |
|---------|------------|--------|
| **Louder** | "speak louder", "volume up", "can't hear you" | Increase volume 25% |
| **Quieter** | "speak quieter", "volume down", "too loud" | Decrease volume 25% |
| **Faster** | "speak faster", "speed up", "hurry up" | Increase speech rate |
| **Slower** | "speak slower", "slow down", "too fast" | Decrease speech rate |

### Session Control

| Command | Variations | Action |
|---------|------------|--------|
| **Clear** | "clear", "start over", "new conversation" | Clear conversation history |
| **Cancel** | "never mind", "forget it", "dismiss" | Cancel current action |
| **Help** | "help", "what can you do", "commands" | Show voice commands |

### Voice Mode

| Command | Variations | Action |
|---------|------------|--------|
| **Mute** | "mute", "silent mode", "text only" | Disable voice responses |
| **Unmute** | "unmute", "voice mode", "start speaking" | Enable voice responses |

### Language

| Command | Example | Action |
|---------|---------|--------|
| **Change Language** | "Speak in Hindi", "Switch to Spanish" | Change voice language |

### Session End

| Command | Variations | Action |
|---------|------------|--------|
| **Goodbye** | "goodbye", "bye", "see you later", "exit" | End voice session |
| **Thank You** | "thank you", "thanks", "appreciate it" | Acknowledge gratitude |

---

## Sound Effects

All sounds are procedurally generated using the Web Audio API - no external audio files required.

### Interaction Sounds

| Sound | Trigger | Description |
|-------|---------|-------------|
| `wakeWord` | Wake word detected | 800Hz beep (0.15s) |
| `listening` | Started listening | Ascending two-tone (440Hz → 660Hz) |
| `thinking` | AI processing | Low hum (300Hz, 0.5s) |
| `success` | Query completed | Ascending chord (C5-E5-G5) |
| `error` | Error occurred | Descending sawtooth (200Hz → 150Hz) |

### UI Sounds

| Sound | Trigger | Description |
|-------|---------|-------------|
| `click` | Button press | Short click (1000Hz, 0.05s) |
| `toggle` | Toggle switch | Two-tone (600Hz → 800Hz) |
| `notification` | Alert/notification | High two-tone (880Hz → 1100Hz) |
| `message` | New message | Medium two-tone (700Hz → 900Hz) |
| `complete` | Task complete | Ascending chord (G4-C5-E5) |

### Spiritual Sounds

| Sound | Trigger | Description |
|-------|---------|-------------|
| `omChime` | Meditation/goodbye | Om frequency harmonics (136.1Hz base) |
| `singingBowl` | Mindfulness moments | 528Hz healing frequency with harmonics |

### Haptic Patterns

| Pattern | Vibration | Use Case |
|---------|-----------|----------|
| `light` | 10ms | Subtle feedback |
| `medium` | 30ms | Standard interaction |
| `heavy` | 50ms | Important action |
| `success` | 30-50-30ms | Positive confirmation |
| `error` | 50-100-50-100-50ms | Error notification |

---

## Architecture

### File Structure

```
/utils
  /audio
    soundEffects.ts      # Sound effects engine
  /speech
    recognition.ts       # Speech recognition service
    wakeWord.ts          # Wake word detection
    voiceCommands.ts     # Voice command processing
    languageMapping.ts   # Language code mapping

/hooks
  useVoiceInput.ts       # Voice input React hook
  useWakeWord.ts         # Wake word React hook

/components
  /voice
    WakeWordDetector.tsx # Wake word component
    VoiceInputButton.tsx # Voice input button
    VoiceSettingsPanel.tsx # Settings UI

/app/kiaan/voice
  page.tsx               # Main voice interface
```

### Core Components

#### SpeechRecognitionService
Wraps the Web Speech API with:
- Language mapping
- Error handling
- Silence detection
- Auto-stop behavior

#### WakeWordDetector
Continuous background listener with:
- Fuzzy matching
- Cooldown prevention
- Auto-restart with exponential backoff
- Error classification

#### Voice Commands Processor
Detects and handles special commands:
- Pattern matching with variations
- Confidence scoring
- Blocking vs non-blocking commands

#### Sound Effects Engine
Procedural audio generation:
- Web Audio API oscillators
- Gain envelope control
- Multi-tone sequences
- Haptic feedback integration

---

## Browser Support

### Full Support
- **Chrome** (Desktop & Mobile) - Full features
- **Edge** (Desktop & Mobile) - Full features
- **Safari** (Desktop & iOS) - Full features

### Limited Support
- **Firefox** - No Speech Recognition API (text-to-speech only)

### Requirements
1. **HTTPS or localhost** - Secure context required
2. **Microphone permission** - Must be granted by user
3. **Audio Context** - For sound effects

---

## Privacy & Security

### Data Handling
- **Client-side processing** - All voice processing happens in the browser
- **No audio recording** - Audio streams are not stored
- **No external transmission** - Voice data never leaves the device
- **Permission-based** - Microphone requires explicit user consent

### Security Measures
- HTTPS enforcement in production
- Secure context validation
- Permission status tracking
- Graceful degradation

---

## Troubleshooting

### Common Issues

#### "Microphone permission denied"
1. Click the lock icon in your browser's address bar
2. Find "Microphone" in site settings
3. Change to "Allow"
4. Refresh the page

#### "Speech recognition not supported"
- Use Chrome, Edge, or Safari
- Firefox does not support Speech Recognition API

#### "Voice features require HTTPS"
- Access the site via `https://` or use `localhost` for development

#### "No speech detected"
- Speak clearly and at normal volume
- Check microphone connection
- Reduce background noise

#### Wake word not responding
- Ensure microphone permission is granted
- Check that wake word mode is enabled (toggle shows "Wake Word On")
- Speak the wake word clearly

### Debug Information

The voice page shows browser diagnostics:
- Browser name
- Secure context status
- Speech Recognition support
- MediaDevices API availability

---

## Developer Guide

### Adding New Wake Words

Edit `/utils/speech/wakeWord.ts`:

```typescript
export const DEFAULT_WAKE_WORDS = [
  // Add new wake words here
  'hey kiaan',
  'your new wake word',
]
```

### Adding New Voice Commands

Edit `/utils/speech/voiceCommands.ts`:

```typescript
// 1. Add to COMMAND_PATTERNS
const COMMAND_PATTERNS: Record<VoiceCommandType, string[]> = {
  your_command: [
    'pattern 1',
    'pattern 2',
  ],
}

// 2. Add response
const COMMAND_RESPONSES: Record<VoiceCommandType, string> = {
  your_command: 'Response text',
}

// 3. Handle in voice page
function handleVoiceCommand(commandType: VoiceCommandType) {
  switch (commandType) {
    case 'your_command':
      // Your logic here
      return true
  }
}
```

### Adding New Sound Effects

Edit `/utils/audio/soundEffects.ts`:

```typescript
// Add to SoundType
export type SoundType =
  | 'existing'
  | 'your_sound'

// Add configuration
const SOUND_CONFIGS: Record<SoundType, SoundConfig | SoundConfig[]> = {
  your_sound: {
    frequency: 440,  // Hz
    duration: 0.1,   // seconds
    type: 'sine',    // 'sine' | 'square' | 'sawtooth' | 'triangle'
    volume: 0.3,     // 0-1
    ramp: 'exponential', // or 'linear'
  },
}
```

### Using Sound Effects

```typescript
import { playSound, playSoundWithHaptic, playOmChime } from '@/utils/audio/soundEffects'

// Play a sound
playSound('success')

// Play with haptic feedback
playSoundWithHaptic('notification', 'medium')

// Play spiritual sounds
playOmChime()
```

### Using Voice Input Hook

```typescript
import { useVoiceInput } from '@/hooks/useVoiceInput'

const {
  isListening,
  transcript,
  interimTranscript,
  isSupported,
  error,
  startListening,
  stopListening,
  resetTranscript,
} = useVoiceInput({
  language: 'en',
  onTranscript: (text, isFinal) => {
    if (isFinal) {
      handleFinalTranscript(text)
    }
  },
  onError: (error) => {
    console.error(error)
  },
})
```

### Using Wake Word Hook

```typescript
import { useWakeWord } from '@/hooks/useWakeWord'

const {
  isActive,
  isSupported,
  error,
  start,
  stop,
  toggle,
} = useWakeWord({
  language: 'en',
  onWakeWordDetected: () => {
    // User said the wake word
    startListening()
  },
  onError: (error) => {
    console.warn(error)
  },
})
```

---

## Version History

### v2.0.0 (Current)
- Added 24 wake word variations
- Enhanced fuzzy matching for speech recognition errors
- Added 10 sound effect types
- Added 15 voice commands with natural language variations
- Improved error handling with classification
- Added mute/unmute functionality
- Added volume and speed controls
- Added help panel with command reference
- Added spiritual sounds (Om chime, singing bowl)

### v1.0.0
- Basic wake word detection
- Speech-to-text input
- Text-to-speech output
- Offline support
- Multi-language support

---

## Support

For issues or feature requests, please open an issue in the MindVibe repository.

**Namaste** 🙏
