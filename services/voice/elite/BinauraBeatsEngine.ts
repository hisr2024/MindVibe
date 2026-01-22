/**
 * Binaural Beats Engine - Brainwave Entrainment for Quantum Dive
 *
 * Generates binaural beats to facilitate different states of consciousness:
 * - Beta (14-30 Hz): Alert, focused attention
 * - Alpha (8-14 Hz): Relaxed, calm awareness
 * - Theta (4-8 Hz): Deep meditation, creativity, intuition
 * - Delta (0.5-4 Hz): Deep sleep, healing, regeneration
 * - Gamma (30-100 Hz): Peak concentration, higher consciousness
 *
 * Each consciousness layer in Quantum Dive maps to specific frequencies:
 * - Annamaya (Physical): Alpha waves for body relaxation
 * - Pranamaya (Energy): Alpha-Theta border for energy flow
 * - Manomaya (Mental): Theta waves for emotional processing
 * - Vijnanamaya (Wisdom): Theta-Delta for deep insight
 * - Anandamaya (Bliss): Delta-Gamma for transcendent states
 */

import type { ConsciousnessLayer } from './QuantumDiveEngine'

// ============ Types & Interfaces ============

/**
 * Brainwave frequency bands
 */
export type BrainwaveState = 'beta' | 'alpha' | 'theta' | 'delta' | 'gamma'

/**
 * Binaural beat configuration
 */
export interface BinauralBeatConfig {
  // Base frequency (Hz) - carrier tone
  baseFrequency: number

  // Beat frequency (Hz) - difference between left/right
  beatFrequency: number

  // Volume (0-1)
  volume: number

  // Waveform type
  waveform: OscillatorType

  // Fade durations
  fadeInDuration: number   // ms
  fadeOutDuration: number  // ms
}

/**
 * Layer-specific audio configuration
 */
export interface LayerAudioConfig {
  layer: ConsciousnessLayer
  primaryState: BrainwaveState
  beatFrequency: number
  baseFrequency: number
  chakraFrequency?: number  // Solfeggio frequency
  color: string             // For visualization
}

/**
 * Engine state
 */
export interface BinauraBeatsState {
  isPlaying: boolean
  currentLayer: ConsciousnessLayer | null
  currentState: BrainwaveState | null
  volume: number
  beatFrequency: number
  transitionProgress: number
}

/**
 * Preset for specific purposes
 */
export interface BinauraPreset {
  id: string
  name: string
  description: string
  state: BrainwaveState
  beatFrequency: number
  duration: number  // minutes
  layers: ConsciousnessLayer[]
}

// ============ Constants ============

/**
 * Brainwave frequency ranges
 */
export const BRAINWAVE_RANGES: Record<BrainwaveState, { min: number; max: number; optimal: number }> = {
  delta: { min: 0.5, max: 4, optimal: 2 },
  theta: { min: 4, max: 8, optimal: 6 },
  alpha: { min: 8, max: 14, optimal: 10 },
  beta: { min: 14, max: 30, optimal: 18 },
  gamma: { min: 30, max: 100, optimal: 40 }
}

/**
 * Solfeggio frequencies for chakra alignment
 */
export const SOLFEGGIO_FREQUENCIES = {
  root: 396,      // Liberation from fear
  sacral: 417,    // Facilitating change
  solar: 528,     // Transformation & miracles (DNA repair)
  heart: 639,     // Connecting relationships
  throat: 741,    // Awakening intuition
  third_eye: 852, // Returning to spiritual order
  crown: 963      // Divine consciousness
}

/**
 * Layer-specific audio configurations
 */
export const LAYER_AUDIO_CONFIGS: Record<ConsciousnessLayer, LayerAudioConfig> = {
  annamaya: {
    layer: 'annamaya',
    primaryState: 'alpha',
    beatFrequency: 10,      // Alpha for physical relaxation
    baseFrequency: 200,
    chakraFrequency: SOLFEGGIO_FREQUENCIES.root,
    color: '#ef4444'        // Red - root chakra
  },
  pranamaya: {
    layer: 'pranamaya',
    primaryState: 'alpha',
    beatFrequency: 8,       // Low alpha for energy awareness
    baseFrequency: 210,
    chakraFrequency: SOLFEGGIO_FREQUENCIES.sacral,
    color: '#f97316'        // Orange - sacral chakra
  },
  manomaya: {
    layer: 'manomaya',
    primaryState: 'theta',
    beatFrequency: 6,       // Theta for emotional processing
    baseFrequency: 220,
    chakraFrequency: SOLFEGGIO_FREQUENCIES.solar,
    color: '#eab308'        // Yellow - solar plexus
  },
  vijnanamaya: {
    layer: 'vijnanamaya',
    primaryState: 'theta',
    beatFrequency: 4.5,     // Deep theta for wisdom access
    baseFrequency: 230,
    chakraFrequency: SOLFEGGIO_FREQUENCIES.third_eye,
    color: '#6366f1'        // Indigo - third eye
  },
  anandamaya: {
    layer: 'anandamaya',
    primaryState: 'delta',
    beatFrequency: 2,       // Delta for bliss states
    baseFrequency: 240,
    chakraFrequency: SOLFEGGIO_FREQUENCIES.crown,
    color: '#a855f7'        // Violet - crown chakra
  }
}

/**
 * Built-in presets
 */
export const BINAURAL_PRESETS: BinauraPreset[] = [
  {
    id: 'deep_relaxation',
    name: 'Deep Relaxation',
    description: 'Alpha waves for calm, relaxed awareness',
    state: 'alpha',
    beatFrequency: 10,
    duration: 15,
    layers: ['annamaya', 'pranamaya']
  },
  {
    id: 'meditation',
    name: 'Deep Meditation',
    description: 'Theta waves for profound inner exploration',
    state: 'theta',
    beatFrequency: 6,
    duration: 20,
    layers: ['manomaya', 'vijnanamaya']
  },
  {
    id: 'transcendence',
    name: 'Transcendent States',
    description: 'Delta-Gamma blend for spiritual experiences',
    state: 'delta',
    beatFrequency: 2,
    duration: 30,
    layers: ['anandamaya']
  },
  {
    id: 'focus',
    name: 'Enhanced Focus',
    description: 'Beta waves for concentration',
    state: 'beta',
    beatFrequency: 18,
    duration: 25,
    layers: ['manomaya']
  },
  {
    id: 'quantum_dive_full',
    name: 'Full Quantum Dive',
    description: 'Progressive journey through all layers',
    state: 'alpha',
    beatFrequency: 8,
    duration: 45,
    layers: ['annamaya', 'pranamaya', 'manomaya', 'vijnanamaya', 'anandamaya']
  }
]

// ============ Engine Class ============

/**
 * Binaural Beats Engine
 *
 * Creates immersive audio experiences using binaural beats
 * for brainwave entrainment during Quantum Dive sessions.
 */
export class BinauraBeatsEngine {
  private audioContext: AudioContext | null = null
  private leftOscillator: OscillatorNode | null = null
  private rightOscillator: OscillatorNode | null = null
  private leftGain: GainNode | null = null
  private rightGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private merger: ChannelMergerNode | null = null

  // Chakra frequency oscillator
  private chakraOscillator: OscillatorNode | null = null
  private chakraGain: GainNode | null = null

  private state: BinauraBeatsState = {
    isPlaying: false,
    currentLayer: null,
    currentState: null,
    volume: 0.3,
    beatFrequency: 10,
    transitionProgress: 0
  }

  private transitionTimer: ReturnType<typeof setInterval> | null = null
  private config: BinauralBeatConfig = {
    baseFrequency: 200,
    beatFrequency: 10,
    volume: 0.3,
    waveform: 'sine',
    fadeInDuration: 3000,
    fadeOutDuration: 2000
  }

  // Callbacks
  private onStateChange?: (state: BinauraBeatsState) => void
  private onLayerTransition?: (from: ConsciousnessLayer | null, to: ConsciousnessLayer) => void

  constructor(options?: {
    onStateChange?: (state: BinauraBeatsState) => void
    onLayerTransition?: (from: ConsciousnessLayer | null, to: ConsciousnessLayer) => void
  }) {
    this.onStateChange = options?.onStateChange
    this.onLayerTransition = options?.onLayerTransition
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
    if (!BinauraBeatsEngine.isSupported()) {
      console.warn('BinauraBeatsEngine: Web Audio API not supported')
      return false
    }

    try {
      this.audioContext = new AudioContext()

      // Create master gain
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0
      this.masterGain.connect(this.audioContext.destination)

      // Create channel merger for stereo
      this.merger = this.audioContext.createChannelMerger(2)
      this.merger.connect(this.masterGain)

      // Create left channel (base frequency)
      this.leftOscillator = this.audioContext.createOscillator()
      this.leftGain = this.audioContext.createGain()
      this.leftOscillator.connect(this.leftGain)
      this.leftGain.connect(this.merger, 0, 0)

      // Create right channel (base + beat frequency)
      this.rightOscillator = this.audioContext.createOscillator()
      this.rightGain = this.audioContext.createGain()
      this.rightOscillator.connect(this.rightGain)
      this.rightGain.connect(this.merger, 0, 1)

      // Create chakra frequency layer
      this.chakraOscillator = this.audioContext.createOscillator()
      this.chakraGain = this.audioContext.createGain()
      this.chakraOscillator.connect(this.chakraGain)
      this.chakraGain.connect(this.masterGain)
      this.chakraGain.gain.value = 0.1 // Subtle background

      // Set initial frequencies
      this.leftOscillator.frequency.value = this.config.baseFrequency
      this.rightOscillator.frequency.value = this.config.baseFrequency + this.config.beatFrequency
      this.leftOscillator.type = this.config.waveform
      this.rightOscillator.type = this.config.waveform
      this.chakraOscillator.type = 'sine'

      console.log('BinauraBeatsEngine: Initialized successfully')
      return true
    } catch (error) {
      console.error('BinauraBeatsEngine: Initialization failed', error)
      return false
    }
  }

  /**
   * Start playing binaural beats
   */
  async start(layer?: ConsciousnessLayer): Promise<void> {
    if (!this.audioContext || this.state.isPlaying) return

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Apply layer-specific config if provided
    if (layer) {
      this.setLayer(layer)
    }

    // Start oscillators
    try {
      this.leftOscillator?.start()
      this.rightOscillator?.start()
      this.chakraOscillator?.start()
    } catch {
      // Already started, recreate oscillators
      await this.recreateOscillators()
      this.leftOscillator?.start()
      this.rightOscillator?.start()
      this.chakraOscillator?.start()
    }

    // Fade in
    this.fadeIn()

    this.state.isPlaying = true
    this.state.currentLayer = layer || null
    this.emitState()
  }

  /**
   * Stop playing
   */
  async stop(): Promise<void> {
    if (!this.state.isPlaying) return

    // Fade out
    await this.fadeOut()

    this.state.isPlaying = false
    this.state.currentLayer = null
    this.state.currentState = null
    this.emitState()
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.audioContext && this.state.isPlaying) {
      this.audioContext.suspend()
      this.state.isPlaying = false
      this.emitState()
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.audioContext && !this.state.isPlaying) {
      await this.audioContext.resume()
      this.state.isPlaying = true
      this.emitState()
    }
  }

  /**
   * Set consciousness layer (transitions smoothly)
   */
  setLayer(layer: ConsciousnessLayer, transitionDuration: number = 5000): void {
    const config = LAYER_AUDIO_CONFIGS[layer]
    const oldLayer = this.state.currentLayer

    if (this.onLayerTransition) {
      this.onLayerTransition(oldLayer, layer)
    }

    // Smooth transition to new frequencies
    this.transitionTo({
      baseFrequency: config.baseFrequency,
      beatFrequency: config.beatFrequency,
      chakraFrequency: config.chakraFrequency
    }, transitionDuration)

    this.state.currentLayer = layer
    this.state.currentState = config.primaryState
    this.emitState()
  }

  /**
   * Set brainwave state directly
   */
  setBrainwaveState(state: BrainwaveState, transitionDuration: number = 3000): void {
    const range = BRAINWAVE_RANGES[state]

    this.transitionTo({
      beatFrequency: range.optimal
    }, transitionDuration)

    this.state.currentState = state
    this.emitState()
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume))

    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.state.volume,
        this.audioContext.currentTime,
        0.1
      )
    }

    this.emitState()
  }

  /**
   * Apply a preset
   */
  applyPreset(presetId: string): void {
    const preset = BINAURAL_PRESETS.find(p => p.id === presetId)
    if (!preset) {
      console.warn(`BinauraBeatsEngine: Preset '${presetId}' not found`)
      return
    }

    this.transitionTo({
      beatFrequency: preset.beatFrequency
    }, 3000)

    this.state.currentState = preset.state
    this.emitState()
  }

  /**
   * Get current state
   */
  getState(): BinauraBeatsState {
    return { ...this.state }
  }

  /**
   * Get available presets
   */
  getPresets(): BinauraPreset[] {
    return [...BINAURAL_PRESETS]
  }

  /**
   * Get layer audio config
   */
  getLayerConfig(layer: ConsciousnessLayer): LayerAudioConfig {
    return LAYER_AUDIO_CONFIGS[layer]
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stop()

    if (this.transitionTimer) {
      clearInterval(this.transitionTimer)
    }

    this.leftOscillator?.disconnect()
    this.rightOscillator?.disconnect()
    this.chakraOscillator?.disconnect()
    this.leftGain?.disconnect()
    this.rightGain?.disconnect()
    this.chakraGain?.disconnect()
    this.merger?.disconnect()
    this.masterGain?.disconnect()

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
  }

  // ============ Private Methods ============

  private async recreateOscillators(): Promise<void> {
    if (!this.audioContext || !this.merger || !this.masterGain) return

    // Recreate left oscillator
    this.leftOscillator = this.audioContext.createOscillator()
    this.leftGain = this.audioContext.createGain()
    this.leftOscillator.connect(this.leftGain)
    this.leftGain.connect(this.merger, 0, 0)

    // Recreate right oscillator
    this.rightOscillator = this.audioContext.createOscillator()
    this.rightGain = this.audioContext.createGain()
    this.rightOscillator.connect(this.rightGain)
    this.rightGain.connect(this.merger, 0, 1)

    // Recreate chakra oscillator
    this.chakraOscillator = this.audioContext.createOscillator()
    this.chakraGain = this.audioContext.createGain()
    this.chakraOscillator.connect(this.chakraGain)
    this.chakraGain.connect(this.masterGain)
    this.chakraGain.gain.value = 0.1

    // Set frequencies
    this.leftOscillator.frequency.value = this.config.baseFrequency
    this.rightOscillator.frequency.value = this.config.baseFrequency + this.config.beatFrequency
    this.leftOscillator.type = this.config.waveform
    this.rightOscillator.type = this.config.waveform
    this.chakraOscillator.type = 'sine'
  }

  private fadeIn(): void {
    if (!this.masterGain || !this.audioContext) return

    this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime)
    this.masterGain.gain.linearRampToValueAtTime(
      this.state.volume,
      this.audioContext.currentTime + this.config.fadeInDuration / 1000
    )
  }

  private async fadeOut(): Promise<void> {
    if (!this.masterGain || !this.audioContext) return

    return new Promise(resolve => {
      this.masterGain!.gain.linearRampToValueAtTime(
        0,
        this.audioContext!.currentTime + this.config.fadeOutDuration / 1000
      )
      setTimeout(resolve, this.config.fadeOutDuration)
    })
  }

  private transitionTo(
    target: {
      baseFrequency?: number
      beatFrequency?: number
      chakraFrequency?: number
    },
    duration: number
  ): void {
    if (!this.audioContext) return

    const currentTime = this.audioContext.currentTime
    const endTime = currentTime + duration / 1000

    if (target.baseFrequency !== undefined && this.leftOscillator && this.rightOscillator) {
      this.leftOscillator.frequency.linearRampToValueAtTime(target.baseFrequency, endTime)
      this.rightOscillator.frequency.linearRampToValueAtTime(
        target.baseFrequency + (target.beatFrequency ?? this.state.beatFrequency),
        endTime
      )
      this.config.baseFrequency = target.baseFrequency
    }

    if (target.beatFrequency !== undefined && this.rightOscillator) {
      const newRightFreq = this.config.baseFrequency + target.beatFrequency
      this.rightOscillator.frequency.linearRampToValueAtTime(newRightFreq, endTime)
      this.state.beatFrequency = target.beatFrequency
      this.config.beatFrequency = target.beatFrequency
    }

    if (target.chakraFrequency !== undefined && this.chakraOscillator) {
      this.chakraOscillator.frequency.linearRampToValueAtTime(target.chakraFrequency, endTime)
    }

    // Track transition progress
    this.state.transitionProgress = 0
    if (this.transitionTimer) {
      clearInterval(this.transitionTimer)
    }

    const startTime = Date.now()
    this.transitionTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      this.state.transitionProgress = Math.min(100, (elapsed / duration) * 100)
      this.emitState()

      if (elapsed >= duration) {
        clearInterval(this.transitionTimer!)
        this.transitionTimer = null
        this.state.transitionProgress = 100
        this.emitState()
      }
    }, 100)
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state })
    }
  }
}

// ============ Factory & Singleton ============

let binauraBeatsInstance: BinauraBeatsEngine | null = null

/**
 * Get or create the singleton instance
 */
export function getBinauraBeatsEngine(): BinauraBeatsEngine {
  if (!binauraBeatsInstance) {
    binauraBeatsInstance = new BinauraBeatsEngine()
  }
  return binauraBeatsInstance
}

/**
 * Create a new instance
 */
export function createBinauraBeatsEngine(options?: {
  onStateChange?: (state: BinauraBeatsState) => void
  onLayerTransition?: (from: ConsciousnessLayer | null, to: ConsciousnessLayer) => void
}): BinauraBeatsEngine {
  return new BinauraBeatsEngine(options)
}

export const binauraBeatsEngine = getBinauraBeatsEngine()
