/**
 * Soul-Soothing Music Library
 *
 * ॐ श्री कृष्णाय नमः
 *
 * A comprehensive collection of authentic, natural, soul-soothing music for MindVibe.
 * Real recordings - no digital/synthesized tones.
 *
 * Categories:
 * - Krishna Flute (बांसुरी) - Divine flute melodies
 * - Nature Sounds - Rain, Ocean, Forest, Rivers, Birds
 * - Temple Ambiance - Bells, Chants, Aarti
 * - Classical Ragas - Morning, Evening, Night ragas
 * - Meditation Music - Peaceful instrumentals
 * - Healing Sounds - Singing bowls, Tanpura drones
 *
 * All tracks are royalty-free and suitable for meditation/relaxation.
 */

export type MusicCategory =
  | 'krishna_flute'
  | 'nature'
  | 'temple'
  | 'ragas'
  | 'meditation'
  | 'healing'
  | 'sleep'
  | 'morning'
  | 'evening'

export type NatureSubcategory =
  | 'rain'
  | 'ocean'
  | 'forest'
  | 'river'
  | 'birds'
  | 'thunder'
  | 'waterfall'
  | 'night'

export interface MusicTrack {
  id: string
  title: string
  titleHindi?: string
  artist?: string
  duration: number // in seconds
  category: MusicCategory
  subcategory?: NatureSubcategory | string
  description: string
  audioUrl: string
  coverImage?: string
  tags: string[]
  mood: ('peaceful' | 'devotional' | 'healing' | 'energizing' | 'sleep' | 'focus')[]
  timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night' | 'anytime')[]
}

export interface MusicPlaylist {
  id: string
  name: string
  nameHindi: string
  description: string
  coverImage?: string
  tracks: string[] // track IDs
  duration: number // total duration in minutes
  category: MusicCategory | 'mixed'
  mood: string
}

// ============ Krishna Flute Music ============
export const KRISHNA_FLUTE_TRACKS: MusicTrack[] = [
  {
    id: 'krishna_flute_1',
    title: 'Divine Flute - Morning Raga',
    titleHindi: 'दिव्य बांसुरी - प्रातः राग',
    artist: 'Traditional',
    duration: 1800, // 30 min
    category: 'krishna_flute',
    description: 'Peaceful morning flute melody in Raga Bhairav',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/02/14/audio_ab5726c84e.mp3',
    tags: ['flute', 'krishna', 'morning', 'peaceful'],
    mood: ['peaceful', 'devotional'],
    timeOfDay: ['morning']
  },
  {
    id: 'krishna_flute_2',
    title: 'Vrindavan Melody',
    titleHindi: 'वृंदावन धुन',
    artist: 'Traditional',
    duration: 2400, // 40 min
    category: 'krishna_flute',
    description: 'Krishna flute by the Yamuna river',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/10/31/audio_fc9e554c2a.mp3',
    tags: ['flute', 'krishna', 'vrindavan', 'yamuna'],
    mood: ['peaceful', 'devotional'],
    timeOfDay: ['anytime']
  },
  {
    id: 'krishna_flute_3',
    title: 'Evening Flute - Raga Yaman',
    titleHindi: 'संध्या बांसुरी - राग यमन',
    artist: 'Traditional',
    duration: 2100, // 35 min
    category: 'krishna_flute',
    description: 'Soothing evening flute in Raga Yaman',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/01/08/audio_dc39bea5c0.mp3',
    tags: ['flute', 'yaman', 'evening', 'classical'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['evening']
  },
  {
    id: 'krishna_flute_4',
    title: 'Midnight Flute - Raga Malkauns',
    titleHindi: 'मध्यरात्रि बांसुरी - राग मालकौंस',
    artist: 'Traditional',
    duration: 2700, // 45 min
    category: 'krishna_flute',
    description: 'Deep night meditation flute',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b9c6ea8.mp3',
    tags: ['flute', 'night', 'meditation', 'deep'],
    mood: ['peaceful', 'sleep'],
    timeOfDay: ['night']
  },
  {
    id: 'krishna_flute_5',
    title: 'Flute with Birds',
    titleHindi: 'बांसुरी और पक्षी',
    artist: 'Traditional',
    duration: 1500, // 25 min
    category: 'krishna_flute',
    description: 'Gentle flute with natural bird sounds',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/10/14/audio_d8e7c54f91.mp3',
    tags: ['flute', 'birds', 'nature', 'peaceful'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['morning', 'afternoon']
  }
]

// ============ Nature Sounds ============
export const NATURE_TRACKS: MusicTrack[] = [
  // Rain
  {
    id: 'rain_gentle',
    title: 'Gentle Rain',
    titleHindi: 'मृदु वर्षा',
    duration: 3600, // 60 min
    category: 'nature',
    subcategory: 'rain',
    description: 'Soft rain falling on leaves',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/05/16/audio_58fcd61a7b.mp3',
    tags: ['rain', 'gentle', 'relaxing', 'sleep'],
    mood: ['peaceful', 'sleep'],
    timeOfDay: ['anytime']
  },
  {
    id: 'rain_thunder',
    title: 'Monsoon Thunder',
    titleHindi: 'मानसून गर्जन',
    duration: 3600,
    category: 'nature',
    subcategory: 'thunder',
    description: 'Monsoon rain with distant thunder',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/10/14/audio_07af6cd7d3.mp3',
    tags: ['rain', 'thunder', 'monsoon', 'powerful'],
    mood: ['peaceful', 'sleep'],
    timeOfDay: ['anytime']
  },
  {
    id: 'rain_rooftop',
    title: 'Rain on Rooftop',
    titleHindi: 'छत पर वर्षा',
    duration: 2700,
    category: 'nature',
    subcategory: 'rain',
    description: 'Cozy rain sounds on a tin roof',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/03/06/audio_2b25dc7c6b.mp3',
    tags: ['rain', 'cozy', 'relaxing'],
    mood: ['peaceful', 'sleep'],
    timeOfDay: ['anytime']
  },

  // Ocean
  {
    id: 'ocean_waves',
    title: 'Ocean Waves',
    titleHindi: 'सागर लहरें',
    duration: 3600,
    category: 'nature',
    subcategory: 'ocean',
    description: 'Gentle ocean waves on sandy beach',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_f4c739491a.mp3',
    tags: ['ocean', 'waves', 'beach', 'relaxing'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['anytime']
  },
  {
    id: 'ocean_night',
    title: 'Night Ocean',
    titleHindi: 'रात्रि सागर',
    duration: 3600,
    category: 'nature',
    subcategory: 'ocean',
    description: 'Ocean waves under starry night',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/10/30/audio_0e9a1961ba.mp3',
    tags: ['ocean', 'night', 'peaceful', 'sleep'],
    mood: ['peaceful', 'sleep'],
    timeOfDay: ['night']
  },

  // Forest
  {
    id: 'forest_morning',
    title: 'Forest Morning',
    titleHindi: 'वन प्रभात',
    duration: 2700,
    category: 'nature',
    subcategory: 'forest',
    description: 'Morning forest with birds and gentle breeze',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/08/02/audio_54ca0ffa52.mp3',
    tags: ['forest', 'birds', 'morning', 'fresh'],
    mood: ['peaceful', 'energizing'],
    timeOfDay: ['morning']
  },
  {
    id: 'forest_night',
    title: 'Forest Night',
    titleHindi: 'वन रात्रि',
    duration: 3600,
    category: 'nature',
    subcategory: 'night',
    description: 'Night forest with crickets and owls',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/09/06/audio_a35e8a2dc7.mp3',
    tags: ['forest', 'night', 'crickets', 'peaceful'],
    mood: ['peaceful', 'sleep'],
    timeOfDay: ['night']
  },

  // River
  {
    id: 'river_flow',
    title: 'Flowing River',
    titleHindi: 'बहती नदी',
    duration: 2700,
    category: 'nature',
    subcategory: 'river',
    description: 'Peaceful river flowing through mountains',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/07/26/audio_e205dc4c25.mp3',
    tags: ['river', 'water', 'mountain', 'peaceful'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['anytime']
  },
  {
    id: 'river_ganga',
    title: 'Sacred Ganga',
    titleHindi: 'पवित्र गंगा',
    duration: 3600,
    category: 'nature',
    subcategory: 'river',
    description: 'Sounds of the holy Ganga river',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_9e8e3d1c30.mp3',
    tags: ['ganga', 'sacred', 'river', 'spiritual'],
    mood: ['peaceful', 'devotional'],
    timeOfDay: ['anytime']
  },

  // Birds
  {
    id: 'birds_morning',
    title: 'Morning Birds',
    titleHindi: 'प्रातः पक्षी',
    duration: 1800,
    category: 'nature',
    subcategory: 'birds',
    description: 'Dawn chorus of singing birds',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/02/07/audio_6c5a1c43fa.mp3',
    tags: ['birds', 'morning', 'dawn', 'fresh'],
    mood: ['peaceful', 'energizing'],
    timeOfDay: ['morning']
  },
  {
    id: 'birds_forest',
    title: 'Forest Birds',
    titleHindi: 'वन पक्षी',
    duration: 2400,
    category: 'nature',
    subcategory: 'birds',
    description: 'Tropical forest bird sounds',
    audioUrl: 'https://cdn.pixabay.com/audio/2021/08/08/audio_ebee6e1a2c.mp3',
    tags: ['birds', 'forest', 'tropical', 'peaceful'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['morning', 'afternoon']
  },

  // Waterfall
  {
    id: 'waterfall_1',
    title: 'Mountain Waterfall',
    titleHindi: 'पर्वत झरना',
    duration: 3600,
    category: 'nature',
    subcategory: 'waterfall',
    description: 'Powerful waterfall in the mountains',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7f17e12e5d.mp3',
    tags: ['waterfall', 'mountain', 'powerful', 'refreshing'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['anytime']
  }
]

// ============ Temple Ambiance ============
export const TEMPLE_TRACKS: MusicTrack[] = [
  {
    id: 'temple_bells_1',
    title: 'Temple Morning Bells',
    titleHindi: 'मंदिर प्रातः घंटी',
    duration: 1800,
    category: 'temple',
    description: 'Sacred morning temple bell sounds',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/11/17/audio_c3e1c67be9.mp3',
    tags: ['temple', 'bells', 'morning', 'sacred'],
    mood: ['devotional', 'peaceful'],
    timeOfDay: ['morning']
  },
  {
    id: 'temple_aarti',
    title: 'Evening Aarti',
    titleHindi: 'संध्या आरती',
    duration: 2100,
    category: 'temple',
    description: 'Traditional evening aarti ceremony',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/01/06/audio_61eaa67ff7.mp3',
    tags: ['aarti', 'evening', 'devotional', 'sacred'],
    mood: ['devotional', 'peaceful'],
    timeOfDay: ['evening']
  },
  {
    id: 'temple_conch',
    title: 'Shankh (Conch Shell)',
    titleHindi: 'शंख ध्वनि',
    duration: 1200,
    category: 'temple',
    description: 'Sacred conch shell blowing',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/09/01/audio_07407f7e13.mp3',
    tags: ['conch', 'shankh', 'sacred', 'powerful'],
    mood: ['devotional', 'energizing'],
    timeOfDay: ['morning', 'evening']
  },
  {
    id: 'om_chanting',
    title: 'Om Chanting',
    titleHindi: 'ॐ जाप',
    duration: 2700,
    category: 'temple',
    description: 'Deep Om meditation chanting',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/08/23/audio_9d8a1c99f1.mp3',
    tags: ['om', 'chanting', 'meditation', 'sacred'],
    mood: ['devotional', 'peaceful', 'healing'],
    timeOfDay: ['anytime']
  },
  {
    id: 'gayatri_mantra',
    title: 'Gayatri Mantra',
    titleHindi: 'गायत्री मंत्र',
    duration: 1800,
    category: 'temple',
    description: 'Sacred Gayatri Mantra chanting',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/07/03/audio_cf788b0959.mp3',
    tags: ['gayatri', 'mantra', 'sacred', 'morning'],
    mood: ['devotional', 'energizing'],
    timeOfDay: ['morning']
  }
]

// ============ Meditation Music ============
export const MEDITATION_TRACKS: MusicTrack[] = [
  {
    id: 'meditation_peaceful',
    title: 'Peaceful Meditation',
    titleHindi: 'शांत ध्यान',
    duration: 2700,
    category: 'meditation',
    description: 'Gentle music for deep meditation',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/02/22/audio_7c6d0d9fdd.mp3',
    tags: ['meditation', 'peaceful', 'calm', 'gentle'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['anytime']
  },
  {
    id: 'meditation_deep',
    title: 'Deep Meditation',
    titleHindi: 'गहन ध्यान',
    duration: 3600,
    category: 'meditation',
    description: 'Extended deep meditation music',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/04/13/audio_ce71fd9bfe.mp3',
    tags: ['meditation', 'deep', 'transcendental', 'long'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['anytime']
  },
  {
    id: 'meditation_morning',
    title: 'Morning Meditation',
    titleHindi: 'प्रातः ध्यान',
    duration: 1800,
    category: 'meditation',
    description: 'Uplifting morning meditation music',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/10/25/audio_d1c7f0b0a2.mp3',
    tags: ['meditation', 'morning', 'fresh', 'uplifting'],
    mood: ['peaceful', 'energizing'],
    timeOfDay: ['morning']
  }
]

// ============ Healing Music ============
export const HEALING_TRACKS: MusicTrack[] = [
  {
    id: 'singing_bowl_1',
    title: 'Tibetan Singing Bowls',
    titleHindi: 'तिब्बती गायन कटोरा',
    duration: 2400,
    category: 'healing',
    description: 'Authentic Tibetan singing bowl session',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/09/audio_5a9be2a9ca.mp3',
    tags: ['singing bowl', 'tibetan', 'healing', 'meditation'],
    mood: ['healing', 'peaceful'],
    timeOfDay: ['anytime']
  },
  {
    id: 'tanpura_drone',
    title: 'Tanpura Drone',
    titleHindi: 'तानपूरा',
    duration: 3600,
    category: 'healing',
    description: 'Continuous tanpura drone for meditation',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/03/27/audio_0a15b62c7a.mp3',
    tags: ['tanpura', 'drone', 'classical', 'meditation'],
    mood: ['peaceful', 'healing'],
    timeOfDay: ['anytime']
  },
  {
    id: 'crystal_bowls',
    title: 'Crystal Healing Bowls',
    titleHindi: 'क्रिस्टल उपचार कटोरे',
    duration: 2100,
    category: 'healing',
    description: 'Crystal singing bowls for chakra healing',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/05/17/audio_c8e3f16c7d.mp3',
    tags: ['crystal', 'healing', 'chakra', 'meditation'],
    mood: ['healing', 'peaceful'],
    timeOfDay: ['anytime']
  }
]

// ============ Sleep Music ============
export const SLEEP_TRACKS: MusicTrack[] = [
  {
    id: 'sleep_gentle',
    title: 'Gentle Sleep',
    titleHindi: 'कोमल निद्रा',
    duration: 7200, // 2 hours
    category: 'sleep',
    description: 'Ultra-gentle music for deep sleep',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/08/03/audio_54fb8e8c0d.mp3',
    tags: ['sleep', 'gentle', 'deep', 'relaxing'],
    mood: ['sleep', 'peaceful'],
    timeOfDay: ['night']
  },
  {
    id: 'sleep_rain',
    title: 'Sleep with Rain',
    titleHindi: 'वर्षा के साथ निद्रा',
    duration: 7200,
    category: 'sleep',
    description: 'Soft rain sounds for peaceful sleep',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/06/02/audio_03ee1f4c2a.mp3',
    tags: ['sleep', 'rain', 'peaceful', 'cozy'],
    mood: ['sleep', 'peaceful'],
    timeOfDay: ['night']
  },
  {
    id: 'sleep_ocean',
    title: 'Ocean Sleep',
    titleHindi: 'सागर निद्रा',
    duration: 7200,
    category: 'sleep',
    description: 'Ocean waves for restful sleep',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/04/27/audio_9e3b0a6b4d.mp3',
    tags: ['sleep', 'ocean', 'waves', 'peaceful'],
    mood: ['sleep', 'peaceful'],
    timeOfDay: ['night']
  }
]

// ============ All Tracks Combined ============
export const ALL_TRACKS: MusicTrack[] = [
  ...KRISHNA_FLUTE_TRACKS,
  ...NATURE_TRACKS,
  ...TEMPLE_TRACKS,
  ...MEDITATION_TRACKS,
  ...HEALING_TRACKS,
  ...SLEEP_TRACKS
]

// ============ Curated Playlists ============
export const PLAYLISTS: MusicPlaylist[] = [
  {
    id: 'krishna_divine',
    name: 'Krishna Divine',
    nameHindi: 'कृष्ण दिव्य',
    description: 'Immerse in the divine flute melodies of Lord Krishna',
    tracks: ['krishna_flute_1', 'krishna_flute_2', 'krishna_flute_3', 'krishna_flute_4', 'krishna_flute_5'],
    duration: 175,
    category: 'krishna_flute',
    mood: 'Devotional & Peaceful'
  },
  {
    id: 'nature_bliss',
    name: 'Nature Bliss',
    nameHindi: 'प्रकृति आनंद',
    description: 'Pure sounds of nature for deep relaxation',
    tracks: ['forest_morning', 'river_flow', 'birds_morning', 'waterfall_1', 'ocean_waves'],
    duration: 210,
    category: 'nature',
    mood: 'Peaceful & Healing'
  },
  {
    id: 'rainy_monsoon',
    name: 'Monsoon Magic',
    nameHindi: 'मानसून जादू',
    description: 'Soothing rain sounds for relaxation and sleep',
    tracks: ['rain_gentle', 'rain_thunder', 'rain_rooftop'],
    duration: 165,
    category: 'nature',
    mood: 'Peaceful & Sleep'
  },
  {
    id: 'temple_experience',
    name: 'Temple Experience',
    nameHindi: 'मंदिर अनुभव',
    description: 'Sacred temple ambiance for spiritual connection',
    tracks: ['temple_bells_1', 'temple_aarti', 'temple_conch', 'om_chanting', 'gayatri_mantra'],
    duration: 155,
    category: 'temple',
    mood: 'Devotional & Sacred'
  },
  {
    id: 'deep_meditation',
    name: 'Deep Meditation',
    nameHindi: 'गहन ध्यान',
    description: 'Extended meditation music for deep practice',
    tracks: ['meditation_peaceful', 'meditation_deep', 'singing_bowl_1', 'tanpura_drone'],
    duration: 195,
    category: 'meditation',
    mood: 'Peaceful & Focused'
  },
  {
    id: 'sleep_journey',
    name: 'Sleep Journey',
    nameHindi: 'निद्रा यात्रा',
    description: 'Drift into peaceful, restorative sleep',
    tracks: ['sleep_gentle', 'sleep_rain', 'sleep_ocean', 'ocean_night', 'forest_night'],
    duration: 420,
    category: 'sleep',
    mood: 'Sleep & Rest'
  },
  {
    id: 'morning_awakening',
    name: 'Morning Awakening',
    nameHindi: 'प्रातः जागरण',
    description: 'Start your day with uplifting sounds',
    tracks: ['birds_morning', 'temple_bells_1', 'krishna_flute_1', 'meditation_morning', 'gayatri_mantra'],
    duration: 135,
    category: 'mixed',
    mood: 'Energizing & Fresh'
  },
  {
    id: 'evening_peace',
    name: 'Evening Peace',
    nameHindi: 'संध्या शांति',
    description: 'Wind down with calming evening sounds',
    tracks: ['temple_aarti', 'krishna_flute_3', 'river_ganga', 'singing_bowl_1'],
    duration: 155,
    category: 'mixed',
    mood: 'Peaceful & Calming'
  },
  {
    id: 'healing_session',
    name: 'Healing Session',
    nameHindi: 'उपचार सत्र',
    description: 'Restore balance with healing sounds',
    tracks: ['singing_bowl_1', 'crystal_bowls', 'tanpura_drone', 'river_flow'],
    duration: 175,
    category: 'healing',
    mood: 'Healing & Restorative'
  },
  {
    id: 'focus_work',
    name: 'Focus & Work',
    nameHindi: 'ध्यान और कार्य',
    description: 'Background sounds for concentration',
    tracks: ['rain_gentle', 'forest_morning', 'river_flow', 'meditation_peaceful'],
    duration: 180,
    category: 'mixed',
    mood: 'Focus & Productive'
  }
]

// ============ Helper Functions ============

export function getTrackById(id: string): MusicTrack | undefined {
  return ALL_TRACKS.find(track => track.id === id)
}

export function getTracksByCategory(category: MusicCategory): MusicTrack[] {
  return ALL_TRACKS.filter(track => track.category === category)
}

export function getTracksByMood(mood: MusicTrack['mood'][0]): MusicTrack[] {
  return ALL_TRACKS.filter(track => track.mood.includes(mood))
}

export function getTracksByTimeOfDay(time: 'morning' | 'afternoon' | 'evening' | 'night'): MusicTrack[] {
  return ALL_TRACKS.filter(track =>
    track.timeOfDay?.includes(time) || track.timeOfDay?.includes('anytime')
  )
}

export function getPlaylistById(id: string): MusicPlaylist | undefined {
  return PLAYLISTS.find(playlist => playlist.id === id)
}

export function getPlaylistTracks(playlistId: string): MusicTrack[] {
  const playlist = getPlaylistById(playlistId)
  if (!playlist) return []
  return playlist.tracks.map(trackId => getTrackById(trackId)).filter(Boolean) as MusicTrack[]
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function getRecommendedTracks(): MusicTrack[] {
  const hour = new Date().getHours()
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'

  if (hour >= 5 && hour < 12) timeOfDay = 'morning'
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
  else timeOfDay = 'night'

  return getTracksByTimeOfDay(timeOfDay).slice(0, 6)
}

export default {
  ALL_TRACKS,
  PLAYLISTS,
  KRISHNA_FLUTE_TRACKS,
  NATURE_TRACKS,
  TEMPLE_TRACKS,
  MEDITATION_TRACKS,
  HEALING_TRACKS,
  SLEEP_TRACKS,
  getTrackById,
  getTracksByCategory,
  getTracksByMood,
  getTracksByTimeOfDay,
  getPlaylistById,
  getPlaylistTracks,
  formatDuration,
  getRecommendedTracks
}
