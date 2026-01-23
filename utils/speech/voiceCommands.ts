/**
 * Voice Commands for KIAAN Voice System
 *
 * Handles special voice commands like "stop", "repeat", "help", etc.
 * These commands are processed before sending to the AI.
 */

export type VoiceCommandType =
  | 'stop'
  | 'pause'
  | 'repeat'
  | 'help'
  | 'louder'
  | 'quieter'
  | 'faster'
  | 'slower'
  | 'clear'
  | 'cancel'
  | 'mute'
  | 'unmute'
  | 'language'
  | 'reset'
  | 'goodbye'
  | 'thank_you'
  | 'none'

export interface VoiceCommand {
  type: VoiceCommandType
  action: string
  response?: string
  param?: string
}

export interface VoiceCommandMatch {
  command: VoiceCommand
  confidence: number
}

// Command patterns with variations for natural speech
const COMMAND_PATTERNS: Record<VoiceCommandType, string[]> = {
  stop: [
    'stop',
    'stop speaking',
    'stop talking',
    'be quiet',
    'shut up',
    'silence',
    'enough',
    'that\'s enough',
    'stop it',
    'quiet',
    'shush',
  ],
  pause: [
    'pause',
    'wait',
    'hold on',
    'one moment',
    'one second',
    'hang on',
    'just a moment',
    'give me a second',
  ],
  repeat: [
    'repeat',
    'repeat that',
    'say that again',
    'what did you say',
    'can you repeat',
    'please repeat',
    'again',
    'one more time',
    'i didn\'t catch that',
    'pardon',
    'sorry what',
  ],
  help: [
    'help',
    'help me',
    'i need help',
    'what can you do',
    'what are your features',
    'how do i use this',
    'instructions',
    'commands',
    'what commands',
    'voice commands',
    'tutorial',
  ],
  louder: [
    'louder',
    'speak louder',
    'volume up',
    'increase volume',
    'can\'t hear you',
    'too quiet',
    'speak up',
    'more volume',
  ],
  quieter: [
    'quieter',
    'speak quieter',
    'volume down',
    'decrease volume',
    'too loud',
    'lower volume',
    'softer',
    'less volume',
  ],
  faster: [
    'faster',
    'speak faster',
    'speed up',
    'quicker',
    'hurry up',
    'too slow',
  ],
  slower: [
    'slower',
    'speak slower',
    'slow down',
    'too fast',
    'more slowly',
  ],
  clear: [
    'clear',
    'clear conversation',
    'clear chat',
    'start over',
    'new conversation',
    'fresh start',
    'clear history',
    'delete history',
    'forget everything',
  ],
  cancel: [
    'cancel',
    'never mind',
    'nevermind',
    'forget it',
    'forget that',
    'don\'t worry',
    'dismiss',
  ],
  mute: [
    'mute',
    'mute yourself',
    'don\'t speak',
    'silent mode',
    'text only',
  ],
  unmute: [
    'unmute',
    'speak again',
    'voice mode',
    'start speaking',
    'turn on voice',
  ],
  language: [
    'change language',
    'switch language',
    'speak in',
    'language',
    'hindi please',
    'spanish please',
    'english please',
  ],
  reset: [
    'reset',
    'reset settings',
    'default settings',
    'restore defaults',
  ],
  goodbye: [
    'goodbye',
    'bye',
    'bye bye',
    'see you',
    'see you later',
    'goodnight',
    'i\'m done',
    'that\'s all',
    'exit',
    'close',
  ],
  thank_you: [
    'thank you',
    'thanks',
    'thank you kiaan',
    'thanks kiaan',
    'appreciate it',
    'grateful',
    'you\'re helpful',
    'that helped',
  ],
  none: [],
}

// Command responses
const COMMAND_RESPONSES: Record<VoiceCommandType, string> = {
  stop: '',
  pause: 'Okay, I\'ll wait.',
  repeat: '', // Will repeat last response
  help: `Here are some commands you can use:
    - Say "stop" to stop me from speaking
    - Say "repeat" to hear my last response again
    - Say "louder" or "quieter" to adjust volume
    - Say "faster" or "slower" to adjust speech speed
    - Say "clear" to start a new conversation
    - Say "help" anytime to hear these options
    Just speak naturally, and I'll understand what you need.`,
  louder: 'Okay, speaking louder now.',
  quieter: 'Okay, speaking quieter now.',
  faster: 'Okay, speaking faster now.',
  slower: 'Okay, speaking more slowly now.',
  clear: 'Conversation cleared. How can I help you?',
  cancel: 'Okay, cancelled.',
  mute: 'Okay, I\'ll respond with text only.',
  unmute: 'Voice responses enabled.',
  language: 'Which language would you like me to speak?',
  reset: 'Settings reset to defaults.',
  goodbye: 'Goodbye! Take care, and may peace be with you. Namaste.',
  thank_you: 'You\'re welcome! I\'m always here to help. Namaste.',
  none: '',
}

/**
 * Detect if the transcript contains a voice command
 */
export function detectCommand(transcript: string): VoiceCommandMatch | null {
  const normalized = transcript.toLowerCase().trim()

  for (const [commandType, patterns] of Object.entries(COMMAND_PATTERNS)) {
    if (commandType === 'none') continue

    for (const pattern of patterns) {
      // Check for exact match or if transcript starts/ends with command
      if (
        normalized === pattern ||
        normalized.startsWith(pattern + ' ') ||
        normalized.endsWith(' ' + pattern) ||
        normalized.includes(' ' + pattern + ' ')
      ) {
        return {
          command: {
            type: commandType as VoiceCommandType,
            action: commandType,
            response: COMMAND_RESPONSES[commandType as VoiceCommandType],
          },
          confidence: normalized === pattern ? 1.0 : 0.8,
        }
      }
    }
  }

  // Check for language change with specific language
  const languageMatch = normalized.match(
    /(?:speak in|switch to|change to|use)\s+(english|hindi|spanish|french|german|chinese|japanese|arabic|portuguese)/i
  )
  if (languageMatch) {
    return {
      command: {
        type: 'language',
        action: 'language',
        response: `Switching to ${languageMatch[1]}.`,
        param: languageMatch[1].toLowerCase(),
      },
      confidence: 0.9,
    }
  }

  return null
}

/**
 * Check if command should stop AI processing
 */
export function isBlockingCommand(type: VoiceCommandType): boolean {
  return [
    'stop',
    'pause',
    'cancel',
    'clear',
    'mute',
    'goodbye',
  ].includes(type)
}

/**
 * Check if command needs special handling
 */
export function isSpecialCommand(type: VoiceCommandType): boolean {
  return [
    'repeat',
    'help',
    'louder',
    'quieter',
    'faster',
    'slower',
    'language',
    'mute',
    'unmute',
  ].includes(type)
}

/**
 * Get the response for a command
 */
export function getCommandResponse(type: VoiceCommandType): string {
  return COMMAND_RESPONSES[type] || ''
}

/**
 * Extract language from language change command
 */
export function extractLanguage(transcript: string): string | null {
  const normalized = transcript.toLowerCase()
  const languages: Record<string, string> = {
    english: 'en',
    hindi: 'hi',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    chinese: 'zh',
    japanese: 'ja',
    arabic: 'ar',
    portuguese: 'pt',
    tamil: 'ta',
    telugu: 'te',
    bengali: 'bn',
    marathi: 'mr',
    gujarati: 'gu',
    kannada: 'kn',
    malayalam: 'ml',
    punjabi: 'pa',
    sanskrit: 'sa',
  }

  for (const [name, code] of Object.entries(languages)) {
    if (normalized.includes(name)) {
      return code
    }
  }

  return null
}

/**
 * Get all available commands for help display
 */
export function getAllCommands(): Array<{ command: string; description: string }> {
  return [
    { command: 'Stop', description: 'Stop KIAAN from speaking' },
    { command: 'Repeat', description: 'Repeat the last response' },
    { command: 'Help', description: 'Show available commands' },
    { command: 'Louder / Quieter', description: 'Adjust voice volume' },
    { command: 'Faster / Slower', description: 'Adjust speech speed' },
    { command: 'Clear', description: 'Start a new conversation' },
    { command: 'Mute / Unmute', description: 'Toggle voice responses' },
    { command: 'Speak in [language]', description: 'Change language' },
    { command: 'Goodbye', description: 'End the session' },
  ]
}
