/**
 * Breath Sync Engine - Voice-Breathing Synchronization for Quantum Dive
 *
 * Synchronizes voice narration with breathing patterns for deeper meditation:
 * - Multiple breathing patterns (4-7-8, box breathing, etc.)
 * - Audio cues for inhale/exhale timing
 * - TTS pacing aligned with breath phases
 * - Visual breath indicator data
 * - Adaptive patterns based on user comfort
 *
 * Breathing Patterns:
 * - Relaxing (4-7-8): Inhale 4s, hold 7s, exhale 8s
 * - Box Breathing: Inhale 4s, hold 4s, exhale 4s, hold 4s
 * - Pranayama: Various yogic breathing ratios
 * - Natural: Gentle guidance without strict timing
 */

import type { ConsciousnessLayer } from './QuantumDiveEngine'

// ============ Types & Interfaces ============

/**
 * Breath phase
 */
export type BreathPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out' | 'rest'

/**
 * Breathing pattern type
 */
export type BreathingPatternType =
  | 'relaxing_478'      // 4-7-8 for anxiety relief
  | 'box_breathing'     // 4-4-4-4 for focus
  | 'pranayama_basic'   // 4-4-6-2 yogic
  | 'pranayama_calm'    // 4-8-8-4 deep calm
  | 'natural'           // Gentle, no strict timing
  | 'energizing'        // 4-0-4-0 quick breaths
  | 'coherent'          // 5-0-5-0 heart coherence
  | 'custom'

/**
 * Breathing pattern configuration
 */
export interface BreathingPattern {
  id: BreathingPatternType
  name: string
  description: string
  inhale: number      // seconds
  holdIn: number      // seconds (0 = no hold)
  exhale: number      // seconds
  holdOut: number     // seconds (0 = no hold)
  cycles: number      // default number of cycles
  voiceCues: boolean  // whether to include voice guidance
  soundCues: boolean  // whether to include sound cues
}

/**
 * Breath sync state
 */
export interface BreathSyncState {
  isActive: boolean
  currentPattern: BreathingPatternType
  currentPhase: BreathPhase
  phaseProgress: number      // 0-100 within current phase
  cycleProgress: number      // 0-100 within current cycle
  currentCycle: number
  totalCycles: number
  secondsRemaining: number
  bpm: number               // breaths per minute
}

/**
 * Audio cue configuration
 */
export interface BreathAudioCue {
  phase: BreathPhase
  frequency: number    // Hz
  duration: number     // ms
  volume: number       // 0-1
  waveform: OscillatorType
}

/**
 * Voice cue for TTS
 */
export interface BreathVoiceCue {
  phase: BreathPhase
  text: string
  timing: 'start' | 'middle' | 'end'
}

/**
 * Engine configuration
 */
export interface BreathSyncConfig {
  pattern: BreathingPatternType
  cycles?: number
  enableVoiceCues?: boolean
  enableSoundCues?: boolean
  soundVolume?: number
  onPhaseChange?: (phase: BreathPhase, state: BreathSyncState) => void
  onCycleComplete?: (cycle: number, total: number) => void
  onComplete?: () => void
  onVoiceCue?: (cue: BreathVoiceCue) => void
}

// ============ Constants ============

/**
 * Built-in breathing patterns
 */
export const BREATHING_PATTERNS: Record<BreathingPatternType, BreathingPattern> = {
  relaxing_478: {
    id: 'relaxing_478',
    name: '4-7-8 Relaxing Breath',
    description: 'Dr. Weil\'s calming technique for anxiety and sleep',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    cycles: 4,
    voiceCues: true,
    soundCues: true
  },
  box_breathing: {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for focus and calm under pressure',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    cycles: 4,
    voiceCues: true,
    soundCues: true
  },
  pranayama_basic: {
    id: 'pranayama_basic',
    name: 'Basic Pranayama',
    description: 'Traditional yogic breathing for balance',
    inhale: 4,
    holdIn: 4,
    exhale: 6,
    holdOut: 2,
    cycles: 6,
    voiceCues: true,
    soundCues: true
  },
  pranayama_calm: {
    id: 'pranayama_calm',
    name: 'Deep Pranayama',
    description: 'Extended exhale for deep relaxation',
    inhale: 4,
    holdIn: 8,
    exhale: 8,
    holdOut: 4,
    cycles: 5,
    voiceCues: true,
    soundCues: true
  },
  natural: {
    id: 'natural',
    name: 'Natural Breathing',
    description: 'Gentle guidance without strict timing',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
    cycles: 10,
    voiceCues: true,
    soundCues: false
  },
  energizing: {
    id: 'energizing',
    name: 'Energizing Breath',
    description: 'Quick breaths to increase alertness',
    inhale: 3,
    holdIn: 0,
    exhale: 3,
    holdOut: 0,
    cycles: 10,
    voiceCues: false,
    soundCues: true
  },
  coherent: {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: '5-second inhale/exhale for heart coherence',
    inhale: 5,
    holdIn: 0,
    exhale: 5,
    holdOut: 0,
    cycles: 6,
    voiceCues: true,
    soundCues: true
  },
  custom: {
    id: 'custom',
    name: 'Custom Pattern',
    description: 'User-defined breathing pattern',
    inhale: 4,
    holdIn: 2,
    exhale: 4,
    holdOut: 2,
    cycles: 5,
    voiceCues: true,
    soundCues: true
  }
}

/**
 * Layer-specific recommended patterns
 */
export const LAYER_BREATH_PATTERNS: Record<ConsciousnessLayer, BreathingPatternType> = {
  annamaya: 'natural',           // Physical: gentle, natural
  pranamaya: 'pranayama_basic',  // Energy: yogic breathing
  manomaya: 'box_breathing',     // Mental: focus technique
  vijnanamaya: 'pranayama_calm', // Wisdom: deep contemplation
  anandamaya: 'relaxing_478'     // Bliss: transcendent calm
}

/**
 * Audio cue frequencies for each phase
 */
const BREATH_AUDIO_CUES: Record<BreathPhase, BreathAudioCue> = {
  inhale: {
    phase: 'inhale',
    frequency: 396,    // Solfeggio - liberation
    duration: 500,
    volume: 0.15,
    waveform: 'sine'
  },
  hold_in: {
    phase: 'hold_in',
    frequency: 528,    // Solfeggio - transformation
    duration: 300,
    volume: 0.1,
    waveform: 'sine'
  },
  exhale: {
    phase: 'exhale',
    frequency: 639,    // Solfeggio - connection
    duration: 500,
    volume: 0.15,
    waveform: 'sine'
  },
  hold_out: {
    phase: 'hold_out',
    frequency: 741,    // Solfeggio - awakening
    duration: 300,
    volume: 0.1,
    waveform: 'sine'
  },
  rest: {
    phase: 'rest',
    frequency: 432,    // Universal harmony
    duration: 200,
    volume: 0.05,
    waveform: 'sine'
  }
}

/**
 * Voice cues for TTS
 */
const BREATH_VOICE_CUES: Record<BreathPhase, BreathVoiceCue[]> = {
  inhale: [
    { phase: 'inhale', text: 'Breathe in', timing: 'start' },
    { phase: 'inhale', text: 'Inhale slowly', timing: 'start' },
    { phase: 'inhale', text: 'Draw breath in', timing: 'start' }
  ],
  hold_in: [
    { phase: 'hold_in', text: 'Hold', timing: 'start' },
    { phase: 'hold_in', text: 'Retain the breath', timing: 'start' }
  ],
  exhale: [
    { phase: 'exhale', text: 'Breathe out', timing: 'start' },
    { phase: 'exhale', text: 'Exhale slowly', timing: 'start' },
    { phase: 'exhale', text: 'Release', timing: 'start' }
  ],
  hold_out: [
    { phase: 'hold_out', text: 'Hold empty', timing: 'start' },
    { phase: 'hold_out', text: 'Pause', timing: 'start' }
  ],
  rest: [
    { phase: 'rest', text: 'Rest', timing: 'start' }
  ]
}

// ============ Engine Class ============

/**
 * Breath Sync Engine
 *
 * Manages breathing guidance and synchronization for Quantum Dive sessions.
 */
export class BreathSyncEngine {
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null

  private state: BreathSyncState = {
    isActive: false,
    currentPattern: 'natural',
    currentPhase: 'rest',
    phaseProgress: 0,
    cycleProgress: 0,
    currentCycle: 0,
    totalCycles: 0,
    secondsRemaining: 0,
    bpm: 6
  }

  private config: BreathSyncConfig | null = null
  private pattern: BreathingPattern = BREATHING_PATTERNS.natural
  private timer: ReturnType<typeof setInterval> | null = null
  private phaseTimer: ReturnType<typeof setTimeout> | null = null
  private startTime: number = 0
  private phaseStartTime: number = 0

  private onStateChange?: (state: BreathSyncState) => void

  constructor(options?: {
    onStateChange?: (state: BreathSyncState) => void
  }) {
    this.onStateChange = options?.onStateChange
  }

  /**
   * Check if Web Audio API is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window
  }

  /**
   * Initialize audio context
   */
  async initialize(): Promise<boolean> {
    if (!BreathSyncEngine.isSupported()) {
      console.warn('BreathSyncEngine: Web Audio API not supported')
      return false
    }

    try {
      this.audioContext = new AudioContext()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0
      this.gainNode.connect(this.audioContext.destination)

      console.log('BreathSyncEngine: Initialized successfully')
      return true
    } catch (error) {
      console.error('BreathSyncEngine: Initialization failed', error)
      return false
    }
  }

  /**
   * Start a breathing session
   */
  async start(config: BreathSyncConfig): Promise<void> {
    if (this.state.isActive) {
      await this.stop()
    }

    this.config = config
    this.pattern = BREATHING_PATTERNS[config.pattern]

    // Resume audio context if needed
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Initialize state
    this.state = {
      isActive: true,
      currentPattern: config.pattern,
      currentPhase: 'rest',
      phaseProgress: 0,
      cycleProgress: 0,
      currentCycle: 0,
      totalCycles: config.cycles ?? this.pattern.cycles,
      secondsRemaining: this.calculateTotalDuration(config.cycles ?? this.pattern.cycles),
      bpm: this.calculateBPM()
    }

    this.startTime = Date.now()
    this.emitState()

    // Start the breathing cycle
    await this.startCycle()
  }

  /**
   * Stop the breathing session
   */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer)
      this.phaseTimer = null
    }

    this.state.isActive = false
    this.state.currentPhase = 'rest'
    this.emitState()
  }

  /**
   * Pause the session
   */
  pause(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer)
      this.phaseTimer = null
    }
  }

  /**
   * Resume the session
   */
  async resume(): Promise<void> {
    if (this.state.isActive && this.config) {
      await this.continuePhase()
    }
  }

  /**
   * Get recommended pattern for a layer
   */
  getLayerPattern(layer: ConsciousnessLayer): BreathingPattern {
    const patternType = LAYER_BREATH_PATTERNS[layer]
    return BREATHING_PATTERNS[patternType]
  }

  /**
   * Get all available patterns
   */
  getPatterns(): BreathingPattern[] {
    return Object.values(BREATHING_PATTERNS)
  }

  /**
   * Get current state
   */
  getState(): BreathSyncState {
    return { ...this.state }
  }

  /**
   * Calculate timing for voice integration
   */
  getVoiceTiming(): {
    speakDuringPhase: BreathPhase[]
    pauseDuringPhase: BreathPhase[]
    phaseDurations: Record<BreathPhase, number>
  } {
    return {
      // Voice can speak during exhale and holds
      speakDuringPhase: ['exhale', 'hold_in', 'hold_out'],
      // Voice should pause during inhale
      pauseDuringPhase: ['inhale'],
      phaseDurations: {
        inhale: this.pattern.inhale * 1000,
        hold_in: this.pattern.holdIn * 1000,
        exhale: this.pattern.exhale * 1000,
        hold_out: this.pattern.holdOut * 1000,
        rest: 1000
      }
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stop()
    if (this.oscillator) {
      this.oscillator.disconnect()
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
    this.audioContext = null
  }

  // ============ Private Methods ============

  private async startCycle(): Promise<void> {
    if (!this.state.isActive) return

    // Start with inhale
    await this.transitionToPhase('inhale')
  }

  private async transitionToPhase(phase: BreathPhase): Promise<void> {
    if (!this.state.isActive || !this.config) return

    this.state.currentPhase = phase
    this.state.phaseProgress = 0
    this.phaseStartTime = Date.now()

    // Get phase duration
    const duration = this.getPhaseDuration(phase)

    // Play audio cue if enabled
    if (this.config.enableSoundCues && this.pattern.soundCues) {
      await this.playAudioCue(phase)
    }

    // Emit voice cue if enabled
    if (this.config.enableVoiceCues && this.pattern.voiceCues && this.config.onVoiceCue) {
      const cues = BREATH_VOICE_CUES[phase]
      if (cues.length > 0) {
        const cue = cues[Math.floor(Math.random() * cues.length)]
        this.config.onVoiceCue(cue)
      }
    }

    // Notify phase change
    if (this.config.onPhaseChange) {
      this.config.onPhaseChange(phase, this.getState())
    }

    this.emitState()

    // Start progress timer
    this.startProgressTimer(duration)

    // Schedule next phase
    this.phaseTimer = setTimeout(() => {
      this.advanceToNextPhase()
    }, duration)
  }

  private advanceToNextPhase(): void {
    if (!this.state.isActive || !this.config) return

    const nextPhase = this.getNextPhase()

    if (nextPhase === 'inhale') {
      // Completed a cycle
      this.state.currentCycle++

      if (this.config.onCycleComplete) {
        this.config.onCycleComplete(this.state.currentCycle, this.state.totalCycles)
      }

      if (this.state.currentCycle >= this.state.totalCycles) {
        // All cycles complete
        this.completeSession()
        return
      }
    }

    this.transitionToPhase(nextPhase)
  }

  private getNextPhase(): BreathPhase {
    switch (this.state.currentPhase) {
      case 'inhale':
        return this.pattern.holdIn > 0 ? 'hold_in' : 'exhale'
      case 'hold_in':
        return 'exhale'
      case 'exhale':
        return this.pattern.holdOut > 0 ? 'hold_out' : 'inhale'
      case 'hold_out':
        return 'inhale'
      default:
        return 'inhale'
    }
  }

  private getPhaseDuration(phase: BreathPhase): number {
    switch (phase) {
      case 'inhale':
        return this.pattern.inhale * 1000
      case 'hold_in':
        return this.pattern.holdIn * 1000
      case 'exhale':
        return this.pattern.exhale * 1000
      case 'hold_out':
        return this.pattern.holdOut * 1000
      default:
        return 1000
    }
  }

  private startProgressTimer(phaseDuration: number): void {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.phaseStartTime
      this.state.phaseProgress = Math.min(100, (elapsed / phaseDuration) * 100)

      // Calculate cycle progress
      const cycleLength = this.calculateCycleDuration()
      const cycleElapsed = this.calculateCycleElapsed()
      this.state.cycleProgress = Math.min(100, (cycleElapsed / cycleLength) * 100)

      // Update seconds remaining
      const totalElapsed = Date.now() - this.startTime
      const totalDuration = this.calculateTotalDuration(this.state.totalCycles) * 1000
      this.state.secondsRemaining = Math.max(0, Math.ceil((totalDuration - totalElapsed) / 1000))

      this.emitState()
    }, 50) // Update at 20fps for smooth animations
  }

  private async continuePhase(): Promise<void> {
    const remaining = this.getPhaseDuration(this.state.currentPhase) -
                      (Date.now() - this.phaseStartTime)

    if (remaining > 0) {
      this.startProgressTimer(this.getPhaseDuration(this.state.currentPhase))
      this.phaseTimer = setTimeout(() => {
        this.advanceToNextPhase()
      }, remaining)
    } else {
      this.advanceToNextPhase()
    }
  }

  private async playAudioCue(phase: BreathPhase): Promise<void> {
    if (!this.audioContext || !this.gainNode) return

    const cue = BREATH_AUDIO_CUES[phase]
    const volume = this.config?.soundVolume ?? 0.15

    try {
      // Create fresh oscillator for each cue
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.type = cue.waveform
      osc.frequency.value = cue.frequency
      osc.connect(gain)
      gain.connect(this.audioContext.destination)

      // Envelope
      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(cue.volume * volume, now + 0.05)
      gain.gain.linearRampToValueAtTime(0, now + cue.duration / 1000)

      osc.start(now)
      osc.stop(now + cue.duration / 1000 + 0.1)
    } catch {
      // Ignore audio errors
    }
  }

  private completeSession(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    this.state.isActive = false
    this.state.currentPhase = 'rest'
    this.state.phaseProgress = 100
    this.state.cycleProgress = 100
    this.emitState()

    if (this.config?.onComplete) {
      this.config.onComplete()
    }
  }

  private calculateTotalDuration(cycles: number): number {
    const cycleDuration = this.calculateCycleDuration()
    return (cycleDuration * cycles) / 1000 // in seconds
  }

  private calculateCycleDuration(): number {
    return (this.pattern.inhale +
            this.pattern.holdIn +
            this.pattern.exhale +
            this.pattern.holdOut) * 1000
  }

  private calculateCycleElapsed(): number {
    const phases: BreathPhase[] = ['inhale', 'hold_in', 'exhale', 'hold_out']
    const currentIndex = phases.indexOf(this.state.currentPhase)
    if (currentIndex === -1) return 0

    let elapsed = 0
    for (let i = 0; i < currentIndex; i++) {
      elapsed += this.getPhaseDuration(phases[i])
    }
    elapsed += (this.state.phaseProgress / 100) * this.getPhaseDuration(this.state.currentPhase)

    return elapsed
  }

  private calculateBPM(): number {
    const cycleDuration = this.calculateCycleDuration() / 1000 // in seconds
    return 60 / cycleDuration
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state })
    }
  }
}

// ============ Factory & Singleton ============

let breathSyncInstance: BreathSyncEngine | null = null

/**
 * Get or create singleton instance
 */
export function getBreathSyncEngine(): BreathSyncEngine {
  if (!breathSyncInstance) {
    breathSyncInstance = new BreathSyncEngine()
  }
  return breathSyncInstance
}

/**
 * Create a new instance
 */
export function createBreathSyncEngine(options?: {
  onStateChange?: (state: BreathSyncState) => void
}): BreathSyncEngine {
  return new BreathSyncEngine(options)
}

export const breathSyncEngine = getBreathSyncEngine()
