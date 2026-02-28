/**
 * Universal Audio Stop Utility
 *
 * Provides centralized control for stopping all audio playback.
 * Used by voice services and other audio-playing components.
 */

// Registry of active audio elements
const audioRegistry: Set<HTMLAudioElement> = new Set()
let initialized = false

/**
 * Initialize the universal audio stop system
 */
export function initUniversalAudioStop(): void {
  if (initialized) return
  initialized = true

  // Listen for visibility changes to pause audio when app is hidden
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Optionally pause all audio when app goes to background
        // Comment out if you want background playback
        // stopAllAudio()
      }
    })
  }
}

/**
 * Register an audio element for universal stop control
 */
export function registerAudioElement(audio: HTMLAudioElement): () => void {
  audioRegistry.add(audio)

  // Return cleanup function
  return () => {
    audioRegistry.delete(audio)
  }
}

/**
 * Unregister an audio element
 */
export function unregisterAudioElement(audio: HTMLAudioElement): void {
  audioRegistry.delete(audio)
}

/**
 * Stop all registered audio elements
 */
export function stopAllAudio(): void {
  audioRegistry.forEach((audio) => {
    try {
      audio.pause()
      audio.currentTime = 0
    } catch {
      // Element may have been removed
    }
  })
}

/**
 * Pause all registered audio elements (without resetting position)
 */
export function pauseAllAudio(): void {
  audioRegistry.forEach((audio) => {
    try {
      audio.pause()
    } catch {
      // Element may have been removed
    }
  })
}

/**
 * Get count of active audio elements
 */
export function getActiveAudioCount(): number {
  return audioRegistry.size
}

const universalAudioStop = {
  initUniversalAudioStop,
  registerAudioElement,
  unregisterAudioElement,
  stopAllAudio,
  pauseAllAudio,
  getActiveAudioCount,
}
export default universalAudioStop
