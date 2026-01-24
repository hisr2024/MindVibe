/**
 * Spiritual Audio Engine - Simple & Authentic
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Authentic Sanatan spiritual sounds for meditation and reflection.
 * Simple, soul-soothing, natural sounds without pseudo-science.
 *
 * Sounds:
 * - Tanpura (तानपूरा) - Traditional drone for meditation
 * - Bansuri (बांसुरी) - Krishna's divine flute
 * - Singing Bowl (गायन कटोरा) - Tibetan meditation bowl
 * - Temple Bells (मंदिर घंटी) - Sacred temple ambiance
 * - Om Chant (ॐ) - Sacred mantra
 * - Shankh (शंख) - Conch shell
 * - Nature - Rain, River, Birds, Forest
 */

// ============ Types ============

export type SpiritualSound =
  | 'tanpura'
  | 'bansuri'
  | 'singing_bowl'
  | 'temple_bells'
  | 'om'
  | 'shankh'
  | 'rain'
  | 'river'
  | 'birds'
  | 'forest'
  | 'ocean'
  | 'wind'

export type SpiritualMood =
  | 'peace'        // शांति - Gentle tanpura + soft nature
  | 'devotion'     // भक्ति - Temple bells + om
  | 'meditation'   // ध्यान - Singing bowl + tanpura
  | 'krishna'      // कृष्ण - Bansuri flute
  | 'nature'       // प्रकृति - Pure nature sounds
  | 'sleep'        // निद्रा - Soft rain + gentle drone

export interface SoundConfig {
  id: SpiritualSound
  name: string
  nameHindi: string
  description: string
  category: 'spiritual' | 'nature'
}

export interface MoodConfig {
  id: SpiritualMood
  name: string
  nameHindi: string
  description: string
  sounds: SpiritualSound[]
  primaryColor: string
}

// ============ Sound Definitions ============

export const SPIRITUAL_SOUNDS: Record<SpiritualSound, SoundConfig> = {
  tanpura: {
    id: 'tanpura',
    name: 'Tanpura',
    nameHindi: 'तानपूरा',
    description: 'Traditional drone instrument for meditation',
    category: 'spiritual'
  },
  bansuri: {
    id: 'bansuri',
    name: 'Bansuri Flute',
    nameHindi: 'बांसुरी',
    description: 'Krishna\'s divine bamboo flute',
    category: 'spiritual'
  },
  singing_bowl: {
    id: 'singing_bowl',
    name: 'Singing Bowl',
    nameHindi: 'गायन कटोरा',
    description: 'Tibetan meditation singing bowl',
    category: 'spiritual'
  },
  temple_bells: {
    id: 'temple_bells',
    name: 'Temple Bells',
    nameHindi: 'मंदिर घंटी',
    description: 'Sacred temple bell sounds',
    category: 'spiritual'
  },
  om: {
    id: 'om',
    name: 'Om Chant',
    nameHindi: 'ॐ',
    description: 'Sacred primordial sound',
    category: 'spiritual'
  },
  shankh: {
    id: 'shankh',
    name: 'Shankh',
    nameHindi: 'शंख',
    description: 'Sacred conch shell',
    category: 'spiritual'
  },
  rain: {
    id: 'rain',
    name: 'Rain',
    nameHindi: 'वर्षा',
    description: 'Gentle rainfall',
    category: 'nature'
  },
  river: {
    id: 'river',
    name: 'River',
    nameHindi: 'नदी',
    description: 'Flowing river water',
    category: 'nature'
  },
  birds: {
    id: 'birds',
    name: 'Birds',
    nameHindi: 'पक्षी',
    description: 'Morning birds singing',
    category: 'nature'
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    nameHindi: 'वन',
    description: 'Peaceful forest ambiance',
    category: 'nature'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    nameHindi: 'सागर',
    description: 'Gentle ocean waves',
    category: 'nature'
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    nameHindi: 'वायु',
    description: 'Soft breeze',
    category: 'nature'
  }
}

export const SPIRITUAL_MOODS: Record<SpiritualMood, MoodConfig> = {
  peace: {
    id: 'peace',
    name: 'Peace',
    nameHindi: 'शांति',
    description: 'Gentle calm for reflection',
    sounds: ['tanpura', 'river'],
    primaryColor: '#8B5CF6' // violet
  },
  devotion: {
    id: 'devotion',
    name: 'Devotion',
    nameHindi: 'भक्ति',
    description: 'Temple atmosphere for prayer',
    sounds: ['temple_bells', 'om'],
    primaryColor: '#F59E0B' // amber
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    nameHindi: 'ध्यान',
    description: 'Deep meditation support',
    sounds: ['singing_bowl', 'tanpura'],
    primaryColor: '#6366F1' // indigo
  },
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    nameHindi: 'कृष्ण',
    description: 'Divine flute of Krishna',
    sounds: ['bansuri', 'birds'],
    primaryColor: '#3B82F6' // blue
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    nameHindi: 'प्रकृति',
    description: 'Pure sounds of nature',
    sounds: ['forest', 'birds', 'river'],
    primaryColor: '#10B981' // emerald
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    nameHindi: 'निद्रा',
    description: 'Gentle sounds for rest',
    sounds: ['rain', 'ocean'],
    primaryColor: '#6366F1' // indigo
  }
}

// ============ Audio Engine ============

class SpiritualAudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeNodes: Map<string, { oscillators: OscillatorNode[], gains: GainNode[] }> = new Map()
  private isPlaying: boolean = false
  private currentMood: SpiritualMood | null = null
  private volume: number = 0.5

  // Initialize audio context
  private async init(): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new AudioContext({ sampleRate: 44100 })
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = this.volume
    this.masterGain.connect(this.audioContext.destination)
  }

  // Get current state
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentMood: this.currentMood,
      volume: this.volume
    }
  }

  // Set volume (0-1)
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext!.currentTime, 0.1)
    }
  }

  // Play a mood
  async play(mood: SpiritualMood): Promise<void> {
    await this.init()

    // Stop current if playing different mood
    if (this.isPlaying && this.currentMood !== mood) {
      await this.stop()
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }

    this.currentMood = mood
    this.isPlaying = true

    const moodConfig = SPIRITUAL_MOODS[mood]

    // Start each sound in the mood
    for (const soundId of moodConfig.sounds) {
      this.startSound(soundId)
    }
  }

  // Stop all sounds
  async stop(): Promise<void> {
    if (!this.audioContext) return

    const now = this.audioContext.currentTime

    // Fade out all active nodes
    for (const [id, nodes] of this.activeNodes) {
      for (const gain of nodes.gains) {
        gain.gain.setTargetAtTime(0, now, 0.3)
      }

      // Stop oscillators after fade
      setTimeout(() => {
        for (const osc of nodes.oscillators) {
          try { osc.stop() } catch {}
        }
      }, 500)
    }

    this.activeNodes.clear()
    this.isPlaying = false
    this.currentMood = null
  }

  // Toggle play/pause
  async toggle(mood: SpiritualMood): Promise<void> {
    if (this.isPlaying && this.currentMood === mood) {
      await this.stop()
    } else {
      await this.play(mood)
    }
  }

  // Start individual sound
  private startSound(soundId: SpiritualSound): void {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime
    const oscillators: OscillatorNode[] = []
    const gains: GainNode[] = []

    switch (soundId) {
      case 'tanpura':
        this.createTanpura(oscillators, gains, now)
        break
      case 'bansuri':
        this.createBansuri(oscillators, gains, now)
        break
      case 'singing_bowl':
        this.createSingingBowl(oscillators, gains, now)
        break
      case 'temple_bells':
        this.createTempleBells(oscillators, gains, now)
        break
      case 'om':
        this.createOm(oscillators, gains, now)
        break
      case 'shankh':
        this.createShankh(oscillators, gains, now)
        break
      case 'rain':
        this.createRain(oscillators, gains, now)
        break
      case 'river':
        this.createRiver(oscillators, gains, now)
        break
      case 'birds':
        this.createBirds(oscillators, gains, now)
        break
      case 'forest':
        this.createForest(oscillators, gains, now)
        break
      case 'ocean':
        this.createOcean(oscillators, gains, now)
        break
      case 'wind':
        this.createWind(oscillators, gains, now)
        break
    }

    this.activeNodes.set(soundId, { oscillators, gains })
  }

  // ============ Sound Generators ============

  // Tanpura - Traditional Indian drone
  private createTanpura(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Sa (tonic) - C3 ~130.81 Hz
    const saFreq = 130.81
    // Pa (fifth) - G3 ~196 Hz
    const paFreq = 196.00

    // Create rich drone with harmonics
    const frequencies = [
      saFreq,           // Sa (fundamental)
      saFreq * 2,       // Sa (octave)
      paFreq,           // Pa (fifth)
      saFreq * 0.5      // Low Sa
    ]

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      osc.type = 'sawtooth'
      osc.frequency.value = freq

      // Gentle filter for warmth
      filter.type = 'lowpass'
      filter.frequency.value = 800
      filter.Q.value = 1

      // Subtle amplitude modulation for life
      const lfo = this.audioContext!.createOscillator()
      const lfoGain = this.audioContext!.createGain()
      lfo.frequency.value = 0.1 + i * 0.05
      lfoGain.gain.value = 0.1

      gain.gain.setValueAtTime(0, now)
      gain.gain.setTargetAtTime(0.15 - i * 0.02, now, 2)

      osc.connect(filter)
      filter.connect(gain)
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      gain.connect(this.masterGain!)

      osc.start(now)
      lfo.start(now)

      oscillators.push(osc)
      gains.push(gain)
    })
  }

  // Bansuri - Krishna's flute
  private createBansuri(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Pentatonic scale notes for meditative melody
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00] // C4, D4, E4, G4, A4

    const osc = this.audioContext!.createOscillator()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    osc.type = 'sine'

    // Create gentle melody
    filter.type = 'lowpass'
    filter.frequency.value = 2000

    // Slow melodic movement
    const melodyLoop = () => {
      if (!this.isPlaying) return

      const note = notes[Math.floor(Math.random() * notes.length)]
      const duration = 2 + Math.random() * 3

      osc.frequency.setTargetAtTime(note, this.audioContext!.currentTime, 0.5)
      gain.gain.setTargetAtTime(0.08 + Math.random() * 0.04, this.audioContext!.currentTime, 0.3)

      setTimeout(() => {
        gain.gain.setTargetAtTime(0.02, this.audioContext!.currentTime, 0.5)
      }, duration * 800)

      setTimeout(melodyLoop, duration * 1000)
    }

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.08, now, 1)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    setTimeout(melodyLoop, 2000)

    oscillators.push(osc)
    gains.push(gain)
  }

  // Singing Bowl - Tibetan meditation bowl
  private createSingingBowl(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const bowlLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const fundamental = 200 + Math.random() * 100
      const currentTime = this.audioContext.currentTime

      // Bowl harmonics
      const bowlRatios: number[] = [1, 2.71, 5.4]
      bowlRatios.forEach((ratio: number, i: number) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sine'
        osc.frequency.value = fundamental * ratio

        const amplitude = 0.1 / (i + 1)
        gain.gain.setValueAtTime(0, currentTime)
        gain.gain.setTargetAtTime(amplitude, currentTime, 0.1)
        gain.gain.setTargetAtTime(0, currentTime + 4, 2)

        osc.connect(gain)
        gain.connect(this.masterGain!)

        osc.start(currentTime)
        osc.stop(currentTime + 8)
      })

      // Next bowl strike
      setTimeout(bowlLoop, 6000 + Math.random() * 4000)
    }

    bowlLoop()
  }

  // Temple Bells
  private createTempleBells(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const bellLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const fundamental = 400 + Math.random() * 200
      const currentTime = this.audioContext.currentTime

      // Bell harmonics
      const bellRatios: number[] = [1, 2, 2.4, 3, 4.5]
      bellRatios.forEach((ratio: number, i: number) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sine'
        osc.frequency.value = fundamental * ratio

        const amplitude = 0.08 / (i + 1)
        gain.gain.setValueAtTime(amplitude, currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 3)

        osc.connect(gain)
        gain.connect(this.masterGain!)

        osc.start(currentTime)
        osc.stop(currentTime + 3.5)
      })

      setTimeout(bellLoop, 4000 + Math.random() * 6000)
    }

    bellLoop()
  }

  // Om Chant
  private createOm(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Low drone representing Om
    const osc = this.audioContext!.createOscillator()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.value = 136.1 // Om frequency

    filter.type = 'lowpass'
    filter.frequency.value = 400

    // Slow breathing-like modulation
    const lfo = this.audioContext!.createOscillator()
    const lfoGain = this.audioContext!.createGain()
    lfo.frequency.value = 0.08 // ~7.5 second cycle
    lfoGain.gain.value = 0.05

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.12, now, 2)

    osc.connect(filter)
    filter.connect(gain)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    lfo.start(now)

    oscillators.push(osc)
    gains.push(gain)
  }

  // Shankh (Conch)
  private createShankh(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const shankhLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime
      const fundamental = 180

      // Rich harmonics of conch
      const conchRatios: number[] = [1, 1.5, 2, 3, 4]
      conchRatios.forEach((ratio: number, i: number) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sawtooth'
        osc.frequency.value = fundamental * ratio

        const amplitude = 0.06 / (i + 1)
        gain.gain.setValueAtTime(0, currentTime)
        gain.gain.setTargetAtTime(amplitude, currentTime, 0.5)
        gain.gain.setTargetAtTime(0, currentTime + 4, 1.5)

        const filter = this.audioContext!.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 600

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain!)

        osc.start(currentTime)
        osc.stop(currentTime + 6)
      })

      setTimeout(shankhLoop, 15000 + Math.random() * 10000)
    }

    setTimeout(shankhLoop, 1000)
  }

  // Rain
  private createRain(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Brown noise for rain
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + (0.02 * white)) / 1.02
      lastOut = data[i]
      data[i] *= 3.5
    }

    const source = this.audioContext!.createBufferSource()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    source.buffer = buffer
    source.loop = true

    filter.type = 'lowpass'
    filter.frequency.value = 1000

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.2, now, 1)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    source.start(now)

    // Store reference (we'll use a dummy oscillator for tracking)
    const dummyOsc = this.audioContext!.createOscillator()
    dummyOsc.frequency.value = 0
    oscillators.push(dummyOsc)
    gains.push(gain)
  }

  // River
  private createRiver(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Filtered white noise for flowing water
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.audioContext!.createBufferSource()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()
    const filter2 = this.audioContext!.createBiquadFilter()

    source.buffer = buffer
    source.loop = true

    filter.type = 'bandpass'
    filter.frequency.value = 500
    filter.Q.value = 0.5

    filter2.type = 'lowpass'
    filter2.frequency.value = 2000

    // Subtle modulation for natural movement
    const lfo = this.audioContext!.createOscillator()
    const lfoGain = this.audioContext!.createGain()
    lfo.frequency.value = 0.2
    lfoGain.gain.value = 200

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.15, now, 1)

    source.connect(filter)
    filter.connect(filter2)
    filter2.connect(gain)
    gain.connect(this.masterGain!)

    source.start(now)
    lfo.start(now)

    gains.push(gain)
  }

  // Birds
  private createBirds(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const birdLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime

      // Random bird chirp
      const baseFreq = 2000 + Math.random() * 2000
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq, currentTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, currentTime + 0.1)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, currentTime + 0.2)

      gain.gain.setValueAtTime(0, currentTime)
      gain.gain.linearRampToValueAtTime(0.05, currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(currentTime)
      osc.stop(currentTime + 0.4)

      // Random interval for next bird
      setTimeout(birdLoop, 1000 + Math.random() * 4000)
    }

    birdLoop()
  }

  // Forest
  private createForest(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Combine wind and subtle birds
    this.createWind(oscillators, gains, now)
    setTimeout(() => this.createBirds([], [], now), 2000)
  }

  // Ocean
  private createOcean(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Pink noise with slow modulation for waves
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

    // Pink noise generation
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

    const source = this.audioContext!.createBufferSource()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    source.buffer = buffer
    source.loop = true

    filter.type = 'lowpass'
    filter.frequency.value = 800

    // Slow wave-like amplitude modulation
    const lfo = this.audioContext!.createOscillator()
    const lfoGain = this.audioContext!.createGain()
    lfo.frequency.value = 0.1 // 10 second cycle
    lfoGain.gain.value = 0.08

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.18, now, 1)

    source.connect(filter)
    filter.connect(gain)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    gain.connect(this.masterGain!)

    source.start(now)
    lfo.start(now)

    gains.push(gain)
  }

  // Wind
  private createWind(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Filtered noise for wind
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.audioContext!.createBufferSource()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    source.buffer = buffer
    source.loop = true

    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.3

    // Slow modulation for gusts
    const lfo = this.audioContext!.createOscillator()
    const lfoGain = this.audioContext!.createGain()
    lfo.frequency.value = 0.05
    lfoGain.gain.value = 0.06

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.1, now, 1)

    source.connect(filter)
    filter.connect(gain)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    gain.connect(this.masterGain!)

    source.start(now)
    lfo.start(now)

    gains.push(gain)
  }

  // Cleanup
  dispose(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton instance
export const spiritualAudio = new SpiritualAudioEngine()

export default spiritualAudio
