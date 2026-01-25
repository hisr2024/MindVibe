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
    this.oscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.oscillators = []

    if (this.noiseSource) {
      try { this.noiseSource.stop() } catch {}
      this.noiseSource = null
    }

    this.activeNodes.forEach(node => {
      try { node.disconnect() } catch {}
    })
    this.activeNodes = []
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
    const birdFreqs = [2000, 2400, 2800, 3200]
    birdFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0

      // Random chirp pattern
      const interval = 2000 + Math.random() * 3000
      setInterval(() => {
        if (Math.random() > 0.5) {
          gain.gain.setTargetAtTime(0.03, this.ctx!.currentTime, 0.01)
          gain.gain.setTargetAtTime(0, this.ctx!.currentTime + 0.1, 0.05)
        }
      }, interval)

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
    const cricketFreqs = [4000, 4200, 4400, 4600, 4800]

    cricketFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'square'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0

      // Cricket chirp pattern
      const baseInterval = 800 + i * 200
      let isChirping = false

      setInterval(() => {
        if (!isChirping && Math.random() > 0.3) {
          isChirping = true
          // Rapid on-off for chirping
          for (let j = 0; j < 5; j++) {
            setTimeout(() => {
              gain.gain.setTargetAtTime(0.01, this.ctx!.currentTime, 0.001)
              gain.gain.setTargetAtTime(0, this.ctx!.currentTime + 0.03, 0.001)
            }, j * 60)
          }
          setTimeout(() => { isChirping = false }, 400)
        }
      }, baseInterval)

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
    setInterval(() => {
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
    }, 5000)
  }

  // === Meditation ===

  private playMeditation(): void {
    // Soft pad with multiple harmonics
    const fundamentals = [220, 277.18, 329.63] // A3, C#4, E4 (A major chord)

    fundamentals.forEach(freq => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0.08

      // Slow tremolo
      const lfo = this.createLFO(0.1)
      const lfoGain = this.ctx!.createGain()
      lfoGain.gain.value = 0.02
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      this.oscillators.push(osc, lfo)
      this.activeNodes.push(gain, lfoGain)
    })

    // Add soft noise layer
    const noise = this.createNoise('pink')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500

    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.value = 0.03

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.activeNodes.push(filter, noiseGain)
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
    // Multiple singing bowl frequencies with rich harmonics
    const bowlFreqs = [256, 384, 512, 640] // C4 and harmonics

    bowlFreqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      const gain = this.ctx!.createGain()
      gain.gain.value = 0.1 / (i + 1)

      // Slow amplitude modulation for shimmering
      const lfo = this.createLFO(0.5 + i * 0.2)
      const lfoGain = this.ctx!.createGain()
      lfoGain.gain.value = 0.03 / (i + 1)
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()

      this.oscillators.push(osc, lfo)
      this.activeNodes.push(gain, lfoGain)
    })
  }

  private playChakra(): void {
    // Seven chakra frequencies
    const chakraFreqs = [
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
    setInterval(playNextChakra, 30000) // Change chakra every 30 seconds
  }

  private playZen(): void {
    // Soft bells and wind
    this.playForest()

    // Occasional bell tones
    setInterval(() => {
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
    }, 8000)
  }

  // === Sleep ===

  private playSleep(): void {
    // Deep delta wave base
    const osc = this.ctx!.createOscillator()
    osc.frequency.value = 100
    osc.type = 'sine'

    const gain = this.ctx!.createGain()
    gain.gain.value = 0.1

    // Very slow modulation
    const lfo = this.createLFO(0.05)
    const lfoGain = this.ctx!.createGain()
    lfoGain.gain.value = 0.03
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    lfo.start()

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start()

    // Soft brown noise
    const noise = this.createNoise('brown')
    const filter = this.ctx!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300

    const noiseGain = this.ctx!.createGain()
    noiseGain.gain.value = 0.15

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.masterGain!)
    noise.start()

    this.noiseSource = noise
    this.oscillators.push(osc, lfo)
    this.activeNodes.push(gain, lfoGain, filter, noiseGain)
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
    // Pentatonic scale flute-like tones
    const notes = [392, 440, 494, 587, 659] // G4, A4, B4, D5, E5
    let currentNote = 0

    const playNote = () => {
      const freq = notes[currentNote]
      const osc = this.ctx!.createOscillator()
      osc.frequency.value = freq
      osc.type = 'sine'

      // Add slight vibrato
      const vibrato = this.createLFO(5)
      const vibratoGain = this.ctx!.createGain()
      vibratoGain.gain.value = 3
      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc.frequency)
      vibrato.start()

      const gain = this.ctx!.createGain()
      gain.gain.setValueAtTime(0, this.ctx!.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, this.ctx!.currentTime + 0.3)
      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + 2)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 3)

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start()
      osc.stop(this.ctx!.currentTime + 3)

      currentNote = Math.floor(Math.random() * notes.length)
    }

    playNote()
    setInterval(playNote, 4000)

    // Background drone
    const drone = this.ctx!.createOscillator()
    drone.frequency.value = 196 // G3
    drone.type = 'sine'

    const droneGain = this.ctx!.createGain()
    droneGain.gain.value = 0.05

    drone.connect(droneGain)
    droneGain.connect(this.masterGain!)
    drone.start()

    this.oscillators.push(drone)
    this.activeNodes.push(droneGain)
  }

  private playPiano(): void {
    // Soft piano-like tones with harmonics
    const chords = [
      [261.63, 329.63, 392], // C major
      [293.66, 369.99, 440], // D minor
      [349.23, 440, 523.25], // F major
      [392, 493.88, 587.33]  // G major
    ]

    let chordIndex = 0

    const playChord = () => {
      chords[chordIndex].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator()
        osc.frequency.value = freq
        osc.type = 'triangle'

        const gain = this.ctx!.createGain()
        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 6)

        osc.connect(gain)
        gain.connect(this.masterGain!)
        osc.start()
        osc.stop(this.ctx!.currentTime + 6)
      })

      chordIndex = (chordIndex + 1) % chords.length
    }

    playChord()
    setInterval(playChord, 8000)
  }

  private playSitar(): void {
    // Indian classical raga-like tones
    const notes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88] // C major scale

    const playNote = () => {
      const freq = notes[Math.floor(Math.random() * notes.length)]

      // Main tone with harmonics
      [1, 2, 3, 4].forEach((harmonic, i) => {
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
    const droneFreqs = [130.81, 196, 261.63] // C3, G3, C4
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
    setInterval(playNote, 3000)
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
    [2, 3, 4].forEach(harmonic => {
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
    const bellFreqs = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

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
    setInterval(ringBell, 5000)

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
    [2, 3, 4, 5].forEach(h => {
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
      // Stop current playback
      this.synth.stop()
      if (this.userAudio) {
        this.userAudio.pause()
        this.userAudio.currentTime = 0
      }
      if (this.timeInterval) {
        clearInterval(this.timeInterval)
      }

      this.currentTrack = track

      if (track.source === 'user' && this.userAudio) {
        // Play user uploaded file
        this.userAudio.src = track.url
        this.userAudio.volume = this.volume
        try {
          await this.userAudio.play()
          this.isPlaying = true
        } catch (e) {
          console.error('Playback error:', e)
        }
      } else if (track.soundType) {
        // Play synthesized preset
        await this.synth.playSoundType(track.soundType)
        this.synth.setVolume(this.volume)
        this.isPlaying = true
        this.startTime = Date.now()

        // Update time periodically
        this.timeInterval = setInterval(() => {
          this.notify()
          // Loop after duration
          if (this.getCurrentTime() >= (track.duration || 300)) {
            this.playNext()
          }
        }, 1000)
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
    }

    this.notify()
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
