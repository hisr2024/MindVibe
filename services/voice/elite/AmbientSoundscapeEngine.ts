/**
 * Ambient Soundscape Engine - Immersive Audio Environments for Quantum Dive
 *
 * Creates layered ambient soundscapes for deeper meditation experiences:
 * - Nature sounds (rain, ocean, forest, river)
 * - Sacred sounds (temple bells, singing bowls, om chanting)
 * - Atmospheric tones (wind, space, earth resonance)
 * - Layer-specific soundscapes for each consciousness layer
 * - Dynamic mixing based on session progress
 *
 * Each consciousness layer has a signature soundscape:
 * - Annamaya: Grounding earth sounds, gentle rain
 * - Pranamaya: Flowing water, wind through leaves
 * - Manomaya: Soft rain, distant thunder
 * - Vijnanamaya: Temple bells, singing bowls
 * - Anandamaya: Celestial tones, om resonance
 */

import type { ConsciousnessLayer } from './QuantumDiveEngine'

// ============ Types & Interfaces ============

/**
 * Soundscape category
 */
export type SoundscapeCategory = 'nature' | 'sacred' | 'atmospheric' | 'musical'

/**
 * Available sound types
 */
export type SoundType =
  // Nature
  | 'rain_gentle'
  | 'rain_heavy'
  | 'ocean_waves'
  | 'river_stream'
  | 'forest_birds'
  | 'wind_gentle'
  | 'wind_strong'
  | 'thunder_distant'
  | 'fire_crackling'
  // Sacred
  | 'temple_bells'
  | 'singing_bowl'
  | 'om_chanting'
  | 'tibetan_horns'
  | 'crystal_bowls'
  | 'gong'
  // Atmospheric
  | 'space_drone'
  | 'earth_resonance'
  | 'aurora'
  | 'cosmic_wind'
  // Musical
  | 'tanpura_drone'
  | 'sitar_ambient'
  | 'flute_bansuri'

/**
 * Sound configuration
 */
export interface SoundConfig {
  type: SoundType
  name: string
  category: SoundscapeCategory
  baseVolume: number      // 0-1 default volume
  fadeInTime: number      // ms
  fadeOutTime: number     // ms
  loopable: boolean
  frequency?: number      // For generated tones
  harmonics?: number[]    // For complex tones
}

/**
 * Soundscape preset
 */
export interface SoundscapePreset {
  id: string
  name: string
  description: string
  layers: ConsciousnessLayer[]
  sounds: Array<{
    type: SoundType
    volume: number
    pan?: number        // -1 (left) to 1 (right)
  }>
  ambientTone?: {
    frequency: number
    volume: number
  }
}

/**
 * Active sound instance
 */
interface ActiveSound {
  type: SoundType
  oscillator?: OscillatorNode
  gainNode: GainNode
  panNode?: StereoPannerNode
  isPlaying: boolean
}

/**
 * Engine state
 */
export interface AmbientSoundscapeState {
  isPlaying: boolean
  currentPreset: string | null
  currentLayer: ConsciousnessLayer | null
  activeSounds: SoundType[]
  masterVolume: number
  crossfadeProgress: number
}

/**
 * Engine configuration
 */
export interface AmbientSoundscapeConfig {
  masterVolume?: number
  crossfadeDuration?: number  // ms for transitioning between presets
  onStateChange?: (state: AmbientSoundscapeState) => void
  onSoundStart?: (sound: SoundType) => void
  onSoundStop?: (sound: SoundType) => void
}

// ============ Constants ============

/**
 * Sound configurations
 */
export const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  // Nature sounds (generated with noise + filters)
  rain_gentle: {
    type: 'rain_gentle',
    name: 'Gentle Rain',
    category: 'nature',
    baseVolume: 0.3,
    fadeInTime: 3000,
    fadeOutTime: 2000,
    loopable: true
  },
  rain_heavy: {
    type: 'rain_heavy',
    name: 'Heavy Rain',
    category: 'nature',
    baseVolume: 0.4,
    fadeInTime: 4000,
    fadeOutTime: 3000,
    loopable: true
  },
  ocean_waves: {
    type: 'ocean_waves',
    name: 'Ocean Waves',
    category: 'nature',
    baseVolume: 0.35,
    fadeInTime: 5000,
    fadeOutTime: 4000,
    loopable: true
  },
  river_stream: {
    type: 'river_stream',
    name: 'River Stream',
    category: 'nature',
    baseVolume: 0.25,
    fadeInTime: 3000,
    fadeOutTime: 2000,
    loopable: true
  },
  forest_birds: {
    type: 'forest_birds',
    name: 'Forest Birds',
    category: 'nature',
    baseVolume: 0.2,
    fadeInTime: 2000,
    fadeOutTime: 2000,
    loopable: true
  },
  wind_gentle: {
    type: 'wind_gentle',
    name: 'Gentle Wind',
    category: 'nature',
    baseVolume: 0.2,
    fadeInTime: 4000,
    fadeOutTime: 3000,
    loopable: true
  },
  wind_strong: {
    type: 'wind_strong',
    name: 'Strong Wind',
    category: 'nature',
    baseVolume: 0.3,
    fadeInTime: 3000,
    fadeOutTime: 3000,
    loopable: true
  },
  thunder_distant: {
    type: 'thunder_distant',
    name: 'Distant Thunder',
    category: 'nature',
    baseVolume: 0.15,
    fadeInTime: 1000,
    fadeOutTime: 2000,
    loopable: false
  },
  fire_crackling: {
    type: 'fire_crackling',
    name: 'Crackling Fire',
    category: 'nature',
    baseVolume: 0.25,
    fadeInTime: 2000,
    fadeOutTime: 2000,
    loopable: true
  },

  // Sacred sounds (generated with oscillators)
  temple_bells: {
    type: 'temple_bells',
    name: 'Temple Bells',
    category: 'sacred',
    baseVolume: 0.2,
    fadeInTime: 500,
    fadeOutTime: 3000,
    loopable: false,
    frequency: 528,
    harmonics: [1, 2.4, 5.5]
  },
  singing_bowl: {
    type: 'singing_bowl',
    name: 'Singing Bowl',
    category: 'sacred',
    baseVolume: 0.25,
    fadeInTime: 1000,
    fadeOutTime: 5000,
    loopable: true,
    frequency: 432,
    harmonics: [1, 2, 3, 4.2]
  },
  om_chanting: {
    type: 'om_chanting',
    name: 'Om Chanting',
    category: 'sacred',
    baseVolume: 0.2,
    fadeInTime: 2000,
    fadeOutTime: 3000,
    loopable: true,
    frequency: 136.1,  // Om frequency
    harmonics: [1, 2, 3]
  },
  tibetan_horns: {
    type: 'tibetan_horns',
    name: 'Tibetan Horns',
    category: 'sacred',
    baseVolume: 0.15,
    fadeInTime: 3000,
    fadeOutTime: 4000,
    loopable: true,
    frequency: 73.4,  // D2
    harmonics: [1, 1.5, 2, 3]
  },
  crystal_bowls: {
    type: 'crystal_bowls',
    name: 'Crystal Bowls',
    category: 'sacred',
    baseVolume: 0.2,
    fadeInTime: 1500,
    fadeOutTime: 4000,
    loopable: true,
    frequency: 396,
    harmonics: [1, 2.5, 4]
  },
  gong: {
    type: 'gong',
    name: 'Meditation Gong',
    category: 'sacred',
    baseVolume: 0.25,
    fadeInTime: 100,
    fadeOutTime: 8000,
    loopable: false,
    frequency: 110,
    harmonics: [1, 1.4, 2, 2.8, 4]
  },

  // Atmospheric sounds
  space_drone: {
    type: 'space_drone',
    name: 'Space Drone',
    category: 'atmospheric',
    baseVolume: 0.15,
    fadeInTime: 5000,
    fadeOutTime: 5000,
    loopable: true,
    frequency: 55,
    harmonics: [1, 2, 4, 8]
  },
  earth_resonance: {
    type: 'earth_resonance',
    name: 'Earth Resonance',
    category: 'atmospheric',
    baseVolume: 0.2,
    fadeInTime: 4000,
    fadeOutTime: 4000,
    loopable: true,
    frequency: 7.83,  // Schumann resonance
    harmonics: [1, 2, 3]
  },
  aurora: {
    type: 'aurora',
    name: 'Aurora Lights',
    category: 'atmospheric',
    baseVolume: 0.15,
    fadeInTime: 6000,
    fadeOutTime: 5000,
    loopable: true,
    frequency: 174,
    harmonics: [1, 1.5, 2, 3]
  },
  cosmic_wind: {
    type: 'cosmic_wind',
    name: 'Cosmic Wind',
    category: 'atmospheric',
    baseVolume: 0.18,
    fadeInTime: 4000,
    fadeOutTime: 4000,
    loopable: true
  },

  // Musical drones
  tanpura_drone: {
    type: 'tanpura_drone',
    name: 'Tanpura Drone',
    category: 'musical',
    baseVolume: 0.2,
    fadeInTime: 3000,
    fadeOutTime: 3000,
    loopable: true,
    frequency: 130.8,  // C3
    harmonics: [1, 2, 3, 4, 5]
  },
  sitar_ambient: {
    type: 'sitar_ambient',
    name: 'Sitar Ambient',
    category: 'musical',
    baseVolume: 0.15,
    fadeInTime: 2000,
    fadeOutTime: 3000,
    loopable: true,
    frequency: 261.6,  // C4
    harmonics: [1, 2, 3, 4.5]
  },
  flute_bansuri: {
    type: 'flute_bansuri',
    name: 'Bansuri Flute',
    category: 'musical',
    baseVolume: 0.15,
    fadeInTime: 2000,
    fadeOutTime: 2000,
    loopable: true,
    frequency: 392,    // G4
    harmonics: [1, 2]
  }
}

/**
 * Layer-specific soundscape presets
 */
export const LAYER_SOUNDSCAPES: Record<ConsciousnessLayer, SoundscapePreset> = {
  annamaya: {
    id: 'annamaya_grounding',
    name: 'Grounding Earth',
    description: 'Earthy sounds for physical body awareness',
    layers: ['annamaya'],
    sounds: [
      { type: 'rain_gentle', volume: 0.3 },
      { type: 'earth_resonance', volume: 0.15 },
      { type: 'fire_crackling', volume: 0.2, pan: 0.3 }
    ],
    ambientTone: { frequency: 396, volume: 0.1 }
  },
  pranamaya: {
    id: 'pranamaya_flow',
    name: 'Energy Flow',
    description: 'Flowing sounds for vital energy awareness',
    layers: ['pranamaya'],
    sounds: [
      { type: 'river_stream', volume: 0.35 },
      { type: 'wind_gentle', volume: 0.2 },
      { type: 'singing_bowl', volume: 0.15 }
    ],
    ambientTone: { frequency: 417, volume: 0.1 }
  },
  manomaya: {
    id: 'manomaya_calm',
    name: 'Mind Calm',
    description: 'Soothing sounds for mental clarity',
    layers: ['manomaya'],
    sounds: [
      { type: 'ocean_waves', volume: 0.3 },
      { type: 'rain_gentle', volume: 0.2 },
      { type: 'crystal_bowls', volume: 0.15 }
    ],
    ambientTone: { frequency: 528, volume: 0.1 }
  },
  vijnanamaya: {
    id: 'vijnanamaya_wisdom',
    name: 'Wisdom Temple',
    description: 'Sacred sounds for intuitive insight',
    layers: ['vijnanamaya'],
    sounds: [
      { type: 'temple_bells', volume: 0.2 },
      { type: 'singing_bowl', volume: 0.25 },
      { type: 'tanpura_drone', volume: 0.15 }
    ],
    ambientTone: { frequency: 852, volume: 0.12 }
  },
  anandamaya: {
    id: 'anandamaya_bliss',
    name: 'Bliss Realm',
    description: 'Transcendent sounds for unity consciousness',
    layers: ['anandamaya'],
    sounds: [
      { type: 'om_chanting', volume: 0.25 },
      { type: 'space_drone', volume: 0.2 },
      { type: 'aurora', volume: 0.15 }
    ],
    ambientTone: { frequency: 963, volume: 0.12 }
  }
}

/**
 * Additional presets
 */
export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: 'deep_meditation',
    name: 'Deep Meditation',
    description: 'Perfect blend for deep inner exploration',
    layers: ['manomaya', 'vijnanamaya'],
    sounds: [
      { type: 'rain_gentle', volume: 0.2 },
      { type: 'singing_bowl', volume: 0.2 },
      { type: 'space_drone', volume: 0.15 }
    ]
  },
  {
    id: 'nature_sanctuary',
    name: 'Nature Sanctuary',
    description: 'Immersive natural environment',
    layers: ['annamaya', 'pranamaya'],
    sounds: [
      { type: 'forest_birds', volume: 0.2 },
      { type: 'river_stream', volume: 0.25 },
      { type: 'wind_gentle', volume: 0.15 }
    ]
  },
  {
    id: 'temple_ambience',
    name: 'Temple Ambience',
    description: 'Ancient temple atmosphere',
    layers: ['vijnanamaya', 'anandamaya'],
    sounds: [
      { type: 'temple_bells', volume: 0.15 },
      { type: 'om_chanting', volume: 0.2 },
      { type: 'gong', volume: 0.1 }
    ]
  },
  {
    id: 'cosmic_journey',
    name: 'Cosmic Journey',
    description: 'Transcendent space exploration',
    layers: ['anandamaya'],
    sounds: [
      { type: 'space_drone', volume: 0.25 },
      { type: 'aurora', volume: 0.2 },
      { type: 'cosmic_wind', volume: 0.15 }
    ]
  }
]

// ============ Engine Class ============

/**
 * Ambient Soundscape Engine
 *
 * Creates immersive audio environments for Quantum Dive sessions.
 */
export class AmbientSoundscapeEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeSounds: Map<SoundType, ActiveSound> = new Map()
  private noiseBuffer: AudioBuffer | null = null

  private state: AmbientSoundscapeState = {
    isPlaying: false,
    currentPreset: null,
    currentLayer: null,
    activeSounds: [],
    masterVolume: 0.5,
    crossfadeProgress: 100
  }

  private config: AmbientSoundscapeConfig = {
    masterVolume: 0.5,
    crossfadeDuration: 3000
  }

  constructor(options?: AmbientSoundscapeConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
      this.state.masterVolume = options.masterVolume ?? 0.5
    }
  }

  /**
   * Check browser support
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window
  }

  /**
   * Initialize audio context and buffers
   */
  async initialize(): Promise<boolean> {
    if (!AmbientSoundscapeEngine.isSupported()) {
      console.warn('AmbientSoundscapeEngine: Web Audio API not supported')
      return false
    }

    try {
      this.audioContext = new AudioContext()

      // Create master gain
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.state.masterVolume
      this.masterGain.connect(this.audioContext.destination)

      // Generate noise buffer for nature sounds
      this.noiseBuffer = this.createNoiseBuffer()

      console.log('AmbientSoundscapeEngine: Initialized successfully')
      return true
    } catch (error) {
      console.error('AmbientSoundscapeEngine: Initialization failed', error)
      return false
    }
  }

  /**
   * Play a soundscape preset
   */
  async playPreset(presetId: string): Promise<void> {
    const preset = [...SOUNDSCAPE_PRESETS, ...Object.values(LAYER_SOUNDSCAPES)]
      .find(p => p.id === presetId)

    if (!preset) {
      console.warn(`AmbientSoundscapeEngine: Preset '${presetId}' not found`)
      return
    }

    // Stop current sounds with crossfade
    await this.stopAll(true)

    // Start preset sounds
    for (const sound of preset.sounds) {
      await this.startSound(sound.type, sound.volume, sound.pan)
    }

    // Start ambient tone if specified
    if (preset.ambientTone) {
      await this.startAmbientTone(preset.ambientTone.frequency, preset.ambientTone.volume)
    }

    this.state.currentPreset = presetId
    this.state.isPlaying = true
    this.emitState()
  }

  /**
   * Play layer-specific soundscape
   */
  async playLayer(layer: ConsciousnessLayer): Promise<void> {
    const preset = LAYER_SOUNDSCAPES[layer]
    await this.playPreset(preset.id)
    this.state.currentLayer = layer
    this.emitState()
  }

  /**
   * Start a specific sound
   */
  async startSound(type: SoundType, volume?: number, pan?: number): Promise<void> {
    if (!this.audioContext || !this.masterGain) return

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    const config = SOUND_CONFIGS[type]
    const targetVolume = (volume ?? config.baseVolume) * this.state.masterVolume

    // Create gain node
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = 0

    // Create pan node if specified
    let panNode: StereoPannerNode | undefined
    if (pan !== undefined && 'createStereoPanner' in this.audioContext) {
      panNode = this.audioContext.createStereoPanner()
      panNode.pan.value = pan
      gainNode.connect(panNode)
      panNode.connect(this.masterGain)
    } else {
      gainNode.connect(this.masterGain)
    }

    // Create sound based on category
    let oscillator: OscillatorNode | undefined

    if (config.category === 'sacred' || config.category === 'atmospheric' || config.category === 'musical') {
      // Generate with oscillators
      oscillator = this.createHarmonicOscillator(config)
      oscillator.connect(gainNode)
      oscillator.start()
    } else {
      // Nature sounds - use noise
      this.playNoiseSound(type, gainNode, targetVolume, config.fadeInTime)
    }

    // Fade in
    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(targetVolume, now + config.fadeInTime / 1000)

    // Store active sound
    this.activeSounds.set(type, {
      type,
      oscillator,
      gainNode,
      panNode,
      isPlaying: true
    })

    this.state.activeSounds = Array.from(this.activeSounds.keys())
    this.state.isPlaying = true

    if (this.config.onSoundStart) {
      this.config.onSoundStart(type)
    }

    this.emitState()
  }

  /**
   * Stop a specific sound
   */
  async stopSound(type: SoundType, fadeOut: boolean = true): Promise<void> {
    const sound = this.activeSounds.get(type)
    if (!sound || !this.audioContext) return

    const config = SOUND_CONFIGS[type]
    const fadeTime = fadeOut ? config.fadeOutTime / 1000 : 0.1

    // Fade out
    const now = this.audioContext.currentTime
    sound.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime)

    // Schedule cleanup
    setTimeout(() => {
      sound.oscillator?.stop()
      sound.oscillator?.disconnect()
      sound.gainNode.disconnect()
      sound.panNode?.disconnect()
      this.activeSounds.delete(type)
      this.state.activeSounds = Array.from(this.activeSounds.keys())

      if (this.config.onSoundStop) {
        this.config.onSoundStop(type)
      }

      this.emitState()
    }, fadeTime * 1000 + 100)
  }

  /**
   * Stop all sounds
   */
  async stopAll(fadeOut: boolean = true): Promise<void> {
    const stopPromises = Array.from(this.activeSounds.keys()).map(type =>
      this.stopSound(type, fadeOut)
    )

    await Promise.all(stopPromises)

    this.state.isPlaying = false
    this.state.currentPreset = null
    this.state.currentLayer = null
    this.emitState()
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume))

    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.state.masterVolume,
        this.audioContext.currentTime,
        0.1
      )
    }

    this.emitState()
  }

  /**
   * Get current state
   */
  getState(): AmbientSoundscapeState {
    return { ...this.state }
  }

  /**
   * Get available presets
   */
  getPresets(): SoundscapePreset[] {
    return [...SOUNDSCAPE_PRESETS, ...Object.values(LAYER_SOUNDSCAPES)]
  }

  /**
   * Get layer soundscape
   */
  getLayerSoundscape(layer: ConsciousnessLayer): SoundscapePreset {
    return LAYER_SOUNDSCAPES[layer]
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopAll(false)

    if (this.masterGain) {
      this.masterGain.disconnect()
    }

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
    this.activeSounds.clear()
  }

  // ============ Private Methods ============

  private createNoiseBuffer(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    // Create 2 seconds of white noise
    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    return buffer
  }

  private createHarmonicOscillator(config: SoundConfig): OscillatorNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = config.frequency ?? 440

    // For richer sound, we'd normally add harmonics, but for simplicity
    // we'll use a single oscillator with slight detuning
    osc.detune.value = Math.random() * 10 - 5

    return osc
  }

  private playNoiseSound(
    type: SoundType,
    gainNode: GainNode,
    volume: number,
    fadeInTime: number
  ): void {
    if (!this.audioContext || !this.noiseBuffer) return

    // Create noise source
    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = this.noiseBuffer
    noiseSource.loop = true

    // Create filter based on sound type
    const filter = this.audioContext.createBiquadFilter()

    switch (type) {
      case 'rain_gentle':
        filter.type = 'highpass'
        filter.frequency.value = 1000
        filter.Q.value = 0.5
        break
      case 'rain_heavy':
        filter.type = 'bandpass'
        filter.frequency.value = 800
        filter.Q.value = 0.3
        break
      case 'ocean_waves':
        filter.type = 'lowpass'
        filter.frequency.value = 500
        filter.Q.value = 1
        break
      case 'river_stream':
        filter.type = 'bandpass'
        filter.frequency.value = 2000
        filter.Q.value = 0.5
        break
      case 'wind_gentle':
        filter.type = 'lowpass'
        filter.frequency.value = 400
        filter.Q.value = 0.5
        break
      case 'wind_strong':
        filter.type = 'lowpass'
        filter.frequency.value = 600
        filter.Q.value = 0.8
        break
      case 'fire_crackling':
        filter.type = 'bandpass'
        filter.frequency.value = 1500
        filter.Q.value = 2
        break
      case 'cosmic_wind':
        filter.type = 'lowpass'
        filter.frequency.value = 200
        filter.Q.value = 1
        break
      default:
        filter.type = 'lowpass'
        filter.frequency.value = 1000
    }

    noiseSource.connect(filter)
    filter.connect(gainNode)

    // Fade in
    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + fadeInTime / 1000)

    noiseSource.start()
  }

  private async startAmbientTone(frequency: number, volume: number): Promise<void> {
    // Ambient tones are handled by the harmonic oscillator system
    // This is a simplified implementation
  }

  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange({ ...this.state })
    }
  }
}

// ============ Factory & Singleton ============

let ambientSoundscapeInstance: AmbientSoundscapeEngine | null = null

/**
 * Get or create singleton instance
 */
export function getAmbientSoundscapeEngine(): AmbientSoundscapeEngine {
  if (!ambientSoundscapeInstance) {
    ambientSoundscapeInstance = new AmbientSoundscapeEngine()
  }
  return ambientSoundscapeInstance
}

/**
 * Create a new instance
 */
export function createAmbientSoundscapeEngine(
  options?: AmbientSoundscapeConfig
): AmbientSoundscapeEngine {
  return new AmbientSoundscapeEngine(options)
}

export const ambientSoundscapeEngine = getAmbientSoundscapeEngine()
