/**
 * Quantum Voice Commands - Hands-Free Voice Control for Quantum Dive
 *
 * Enables natural voice control during Quantum Dive sessions:
 * - Session control: "Pause", "Resume", "Skip", "Repeat"
 * - Navigation: "Go deeper", "Previous layer", "Next insight"
 * - Audio control: "Louder", "Softer", "Mute sounds"
 * - Breathing: "Start breathing", "Different pattern"
 * - Information: "Where am I?", "How long left?"
 *
 * Uses Web Speech API for recognition with custom command matching.
 * Supports multiple languages aligned with UnifiedLanguageSupport.
 */

import type { ConsciousnessLayer } from './QuantumDiveEngine'
import type { QuantumDiveStage } from './QuantumDiveOrchestrator'
import type { BreathingPatternType } from './BreathSyncEngine'

// ============ Types & Interfaces ============

/**
 * Command categories
 */
export type CommandCategory =
  | 'session'      // Pause, resume, skip, stop
  | 'navigation'   // Go deeper, previous, next
  | 'audio'        // Volume, mute, sounds
  | 'breathing'    // Start, stop, change pattern
  | 'information'  // Status, time, layer info
  | 'response'     // User responses to prompts

/**
 * Voice command definition
 */
export interface VoiceCommand {
  id: string
  category: CommandCategory
  phrases: string[]           // Trigger phrases (English)
  aliases: Record<string, string[]>  // Localized aliases
  action: string              // Action identifier
  requiresConfirmation?: boolean
  availableDuring?: QuantumDiveStage[]  // When command is valid
}

/**
 * Recognized command result
 */
export interface RecognizedCommand {
  command: VoiceCommand
  transcript: string
  confidence: number
  parameters?: Record<string, string>
  timestamp: number
}

/**
 * Engine state
 */
export interface VoiceCommandsState {
  isListening: boolean
  isProcessing: boolean
  lastCommand: RecognizedCommand | null
  lastTranscript: string
  confidence: number
  language: string
  errorCount: number
}

/**
 * Engine configuration
 */
export interface VoiceCommandsConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  confidenceThreshold?: number
  onCommand?: (command: RecognizedCommand) => void
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onStateChange?: (state: VoiceCommandsState) => void
  onError?: (error: string) => void
}

/**
 * Command handler
 */
export type CommandHandler = (
  command: RecognizedCommand,
  context: CommandContext
) => Promise<CommandResponse>

/**
 * Command context
 */
export interface CommandContext {
  currentStage: QuantumDiveStage
  currentLayer: ConsciousnessLayer | null
  isPlaying: boolean
  volume: number
  breathingActive: boolean
}

/**
 * Command response
 */
export interface CommandResponse {
  success: boolean
  action: string
  message?: string
  voiceFeedback?: string
  data?: Record<string, unknown>
}

// ============ Constants ============

/**
 * Available voice commands
 */
export const VOICE_COMMANDS: VoiceCommand[] = [
  // Session Control
  {
    id: 'pause',
    category: 'session',
    phrases: ['pause', 'wait', 'hold on', 'stop'],
    aliases: {
      hi: ['रुको', 'रुक जाओ', 'ठहरो'],
      es: ['pausa', 'espera', 'detente'],
      fr: ['pause', 'attends', 'arrête']
    },
    action: 'session.pause'
  },
  {
    id: 'resume',
    category: 'session',
    phrases: ['resume', 'continue', 'go on', 'proceed'],
    aliases: {
      hi: ['जारी रखो', 'आगे बढ़ो', 'चलो'],
      es: ['continuar', 'sigue', 'adelante'],
      fr: ['continue', 'reprends', 'poursuis']
    },
    action: 'session.resume'
  },
  {
    id: 'skip',
    category: 'session',
    phrases: ['skip', 'next', 'move on', 'skip this'],
    aliases: {
      hi: ['छोड़ो', 'अगला', 'आगे जाओ'],
      es: ['saltar', 'siguiente', 'avanza'],
      fr: ['sauter', 'suivant', 'avance']
    },
    action: 'session.skip'
  },
  {
    id: 'repeat',
    category: 'session',
    phrases: ['repeat', 'again', 'say again', 'repeat that'],
    aliases: {
      hi: ['दोहराओ', 'फिर से', 'फिर बोलो'],
      es: ['repetir', 'otra vez', 'repite'],
      fr: ['répète', 'encore', 'redis']
    },
    action: 'session.repeat'
  },
  {
    id: 'stop_session',
    category: 'session',
    phrases: ['stop session', 'end session', 'quit', 'exit'],
    aliases: {
      hi: ['सत्र समाप्त करो', 'बंद करो'],
      es: ['terminar sesión', 'salir'],
      fr: ['terminer session', 'quitter']
    },
    action: 'session.stop',
    requiresConfirmation: true
  },

  // Navigation
  {
    id: 'go_deeper',
    category: 'navigation',
    phrases: ['go deeper', 'deeper', 'explore more', 'dive deeper'],
    aliases: {
      hi: ['गहरे जाओ', 'और गहरा', 'गहराई में'],
      es: ['más profundo', 'profundiza'],
      fr: ['plus profond', 'approfondir']
    },
    action: 'navigation.deeper',
    availableDuring: ['scanning', 'layer_deep_dive', 'insights']
  },
  {
    id: 'previous_layer',
    category: 'navigation',
    phrases: ['previous layer', 'go back', 'back', 'previous'],
    aliases: {
      hi: ['पिछली परत', 'पीछे जाओ', 'वापस'],
      es: ['capa anterior', 'atrás', 'volver'],
      fr: ['couche précédente', 'retour']
    },
    action: 'navigation.previous'
  },
  {
    id: 'next_layer',
    category: 'navigation',
    phrases: ['next layer', 'next', 'forward', 'move forward'],
    aliases: {
      hi: ['अगली परत', 'आगे', 'अगला'],
      es: ['siguiente capa', 'adelante', 'siguiente'],
      fr: ['couche suivante', 'suivant', 'avancer']
    },
    action: 'navigation.next'
  },
  {
    id: 'focus_layer',
    category: 'navigation',
    phrases: ['focus on', 'show me', 'explore'],
    aliases: {
      hi: ['ध्यान दो', 'दिखाओ', 'खोजो'],
      es: ['enfoca en', 'muéstrame', 'explora'],
      fr: ['concentre sur', 'montre-moi', 'explore']
    },
    action: 'navigation.focus'
  },

  // Audio Control
  {
    id: 'volume_up',
    category: 'audio',
    phrases: ['louder', 'volume up', 'increase volume', 'turn up'],
    aliases: {
      hi: ['आवाज़ बढ़ाओ', 'तेज़ करो', 'ज़ोर से'],
      es: ['más alto', 'sube el volumen', 'más fuerte'],
      fr: ['plus fort', 'augmente le volume', 'monte']
    },
    action: 'audio.volumeUp'
  },
  {
    id: 'volume_down',
    category: 'audio',
    phrases: ['softer', 'volume down', 'decrease volume', 'turn down', 'quieter'],
    aliases: {
      hi: ['आवाज़ कम करो', 'धीरे करो', 'कम'],
      es: ['más bajo', 'baja el volumen', 'más suave'],
      fr: ['plus doux', 'baisse le volume', 'moins fort']
    },
    action: 'audio.volumeDown'
  },
  {
    id: 'mute',
    category: 'audio',
    phrases: ['mute', 'silence', 'quiet', 'mute sounds'],
    aliases: {
      hi: ['म्यूट', 'शांत', 'चुप'],
      es: ['silencio', 'mudo', 'silencia'],
      fr: ['muet', 'silence', 'couper le son']
    },
    action: 'audio.mute'
  },
  {
    id: 'unmute',
    category: 'audio',
    phrases: ['unmute', 'sound on', 'restore sound'],
    aliases: {
      hi: ['आवाज़ चालू', 'ध्वनि वापस'],
      es: ['activar sonido', 'quitar silencio'],
      fr: ['réactiver son', 'remettre le son']
    },
    action: 'audio.unmute'
  },
  {
    id: 'toggle_music',
    category: 'audio',
    phrases: ['toggle music', 'background music', 'ambient sounds'],
    aliases: {
      hi: ['संगीत टॉगल', 'पृष्ठभूमि संगीत'],
      es: ['cambiar música', 'música de fondo'],
      fr: ['basculer musique', 'musique de fond']
    },
    action: 'audio.toggleMusic'
  },

  // Breathing Control
  {
    id: 'start_breathing',
    category: 'breathing',
    phrases: ['start breathing', 'breathing exercise', 'guide my breath', 'breathe with me'],
    aliases: {
      hi: ['साँस शुरू करो', 'साँस व्यायाम', 'मेरी साँस गाइड करो'],
      es: ['iniciar respiración', 'ejercicio de respiración', 'guía mi respiración'],
      fr: ['commencer respiration', 'exercice de respiration', 'guide ma respiration']
    },
    action: 'breathing.start'
  },
  {
    id: 'stop_breathing',
    category: 'breathing',
    phrases: ['stop breathing', 'end breathing', 'stop breath exercise'],
    aliases: {
      hi: ['साँस रोको', 'साँस व्यायाम बंद करो'],
      es: ['detener respiración', 'terminar respiración'],
      fr: ['arrêter respiration', 'terminer respiration']
    },
    action: 'breathing.stop'
  },
  {
    id: 'change_pattern',
    category: 'breathing',
    phrases: ['different pattern', 'change pattern', 'another breathing', 'switch pattern'],
    aliases: {
      hi: ['अलग पैटर्न', 'पैटर्न बदलो', 'दूसरी साँस'],
      es: ['patrón diferente', 'cambiar patrón', 'otra respiración'],
      fr: ['autre motif', 'changer motif', 'autre respiration']
    },
    action: 'breathing.changePattern'
  },

  // Information
  {
    id: 'where_am_i',
    category: 'information',
    phrases: ['where am i', 'current status', 'what stage', 'where are we'],
    aliases: {
      hi: ['मैं कहाँ हूँ', 'वर्तमान स्थिति', 'कौन सा चरण'],
      es: ['dónde estoy', 'estado actual', 'qué etapa'],
      fr: ['où suis-je', 'statut actuel', 'quelle étape']
    },
    action: 'info.status'
  },
  {
    id: 'time_left',
    category: 'information',
    phrases: ['how long left', 'time remaining', 'how much longer', 'when done'],
    aliases: {
      hi: ['कितना समय बाकी', 'शेष समय', 'कितना और'],
      es: ['cuánto falta', 'tiempo restante', 'cuánto más'],
      fr: ['combien de temps', 'temps restant', 'encore combien']
    },
    action: 'info.timeLeft'
  },
  {
    id: 'current_layer',
    category: 'information',
    phrases: ['current layer', 'which layer', 'what layer', 'tell me about this layer'],
    aliases: {
      hi: ['वर्तमान परत', 'कौन सी परत', 'इस परत के बारे में बताओ'],
      es: ['capa actual', 'qué capa', 'cuéntame sobre esta capa'],
      fr: ['couche actuelle', 'quelle couche', 'parle-moi de cette couche']
    },
    action: 'info.currentLayer'
  },

  // Responses (for interactive prompts)
  {
    id: 'yes',
    category: 'response',
    phrases: ['yes', 'yeah', 'yep', 'correct', 'right', 'okay', 'ok', 'sure'],
    aliases: {
      hi: ['हाँ', 'हां', 'जी', 'ठीक है', 'बिल्कुल'],
      es: ['sí', 'vale', 'correcto', 'claro'],
      fr: ['oui', 'ouais', 'd\'accord', 'correct']
    },
    action: 'response.yes'
  },
  {
    id: 'no',
    category: 'response',
    phrases: ['no', 'nope', 'not', 'negative', 'wrong'],
    aliases: {
      hi: ['नहीं', 'ना', 'गलत'],
      es: ['no', 'negativo', 'incorrecto'],
      fr: ['non', 'pas', 'négatif']
    },
    action: 'response.no'
  }
]

/**
 * Layer name aliases for recognition
 */
export const LAYER_ALIASES: Record<ConsciousnessLayer, string[]> = {
  annamaya: ['annamaya', 'physical', 'body', 'physical layer', 'body layer', 'anna maya'],
  pranamaya: ['pranamaya', 'energy', 'vital', 'prana', 'energy layer', 'prana maya'],
  manomaya: ['manomaya', 'mental', 'mind', 'emotional', 'mind layer', 'mano maya'],
  vijnanamaya: ['vijnanamaya', 'wisdom', 'intellect', 'insight', 'wisdom layer', 'vijnana maya'],
  anandamaya: ['anandamaya', 'bliss', 'spirit', 'spiritual', 'bliss layer', 'ananda maya']
}

/**
 * Breathing pattern aliases
 */
export const PATTERN_ALIASES: Record<BreathingPatternType, string[]> = {
  relaxing_478: ['4-7-8', 'relaxing', 'calming', 'sleep', 'anxiety'],
  box_breathing: ['box', 'square', 'navy seal', 'focus'],
  pranayama_basic: ['pranayama', 'yogic', 'yoga'],
  pranayama_calm: ['deep pranayama', 'deep calm', 'extended'],
  natural: ['natural', 'gentle', 'easy', 'simple'],
  energizing: ['energizing', 'energy', 'wake up', 'alert'],
  coherent: ['coherent', 'heart', 'balanced', '5-5'],
  custom: ['custom', 'my pattern']
}

// ============ Engine Class ============

/**
 * Quantum Voice Commands Engine
 *
 * Provides hands-free voice control during Quantum Dive sessions.
 */
export class QuantumVoiceCommands {
  private recognition: SpeechRecognition | null = null
  private isInitialized: boolean = false

  private state: VoiceCommandsState = {
    isListening: false,
    isProcessing: false,
    lastCommand: null,
    lastTranscript: '',
    confidence: 0,
    language: 'en-US',
    errorCount: 0
  }

  private config: VoiceCommandsConfig = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    confidenceThreshold: 0.6
  }

  private commandHandlers: Map<string, CommandHandler> = new Map()
  private pendingConfirmation: RecognizedCommand | null = null

  constructor(options?: VoiceCommandsConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
      this.state.language = options.language ?? 'en-US'
    }
  }

  /**
   * Check browser support
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  }

  /**
   * Initialize speech recognition
   */
  async initialize(): Promise<boolean> {
    if (!QuantumVoiceCommands.isSupported()) {
      console.warn('QuantumVoiceCommands: Speech Recognition not supported')
      return false
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognitionAPI() as SpeechRecognition

      recognition.continuous = this.config.continuous ?? true
      recognition.interimResults = this.config.interimResults ?? true
      recognition.lang = this.config.language ?? 'en-US'

      this.recognition = recognition
      this.setupEventHandlers()

      this.isInitialized = true
      console.log('QuantumVoiceCommands: Initialized successfully')
      return true
    } catch (error) {
      console.error('QuantumVoiceCommands: Initialization failed', error)
      return false
    }
  }

  /**
   * Start listening for commands
   */
  start(): void {
    if (!this.recognition || this.state.isListening) return

    try {
      this.recognition.start()
      this.state.isListening = true
      this.state.errorCount = 0
      this.emitState()
    } catch (error) {
      console.error('QuantumVoiceCommands: Failed to start', error)
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition || !this.state.isListening) return

    try {
      this.recognition.stop()
      this.state.isListening = false
      this.emitState()
    } catch {
      // Ignore stop errors
    }
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.state.language = language
    if (this.recognition) {
      this.recognition.lang = language
    }
    this.emitState()
  }

  /**
   * Register a command handler
   */
  registerHandler(action: string, handler: CommandHandler): void {
    this.commandHandlers.set(action, handler)
  }

  /**
   * Process a transcript manually
   */
  processTranscript(transcript: string, context: CommandContext): RecognizedCommand | null {
    const normalized = transcript.toLowerCase().trim()

    for (const command of VOICE_COMMANDS) {
      // Check if command is available in current stage
      if (command.availableDuring && context.currentStage) {
        if (!command.availableDuring.includes(context.currentStage)) {
          continue
        }
      }

      // Check primary phrases
      for (const phrase of command.phrases) {
        if (this.matchPhrase(normalized, phrase)) {
          const recognized: RecognizedCommand = {
            command,
            transcript,
            confidence: 0.9,
            timestamp: Date.now(),
            parameters: this.extractParameters(normalized, command)
          }
          return recognized
        }
      }

      // Check localized aliases
      const langCode = this.state.language.split('-')[0]
      const aliases = command.aliases[langCode]
      if (aliases) {
        for (const alias of aliases) {
          if (this.matchPhrase(normalized, alias)) {
            const recognized: RecognizedCommand = {
              command,
              transcript,
              confidence: 0.85,
              timestamp: Date.now(),
              parameters: this.extractParameters(normalized, command)
            }
            return recognized
          }
        }
      }
    }

    return null
  }

  /**
   * Confirm pending command
   */
  confirmPendingCommand(confirmed: boolean): void {
    if (!this.pendingConfirmation) return

    if (confirmed) {
      this.executeCommand(this.pendingConfirmation)
    }

    this.pendingConfirmation = null
  }

  /**
   * Get current state
   */
  getState(): VoiceCommandsState {
    return { ...this.state }
  }

  /**
   * Get available commands
   */
  getCommands(): VoiceCommand[] {
    return [...VOICE_COMMANDS]
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: CommandCategory): VoiceCommand[] {
    return VOICE_COMMANDS.filter(c => c.category === category)
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stop()
    this.recognition = null
    this.commandHandlers.clear()
    this.isInitialized = false
  }

  // ============ Private Methods ============

  private setupEventHandlers(): void {
    if (!this.recognition) return

    this.recognition.onresult = (event) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      const transcript = lastResult[0].transcript
      const confidence = lastResult[0].confidence
      const isFinal = lastResult.isFinal

      this.state.lastTranscript = transcript
      this.state.confidence = confidence

      if (this.config.onTranscript) {
        this.config.onTranscript(transcript, isFinal)
      }

      if (isFinal && confidence >= (this.config.confidenceThreshold ?? 0.6)) {
        this.handleTranscript(transcript)
      }

      this.emitState()
    }

    this.recognition.onerror = (event) => {
      this.state.errorCount++

      if (event.error !== 'no-speech') {
        console.error('QuantumVoiceCommands: Recognition error', event.error)
        if (this.config.onError) {
          this.config.onError(event.error)
        }
      }

      // Auto-restart if continuous mode
      if (this.config.continuous && this.state.isListening && this.state.errorCount < 5) {
        setTimeout(() => this.start(), 1000)
      }

      this.emitState()
    }

    this.recognition.onend = () => {
      // Auto-restart if continuous mode and still should be listening
      if (this.config.continuous && this.state.isListening && this.state.errorCount < 5) {
        setTimeout(() => {
          if (this.state.isListening && this.recognition) {
            try {
              this.recognition.start()
            } catch {
              // Ignore
            }
          }
        }, 100)
      } else {
        this.state.isListening = false
        this.emitState()
      }
    }
  }

  private handleTranscript(transcript: string): void {
    // Create a default context - in real usage, this should come from the session
    const defaultContext: CommandContext = {
      currentStage: 'scanning',
      currentLayer: null,
      isPlaying: true,
      volume: 0.5,
      breathingActive: false
    }

    const recognized = this.processTranscript(transcript, defaultContext)

    if (recognized) {
      this.state.lastCommand = recognized

      if (recognized.command.requiresConfirmation) {
        this.pendingConfirmation = recognized
        // Emit state to notify UI about pending confirmation
      } else {
        this.executeCommand(recognized)
      }

      if (this.config.onCommand) {
        this.config.onCommand(recognized)
      }
    }

    this.emitState()
  }

  private async executeCommand(recognized: RecognizedCommand): Promise<void> {
    this.state.isProcessing = true
    this.emitState()

    const handler = this.commandHandlers.get(recognized.command.action)

    if (handler) {
      try {
        const defaultContext: CommandContext = {
          currentStage: 'scanning',
          currentLayer: null,
          isPlaying: true,
          volume: 0.5,
          breathingActive: false
        }
        await handler(recognized, defaultContext)
      } catch (error) {
        console.error('QuantumVoiceCommands: Handler error', error)
      }
    }

    this.state.isProcessing = false
    this.emitState()
  }

  private matchPhrase(transcript: string, phrase: string): boolean {
    const normalizedPhrase = phrase.toLowerCase()

    // Exact match
    if (transcript === normalizedPhrase) return true

    // Contains match
    if (transcript.includes(normalizedPhrase)) return true

    // Word boundary match
    const words = transcript.split(/\s+/)
    const phraseWords = normalizedPhrase.split(/\s+/)

    // Check if all phrase words appear in order
    let phraseIndex = 0
    for (const word of words) {
      if (word === phraseWords[phraseIndex]) {
        phraseIndex++
        if (phraseIndex === phraseWords.length) return true
      }
    }

    return false
  }

  private extractParameters(transcript: string, command: VoiceCommand): Record<string, string> | undefined {
    const params: Record<string, string> = {}

    // Extract layer if focus command
    if (command.action === 'navigation.focus') {
      for (const [layer, aliases] of Object.entries(LAYER_ALIASES)) {
        for (const alias of aliases) {
          if (transcript.includes(alias.toLowerCase())) {
            params.layer = layer
            break
          }
        }
      }
    }

    // Extract breathing pattern
    if (command.action === 'breathing.start' || command.action === 'breathing.changePattern') {
      for (const [pattern, aliases] of Object.entries(PATTERN_ALIASES)) {
        for (const alias of aliases) {
          if (transcript.includes(alias.toLowerCase())) {
            params.pattern = pattern
            break
          }
        }
      }
    }

    return Object.keys(params).length > 0 ? params : undefined
  }

  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange({ ...this.state })
    }
  }
}

// ============ Factory & Singleton ============

let voiceCommandsInstance: QuantumVoiceCommands | null = null

/**
 * Get or create singleton instance
 */
export function getQuantumVoiceCommands(): QuantumVoiceCommands {
  if (!voiceCommandsInstance) {
    voiceCommandsInstance = new QuantumVoiceCommands()
  }
  return voiceCommandsInstance
}

/**
 * Create a new instance
 */
export function createQuantumVoiceCommands(
  options?: VoiceCommandsConfig
): QuantumVoiceCommands {
  return new QuantumVoiceCommands(options)
}

export const quantumVoiceCommands = getQuantumVoiceCommands()
