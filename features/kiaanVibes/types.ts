export type SourceType = 'gita' | 'meditation' | 'upload'

export interface Track {
  id: string
  title: string
  subtitle?: string
  url?: string
  fileBlob?: Blob
  duration?: number
  sourceType: SourceType
  meta?: Record<string, string | number | boolean | undefined | null>
}

export interface TrackQueue {
  tracks: Track[]
  currentIndex: number
}
