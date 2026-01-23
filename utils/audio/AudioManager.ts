/**
 * Unified Audio Manager for MindVibe
 *
 * Central hub for all audio functionality throughout the app:
 * - UI Sound Effects (clicks, toggles, notifications)
 * - Binaural Beats & Brainwave Entrainment
 * - Spatial 3D Audio
 * - Ambient Soundscapes
 * - Meditation & Healing Frequencies
 * - Breath-Synced Audio
 *
 * Usage:
 *   import { audioManager } from '@/utils/audio/AudioManager'
 *   audioManager.playUISound('click')
 *   audioManager.startBinauralBeats('meditation')
 */

// ============ Types ============

export type UISound =
  | 'click'
  | 'toggle'
  | 'success'
  | 'error'
  | 'notification'
  | 'message'
  | 'wakeWord'
  | 'listening'
  | 'thinking'
  | 'complete'
  | 'transition'
  | 'hover'
  | 'select'
  | 'deselect'
  | 'open'
  | 'close'
  | 'swipe'
  | 'refresh'
  | 'save'
  | 'delete'
  | 'send'
  | 'receive'
  | 'levelUp'
  | 'achievement'
  | 'streak'
  | 'meditation_start'
  | 'meditation_end'
  | 'breath_in'
  | 'breath_out'
  | 'breath_hold'
  | 'gong'
  | 'bell'
  | 'chime'
  | 'om'
  | 'singing_bowl'

export type BrainwavePreset =
  | 'focus'       // Beta 14-30 Hz
  | 'relaxation'  // Alpha 8-14 Hz
  | 'meditation'  // Theta 4-8 Hz
  | 'deep_sleep'  // Delta 0.5-4 Hz
  | 'creativity'  // Theta 6 Hz
  | 'healing'     // Solfeggio 528 Hz
  | 'grounding'   // Root 396 Hz
  | 'clarity'     // Third Eye 852 Hz
  | 'transcendence' // Crown 963 Hz

export type AmbientSoundscape =
  | 'nature'
  | 'rain'
  | 'ocean'
  | 'forest'
  | 'temple'
  | 'cosmic'
  | 'fire'
  | 'wind'
  | 'river'
  | 'birds'
  | 'night'
  | 'tibetan'

export type SpatialScene =
  | 'chakra_journey'
  | 'orbiting_wisdom'
  | 'nature_surround'
  | 'cosmic_meditation'
  | 'breathing_guide'
  | 'temple_bells'

export type ConsciousnessLayer =
  | 'annamaya'
  | 'pranamaya'
  | 'manomaya'
  | 'vijnanamaya'
  | 'anandamaya'

export interface AudioManagerState {
  initialized: boolean
  masterVolume: number
  uiSoundsEnabled: boolean
  binauralEnabled: boolean
  spatialEnabled: boolean
  ambientEnabled: boolean
  currentBrainwave: BrainwavePreset | null
  currentAmbient: AmbientSoundscape | null
  currentSpatialScene: SpatialScene | null
}

export interface AudioManagerConfig {
  masterVolume?: number
  uiSoundsEnabled?: boolean
  binauralVolume?: number
  ambientVolume?: number
  spatialVolume?: number
  onStateChange?: (state: AudioManagerState) => void
}

// ============ Sound Configurations ============

const UI_SOUNDS: Record<UISound, {
  frequencies: { freq: number; duration: number; type: OscillatorType; volume: number; delay?: number }[]
  haptic?: 'light' | 'medium' | 'heavy'
}> = {
  click: {
    frequencies: [{ freq: 1000, duration: 0.04, type: 'sine', volume: 0.15 }],
    haptic: 'light'
  },
  toggle: {
    frequencies: [
      { freq: 600, duration: 0.05, type: 'sine', volume: 0.12 },
      { freq: 800, duration: 0.06, type: 'sine', volume: 0.15, delay: 0.04 }
    ],
    haptic: 'light'
  },
  success: {
    frequencies: [
      { freq: 523, duration: 0.08, type: 'sine', volume: 0.2 },  // C5
      { freq: 659, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.08 },  // E5
      { freq: 784, duration: 0.12, type: 'sine', volume: 0.25, delay: 0.16 }  // G5
    ],
    haptic: 'medium'
  },
  error: {
    frequencies: [
      { freq: 200, duration: 0.12, type: 'sawtooth', volume: 0.15 },
      { freq: 150, duration: 0.15, type: 'sawtooth', volume: 0.12, delay: 0.1 }
    ],
    haptic: 'heavy'
  },
  notification: {
    frequencies: [
      { freq: 880, duration: 0.08, type: 'sine', volume: 0.18 },
      { freq: 1100, duration: 0.1, type: 'sine', volume: 0.2, delay: 0.08 }
    ],
    haptic: 'medium'
  },
  message: {
    frequencies: [
      { freq: 700, duration: 0.06, type: 'sine', volume: 0.15 },
      { freq: 900, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.05 }
    ],
    haptic: 'light'
  },
  wakeWord: {
    frequencies: [{ freq: 800, duration: 0.12, type: 'sine', volume: 0.25 }],
    haptic: 'medium'
  },
  listening: {
    frequencies: [
      { freq: 440, duration: 0.06, type: 'sine', volume: 0.18 },
      { freq: 660, duration: 0.1, type: 'sine', volume: 0.22, delay: 0.08 }
    ]
  },
  thinking: {
    frequencies: [{ freq: 300, duration: 0.4, type: 'sine', volume: 0.1 }]
  },
  complete: {
    frequencies: [
      { freq: 392, duration: 0.08, type: 'sine', volume: 0.18 },  // G4
      { freq: 523, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.08 },  // C5
      { freq: 659, duration: 0.15, type: 'sine', volume: 0.25, delay: 0.16 }  // E5
    ],
    haptic: 'medium'
  },
  transition: {
    frequencies: [
      { freq: 400, duration: 0.1, type: 'sine', volume: 0.1 },
      { freq: 500, duration: 0.15, type: 'sine', volume: 0.12, delay: 0.08 }
    ]
  },
  hover: {
    frequencies: [{ freq: 1200, duration: 0.02, type: 'sine', volume: 0.05 }]
  },
  select: {
    frequencies: [{ freq: 800, duration: 0.04, type: 'sine', volume: 0.12 }],
    haptic: 'light'
  },
  deselect: {
    frequencies: [{ freq: 600, duration: 0.04, type: 'sine', volume: 0.1 }]
  },
  open: {
    frequencies: [
      { freq: 300, duration: 0.06, type: 'sine', volume: 0.1 },
      { freq: 450, duration: 0.08, type: 'sine', volume: 0.12, delay: 0.04 },
      { freq: 600, duration: 0.1, type: 'sine', volume: 0.15, delay: 0.1 }
    ]
  },
  close: {
    frequencies: [
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.12 },
      { freq: 450, duration: 0.08, type: 'sine', volume: 0.1, delay: 0.04 },
      { freq: 300, duration: 0.1, type: 'sine', volume: 0.08, delay: 0.1 }
    ]
  },
  swipe: {
    frequencies: [
      { freq: 400, duration: 0.03, type: 'sine', volume: 0.08 },
      { freq: 600, duration: 0.05, type: 'sine', volume: 0.1, delay: 0.02 }
    ]
  },
  refresh: {
    frequencies: [
      { freq: 500, duration: 0.05, type: 'sine', volume: 0.1 },
      { freq: 700, duration: 0.08, type: 'sine', volume: 0.12, delay: 0.15 }
    ]
  },
  save: {
    frequencies: [
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.12 },
      { freq: 800, duration: 0.1, type: 'sine', volume: 0.15, delay: 0.05 }
    ],
    haptic: 'light'
  },
  delete: {
    frequencies: [
      { freq: 300, duration: 0.08, type: 'triangle', volume: 0.12 },
      { freq: 200, duration: 0.12, type: 'triangle', volume: 0.1, delay: 0.06 }
    ],
    haptic: 'medium'
  },
  send: {
    frequencies: [
      { freq: 500, duration: 0.04, type: 'sine', volume: 0.1 },
      { freq: 700, duration: 0.05, type: 'sine', volume: 0.12, delay: 0.03 },
      { freq: 900, duration: 0.06, type: 'sine', volume: 0.1, delay: 0.06 }
    ],
    haptic: 'light'
  },
  receive: {
    frequencies: [
      { freq: 800, duration: 0.05, type: 'sine', volume: 0.12 },
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.1, delay: 0.04 }
    ],
    haptic: 'light'
  },
  levelUp: {
    frequencies: [
      { freq: 523, duration: 0.1, type: 'sine', volume: 0.2 },
      { freq: 659, duration: 0.1, type: 'sine', volume: 0.22, delay: 0.1 },
      { freq: 784, duration: 0.1, type: 'sine', volume: 0.25, delay: 0.2 },
      { freq: 1047, duration: 0.2, type: 'sine', volume: 0.3, delay: 0.3 }
    ],
    haptic: 'heavy'
  },
  achievement: {
    frequencies: [
      { freq: 440, duration: 0.08, type: 'sine', volume: 0.15 },
      { freq: 554, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.08 },
      { freq: 659, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.16 },
      { freq: 880, duration: 0.2, type: 'sine', volume: 0.25, delay: 0.24 }
    ],
    haptic: 'heavy'
  },
  streak: {
    frequencies: [
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.15 },
      { freq: 800, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.06 },
      { freq: 1000, duration: 0.12, type: 'sine', volume: 0.2, delay: 0.14 }
    ],
    haptic: 'medium'
  },
  meditation_start: {
    frequencies: [
      { freq: 396, duration: 0.5, type: 'sine', volume: 0.15 },
      { freq: 528, duration: 0.8, type: 'sine', volume: 0.12, delay: 0.3 }
    ]
  },
  meditation_end: {
    frequencies: [
      { freq: 528, duration: 0.4, type: 'sine', volume: 0.15 },
      { freq: 639, duration: 0.5, type: 'sine', volume: 0.12, delay: 0.3 },
      { freq: 741, duration: 0.6, type: 'sine', volume: 0.1, delay: 0.6 }
    ]
  },
  breath_in: {
    frequencies: [
      { freq: 200, duration: 0.3, type: 'sine', volume: 0.08 },
      { freq: 300, duration: 0.4, type: 'sine', volume: 0.1, delay: 0.2 }
    ]
  },
  breath_out: {
    frequencies: [
      { freq: 300, duration: 0.3, type: 'sine', volume: 0.1 },
      { freq: 200, duration: 0.4, type: 'sine', volume: 0.08, delay: 0.2 }
    ]
  },
  breath_hold: {
    frequencies: [{ freq: 250, duration: 0.2, type: 'sine', volume: 0.05 }]
  },
  gong: {
    frequencies: [
      { freq: 100, duration: 2, type: 'sine', volume: 0.3 },
      { freq: 200, duration: 1.5, type: 'sine', volume: 0.2, delay: 0 },
      { freq: 400, duration: 1, type: 'sine', volume: 0.1, delay: 0 }
    ]
  },
  bell: {
    frequencies: [
      { freq: 800, duration: 0.8, type: 'sine', volume: 0.2 },
      { freq: 1200, duration: 0.5, type: 'sine', volume: 0.15, delay: 0 },
      { freq: 1600, duration: 0.3, type: 'sine', volume: 0.1, delay: 0 }
    ]
  },
  chime: {
    frequencies: [
      { freq: 1000, duration: 0.3, type: 'sine', volume: 0.15 },
      { freq: 1500, duration: 0.25, type: 'sine', volume: 0.12, delay: 0.1 },
      { freq: 2000, duration: 0.2, type: 'sine', volume: 0.1, delay: 0.2 }
    ]
  },
  om: {
    frequencies: [
      { freq: 136.1, duration: 2, type: 'sine', volume: 0.25 },  // OM frequency
      { freq: 272.2, duration: 1.5, type: 'sine', volume: 0.15, delay: 0.5 },
      { freq: 408.3, duration: 1, type: 'sine', volume: 0.1, delay: 1 }
    ]
  },
  singing_bowl: {
    frequencies: [
      { freq: 528, duration: 3, type: 'sine', volume: 0.2 },  // Healing frequency
      { freq: 1056, duration: 2, type: 'sine', volume: 0.1, delay: 0 },
      { freq: 1584, duration: 1.5, type: 'sine', volume: 0.05, delay: 0 }
    ]
  }
}

// Brainwave configurations
const BRAINWAVE_CONFIGS: Record<BrainwavePreset, {
  beatFrequency: number
  baseFrequency: number
  chakraFrequency?: number
  description: string
}> = {
  focus: { beatFrequency: 18, baseFrequency: 200, description: 'Beta waves for concentration' },
  relaxation: { beatFrequency: 10, baseFrequency: 200, description: 'Alpha waves for calm awareness' },
  meditation: { beatFrequency: 6, baseFrequency: 200, chakraFrequency: 528, description: 'Theta waves for deep meditation' },
  deep_sleep: { beatFrequency: 2, baseFrequency: 100, description: 'Delta waves for restorative sleep' },
  creativity: { beatFrequency: 6, baseFrequency: 150, description: 'Theta waves for inspiration' },
  healing: { beatFrequency: 8, baseFrequency: 528, chakraFrequency: 528, description: 'Solfeggio 528 Hz for cellular repair' },
  grounding: { beatFrequency: 10, baseFrequency: 396, chakraFrequency: 396, description: 'Root chakra for stability' },
  clarity: { beatFrequency: 6, baseFrequency: 852, chakraFrequency: 852, description: 'Third eye for intuition' },
  transcendence: { beatFrequency: 2, baseFrequency: 963, chakraFrequency: 963, description: 'Crown chakra for divine connection' }
}

// Layer to brainwave mapping
const LAYER_BRAINWAVES: Record<ConsciousnessLayer, BrainwavePreset> = {
  annamaya: 'grounding',
  pranamaya: 'relaxation',
  manomaya: 'meditation',
  vijnanamaya: 'clarity',
  anandamaya: 'transcendence'
}

// Soundscape layer configuration
interface SoundscapeLayer {
  useNoise: boolean           // Use noise buffer for natural sounds
  filterType?: BiquadFilterType
  filterFreq?: number
  filterQ?: number
  frequency?: number          // For oscillator-based sounds
  type?: OscillatorType
  volume: number
  pan?: number                // -1 (left) to 1 (right)
  modFreq?: number            // LFO modulation frequency
  fadeIn?: number             // Fade in time in seconds
}

interface SoundscapeConfig {
  layers: SoundscapeLayer[]
  ambientTone?: { frequency: number; volume: number }
}

// Realistic soundscape configurations with noise-based nature sounds
const SOUNDSCAPE_CONFIGS: Record<AmbientSoundscape, SoundscapeConfig> = {
  rain: {
    layers: [
      // Gentle rain - highpass filtered noise
      { useNoise: true, filterType: 'highpass', filterFreq: 1000, filterQ: 0.5, volume: 0.35, fadeIn: 3 },
      // Rain texture - bandpass filtered
      { useNoise: true, filterType: 'bandpass', filterFreq: 2500, filterQ: 1, volume: 0.15, fadeIn: 2 },
      // Low rumble
      { useNoise: true, filterType: 'lowpass', filterFreq: 200, filterQ: 0.5, volume: 0.1, fadeIn: 4 }
    ]
  },
  ocean: {
    layers: [
      // Deep ocean waves - lowpass filtered
      { useNoise: true, filterType: 'lowpass', filterFreq: 400, filterQ: 1, volume: 0.4, modFreq: 0.08, fadeIn: 4 },
      // Wave crashes - bandpass
      { useNoise: true, filterType: 'bandpass', filterFreq: 800, filterQ: 0.5, volume: 0.2, modFreq: 0.12, fadeIn: 3 },
      // Foam/spray - highpass
      { useNoise: true, filterType: 'highpass', filterFreq: 3000, filterQ: 0.3, volume: 0.08, modFreq: 0.15, fadeIn: 2 }
    ]
  },
  forest: {
    layers: [
      // Wind through leaves
      { useNoise: true, filterType: 'bandpass', filterFreq: 1500, filterQ: 0.5, volume: 0.2, modFreq: 0.3, fadeIn: 3 },
      // Ambient forest tone
      { useNoise: true, filterType: 'lowpass', filterFreq: 300, filterQ: 0.5, volume: 0.1, fadeIn: 4 },
      // Bird-like chirps (high frequency oscillator)
      { useNoise: false, frequency: 2000, type: 'sine', volume: 0.03, modFreq: 5, fadeIn: 2 }
    ],
    ambientTone: { frequency: 396, volume: 0.05 }
  },
  wind: {
    layers: [
      // Main wind - lowpass filtered
      { useNoise: true, filterType: 'lowpass', filterFreq: 400, filterQ: 0.8, volume: 0.3, modFreq: 0.1, fadeIn: 3 },
      // Wind gusts
      { useNoise: true, filterType: 'bandpass', filterFreq: 600, filterQ: 0.5, volume: 0.15, modFreq: 0.2, fadeIn: 2 },
      // High whistle
      { useNoise: true, filterType: 'highpass', filterFreq: 2000, filterQ: 1, volume: 0.05, modFreq: 0.3, fadeIn: 2 }
    ]
  },
  river: {
    layers: [
      // Flowing water - bandpass
      { useNoise: true, filterType: 'bandpass', filterFreq: 2000, filterQ: 0.5, volume: 0.35, modFreq: 0.2, fadeIn: 3 },
      // Deep current
      { useNoise: true, filterType: 'lowpass', filterFreq: 300, filterQ: 0.5, volume: 0.15, modFreq: 0.08, fadeIn: 4 },
      // Bubbling
      { useNoise: true, filterType: 'bandpass', filterFreq: 3000, filterQ: 2, volume: 0.08, modFreq: 0.5, fadeIn: 2 }
    ]
  },
  fire: {
    layers: [
      // Crackling - bandpass
      { useNoise: true, filterType: 'bandpass', filterFreq: 1500, filterQ: 2, volume: 0.25, modFreq: 3, fadeIn: 2 },
      // Low roar
      { useNoise: true, filterType: 'lowpass', filterFreq: 200, filterQ: 0.5, volume: 0.15, fadeIn: 3 },
      // Pops and snaps
      { useNoise: true, filterType: 'highpass', filterFreq: 2500, filterQ: 1, volume: 0.1, modFreq: 5, fadeIn: 1 }
    ]
  },
  birds: {
    layers: [
      // Background ambient
      { useNoise: true, filterType: 'lowpass', filterFreq: 400, filterQ: 0.3, volume: 0.1, fadeIn: 3 },
      // Bird chirps simulation
      { useNoise: false, frequency: 2500, type: 'sine', volume: 0.04, modFreq: 8, fadeIn: 2 },
      { useNoise: false, frequency: 3500, type: 'sine', volume: 0.03, modFreq: 12, fadeIn: 2 },
      { useNoise: false, frequency: 4500, type: 'sine', volume: 0.02, modFreq: 6, fadeIn: 2 }
    ]
  },
  night: {
    layers: [
      // Night ambient - very low
      { useNoise: true, filterType: 'lowpass', filterFreq: 150, filterQ: 0.5, volume: 0.15, fadeIn: 5 },
      // Crickets simulation
      { useNoise: false, frequency: 4000, type: 'sine', volume: 0.02, modFreq: 10, fadeIn: 3 },
      { useNoise: false, frequency: 4200, type: 'sine', volume: 0.015, modFreq: 12, fadeIn: 3 },
      // Distant sounds
      { useNoise: true, filterType: 'bandpass', filterFreq: 800, filterQ: 0.3, volume: 0.05, modFreq: 0.1, fadeIn: 4 }
    ]
  },
  temple: {
    layers: [
      // OM frequency drone
      { useNoise: false, frequency: 136.1, type: 'sine', volume: 0.15, fadeIn: 4 },
      // Harmonic
      { useNoise: false, frequency: 272.2, type: 'sine', volume: 0.08, fadeIn: 3 },
      // Healing frequency
      { useNoise: false, frequency: 528, type: 'sine', volume: 0.06, fadeIn: 3 }
    ],
    ambientTone: { frequency: 396, volume: 0.05 }
  },
  tibetan: {
    layers: [
      // Singing bowl frequencies
      { useNoise: false, frequency: 528, type: 'sine', volume: 0.15, fadeIn: 4 },
      { useNoise: false, frequency: 639, type: 'sine', volume: 0.1, fadeIn: 3 },
      { useNoise: false, frequency: 741, type: 'sine', volume: 0.08, fadeIn: 3 },
      // Subtle resonance
      { useNoise: true, filterType: 'bandpass', filterFreq: 528, filterQ: 10, volume: 0.05, fadeIn: 5 }
    ]
  },
  cosmic: {
    layers: [
      // Deep space drone
      { useNoise: false, frequency: 40, type: 'sine', volume: 0.12, modFreq: 0.02, fadeIn: 5 },
      { useNoise: false, frequency: 80, type: 'sine', volume: 0.08, modFreq: 0.03, fadeIn: 4 },
      // Cosmic wind
      { useNoise: true, filterType: 'lowpass', filterFreq: 100, filterQ: 0.5, volume: 0.1, modFreq: 0.05, fadeIn: 6 },
      // Ethereal shimmer
      { useNoise: true, filterType: 'highpass', filterFreq: 4000, filterQ: 0.5, volume: 0.03, modFreq: 0.1, fadeIn: 4 }
    ]
  },
  nature: {
    layers: [
      // General nature ambient
      { useNoise: true, filterType: 'lowpass', filterFreq: 300, filterQ: 0.5, volume: 0.15, fadeIn: 4 },
      // Leaves rustling
      { useNoise: true, filterType: 'bandpass', filterFreq: 1200, filterQ: 0.5, volume: 0.1, modFreq: 0.2, fadeIn: 3 },
      // Distant birds
      { useNoise: false, frequency: 2000, type: 'sine', volume: 0.02, modFreq: 4, fadeIn: 2 }
    ],
    ambientTone: { frequency: 396, volume: 0.03 }
  }
}

// ============ Audio Manager Class ============

class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null

  // Binaural beats nodes
  private binauralLeftOsc: OscillatorNode | null = null
  private binauralRightOsc: OscillatorNode | null = null
  private binauralGain: GainNode | null = null
  private binauralMerger: ChannelMergerNode | null = null
  private chakraOsc: OscillatorNode | null = null
  private chakraGain: GainNode | null = null

  // Ambient soundscape nodes
  private ambientOscillators: OscillatorNode[] = []
  private ambientSources: AudioBufferSourceNode[] = []
  private ambientGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null  // For realistic nature sounds

  // State
  private state: AudioManagerState = {
    initialized: false,
    masterVolume: 0.7,
    uiSoundsEnabled: true,
    binauralEnabled: false,
    spatialEnabled: false,
    ambientEnabled: false,
    currentBrainwave: null,
    currentAmbient: null,
    currentSpatialScene: null
  }

  private config: AudioManagerConfig = {}
  private binauralVolume = 0.3
  private ambientVolume = 0.25

  /**
   * Initialize the audio manager
   */
  async initialize(config?: AudioManagerConfig): Promise<boolean> {
    if (this.state.initialized) return true

    if (typeof window === 'undefined' || !('AudioContext' in window)) {
      console.warn('AudioManager: Web Audio API not supported')
      return false
    }

    try {
      this.config = config || {}
      this.audioContext = new AudioContext()

      // Create master gain
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = config?.masterVolume ?? 0.7
      this.masterGain.connect(this.audioContext.destination)

      // Create noise buffer for realistic nature sounds
      this.noiseBuffer = this.createNoiseBuffer()

      // Setup binaural beats infrastructure
      this.setupBinauralInfrastructure()

      // Setup ambient infrastructure
      this.setupAmbientInfrastructure()

      this.state.initialized = true
      this.state.masterVolume = config?.masterVolume ?? 0.7
      this.state.uiSoundsEnabled = config?.uiSoundsEnabled ?? true

      if (config?.binauralVolume) this.binauralVolume = config.binauralVolume
      if (config?.ambientVolume) this.ambientVolume = config.ambientVolume

      console.log('AudioManager: Initialized successfully')
      return true
    } catch (error) {
      console.error('AudioManager: Initialization failed', error)
      return false
    }
  }

  /**
   * Create white noise buffer for nature sounds (rain, ocean, wind, etc.)
   */
  private createNoiseBuffer(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    // Create 2 seconds of stereo white noise
    const sampleRate = this.audioContext.sampleRate
    const bufferSize = sampleRate * 2
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        // White noise with slight stereo variation
        data[i] = (Math.random() * 2 - 1) * (channel === 0 ? 1 : 0.98)
      }
    }

    return buffer
  }

  private setupBinauralInfrastructure(): void {
    if (!this.audioContext || !this.masterGain) return

    // Create binaural gain
    this.binauralGain = this.audioContext.createGain()
    this.binauralGain.gain.value = 0

    // Create channel merger for stereo separation
    this.binauralMerger = this.audioContext.createChannelMerger(2)
    this.binauralMerger.connect(this.binauralGain)
    this.binauralGain.connect(this.masterGain)

    // Create chakra frequency layer
    this.chakraGain = this.audioContext.createGain()
    this.chakraGain.gain.value = 0
    this.chakraGain.connect(this.masterGain)
  }

  private setupAmbientInfrastructure(): void {
    if (!this.audioContext || !this.masterGain) return

    this.ambientGain = this.audioContext.createGain()
    this.ambientGain.gain.value = 0
    this.ambientGain.connect(this.masterGain)
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // ============ UI Sounds ============

  /**
   * Play a UI sound effect
   */
  playUISound(sound: UISound): void {
    if (!this.state.uiSoundsEnabled || !this.audioContext || !this.masterGain) {
      this.ensureInitialized()
      return
    }

    this.resume()

    const config = UI_SOUNDS[sound]
    if (!config) return

    // Play haptic if available
    if (config.haptic) {
      this.playHaptic(config.haptic)
    }

    // Play audio
    config.frequencies.forEach(({ freq, duration, type, volume, delay = 0 }) => {
      setTimeout(() => {
        this.playTone(freq, duration, type, volume * this.state.masterVolume)
      }, delay * 1000)
    })
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.audioContext || !this.masterGain) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration + 0.1)
  }

  private playHaptic(pattern: 'light' | 'medium' | 'heavy'): void {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    const patterns = {
      light: [10],
      medium: [20, 10, 20],
      heavy: [30, 15, 30, 15, 30]
    }

    navigator.vibrate(patterns[pattern])
  }

  // ============ Binaural Beats ============

  /**
   * Start binaural beats
   */
  async startBinauralBeats(preset: BrainwavePreset): Promise<void> {
    if (!this.audioContext || !this.binauralMerger || !this.binauralGain) {
      await this.ensureInitialized()
      if (!this.audioContext) return
    }

    await this.resume()

    // Stop any existing binaural beats
    this.stopBinauralBeats()

    const config = BRAINWAVE_CONFIGS[preset]

    // Create left oscillator (base frequency)
    this.binauralLeftOsc = this.audioContext!.createOscillator()
    this.binauralLeftOsc.type = 'sine'
    this.binauralLeftOsc.frequency.value = config.baseFrequency

    const leftGain = this.audioContext!.createGain()
    leftGain.gain.value = 0.5
    this.binauralLeftOsc.connect(leftGain)
    leftGain.connect(this.binauralMerger!, 0, 0)

    // Create right oscillator (base + beat frequency)
    this.binauralRightOsc = this.audioContext!.createOscillator()
    this.binauralRightOsc.type = 'sine'
    this.binauralRightOsc.frequency.value = config.baseFrequency + config.beatFrequency

    const rightGain = this.audioContext!.createGain()
    rightGain.gain.value = 0.5
    this.binauralRightOsc.connect(rightGain)
    rightGain.connect(this.binauralMerger!, 0, 1)

    // Add chakra frequency if specified
    if (config.chakraFrequency && this.chakraGain) {
      this.chakraOsc = this.audioContext!.createOscillator()
      this.chakraOsc.type = 'sine'
      this.chakraOsc.frequency.value = config.chakraFrequency
      this.chakraOsc.connect(this.chakraGain)
      this.chakraOsc.start()

      this.chakraGain.gain.setTargetAtTime(0.1 * this.binauralVolume, this.audioContext!.currentTime, 0.5)
    }

    // Start oscillators
    this.binauralLeftOsc.start()
    this.binauralRightOsc.start()

    // Fade in
    this.binauralGain!.gain.setTargetAtTime(this.binauralVolume, this.audioContext!.currentTime, 1)

    this.state.binauralEnabled = true
    this.state.currentBrainwave = preset
    this.emitStateChange()

    console.log(`AudioManager: Started binaural beats - ${preset}`)
  }

  /**
   * Stop binaural beats
   */
  stopBinauralBeats(): void {
    if (this.binauralGain && this.audioContext) {
      this.binauralGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5)
    }

    if (this.chakraGain && this.audioContext) {
      this.chakraGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5)
    }

    setTimeout(() => {
      this.binauralLeftOsc?.stop()
      this.binauralRightOsc?.stop()
      this.chakraOsc?.stop()
      this.binauralLeftOsc = null
      this.binauralRightOsc = null
      this.chakraOsc = null
    }, 600)

    this.state.binauralEnabled = false
    this.state.currentBrainwave = null
    this.emitStateChange()
  }

  /**
   * Set binaural beats for consciousness layer
   */
  async setBinauralForLayer(layer: ConsciousnessLayer): Promise<void> {
    const preset = LAYER_BRAINWAVES[layer]
    await this.startBinauralBeats(preset)
  }

  /**
   * Set binaural beats volume
   */
  setBinauralVolume(volume: number): void {
    this.binauralVolume = Math.max(0, Math.min(1, volume))

    if (this.binauralGain && this.audioContext && this.state.binauralEnabled) {
      this.binauralGain.gain.setTargetAtTime(this.binauralVolume, this.audioContext.currentTime, 0.1)
    }

    if (this.chakraGain && this.audioContext) {
      this.chakraGain.gain.setTargetAtTime(0.1 * this.binauralVolume, this.audioContext.currentTime, 0.1)
    }
  }

  // ============ Ambient Soundscapes ============

  /**
   * Start ambient soundscape with realistic noise-based sounds
   */
  async startAmbientSoundscape(soundscape: AmbientSoundscape): Promise<void> {
    if (!this.audioContext || !this.ambientGain || !this.noiseBuffer) {
      await this.ensureInitialized()
      if (!this.audioContext || !this.noiseBuffer) return
    }

    await this.resume()

    // Stop existing ambient
    this.stopAmbientSoundscape()

    // Get soundscape configuration
    const config = SOUNDSCAPE_CONFIGS[soundscape]
    const now = this.audioContext!.currentTime

    // Create each layer of the soundscape
    config.layers.forEach(layer => {
      if (layer.useNoise) {
        // Noise-based sound (rain, ocean, wind, etc.)
        this.createNoiseLayer(layer, now)
      } else {
        // Oscillator-based sound (sacred tones, drones)
        this.createOscillatorLayer(layer, now)
      }
    })

    // Fade in master ambient gain
    this.ambientGain!.gain.setTargetAtTime(this.ambientVolume, now, 2)

    // Add ambient tone if specified
    const ambientTone = config.ambientTone
    if (ambientTone) {
      const toneOsc = this.audioContext!.createOscillator()
      toneOsc.type = 'sine'
      toneOsc.frequency.value = ambientTone.frequency

      const toneGain = this.audioContext!.createGain()
      toneGain.gain.setValueAtTime(0, now)
      toneGain.gain.linearRampToValueAtTime(ambientTone.volume * this.ambientVolume, now + 4)

      toneOsc.connect(toneGain)
      toneGain.connect(this.ambientGain!)
      toneOsc.start()

      this.ambientOscillators.push(toneOsc)
    }

    this.state.ambientEnabled = true
    this.state.currentAmbient = soundscape
    this.emitStateChange()

    console.log(`AudioManager: Started ambient soundscape - ${soundscape}`)
  }

  /**
   * Create a noise-based ambient layer (rain, ocean, wind, etc.)
   */
  private createNoiseLayer(layer: SoundscapeLayer, startTime: number): void {
    if (!this.audioContext || !this.noiseBuffer || !this.ambientGain) return

    // Create noise source from buffer
    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = this.noiseBuffer
    noiseSource.loop = true

    // Create filter for shaping the noise
    const filter = this.audioContext.createBiquadFilter()
    filter.type = layer.filterType || 'lowpass'
    filter.frequency.value = layer.filterFreq || 1000
    filter.Q.value = layer.filterQ || 0.5

    // Create gain node
    const gainNode = this.audioContext.createGain()
    const targetVolume = layer.volume * this.ambientVolume
    const fadeIn = layer.fadeIn || 2
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + fadeIn)

    // Add modulation (LFO) for natural movement
    if (layer.modFreq) {
      const lfo = this.audioContext.createOscillator()
      const lfoGain = this.audioContext.createGain()
      lfo.frequency.value = layer.modFreq
      lfoGain.gain.value = targetVolume * 0.4  // Modulation depth
      lfo.connect(lfoGain)
      lfoGain.connect(gainNode.gain)
      lfo.start()
    }

    // Add stereo panning if specified
    if (layer.pan !== undefined && 'createStereoPanner' in this.audioContext) {
      const panner = this.audioContext.createStereoPanner()
      panner.pan.value = layer.pan
      noiseSource.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(panner)
      panner.connect(this.ambientGain)
    } else {
      noiseSource.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.ambientGain)
    }

    noiseSource.start()
    this.ambientSources.push(noiseSource)
  }

  /**
   * Create an oscillator-based ambient layer (drones, sacred tones)
   */
  private createOscillatorLayer(layer: SoundscapeLayer, startTime: number): void {
    if (!this.audioContext || !this.ambientGain) return

    const osc = this.audioContext.createOscillator()
    osc.type = layer.type || 'sine'
    osc.frequency.value = layer.frequency || 440

    // Slight detuning for richer sound
    osc.detune.value = Math.random() * 10 - 5

    // Create gain node with fade in
    const gainNode = this.audioContext.createGain()
    const targetVolume = layer.volume * this.ambientVolume
    const fadeIn = layer.fadeIn || 2
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + fadeIn)

    // Add modulation for natural movement
    if (layer.modFreq) {
      const lfo = this.audioContext.createOscillator()
      const lfoGain = this.audioContext.createGain()
      lfo.frequency.value = layer.modFreq
      lfoGain.gain.value = layer.frequency ? layer.frequency * 0.02 : 10  // Subtle pitch modulation
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start()
    }

    osc.connect(gainNode)
    gainNode.connect(this.ambientGain)
    osc.start()

    this.ambientOscillators.push(osc)
  }

  /**
   * Stop ambient soundscape
   */
  stopAmbientSoundscape(): void {
    if (this.ambientGain && this.audioContext) {
      this.ambientGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 1)
    }

    setTimeout(() => {
      // Stop oscillators
      this.ambientOscillators.forEach(osc => {
        try { osc.stop() } catch {}
      })
      this.ambientOscillators = []

      // Stop noise sources
      this.ambientSources.forEach(source => {
        try { source.stop() } catch {}
      })
      this.ambientSources = []
    }, 1200)

    this.state.ambientEnabled = false
    this.state.currentAmbient = null
    this.emitStateChange()
  }

  /**
   * Set ambient volume
   */
  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume))

    if (this.ambientGain && this.audioContext && this.state.ambientEnabled) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.audioContext.currentTime, 0.1)
    }
  }

  // ============ Master Controls ============

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume))

    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(this.state.masterVolume, this.audioContext.currentTime, 0.1)
    }

    this.emitStateChange()
  }

  /**
   * Toggle UI sounds
   */
  setUISoundsEnabled(enabled: boolean): void {
    this.state.uiSoundsEnabled = enabled
    this.emitStateChange()
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.stopBinauralBeats()
    this.stopAmbientSoundscape()
  }

  /**
   * Get current state
   */
  getState(): AudioManagerState {
    return { ...this.state }
  }

  /**
   * Get available brainwave presets
   */
  getBrainwavePresets(): { id: BrainwavePreset; description: string }[] {
    return Object.entries(BRAINWAVE_CONFIGS).map(([id, config]) => ({
      id: id as BrainwavePreset,
      description: config.description
    }))
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAll()

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
    this.masterGain = null
    this.state.initialized = false
  }

  // ============ Private Helpers ============

  private async ensureInitialized(): Promise<void> {
    if (!this.state.initialized) {
      await this.initialize(this.config)
    }
  }

  private emitStateChange(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange(this.getState())
    }
  }
}

// ============ Singleton Export ============

let audioManagerInstance: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager()
  }
  return audioManagerInstance
}

export const audioManager = getAudioManager()

// ============ Convenience Functions ============

/**
 * Play a UI sound (auto-initializes if needed)
 */
export function playUISound(sound: UISound): void {
  audioManager.playUISound(sound)
}

/**
 * Start binaural beats (auto-initializes if needed)
 */
export async function startBinauralBeats(preset: BrainwavePreset): Promise<void> {
  await audioManager.startBinauralBeats(preset)
}

/**
 * Stop binaural beats
 */
export function stopBinauralBeats(): void {
  audioManager.stopBinauralBeats()
}

/**
 * Start ambient soundscape (auto-initializes if needed)
 */
export async function startAmbientSoundscape(soundscape: AmbientSoundscape): Promise<void> {
  await audioManager.startAmbientSoundscape(soundscape)
}

/**
 * Stop ambient soundscape
 */
export function stopAmbientSoundscape(): void {
  audioManager.stopAmbientSoundscape()
}

/**
 * Play meditation sounds
 */
export function playMeditationStart(): void {
  audioManager.playUISound('meditation_start')
}

export function playMeditationEnd(): void {
  audioManager.playUISound('meditation_end')
}

export function playGong(): void {
  audioManager.playUISound('gong')
}

export function playBell(): void {
  audioManager.playUISound('bell')
}

export function playOm(): void {
  audioManager.playUISound('om')
}

export function playSingingBowl(): void {
  audioManager.playUISound('singing_bowl')
}

export default audioManager
