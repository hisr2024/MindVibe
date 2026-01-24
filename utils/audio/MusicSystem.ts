/**
 * MindVibe Professional Music System
 *
 * ॐ श्री कृष्णाय नमः
 *
 * A comprehensive, professional-grade music system featuring:
 * - App-wide ambient music with procedural generation
 * - Meditation music for different brainwave states
 * - Time-based music (morning ragas, evening ragas, night music)
 * - Gita-based spiritual soundscapes
 * - Advanced synthesis with Web Audio API
 *
 * Based on Bhagavad Gita principles:
 * - Chapter 6: Dhyana Yoga (Meditation)
 * - Chapter 10: Vibhuti Yoga (Divine Manifestations)
 * - Chapter 15: Purushottama Yoga (Supreme Person)
 *
 * Indian Classical Music Theory:
 * - Raga System based on time of day (Prahar)
 * - Shruti (microtones) for authenticity
 * - Alap, Jod, Jhala structure for meditation
 */

// ============ Types ============

export type TimeOfDay = 'brahma_muhurta' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night'

export type BrainwaveState =
  | 'delta'    // 0.5-4 Hz: Deep sleep, healing
  | 'theta'    // 4-8 Hz: Meditation, creativity, intuition
  | 'alpha'    // 8-14 Hz: Relaxed awareness, calm focus
  | 'beta'     // 14-30 Hz: Active thinking, concentration
  | 'gamma'    // 30-100 Hz: Peak awareness, transcendence

export type MeditationType =
  | 'deep_sleep'       // Delta waves - Yoga Nidra
  | 'lucid_dreaming'   // Theta-Delta - Dream yoga
  | 'transcendental'   // Theta - Deep meditation
  | 'mindfulness'      // Alpha-Theta - Present awareness
  | 'zen'              // Alpha - Zazen style
  | 'loving_kindness'  // Alpha - Metta meditation
  | 'focus'            // Alpha-Beta - Concentration
  | 'flow_state'       // Beta-Gamma - Peak performance
  | 'cosmic'           // Gamma - Samadhi, cosmic consciousness

export type SpiritualMode =
  | 'om_meditation'    // Sacred Om vibration
  | 'gayatri'          // Gayatri mantra essence
  | 'mahamrityunjaya'  // Healing vibrations
  | 'gita_dhyana'      // Bhagavad Gita contemplation
  | 'krishna_flute'    // Divine flute of Krishna
  | 'temple_bells'     // Sacred temple atmosphere
  | 'vedic_chant'      // Vedic hymn ambiance
  | 'chakra_journey'   // Seven chakra activation
  | 'kundalini'        // Kundalini awakening tones

export type RagaTime =
  | 'bhairav'          // Early morning (4-7 AM) - Awakening
  | 'todi'             // Morning (7-10 AM) - Devotion
  | 'sarang'           // Late morning (10-1 PM) - Joy
  | 'bhimpalasi'       // Afternoon (1-4 PM) - Longing
  | 'multani'          // Late afternoon (4-5 PM) - Introspection
  | 'puriya'           // Evening (5-7 PM) - Serenity
  | 'yaman'            // Early night (7-10 PM) - Romance/Peace
  | 'darbari'          // Night (10-1 AM) - Majesty
  | 'malkauns'         // Late night (1-4 AM) - Mystery/Meditation

export type AmbientMusicMode =
  | 'serene'           // Calm, peaceful
  | 'ethereal'         // Dreamy, floating
  | 'cosmic'           // Space, infinite
  | 'nature'           // Organic, earthly
  | 'divine'           // Sacred, spiritual
  | 'healing'          // Therapeutic
  | 'energizing'       // Uplifting

export interface MusicSystemState {
  initialized: boolean
  isPlaying: boolean
  masterVolume: number

  // Current modes
  currentAmbientMode: AmbientMusicMode | null
  currentMeditationType: MeditationType | null
  currentSpiritualMode: SpiritualMode | null
  currentTimeMusic: TimeOfDay | null
  currentRaga: RagaTime | null
  currentBrainwave: BrainwaveState | null

  // Layer volumes
  ambientVolume: number
  meditationVolume: number
  spiritualVolume: number
  ragaVolume: number

  // Features enabled
  ambientEnabled: boolean
  meditationEnabled: boolean
  spiritualEnabled: boolean
  timeAwareEnabled: boolean
  autoTimeSwitch: boolean
}

export interface MusicSystemConfig {
  masterVolume?: number
  autoTimeSwitch?: boolean
  defaultAmbientMode?: AmbientMusicMode
  onStateChange?: (state: MusicSystemState) => void
}

// ============ Musical Constants ============

/**
 * Indian Classical Note Frequencies (Sa = C)
 * Based on Just Intonation with Shruti adjustments
 */
const SWARAS = {
  // Saptak (Octave) - Mandra (Lower)
  Sa_m: 130.81,   // C3 - Shadja (Tonic)
  Re_k_m: 138.59, // Db3 - Komal Rishabh
  Re_s_m: 146.83, // D3 - Shuddha Rishabh
  Ga_k_m: 155.56, // Eb3 - Komal Gandhar
  Ga_s_m: 164.81, // E3 - Shuddha Gandhar
  Ma_s_m: 174.61, // F3 - Shuddha Madhyam
  Ma_t_m: 185.00, // F#3 - Tivra Madhyam
  Pa_m: 196.00,   // G3 - Pancham
  Dha_k_m: 207.65,// Ab3 - Komal Dhaivat
  Dha_s_m: 220.00,// A3 - Shuddha Dhaivat
  Ni_k_m: 233.08, // Bb3 - Komal Nishad
  Ni_s_m: 246.94, // B3 - Shuddha Nishad

  // Saptak (Octave) - Madhya (Middle)
  Sa: 261.63,     // C4 - Shadja (Tonic)
  Re_k: 277.18,   // Db4 - Komal Rishabh
  Re_s: 293.66,   // D4 - Shuddha Rishabh
  Ga_k: 311.13,   // Eb4 - Komal Gandhar
  Ga_s: 329.63,   // E4 - Shuddha Gandhar
  Ma_s: 349.23,   // F4 - Shuddha Madhyam
  Ma_t: 369.99,   // F#4 - Tivra Madhyam
  Pa: 392.00,     // G4 - Pancham
  Dha_k: 415.30,  // Ab4 - Komal Dhaivat
  Dha_s: 440.00,  // A4 - Shuddha Dhaivat
  Ni_k: 466.16,   // Bb4 - Komal Nishad
  Ni_s: 493.88,   // B4 - Shuddha Nishad

  // Saptak (Octave) - Taar (Higher)
  Sa_t: 523.25,   // C5 - Shadja
  Re_k_t: 554.37, // Db5
  Re_s_t: 587.33, // D5
  Ga_k_t: 622.25, // Eb5
  Ga_s_t: 659.26, // E5
  Ma_s_t: 698.46, // F5
  Pa_t: 783.99,   // G5
}

/**
 * Sacred Frequencies
 */
const SACRED_FREQUENCIES = {
  om: 136.1,              // OM frequency (Earth year)
  om_harmonics: [136.1, 272.2, 408.3, 544.4, 680.5],

  // Solfeggio
  ut: 396,                // Liberation
  re: 417,                // Change
  mi: 528,                // Miracles/DNA repair
  fa: 639,                // Connection
  sol: 741,               // Expression
  la: 852,                // Intuition
  si: 963,                // Divine connection

  // Chakra frequencies
  muladhara: 396,         // Root
  svadhisthana: 417,      // Sacral
  manipura: 528,          // Solar Plexus
  anahata: 639,           // Heart
  vishuddha: 741,         // Throat
  ajna: 852,              // Third Eye
  sahasrara: 963,         // Crown

  // Planetary frequencies
  earth: 136.1,           // Earth year
  sun: 126.22,            // Sun
  moon: 210.42,           // Moon

  // Schumann resonance
  schumann: 7.83,
}

/**
 * Raga Definitions with scale patterns and moods
 */
const RAGA_DEFINITIONS: Record<RagaTime, {
  aroha: string[]      // Ascending scale
  avaroha: string[]    // Descending scale
  vadi: string         // Most important note
  samvadi: string      // Second most important
  mood: string
  description: string
}> = {
  bhairav: {
    aroha: ['Sa', 'Re_k', 'Ga_s', 'Ma_s', 'Pa', 'Dha_k', 'Ni_s', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_s', 'Dha_k', 'Pa', 'Ma_s', 'Ga_s', 'Re_k', 'Sa'],
    vadi: 'Dha_k',
    samvadi: 'Re_k',
    mood: 'Devotion, awakening, divine presence',
    description: 'Morning raga for spiritual awakening'
  },
  todi: {
    aroha: ['Sa', 'Re_k', 'Ga_k', 'Ma_t', 'Pa', 'Dha_k', 'Ni_s', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_s', 'Dha_k', 'Pa', 'Ma_t', 'Ga_k', 'Re_k', 'Sa'],
    vadi: 'Dha_k',
    samvadi: 'Ga_k',
    mood: 'Devotion, pathos, intensity',
    description: 'Deep devotional morning raga'
  },
  sarang: {
    aroha: ['Sa', 'Re_s', 'Ma_s', 'Pa', 'Ni_s', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_s', 'Pa', 'Ma_s', 'Re_s', 'Sa'],
    vadi: 'Re_s',
    samvadi: 'Pa',
    mood: 'Joy, brightness, celebration',
    description: 'Late morning raga of joy'
  },
  bhimpalasi: {
    aroha: ['Sa', 'Ga_k', 'Ma_s', 'Pa', 'Ni_k', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_k', 'Dha_s', 'Pa', 'Ma_s', 'Ga_k', 'Re_s', 'Sa'],
    vadi: 'Ma_s',
    samvadi: 'Sa',
    mood: 'Longing, romantic, contemplative',
    description: 'Afternoon raga of longing'
  },
  multani: {
    aroha: ['Sa', 'Ga_k', 'Ma_t', 'Pa', 'Ni_k', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_k', 'Dha_k', 'Pa', 'Ma_t', 'Ga_k', 'Sa'],
    vadi: 'Pa',
    samvadi: 'Sa',
    mood: 'Introspection, depth, seriousness',
    description: 'Late afternoon contemplative raga'
  },
  puriya: {
    aroha: ['Sa', 'Re_k', 'Ga_s', 'Ma_t', 'Dha_s', 'Ni_s', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_s', 'Dha_s', 'Ma_t', 'Ga_s', 'Re_k', 'Sa'],
    vadi: 'Ga_s',
    samvadi: 'Ni_s',
    mood: 'Serene, profound, philosophical',
    description: 'Evening raga of serenity'
  },
  yaman: {
    aroha: ['Sa', 'Re_s', 'Ga_s', 'Ma_t', 'Pa', 'Dha_s', 'Ni_s', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_s', 'Dha_s', 'Pa', 'Ma_t', 'Ga_s', 'Re_s', 'Sa'],
    vadi: 'Ga_s',
    samvadi: 'Ni_s',
    mood: 'Peace, devotion, romantic',
    description: 'Early night raga of peace'
  },
  darbari: {
    aroha: ['Sa', 'Re_s', 'Ga_k', 'Ma_s', 'Pa', 'Dha_k', 'Ni_k', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_k', 'Dha_k', 'Pa', 'Ma_s', 'Ga_k', 'Re_s', 'Sa'],
    vadi: 'Re_s',
    samvadi: 'Pa',
    mood: 'Majestic, royal, deep',
    description: 'Night raga of majesty and depth'
  },
  malkauns: {
    aroha: ['Sa', 'Ga_k', 'Ma_s', 'Dha_k', 'Ni_k', 'Sa_t'],
    avaroha: ['Sa_t', 'Ni_k', 'Dha_k', 'Ma_s', 'Ga_k', 'Sa'],
    vadi: 'Ma_s',
    samvadi: 'Sa',
    mood: 'Mysterious, meditative, transcendent',
    description: 'Late night raga for deep meditation'
  }
}

/**
 * Brainwave frequency configurations
 */
const BRAINWAVE_CONFIGS: Record<BrainwaveState, {
  minFreq: number
  maxFreq: number
  centerFreq: number
  description: string
  colors: string[]
}> = {
  delta: {
    minFreq: 0.5,
    maxFreq: 4,
    centerFreq: 2,
    description: 'Deep sleep, healing, regeneration',
    colors: ['#1a1a2e', '#16213e', '#0f3460']
  },
  theta: {
    minFreq: 4,
    maxFreq: 8,
    centerFreq: 6,
    description: 'Deep meditation, creativity, intuition',
    colors: ['#4a0072', '#7b2cbf', '#9d4edd']
  },
  alpha: {
    minFreq: 8,
    maxFreq: 14,
    centerFreq: 10,
    description: 'Relaxed awareness, calm focus',
    colors: ['#1e3a5f', '#3d5a80', '#98c1d9']
  },
  beta: {
    minFreq: 14,
    maxFreq: 30,
    centerFreq: 20,
    description: 'Active thinking, concentration',
    colors: ['#2d6a4f', '#40916c', '#74c69d']
  },
  gamma: {
    minFreq: 30,
    maxFreq: 100,
    centerFreq: 40,
    description: 'Peak awareness, transcendence',
    colors: ['#ff6b6b', '#ffd93d', '#6bcb77']
  }
}

// ============ Music System Class ============

class MusicSystem {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null

  // Layer gain nodes
  private ambientGain: GainNode | null = null
  private meditationGain: GainNode | null = null
  private spiritualGain: GainNode | null = null
  private ragaGain: GainNode | null = null

  // Oscillators and nodes for different systems
  private ambientOscillators: OscillatorNode[] = []
  private meditationOscillators: OscillatorNode[] = []
  private spiritualOscillators: OscillatorNode[] = []
  private ragaOscillators: OscillatorNode[] = []

  // LFOs for modulation
  private lfoNodes: OscillatorNode[] = []

  // Noise generators
  private noiseNodes: AudioBufferSourceNode[] = []

  // Filters
  private filters: BiquadFilterNode[] = []

  // Reverb
  private convolver: ConvolverNode | null = null

  // State
  private state: MusicSystemState = {
    initialized: false,
    isPlaying: false,
    masterVolume: 0.6,
    currentAmbientMode: null,
    currentMeditationType: null,
    currentSpiritualMode: null,
    currentTimeMusic: null,
    currentRaga: null,
    currentBrainwave: null,
    ambientVolume: 0.5,
    meditationVolume: 0.6,
    spiritualVolume: 0.5,
    ragaVolume: 0.4,
    ambientEnabled: false,
    meditationEnabled: false,
    spiritualEnabled: false,
    timeAwareEnabled: false,
    autoTimeSwitch: true
  }

  private config: MusicSystemConfig = {}
  private timeCheckInterval: ReturnType<typeof setInterval> | null = null

  // ============ Initialization ============

  async initialize(config: MusicSystemConfig = {}): Promise<boolean> {
    if (this.state.initialized) return true

    try {
      this.config = config

      // Create Ultra HD audio context with highest sample rate
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass({
        sampleRate: 48000, // Ultra HD: 48kHz sample rate
        latencyHint: 'playback' // Optimize for audio quality over latency
      })

      // Create master gain with smooth transitions
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = config.masterVolume ?? 0.6

      // Add master compressor for polished sound
      const masterCompressor = this.audioContext.createDynamicsCompressor()
      masterCompressor.threshold.value = -24
      masterCompressor.knee.value = 30
      masterCompressor.ratio.value = 4
      masterCompressor.attack.value = 0.003
      masterCompressor.release.value = 0.25

      this.masterGain.connect(masterCompressor)
      masterCompressor.connect(this.audioContext.destination)

      // Create layer gains
      this.ambientGain = this.audioContext.createGain()
      this.ambientGain.gain.value = this.state.ambientVolume
      this.ambientGain.connect(this.masterGain)

      this.meditationGain = this.audioContext.createGain()
      this.meditationGain.gain.value = this.state.meditationVolume
      this.meditationGain.connect(this.masterGain)

      this.spiritualGain = this.audioContext.createGain()
      this.spiritualGain.gain.value = this.state.spiritualVolume
      this.spiritualGain.connect(this.masterGain)

      this.ragaGain = this.audioContext.createGain()
      this.ragaGain.gain.value = this.state.ragaVolume
      this.ragaGain.connect(this.masterGain)

      // Create reverb
      await this.createReverb()

      // Start time-aware music if enabled
      if (config.autoTimeSwitch !== false) {
        this.startTimeAwareness()
      }

      this.state.initialized = true
      this.state.masterVolume = config.masterVolume ?? 0.6
      this.notifyStateChange()

      return true
    } catch (error) {
      console.error('MusicSystem initialization failed:', error)
      return false
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // ============ Ultra HD Reverb Generation ============

  private async createReverb(): Promise<void> {
    if (!this.audioContext) return

    // Create high-quality impulse response for Ultra HD reverb
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * 4 // 4 second lush reverb tail
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)

    // Generate studio-quality reverb with multiple decay stages
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const t = i / length
        // Multi-stage decay for rich, natural reverb
        const earlyReflections = t < 0.05 ? Math.random() * 0.8 : 0
        const lateReverb = Math.pow(1 - t, 3) * 0.6
        const diffusion = Math.sin(t * Math.PI * 50) * Math.pow(1 - t, 4) * 0.2
        // Stereo width variation
        const stereoSpread = channel === 0 ? 1 : 0.95 + Math.random() * 0.1
        channelData[i] = (Math.random() * 2 - 1) * (earlyReflections + lateReverb + diffusion) * stereoSpread
      }
    }

    this.convolver = this.audioContext.createConvolver()
    this.convolver.buffer = impulse

    // Add reverb pre-filter for warmth
    const reverbFilter = this.audioContext.createBiquadFilter()
    reverbFilter.type = 'lowpass'
    reverbFilter.frequency.value = 6000
    reverbFilter.Q.value = 0.7

    // Reverb wet/dry mix
    const reverbGain = this.audioContext.createGain()
    reverbGain.gain.value = 0.35

    this.convolver.connect(reverbFilter)
    reverbFilter.connect(reverbGain)
    reverbGain.connect(this.masterGain!)
  }

  // ============ Noise Generation ============

  private createNoiseBuffer(type: 'white' | 'pink' | 'brown' = 'pink'): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    } else { // brown
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + (0.02 * white)) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    }

    return buffer
  }

  private createNoiseSource(type: 'white' | 'pink' | 'brown' = 'pink'): AudioBufferSourceNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    const noise = this.audioContext.createBufferSource()
    noise.buffer = this.createNoiseBuffer(type)
    noise.loop = true
    return noise
  }

  // ============ Time-Aware Music ============

  private startTimeAwareness(): void {
    this.checkTimeAndUpdateMusic()

    // Check every 15 minutes
    this.timeCheckInterval = setInterval(() => {
      this.checkTimeAndUpdateMusic()
    }, 15 * 60 * 1000)
  }

  private checkTimeAndUpdateMusic(): void {
    const hour = new Date().getHours()
    const timeOfDay = this.getTimeOfDay(hour)
    const raga = this.getRagaForTime(hour)

    if (this.state.autoTimeSwitch && this.state.timeAwareEnabled) {
      if (this.state.currentTimeMusic !== timeOfDay) {
        this.state.currentTimeMusic = timeOfDay
        this.state.currentRaga = raga
        this.notifyStateChange()
      }
    }
  }

  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 4 && hour < 6) return 'brahma_muhurta'
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 16) return 'afternoon'
    if (hour >= 16 && hour < 20) return 'evening'
    if (hour >= 20 && hour < 24) return 'night'
    return 'late_night'
  }

  private getRagaForTime(hour: number): RagaTime {
    if (hour >= 4 && hour < 7) return 'bhairav'
    if (hour >= 7 && hour < 10) return 'todi'
    if (hour >= 10 && hour < 13) return 'sarang'
    if (hour >= 13 && hour < 16) return 'bhimpalasi'
    if (hour >= 16 && hour < 17) return 'multani'
    if (hour >= 17 && hour < 19) return 'puriya'
    if (hour >= 19 && hour < 22) return 'yaman'
    if (hour >= 22 || hour < 1) return 'darbari'
    return 'malkauns'
  }

  // ============ Ambient Music ============

  async startAmbientMusic(mode: AmbientMusicMode = 'serene'): Promise<void> {
    if (!this.audioContext || !this.ambientGain) {
      await this.initialize()
    }
    await this.resume()

    // Stop existing ambient
    this.stopAmbientMusic()

    this.state.currentAmbientMode = mode
    this.state.ambientEnabled = true
    this.state.isPlaying = true

    switch (mode) {
      case 'serene':
        this.createSereneAmbient()
        break
      case 'ethereal':
        this.createEtherealAmbient()
        break
      case 'cosmic':
        this.createCosmicAmbient()
        break
      case 'nature':
        this.createNatureAmbient()
        break
      case 'divine':
        this.createDivineAmbient()
        break
      case 'healing':
        this.createHealingAmbient()
        break
      case 'energizing':
        this.createEnergizingAmbient()
        break
    }

    this.notifyStateChange()
  }

  private createSereneAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // Create layered pad sounds
    const frequencies = [SWARAS.Sa, SWARAS.Pa, SWARAS.Sa_t * 0.5]

    frequencies.forEach((freq, i) => {
      // Main oscillator
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      // Gain envelope
      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.08 - (i * 0.02)

      // Slow LFO for gentle movement
      const lfo = this.audioContext!.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.1 + (i * 0.05)

      const lfoGain = this.audioContext!.createGain()
      lfoGain.gain.value = freq * 0.002

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      // Lowpass filter for warmth
      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800
      filter.Q.value = 0.5

      osc.connect(gain)
      gain.connect(filter)
      filter.connect(this.ambientGain!)
      if (this.convolver) {
        filter.connect(this.convolver)
      }

      osc.start()
      lfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(lfo)
      this.filters.push(filter)
    })

    // Add subtle pink noise
    const noise = this.createNoiseSource('pink')
    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.value = 0.015

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 400

    noise.connect(noiseGain)
    noiseGain.connect(noiseFilter)
    noiseFilter.connect(this.ambientGain)

    noise.start()
    this.noiseNodes.push(noise)
    this.filters.push(noiseFilter)
  }

  private createEtherealAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // Ethereal uses higher harmonics with lots of modulation
    const baseFreq = SWARAS.Sa * 0.5

    for (let i = 1; i <= 6; i++) {
      const osc = this.audioContext.createOscillator()
      osc.type = i <= 3 ? 'sine' : 'triangle'
      osc.frequency.value = baseFreq * i * (1 + Math.random() * 0.01)

      const gain = this.audioContext.createGain()
      gain.gain.value = 0.06 / i

      // Complex LFO modulation
      const lfo = this.audioContext.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.05 + Math.random() * 0.1

      const lfoGain = this.audioContext.createGain()
      lfoGain.gain.value = osc.frequency.value * 0.01

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      // Highpass for airiness
      const hp = this.audioContext.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 200

      // Lowpass for smoothness
      const lp = this.audioContext.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 2000

      osc.connect(gain)
      gain.connect(hp)
      hp.connect(lp)
      lp.connect(this.ambientGain)
      if (this.convolver) {
        lp.connect(this.convolver)
      }

      osc.start()
      lfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(lfo)
      this.filters.push(hp, lp)
    }
  }

  private createCosmicAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // Deep space sounds with Schumann resonance
    const cosmicFreqs = [
      SACRED_FREQUENCIES.schumann,
      SACRED_FREQUENCIES.earth,
      SACRED_FREQUENCIES.earth * 2,
      SACRED_FREQUENCIES.earth * 3
    ]

    cosmicFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.1 / (i + 1)

      // Very slow LFO
      const lfo = this.audioContext!.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.02 + (i * 0.01)

      const lfoGain = this.audioContext!.createGain()
      lfoGain.gain.value = freq * 0.005

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      osc.connect(gain)
      gain.connect(this.ambientGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      lfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(lfo)
    })

    // Add deep brown noise
    const noise = this.createNoiseSource('brown')
    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.value = 0.03

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 150

    noise.connect(noiseGain)
    noiseGain.connect(noiseFilter)
    noiseFilter.connect(this.ambientGain)

    noise.start()
    this.noiseNodes.push(noise)
    this.filters.push(noiseFilter)
  }

  private createNatureAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // Nature-inspired organic sounds
    // Wind-like filtered noise
    const windNoise = this.createNoiseSource('pink')
    const windGain = this.audioContext.createGain()
    windGain.gain.value = 0.04

    const windFilter = this.audioContext.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 500
    windFilter.Q.value = 0.8

    // Modulate wind filter
    const windLfo = this.audioContext.createOscillator()
    windLfo.type = 'sine'
    windLfo.frequency.value = 0.15

    const windLfoGain = this.audioContext.createGain()
    windLfoGain.gain.value = 300

    windLfo.connect(windLfoGain)
    windLfoGain.connect(windFilter.frequency)

    windNoise.connect(windGain)
    windGain.connect(windFilter)
    windFilter.connect(this.ambientGain)

    windNoise.start()
    windLfo.start()

    this.noiseNodes.push(windNoise)
    this.lfoNodes.push(windLfo)
    this.filters.push(windFilter)

    // Bird-like high frequency chirps (subtle)
    const birdFreqs = [2000, 2500, 3000, 3500]
    birdFreqs.forEach((freq) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0

      // Random amplitude modulation for bird-like sounds
      const ampLfo = this.audioContext!.createOscillator()
      ampLfo.type = 'sine'
      ampLfo.frequency.value = 5 + Math.random() * 10

      const ampLfoGain = this.audioContext!.createGain()
      ampLfoGain.gain.value = 0.002

      ampLfo.connect(ampLfoGain)
      ampLfoGain.connect(gain.gain)

      // Random timing
      setInterval(() => {
        if (Math.random() > 0.7) {
          gain.gain.setTargetAtTime(0.003, this.audioContext!.currentTime, 0.01)
          gain.gain.setTargetAtTime(0, this.audioContext!.currentTime + 0.1, 0.05)
        }
      }, 2000 + Math.random() * 3000)

      osc.connect(gain)
      gain.connect(this.ambientGain!)

      osc.start()
      ampLfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(ampLfo)
    })

    // Water-like low rumble
    const waterNoise = this.createNoiseSource('brown')
    const waterGain = this.audioContext.createGain()
    waterGain.gain.value = 0.025

    const waterFilter = this.audioContext.createBiquadFilter()
    waterFilter.type = 'lowpass'
    waterFilter.frequency.value = 200

    waterNoise.connect(waterGain)
    waterGain.connect(waterFilter)
    waterFilter.connect(this.ambientGain)
    if (this.convolver) {
      waterFilter.connect(this.convolver)
    }

    waterNoise.start()
    this.noiseNodes.push(waterNoise)
    this.filters.push(waterFilter)
  }

  private createDivineAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // Sacred frequencies with Om base
    const omFreqs = SACRED_FREQUENCIES.om_harmonics

    omFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.08 / (i + 1)

      // Slow breathing-like modulation
      const breathLfo = this.audioContext!.createOscillator()
      breathLfo.type = 'sine'
      breathLfo.frequency.value = 0.08 // ~7.5 second breath cycle

      const breathGain = this.audioContext!.createGain()
      breathGain.gain.value = gain.gain.value * 0.5

      breathLfo.connect(breathGain)
      breathGain.connect(gain.gain)

      osc.connect(gain)
      gain.connect(this.ambientGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      breathLfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(breathLfo)
    })

    // Add temple bell undertones
    const bellFreqs = [396, 528, 639] // Solfeggio
    bellFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.03 / (i + 1)

      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1000

      osc.connect(gain)
      gain.connect(filter)
      filter.connect(this.ambientGain!)

      osc.start()

      this.ambientOscillators.push(osc)
      this.filters.push(filter)
    })
  }

  private createHealingAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // 528 Hz based healing frequencies
    const healingFreqs = [
      SACRED_FREQUENCIES.mi,        // 528 Hz - DNA repair
      SACRED_FREQUENCIES.mi / 2,    // 264 Hz
      SACRED_FREQUENCIES.mi * 1.5,  // 792 Hz (perfect fifth)
      SACRED_FREQUENCIES.fa,        // 639 Hz - Heart
    ]

    healingFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.07 / (i + 1)

      // Gentle pulsing
      const pulseLfo = this.audioContext!.createOscillator()
      pulseLfo.type = 'sine'
      pulseLfo.frequency.value = 0.1 + (i * 0.02)

      const pulseGain = this.audioContext!.createGain()
      pulseGain.gain.value = gain.gain.value * 0.3

      pulseLfo.connect(pulseGain)
      pulseGain.connect(gain.gain)

      osc.connect(gain)
      gain.connect(this.ambientGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      pulseLfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(pulseLfo)
    })

    // Soft pink noise bed
    const noise = this.createNoiseSource('pink')
    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.value = 0.012

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 600

    noise.connect(noiseGain)
    noiseGain.connect(noiseFilter)
    noiseFilter.connect(this.ambientGain)

    noise.start()
    this.noiseNodes.push(noise)
    this.filters.push(noiseFilter)
  }

  private createEnergizingAmbient(): void {
    if (!this.audioContext || !this.ambientGain) return

    // Brighter, more active frequencies
    const energyFreqs = [
      SWARAS.Sa,
      SWARAS.Ga_s,
      SWARAS.Pa,
      SWARAS.Sa_t
    ]

    energyFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = i < 2 ? 'sine' : 'triangle'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.06 / (i + 1)

      // Faster modulation for energy
      const lfo = this.audioContext!.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.2 + (i * 0.1)

      const lfoGain = this.audioContext!.createGain()
      lfoGain.gain.value = freq * 0.003

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      osc.connect(gain)
      gain.connect(this.ambientGain!)

      osc.start()
      lfo.start()

      this.ambientOscillators.push(osc)
      this.lfoNodes.push(lfo)
    })
  }

  stopAmbientMusic(): void {
    this.ambientOscillators.forEach(osc => {
      try { osc.stop() } catch { /* ignore */ }
    })
    this.ambientOscillators = []

    this.state.ambientEnabled = false
    this.state.currentAmbientMode = null
    this.updatePlayingState()
    this.notifyStateChange()
  }

  // ============ Meditation Music ============

  async startMeditationMusic(type: MeditationType): Promise<void> {
    if (!this.audioContext || !this.meditationGain) {
      await this.initialize()
    }
    await this.resume()

    this.stopMeditationMusic()

    this.state.currentMeditationType = type
    this.state.meditationEnabled = true
    this.state.isPlaying = true

    // Set brainwave based on meditation type
    const brainwaveMap: Record<MeditationType, BrainwaveState> = {
      deep_sleep: 'delta',
      lucid_dreaming: 'theta',
      transcendental: 'theta',
      mindfulness: 'alpha',
      zen: 'alpha',
      loving_kindness: 'alpha',
      focus: 'beta',
      flow_state: 'beta',
      cosmic: 'gamma'
    }

    this.state.currentBrainwave = brainwaveMap[type]
    this.createBrainwaveEntrainment(this.state.currentBrainwave)
    this.createMeditationPad(type)

    this.notifyStateChange()
  }

  private createBrainwaveEntrainment(brainwave: BrainwaveState): void {
    if (!this.audioContext || !this.meditationGain) return

    const config = BRAINWAVE_CONFIGS[brainwave]
    const baseFreq = 200 // Carrier frequency
    const beatFreq = config.centerFreq

    // Left ear oscillator
    const leftOsc = this.audioContext.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = baseFreq

    // Right ear oscillator (slightly different for binaural beat)
    const rightOsc = this.audioContext.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.value = baseFreq + beatFreq

    // Stereo panning
    const leftPan = this.audioContext.createStereoPanner()
    leftPan.pan.value = -1

    const rightPan = this.audioContext.createStereoPanner()
    rightPan.pan.value = 1

    // Gains
    const leftGain = this.audioContext.createGain()
    leftGain.gain.value = 0.08

    const rightGain = this.audioContext.createGain()
    rightGain.gain.value = 0.08

    // Connect
    leftOsc.connect(leftGain)
    leftGain.connect(leftPan)
    leftPan.connect(this.meditationGain)

    rightOsc.connect(rightGain)
    rightGain.connect(rightPan)
    rightPan.connect(this.meditationGain)

    leftOsc.start()
    rightOsc.start()

    this.meditationOscillators.push(leftOsc, rightOsc)

    // Add isochronic tones for enhanced entrainment
    if (brainwave !== 'delta') { // Don't add to delta (too disruptive)
      this.addIsochronicTones(beatFreq)
    }
  }

  private addIsochronicTones(frequency: number): void {
    if (!this.audioContext || !this.meditationGain) return

    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 200

    const gain = this.audioContext.createGain()
    gain.gain.value = 0

    // Pulse the gain at the brainwave frequency
    const lfo = this.audioContext.createOscillator()
    lfo.type = 'square'
    lfo.frequency.value = frequency

    const lfoGain = this.audioContext.createGain()
    lfoGain.gain.value = 0.04

    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    osc.connect(gain)
    gain.connect(this.meditationGain)

    osc.start()
    lfo.start()

    this.meditationOscillators.push(osc)
    this.lfoNodes.push(lfo)
  }

  private createMeditationPad(type: MeditationType): void {
    if (!this.audioContext || !this.meditationGain) return

    // Choose frequencies based on meditation type
    let padFreqs: number[]

    switch (type) {
      case 'deep_sleep':
        padFreqs = [SWARAS.Sa_m, SWARAS.Pa_m, SWARAS.Sa]
        break
      case 'lucid_dreaming':
        padFreqs = [SWARAS.Sa, SWARAS.Ga_k, SWARAS.Pa]
        break
      case 'transcendental':
        padFreqs = [SACRED_FREQUENCIES.om, SACRED_FREQUENCIES.om * 2, SACRED_FREQUENCIES.om * 3]
        break
      case 'mindfulness':
        padFreqs = [SWARAS.Sa, SWARAS.Ma_s, SWARAS.Pa]
        break
      case 'zen':
        padFreqs = [SWARAS.Sa, SWARAS.Pa]
        break
      case 'loving_kindness':
        padFreqs = [SACRED_FREQUENCIES.fa, SACRED_FREQUENCIES.fa * 0.5, SACRED_FREQUENCIES.fa * 1.5]
        break
      case 'focus':
        padFreqs = [SWARAS.Sa, SWARAS.Ga_s, SWARAS.Pa, SWARAS.Sa_t]
        break
      case 'flow_state':
        padFreqs = [SWARAS.Sa, SWARAS.Re_s, SWARAS.Pa, SWARAS.Dha_s]
        break
      case 'cosmic':
        padFreqs = [SACRED_FREQUENCIES.si, SACRED_FREQUENCIES.si * 0.5, SACRED_FREQUENCIES.la]
        break
      default:
        padFreqs = [SWARAS.Sa, SWARAS.Pa]
    }

    padFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.05 / (i + 1)

      // Very slow modulation for meditation
      const lfo = this.audioContext!.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.03 + (i * 0.01)

      const lfoGain = this.audioContext!.createGain()
      lfoGain.gain.value = freq * 0.001

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1200
      filter.Q.value = 0.3

      osc.connect(gain)
      gain.connect(filter)
      filter.connect(this.meditationGain!)
      if (this.convolver) {
        filter.connect(this.convolver)
      }

      osc.start()
      lfo.start()

      this.meditationOscillators.push(osc)
      this.lfoNodes.push(lfo)
      this.filters.push(filter)
    })
  }

  stopMeditationMusic(): void {
    this.meditationOscillators.forEach(osc => {
      try { osc.stop() } catch { /* ignore */ }
    })
    this.meditationOscillators = []

    this.state.meditationEnabled = false
    this.state.currentMeditationType = null
    this.state.currentBrainwave = null
    this.updatePlayingState()
    this.notifyStateChange()
  }

  // ============ Spiritual Music ============

  async startSpiritualMusic(mode: SpiritualMode): Promise<void> {
    if (!this.audioContext || !this.spiritualGain) {
      await this.initialize()
    }
    await this.resume()

    this.stopSpiritualMusic()

    this.state.currentSpiritualMode = mode
    this.state.spiritualEnabled = true
    this.state.isPlaying = true

    switch (mode) {
      case 'om_meditation':
        this.createOmMeditation()
        break
      case 'gayatri':
        this.createGayatriEssence()
        break
      case 'mahamrityunjaya':
        this.createHealingVibrations()
        break
      case 'gita_dhyana':
        this.createGitaDhyana()
        break
      case 'krishna_flute':
        this.createKrishnaFlute()
        break
      case 'temple_bells':
        this.createTempleBells()
        break
      case 'vedic_chant':
        this.createVedicAmbiance()
        break
      case 'chakra_journey':
        this.createChakraJourney()
        break
      case 'kundalini':
        this.createKundaliniTones()
        break
    }

    this.notifyStateChange()
  }

  private createOmMeditation(): void {
    if (!this.audioContext || !this.spiritualGain) return

    const omFreqs = SACRED_FREQUENCIES.om_harmonics

    omFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.1 / (i + 1)

      // AUM pattern: A-U-M with different emphasis
      const breathLfo = this.audioContext!.createOscillator()
      breathLfo.type = 'sine'
      breathLfo.frequency.value = 0.05 // ~20 second Om cycle

      const breathGain = this.audioContext!.createGain()
      breathGain.gain.value = gain.gain.value * 0.6

      breathLfo.connect(breathGain)
      breathGain.connect(gain.gain)

      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800 + (i * 200)

      osc.connect(gain)
      gain.connect(filter)
      filter.connect(this.spiritualGain!)
      if (this.convolver) {
        filter.connect(this.convolver)
      }

      osc.start()
      breathLfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(breathLfo)
      this.filters.push(filter)
    })
  }

  private createGayatriEssence(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Gayatri essence frequencies - based on the meter and sacred vibrations
    const gayatriFreqs = [
      SACRED_FREQUENCIES.om,
      SACRED_FREQUENCIES.mi,     // Transformation
      SACRED_FREQUENCIES.sol,    // Expression
      SACRED_FREQUENCIES.la,     // Intuition
    ]

    gayatriFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = i === 0 ? 'sine' : 'triangle'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.06 / (i + 1)

      // Syllabic rhythm modulation
      const rhythmLfo = this.audioContext!.createOscillator()
      rhythmLfo.type = 'sine'
      rhythmLfo.frequency.value = 0.4 // Approximate mantra rhythm

      const rhythmGain = this.audioContext!.createGain()
      rhythmGain.gain.value = gain.gain.value * 0.3

      rhythmLfo.connect(rhythmGain)
      rhythmGain.connect(gain.gain)

      osc.connect(gain)
      gain.connect(this.spiritualGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      rhythmLfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(rhythmLfo)
    })
  }

  private createHealingVibrations(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Mahamrityunjaya - healing and protection vibrations
    const healFreqs = [
      SACRED_FREQUENCIES.ut,     // 396 Hz - Liberation
      SACRED_FREQUENCIES.mi,     // 528 Hz - Healing
      SACRED_FREQUENCIES.fa,     // 639 Hz - Connection
    ]

    healFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.08 / (i + 1)

      // Gentle pulsing
      const pulseLfo = this.audioContext!.createOscillator()
      pulseLfo.type = 'sine'
      pulseLfo.frequency.value = 0.1

      const pulseGain = this.audioContext!.createGain()
      pulseGain.gain.value = gain.gain.value * 0.4

      pulseLfo.connect(pulseGain)
      pulseGain.connect(gain.gain)

      osc.connect(gain)
      gain.connect(this.spiritualGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      pulseLfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(pulseLfo)
    })
  }

  private createGitaDhyana(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Contemplative atmosphere for Gita study
    // Uses Raga Yaman frequencies (evening contemplation)
    const yaman = RAGA_DEFINITIONS.yaman
    const scale = yaman.aroha.map(note => SWARAS[note as keyof typeof SWARAS] || SWARAS.Sa)

    // Create drone with Sa and Pa
    const droneFreqs = [SWARAS.Sa * 0.5, SWARAS.Pa * 0.5, SWARAS.Sa]

    droneFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.07 / (i + 1)

      const lfo = this.audioContext!.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.05 + (i * 0.02)

      const lfoGain = this.audioContext!.createGain()
      lfoGain.gain.value = freq * 0.002

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      osc.connect(gain)
      gain.connect(this.spiritualGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      lfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(lfo)
    })

    // Add subtle melodic hints from the scale
    const melodyFreqs = [scale[2], scale[4], scale[6]] // Ga, Pa, Ni
    melodyFreqs.forEach((freq, i) => {
      if (freq) {
        const osc = this.audioContext!.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = freq

        const gain = this.audioContext!.createGain()
        gain.gain.value = 0.02

        // Random gentle appearances
        setInterval(() => {
          if (Math.random() > 0.6) {
            gain.gain.setTargetAtTime(0.03, this.audioContext!.currentTime, 0.5)
            gain.gain.setTargetAtTime(0, this.audioContext!.currentTime + 2, 0.8)
          }
        }, 4000 + i * 2000)

        osc.connect(gain)
        gain.connect(this.spiritualGain!)

        osc.start()
        this.spiritualOscillators.push(osc)
      }
    })
  }

  private createKrishnaFlute(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Flute-like synthesis using triangle waves and filtering
    const fluteBase = SWARAS.Pa // Krishna's flute often centered around Pa

    // Main flute tone with harmonics
    for (let h = 1; h <= 4; h++) {
      const osc = this.audioContext.createOscillator()
      osc.type = h === 1 ? 'triangle' : 'sine'
      osc.frequency.value = fluteBase * h

      const gain = this.audioContext.createGain()
      gain.gain.value = 0.06 / (h * h)

      // Vibrato
      const vibrato = this.audioContext.createOscillator()
      vibrato.type = 'sine'
      vibrato.frequency.value = 5 + (h * 0.5)

      const vibratoGain = this.audioContext.createGain()
      vibratoGain.gain.value = osc.frequency.value * 0.01

      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc.frequency)

      // Breath noise
      if (h === 1) {
        const breath = this.createNoiseSource('white')
        const breathGain = this.audioContext.createGain()
        breathGain.gain.value = 0.008

        const breathFilter = this.audioContext.createBiquadFilter()
        breathFilter.type = 'bandpass'
        breathFilter.frequency.value = fluteBase * 2
        breathFilter.Q.value = 2

        breath.connect(breathGain)
        breathGain.connect(breathFilter)
        breathFilter.connect(this.spiritualGain)

        breath.start()
        this.noiseNodes.push(breath)
        this.filters.push(breathFilter)
      }

      osc.connect(gain)
      gain.connect(this.spiritualGain)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      vibrato.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(vibrato)
    }

    // Add subtle melodic phrases
    const melodyNotes = [SWARAS.Pa, SWARAS.Dha_s, SWARAS.Ni_s, SWARAS.Sa_t, SWARAS.Pa]
    let noteIndex = 0

    const melodyOsc = this.audioContext.createOscillator()
    melodyOsc.type = 'triangle'
    melodyOsc.frequency.value = melodyNotes[0]

    const melodyGain = this.audioContext.createGain()
    melodyGain.gain.value = 0

    const melodyFilter = this.audioContext.createBiquadFilter()
    melodyFilter.type = 'lowpass'
    melodyFilter.frequency.value = 2000

    melodyOsc.connect(melodyGain)
    melodyGain.connect(melodyFilter)
    melodyFilter.connect(this.spiritualGain)
    if (this.convolver) {
      melodyFilter.connect(this.convolver)
    }

    melodyOsc.start()
    this.spiritualOscillators.push(melodyOsc)
    this.filters.push(melodyFilter)

    // Play random notes occasionally
    setInterval(() => {
      if (Math.random() > 0.4) {
        noteIndex = Math.floor(Math.random() * melodyNotes.length)
        melodyOsc.frequency.setTargetAtTime(
          melodyNotes[noteIndex],
          this.audioContext!.currentTime,
          0.1
        )
        melodyGain.gain.setTargetAtTime(0.04, this.audioContext!.currentTime, 0.1)
        melodyGain.gain.setTargetAtTime(0, this.audioContext!.currentTime + 1.5, 0.5)
      }
    }, 3000)
  }

  private createTempleBells(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Temple bell simulation with multiple harmonics and decay
    const bellFreqs = [
      { freq: 400, decay: 4 },
      { freq: 800, decay: 3 },
      { freq: 1200, decay: 2 },
      { freq: 1600, decay: 1.5 },
    ]

    // Periodic bell strikes
    const strikeBell = () => {
      bellFreqs.forEach(({ freq, decay }) => {
        const osc = this.audioContext!.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq + (Math.random() * 10 - 5)

        const gain = this.audioContext!.createGain()
        gain.gain.value = 0.1 / (freq / 400)
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + decay)

        osc.connect(gain)
        gain.connect(this.spiritualGain!)
        if (this.convolver) {
          gain.connect(this.convolver)
        }

        osc.start()
        osc.stop(this.audioContext!.currentTime + decay)
      })
    }

    // Initial strike
    strikeBell()

    // Periodic strikes
    const bellInterval = setInterval(() => {
      if (this.state.spiritualEnabled && this.state.currentSpiritualMode === 'temple_bells') {
        strikeBell()
      } else {
        clearInterval(bellInterval)
      }
    }, 8000 + Math.random() * 4000)

    // Background drone
    const droneFreqs = [SWARAS.Sa * 0.5, SWARAS.Pa * 0.5]
    droneFreqs.forEach((freq) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = 0.04

      osc.connect(gain)
      gain.connect(this.spiritualGain!)

      osc.start()
      this.spiritualOscillators.push(osc)
    })
  }

  private createVedicAmbiance(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Deep, resonant drone typical of Vedic chanting
    const vedicFreqs = [
      SACRED_FREQUENCIES.om,
      SACRED_FREQUENCIES.om * 0.5,
      SACRED_FREQUENCIES.om * 1.5,
      SACRED_FREQUENCIES.om * 2,
    ]

    vedicFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = i === 0 ? 'sawtooth' : 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      gain.gain.value = i === 0 ? 0.03 : 0.05 / (i + 1)

      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 600 + (i * 100)
      filter.Q.value = 0.5

      // Subtle movement
      const lfo = this.audioContext!.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.03 + (i * 0.01)

      const lfoGain = this.audioContext!.createGain()
      lfoGain.gain.value = freq * 0.003

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      osc.connect(gain)
      gain.connect(filter)
      filter.connect(this.spiritualGain!)
      if (this.convolver) {
        filter.connect(this.convolver)
      }

      osc.start()
      lfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(lfo)
      this.filters.push(filter)
    })
  }

  private createChakraJourney(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // All seven chakra frequencies layered softly
    const chakraFreqs = [
      SACRED_FREQUENCIES.muladhara,
      SACRED_FREQUENCIES.svadhisthana,
      SACRED_FREQUENCIES.manipura,
      SACRED_FREQUENCIES.anahata,
      SACRED_FREQUENCIES.vishuddha,
      SACRED_FREQUENCIES.ajna,
      SACRED_FREQUENCIES.sahasrara,
    ]

    chakraFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq

      const gain = this.audioContext!.createGain()
      // Different volumes to create a journey effect
      gain.gain.value = 0.04 + (Math.sin(i * 0.5) * 0.02)

      // Each chakra has its own rhythm
      const rhythmLfo = this.audioContext!.createOscillator()
      rhythmLfo.type = 'sine'
      rhythmLfo.frequency.value = 0.05 + (i * 0.01)

      const rhythmGain = this.audioContext!.createGain()
      rhythmGain.gain.value = gain.gain.value * 0.5

      rhythmLfo.connect(rhythmGain)
      rhythmGain.connect(gain.gain)

      osc.connect(gain)
      gain.connect(this.spiritualGain!)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      rhythmLfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(rhythmLfo)
    })
  }

  private createKundaliniTones(): void {
    if (!this.audioContext || !this.spiritualGain) return

    // Rising energy from root to crown
    const baseFreq = SACRED_FREQUENCIES.muladhara

    // Create oscillators that sweep upward
    for (let i = 0; i < 3; i++) {
      const osc = this.audioContext.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = baseFreq * (i + 1)

      const gain = this.audioContext.createGain()
      gain.gain.value = 0.06 / (i + 1)

      // Slow upward sweep LFO
      const sweepLfo = this.audioContext.createOscillator()
      sweepLfo.type = 'sawtooth'
      sweepLfo.frequency.value = 0.01 // Very slow rise

      const sweepGain = this.audioContext.createGain()
      sweepGain.gain.value = osc.frequency.value * 0.5 // Sweep range

      sweepLfo.connect(sweepGain)
      sweepGain.connect(osc.frequency)

      osc.connect(gain)
      gain.connect(this.spiritualGain)
      if (this.convolver) {
        gain.connect(this.convolver)
      }

      osc.start()
      sweepLfo.start()

      this.spiritualOscillators.push(osc)
      this.lfoNodes.push(sweepLfo)
    }

    // Add pulsing energy
    const pulseOsc = this.audioContext.createOscillator()
    pulseOsc.type = 'sine'
    pulseOsc.frequency.value = SACRED_FREQUENCIES.schumann

    const pulseGain = this.audioContext.createGain()
    pulseGain.gain.value = 0.03

    pulseOsc.connect(pulseGain)
    pulseGain.connect(this.spiritualGain)

    pulseOsc.start()
    this.spiritualOscillators.push(pulseOsc)
  }

  stopSpiritualMusic(): void {
    this.spiritualOscillators.forEach(osc => {
      try { osc.stop() } catch { /* ignore */ }
    })
    this.spiritualOscillators = []

    this.state.spiritualEnabled = false
    this.state.currentSpiritualMode = null
    this.updatePlayingState()
    this.notifyStateChange()
  }

  // ============ Raga (Time-Based) Music ============

  async startTimeMusic(timeOfDay?: TimeOfDay): Promise<void> {
    if (!this.audioContext || !this.ragaGain) {
      await this.initialize()
    }
    await this.resume()

    this.stopTimeMusic()

    const hour = new Date().getHours()
    const actualTime = timeOfDay || this.getTimeOfDay(hour)
    const raga = this.getRagaForTime(hour)

    this.state.currentTimeMusic = actualTime
    this.state.currentRaga = raga
    this.state.timeAwareEnabled = true
    this.state.isPlaying = true

    this.createRagaMusic(raga)

    this.notifyStateChange()
  }

  private createRagaMusic(raga: RagaTime): void {
    if (!this.audioContext || !this.ragaGain) return

    const ragaDef = RAGA_DEFINITIONS[raga]

    // Create tanpura drone (Sa and Pa)
    this.createTanpuraDrone()

    // Create subtle melodic movement based on raga
    this.createRagaMelody(ragaDef)
  }

  private createTanpuraDrone(): void {
    if (!this.audioContext || !this.ragaGain) return

    const tanpuraStrings = [
      { freq: SWARAS.Pa * 0.5, offset: 0 },      // Pa (5th)
      { freq: SWARAS.Sa * 0.5, offset: 0.25 },   // Sa
      { freq: SWARAS.Sa * 0.5, offset: 0.5 },    // Sa
      { freq: SWARAS.Sa * 0.25, offset: 0.75 },  // Sa (lower octave)
    ]

    tanpuraStrings.forEach(({ freq, offset }) => {
      // Each string has multiple harmonics
      for (let h = 1; h <= 6; h++) {
        const osc = this.audioContext!.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq * h

        const gain = this.audioContext!.createGain()
        gain.gain.value = 0.03 / (h * h)

        // Jawari (buzzing) simulation
        if (h <= 2) {
          const jawariLfo = this.audioContext!.createOscillator()
          jawariLfo.type = 'sine'
          jawariLfo.frequency.value = freq * 0.01

          const jawariGain = this.audioContext!.createGain()
          jawariGain.gain.value = freq * h * 0.002

          jawariLfo.connect(jawariGain)
          jawariGain.connect(osc.frequency)

          jawariLfo.start()
          this.lfoNodes.push(jawariLfo)
        }

        // Cyclic plucking effect
        const cycleLfo = this.audioContext!.createOscillator()
        cycleLfo.type = 'sine'
        cycleLfo.frequency.value = 0.15 // ~6.5 second cycle

        const cycleGain = this.audioContext!.createGain()
        cycleGain.gain.value = gain.gain.value * 0.6

        cycleLfo.connect(cycleGain)
        cycleGain.connect(gain.gain)

        // Phase offset for each string
        const startTime = this.audioContext!.currentTime + offset * 6.5

        osc.connect(gain)
        gain.connect(this.ragaGain!)
        if (this.convolver) {
          gain.connect(this.convolver)
        }

        osc.start(startTime)
        cycleLfo.start(startTime)

        this.ragaOscillators.push(osc)
        this.lfoNodes.push(cycleLfo)
      }
    })
  }

  private createRagaMelody(ragaDef: typeof RAGA_DEFINITIONS[RagaTime]): void {
    if (!this.audioContext || !this.ragaGain) return

    // Get scale frequencies
    const arohaFreqs = ragaDef.aroha.map(note => SWARAS[note as keyof typeof SWARAS]).filter(Boolean)
    const avarohaFreqs = ragaDef.avaroha.map(note => SWARAS[note as keyof typeof SWARAS]).filter(Boolean)
    const vadiFreq = SWARAS[ragaDef.vadi as keyof typeof SWARAS]
    const samvadiFreq = SWARAS[ragaDef.samvadi as keyof typeof SWARAS]

    // Create very subtle alap-like movement
    const melodyOsc = this.audioContext.createOscillator()
    melodyOsc.type = 'sine'
    melodyOsc.frequency.value = vadiFreq || SWARAS.Sa

    const melodyGain = this.audioContext.createGain()
    melodyGain.gain.value = 0

    const melodyFilter = this.audioContext.createBiquadFilter()
    melodyFilter.type = 'lowpass'
    melodyFilter.frequency.value = 1500

    // Gamaka (ornamentation) - subtle pitch wobble
    const gamakaLfo = this.audioContext.createOscillator()
    gamakaLfo.type = 'sine'
    gamakaLfo.frequency.value = 4

    const gamakaGain = this.audioContext.createGain()
    gamakaGain.gain.value = melodyOsc.frequency.value * 0.02

    gamakaLfo.connect(gamakaGain)
    gamakaGain.connect(melodyOsc.frequency)

    melodyOsc.connect(melodyGain)
    melodyGain.connect(melodyFilter)
    melodyFilter.connect(this.ragaGain)
    if (this.convolver) {
      melodyFilter.connect(this.convolver)
    }

    melodyOsc.start()
    gamakaLfo.start()

    this.ragaOscillators.push(melodyOsc)
    this.lfoNodes.push(gamakaLfo)
    this.filters.push(melodyFilter)

    // Occasional melodic phrases
    const allNotes = [...new Set([...arohaFreqs, ...avarohaFreqs])]
    let lastNote = vadiFreq || SWARAS.Sa

    setInterval(() => {
      if (this.state.timeAwareEnabled && Math.random() > 0.5) {
        // Choose next note (prefer vadi and samvadi)
        let nextNote: number
        const rand = Math.random()
        if (rand > 0.7 && vadiFreq) {
          nextNote = vadiFreq
        } else if (rand > 0.5 && samvadiFreq) {
          nextNote = samvadiFreq
        } else {
          // Move to adjacent note
          const currentIndex = allNotes.indexOf(lastNote)
          const direction = Math.random() > 0.5 ? 1 : -1
          const newIndex = Math.max(0, Math.min(allNotes.length - 1, currentIndex + direction))
          nextNote = allNotes[newIndex]
        }

        lastNote = nextNote

        // Glide to note
        melodyOsc.frequency.setTargetAtTime(nextNote, this.audioContext!.currentTime, 0.2)

        // Fade in and out
        melodyGain.gain.setTargetAtTime(0.025, this.audioContext!.currentTime, 0.1)
        melodyGain.gain.setTargetAtTime(0, this.audioContext!.currentTime + 2, 0.5)
      }
    }, 5000 + Math.random() * 5000)
  }

  stopTimeMusic(): void {
    this.ragaOscillators.forEach(osc => {
      try { osc.stop() } catch { /* ignore */ }
    })
    this.ragaOscillators = []

    this.state.timeAwareEnabled = false
    this.state.currentTimeMusic = null
    this.state.currentRaga = null
    this.updatePlayingState()
    this.notifyStateChange()
  }

  // ============ Volume Controls ============

  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.state.masterVolume, this.audioContext!.currentTime, 0.1)
    }
    this.notifyStateChange()
  }

  setAmbientVolume(volume: number): void {
    this.state.ambientVolume = Math.max(0, Math.min(1, volume))
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.state.ambientVolume, this.audioContext!.currentTime, 0.1)
    }
    this.notifyStateChange()
  }

  setMeditationVolume(volume: number): void {
    this.state.meditationVolume = Math.max(0, Math.min(1, volume))
    if (this.meditationGain) {
      this.meditationGain.gain.setTargetAtTime(this.state.meditationVolume, this.audioContext!.currentTime, 0.1)
    }
    this.notifyStateChange()
  }

  setSpiritualVolume(volume: number): void {
    this.state.spiritualVolume = Math.max(0, Math.min(1, volume))
    if (this.spiritualGain) {
      this.spiritualGain.gain.setTargetAtTime(this.state.spiritualVolume, this.audioContext!.currentTime, 0.1)
    }
    this.notifyStateChange()
  }

  setRagaVolume(volume: number): void {
    this.state.ragaVolume = Math.max(0, Math.min(1, volume))
    if (this.ragaGain) {
      this.ragaGain.gain.setTargetAtTime(this.state.ragaVolume, this.audioContext!.currentTime, 0.1)
    }
    this.notifyStateChange()
  }

  // ============ Stop All ============

  stopAll(): void {
    this.stopAmbientMusic()
    this.stopMeditationMusic()
    this.stopSpiritualMusic()
    this.stopTimeMusic()

    // Stop all LFOs
    this.lfoNodes.forEach(lfo => {
      try { lfo.stop() } catch { /* ignore */ }
    })
    this.lfoNodes = []

    // Stop all noise nodes
    this.noiseNodes.forEach(noise => {
      try { noise.stop() } catch { /* ignore */ }
    })
    this.noiseNodes = []

    // Clear filters
    this.filters = []

    this.state.isPlaying = false
    this.notifyStateChange()
  }

  // ============ State Management ============

  private updatePlayingState(): void {
    this.state.isPlaying =
      this.state.ambientEnabled ||
      this.state.meditationEnabled ||
      this.state.spiritualEnabled ||
      this.state.timeAwareEnabled
  }

  private notifyStateChange(): void {
    this.config.onStateChange?.({ ...this.state })
  }

  getState(): MusicSystemState {
    return { ...this.state }
  }

  // ============ Cleanup ============

  dispose(): void {
    this.stopAll()

    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval)
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.masterGain = null
    this.ambientGain = null
    this.meditationGain = null
    this.spiritualGain = null
    this.ragaGain = null
    this.convolver = null

    this.state.initialized = false
  }
}

// ============ Singleton Export ============

export const musicSystem = new MusicSystem()

// ============ Constants Export ============

export {
  SWARAS,
  SACRED_FREQUENCIES,
  RAGA_DEFINITIONS,
  BRAINWAVE_CONFIGS
}
