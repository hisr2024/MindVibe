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
// All tracks are from Pixabay's free audio collection (CC0/Pixabay License)

export const PRESET_TRACKS: MusicTrack[] = [
  // === NATURE SOUNDS ===
  {
    id: 'preset-rain-gentle',
    title: 'Gentle Rain',
    artist: 'Nature Ambience',
    duration: 600,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_58fcd61a7b.mp3'
  },
  {
    id: 'preset-ocean-waves',
    title: 'Ocean Waves',
    artist: 'Nature Ambience',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_f4c739491a.mp3'
  },
  {
    id: 'preset-forest-birds',
    title: 'Forest Birds Morning',
    artist: 'Nature Ambience',
    duration: 120,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/02/07/audio_6c5a1c43fa.mp3'
  },
  {
    id: 'preset-river-stream',
    title: 'Flowing River Stream',
    artist: 'Nature Ambience',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/07/26/audio_e205dc4c25.mp3'
  },
  {
    id: 'preset-night-crickets',
    title: 'Night Forest Crickets',
    artist: 'Nature Ambience',
    duration: 300,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2021/08/08/audio_ebee6e1a2c.mp3'
  },
  // === MEDITATION MUSIC ===
  {
    id: 'preset-meditation-calm',
    title: 'Calm Meditation',
    artist: 'Meditation Music',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_7c6d0d9fdd.mp3'
  },
  {
    id: 'preset-deep-relaxation',
    title: 'Deep Relaxation',
    artist: 'Ambient Meditation',
    duration: 240,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/08/03/audio_54fb8e8c0d.mp3'
  },
  {
    id: 'preset-peaceful-ambient',
    title: 'Peaceful Ambient',
    artist: 'Meditation Music',
    duration: 195,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2023/04/13/audio_ce71fd9bfe.mp3'
  },
  {
    id: 'preset-spiritual-awakening',
    title: 'Spiritual Awakening',
    artist: 'Healing Sounds',
    duration: 217,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_d1c7f0b0a2.mp3'
  },
  // === HEALING & WELLNESS ===
  {
    id: 'preset-singing-bowls',
    title: 'Tibetan Singing Bowls',
    artist: 'Healing Sounds',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/03/09/audio_5a9be2a9ca.mp3'
  },
  {
    id: 'preset-healing-tones',
    title: 'Healing Frequency Tones',
    artist: 'Sound Therapy',
    duration: 240,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2023/03/27/audio_0a15b62c7a.mp3'
  },
  {
    id: 'preset-zen-garden',
    title: 'Zen Garden Ambience',
    artist: 'Meditation Music',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/05/17/audio_c8e3f16c7d.mp3'
  },
  // === SLEEP & REST ===
  {
    id: 'preset-sleep-ambient',
    title: 'Sleep Ambient Music',
    artist: 'Sleep Sounds',
    duration: 300,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/06/02/audio_03ee1f4c2a.mp3'
  },
  {
    id: 'preset-night-rain',
    title: 'Rainy Night Relaxation',
    artist: 'Sleep Sounds',
    duration: 240,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2023/03/06/audio_2b25dc7c6b.mp3'
  },
  {
    id: 'preset-ocean-night',
    title: 'Ocean at Night',
    artist: 'Sleep Sounds',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_0e9a1961ba.mp3'
  },
  // === INSTRUMENTAL ===
  {
    id: 'preset-flute-meditation',
    title: 'Flute Meditation',
    artist: 'Instrumental',
    duration: 210,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_ab5726c84e.mp3'
  },
  {
    id: 'preset-piano-serenity',
    title: 'Piano Serenity',
    artist: 'Instrumental',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2023/10/31/audio_fc9e554c2a.mp3'
  },
  {
    id: 'preset-harp-dreams',
    title: 'Harp Dreams',
    artist: 'Instrumental',
    duration: 195,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2024/01/08/audio_dc39bea5c0.mp3'
  },
  // === SACRED SOUNDS ===
  {
    id: 'preset-om-chanting',
    title: 'Om Meditation Chant',
    artist: 'Sacred Sounds',
    duration: 300,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/08/23/audio_9d8a1c99f1.mp3'
  },
  {
    id: 'preset-temple-bells',
    title: 'Temple Bells',
    artist: 'Sacred Sounds',
    duration: 180,
    source: 'preset',
    url: 'https://cdn.pixabay.com/audio/2022/11/17/audio_c3e1c67be9.mp3'
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
