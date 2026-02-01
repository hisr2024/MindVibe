import { CATEGORY_INFO, MEDITATION_TRACKS, type MeditationCategory } from '@/utils/audio/MeditationAudioEngine'
import type { Track } from '../types'

export type MeditationCategoryGroup = 'ambient' | 'ragas' | 'nature' | 'sleep' | 'devotional'

const CATEGORY_GROUPS: Record<MeditationCategoryGroup, MeditationCategory[]> = {
  ambient: ['meditation'],
  ragas: ['morning', 'evening', 'instrumental'],
  nature: ['nature'],
  sleep: ['sleep'],
  devotional: ['devotional']
}

export const MEDITATION_CATEGORY_DETAILS: Array<{
  id: MeditationCategoryGroup
  label: string
  description: string
}> = [
  { id: 'ambient', label: 'Ambient', description: 'Deep meditation ambience and drones' },
  { id: 'ragas', label: 'Ragas', description: 'Morning & evening ragas for balance' },
  { id: 'nature', label: 'Nature', description: 'Forest, river, and mountain soundscapes' },
  { id: 'sleep', label: 'Sleep', description: 'Gentle sleep and night ambience' },
  { id: 'devotional', label: 'Devotional', description: 'Mantras and sacred chants' }
]

export const buildMeditationTracks = (): Track[] =>
  MEDITATION_TRACKS.map((track) => ({
    id: `meditation-${track.id}`,
    title: track.title,
    subtitle: CATEGORY_INFO[track.category].name,
    url: track.audioUrl,
    duration: track.duration,
    sourceType: 'meditation',
    meta: {
      category: track.category,
      group: MEDITATION_CATEGORY_DETAILS.find((group) =>
        CATEGORY_GROUPS[group.id].includes(track.category)
      )?.id
    }
  }))

export const getMeditationTracksByGroup = (groupId: MeditationCategoryGroup): Track[] => {
  const categories = CATEGORY_GROUPS[groupId]
  return buildMeditationTracks().filter((track) =>
    categories.includes(track.meta?.category as MeditationCategory)
  )
}
