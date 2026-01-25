/**
 * Simple Music Engine with Web Audio Synthesis
 *
 * ॐ
 *
 * Generates soul-soothing meditation music using Web Audio API.
 * No external URLs needed - all audio is synthesized in real-time.
 */

// ============ Types ============

export type SoundType =
  | 'rain' | 'ocean' | 'forest' | 'river' | 'crickets' | 'thunder'
  | 'meditation' | 'relaxation' | 'healing_528' | 'spiritual'
  | 'singing_bowls' | 'chakra' | 'zen'
  | 'sleep' | 'night_rain' | 'ocean_night'
  | 'flute' | 'piano' | 'sitar'
  | 'om' | 'temple_bells' | 'gayatri' | 'vedic'
  | 'alpha' | 'theta'

export interface MusicTrack {
  id: string
  title: string
  artist?: string
  duration: number
  source: 'preset' | 'user'
  url: string
  soundType?: SoundType
  addedAt?: number
}

export interface PlayerState {
  isPlaying: boolean
  currentTrack: MusicTrack | null
  currentTime: number
  duration: number
  volume: number
  queue: MusicTrack[]
  queueIndex: number
}

// ============ Preset Tracks (Synthesized) ============

export const PRESET_TRACKS: MusicTrack[] = [
  // === NATURE SOUNDS ===
  { id: 'preset-rain', title: 'Gentle Rain Meditation', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'rain' },
  { id: 'preset-ocean', title: 'Ocean Waves Serenity', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'ocean' },
  { id: 'preset-forest', title: 'Forest Morning Birds', artist: 'Nature Sounds', duration: 300, source: 'preset', url: '', soundType: 'forest' },
  { id: 'preset-river', title: 'Flowing River Peace', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'river' },
  { id: 'preset-crickets', title: 'Night Forest Crickets', artist: 'Nature Sounds', duration: 300, source: 'preset', url: '', soundType: 'crickets' },
  { id: 'preset-thunder', title: 'Distant Thunder Peace', artist: 'Nature Sounds', duration: 300, source: 'preset', url: '', soundType: 'thunder' },

  // === MEDITATION ===
  { id: 'preset-meditation', title: 'Calm Meditation', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'meditation' },
  { id: 'preset-relaxation', title: 'Deep Relaxation Journey', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'relaxation' },
  { id: 'preset-528hz', title: '528 Hz Love Frequency', artist: 'Healing Sounds', duration: 300, source: 'preset', url: '', soundType: 'healing_528' },
  { id: 'preset-spiritual', title: 'Spiritual Awakening', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'spiritual' },

  // === HEALING ===
  { id: 'preset-bowls', title: 'Tibetan Singing Bowls', artist: 'Healing Sounds', duration: 300, source: 'preset', url: '', soundType: 'singing_bowls' },
  { id: 'preset-chakra', title: 'Chakra Healing Tones', artist: 'Healing Sounds', duration: 300, source: 'preset', url: '', soundType: 'chakra' },
  { id: 'preset-zen', title: 'Zen Garden Ambience', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'zen' },

  // === SLEEP ===
  { id: 'preset-sleep', title: 'Deep Sleep Ambient', artist: 'Sleep & Rest', duration: 300, source: 'preset', url: '', soundType: 'sleep' },
  { id: 'preset-night-rain', title: 'Rainy Night Lullaby', artist: 'Sleep & Rest', duration: 300, source: 'preset', url: '', soundType: 'night_rain' },
  { id: 'preset-ocean-night', title: 'Ocean at Night', artist: 'Sleep & Rest', duration: 300, source: 'preset', url: '', soundType: 'ocean_night' },

  // === INSTRUMENTAL ===
  { id: 'preset-flute', title: 'Divine Flute Meditation', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'flute' },
  { id: 'preset-piano', title: 'Piano Serenity', artist: 'Instrumental', duration: 300, source: 'preset', url: '', soundType: 'piano' },
  { id: 'preset-sitar', title: 'Sitar Evening Peace', artist: 'Spiritual Vibes', duration: 300, source: 'preset', url: '', soundType: 'sitar' },

  // === SACRED ===
  { id: 'preset-om', title: 'Om Meditation Chant', artist: 'Sacred Sounds', duration: 300, source: 'preset', url: '', soundType: 'om' },
  { id: 'preset-bells', title: 'Temple Bells Morning', artist: 'Sacred Sounds', duration: 300, source: 'preset', url: '', soundType: 'temple_bells' },
  { id: 'preset-gayatri', title: 'Gayatri Mantra Peace', artist: 'Sacred Sounds', duration: 300, source: 'preset', url: '', soundType: 'gayatri' },
  { id: 'preset-vedic', title: 'Vedic Peace Chanting', artist: 'Sacred Sounds', duration: 300, source: 'preset', url: '', soundType: 'vedic' },

  // === BRAINWAVE ===
  { id: 'preset-alpha', title: 'Alpha Waves Relaxation', artist: 'Brainwave Therapy', duration: 300, source: 'preset', url: '', soundType: 'alpha' },
  { id: 'preset-theta', title: 'Theta Deep Meditation', artist: 'Brainwave Therapy', duration: 300, source: 'preset', url: '', soundType: 'theta' }
]

// ============ Audio Synthesizer ============

class AudioSynthesizer {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeNodes: AudioNode[] = []
  private oscillators: OscillatorNode[] = []
  private noiseSource: AudioBufferSourceNode | null = null
  private noiseSources: AudioBufferSourceNode[] = []
  private intervals: ReturnType<typeof setInterval>[] = []
  private timeouts: ReturnType<typeof setTimeout>[] = []

  async initialize(): Promise<void> {
    if (this.ctx) return

    this.ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.connect(this.ctx.destination)
    this.masterGain.gain.value = 0.7

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  setVolume(vol: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx!.currentTime, 0.1)
    }
  }

  stop(): void {
    // Clear all intervals and timeouts first
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []

    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts = []

    // Stop all oscillators
    this.oscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.oscillators = []

    // Stop primary noise source
    if (this.noiseSource) {
      try { this.noiseSource.stop() } catch {}
      this.noiseSource = null
    }

    // Stop all noise sources
    this.noiseSources.forEach(source => {
      try { source.stop() } catch {}
    })
    this.noiseSources = []

    // Disconnect all nodes
    this.activeNodes.forEach(node => {
      try { node.disconnect() } catch {}
    })
    this.activeNodes = []
  }

  private addInterval(interval: ReturnType<typeof setInterval>): void {
    this.intervals.push(interval)
  }

  private addTimeout(timeout: ReturnType<typeof setTimeout>): void {
    this.timeouts.push(timeout)
  }

  private createNoise(type: 'white' | 'pink' | 'brown' = 'white'): AudioBufferSourceNode {
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
    return source
  }

  private createLFO(freq: number): OscillatorNode {
    const lfo = this.ctx!.createOscillator()
    lfo.frequency.value = freq
    lfo.type = 'sine'
    return lfo
  }

  async playSoundType(soundType: SoundType): Promise<void> {
    await this.initialize()
    this.stop()

    switch (soundType) {
      case 'rain':
        this.playRain()
        break
      case 'ocean':
        this.playOcean()
        break
      case 'forest':
        this.playForest()
        break
      case 'river':
        this.playRiver()
        break
      case 'crickets':
        this.playCrickets()
        break
      case 'thunder':
        this.playThunder()
        break
      case 'meditation':
      case 'relaxation':
      case 'spiritual':
        this.playMeditation()
        break
      case 'healing_528':
        this.play528Hz()
        break
      case 'singing_bowls':
        this.playSingingBowls()
        break
      case 'chakra':
        this.playChakra()
        break
      case 'zen':
        this.playZen()
        break
      case 'sleep':
      case 'night_rain':
        this.playSleep()
        break
      case 'ocean_night':
        this.playOceanNight()
        break
      case 'flute':
        this.playFlute()
        break
      case 'piano':
        this.playPiano()
        break
      case 'sitar':
        this.playSitar()
        break
      case 'om':
        this.playOm()
        break
      case 'temple_bells':
        this.playTempleBells()
        break
      case 'gayatri':
      case 'vedic':
        this.playVedic()
        break
      case 'alpha':
        this.playAlpha()
        break
      case 'theta':
        this.playTheta()
        break
    }
  }

  // === Nature Sounds ===

  private playRain(): void {
    const noise = this.createNoise('pink')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 4000
    filter.Q.value = 0.5

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.4

    // Add variation with LFO
    const lfoGain = this.ctx!.createGain()
    lfoGain.gain.value = 0.1
    const lfo = this.createLFO(0.2)
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    noise.start()
    this.noiseSource = noise
    this.oscillators.push(lfo)
    this.activeNodes.push(filter, gain, lfoGain)
  }

  private playOcean(): void {
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.5

    // Wave-like modulation
    const lfo = this.createLFO(0.08)
    const lfoGain = this.ctx!.createGain()
    lfoGain.gain.value = 300
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    noise.start()
    this.noiseSource = noise
    this.oscillators.push(lfo)
    this.activeNodes.push(filter, gain, lfoGain)
  }

  private playForest(): void {
    // Wind through trees
    const windNoise = this.createNoise('pink')
    const windFilter = this.ctx!.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 600
    windFilter.Q.value = 0.8

    const windGain = this.ctx!.createGain()
    windGain.gain.value = 0.15

    windNoise.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(this.masterGain!)
    windNoise.start()

    // Bird chirps (high frequency oscillators)
    const birdFreqs: number[] = [2000, 2400, 2800, 3200]
    birdFreqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0

      // Random chirp pattern
      const interval = 2000 + Math.random() * 3000
      this.addInterval(setInterval(() => {
        if (Math.random() > 0.5) {
          gain.gain.setTargetAtTime(0.03, this.ctx!.currentTime, 0.01)
          gain.gain.setTargetAtTime(0, this.ctx!.currentTime + 0.1, 0.05)
        }
      }, interval))

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
      this.oscillators.push(osc)
      this.activeNodes.push(gain)
    })

    this.noiseSource = windNoise
    this.activeNodes.push(windFilter, windGain)
  }

  private playRiver(): void {
    const noise = this.createNoise('white')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    filter.Q.value = 0.3

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.3

    // Flowing variation
    const lfo = this.createLFO(0.3)
    const lfoGain = this.ctx!.createGain()
    lfoGain.gain.value = 400
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    noise.start()
    this.noiseSource = noise
    this.oscillators.push(lfo)
    this.activeNodes.push(filter, gain, lfoGain)
  }

  private playCrickets(): void {
    // Create multiple cricket sounds at different frequencies
    const cricketFreqs: number[] = [4000, 4200, 4400, 4600, 4800]

    cricketFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'square'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0

      // Cricket chirp pattern
      const baseInterval = 800 + i * 200
      let isChirping = false

      this.addInterval(setInterval(() => {
        if (!isChirping && Math.random() > 0.3) {
          isChirping = true
          // Rapid on-off for chirping
          for (let j = 0; j < 5; j++) {
            this.addTimeout(setTimeout(() => {
              gain.gain.setTargetAtTime(0.01, this.ctx!.currentTime, 0.001)
              gain.gain.setTargetAtTime(0, this.ctx!.currentTime + 0.03, 0.001)
            }, j * 60))
          }
          this.addTimeout(setTimeout(() => { isChirping = false }, 400))
        }
      }, baseInterval))

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
      this.oscillators.push(osc)
      this.activeNodes.push(gain)
    })

    // Background night ambience
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.1

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.activeNodes.push(filter, gain)
  }

  private playThunder(): void {
    // Rain background
    this.playRain()

    // Thunder rumbles
    this.addInterval(setInterval(() => {
      if (Math.random() > 0.7) {
        const thunderOsc = this.ctx!.createOscillator()
        thunderOsc.frequency.value = 50 + Math.random() * 30
        thunderOsc.type = 'sawtooth'

        const thunderGain = this.ctx!.createGain()
        const filter = this.ctx!.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 200

        thunderOsc.connect(filter)
        filter.connect(thunderGain)
        thunderGain.connect(this.masterGain!)

        thunderGain.gain.setValueAtTime(0, this.ctx!.currentTime)
        thunderGain.gain.linearRampToValueAtTime(0.4, this.ctx!.currentTime + 0.1)
        thunderGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 3)

        thunderOsc.start()
        thunderOsc.stop(this.ctx!.currentTime + 3)
      }
    }, 5000))
  }

  // === Meditation ===

  private playMeditation(): void {
    // Full meditation composition with evolving chord progressions and arpeggios
    // Chord progression: Am - F - C - G (peaceful, reflective)
    const chordProgressions: number[][] = [
      [220, 261.63, 329.63],      // Am (A3, C4, E4)
      [174.61, 220, 261.63],      // F (F3, A3, C4)
      [196, 261.63, 329.63],      // C (G3, C4, E4)
      [196, 246.94, 293.66]       // G (G3, B3, D4)
    ]

    let currentChord = 0
    const padGains: GainNode[] = []

    // Create reverb-like effect with multiple delays
    const reverbGain = this.ctx!.createGain()
    reverbGain.gain.value = 0.3
    reverbGain.connect(this.masterGain!)
    this.activeNodes.push(reverbGain)

    // Create pad oscillators for current chord
    const createPad = (frequencies: number[]): void => {
      frequencies.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator()
        osc.frequency.value = freq
        osc.type = 'sine'

        const gain = this.ctx!.createGain()
        gain.gain.value = 0
        // Smooth fade in
        gain.gain.setTargetAtTime(0.06, this.ctx!.currentTime, 0.5)

        // Add subtle vibrato
        const vibrato = this.createLFO(0.2 + i * 0.05)
        const vibratoGain = this.ctx!.createGain()
        vibratoGain.gain.value = 1
        vibrato.connect(vibratoGain)
        vibratoGain.connect(osc.frequency)
        vibrato.start()

        osc.connect(gain)
        gain.connect(this.masterGain!)
        gain.connect(reverbGain)
        osc.start()

        padGains.push(gain)
        this.oscillators.push(osc, vibrato)
        this.activeNodes.push(gain, vibratoGain)
      })
    }

    // Start with first chord
    createPad(chordProgressions[0])

    // Chord progression every 12 seconds
    this.addInterval(setInterval(() => {
      // Fade out current pads
      padGains.forEach(g => {
        g.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.5)
      })

      // Move to next chord
      currentChord = (currentChord + 1) % chordProgressions.length

      // Create new pads after fade
      this.addTimeout(setTimeout(() => {
        createPad(chordProgressions[currentChord])
      }, 1000))
    }, 12000))

    // Arpeggiated melody line
    const melodyNotes: number[] = [329.63, 392, 440, 523.25, 587.33, 659.25, 523.25, 440] // E4 to E5
    let melodyIndex = 0

    const playMelodyNote = (): void => {
      const freq = melodyNotes[melodyIndex]
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'triangle'

      const filter = this.ctx!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 2000

      const gain = this.ctx!.createGain()
      gain.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain.gain.linearRampToValueAtTime(0.05, this.ctx!.currentTime + 0.1)
      gain.gain.setValueAtTime(0.05, this.ctx!.currentTime + 1.5)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 3)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
      osc.stop(this.ctx!.currentTime + 3)

      melodyIndex = (melodyIndex + 1) % melodyNotes.length
    }

    // Play melody notes every 3 seconds
    playMelodyNote()
    this.addInterval(setInterval(playMelodyNote, 3000))

    // Soft noise layer for atmosphere
    const noise = this.createNoise('pink')
    const noiseFilter = this.ctx!.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 400

    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.value = 0.02

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.activeNodes.push(noiseFilter, noiseGain)

    // Deep bass drone
    const bassOsc = this.ctx!.createOscillator()
    bassOsc.frequency.value = 55 // A1
    bassOsc.type = 'sine'

    const bassGain = this.ctx!.createGain()
    bassGain.gain.value = 0.08

    bassOsc.connect(bassGain)
    bassGain.connect(this.masterGain!)
    bassOsc.start()

    this.oscillators.push(bassOsc)
    this.activeNodes.push(bassGain)
  }

  private play528Hz(): void {
    // 528 Hz - The Love Frequency
    const osc = this.ctx!.createOscillator()
    osc.frequency.value = 528
    osc.type = 'sine'

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.15

    // Gentle beating with slightly detuned oscillator
    const osc2 = this.ctx!.createOscillator()
    osc2.frequency.value = 528.5
    osc2.type = 'sine'

    const gain2 = this.ctx!.createGain()
    gain2.gain.value = 0.15

    osc.connect(gain)
    osc2.connect(gain2)
    gain.connect(this.masterGain!)
    gain2.connect(this.masterGain!)

    osc.start()
    osc2.start()

    this.oscillators.push(osc, osc2)
    this.activeNodes.push(gain, gain2)
  }

  private playSingingBowls(): void {
    // Complete Tibetan Singing Bowl meditation session
    // Multiple bowls with authentic harmonic series and periodic strikes

    // Bowl frequencies based on actual Tibetan bowls (approximate)
    const bowls: { fundamental: number; harmonics: number[] }[] = [
      { fundamental: 174.61, harmonics: [2.1, 3.2, 4.1, 5.3] },  // F3 bowl
      { fundamental: 261.63, harmonics: [2.0, 3.1, 4.2, 5.1] },  // C4 bowl
      { fundamental: 329.63, harmonics: [2.2, 3.0, 4.3, 5.2] },  // E4 bowl
      { fundamental: 392, harmonics: [2.1, 3.3, 4.0, 5.4] },     // G4 bowl
    ]

    // Create sustained bowl tones
    bowls.forEach((bowl, bowlIndex) => {
      // Fundamental
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = bowl.fundamental
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0.06

      // Slow beating/shimmering
      const lfo = this.createLFO(0.3 + bowlIndex * 0.15)
      const lfoGain = this.ctx!.createGain()
      lfoGain.gain.value = 0.015
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      this.oscillators.push(osc, lfo)
      this.activeNodes.push(gain, lfoGain)

      // Add harmonics for richness
      bowl.harmonics.forEach((harmRatio, i) => {
        const harmOsc = this.ctx!.createOscillator()
        harmOsc.frequency.value = bowl.fundamental * harmRatio
        harmOsc.type = 'sine'

        const harmGain = this.ctx!.createGain()
        harmGain.gain.value = 0.02 / (i + 1)

        harmOsc.connect(harmGain)
        harmGain.connect(this.masterGain!)
        harmOsc.start()

        this.oscillators.push(harmOsc)
        this.activeNodes.push(harmGain)
      })
    })

    // Periodic bowl strikes (like being played with mallet)
    let currentBowl = 0

    const strikeBowl = (): void => {
      const bowl = bowls[currentBowl]

      // Strike sound - quick attack, long decay
      const strikeOsc = this.ctx!.createOscillator()
      strikeOsc.frequency.value = bowl.fundamental
      strikeOsc.type = 'sine'

      // Strike harmonics
      const strikeOsc2 = this.ctx!.createOscillator()
      strikeOsc2.frequency.value = bowl.fundamental * 2.1
      strikeOsc2.type = 'sine'

      const strikeOsc3 = this.ctx!.createOscillator()
      strikeOsc3.frequency.value = bowl.fundamental * 3.2
      strikeOsc3.type = 'sine'

      // Attack transient (mallet hit)
      const transient = this.ctx!.createOscillator()
      transient.frequency.value = bowl.fundamental * 8
      transient.type = 'triangle'

      const strikeGain = this.ctx!.createGain()
      strikeGain.gain.setValueAtTime(0, this.ctx!.currentTime)
      strikeGain.gain.linearRampToValueAtTime(0.15, this.ctx!.currentTime + 0.01)
      strikeGain.gain.exponentialRampToValueAtTime(0.05, this.ctx!.currentTime + 0.5)
      strikeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 8)

      const strikeGain2 = this.ctx!.createGain()
      strikeGain2.gain.setValueAtTime(0, this.ctx!.currentTime)
      strikeGain2.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 0.01)
      strikeGain2.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 6)

      const strikeGain3 = this.ctx!.createGain()
      strikeGain3.gain.setValueAtTime(0, this.ctx!.currentTime)
      strikeGain3.gain.linearRampToValueAtTime(0.04, this.ctx!.currentTime + 0.01)
      strikeGain3.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

      const transientGain = this.ctx!.createGain()
      transientGain.gain.setValueAtTime(0.1, this.ctx!.currentTime)
      transientGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.05)

      strikeOsc.connect(strikeGain)
      strikeOsc2.connect(strikeGain2)
      strikeOsc3.connect(strikeGain3)
      transient.connect(transientGain)

      strikeGain.connect(this.masterGain!)
      strikeGain2.connect(this.masterGain!)
      strikeGain3.connect(this.masterGain!)
      transientGain.connect(this.masterGain!)

      strikeOsc.start()
      strikeOsc2.start()
      strikeOsc3.start()
      transient.start()

      strikeOsc.stop(this.ctx!.currentTime + 8)
      strikeOsc2.stop(this.ctx!.currentTime + 6)
      strikeOsc3.stop(this.ctx!.currentTime + 4)
      transient.stop(this.ctx!.currentTime + 0.05)

      currentBowl = (currentBowl + 1) % bowls.length
    }

    // Strike a bowl every 6 seconds
    strikeBowl()
    this.addInterval(setInterval(strikeBowl, 6000))

    // Soft ambient pad for depth
    const noise = this.createNoise('pink')
    const noiseFilter = this.ctx!.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 300

    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.value = 0.015

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.activeNodes.push(noiseFilter, noiseGain)
  }

  private playChakra(): void {
    // Seven chakra frequencies
    const chakraFreqs: number[] = [
      256,    // Root - C
      288,    // Sacral - D
      320,    // Solar Plexus - E
      341.3,  // Heart - F
      384,    // Throat - G
      426.7,  // Third Eye - A
      480     // Crown - B
    ]

    let currentChakra = 0

    const playNextChakra = () => {
      // Stop current
      this.oscillators.forEach(osc => {
        try { osc.stop() } catch {}
      })
      this.oscillators = []

      const freq = chakraFreqs[currentChakra]
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0
      gain.gain.setTargetAtTime(0.15, this.ctx!.currentTime, 1)

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      this.oscillators.push(osc)
      this.activeNodes.push(gain)

      currentChakra = (currentChakra + 1) % chakraFreqs.length
    }

    playNextChakra()
    this.addInterval(setInterval(playNextChakra, 30000)) // Change chakra every 30 seconds
  }

  private playZen(): void {
    // Soft bells and wind
    this.playForest()

    // Occasional bell tones
    this.addInterval(setInterval(() => {
      if (Math.random() > 0.5) {
        const bell = this.ctx!.createOscillator()
        bell.frequency.value = 800 + Math.random() * 400
        bell.type = 'sine'

        const bellGain = this.ctx!.createGain()
        bellGain.gain.setValueAtTime(0.08, this.ctx!.currentTime)
        bellGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

        bell.connect(bellGain)
        bellGain.connect(this.masterGain!)
        bell.start()
        bell.stop(this.ctx!.currentTime + 4)
      }
    }, 8000))
  }

  // === Sleep ===

  private playSleep(): void {
    // Complete Sleep Lullaby - gentle, soothing composition
    // Combines delta waves, soft pads, and gentle melodic elements

    // Delta wave base for deep relaxation (1-4 Hz binaural)
    const deltaBase = 100
    const deltaOscL = this.ctx!.createOscillator()
    deltaOscL.frequency.value = deltaBase
    deltaOscL.type = 'sine'

    const deltaOscR = this.ctx!.createOscillator()
    deltaOscR.frequency.value = deltaBase + 2 // 2 Hz delta beat
    deltaOscR.type = 'sine'

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -0.8
    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 0.8

    const deltaGainL = this.ctx!.createGain()
    deltaGainL.gain.value = 0.06
    const deltaGainR = this.ctx!.createGain()
    deltaGainR.gain.value = 0.06

    deltaOscL.connect(deltaGainL)
    deltaGainL.connect(panL)
    panL.connect(this.masterGain!)

    deltaOscR.connect(deltaGainR)
    deltaGainR.connect(panR)
    panR.connect(this.masterGain!)

    deltaOscL.start()
    deltaOscR.start()

    this.oscillators.push(deltaOscL, deltaOscR)
    this.activeNodes.push(deltaGainL, deltaGainR, panL, panR)

    // Soft pad chord progression (very slow, dreamy)
    const sleepChords: number[][] = [
      [130.81, 164.81, 196],      // C3, E3, G3 (C major)
      [116.54, 146.83, 174.61],   // Bb2, D3, F3 (Bb major)
      [110, 138.59, 164.81],      // A2, C#3, E3 (A major)
      [123.47, 155.56, 185]       // B2, Eb3, F#3 (B major)
    ]

    let chordIndex = 0
    const padGains: GainNode[] = []

    const playPadChord = (): void => {
      // Fade out old pads
      padGains.forEach(g => {
        g.gain.setTargetAtTime(0, this.ctx!.currentTime, 2)
      })

      const chord = sleepChords[chordIndex]

      chord.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator()
        osc.frequency.value = freq
        osc.type = 'sine'

        const gain = this.ctx!.createGain()
        gain.gain.value = 0
        gain.gain.setTargetAtTime(0.04, this.ctx!.currentTime, 1)

        // Very slow tremolo
        const lfo = this.createLFO(0.08 + i * 0.02)
        const lfoGain = this.ctx!.createGain()
        lfoGain.gain.value = 0.01
        lfo.connect(lfoGain)
        lfoGain.connect(gain.gain)
        lfo.start()

        osc.connect(gain)
        gain.connect(this.masterGain!)
        osc.start()

        padGains.push(gain)
        this.oscillators.push(osc, lfo)
        this.activeNodes.push(gain, lfoGain)
      })

      chordIndex = (chordIndex + 1) % sleepChords.length
    }

    playPadChord()
    this.addInterval(setInterval(playPadChord, 20000))

    // Gentle lullaby melody (very sparse, quiet)
    const lullabyNotes: number[] = [392, 329.63, 293.66, 261.63, 246.94, 261.63, 293.66, 261.63]
    let noteIndex = 0

    const playLullabyNote = (): void => {
      const freq = lullabyNotes[noteIndex]

      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const filter = this.ctx!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      const gain = this.ctx!.createGain()
      gain.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain.gain.linearRampToValueAtTime(0.03, this.ctx!.currentTime + 0.5)
      gain.gain.setValueAtTime(0.03, this.ctx!.currentTime + 2)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
      osc.stop(this.ctx!.currentTime + 4)

      noteIndex = (noteIndex + 1) % lullabyNotes.length
    }

    // Play lullaby notes very slowly
    this.addTimeout(setTimeout(() => {
      playLullabyNote()
      this.addInterval(setInterval(playLullabyNote, 5000))
    }, 3000))

    // Soft brown noise (like distant wind or breathing)
    const noise = this.createNoise('brown')
    const noiseFilter = this.ctx!.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 200

    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.value = 0.08

    // Breathing modulation on noise
    const breathLfo = this.createLFO(0.15) // ~9 breaths per minute
    const breathGain = this.ctx!.createGain()
    breathGain.gain.value = 0.03
    breathLfo.connect(breathGain)
    breathGain.connect(noiseGain.gain)
    breathLfo.start()

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.oscillators.push(breathLfo)
    this.activeNodes.push(noiseFilter, noiseGain, breathGain)
  }

  private playOceanNight(): void {
    this.playOcean()

    // Add deeper bass
    const bass = this.ctx!.createOscillator()
    bass.frequency.value = 60
    bass.type = 'sine'

    const bassGain = this.ctx!.createGain()
    bassGain.gain.value = 0.08

    bass.connect(bassGain)
    bassGain.connect(this.masterGain!)
    bass.start()

    this.oscillators.push(bass)
    this.activeNodes.push(bassGain)
  }

  // === Instrumental ===

  private playFlute(): void {
    // Complete Divine Flute composition - Raga Yaman style
    // This creates a beautiful, soul-soothing flute meditation piece

    // Raga Yaman scale (Sa Re Ga Ma# Pa Dha Ni Sa)
    const ragaNotes: number[] = [
      261.63,   // Sa (C4)
      293.66,   // Re (D4)
      329.63,   // Ga (E4)
      369.99,   // Ma# (F#4)
      392,      // Pa (G4)
      440,      // Dha (A4)
      493.88,   // Ni (B4)
      523.25,   // Sa' (C5)
      587.33,   // Re' (D5)
      659.25    // Ga' (E5)
    ]

    // Melodic phrases typical of Raga Yaman
    const phrases: number[][] = [
      [4, 5, 6, 7, 6, 5, 4],           // Pa Dha Ni Sa' Ni Dha Pa
      [7, 6, 5, 4, 3, 4, 5],           // Sa' Ni Dha Pa Ma# Pa Dha
      [2, 3, 4, 5, 4, 3, 2, 0],        // Ga Ma# Pa Dha Pa Ma# Ga Sa
      [5, 6, 7, 8, 7, 6, 5],           // Dha Ni Sa' Re' Sa' Ni Dha
      [0, 2, 3, 4, 3, 2, 0],           // Sa Ga Ma# Pa Ma# Ga Sa
      [4, 5, 7, 8, 9, 8, 7, 5, 4],     // Pa Dha Sa' Re' Ga' Re' Sa' Dha Pa
    ]

    let currentPhrase = 0
    let noteInPhrase = 0

    // Play a flute note with breath-like quality
    const playFluteNote = (freq: number, duration: number): void => {
      // Main flute tone
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      // Add breathy overtones
      const osc2 = this.ctx!.createOscillator()
      osc2.frequency.value = freq * 2
      osc2.type = 'sine'

      // Vibrato for expression
      const vibrato = this.createLFO(5.5)
      const vibratoGain = this.ctx!.createGain()
      vibratoGain.gain.value = 4
      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc.frequency)
      vibrato.start()

      // Breath noise
      const noise = this.createNoise('white')
      const noiseFilter = this.ctx!.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = freq * 2
      noiseFilter.Q.value = 5

      const noiseGain = this.ctx!.createGain()
      noiseGain.gain.value = 0.01

      // Envelopes
      const gain = this.ctx!.createGain()
      gain.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, this.ctx!.currentTime + 0.15)
      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + duration - 0.5)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration)

      const gain2 = this.ctx!.createGain()
      gain2.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain2.gain.linearRampToValueAtTime(0.03, this.ctx!.currentTime + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration * 0.8)

      // Connect everything
      osc.connect(gain)
      osc2.connect(gain2)
      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)

      gain.connect(this.masterGain!)
      gain2.connect(this.masterGain!)
      noiseGain.connect(this.masterGain!)

      osc.start()
      osc2.start()
      noise.start()
      vibrato.start()

      osc.stop(this.ctx!.currentTime + duration)
      osc2.stop(this.ctx!.currentTime + duration * 0.8)
      noise.stop(this.ctx!.currentTime + duration)

      this.noiseSources.push(noise)
    }

    // Play melodic phrase
    const playPhrase = (): void => {
      const phrase = phrases[currentPhrase]

      phrase.forEach((noteIdx, i) => {
        this.addTimeout(setTimeout(() => {
          const freq = ragaNotes[noteIdx]
          const isLongNote = i === phrase.length - 1 || Math.random() > 0.7
          playFluteNote(freq, isLongNote ? 2.5 : 1.2)
        }, i * 800))
      })

      currentPhrase = (currentPhrase + 1) % phrases.length
    }

    // Tanpura drone (Sa and Pa)
    const droneNotes: number[] = [130.81, 196, 261.63] // C3, G3, C4
    droneNotes.forEach((freq, i) => {
      const drone = this.ctx!.createOscillator()
      drone.frequency.value = freq
      drone.type = 'sawtooth'

      const filter = this.ctx!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 600

      const droneGain = this.ctx!.createGain()
      droneGain.gain.value = 0.025

      // Slow swelling for tanpura effect
      const lfo = this.createLFO(0.3 + i * 0.1)
      const lfoGain = this.ctx!.createGain()
      lfoGain.gain.value = 0.008
      lfo.connect(lfoGain)
      lfoGain.connect(droneGain.gain)
      lfo.start()

      drone.connect(filter)
      filter.connect(droneGain)
      droneGain.connect(this.masterGain!)
      drone.start()

      this.oscillators.push(drone, lfo)
      this.activeNodes.push(filter, droneGain, lfoGain)
    })

    // Start melody
    playPhrase()
    this.addInterval(setInterval(playPhrase, 8000))

    // Occasional ornamental notes (gamak)
    this.addInterval(setInterval(() => {
      if (Math.random() > 0.6) {
        const idx = Math.floor(Math.random() * ragaNotes.length)
        playFluteNote(ragaNotes[idx], 0.8)
      }
    }, 2500))
  }

  private playPiano(): void {
    // Complete piano composition - "Peaceful Journey"
    // Beautiful chord progression with arpeggios and melody
    const chordProgressions: number[][] = [
      [261.63, 329.63, 392],        // C major
      [220, 261.63, 329.63],        // Am
      [349.23, 440, 523.25],        // F major
      [392, 493.88, 587.33],        // G major
      [261.63, 329.63, 392],        // C major
      [329.63, 392, 493.88],        // Em
      [349.23, 440, 523.25],        // F major
      [261.63, 329.63, 392]         // C major
    ]

    // Melody notes that complement the chords
    const melodySequences: number[][] = [
      [523.25, 587.33, 659.25, 587.33],  // Over C
      [523.25, 493.88, 440, 392],         // Over Am
      [523.25, 587.33, 698.46, 659.25],  // Over F
      [587.33, 659.25, 783.99, 659.25],  // Over G
      [659.25, 587.33, 523.25, 493.88],  // Over C
      [493.88, 523.25, 587.33, 523.25],  // Over Em
      [523.25, 493.88, 440, 523.25],     // Over F
      [523.25, 392, 329.63, 261.63]      // Over C (ending)
    ]

    let chordIndex = 0
    let melodyNoteIndex = 0

    // Play a single piano note with harmonics (piano-like timbre)
    const playPianoNote = (freq: number, volume: number, duration: number): void => {
      // Fundamental
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'triangle'

      // Add harmonics for richness
      const osc2 = this.ctx!.createOscillator()
      osc2.frequency.value = freq * 2
      osc2.type = 'sine'

      const osc3 = this.ctx!.createOscillator()
      osc3.frequency.value = freq * 3
      osc3.type = 'sine'

      const gain = this.ctx!.createGain()
      const gain2 = this.ctx!.createGain()
      const gain3 = this.ctx!.createGain()

      // Piano-like envelope - quick attack, gradual decay
      gain.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain.gain.linearRampToValueAtTime(volume, this.ctx!.currentTime + 0.02)
      gain.gain.setValueAtTime(volume * 0.7, this.ctx!.currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration)

      gain2.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain2.gain.linearRampToValueAtTime(volume * 0.3, this.ctx!.currentTime + 0.02)
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration * 0.7)

      gain3.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain3.gain.linearRampToValueAtTime(volume * 0.1, this.ctx!.currentTime + 0.02)
      gain3.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration * 0.5)

      osc.connect(gain)
      osc2.connect(gain2)
      osc3.connect(gain3)
      gain.connect(this.masterGain!)
      gain2.connect(this.masterGain!)
      gain3.connect(this.masterGain!)

      osc.start()
      osc2.start()
      osc3.start()
      osc.stop(this.ctx!.currentTime + duration)
      osc2.stop(this.ctx!.currentTime + duration * 0.7)
      osc3.stop(this.ctx!.currentTime + duration * 0.5)
    }

    // Play arpeggiated chord
    const playArpeggio = (): void => {
      const chord = chordProgressions[chordIndex]

      // Play chord notes as arpeggio (broken chord)
      chord.forEach((freq, i) => {
        this.addTimeout(setTimeout(() => {
          playPianoNote(freq, 0.06, 4)
        }, i * 300))
      })

      // Play bass note
      playPianoNote(chord[0] / 2, 0.08, 6)

      chordIndex = (chordIndex + 1) % chordProgressions.length
    }

    // Play melody notes
    const playMelody = (): void => {
      const melodyChordIndex = chordIndex % melodySequences.length
      const currentMelody = melodySequences[melodyChordIndex]
      const note = currentMelody[melodyNoteIndex % currentMelody.length]

      playPianoNote(note, 0.07, 2)
      melodyNoteIndex++
    }

    // Start playing
    playArpeggio()

    // Play arpeggios every 4 seconds
    this.addInterval(setInterval(playArpeggio, 4000))

    // Play melody notes every 1 second
    this.addInterval(setInterval(playMelody, 1000))

    // Soft sustain pedal effect - ambient pad
    const padFreqs: number[] = [130.81, 196, 261.63] // C2, G2, C3
    padFreqs.forEach(freq => {
      const pad = this.ctx!.createOscillator()
      pad.frequency.value = freq
      pad.type = 'sine'

      const padGain = this.ctx!.createGain()
      padGain.gain.value = 0.02

      // Slow tremolo for warmth
      const lfo = this.createLFO(0.15)
      const lfoGain = this.ctx!.createGain()
      lfoGain.gain.value = 0.005
      lfo.connect(lfoGain)
      lfoGain.connect(padGain.gain)
      lfo.start()

      pad.connect(padGain)
      padGain.connect(this.masterGain!)
      pad.start()

      this.oscillators.push(pad, lfo)
      this.activeNodes.push(padGain, lfoGain)
    })
  }

  private playSitar(): void {
    // Indian classical raga-like tones
    const notes: number[] = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88] // C major scale

    const playNote = (): void => {
      const freq: number = notes[Math.floor(Math.random() * notes.length)]

      // Main tone with harmonics
      ;[1, 2, 3, 4].forEach((harmonic) => {
        const osc = this.ctx!.createOscillator()
        osc.frequency.value = freq * harmonic
        osc.type = 'sawtooth'

        const filter = this.ctx!.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 2000
        filter.Q.value = 2

        const gain = this.ctx!.createGain()
        const baseGain = 0.06 / (harmonic * 1.5)
        gain.gain.setValueAtTime(baseGain, this.ctx!.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain!)
        osc.start()
        osc.stop(this.ctx!.currentTime + 4)
      })
    }

    // Tanpura drone
    const droneFreqs: number[] = [130.81, 196, 261.63] // C3, G3, C4
    droneFreqs.forEach(freq => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sawtooth'

      const filter = this.ctx!.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      const gain = this.ctx!.createGain()
      gain.gain.value = 0.03

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      this.oscillators.push(osc)
      this.activeNodes.push(filter, gain)
    })

    playNote()
    this.addInterval(setInterval(playNote, 3000))
  }

  // === Sacred ===

  private playOm(): void {
    // Om at 136.1 Hz (cosmic frequency)
    const osc = this.ctx!.createOscillator()
    osc.frequency.value = 136.1
    osc.type = 'sine'

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.2

    // Harmonics
    ;[2, 3, 4].forEach(harmonic => {
      const h = this.ctx!.createOscillator()
      h.frequency.value = 136.1 * harmonic
      h.type = 'sine'

      const hGain = this.ctx!.createGain()
      hGain.gain.value = 0.1 / harmonic

      h.connect(hGain)
      hGain.connect(this.masterGain!)
      h.start()

      this.oscillators.push(h)
      this.activeNodes.push(hGain)
    })

    // Slow amplitude breathing
    const lfo = this.createLFO(0.1)
    const lfoGain = this.ctx!.createGain()
    lfoGain.gain.value = 0.05
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()

    this.oscillators.push(osc, lfo)
    this.activeNodes.push(gain, lfoGain)
  }

  private playTempleBells(): void {
    const bellFreqs: number[] = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

    const ringBell = () => {
      const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)]

      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.setValueAtTime(0.15, this.ctx!.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 6)

      // Add harmonics for richness
      const osc2 = this.ctx!.createOscillator()
      osc2.frequency.value = freq * 2.4
      osc2.type = 'sine'

      const gain2 = this.ctx!.createGain()
      gain2.gain.setValueAtTime(0.05, this.ctx!.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 4)

      osc.connect(gain)
      osc2.connect(gain2)
      gain.connect(this.masterGain!)
      gain2.connect(this.masterGain!)

      osc.start()
      osc2.start()
      osc.stop(this.ctx!.currentTime + 6)
      osc2.stop(this.ctx!.currentTime + 4)
    }

    ringBell()
    this.addInterval(setInterval(ringBell, 5000))

    // Soft background
    const drone = this.ctx!.createOscillator()
    drone.frequency.value = 261.63
    drone.type = 'sine'

    const droneGain = this.ctx!.createGain()
    droneGain.gain.value = 0.03

    drone.connect(droneGain)
    droneGain.connect(this.masterGain!)
    drone.start()

    this.oscillators.push(drone)
    this.activeNodes.push(droneGain)
  }

  private playVedic(): void {
    // Deep chanting base note
    const base = this.ctx!.createOscillator()
    base.frequency.value = 130.81 // C3
    base.type = 'sawtooth'

    const baseFilter = this.ctx!.createBiquadFilter()
    baseFilter.type = 'lowpass'
    baseFilter.frequency.value = 500

    const baseGain = this.ctx!.createGain()
    baseGain.gain.value = 0.1

    base.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.masterGain!)
    base.start()

    // Harmonic overtones
    ;[2, 3, 4, 5].forEach(h => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = 130.81 * h
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0.04 / h

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      this.oscillators.push(osc)
      this.activeNodes.push(gain)
    })

    this.oscillators.push(base)
    this.activeNodes.push(baseFilter, baseGain)
  }

  // === Brainwave ===

  private playAlpha(): void {
    // Alpha waves: 8-12 Hz binaural beats
    const baseFreq = 200
    const beatFreq = 10 // 10 Hz alpha

    const oscL = this.ctx!.createOscillator()
    oscL.frequency.value = baseFreq
    oscL.type = 'sine'

    const oscR = this.ctx!.createOscillator()
    oscR.frequency.value = baseFreq + beatFreq
    oscR.type = 'sine'

    // Stereo panning
    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -1

    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 1

    const gainL = this.ctx!.createGain()
    gainL.gain.value = 0.1

    const gainR = this.ctx!.createGain()
    gainR.gain.value = 0.1

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    this.oscillators.push(oscL, oscR)
    this.activeNodes.push(gainL, gainR, panL, panR)
  }

  private playTheta(): void {
    // Theta waves: 4-8 Hz binaural beats
    const baseFreq = 150
    const beatFreq = 6 // 6 Hz theta

    const oscL = this.ctx!.createOscillator()
    oscL.frequency.value = baseFreq
    oscL.type = 'sine'

    const oscR = this.ctx!.createOscillator()
    oscR.frequency.value = baseFreq + beatFreq
    oscR.type = 'sine'

    const panL = this.ctx!.createStereoPanner()
    panL.pan.value = -1

    const panR = this.ctx!.createStereoPanner()
    panR.pan.value = 1

    const gainL = this.ctx!.createGain()
    gainL.gain.value = 0.12

    const gainR = this.ctx!.createGain()
    gainR.gain.value = 0.12

    oscL.connect(gainL)
    gainL.connect(panL)
    panL.connect(this.masterGain!)

    oscR.connect(gainR)
    gainR.connect(panR)
    panR.connect(this.masterGain!)

    oscL.start()
    oscR.start()

    // Add soft ambient layer
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200

    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.value = 0.08

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.oscillators.push(oscL, oscR)
    this.activeNodes.push(gainL, gainR, panL, panR, filter, noiseGain)
  }
}

// ============ Music Engine ============

const USER_TRACKS_KEY = 'mindvibe_user_tracks'

class SimpleMusicEngine {
  private synth: AudioSynthesizer
  private userAudio: HTMLAudioElement | null = null
  private userTracks: MusicTrack[] = []
  private currentTrack: MusicTrack | null = null
  private queue: MusicTrack[] = []
  private queueIndex: number = 0
  private volume: number = 0.7
  private isPlaying: boolean = false
  private onStateChange?: (state: PlayerState) => void
  private startTime: number = 0
  private timeInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.synth = new AudioSynthesizer()
    if (typeof window !== 'undefined') {
      this.userAudio = new Audio()
      this.userAudio.preload = 'metadata'
      this.setupUserAudioListeners()
      this.loadUserTracks()
    }
  }

  private setupUserAudioListeners(): void {
    if (!this.userAudio) return

    this.userAudio.addEventListener('ended', () => this.playNext())
    this.userAudio.addEventListener('timeupdate', () => this.notify())
    this.userAudio.addEventListener('play', () => {
      this.isPlaying = true
      this.notify()
    })
    this.userAudio.addEventListener('pause', () => {
      this.isPlaying = false
      this.notify()
    })
  }

  setOnStateChange(callback: (state: PlayerState) => void): void {
    this.onStateChange = callback
    this.notify()
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  private getCurrentTime(): number {
    if (this.currentTrack?.source === 'user' && this.userAudio) {
      return this.userAudio.currentTime
    }
    if (this.isPlaying && this.startTime) {
      return (Date.now() - this.startTime) / 1000
    }
    return 0
  }

  getState(): PlayerState {
    const currentTime = this.getCurrentTime()
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      currentTime: currentTime,
      duration: this.currentTrack?.duration || 300,
      volume: this.volume,
      queue: this.queue,
      queueIndex: this.queueIndex
    }
  }

  getAllTracks(): MusicTrack[] {
    return [...PRESET_TRACKS, ...this.userTracks]
  }

  getPresetTracks(): MusicTrack[] {
    return PRESET_TRACKS
  }

  getUserTracks(): MusicTrack[] {
    return this.userTracks
  }

  private loadUserTracks(): void {
    try {
      const stored = localStorage.getItem(USER_TRACKS_KEY)
      if (stored) {
        this.userTracks = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load user tracks:', e)
    }
  }

  private saveUserTracks(): void {
    try {
      localStorage.setItem(USER_TRACKS_KEY, JSON.stringify(this.userTracks))
    } catch (e) {
      console.error('Failed to save user tracks:', e)
    }
  }

  async addUserTrack(file: File): Promise<MusicTrack | null> {
    if (!file.type.startsWith('audio/')) {
      console.error('Invalid file type')
      return null
    }

    const url = URL.createObjectURL(file)
    const tempAudio = new Audio(url)

    await new Promise(resolve => {
      tempAudio.addEventListener('loadedmetadata', resolve)
      tempAudio.load()
    })

    const track: MusicTrack = {
      id: `user-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      duration: tempAudio.duration || 0,
      source: 'user',
      url: url,
      addedAt: Date.now()
    }

    this.userTracks.push(track)
    this.saveUserTracks()
    this.notify()

    return track
  }

  removeUserTrack(trackId: string): void {
    const track = this.userTracks.find(t => t.id === trackId)
    if (track) {
      URL.revokeObjectURL(track.url)
      this.userTracks = this.userTracks.filter(t => t.id !== trackId)
      this.saveUserTracks()
      this.notify()
    }
  }

  async play(track?: MusicTrack): Promise<void> {
    if (track) {
      // Stop current playback immediately
      this.synth.stop()
      if (this.userAudio) {
        this.userAudio.pause()
        this.userAudio.currentTime = 0
      }
      if (this.timeInterval) {
        clearInterval(this.timeInterval)
        this.timeInterval = null
      }

      // Update track and state immediately for responsive UI
      this.currentTrack = track
      this.isPlaying = true
      this.startTime = Date.now()
      this.notify() // Immediate notification for UI update

      if (track.source === 'user' && this.userAudio) {
        // Play user uploaded file
        this.userAudio.src = track.url
        this.userAudio.volume = this.volume
        try {
          await this.userAudio.play()
        } catch (e) {
          console.error('Playback error:', e)
          this.isPlaying = false
          this.notify()
        }
      } else if (track.soundType) {
        // Play synthesized preset
        try {
          await this.synth.playSoundType(track.soundType)
          this.synth.setVolume(this.volume)

          // Update time periodically
          this.timeInterval = setInterval(() => {
            this.notify()
            // Loop after duration
            if (this.getCurrentTime() >= (track.duration || 300)) {
              this.playNext()
            }
          }, 1000)
        } catch (e) {
          console.error('Synthesis error:', e)
          this.isPlaying = false
          this.notify()
        }
      }
    } else if (this.currentTrack) {
      // Resume
      if (this.currentTrack.source === 'user' && this.userAudio) {
        try {
          await this.userAudio.play()
          this.isPlaying = true
        } catch (e) {
          console.error('Resume error:', e)
        }
      } else {
        await this.play(this.currentTrack)
      }
      this.notify()
    }
  }

  pause(): void {
    this.synth.stop()
    if (this.userAudio) {
      this.userAudio.pause()
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
      this.timeInterval = null
    }
    this.isPlaying = false
    this.notify()
  }

  toggle(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  setQueue(tracks: MusicTrack[], startIndex: number = 0): void {
    this.queue = tracks
    this.queueIndex = startIndex
    if (tracks.length > 0) {
      this.play(tracks[startIndex])
    }
  }

  playNext(): void {
    if (this.queue.length === 0) return
    this.queueIndex = (this.queueIndex + 1) % this.queue.length
    this.play(this.queue[this.queueIndex])
  }

  playPrevious(): void {
    if (this.queue.length === 0) return
    this.queueIndex = this.queueIndex === 0 ? this.queue.length - 1 : this.queueIndex - 1
    this.play(this.queue[this.queueIndex])
  }

  seek(position: number): void {
    if (this.currentTrack?.source === 'user' && this.userAudio && this.userAudio.duration) {
      this.userAudio.currentTime = position * this.userAudio.duration
    } else if (this.currentTrack) {
      this.startTime = Date.now() - (position * (this.currentTrack.duration || 300) * 1000)
    }
    this.notify()
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    this.synth.setVolume(this.volume)
    if (this.userAudio) {
      this.userAudio.volume = this.volume
    }
    this.notify()
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  dispose(): void {
    this.synth.stop()
    if (this.userAudio) {
      this.userAudio.pause()
      this.userAudio.src = ''
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
  }
}

export const musicEngine = new SimpleMusicEngine()
export default musicEngine
