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
 * - Veena (वीणा) - Saraswati's instrument
 * - Sitar (सितार) - Classical string instrument
 * - Singing Bowl (गायन कटोरा) - Tibetan meditation bowl
 * - Temple Bells (मंदिर घंटी) - Sacred temple ambiance
 * - Om Chant (ॐ) - Sacred mantra
 * - Shankh (शंख) - Conch shell
 * - Ghungroo (घुंघरू) - Ankle bells
 * - Harmonium (हारमोनियम) - Devotional drone
 * - Nature - Rain, River, Birds, Forest, Ocean, Thunder, Waterfall, Crickets
 */

// ============ Types ============

export type SpiritualSound =
  | 'tanpura'
  | 'bansuri'
  | 'veena'
  | 'sitar'
  | 'singing_bowl'
  | 'temple_bells'
  | 'om'
  | 'shankh'
  | 'ghungroo'
  | 'harmonium'
  | 'rain'
  | 'river'
  | 'birds'
  | 'forest'
  | 'ocean'
  | 'wind'
  | 'thunder'
  | 'waterfall'
  | 'crickets'
  | 'fireplace'

export type SpiritualMood =
  | 'peace'           // शांति - Gentle tanpura + soft nature
  | 'devotion'        // भक्ति - Temple bells + om
  | 'meditation'      // ध्यान - Singing bowl + tanpura
  | 'krishna'         // कृष्ण - Bansuri flute
  | 'nature'          // प्रकृति - Pure nature sounds
  | 'sleep'           // निद्रा - Soft rain + gentle drone
  | 'morning'         // प्रभात - Dawn sounds
  | 'evening'         // संध्या - Twilight ambiance
  | 'temple'          // मंदिर - Full temple experience
  | 'rainy_day'       // वर्षा दिन - Monsoon ambiance
  | 'forest_night'    // वन रात्रि - Night forest
  | 'sacred_river'    // पवित्र नदी - Ganga-like ambiance
  | 'healing'         // उपचार - Gentle healing sounds
  | 'focus'           // एकाग्रता - Concentration support
  | 'gratitude'       // कृतज्ञता - Thankful meditation

export interface SoundConfig {
  id: SpiritualSound
  name: string
  nameHindi: string
  description: string
  category: 'spiritual' | 'nature' | 'instrumental'
}

export interface MoodConfig {
  id: SpiritualMood
  name: string
  nameHindi: string
  description: string
  sounds: SpiritualSound[]
  primaryColor: string
  duration?: number // suggested duration in minutes
}

export interface PlaylistTrack {
  id: string
  name: string
  nameHindi: string
  moods: SpiritualMood[]
  duration: number // in minutes
  description: string
}

// ============ Sound Definitions ============

export const SPIRITUAL_SOUNDS: Record<SpiritualSound, SoundConfig> = {
  tanpura: {
    id: 'tanpura',
    name: 'Tanpura',
    nameHindi: 'तानपूरा',
    description: 'Traditional drone instrument for meditation',
    category: 'instrumental'
  },
  bansuri: {
    id: 'bansuri',
    name: 'Bansuri Flute',
    nameHindi: 'बांसुरी',
    description: 'Krishna\'s divine bamboo flute',
    category: 'instrumental'
  },
  veena: {
    id: 'veena',
    name: 'Veena',
    nameHindi: 'वीणा',
    description: 'Saraswati\'s sacred string instrument',
    category: 'instrumental'
  },
  sitar: {
    id: 'sitar',
    name: 'Sitar',
    nameHindi: 'सितार',
    description: 'Classical Indian string instrument',
    category: 'instrumental'
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
  ghungroo: {
    id: 'ghungroo',
    name: 'Ghungroo',
    nameHindi: 'घुंघरू',
    description: 'Traditional ankle bells',
    category: 'spiritual'
  },
  harmonium: {
    id: 'harmonium',
    name: 'Harmonium',
    nameHindi: 'हारमोनियम',
    description: 'Devotional pump organ',
    category: 'instrumental'
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
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder',
    nameHindi: 'गर्जन',
    description: 'Distant thunder rumbles',
    category: 'nature'
  },
  waterfall: {
    id: 'waterfall',
    name: 'Waterfall',
    nameHindi: 'झरना',
    description: 'Cascading waterfall',
    category: 'nature'
  },
  crickets: {
    id: 'crickets',
    name: 'Crickets',
    nameHindi: 'झींगुर',
    description: 'Night cricket sounds',
    category: 'nature'
  },
  fireplace: {
    id: 'fireplace',
    name: 'Fireplace',
    nameHindi: 'अग्निकुंड',
    description: 'Crackling fire sounds',
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
    primaryColor: '#8B5CF6',
    duration: 15
  },
  devotion: {
    id: 'devotion',
    name: 'Devotion',
    nameHindi: 'भक्ति',
    description: 'Temple atmosphere for prayer',
    sounds: ['temple_bells', 'om', 'harmonium'],
    primaryColor: '#F59E0B',
    duration: 20
  },
  meditation: {
    id: 'meditation',
    name: 'Meditation',
    nameHindi: 'ध्यान',
    description: 'Deep meditation support',
    sounds: ['singing_bowl', 'tanpura'],
    primaryColor: '#6366F1',
    duration: 30
  },
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    nameHindi: 'कृष्ण',
    description: 'Divine flute of Krishna',
    sounds: ['bansuri', 'birds', 'river'],
    primaryColor: '#3B82F6',
    duration: 20
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    nameHindi: 'प्रकृति',
    description: 'Pure sounds of nature',
    sounds: ['forest', 'birds', 'river'],
    primaryColor: '#10B981',
    duration: 25
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    nameHindi: 'निद्रा',
    description: 'Gentle sounds for rest',
    sounds: ['rain', 'ocean'],
    primaryColor: '#6366F1',
    duration: 45
  },
  morning: {
    id: 'morning',
    name: 'Morning',
    nameHindi: 'प्रभात',
    description: 'Dawn meditation sounds',
    sounds: ['birds', 'temple_bells', 'tanpura'],
    primaryColor: '#F97316',
    duration: 15
  },
  evening: {
    id: 'evening',
    name: 'Evening',
    nameHindi: 'संध्या',
    description: 'Twilight prayer ambiance',
    sounds: ['shankh', 'temple_bells', 'crickets'],
    primaryColor: '#EC4899',
    duration: 20
  },
  temple: {
    id: 'temple',
    name: 'Temple',
    nameHindi: 'मंदिर',
    description: 'Full temple experience',
    sounds: ['temple_bells', 'shankh', 'om', 'ghungroo'],
    primaryColor: '#EAB308',
    duration: 25
  },
  rainy_day: {
    id: 'rainy_day',
    name: 'Rainy Day',
    nameHindi: 'वर्षा दिन',
    description: 'Monsoon meditation',
    sounds: ['rain', 'thunder', 'tanpura'],
    primaryColor: '#64748B',
    duration: 30
  },
  forest_night: {
    id: 'forest_night',
    name: 'Forest Night',
    nameHindi: 'वन रात्रि',
    description: 'Peaceful night forest',
    sounds: ['crickets', 'wind', 'fireplace'],
    primaryColor: '#1E293B',
    duration: 40
  },
  sacred_river: {
    id: 'sacred_river',
    name: 'Sacred River',
    nameHindi: 'पवित्र नदी',
    description: 'Like sitting by the Ganga',
    sounds: ['river', 'temple_bells', 'birds'],
    primaryColor: '#0EA5E9',
    duration: 25
  },
  healing: {
    id: 'healing',
    name: 'Healing',
    nameHindi: 'उपचार',
    description: 'Gentle healing vibrations',
    sounds: ['singing_bowl', 'veena', 'river'],
    primaryColor: '#14B8A6',
    duration: 30
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    nameHindi: 'एकाग्रता',
    description: 'Deep concentration',
    sounds: ['tanpura', 'rain'],
    primaryColor: '#8B5CF6',
    duration: 45
  },
  gratitude: {
    id: 'gratitude',
    name: 'Gratitude',
    nameHindi: 'कृतज्ञता',
    description: 'Thankful meditation',
    sounds: ['harmonium', 'singing_bowl', 'birds'],
    primaryColor: '#F472B6',
    duration: 15
  }
}

// ============ Playlists ============

export const MEDITATION_PLAYLISTS: PlaylistTrack[] = [
  {
    id: 'morning_sadhana',
    name: 'Morning Sadhana',
    nameHindi: 'प्रातः साधना',
    moods: ['morning', 'devotion', 'meditation', 'gratitude'],
    duration: 60,
    description: 'Complete morning spiritual practice'
  },
  {
    id: 'evening_shanti',
    name: 'Evening Shanti',
    nameHindi: 'संध्या शांति',
    moods: ['evening', 'temple', 'peace', 'sleep'],
    duration: 90,
    description: 'Wind down with evening prayers'
  },
  {
    id: 'deep_meditation',
    name: 'Deep Meditation',
    nameHindi: 'गहन ध्यान',
    moods: ['meditation', 'peace', 'healing'],
    duration: 75,
    description: 'Extended deep meditation session'
  },
  {
    id: 'nature_immersion',
    name: 'Nature Immersion',
    nameHindi: 'प्रकृति विसर्जन',
    moods: ['nature', 'sacred_river', 'forest_night'],
    duration: 90,
    description: 'Journey through natural soundscapes'
  },
  {
    id: 'sleep_journey',
    name: 'Sleep Journey',
    nameHindi: 'निद्रा यात्रा',
    moods: ['peace', 'rainy_day', 'sleep'],
    duration: 120,
    description: 'Gentle transition to restful sleep'
  },
  {
    id: 'krishna_bhakti',
    name: 'Krishna Bhakti',
    nameHindi: 'कृष्ण भक्ति',
    moods: ['krishna', 'devotion', 'gratitude'],
    duration: 45,
    description: 'Devotional journey with Krishna\'s flute'
  },
  {
    id: 'temple_visit',
    name: 'Temple Visit',
    nameHindi: 'मंदिर दर्शन',
    moods: ['temple', 'devotion', 'sacred_river', 'peace'],
    duration: 60,
    description: 'Virtual pilgrimage experience'
  },
  {
    id: 'healing_session',
    name: 'Healing Session',
    nameHindi: 'उपचार सत्र',
    moods: ['healing', 'peace', 'nature'],
    duration: 45,
    description: 'Restorative healing sounds'
  },
  {
    id: 'focus_work',
    name: 'Focus Work',
    nameHindi: 'एकाग्र कार्य',
    moods: ['focus', 'peace'],
    duration: 90,
    description: 'Deep work and concentration'
  },
  {
    id: 'monsoon_meditation',
    name: 'Monsoon Meditation',
    nameHindi: 'वर्षा ध्यान',
    moods: ['rainy_day', 'peace', 'meditation'],
    duration: 60,
    description: 'Meditate with monsoon sounds'
  }
]

// ============ Audio Engine ============

class SpiritualAudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeNodes: Map<string, { oscillators: OscillatorNode[], gains: GainNode[] }> = new Map()
  private isPlaying: boolean = false
  private currentMood: SpiritualMood | null = null
  private volume: number = 0.5

  // Playlist state
  private currentPlaylist: PlaylistTrack | null = null
  private playlistIndex: number = 0
  private playlistTimer: NodeJS.Timeout | null = null
  private isPlaylistMode: boolean = false
  private onPlaylistChange?: (mood: SpiritualMood, index: number) => void

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
      volume: this.volume,
      isPlaylistMode: this.isPlaylistMode,
      currentPlaylist: this.currentPlaylist,
      playlistIndex: this.playlistIndex
    }
  }

  // Set volume (0-1)
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext!.currentTime, 0.1)
    }
  }

  // Set playlist change callback
  setPlaylistChangeCallback(callback: (mood: SpiritualMood, index: number) => void): void {
    this.onPlaylistChange = callback
  }

  // Play a mood
  async play(mood: SpiritualMood): Promise<void> {
    await this.init()

    // Stop current if playing different mood
    if (this.isPlaying && this.currentMood !== mood) {
      await this.stopSounds()
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

  // Play a playlist
  async playPlaylist(playlistId: string): Promise<void> {
    const playlist = MEDITATION_PLAYLISTS.find(p => p.id === playlistId)
    if (!playlist) return

    this.currentPlaylist = playlist
    this.playlistIndex = 0
    this.isPlaylistMode = true

    await this.playCurrentPlaylistMood()
  }

  // Play current mood in playlist
  private async playCurrentPlaylistMood(): Promise<void> {
    if (!this.currentPlaylist || this.playlistIndex >= this.currentPlaylist.moods.length) {
      this.stopPlaylist()
      return
    }

    const currentMood = this.currentPlaylist.moods[this.playlistIndex]
    const moodConfig = SPIRITUAL_MOODS[currentMood]
    const duration = (moodConfig.duration || 15) * 60 * 1000 // Convert to ms

    await this.play(currentMood)

    // Notify callback
    if (this.onPlaylistChange) {
      this.onPlaylistChange(currentMood, this.playlistIndex)
    }

    // Schedule next mood
    this.playlistTimer = setTimeout(() => {
      this.playlistIndex++
      this.playCurrentPlaylistMood()
    }, duration)
  }

  // Stop playlist
  stopPlaylist(): void {
    if (this.playlistTimer) {
      clearTimeout(this.playlistTimer)
      this.playlistTimer = null
    }
    this.currentPlaylist = null
    this.playlistIndex = 0
    this.isPlaylistMode = false
    this.stop()
  }

  // Skip to next in playlist
  async nextInPlaylist(): Promise<void> {
    if (!this.isPlaylistMode || !this.currentPlaylist) return

    if (this.playlistTimer) {
      clearTimeout(this.playlistTimer)
    }

    this.playlistIndex++
    if (this.playlistIndex >= this.currentPlaylist.moods.length) {
      this.playlistIndex = 0 // Loop back
    }

    await this.playCurrentPlaylistMood()
  }

  // Go to previous in playlist
  async prevInPlaylist(): Promise<void> {
    if (!this.isPlaylistMode || !this.currentPlaylist) return

    if (this.playlistTimer) {
      clearTimeout(this.playlistTimer)
    }

    this.playlistIndex--
    if (this.playlistIndex < 0) {
      this.playlistIndex = this.currentPlaylist.moods.length - 1
    }

    await this.playCurrentPlaylistMood()
  }

  // Stop just sounds (not playlist)
  private async stopSounds(): Promise<void> {
    if (!this.audioContext) return

    const now = this.audioContext.currentTime

    for (const [, nodes] of this.activeNodes) {
      for (const gain of nodes.gains) {
        gain.gain.setTargetAtTime(0, now, 0.3)
      }

      setTimeout(() => {
        for (const osc of nodes.oscillators) {
          try { osc.stop() } catch {}
        }
      }, 500)
    }

    this.activeNodes.clear()
  }

  // Stop all sounds
  async stop(): Promise<void> {
    await this.stopSounds()
    this.isPlaying = false
    this.currentMood = null

    if (this.isPlaylistMode) {
      this.stopPlaylist()
    }
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
      case 'veena':
        this.createVeena(oscillators, gains, now)
        break
      case 'sitar':
        this.createSitar(oscillators, gains, now)
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
      case 'ghungroo':
        this.createGhungroo(oscillators, gains, now)
        break
      case 'harmonium':
        this.createHarmonium(oscillators, gains, now)
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
      case 'thunder':
        this.createThunder(oscillators, gains, now)
        break
      case 'waterfall':
        this.createWaterfall(oscillators, gains, now)
        break
      case 'crickets':
        this.createCrickets(oscillators, gains, now)
        break
      case 'fireplace':
        this.createFireplace(oscillators, gains, now)
        break
    }

    this.activeNodes.set(soundId, { oscillators, gains })
  }

  // ============ Sound Generators ============

  // Tanpura - Traditional Indian drone
  private createTanpura(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const saFreq = 130.81
    const paFreq = 196.00

    const frequencies = [saFreq, saFreq * 2, paFreq, saFreq * 0.5]

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      osc.type = 'sawtooth'
      osc.frequency.value = freq

      filter.type = 'lowpass'
      filter.frequency.value = 800
      filter.Q.value = 1

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
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00]

    const osc = this.audioContext!.createOscillator()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    osc.type = 'sine'
    filter.type = 'lowpass'
    filter.frequency.value = 2000

    const melodyLoop = () => {
      if (!this.isPlaying) return

      const note = notes[Math.floor(Math.random() * notes.length)]
      const duration = 2 + Math.random() * 3

      osc.frequency.setTargetAtTime(note, this.audioContext!.currentTime, 0.5)
      gain.gain.setTargetAtTime(0.08 + Math.random() * 0.04, this.audioContext!.currentTime, 0.3)

      setTimeout(() => {
        if (this.isPlaying) {
          gain.gain.setTargetAtTime(0.02, this.audioContext!.currentTime, 0.5)
        }
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

  // Veena - Saraswati's instrument
  private createVeena(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const notes = [146.83, 164.81, 196.00, 220.00, 246.94] // D3, E3, G3, A3, B3

    const noteLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime
      const note = notes[Math.floor(Math.random() * notes.length)]

      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.value = note

      filter.type = 'lowpass'
      filter.frequency.value = 1500

      // Pluck envelope
      gain.gain.setValueAtTime(0.1, currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 2)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(currentTime)
      osc.stop(currentTime + 2.5)

      setTimeout(noteLoop, 3000 + Math.random() * 4000)
    }

    setTimeout(noteLoop, 1000)
  }

  // Sitar - Classical string instrument
  private createSitar(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const notes = [130.81, 146.83, 164.81, 196.00, 220.00] // C3-A3

    const noteLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime
      const note = notes[Math.floor(Math.random() * notes.length)]

      // Main note with sympathetic strings
      const sitarHarmonics: number[] = [1, 2, 3, 4, 5]
      sitarHarmonics.forEach((ratio: number, i: number) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sawtooth'
        osc.frequency.value = note * ratio

        const amplitude = 0.06 / (i + 1)
        gain.gain.setValueAtTime(amplitude, currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 3)

        const filter = this.audioContext!.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1200

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain!)

        osc.start(currentTime)
        osc.stop(currentTime + 3.5)
      })

      setTimeout(noteLoop, 4000 + Math.random() * 5000)
    }

    setTimeout(noteLoop, 500)
  }

  // Singing Bowl - Tibetan meditation bowl
  private createSingingBowl(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const bowlLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const fundamental = 200 + Math.random() * 100
      const currentTime = this.audioContext.currentTime

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
    const osc = this.audioContext!.createOscillator()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.value = 136.1

    filter.type = 'lowpass'
    filter.frequency.value = 400

    const lfo = this.audioContext!.createOscillator()
    const lfoGain = this.audioContext!.createGain()
    lfo.frequency.value = 0.08
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

  // Ghungroo - Ankle bells
  private createGhungroo(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const bellLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime

      // Multiple tiny bells
      for (let j = 0; j < 3; j++) {
        const freq = 2000 + Math.random() * 1000
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq

        gain.gain.setValueAtTime(0.03, currentTime + j * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + j * 0.05 + 0.3)

        osc.connect(gain)
        gain.connect(this.masterGain!)

        osc.start(currentTime + j * 0.05)
        osc.stop(currentTime + j * 0.05 + 0.4)
      }

      setTimeout(bellLoop, 2000 + Math.random() * 4000)
    }

    bellLoop()
  }

  // Harmonium - Devotional drone
  private createHarmonium(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Chord: Sa-Ga-Pa (C-E-G)
    const chordFreqs = [130.81, 164.81, 196.00]

    chordFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      osc.type = 'sawtooth'
      osc.frequency.value = freq

      filter.type = 'lowpass'
      filter.frequency.value = 600

      // Breathing modulation like bellows
      const lfo = this.audioContext!.createOscillator()
      const lfoGain = this.audioContext!.createGain()
      lfo.frequency.value = 0.15
      lfoGain.gain.value = 0.03

      gain.gain.setValueAtTime(0, now)
      gain.gain.setTargetAtTime(0.08, now, 1)

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

  // Rain
  private createRain(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
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

    const dummyOsc = this.audioContext!.createOscillator()
    dummyOsc.frequency.value = 0
    oscillators.push(dummyOsc)
    gains.push(gain)
  }

  // River
  private createRiver(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
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

      setTimeout(birdLoop, 1000 + Math.random() * 4000)
    }

    birdLoop()
  }

  // Forest
  private createForest(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    this.createWind(oscillators, gains, now)
    setTimeout(() => this.createBirds([], [], now), 2000)
  }

  // Ocean
  private createOcean(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

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

    const lfo = this.audioContext!.createOscillator()
    const lfoGain = this.audioContext!.createGain()
    lfo.frequency.value = 0.1
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

  // Thunder
  private createThunder(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const thunderLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime

      // Low rumble
      const bufferSize = this.audioContext.sampleRate
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)

      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + (0.01 * white)) / 1.01
        lastOut = data[i]
        data[i] *= 5
      }

      const source = this.audioContext.createBufferSource()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      source.buffer = buffer

      filter.type = 'lowpass'
      filter.frequency.value = 200

      gain.gain.setValueAtTime(0, currentTime)
      gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 3)

      source.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)

      source.start(currentTime)
      source.stop(currentTime + 4)

      setTimeout(thunderLoop, 10000 + Math.random() * 20000)
    }

    setTimeout(thunderLoop, 5000)
  }

  // Waterfall
  private createWaterfall(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

    // White noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.audioContext!.createBufferSource()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    source.buffer = buffer
    source.loop = true

    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.3

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.2, now, 1)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    source.start(now)

    gains.push(gain)
  }

  // Crickets
  private createCrickets(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    const cricketLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime
      const freq = 4000 + Math.random() * 1000

      // Chirp pattern
      for (let i = 0; i < 3; i++) {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq

        const startTime = currentTime + i * 0.1
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.02, startTime + 0.02)
        gain.gain.linearRampToValueAtTime(0, startTime + 0.08)

        osc.connect(gain)
        gain.connect(this.masterGain!)

        osc.start(startTime)
        osc.stop(startTime + 0.1)
      }

      setTimeout(cricketLoop, 500 + Math.random() * 2000)
    }

    cricketLoop()
  }

  // Fireplace
  private createFireplace(oscillators: OscillatorNode[], gains: GainNode[], now: number): void {
    // Crackling fire
    const crackleLoop = () => {
      if (!this.isPlaying || !this.audioContext) return

      const currentTime = this.audioContext.currentTime

      // Random crackle
      const bufferSize = Math.floor(this.audioContext.sampleRate * 0.1)
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.random()
      }

      const source = this.audioContext.createBufferSource()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      source.buffer = buffer

      filter.type = 'bandpass'
      filter.frequency.value = 1000 + Math.random() * 2000
      filter.Q.value = 2

      gain.gain.setValueAtTime(0.1, currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1)

      source.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)

      source.start(currentTime)

      setTimeout(crackleLoop, 100 + Math.random() * 300)
    }

    // Base fire rumble
    const bufferSize = this.audioContext!.sampleRate * 2
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate)
    const data = buffer.getChannelData(0)

    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + (0.02 * white)) / 1.02
      lastOut = data[i]
      data[i] *= 2
    }

    const source = this.audioContext!.createBufferSource()
    const gain = this.audioContext!.createGain()
    const filter = this.audioContext!.createBiquadFilter()

    source.buffer = buffer
    source.loop = true

    filter.type = 'lowpass'
    filter.frequency.value = 300

    gain.gain.setValueAtTime(0, now)
    gain.gain.setTargetAtTime(0.08, now, 1)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)

    source.start(now)
    crackleLoop()

    gains.push(gain)
  }

  // Cleanup
  dispose(): void {
    this.stopPlaylist()
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
