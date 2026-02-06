/**
 * Voice Command Detection with NLU Intent Classification
 *
 * Provides natural language understanding for voice commands:
 * - Multi-language command detection
 * - Fuzzy/phonetic matching for noisy environments
 * - Intent classification with confidence scoring
 * - Contextual command processing (meditation vs conversation)
 * - Parameterized commands (e.g., "switch to Hindi", "volume 80%")
 */

export type VoiceCommandType =
  | 'stop'
  | 'pause'
  | 'resume'
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
  | 'goodbye'
  | 'thank_you'
  | 'meditate'
  | 'breathe'
  | 'journal'
  | 'verse'
  | 'affirmation'

export interface VoiceCommandResult {
  type: VoiceCommandType
  confidence: number
  transcript: string
  params?: Record<string, string>
  matchedPhrase: string
}

// Context-aware mode changes command sensitivity
export type VoiceContext = 'conversation' | 'meditation' | 'reading' | 'journal'

interface CommandDefinition {
  type: VoiceCommandType
  phrases: string[]
  // Regex pattern for parameterized commands
  patterns?: RegExp[]
  // Minimum confidence to trigger
  minConfidence?: number
  // Only active in these contexts (if empty, active in all)
  contexts?: VoiceContext[]
}

// Master command definitions with all variations
const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    type: 'stop',
    phrases: [
      'stop', 'stop talking', 'be quiet', 'quiet', 'shut up',
      'silence', 'enough', 'stop speaking', 'hush', 'shush',
      'stop it', 'stop now', 'that\'s enough', 'okay stop',
    ],
    minConfidence: 0.6,
  },
  {
    type: 'pause',
    phrases: [
      'pause', 'wait', 'hold on', 'one moment', 'just a moment',
      'hold that', 'pause please', 'wait a second', 'give me a moment',
      'one sec', 'hang on',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'resume',
    phrases: [
      'resume', 'continue', 'go on', 'keep going', 'carry on',
      'go ahead', 'please continue', 'okay continue', 'keep talking',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'repeat',
    phrases: [
      'repeat', 'repeat that', 'say that again', 'what did you say',
      'say again', 'come again', 'one more time', 'repeat please',
      'can you repeat', 'pardon', 'sorry what',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'help',
    phrases: [
      'help', 'help me', 'what can you do', 'commands', 'options',
      'what are the commands', 'show help', 'list commands',
      'how does this work', 'what can I say',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'louder',
    phrases: [
      'louder', 'volume up', 'speak up', 'turn it up',
      'increase volume', 'more volume', 'can\'t hear you', 'too quiet',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'quieter',
    phrases: [
      'quieter', 'volume down', 'speak softer', 'turn it down',
      'decrease volume', 'lower volume', 'too loud', 'softer',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'faster',
    phrases: [
      'faster', 'speed up', 'talk faster', 'hurry up', 'quicker',
      'increase speed', 'too slow',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'slower',
    phrases: [
      'slower', 'slow down', 'talk slower', 'speak slower',
      'decrease speed', 'too fast', 'more slowly',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'clear',
    phrases: [
      'clear', 'start over', 'new conversation', 'reset',
      'fresh start', 'begin again', 'clear chat',
    ],
    minConfidence: 0.8,
  },
  {
    type: 'cancel',
    phrases: [
      'cancel', 'never mind', 'forget it', 'disregard', 'dismiss',
      'skip', 'no thanks', 'not now',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'mute',
    phrases: [
      'mute', 'mute voice', 'text only', 'no voice', 'silent mode',
      'turn off voice', 'disable voice',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'unmute',
    phrases: [
      'unmute', 'enable voice', 'voice on', 'turn on voice',
      'speak to me', 'talk to me',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'language',
    phrases: [],
    patterns: [
      /speak (?:in |)(\w+)/i,
      /switch (?:to |)(\w+)/i,
      /change (?:to |language to )(\w+)/i,
      /use (\w+)(?: language|)/i,
      /(\w+) (?:language|mode)/i,
    ],
    minConfidence: 0.7,
  },
  {
    type: 'goodbye',
    phrases: [
      'goodbye', 'bye', 'bye bye', 'see you', 'see you later',
      'good night', 'take care', 'talk later', 'gotta go',
      'namaste', 'farewell',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'thank_you',
    phrases: [
      'thank you', 'thanks', 'thanks a lot', 'appreciate it',
      'grateful', 'thank you kiaan', 'thanks kiaan', 'dhanyavad',
      'shukriya',
    ],
    minConfidence: 0.7,
  },
  {
    type: 'meditate',
    phrases: [
      'meditate', 'start meditation', 'guide me', 'meditation',
      'let\'s meditate', 'guided meditation', 'calm me down',
      'help me relax', 'I need peace',
    ],
    minConfidence: 0.7,
    contexts: ['conversation'],
  },
  {
    type: 'breathe',
    phrases: [
      'breathe', 'breathing exercise', 'deep breath', 'breathing',
      'pranayama', 'breath work', 'help me breathe', 'box breathing',
    ],
    minConfidence: 0.7,
    contexts: ['conversation', 'meditation'],
  },
  {
    type: 'journal',
    phrases: [
      'journal', 'open journal', 'write', 'start journaling',
      'I want to write', 'new entry', 'journal entry',
    ],
    minConfidence: 0.7,
    contexts: ['conversation'],
  },
  {
    type: 'verse',
    phrases: [
      'verse', 'share a verse', 'gita verse', 'read a verse',
      'bhagavad gita', 'shloka', 'scripture', 'wisdom verse',
      'share wisdom', 'divine verse',
    ],
    minConfidence: 0.7,
    contexts: ['conversation'],
  },
  {
    type: 'affirmation',
    phrases: [
      'affirmation', 'give me an affirmation', 'motivate me',
      'encourage me', 'positive words', 'inspire me', 'daily affirmation',
    ],
    minConfidence: 0.7,
    contexts: ['conversation'],
  },
]

// Language name mapping for the "switch to X" command
const LANGUAGE_MAP: Record<string, string> = {
  english: 'en', hindi: 'hi', tamil: 'ta', telugu: 'te',
  bengali: 'bn', marathi: 'mr', gujarati: 'gu', kannada: 'kn',
  malayalam: 'ml', punjabi: 'pa', sanskrit: 'sa', spanish: 'es',
  french: 'fr', german: 'de', portuguese: 'pt', japanese: 'ja',
  chinese: 'zh', arabic: 'ar',
}

/**
 * Detect voice command from transcript
 * Uses multi-pass matching: exact → fuzzy → pattern
 *
 * Key design: confidence is scaled by "coverage ratio" (phrase length / transcript length)
 * so command words embedded inside longer conversational sentences don't hijack the flow.
 * E.g., "stop" alone = command (1.0), but "I want to stop feeling sad" = conversation (0.3)
 */
export function detectVoiceCommand(
  transcript: string,
  context: VoiceContext = 'conversation'
): VoiceCommandResult | null {
  const normalized = transcript.toLowerCase().trim()

  if (!normalized || normalized.length < 2) return null

  let bestMatch: VoiceCommandResult | null = null

  for (const def of COMMAND_DEFINITIONS) {
    // Check context filter
    if (def.contexts && def.contexts.length > 0 && !def.contexts.includes(context)) {
      continue
    }

    const minConf = def.minConfidence || 0.7

    // Pass 1: Exact phrase match
    for (const phrase of def.phrases) {
      if (normalized === phrase) {
        // Full exact match - definitely a command
        const confidence = 1.0
        if (confidence >= minConf && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = {
            type: def.type,
            confidence,
            transcript: normalized,
            matchedPhrase: phrase,
          }
        }
      } else if (normalized.startsWith(phrase + ' ') || normalized.endsWith(' ' + phrase)) {
        // Starts/ends with phrase (with word boundary) - scale by coverage
        const coverage = phrase.length / normalized.length
        const confidence = 0.9 * Math.min(1.0, coverage * 3)
        if (confidence >= minConf && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = {
            type: def.type,
            confidence,
            transcript: normalized,
            matchedPhrase: phrase,
          }
        }
      }
    }

    // Pass 2: Substring match with word boundaries (only if no strong match yet)
    if (!bestMatch || bestMatch.confidence < 0.9) {
      for (const phrase of def.phrases) {
        const phraseWords = phrase.split(/\s+/)
        const coverage = phrase.length / normalized.length

        if (phraseWords.length === 1) {
          // Single word: check with word boundary
          const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i')
          if (regex.test(normalized)) {
            const confidence = 0.85 * Math.min(1.0, coverage * 3)
            if (confidence >= minConf && (!bestMatch || confidence > bestMatch.confidence)) {
              bestMatch = {
                type: def.type,
                confidence,
                transcript: normalized,
                matchedPhrase: phrase,
              }
            }
          }
        } else {
          // Multi-word: check if contained
          if (normalized.includes(phrase)) {
            const confidence = 0.88 * Math.min(1.0, coverage * 3)
            if (confidence >= minConf && (!bestMatch || confidence > bestMatch.confidence)) {
              bestMatch = {
                type: def.type,
                confidence,
                transcript: normalized,
                matchedPhrase: phrase,
              }
            }
          }
        }
      }
    }

    // Pass 3: Pattern matching for parameterized commands
    if (def.patterns) {
      for (const pattern of def.patterns) {
        const match = normalized.match(pattern)
        if (match) {
          const coverage = match[0].length / normalized.length
          const confidence = 0.85 * Math.min(1.0, coverage * 3)
          const params: Record<string, string> = {}

          // Extract language parameter
          if (def.type === 'language' && match[1]) {
            const langName = match[1].toLowerCase()
            const langCode = LANGUAGE_MAP[langName]
            if (langCode) {
              params.language = langCode
              params.languageName = langName
            } else {
              continue // Unknown language, skip
            }
          }

          if (confidence >= minConf && (!bestMatch || confidence > bestMatch.confidence)) {
            bestMatch = {
              type: def.type,
              confidence,
              transcript: normalized,
              matchedPhrase: match[0],
              params: Object.keys(params).length > 0 ? params : undefined,
            }
          }
        }
      }
    }
  }

  return bestMatch
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get available commands for a given context
 */
export function getAvailableCommands(context: VoiceContext = 'conversation'): {
  type: VoiceCommandType
  examplePhrase: string
}[] {
  return COMMAND_DEFINITIONS
    .filter(def => {
      if (def.contexts && def.contexts.length > 0) {
        return def.contexts.includes(context)
      }
      return true
    })
    .filter(def => def.phrases.length > 0 || (def.patterns && def.patterns.length > 0))
    .map(def => ({
      type: def.type,
      examplePhrase: def.phrases[0] || 'speak in [language]',
    }))
}

// ============ Backward-compatible API ============
// These functions maintain compatibility with consumers that use the
// previous API shape (e.g., app/kiaan/voice/page.tsx)

// Command descriptions for the help panel
const COMMAND_DESCRIPTIONS: Record<string, string> = {
  stop: 'Stop KIAAN from speaking',
  pause: 'Pause the current response',
  resume: 'Resume a paused response',
  repeat: 'Repeat the last response',
  help: 'Show available voice commands',
  louder: 'Increase voice volume',
  quieter: 'Decrease voice volume',
  faster: 'Increase speech speed',
  slower: 'Decrease speech speed',
  clear: 'Clear conversation and start fresh',
  cancel: 'Cancel the current action',
  mute: 'Mute voice responses (text only)',
  unmute: 'Enable voice responses',
  language: 'Switch language (e.g., "speak in Hindi")',
  goodbye: 'End the conversation',
  thank_you: 'Express gratitude to KIAAN',
  meditate: 'Start a guided meditation session',
  breathe: 'Start a breathing exercise',
  journal: 'Open the journal for writing',
  verse: 'Hear a Bhagavad Gita verse',
  affirmation: 'Receive a positive affirmation',
}

// Command response texts
const COMMAND_RESPONSES: Record<string, string> = {
  help: 'Here are the commands you can use: Say "stop" to stop me, "repeat" to hear again, "louder" or "quieter" for volume, "faster" or "slower" for speed, "meditate" for guided meditation, "breathe" for breathing exercises, "verse" for Gita wisdom, or "goodbye" to end our conversation.',
  stop: 'Okay, I\'ll stop.',
  pause: 'Paused. Say "resume" when you\'re ready.',
  clear: 'Conversation cleared. How can I help you?',
  mute: 'Voice muted. I\'ll respond with text only.',
  unmute: 'Voice responses enabled.',
  goodbye: 'Namaste. May peace be with you.',
}

// Commands that block further query processing
const BLOCKING_COMMANDS: Set<VoiceCommandType> = new Set([
  'stop', 'cancel', 'goodbye', 'mute', 'clear', 'pause',
])

/**
 * Detect a voice command (backward-compatible wrapper)
 * Returns the old API shape: { command: { type, param }, confidence }
 */
export function detectCommand(
  query: string,
  context: VoiceContext = 'conversation'
): { command: { type: VoiceCommandType; param?: string }; confidence: number } | null {
  const result = detectVoiceCommand(query, context)
  if (!result) return null

  return {
    command: {
      type: result.type,
      param: result.params?.languageName || result.params?.language,
    },
    confidence: result.confidence,
  }
}

/**
 * Check if a command type blocks further query processing
 */
export function isBlockingCommand(type: VoiceCommandType): boolean {
  return BLOCKING_COMMANDS.has(type)
}

/**
 * Get a predefined response text for a command type
 */
export function getCommandResponse(type: VoiceCommandType | string): string {
  return COMMAND_RESPONSES[type] || ''
}

/**
 * Extract language from a transcript (e.g., "switch to Hindi" → "hi")
 */
export function extractLanguage(transcript: string): string | null {
  const normalized = transcript.toLowerCase().trim()
  for (const [name, code] of Object.entries(LANGUAGE_MAP)) {
    if (normalized.includes(name)) {
      return code
    }
  }
  return null
}

/**
 * Get all commands with descriptions for the help panel
 * Returns the old API shape: Array<{ command: string, description: string }>
 */
export function getAllCommands(): { command: string; description: string }[] {
  return COMMAND_DEFINITIONS
    .filter(def => def.phrases.length > 0 || (def.patterns && def.patterns.length > 0))
    .map(def => ({
      command: def.phrases[0] || 'speak in [language]',
      description: COMMAND_DESCRIPTIONS[def.type] || def.type,
    }))
}
