/**
 * Meditation Audio Manager - Single Instance Controller
 *
 * Ensures only ONE audio source plays at any time.
 * Prevents all audio overlapping issues with strict singleton pattern.
 *
 * Categories: Meditation, Soul Soothing, Mantras
 */

// ============ Types ============

export type MeditationCategory = 'meditation' | 'soul_soothing' | 'mantras' | 'uploaded'

export interface MeditationTrack {
  id: string
  title: string
  artist: string
  category: MeditationCategory
  duration: number
  source: 'preset' | 'uploaded'
  soundType?: MeditationSoundType
  audioUrl?: string // For uploaded files
}

export type MeditationSoundType =
  // Meditation
  | 'deep_meditation' | 'mindfulness' | 'zen_garden' | 'theta_waves' | 'alpha_relaxation'
  | 'transcendental' | 'breathing_focus' | 'body_scan' | 'loving_kindness'
  // Soul Soothing
  | 'gentle_rain' | 'ocean_waves' | 'forest_ambience' | 'flowing_river' | 'night_crickets'
  | 'soft_piano' | 'healing_frequency' | 'sleep_delta' | 'peaceful_bells'
  // Mantras
  | 'om_chant' | 'gayatri_mantra' | 'shanti_mantra' | 'mahamrityunjaya' | 'vedic_hymns'
  | 'temple_bells' | 'krishna_flute' | 'sacred_om' | 'chakra_healing'

export interface PlayerState {
  isPlaying: boolean
  isPaused: boolean
  currentTrack: MeditationTrack | null
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  queue: MeditationTrack[]
  queueIndex: number
  isLoading: boolean
}

// ============ Preset Tracks ============

export const MEDITATION_TRACKS: MeditationTrack[] = [
  // === MEDITATION ===
  { id: 'med-deep', title: 'Deep Meditation Journey', artist: 'MindVibe', category: 'meditation', duration: 600, source: 'preset', soundType: 'deep_meditation' },
  { id: 'med-mindful', title: 'Mindfulness Practice', artist: 'MindVibe', category: 'meditation', duration: 480, source: 'preset', soundType: 'mindfulness' },
  { id: 'med-zen', title: 'Zen Garden Serenity', artist: 'MindVibe', category: 'meditation', duration: 540, source: 'preset', soundType: 'zen_garden' },
  { id: 'med-theta', title: 'Theta Brain Waves', artist: 'MindVibe', category: 'meditation', duration: 720, source: 'preset', soundType: 'theta_waves' },
  { id: 'med-alpha', title: 'Alpha Relaxation', artist: 'MindVibe', category: 'meditation', duration: 600, source: 'preset', soundType: 'alpha_relaxation' },
  { id: 'med-trans', title: 'Transcendental Peace', artist: 'MindVibe', category: 'meditation', duration: 900, source: 'preset', soundType: 'transcendental' },
  { id: 'med-breath', title: 'Breathing Focus', artist: 'MindVibe', category: 'meditation', duration: 480, source: 'preset', soundType: 'breathing_focus' },
  { id: 'med-body', title: 'Body Scan Relaxation', artist: 'MindVibe', category: 'meditation', duration: 600, source: 'preset', soundType: 'body_scan' },
  { id: 'med-loving', title: 'Loving Kindness', artist: 'MindVibe', category: 'meditation', duration: 540, source: 'preset', soundType: 'loving_kindness' },

  // === SOUL SOOTHING ===
  { id: 'soul-rain', title: 'Gentle Rain Drops', artist: 'Nature Sounds', category: 'soul_soothing', duration: 600, source: 'preset', soundType: 'gentle_rain' },
  { id: 'soul-ocean', title: 'Ocean Waves Calm', artist: 'Nature Sounds', category: 'soul_soothing', duration: 600, source: 'preset', soundType: 'ocean_waves' },
  { id: 'soul-forest', title: 'Forest Morning Peace', artist: 'Nature Sounds', category: 'soul_soothing', duration: 600, source: 'preset', soundType: 'forest_ambience' },
  { id: 'soul-river', title: 'Flowing River Serenity', artist: 'Nature Sounds', category: 'soul_soothing', duration: 600, source: 'preset', soundType: 'flowing_river' },
  { id: 'soul-night', title: 'Night Crickets Lullaby', artist: 'Nature Sounds', category: 'soul_soothing', duration: 600, source: 'preset', soundType: 'night_crickets' },
  { id: 'soul-piano', title: 'Soft Piano Dreams', artist: 'MindVibe', category: 'soul_soothing', duration: 540, source: 'preset', soundType: 'soft_piano' },
  { id: 'soul-healing', title: '528Hz Healing Frequency', artist: 'MindVibe', category: 'soul_soothing', duration: 720, source: 'preset', soundType: 'healing_frequency' },
  { id: 'soul-sleep', title: 'Deep Sleep Delta Waves', artist: 'MindVibe', category: 'soul_soothing', duration: 900, source: 'preset', soundType: 'sleep_delta' },
  { id: 'soul-bells', title: 'Peaceful Bell Tones', artist: 'MindVibe', category: 'soul_soothing', duration: 480, source: 'preset', soundType: 'peaceful_bells' },

  // === MANTRAS ===
  { id: 'mantra-om', title: 'Om Chanting', artist: 'Sacred Sounds', category: 'mantras', duration: 600, source: 'preset', soundType: 'om_chant' },
  { id: 'mantra-gayatri', title: 'Gayatri Mantra Vibrations', artist: 'Sacred Sounds', category: 'mantras', duration: 720, source: 'preset', soundType: 'gayatri_mantra' },
  { id: 'mantra-shanti', title: 'Om Shanti Shanti', artist: 'Sacred Sounds', category: 'mantras', duration: 540, source: 'preset', soundType: 'shanti_mantra' },
  { id: 'mantra-mrityunjaya', title: 'Mahamrityunjaya Mantra', artist: 'Sacred Sounds', category: 'mantras', duration: 660, source: 'preset', soundType: 'mahamrityunjaya' },
  { id: 'mantra-vedic', title: 'Vedic Hymns Peace', artist: 'Sacred Sounds', category: 'mantras', duration: 600, source: 'preset', soundType: 'vedic_hymns' },
  { id: 'mantra-bells', title: 'Temple Bells Morning', artist: 'Sacred Sounds', category: 'mantras', duration: 480, source: 'preset', soundType: 'temple_bells' },
  { id: 'mantra-flute', title: 'Divine Krishna Flute', artist: 'Sacred Sounds', category: 'mantras', duration: 720, source: 'preset', soundType: 'krishna_flute' },
  { id: 'mantra-sacred', title: 'Sacred Om Meditation', artist: 'Sacred Sounds', category: 'mantras', duration: 600, source: 'preset', soundType: 'sacred_om' },
  { id: 'mantra-chakra', title: 'Chakra Healing Tones', artist: 'Sacred Sounds', category: 'mantras', duration: 840, source: 'preset', soundType: 'chakra_healing' },
]

// ============ Audio Synthesizer ============

class MeditationSynthesizer {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeOscillators: OscillatorNode[] = []
  private activeGains: GainNode[] = []
  private activeNodes: AudioNode[] = []
  private noiseSources: AudioBufferSourceNode[] = []
  private intervals: ReturnType<typeof setInterval>[] = []
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private isActive: boolean = false

  async initialize(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') return

    try {
      this.ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.connect(this.ctx.destination)
      this.masterGain.gain.value = 0.7

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }
    } catch (e) {
      console.error('Failed to initialize audio context:', e)
    }
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  setVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.1)
    }
  }

  stopAll(): void {
    this.isActive = false

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []

    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts = []

    // Stop all oscillators
    this.activeOscillators.forEach(osc => {
      try { osc.stop() } catch {}
      try { osc.disconnect() } catch {}
    })
    this.activeOscillators = []

    // Stop all noise sources
    this.noiseSources.forEach(source => {
      try { source.stop() } catch {}
      try { source.disconnect() } catch {}
    })
    this.noiseSources = []

    // Disconnect all gain nodes
    this.activeGains.forEach(gain => {
      try { gain.disconnect() } catch {}
    })
    this.activeGains = []

    // Disconnect other nodes
    this.activeNodes.forEach(node => {
      try { node.disconnect() } catch {}
    })
    this.activeNodes = []
  }

  isPlayingAudio(): boolean {
    return this.isActive
  }

  private addInterval(interval: ReturnType<typeof setInterval>): void {
    this.intervals.push(interval)
  }

  private addTimeout(timeout: ReturnType<typeof setTimeout>): void {
    this.timeouts.push(timeout)
  }

  private createNoise(type: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
    const bufferSize = this.ctx!.sampleRate * 2
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate)
    const data = buffer.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1

      if (type === 'white') {
        data[i] = white * 0.5
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      } else {
        data[i] = (b0 = (b0 + (0.02 * white)) / 1.02) * 3.5
      }
    }

    const source = this.ctx!.createBufferSource()
    source.buffer = buffer
    source.loop = true
    this.noiseSources.push(source)
    return source
  }

  private createOscillator(freq: number, type: OscillatorType = 'sine'): OscillatorNode {
    const osc = this.ctx!.createOscillator()
    osc.frequency.value = freq
    osc.type = type
    this.activeOscillators.push(osc)
    return osc
  }

  private createGain(value: number = 0.1): GainNode {
    const gain = this.ctx!.createGain()
    gain.gain.value = value
    this.activeGains.push(gain)
    return gain
  }

  async playSoundType(soundType: MeditationSoundType): Promise<void> {
    await this.initialize()
    this.stopAll()
    this.isActive = true

    switch (soundType) {
      // Meditation
      case 'deep_meditation': this.playDeepMeditation(); break
      case 'mindfulness': this.playMindfulness(); break
      case 'zen_garden': this.playZenGarden(); break
      case 'theta_waves': this.playThetaWaves(); break
      case 'alpha_relaxation': this.playAlphaRelaxation(); break
      case 'transcendental': this.playTranscendental(); break
      case 'breathing_focus': this.playBreathingFocus(); break
      case 'body_scan': this.playBodyScan(); break
      case 'loving_kindness': this.playLovingKindness(); break

      // Soul Soothing
      case 'gentle_rain': this.playGentleRain(); break
      case 'ocean_waves': this.playOceanWaves(); break
      case 'forest_ambience': this.playForestAmbience(); break
      case 'flowing_river': this.playFlowingRiver(); break
      case 'night_crickets': this.playNightCrickets(); break
      case 'soft_piano': this.playSoftPiano(); break
      case 'healing_frequency': this.playHealingFrequency(); break
      case 'sleep_delta': this.playSleepDelta(); break
      case 'peaceful_bells': this.playPeacefulBells(); break

      // Mantras
      case 'om_chant': this.playOmChant(); break
      case 'gayatri_mantra': this.playGayatriMantra(); break
      case 'shanti_mantra': this.playShantiMantra(); break
      case 'mahamrityunjaya': this.playMahamrityunjaya(); break
      case 'vedic_hymns': this.playVedicHymns(); break
      case 'temple_bells': this.playTempleBells(); break
      case 'krishna_flute': this.playKrishnaFlute(); break
      case 'sacred_om': this.playSacredOm(); break
      case 'chakra_healing': this.playChakraHealing(); break
    }
  }

  // ============ MEDITATION SOUNDS ============

  private playDeepMeditation(): void {
    // Deep theta binaural with soft pads
    const baseFreq = 180
    const beatFreq = 6 // 6 Hz theta

    const oscL = this.createOscillator(baseFreq)
    const oscR = this.createOscillator(baseFreq + beatFreq)

    const gainL = this.createGain(0.08)
    const gainR = this.createGain(0.08)

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -0.8
    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 0.8
    this.activeNodes.push(panL, panR)

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    // Add ambient pad
    const padNotes = [130.81, 196, 261.63]
    padNotes.forEach((freq, i) => {
      const osc = this.createOscillator(freq)
      const gain = this.createGain(0.03)

      const lfo = this.createOscillator(0.1 + i * 0.05)
      lfo.type = 'sine'
      const lfoGain = this.createGain(0.01)
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
    })
  }

  private playMindfulness(): void {
    // Gentle alpha waves with soft bells
    const baseFreq = 200
    const beatFreq = 10 // 10 Hz alpha

    const oscL = this.createOscillator(baseFreq)
    const oscR = this.createOscillator(baseFreq + beatFreq)

    const gainL = this.createGain(0.06)
    const gainR = this.createGain(0.06)

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -1
    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 1
    this.activeNodes.push(panL, panR)

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    // Occasional soft bells
    const playBell = () => {
      if (!this.isActive) return
      const bellFreq = [523.25, 659.25, 783.99][Math.floor(Math.random() * 3)]
      const bell = this.ctx!.createOscillator()
      bell.frequency.value = bellFreq
      bell.type = 'sine'

      const bellGain = this.ctx!.createGain()
      bellGain.gain.setValueAtTime(0.06, this.ctx!.currentTime)
      bellGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 5)

      bell.connect(bellGain)
      bellGain.connect(this.masterGain!)
      bell.start()
      bell.stop(this.ctx!.currentTime + 5)
    }

    playBell()
    this.addInterval(setInterval(playBell, 8000))
  }

  private playZenGarden(): void {
    // Wind through bamboo with occasional water drops
    const windNoise = this.createNoise('pink')
    const windFilter = this.ctx!.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 500
    windFilter.Q.value = 0.5
    this.activeNodes.push(windFilter)

    const windGain = this.createGain(0.12)

    // Wind modulation
    const lfo = this.createOscillator(0.15)
    const lfoGain = this.createGain(0.04)
    lfo.connect(lfoGain)
    lfoGain.connect(windGain.gain)
    lfo.start()

    windNoise.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(this.masterGain!)
    windNoise.start()

    // Water drops
    const playDrop = () => {
      if (!this.isActive) return
      if (Math.random() > 0.4) {
        const dropFreq = 800 + Math.random() * 400
        const drop = this.ctx!.createOscillator()
        drop.frequency.value = dropFreq
        drop.type = 'sine'

        const dropGain = this.ctx!.createGain()
        dropGain.gain.setValueAtTime(0.08, this.ctx!.currentTime)
        dropGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.5)

        drop.connect(dropGain)
        dropGain.connect(this.masterGain!)
        drop.start()
        drop.stop(this.ctx!.currentTime + 0.5)
      }
    }

    this.addInterval(setInterval(playDrop, 3000))
  }

  private playThetaWaves(): void {
    // Pure theta binaural (4-8 Hz)
    const baseFreq = 150
    const beatFreq = 5.5 // Deep theta

    const oscL = this.createOscillator(baseFreq)
    const oscR = this.createOscillator(baseFreq + beatFreq)

    const gainL = this.createGain(0.1)
    const gainR = this.createGain(0.1)

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -1
    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 1
    this.activeNodes.push(panL, panR)

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    // Soft ambient noise
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200
    this.activeNodes.push(filter)

    const noiseGain = this.createGain(0.06)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()
  }

  private playAlphaRelaxation(): void {
    // Alpha waves (8-12 Hz) with soft pads
    const baseFreq = 200
    const beatFreq = 10

    const oscL = this.createOscillator(baseFreq)
    const oscR = this.createOscillator(baseFreq + beatFreq)

    const gainL = this.createGain(0.08)
    const gainR = this.createGain(0.08)

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -0.9
    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 0.9
    this.activeNodes.push(panL, panR)

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    // Warm pad
    const padFreqs = [220, 277.18, 329.63]
    padFreqs.forEach(freq => {
      const osc = this.createOscillator(freq)
      osc.type = 'sine'
      const gain = this.createGain(0.025)
      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
    })
  }

  private playTranscendental(): void {
    // Deep meditation with Om base
    const omFreq = 136.1
    const osc = this.createOscillator(omFreq)

    const gain = this.createGain(0.12)

    // Breathing modulation
    const lfo = this.createOscillator(0.1)
    const lfoGain = this.createGain(0.04)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()

    // Harmonics
    const transcendHarmonics = [2, 3, 4]
    transcendHarmonics.forEach(harmonic => {
      const h = this.createOscillator(omFreq * harmonic)
      const hGain = this.createGain(0.04 / harmonic)
      h.connect(hGain)
      hGain.connect(this.masterGain!)
      h.start()
    })

    // Soft ambient
    const noise = this.createNoise('pink')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300
    this.activeNodes.push(filter)

    const noiseGain = this.createGain(0.02)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()
  }

  private playBreathingFocus(): void {
    // Rhythmic breathing guidance with soft tones
    const breathCycle = 8000 // 8 second cycle

    const playBreath = () => {
      if (!this.isActive) return

      // Inhale tone (rising)
      const inhale = this.ctx!.createOscillator()
      inhale.frequency.setValueAtTime(220, this.ctx!.currentTime)
      inhale.frequency.linearRampToValueAtTime(330, this.ctx!.currentTime + 3)
      inhale.type = 'sine'

      const inhaleGain = this.ctx!.createGain()
      inhaleGain.gain.setValueAtTime(0, this.ctx!.currentTime)
      inhaleGain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 1.5)
      inhaleGain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 3)
      inhaleGain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 4)

      inhale.connect(inhaleGain)
      inhaleGain.connect(this.masterGain!)
      inhale.start()
      inhale.stop(this.ctx!.currentTime + 4)

      // Exhale tone (falling) - delayed
      this.addTimeout(setTimeout(() => {
        if (!this.isActive) return
        const exhale = this.ctx!.createOscillator()
        exhale.frequency.setValueAtTime(330, this.ctx!.currentTime)
        exhale.frequency.linearRampToValueAtTime(220, this.ctx!.currentTime + 4)
        exhale.type = 'sine'

        const exhaleGain = this.ctx!.createGain()
        exhaleGain.gain.setValueAtTime(0.08, this.ctx!.currentTime)
        exhaleGain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 2)
        exhaleGain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 4)

        exhale.connect(exhaleGain)
        exhaleGain.connect(this.masterGain!)
        exhale.start()
        exhale.stop(this.ctx!.currentTime + 4)
      }, 4000))
    }

    playBreath()
    this.addInterval(setInterval(playBreath, breathCycle))

    // Background drone
    const drone = this.createOscillator(110)
    const droneGain = this.createGain(0.04)
    drone.connect(droneGain)
    droneGain.connect(this.masterGain!)
    drone.start()
  }

  private playBodyScan(): void {
    // Slow moving frequency for body awareness
    const baseFreq = 80

    const osc = this.createOscillator(baseFreq)
    const gain = this.createGain(0.1)

    // Very slow frequency sweep
    const lfo = this.createOscillator(0.02) // Very slow
    const lfoGain = this.createGain(30) // Frequency deviation
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    lfo.start()

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()

    // Soft ambient
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 150
    this.activeNodes.push(filter)

    const noiseGain = this.createGain(0.08)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()
  }

  private playLovingKindness(): void {
    // Warm, heart-centered tones
    const heartFreq = 341.3 // F4 - Heart chakra

    const osc = this.createOscillator(heartFreq)
    osc.type = 'sine'
    const gain = this.createGain(0.08)

    // Gentle pulsing
    const lfo = this.createOscillator(0.5)
    const lfoGain = this.createGain(0.02)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()

    // Warm pad chord
    const chordFreqs = [261.63, 329.63, 392]
    chordFreqs.forEach(freq => {
      const padOsc = this.createOscillator(freq)
      const padGain = this.createGain(0.03)
      padOsc.connect(padGain)
      padGain.connect(this.masterGain!)
      padOsc.start()
    })
  }

  // ============ SOUL SOOTHING SOUNDS ============

  private playGentleRain(): void {
    const noise = this.createNoise('pink')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 4000
    filter.Q.value = 0.5
    this.activeNodes.push(filter)

    const gain = this.createGain(0.35)

    // Rain variation
    const lfo = this.createOscillator(0.2)
    const lfoGain = this.createGain(0.08)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    noise.start()
  }

  private playOceanWaves(): void {
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    this.activeNodes.push(filter)

    const gain = this.createGain(0.4)

    // Wave modulation
    const lfo = this.createOscillator(0.08)
    const lfoGain = this.createGain(300)
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    noise.start()
  }

  private playForestAmbience(): void {
    // Wind
    const windNoise = this.createNoise('pink')
    const windFilter = this.ctx!.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 600
    windFilter.Q.value = 0.8
    this.activeNodes.push(windFilter)

    const windGain = this.createGain(0.12)
    windNoise.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(this.masterGain!)
    windNoise.start()

    // Bird chirps
    const birdFreqs = [2000, 2400, 2800]
    birdFreqs.forEach((freq, i) => {
      this.addInterval(setInterval(() => {
        if (!this.isActive) return
        if (Math.random() > 0.5) {
          const bird = this.ctx!.createOscillator()
          bird.frequency.value = freq + Math.random() * 200
          bird.type = 'sine'

          const birdGain = this.ctx!.createGain()
          birdGain.gain.setValueAtTime(0.03, this.ctx!.currentTime)
          birdGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.15)

          bird.connect(birdGain)
          birdGain.connect(this.masterGain!)
          bird.start()
          bird.stop(this.ctx!.currentTime + 0.15)
        }
      }, 2000 + i * 1500))
    })
  }

  private playFlowingRiver(): void {
    const noise = this.createNoise('white')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.3
    this.activeNodes.push(filter)

    const gain = this.createGain(0.25)

    // Flowing variation
    const lfo = this.createOscillator(0.3)
    const lfoGain = this.createGain(400)
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    noise.start()
  }

  private playNightCrickets(): void {
    // Background night ambience
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    this.activeNodes.push(filter)

    const noiseGain = this.createGain(0.08)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    // Cricket chirps
    const cricketFreqs = [4000, 4200, 4400, 4600]
    cricketFreqs.forEach((freq, i) => {
      this.addInterval(setInterval(() => {
        if (!this.isActive) return
        if (Math.random() > 0.3) {
          // Rapid chirp pattern
          for (let j = 0; j < 4; j++) {
            this.addTimeout(setTimeout(() => {
              if (!this.isActive) return
              const cricket = this.ctx!.createOscillator()
              cricket.frequency.value = freq
              cricket.type = 'square'

              const cricketGain = this.ctx!.createGain()
              cricketGain.gain.setValueAtTime(0.01, this.ctx!.currentTime)
              cricketGain.gain.setValueAtTime(0, this.ctx!.currentTime + 0.03)

              cricket.connect(cricketGain)
              cricketGain.connect(this.masterGain!)
              cricket.start()
              cricket.stop(this.ctx!.currentTime + 0.03)
            }, j * 60))
          }
        }
      }, 800 + i * 200))
    })
  }

  private playSoftPiano(): void {
    const chords = [
      [261.63, 329.63, 392],      // C major
      [220, 261.63, 329.63],      // Am
      [349.23, 440, 523.25],      // F major
      [392, 493.88, 587.33],      // G major
    ]

    let chordIndex = 0

    const playChord = () => {
      if (!this.isActive) return

      const chord = chords[chordIndex]
      chord.forEach((freq, i) => {
        this.addTimeout(setTimeout(() => {
          if (!this.isActive) return

          const osc = this.ctx!.createOscillator()
          osc.frequency.value = freq
          osc.type = 'triangle'

          const gain = this.ctx!.createGain()
          gain.gain.setValueAtTime(0, this.ctx!.currentTime)
          gain.gain.linearRampToValueAtTime(0.06, this.ctx!.currentTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

          osc.connect(gain)
          gain.connect(this.masterGain!)
          osc.start()
          osc.stop(this.ctx!.currentTime + 4)
        }, i * 150))
      })

      chordIndex = (chordIndex + 1) % chords.length
    }

    playChord()
    this.addInterval(setInterval(playChord, 4000))

    // Ambient pad
    const padOsc = this.createOscillator(130.81)
    const padGain = this.createGain(0.03)
    padOsc.connect(padGain)
    padGain.connect(this.masterGain!)
    padOsc.start()
  }

  private playHealingFrequency(): void {
    // 528 Hz - Love Frequency
    const osc1 = this.createOscillator(528)
    const osc2 = this.createOscillator(528.5) // Slight detune for beating

    const gain1 = this.createGain(0.12)
    const gain2 = this.createGain(0.12)

    osc1.connect(gain1)
    osc2.connect(gain2)
    gain1.connect(this.masterGain!)
    gain2.connect(this.masterGain!)

    osc1.start()
    osc2.start()

    // Additional harmonics
    const healingHarmonics = [2, 3]
    healingHarmonics.forEach(h => {
      const harmOsc = this.createOscillator(528 * h)
      const harmGain = this.createGain(0.04 / h)
      harmOsc.connect(harmGain)
      harmGain.connect(this.masterGain!)
      harmOsc.start()
    })
  }

  private playSleepDelta(): void {
    // Delta waves (1-4 Hz)
    const baseFreq = 100
    const beatFreq = 2.5

    const oscL = this.createOscillator(baseFreq)
    const oscR = this.createOscillator(baseFreq + beatFreq)

    const gainL = this.createGain(0.06)
    const gainR = this.createGain(0.06)

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -0.8
    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 0.8
    this.activeNodes.push(panL, panR)

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    // Very soft noise
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 150
    this.activeNodes.push(filter)

    const noiseGain = this.createGain(0.06)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()
  }

  private playPeacefulBells(): void {
    const bellFreqs = [523.25, 659.25, 783.99, 1046.5]

    const playBell = () => {
      if (!this.isActive) return

      const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)]

      const bell = this.ctx!.createOscillator()
      bell.frequency.value = freq
      bell.type = 'sine'

      const bellGain = this.ctx!.createGain()
      bellGain.gain.setValueAtTime(0.1, this.ctx!.currentTime)
      bellGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 6)

      // Harmonic
      const bell2 = this.ctx!.createOscillator()
      bell2.frequency.value = freq * 2.4
      bell2.type = 'sine'

      const bell2Gain = this.ctx!.createGain()
      bell2Gain.gain.setValueAtTime(0.04, this.ctx!.currentTime)
      bell2Gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

      bell.connect(bellGain)
      bell2.connect(bell2Gain)
      bellGain.connect(this.masterGain!)
      bell2Gain.connect(this.masterGain!)

      bell.start()
      bell2.start()
      bell.stop(this.ctx!.currentTime + 6)
      bell2.stop(this.ctx!.currentTime + 4)
    }

    playBell()
    this.addInterval(setInterval(playBell, 6000))

    // Soft drone
    const drone = this.createOscillator(261.63)
    const droneGain = this.createGain(0.025)
    drone.connect(droneGain)
    droneGain.connect(this.masterGain!)
    drone.start()
  }

  // ============ MANTRA SOUNDS ============

  private playOmChant(): void {
    const omFreq = 136.1 // Cosmic Om frequency

    const osc = this.createOscillator(omFreq)
    const gain = this.createGain(0.15)

    // Breathing modulation
    const lfo = this.createOscillator(0.1)
    const lfoGain = this.createGain(0.05)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()

    // Rich harmonics
    const omHarmonics = [2, 3, 4, 5]
    omHarmonics.forEach(h => {
      const harmOsc = this.createOscillator(omFreq * h)
      const harmGain = this.createGain(0.06 / h)
      harmOsc.connect(harmGain)
      harmGain.connect(this.masterGain!)
      harmOsc.start()
    })
  }

  private playGayatriMantra(): void {
    // Gayatri frequencies based on sacred ratios
    const baseFreq = 110

    const playMantraNote = () => {
      if (!this.isActive) return

      const notes = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8]
      notes.forEach((ratio, i) => {
        this.addTimeout(setTimeout(() => {
          if (!this.isActive) return

          const freq = baseFreq * ratio
          const osc = this.ctx!.createOscillator()
          osc.frequency.value = freq
          osc.type = 'sine'

          const oscGain = this.ctx!.createGain()
          oscGain.gain.setValueAtTime(0, this.ctx!.currentTime)
          oscGain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 0.2)
          oscGain.gain.setValueAtTime(0.08, this.ctx!.currentTime + 1.5)
          oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 2)

          osc.connect(oscGain)
          oscGain.connect(this.masterGain!)
          osc.start()
          osc.stop(this.ctx!.currentTime + 2)
        }, i * 300))
      })
    }

    playMantraNote()
    this.addInterval(setInterval(playMantraNote, 3000))

    // Tanpura drone
    const droneOsc = this.createOscillator(baseFreq)
    droneOsc.type = 'sawtooth'
    const droneFilter = this.ctx!.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 600
    this.activeNodes.push(droneFilter)

    const droneGain = this.createGain(0.04)
    droneOsc.connect(droneFilter)
    droneFilter.connect(droneGain)
    droneGain.connect(this.masterGain!)
    droneOsc.start()
  }

  private playShantiMantra(): void {
    // Om Shanti - peaceful layered tones
    const shantiFreqs = [261.63, 329.63, 392, 523.25]

    shantiFreqs.forEach((freq, i) => {
      const osc = this.createOscillator(freq)
      osc.type = 'sine'
      const gain = this.createGain(0.05)

      // Slow phasing
      const lfo = this.createOscillator(0.1 + i * 0.03)
      const lfoGain = this.createGain(0.02)
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
    })

    // Om pulse
    const playOm = () => {
      if (!this.isActive) return

      const om = this.ctx!.createOscillator()
      om.frequency.value = 136.1
      om.type = 'sine'

      const omGain = this.ctx!.createGain()
      omGain.gain.setValueAtTime(0, this.ctx!.currentTime)
      omGain.gain.linearRampToValueAtTime(0.1, this.ctx!.currentTime + 2)
      omGain.gain.linearRampToValueAtTime(0.1, this.ctx!.currentTime + 4)
      omGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 6)

      om.connect(omGain)
      omGain.connect(this.masterGain!)
      om.start()
      om.stop(this.ctx!.currentTime + 6)
    }

    playOm()
    this.addInterval(setInterval(playOm, 8000))
  }

  private playMahamrityunjaya(): void {
    // Powerful healing mantra vibrations
    const baseFreq = 110

    // Deep resonant drone
    const drone = this.createOscillator(baseFreq)
    drone.type = 'sawtooth'

    const droneFilter = this.ctx!.createBiquadFilter()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 500
    this.activeNodes.push(droneFilter)

    const droneGain = this.createGain(0.08)

    drone.connect(droneFilter)
    droneFilter.connect(droneGain)
    droneGain.connect(this.masterGain!)
    drone.start()

    // Harmonic series
    const mahamrityunjayaHarmonics = [2, 3, 4, 5, 6]
    mahamrityunjayaHarmonics.forEach(h => {
      const harmOsc = this.createOscillator(baseFreq * h)
      const harmGain = this.createGain(0.03 / h)
      harmOsc.connect(harmGain)
      harmGain.connect(this.masterGain!)
      harmOsc.start()
    })

    // Rhythmic pulse
    const playPulse = () => {
      if (!this.isActive) return

      const pulse = this.ctx!.createOscillator()
      pulse.frequency.value = baseFreq * 2
      pulse.type = 'sine'

      const pulseGain = this.ctx!.createGain()
      pulseGain.gain.setValueAtTime(0.06, this.ctx!.currentTime)
      pulseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.5)

      pulse.connect(pulseGain)
      pulseGain.connect(this.masterGain!)
      pulse.start()
      pulse.stop(this.ctx!.currentTime + 0.5)
    }

    playPulse()
    this.addInterval(setInterval(playPulse, 2000))
  }

  private playVedicHymns(): void {
    // Deep Vedic drone with harmonics
    const baseFreq = 130.81

    const drone = this.createOscillator(baseFreq)
    drone.type = 'sawtooth'

    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500
    this.activeNodes.push(filter)

    const gain = this.createGain(0.08)

    drone.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    drone.start()

    // Overtones
    const vedicHarmonics = [2, 3, 4, 5]
    vedicHarmonics.forEach(h => {
      const harmOsc = this.createOscillator(baseFreq * h)
      const harmGain = this.createGain(0.03 / h)
      harmOsc.connect(harmGain)
      harmGain.connect(this.masterGain!)
      harmOsc.start()
    })
  }

  private playTempleBells(): void {
    const bellFreqs = [523.25, 659.25, 783.99, 1046.5]

    const ringBell = () => {
      if (!this.isActive) return

      const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)]

      const bell = this.ctx!.createOscillator()
      bell.frequency.value = freq
      bell.type = 'sine'

      const bellGain = this.ctx!.createGain()
      bellGain.gain.setValueAtTime(0.12, this.ctx!.currentTime)
      bellGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 6)

      // Rich harmonics
      const bell2 = this.ctx!.createOscillator()
      bell2.frequency.value = freq * 2.4
      bell2.type = 'sine'

      const bell2Gain = this.ctx!.createGain()
      bell2Gain.gain.setValueAtTime(0.05, this.ctx!.currentTime)
      bell2Gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

      bell.connect(bellGain)
      bell2.connect(bell2Gain)
      bellGain.connect(this.masterGain!)
      bell2Gain.connect(this.masterGain!)

      bell.start()
      bell2.start()
      bell.stop(this.ctx!.currentTime + 6)
      bell2.stop(this.ctx!.currentTime + 4)
    }

    ringBell()
    this.addInterval(setInterval(ringBell, 5000))

    // Temple ambience drone
    const drone = this.createOscillator(261.63)
    const droneGain = this.createGain(0.03)
    drone.connect(droneGain)
    droneGain.connect(this.masterGain!)
    drone.start()
  }

  private playKrishnaFlute(): void {
    // Raga Yaman style flute
    const ragaNotes = [
      261.63, 293.66, 329.63, 369.99, 392, 440, 493.88, 523.25
    ]

    const phrases = [
      [4, 5, 6, 7, 6, 5, 4],
      [7, 6, 5, 4, 3, 4, 5],
      [2, 3, 4, 5, 4, 3, 2, 0],
    ]

    let phraseIndex = 0

    const playPhrase = () => {
      if (!this.isActive) return

      const phrase = phrases[phraseIndex]
      phrase.forEach((noteIdx, i) => {
        this.addTimeout(setTimeout(() => {
          if (!this.isActive) return

          const freq = ragaNotes[noteIdx]
          const osc = this.ctx!.createOscillator()
          osc.frequency.value = freq
          osc.type = 'sine'

          // Vibrato
          const vibrato = this.ctx!.createOscillator()
          vibrato.frequency.value = 5.5
          vibrato.type = 'sine'
          const vibratoGain = this.ctx!.createGain()
          vibratoGain.gain.value = 4
          vibrato.connect(vibratoGain)
          vibratoGain.connect(osc.frequency)
          vibrato.start()

          const fluteGain = this.ctx!.createGain()
          fluteGain.gain.setValueAtTime(0, this.ctx!.currentTime)
          fluteGain.gain.linearRampToValueAtTime(0.1, this.ctx!.currentTime + 0.15)
          fluteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 1.5)

          osc.connect(fluteGain)
          fluteGain.connect(this.masterGain!)
          osc.start()
          osc.stop(this.ctx!.currentTime + 1.5)
          vibrato.stop(this.ctx!.currentTime + 1.5)
        }, i * 600))
      })

      phraseIndex = (phraseIndex + 1) % phrases.length
    }

    playPhrase()
    this.addInterval(setInterval(playPhrase, 6000))

    // Tanpura drone
    const droneFreqs = [130.81, 196, 261.63]
    droneFreqs.forEach(freq => {
      const drone = this.createOscillator(freq)
      drone.type = 'sawtooth'

      const droneFilter = this.ctx!.createBiquadFilter()
      droneFilter.type = 'lowpass'
      droneFilter.frequency.value = 600
      this.activeNodes.push(droneFilter)

      const droneGain = this.createGain(0.025)
      drone.connect(droneFilter)
      droneFilter.connect(droneGain)
      droneGain.connect(this.masterGain!)
      drone.start()
    })
  }

  private playSacredOm(): void {
    const omFreq = 136.1

    // Primary Om
    const om = this.createOscillator(omFreq)
    const omGain = this.createGain(0.18)

    // Breathing modulation
    const breathLfo = this.createOscillator(0.12)
    const breathGain = this.createGain(0.06)
    breathLfo.connect(breathGain)
    breathGain.connect(omGain.gain)
    breathLfo.start()

    om.connect(omGain)
    omGain.connect(this.masterGain!)
    om.start()

    // Harmonics for richness
    const sacredOmHarmonics = [2, 3, 4, 5, 6]
    sacredOmHarmonics.forEach(h => {
      const harmOsc = this.createOscillator(omFreq * h)
      const harmGain = this.createGain(0.05 / h)
      harmOsc.connect(harmGain)
      harmGain.connect(this.masterGain!)
      harmOsc.start()
    })
  }

  private playChakraHealing(): void {
    // Seven chakra frequencies
    const chakraFreqs = [
      { freq: 256, name: 'Root' },
      { freq: 288, name: 'Sacral' },
      { freq: 320, name: 'Solar Plexus' },
      { freq: 341.3, name: 'Heart' },
      { freq: 384, name: 'Throat' },
      { freq: 426.7, name: 'Third Eye' },
      { freq: 480, name: 'Crown' }
    ]

    let currentChakra = 0

    const playChakra = () => {
      if (!this.isActive) return

      // Fade out all current oscillators gradually
      this.activeOscillators.forEach(osc => {
        try { osc.stop(this.ctx!.currentTime + 2) } catch {}
      })
      this.activeOscillators = []

      const chakra = chakraFreqs[currentChakra]

      const osc = this.createOscillator(chakra.freq)
      const gain = this.createGain(0)
      gain.gain.setTargetAtTime(0.12, this.ctx!.currentTime, 1)

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      currentChakra = (currentChakra + 1) % chakraFreqs.length
    }

    playChakra()
    this.addInterval(setInterval(playChakra, 25000)) // Each chakra for 25 seconds
  }
}

// ============ Main Audio Manager ============

const UPLOADED_TRACKS_KEY = 'mindvibe_meditation_uploads'

class MeditationAudioManager {
  private static instance: MeditationAudioManager | null = null
  private synthesizer: MeditationSynthesizer
  private audioElement: HTMLAudioElement | null = null
  private uploadedTracks: MeditationTrack[] = []
  private stateListeners: Set<(state: PlayerState) => void> = new Set()

  private _state: PlayerState = {
    isPlaying: false,
    isPaused: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    queue: [],
    queueIndex: 0,
    isLoading: false
  }

  private startTime: number = 0
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null
  private previousVolume: number = 0.7

  private constructor() {
    this.synthesizer = new MeditationSynthesizer()

    if (typeof window !== 'undefined') {
      this.audioElement = new Audio()
      this.audioElement.preload = 'metadata'
      this.setupAudioListeners()
      this.loadUploadedTracks()
    }
  }

  static getInstance(): MeditationAudioManager {
    if (!MeditationAudioManager.instance) {
      MeditationAudioManager.instance = new MeditationAudioManager()
    }
    return MeditationAudioManager.instance
  }

  private setupAudioListeners(): void {
    if (!this.audioElement) return

    this.audioElement.addEventListener('play', () => {
      this._state.isPlaying = true
      this._state.isPaused = false
      this.notifyListeners()
    })

    this.audioElement.addEventListener('pause', () => {
      this._state.isPlaying = false
      this._state.isPaused = true
      this.notifyListeners()
    })

    this.audioElement.addEventListener('ended', () => {
      this.playNext()
    })

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this._state.currentTime = this.audioElement.currentTime
        this._state.duration = this.audioElement.duration || 0
        this.notifyListeners()
      }
    })

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this._state.duration = this.audioElement.duration
        this._state.isLoading = false
        this.notifyListeners()
      }
    })

    this.audioElement.addEventListener('error', () => {
      this._state.isLoading = false
      this._state.isPlaying = false
      this.notifyListeners()
    })
  }

  subscribe(listener: (state: PlayerState) => void): () => void {
    this.stateListeners.add(listener)
    listener(this._state) // Immediately call with current state
    return () => this.stateListeners.delete(listener)
  }

  private notifyListeners(): void {
    const stateCopy = { ...this._state }
    this.stateListeners.forEach(listener => listener(stateCopy))
  }

  getState(): PlayerState {
    return { ...this._state }
  }

  // ============ Track Management ============

  getAllTracks(): MeditationTrack[] {
    return [...MEDITATION_TRACKS, ...this.uploadedTracks]
  }

  getTracksByCategory(category: MeditationCategory): MeditationTrack[] {
    return this.getAllTracks().filter(t => t.category === category)
  }

  private loadUploadedTracks(): void {
    try {
      const stored = localStorage.getItem(UPLOADED_TRACKS_KEY)
      if (stored) {
        this.uploadedTracks = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load uploaded tracks:', e)
    }
  }

  private saveUploadedTracks(): void {
    try {
      localStorage.setItem(UPLOADED_TRACKS_KEY, JSON.stringify(this.uploadedTracks))
    } catch (e) {
      console.error('Failed to save uploaded tracks:', e)
    }
  }

  async uploadTrack(file: File): Promise<MeditationTrack | null> {
    if (!file.type.startsWith('audio/')) {
      console.error('Invalid file type - must be audio')
      return null
    }

    try {
      const url = URL.createObjectURL(file)
      const tempAudio = new Audio(url)

      await new Promise<void>((resolve, reject) => {
        tempAudio.addEventListener('loadedmetadata', () => resolve())
        tempAudio.addEventListener('error', () => reject(new Error('Failed to load audio')))
        tempAudio.load()
      })

      const track: MeditationTrack = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'My Upload',
        category: 'uploaded',
        duration: tempAudio.duration || 0,
        source: 'uploaded',
        audioUrl: url
      }

      this.uploadedTracks.push(track)
      this.saveUploadedTracks()
      this.notifyListeners()

      return track
    } catch (e) {
      console.error('Failed to upload track:', e)
      return null
    }
  }

  removeUploadedTrack(trackId: string): void {
    const track = this.uploadedTracks.find(t => t.id === trackId)
    if (track) {
      if (track.audioUrl) {
        URL.revokeObjectURL(track.audioUrl)
      }
      this.uploadedTracks = this.uploadedTracks.filter(t => t.id !== trackId)
      this.saveUploadedTracks()

      // Stop if currently playing this track
      if (this._state.currentTrack?.id === trackId) {
        this.stop()
      }
      this.notifyListeners()
    }
  }

  // ============ Playback Control ============

  async play(track?: MeditationTrack): Promise<void> {
    // CRITICAL: Stop ALL audio first to prevent overlapping
    this.stopAllAudio()

    if (track) {
      this._state.currentTrack = track
      this._state.isLoading = true
      this._state.currentTime = 0
      this.notifyListeners()

      if (track.source === 'uploaded' && track.audioUrl && this.audioElement) {
        // Play uploaded file
        this.audioElement.src = track.audioUrl
        this.audioElement.volume = this._state.isMuted ? 0 : this._state.volume
        try {
          await this.audioElement.play()
          this._state.isPlaying = true
          this._state.isPaused = false
          this._state.isLoading = false
        } catch (e) {
          console.error('Playback error:', e)
          this._state.isPlaying = false
          this._state.isLoading = false
        }
      } else if (track.soundType) {
        // Play synthesized preset
        try {
          await this.synthesizer.playSoundType(track.soundType)
          this.synthesizer.setVolume(this._state.isMuted ? 0 : this._state.volume)
          this._state.isPlaying = true
          this._state.isPaused = false
          this._state.isLoading = false
          this.startTime = Date.now()

          // Start time tracking
          this.timeUpdateInterval = setInterval(() => {
            this._state.currentTime = (Date.now() - this.startTime) / 1000
            this._state.duration = track.duration

            // Loop after duration
            if (this._state.currentTime >= track.duration) {
              this.playNext()
            }

            this.notifyListeners()
          }, 1000)
        } catch (e) {
          console.error('Synthesis error:', e)
          this._state.isPlaying = false
          this._state.isLoading = false
        }
      }

      this.notifyListeners()
    } else if (this._state.currentTrack) {
      // Resume current track
      await this.play(this._state.currentTrack)
    }
  }

  private stopAllAudio(): void {
    // Stop synthesizer
    this.synthesizer.stopAll()

    // Stop audio element
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }

    // Clear time update interval
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval)
      this.timeUpdateInterval = null
    }

    this._state.isPlaying = false
    this._state.isPaused = false
  }

  pause(): void {
    if (this._state.currentTrack?.source === 'uploaded' && this.audioElement) {
      this.audioElement.pause()
    } else {
      this.synthesizer.stopAll()
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval)
        this.timeUpdateInterval = null
      }
    }

    this._state.isPlaying = false
    this._state.isPaused = true
    this.notifyListeners()
  }

  stop(): void {
    this.stopAllAudio()
    this._state.currentTrack = null
    this._state.currentTime = 0
    this._state.duration = 0
    this._state.isPaused = false
    this.notifyListeners()
  }

  toggle(): void {
    if (this._state.isPlaying) {
      this.pause()
    } else if (this._state.currentTrack) {
      this.play(this._state.currentTrack)
    }
  }

  // ============ Queue Management ============

  setQueue(tracks: MeditationTrack[], startIndex: number = 0): void {
    this._state.queue = tracks
    this._state.queueIndex = startIndex
    if (tracks.length > 0 && startIndex < tracks.length) {
      this.play(tracks[startIndex])
    }
  }

  playNext(): void {
    if (this._state.queue.length === 0) return

    this._state.queueIndex = (this._state.queueIndex + 1) % this._state.queue.length
    this.play(this._state.queue[this._state.queueIndex])
  }

  playPrevious(): void {
    if (this._state.queue.length === 0) return

    this._state.queueIndex = this._state.queueIndex === 0
      ? this._state.queue.length - 1
      : this._state.queueIndex - 1
    this.play(this._state.queue[this._state.queueIndex])
  }

  // ============ Volume Control ============

  setVolume(vol: number): void {
    const clampedVol = Math.max(0, Math.min(1, vol))
    this._state.volume = clampedVol

    if (!this._state.isMuted) {
      this.synthesizer.setVolume(clampedVol)
      if (this.audioElement) {
        this.audioElement.volume = clampedVol
      }
    }

    this.notifyListeners()
  }

  mute(): void {
    this.previousVolume = this._state.volume
    this._state.isMuted = true
    this.synthesizer.setVolume(0)
    if (this.audioElement) {
      this.audioElement.volume = 0
    }
    this.notifyListeners()
  }

  unmute(): void {
    this._state.isMuted = false
    const vol = this.previousVolume || 0.7
    this._state.volume = vol
    this.synthesizer.setVolume(vol)
    if (this.audioElement) {
      this.audioElement.volume = vol
    }
    this.notifyListeners()
  }

  toggleMute(): void {
    if (this._state.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  // ============ Seek ============

  seek(position: number): void {
    // Position is 0-1 (percentage)
    if (this._state.currentTrack?.source === 'uploaded' && this.audioElement && this.audioElement.duration) {
      this.audioElement.currentTime = position * this.audioElement.duration
    } else if (this._state.currentTrack) {
      // For synthesized tracks, update start time
      const duration = this._state.currentTrack.duration
      this.startTime = Date.now() - (position * duration * 1000)
      this._state.currentTime = position * duration
      this.notifyListeners()
    }
  }

  // ============ Utility ============

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  dispose(): void {
    this.stopAllAudio()
    this.stateListeners.clear()
    if (this.audioElement) {
      this.audioElement.src = ''
    }
  }
}

// Singleton export
export const meditationAudioManager = MeditationAudioManager.getInstance()
export default meditationAudioManager
