/**
 * Audio Queue Manager
 *
 * Manages TTS audio playback with priority queuing to prevent
 * audio overlap and provide smooth transitions.
 *
 * Modes:
 * - interrupt: Stop current audio, play new immediately
 * - queue: Play after current audio finishes
 * - replace: Stop current, clear queue, play new
 *
 * Features:
 * - Priority-based queue (higher priority = plays sooner)
 * - Automatic blob URL cleanup
 * - Playback state tracking
 * - Event callbacks for UI integration
 */

export type QueueMode = 'interrupt' | 'queue' | 'replace'

export interface AudioItem {
  id: string
  source: string | Blob       // URL or Blob
  priority: number             // Higher = more important (default: 0)
  mode: QueueMode
  volume?: number
  playbackRate?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

interface QueueEntry extends AudioItem {
  blobUrl?: string             // Created from Blob source
}

export interface AudioQueueState {
  isPlaying: boolean
  currentId: string | null
  queueLength: number
}

type StateChangeHandler = (state: AudioQueueState) => void

class AudioQueueManager {
  private queue: QueueEntry[] = []
  private currentEntry: QueueEntry | null = null
  private audioElement: HTMLAudioElement | null = null
  private stateChangeHandler: StateChangeHandler | null = null
  private blobUrls: Set<string> = new Set()

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandler = handler
    return () => { this.stateChangeHandler = null }
  }

  /**
   * Enqueue audio for playback
   */
  play(item: AudioItem): void {
    const entry: QueueEntry = { ...item }

    switch (item.mode) {
      case 'interrupt':
        this.stopCurrent()
        this.playEntry(entry)
        break

      case 'replace':
        this.stopCurrent()
        this.clearQueue()
        this.playEntry(entry)
        break

      case 'queue':
        if (this.currentEntry) {
          // Insert by priority (higher priority = earlier in queue)
          const insertIndex = this.queue.findIndex(q => q.priority < item.priority)
          if (insertIndex === -1) {
            this.queue.push(entry)
          } else {
            this.queue.splice(insertIndex, 0, entry)
          }
          this.emitState()
        } else {
          this.playEntry(entry)
        }
        break
    }
  }

  /**
   * Pause current audio
   */
  pause(): void {
    this.audioElement?.pause()
  }

  /**
   * Resume paused audio
   */
  resume(): void {
    this.audioElement?.play()
  }

  /**
   * Stop current audio and clear queue
   */
  stop(): void {
    this.stopCurrent()
    this.clearQueue()
  }

  /**
   * Skip to next item in queue
   */
  skip(): void {
    this.stopCurrent()
    this.playNext()
  }

  /**
   * Get current state
   */
  getState(): AudioQueueState {
    return {
      isPlaying: this.audioElement !== null && !this.audioElement.paused,
      currentId: this.currentEntry?.id || null,
      queueLength: this.queue.length,
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.stop()
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url)
    }
    this.blobUrls.clear()
    this.audioElement = null
  }

  // ─── Private ──────────────────────────────────────────────────────

  private async playEntry(entry: QueueEntry): Promise<void> {
    this.currentEntry = entry

    // Create audio source
    let src: string
    if (entry.source instanceof Blob) {
      src = URL.createObjectURL(entry.source)
      entry.blobUrl = src
      this.blobUrls.add(src)
    } else {
      src = entry.source
    }

    // Create or reuse audio element
    if (!this.audioElement) {
      this.audioElement = new Audio()
    }

    const audio = this.audioElement
    audio.src = src
    audio.volume = entry.volume ?? 1.0
    audio.playbackRate = entry.playbackRate ?? 1.0

    audio.onplay = () => {
      entry.onStart?.()
      this.emitState()
    }

    audio.onended = () => {
      this.cleanupEntry(entry)
      this.currentEntry = null
      entry.onEnd?.()
      this.emitState()
      this.playNext()
    }

    audio.onerror = () => {
      const error = new Error('Audio playback failed')
      this.cleanupEntry(entry)
      this.currentEntry = null
      entry.onError?.(error)
      this.emitState()
      this.playNext()
    }

    try {
      await audio.play()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.cleanupEntry(entry)
      this.currentEntry = null
      entry.onError?.(error)
      this.emitState()
      this.playNext()
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) return
    const next = this.queue.shift()!
    this.playEntry(next)
  }

  private stopCurrent(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.removeAttribute('src')
      this.audioElement.onplay = null
      this.audioElement.onended = null
      this.audioElement.onerror = null
    }
    if (this.currentEntry) {
      this.cleanupEntry(this.currentEntry)
      this.currentEntry = null
    }
    this.emitState()
  }

  private clearQueue(): void {
    for (const entry of this.queue) {
      this.cleanupEntry(entry)
    }
    this.queue = []
    this.emitState()
  }

  private cleanupEntry(entry: QueueEntry): void {
    if (entry.blobUrl) {
      URL.revokeObjectURL(entry.blobUrl)
      this.blobUrls.delete(entry.blobUrl)
      entry.blobUrl = undefined
    }
  }

  private emitState(): void {
    this.stateChangeHandler?.(this.getState())
  }
}

// Singleton instance
export const audioQueue = new AudioQueueManager()
