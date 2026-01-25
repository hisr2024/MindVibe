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
// Add your meditation music files to /public/audio/music/

export const PRESET_TRACKS: MusicTrack[] = [
  {
    id: 'preset-1',
    title: 'Morning Raga - Bhairav',
    artist: 'Traditional',
    duration: 1800,
    source: 'preset',
    url: '/audio/music/morning-raga-bhairav.mp3'
  },
  {
    id: 'preset-2',
    title: 'Evening Raga - Yaman',
    artist: 'Traditional',
    duration: 2100,
    source: 'preset',
    url: '/audio/music/evening-raga-yaman.mp3'
  },
  {
    id: 'preset-3',
    title: 'Deep Meditation',
    artist: 'Ambient',
    duration: 3600,
    source: 'preset',
    url: '/audio/music/deep-meditation.mp3'
  },
  {
    id: 'preset-4',
    title: 'Peaceful Sleep',
    artist: 'Ambient',
    duration: 5400,
    source: 'preset',
    url: '/audio/music/peaceful-sleep.mp3'
  },
  {
    id: 'preset-5',
    title: 'Nature - Forest Morning',
    artist: 'Nature Sounds',
    duration: 2700,
    source: 'preset',
    url: '/audio/music/forest-morning.mp3'
  },
  {
    id: 'preset-6',
    title: 'Nature - Flowing River',
    artist: 'Nature Sounds',
    duration: 3000,
    source: 'preset',
    url: '/audio/music/flowing-river.mp3'
  },
  {
    id: 'preset-7',
    title: 'Om Meditation',
    artist: 'Sacred Chants',
    duration: 1800,
    source: 'preset',
    url: '/audio/music/om-meditation.mp3'
  },
  {
    id: 'preset-8',
    title: 'Flute Serenity',
    artist: 'Instrumental',
    duration: 2400,
    source: 'preset',
    url: '/audio/music/flute-serenity.mp3'
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
