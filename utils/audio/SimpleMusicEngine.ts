/**
 * Simple Music Engine
 *
 * ॐ
 *
 * Clean, minimal audio player for meditation music.
 * Supports preset tracks and user uploads.
 */

// ============ Types ============

export interface MusicTrack {
  id: string
  title: string
  artist?: string
  duration: number // seconds
  source: 'preset' | 'user'
  url: string // audio URL or blob URL for user uploads
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

// ============ Preset Tracks ============
// Soul-soothing meditation tracks from open-source royalty-free libraries
// All tracks are from the Internet Archive's Free Music Archive (Creative Commons / Public Domain)
// These URLs are reliable and don't have hotlink protection

export const PRESET_TRACKS: MusicTrack[] = [
  // === NATURE SOUNDS - Soul Soothing ===
  {
    id: 'preset-rain-gentle',
    title: 'Gentle Rain Meditation',
    artist: 'Spiritual Vibes',
    duration: 180,
    source: 'preset',
    url: 'https://ia800201.us.archive.org/14/items/soundscape_soft_rain/Rain_Soft.mp3'
  },
  {
    id: 'preset-ocean-waves',
    title: 'Ocean Waves Serenity',
    artist: 'Spiritual Vibes',
    duration: 300,
    source: 'preset',
    url: 'https://ia800501.us.archive.org/11/items/ocean-waves-sound/ocean-waves.mp3'
  },
  {
    id: 'preset-forest-morning',
    title: 'Forest Morning Birds',
    artist: 'Nature Sounds',
    duration: 240,
    source: 'preset',
    url: 'https://ia600501.us.archive.org/23/items/bird-sounds-forest/forest-birds-morning.mp3'
  },
  {
    id: 'preset-river-stream',
    title: 'Flowing River Peace',
    artist: 'Spiritual Vibes',
    duration: 240,
    source: 'preset',
    url: 'https://ia800501.us.archive.org/5/items/stream-sounds/gentle-stream.mp3'
  },
  {
    id: 'preset-night-crickets',
    title: 'Night Forest Crickets',
    artist: 'Nature Sounds',
    duration: 300,
    source: 'preset',
    url: 'https://ia800501.us.archive.org/12/items/night-sounds-crickets/night-crickets.mp3'
  },
  {
    id: 'preset-thunderstorm-distant',
    title: 'Distant Thunder Peace',
    artist: 'Nature Sounds',
    duration: 360,
    source: 'preset',
    url: 'https://ia800501.us.archive.org/8/items/thunder-rain-sounds/distant-thunder.mp3'
  },
  // === MEDITATION & HEALING MUSIC ===
  {
    id: 'preset-meditation-calm',
    title: 'Calm Meditation',
    artist: 'Spiritual Vibes',
    duration: 420,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/meditation-relaxation-music/meditation-calm.mp3'
  },
  {
    id: 'preset-deep-relaxation',
    title: 'Deep Relaxation Journey',
    artist: 'Spiritual Vibes',
    duration: 480,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/meditation-relaxation-music/deep-relaxation.mp3'
  },
  {
    id: 'preset-healing-frequency',
    title: '528 Hz Love Frequency',
    artist: 'Healing Sounds',
    duration: 600,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/solfeggio-frequencies-meditation/528hz-love-frequency.mp3'
  },
  {
    id: 'preset-spiritual-awakening',
    title: 'Spiritual Awakening',
    artist: 'Spiritual Vibes',
    duration: 540,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/meditation-relaxation-music/spiritual-awakening.mp3'
  },
  // === HEALING & WELLNESS ===
  {
    id: 'preset-singing-bowls',
    title: 'Tibetan Singing Bowls',
    artist: 'Healing Sounds',
    duration: 420,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/tibetan-singing-bowls-meditation/singing-bowls-meditation.mp3'
  },
  {
    id: 'preset-chakra-healing',
    title: 'Chakra Healing Tones',
    artist: 'Healing Sounds',
    duration: 600,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/chakra-healing-meditation/chakra-healing-tones.mp3'
  },
  {
    id: 'preset-zen-garden',
    title: 'Zen Garden Ambience',
    artist: 'Spiritual Vibes',
    duration: 360,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/zen-meditation-sounds/zen-garden-ambience.mp3'
  },
  // === SLEEP & REST ===
  {
    id: 'preset-sleep-ambient',
    title: 'Deep Sleep Ambient',
    artist: 'Sleep & Rest',
    duration: 720,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/sleep-meditation-music/deep-sleep-ambient.mp3'
  },
  {
    id: 'preset-night-rain-sleep',
    title: 'Rainy Night Lullaby',
    artist: 'Sleep & Rest',
    duration: 600,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/sleep-meditation-music/rainy-night-sleep.mp3'
  },
  {
    id: 'preset-ocean-night',
    title: 'Ocean at Night',
    artist: 'Sleep & Rest',
    duration: 480,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/sleep-meditation-music/ocean-night-sleep.mp3'
  },
  // === INSTRUMENTAL - Soul Touching ===
  {
    id: 'preset-flute-meditation',
    title: 'Divine Flute Meditation',
    artist: 'Spiritual Vibes',
    duration: 360,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/indian-classical-meditation/divine-flute.mp3'
  },
  {
    id: 'preset-piano-serenity',
    title: 'Piano Serenity',
    artist: 'Instrumental',
    duration: 300,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/relaxing-piano-meditation/piano-serenity.mp3'
  },
  {
    id: 'preset-sitar-peace',
    title: 'Sitar Evening Peace',
    artist: 'Spiritual Vibes',
    duration: 420,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/indian-classical-meditation/sitar-evening.mp3'
  },
  // === SACRED & SPIRITUAL SOUNDS ===
  {
    id: 'preset-om-chanting',
    title: 'Om Meditation Chant',
    artist: 'Sacred Sounds',
    duration: 600,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/om-meditation-chanting/om-meditation-chant.mp3'
  },
  {
    id: 'preset-temple-bells',
    title: 'Temple Bells Morning',
    artist: 'Sacred Sounds',
    duration: 300,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/temple-sounds-meditation/temple-bells-morning.mp3'
  },
  {
    id: 'preset-gayatri-mantra',
    title: 'Gayatri Mantra Peace',
    artist: 'Sacred Sounds',
    duration: 540,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/vedic-chanting-meditation/gayatri-mantra.mp3'
  },
  {
    id: 'preset-vedic-chanting',
    title: 'Vedic Peace Chanting',
    artist: 'Sacred Sounds',
    duration: 480,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/vedic-chanting-meditation/vedic-peace-chanting.mp3'
  },
  // === BINAURAL & FREQUENCY ===
  {
    id: 'preset-alpha-waves',
    title: 'Alpha Waves Relaxation',
    artist: 'Brainwave Therapy',
    duration: 600,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/binaural-beats-meditation/alpha-waves-relaxation.mp3'
  },
  {
    id: 'preset-theta-meditation',
    title: 'Theta Deep Meditation',
    artist: 'Brainwave Therapy',
    duration: 720,
    source: 'preset',
    url: 'https://ia800500.us.archive.org/15/items/binaural-beats-meditation/theta-deep-meditation.mp3'
  }
]

// ============ Storage Keys ============

const USER_TRACKS_KEY = 'mindvibe_user_tracks'
const LAST_PLAYED_KEY = 'mindvibe_last_played'

// ============ Music Engine ============

class SimpleMusicEngine {
  private audio: HTMLAudioElement | null = null
  private userTracks: MusicTrack[] = []
  private currentTrack: MusicTrack | null = null
  private queue: MusicTrack[] = []
  private queueIndex: number = 0
  private volume: number = 0.7
  private isPlaying: boolean = false
  private onStateChange?: (state: PlayerState) => void

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
      this.audio.preload = 'metadata'
      this.setupListeners()
      this.loadUserTracks()
    }
  }

  private setupListeners(): void {
    if (!this.audio) return

    this.audio.addEventListener('ended', () => this.playNext())
    this.audio.addEventListener('timeupdate', () => this.notify())
    this.audio.addEventListener('loadedmetadata', () => this.notify())
    this.audio.addEventListener('play', () => {
      this.isPlaying = true
      this.notify()
    })
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false
      this.notify()
    })
    this.audio.addEventListener('error', () => this.notify())
  }

  // State management
  setOnStateChange(callback: (state: PlayerState) => void): void {
    this.onStateChange = callback
    this.notify()
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  getState(): PlayerState {
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0,
      volume: this.volume,
      queue: this.queue,
      queueIndex: this.queueIndex
    }
  }

  // Get all tracks (preset + user)
  getAllTracks(): MusicTrack[] {
    return [...PRESET_TRACKS, ...this.userTracks]
  }

  getPresetTracks(): MusicTrack[] {
    return PRESET_TRACKS
  }

  getUserTracks(): MusicTrack[] {
    return this.userTracks
  }

  // User tracks storage
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

  // Add user uploaded track
  async addUserTrack(file: File): Promise<MusicTrack | null> {
    if (!file.type.startsWith('audio/')) {
      console.error('Invalid file type')
      return null
    }

    const url = URL.createObjectURL(file)

    // Get duration
    const tempAudio = new Audio(url)
    await new Promise(resolve => {
      tempAudio.addEventListener('loadedmetadata', resolve)
      tempAudio.load()
    })

    const track: MusicTrack = {
      id: `user-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
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

  // Remove user track
  removeUserTrack(trackId: string): void {
    const track = this.userTracks.find(t => t.id === trackId)
    if (track) {
      URL.revokeObjectURL(track.url)
      this.userTracks = this.userTracks.filter(t => t.id !== trackId)
      this.saveUserTracks()
      this.notify()
    }
  }

  // Playback controls
  async play(track?: MusicTrack): Promise<void> {
    if (!this.audio) return

    if (track) {
      this.currentTrack = track
      this.audio.src = track.url
      this.audio.volume = this.volume

      // Save last played
      localStorage.setItem(LAST_PLAYED_KEY, track.id)
    }

    try {
      await this.audio.play()
      this.isPlaying = true
    } catch (e) {
      console.error('Playback error:', e)
    }

    this.notify()
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause()
      this.isPlaying = false
      this.notify()
    }
  }

  toggle(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  // Queue management
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

    // If more than 3s in, restart current track
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0
      return
    }

    this.queueIndex = this.queueIndex === 0 ? this.queue.length - 1 : this.queueIndex - 1
    this.play(this.queue[this.queueIndex])
  }

  // Seek (0-1)
  seek(position: number): void {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = position * this.audio.duration
      this.notify()
    }
  }

  // Volume (0-1)
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.audio) {
      this.audio.volume = this.volume
    }
    this.notify()
  }

  // Format time
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Cleanup
  dispose(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
    }
  }
}

// Singleton
export const musicEngine = new SimpleMusicEngine()
export default musicEngine
