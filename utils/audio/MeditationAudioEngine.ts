/**
 * Meditation Audio Engine - Natural Ultra HD Music
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Simple audio player for natural meditation music.
 * Uses real audio files - no synthesized/gimmicky sounds.
 */

// ============ Types ============

export interface MeditationTrack {
  id: string
  title: string
  titleHindi: string
  artist?: string
  duration: number // in seconds
  audioUrl: string
  coverUrl?: string
  category: MeditationCategory
}

export type MeditationCategory =
  | 'morning'      // प्रभात - Morning ragas
  | 'evening'      // संध्या - Evening ragas
  | 'meditation'   // ध्यान - Deep meditation
  | 'sleep'        // निद्रा - Sleep music
  | 'nature'       // प्रकृति - Nature ambience
  | 'devotional'   // भक्ति - Devotional music
  | 'instrumental' // वाद्य - Instrumental

export interface MeditationPlaylist {
  id: string
  name: string
  nameHindi: string
  description: string
  coverUrl?: string
  tracks: string[] // Track IDs
  duration: number // Total duration in minutes
}

export interface PlayerState {
  isPlaying: boolean
  currentTrack: MeditationTrack | null
  currentPlaylist: MeditationPlaylist | null
  currentTime: number
  duration: number
  volume: number
  isLoading: boolean
  error: string | null
}

// ============ Category Info ============

export const CATEGORY_INFO: Record<MeditationCategory, {
  name: string
  nameHindi: string
  description: string
  color: string
}> = {
  morning: {
    name: 'Morning',
    nameHindi: 'प्रभात',
    description: 'Peaceful morning ragas to start your day',
    color: '#F97316'
  },
  evening: {
    name: 'Evening',
    nameHindi: 'संध्या',
    description: 'Calming evening melodies for reflection',
    color: '#EC4899'
  },
  meditation: {
    name: 'Meditation',
    nameHindi: 'ध्यान',
    description: 'Deep meditation music for inner peace',
    color: '#8B5CF6'
  },
  sleep: {
    name: 'Sleep',
    nameHindi: 'निद्रा',
    description: 'Gentle music for restful sleep',
    color: '#6366F1'
  },
  nature: {
    name: 'Nature',
    nameHindi: 'प्रकृति',
    description: 'Natural ambient soundscapes',
    color: '#10B981'
  },
  devotional: {
    name: 'Devotional',
    nameHindi: 'भक्ति',
    description: 'Sacred devotional music',
    color: '#F59E0B'
  },
  instrumental: {
    name: 'Instrumental',
    nameHindi: 'वाद्य',
    description: 'Classical instrumental pieces',
    color: '#3B82F6'
  }
}

// ============ Sample Tracks ============
// Note: Replace these URLs with actual meditation music files

export const MEDITATION_TRACKS: MeditationTrack[] = [
  // Morning Ragas
  {
    id: 'morning-raga-1',
    title: 'Raga Bhairav - Dawn Meditation',
    titleHindi: 'राग भैरव - प्रातः ध्यान',
    artist: 'Classical Masters',
    duration: 1800, // 30 min
    audioUrl: '/audio/meditation/morning-raga-bhairav.mp3',
    category: 'morning'
  },
  {
    id: 'morning-raga-2',
    title: 'Raga Todi - Morning Peace',
    titleHindi: 'राग तोड़ी - प्रातः शांति',
    artist: 'Classical Masters',
    duration: 1500, // 25 min
    audioUrl: '/audio/meditation/morning-raga-todi.mp3',
    category: 'morning'
  },

  // Evening Ragas
  {
    id: 'evening-raga-1',
    title: 'Raga Yaman - Evening Serenity',
    titleHindi: 'राग यमन - संध्या शांति',
    artist: 'Classical Masters',
    duration: 2100, // 35 min
    audioUrl: '/audio/meditation/evening-raga-yaman.mp3',
    category: 'evening'
  },
  {
    id: 'evening-raga-2',
    title: 'Raga Puriya - Twilight Calm',
    titleHindi: 'राग पूरिया - गोधूलि शांति',
    artist: 'Classical Masters',
    duration: 1800, // 30 min
    audioUrl: '/audio/meditation/evening-raga-puriya.mp3',
    category: 'evening'
  },

  // Deep Meditation
  {
    id: 'meditation-1',
    title: 'Deep Meditation - Tanpura Drone',
    titleHindi: 'गहन ध्यान - तानपूरा',
    duration: 3600, // 60 min
    audioUrl: '/audio/meditation/deep-tanpura-drone.mp3',
    category: 'meditation'
  },
  {
    id: 'meditation-2',
    title: 'Mindful Silence - Ambient',
    titleHindi: 'सचेत मौन - परिवेश',
    duration: 2700, // 45 min
    audioUrl: '/audio/meditation/mindful-silence.mp3',
    category: 'meditation'
  },
  {
    id: 'meditation-3',
    title: 'Inner Journey - Flute Meditation',
    titleHindi: 'आंतरिक यात्रा - बांसुरी ध्यान',
    duration: 2400, // 40 min
    audioUrl: '/audio/meditation/inner-journey-flute.mp3',
    category: 'meditation'
  },

  // Sleep Music
  {
    id: 'sleep-1',
    title: 'Deep Sleep - Gentle Rain',
    titleHindi: 'गहरी नींद - मृदु वर्षा',
    duration: 5400, // 90 min
    audioUrl: '/audio/meditation/deep-sleep-rain.mp3',
    category: 'sleep'
  },
  {
    id: 'sleep-2',
    title: 'Peaceful Dreams - Night Ambience',
    titleHindi: 'शांत स्वप्न - रात्रि परिवेश',
    duration: 7200, // 120 min
    audioUrl: '/audio/meditation/peaceful-dreams.mp3',
    category: 'sleep'
  },

  // Nature
  {
    id: 'nature-1',
    title: 'Forest Morning - Bird Songs',
    titleHindi: 'वन प्रभात - पक्षी गान',
    duration: 3600, // 60 min
    audioUrl: '/audio/meditation/forest-morning.mp3',
    category: 'nature'
  },
  {
    id: 'nature-2',
    title: 'River Flow - Ganga Ghats',
    titleHindi: 'नदी प्रवाह - गंगा घाट',
    duration: 2700, // 45 min
    audioUrl: '/audio/meditation/river-flow.mp3',
    category: 'nature'
  },
  {
    id: 'nature-3',
    title: 'Mountain Silence - Himalayan Peace',
    titleHindi: 'पर्वत मौन - हिमालय शांति',
    duration: 3000, // 50 min
    audioUrl: '/audio/meditation/mountain-silence.mp3',
    category: 'nature'
  },

  // Devotional
  {
    id: 'devotional-1',
    title: 'Om Namah Shivaya - Chant',
    titleHindi: 'ॐ नमः शिवाय - जप',
    duration: 1800, // 30 min
    audioUrl: '/audio/meditation/om-namah-shivaya.mp3',
    category: 'devotional'
  },
  {
    id: 'devotional-2',
    title: 'Gayatri Mantra - Sacred Chant',
    titleHindi: 'गायत्री मंत्र - पवित्र जप',
    duration: 2100, // 35 min
    audioUrl: '/audio/meditation/gayatri-mantra.mp3',
    category: 'devotional'
  },

  // Instrumental
  {
    id: 'instrumental-1',
    title: 'Sitar Serenity - Classical',
    titleHindi: 'सितार शांति - शास्त्रीय',
    artist: 'Classical Masters',
    duration: 2400, // 40 min
    audioUrl: '/audio/meditation/sitar-serenity.mp3',
    category: 'instrumental'
  },
  {
    id: 'instrumental-2',
    title: 'Bansuri Dreams - Flute Solo',
    titleHindi: 'बांसुरी स्वप्न - बांसुरी एकल',
    duration: 2100, // 35 min
    audioUrl: '/audio/meditation/bansuri-dreams.mp3',
    category: 'instrumental'
  },
  {
    id: 'instrumental-3',
    title: 'Santoor Meditation - Strings',
    titleHindi: 'संतूर ध्यान - तार',
    duration: 1800, // 30 min
    audioUrl: '/audio/meditation/santoor-meditation.mp3',
    category: 'instrumental'
  }
]

// ============ Playlists ============

export const MEDITATION_PLAYLISTS: MeditationPlaylist[] = [
  {
    id: 'morning-sadhana',
    name: 'Morning Sadhana',
    nameHindi: 'प्रातः साधना',
    description: 'Start your day with peaceful morning ragas',
    tracks: ['morning-raga-1', 'morning-raga-2', 'meditation-1'],
    duration: 115
  },
  {
    id: 'deep-meditation',
    name: 'Deep Meditation',
    nameHindi: 'गहन ध्यान',
    description: 'Extended meditation session',
    tracks: ['meditation-1', 'meditation-2', 'meditation-3'],
    duration: 145
  },
  {
    id: 'evening-peace',
    name: 'Evening Peace',
    nameHindi: 'संध्या शांति',
    description: 'Wind down with calming evening music',
    tracks: ['evening-raga-1', 'evening-raga-2', 'instrumental-1'],
    duration: 105
  },
  {
    id: 'sleep-journey',
    name: 'Sleep Journey',
    nameHindi: 'निद्रा यात्रा',
    description: 'Gentle music for restful sleep',
    tracks: ['sleep-1', 'sleep-2'],
    duration: 210
  },
  {
    id: 'nature-immersion',
    name: 'Nature Immersion',
    nameHindi: 'प्रकृति विसर्जन',
    description: 'Immerse in natural soundscapes',
    tracks: ['nature-1', 'nature-2', 'nature-3'],
    duration: 155
  },
  {
    id: 'devotional-path',
    name: 'Devotional Path',
    nameHindi: 'भक्ति मार्ग',
    description: 'Sacred chants and mantras',
    tracks: ['devotional-1', 'devotional-2'],
    duration: 65
  },
  {
    id: 'instrumental-bliss',
    name: 'Instrumental Bliss',
    nameHindi: 'वाद्य आनंद',
    description: 'Classical instrumental meditation',
    tracks: ['instrumental-1', 'instrumental-2', 'instrumental-3'],
    duration: 105
  }
]

// ============ Audio Engine ============

class MeditationAudioEngine {
  private audio: HTMLAudioElement | null = null
  private currentTrack: MeditationTrack | null = null
  private currentPlaylist: MeditationPlaylist | null = null
  private playlistIndex: number = 0
  private volume: number = 0.7
  private isPlaying: boolean = false
  private onStateChange?: (state: PlayerState) => void

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
      this.setupEventListeners()
    }
  }

  private setupEventListeners(): void {
    if (!this.audio) return

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnd()
    })

    this.audio.addEventListener('timeupdate', () => {
      this.notifyStateChange()
    })

    this.audio.addEventListener('loadedmetadata', () => {
      this.notifyStateChange()
    })

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      this.notifyStateChange()
    })

    this.audio.addEventListener('playing', () => {
      this.isPlaying = true
      this.notifyStateChange()
    })

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false
      this.notifyStateChange()
    })
  }

  // Set state change callback
  setStateChangeCallback(callback: (state: PlayerState) => void): void {
    this.onStateChange = callback
  }

  // Notify state change
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  // Get current state
  getState(): PlayerState {
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      currentPlaylist: this.currentPlaylist,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0,
      volume: this.volume,
      isLoading: this.audio?.readyState !== 4,
      error: null
    }
  }

  // Get track by ID
  getTrack(trackId: string): MeditationTrack | undefined {
    return MEDITATION_TRACKS.find(t => t.id === trackId)
  }

  // Get playlist by ID
  getPlaylist(playlistId: string): MeditationPlaylist | undefined {
    return MEDITATION_PLAYLISTS.find(p => p.id === playlistId)
  }

  // Get tracks by category
  getTracksByCategory(category: MeditationCategory): MeditationTrack[] {
    return MEDITATION_TRACKS.filter(t => t.category === category)
  }

  // Play a track
  async playTrack(trackId: string): Promise<void> {
    const track = this.getTrack(trackId)
    if (!track || !this.audio) return

    this.currentTrack = track
    this.currentPlaylist = null
    this.audio.src = track.audioUrl
    this.audio.volume = this.volume

    try {
      await this.audio.play()
      this.isPlaying = true
    } catch (error) {
      console.error('Play error:', error)
    }

    this.notifyStateChange()
  }

  // Play a playlist
  async playPlaylist(playlistId: string): Promise<void> {
    const playlist = this.getPlaylist(playlistId)
    if (!playlist) return

    this.currentPlaylist = playlist
    this.playlistIndex = 0

    if (playlist.tracks.length > 0) {
      await this.playTrack(playlist.tracks[0])
    }
  }

  // Handle track end (auto-next in playlist)
  private async handleTrackEnd(): Promise<void> {
    if (this.currentPlaylist) {
      this.playlistIndex++
      if (this.playlistIndex < this.currentPlaylist.tracks.length) {
        await this.playTrack(this.currentPlaylist.tracks[this.playlistIndex])
      } else {
        // Playlist ended
        this.isPlaying = false
        this.notifyStateChange()
      }
    } else {
      this.isPlaying = false
      this.notifyStateChange()
    }
  }

  // Play/Pause toggle
  async toggle(): Promise<void> {
    if (!this.audio) return

    if (this.isPlaying) {
      this.audio.pause()
    } else {
      try {
        await this.audio.play()
      } catch (error) {
        console.error('Play error:', error)
      }
    }
  }

  // Pause
  pause(): void {
    if (this.audio) {
      this.audio.pause()
    }
  }

  // Stop
  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
    this.isPlaying = false
    this.currentTrack = null
    this.currentPlaylist = null
    this.notifyStateChange()
  }

  // Next track (in playlist)
  async next(): Promise<void> {
    if (!this.currentPlaylist) return

    this.playlistIndex++
    if (this.playlistIndex >= this.currentPlaylist.tracks.length) {
      this.playlistIndex = 0 // Loop
    }

    await this.playTrack(this.currentPlaylist.tracks[this.playlistIndex])
  }

  // Previous track (in playlist)
  async previous(): Promise<void> {
    if (!this.currentPlaylist) return

    // If more than 3 seconds in, restart current track
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0
      return
    }

    this.playlistIndex--
    if (this.playlistIndex < 0) {
      this.playlistIndex = this.currentPlaylist.tracks.length - 1
    }

    await this.playTrack(this.currentPlaylist.tracks[this.playlistIndex])
  }

  // Seek to position (0-1)
  seek(position: number): void {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = position * this.audio.duration
    }
  }

  // Set volume (0-1)
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.audio) {
      this.audio.volume = this.volume
    }
    this.notifyStateChange()
  }

  // Format time (seconds to mm:ss)
  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup
  dispose(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
    }
  }
}

// Singleton instance
export const meditationAudio = new MeditationAudioEngine()

export default meditationAudio
