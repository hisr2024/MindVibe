/**
 * Universal Audio Stop System
 *
 * Provides a single point of control to stop ALL audio playback
 * across the entire MindVibe application.
 *
 * Stops:
 * - Browser SpeechSynthesis
 * - HTML5 Audio elements
 * - Web Audio API (AudioContext)
 * - Binaural beats
 * - Backend TTS synthesis (via API)
 * - Any registered audio sources
 */

type AudioStopCallback = () => void

// Registry of all active audio sources
const audioRegistry: Set<AudioStopCallback> = new Set()

// Track active HTML5 audio elements
const activeAudioElements: Set<HTMLAudioElement> = new Set()

// Track AudioContext instances
const activeAudioContexts: Set<AudioContext> = new Set()

// Global speech synthesis reference
let speechSynthesisRef: SpeechSynthesis | null = null

/**
 * Initialize the universal audio stop system.
 * Call this once when the app starts.
 */
export function initUniversalAudioStop(): void {
  if (typeof window === 'undefined') return

  // Get speech synthesis reference
  if (window.speechSynthesis) {
    speechSynthesisRef = window.speechSynthesis
  }

  // Listen for page unload to cleanup
  window.addEventListener('beforeunload', () => {
    stopAllAudio()
  })

  console.log('[UniversalAudioStop] Initialized')
}

/**
 * Register an audio stop callback.
 * Use this to register custom audio sources that need to be stopped.
 */
export function registerAudioSource(callback: AudioStopCallback): () => void {
  audioRegistry.add(callback)

  // Return unregister function
  return () => {
    audioRegistry.delete(callback)
  }
}

/**
 * Register an HTML5 Audio element for tracking.
 */
export function registerAudioElement(audio: HTMLAudioElement): () => void {
  activeAudioElements.add(audio)

  // Auto-unregister when audio ends
  const handleEnd = () => {
    activeAudioElements.delete(audio)
  }
  audio.addEventListener('ended', handleEnd)
  audio.addEventListener('error', handleEnd)

  return () => {
    activeAudioElements.delete(audio)
    audio.removeEventListener('ended', handleEnd)
    audio.removeEventListener('error', handleEnd)
  }
}

/**
 * Register an AudioContext for tracking.
 */
export function registerAudioContext(ctx: AudioContext): () => void {
  activeAudioContexts.add(ctx)

  return () => {
    activeAudioContexts.delete(ctx)
  }
}

/**
 * STOP ALL AUDIO - The nuclear option.
 *
 * Immediately stops all audio playback from any source:
 * - Browser speech synthesis
 * - All HTML5 audio elements
 * - All AudioContext instances
 * - All registered callbacks
 * - Backend TTS (via API call)
 */
export async function stopAllAudio(): Promise<void> {
  console.log('[UniversalAudioStop] Stopping ALL audio...')

  // 1. Stop browser speech synthesis
  if (speechSynthesisRef) {
    speechSynthesisRef.cancel()
  }

  // 2. Stop all HTML5 audio elements
  activeAudioElements.forEach(audio => {
    try {
      audio.pause()
      audio.currentTime = 0
      // Clear source to stop any buffered playback
      audio.src = ''
      audio.load()
    } catch (e) {
      // Ignore errors from already-disposed elements
    }
  })
  activeAudioElements.clear()

  // 3. Suspend all AudioContext instances
  const contextPromises = Array.from(activeAudioContexts).map(async ctx => {
    try {
      if (ctx.state !== 'closed') {
        await ctx.suspend()
      }
    } catch (e) {
      // Ignore errors
    }
  })
  await Promise.allSettled(contextPromises)

  // 4. Call all registered callbacks
  audioRegistry.forEach(callback => {
    try {
      callback()
    } catch (e) {
      console.warn('[UniversalAudioStop] Callback error:', e)
    }
  })

  // 5. Stop backend TTS synthesis (fire and forget)
  try {
    fetch('/api/voice/divine/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ synthesis_id: null }),
    }).catch(() => {
      // Ignore network errors
    })
  } catch {
    // Ignore
  }

  console.log('[UniversalAudioStop] All audio stopped')
}

/**
 * Stop only speech synthesis (browser TTS).
 */
export function stopSpeechSynthesis(): void {
  if (speechSynthesisRef) {
    speechSynthesisRef.cancel()
  }
}

/**
 * Stop a specific audio element.
 */
export function stopAudioElement(audio: HTMLAudioElement): void {
  try {
    audio.pause()
    audio.currentTime = 0
    activeAudioElements.delete(audio)
  } catch {
    // Ignore
  }
}

/**
 * Check if any audio is currently playing.
 */
export function isAnyAudioPlaying(): boolean {
  // Check speech synthesis
  if (speechSynthesisRef?.speaking) {
    return true
  }

  // Check HTML5 audio elements
  for (const audio of activeAudioElements) {
    if (!audio.paused && audio.currentTime > 0) {
      return true
    }
  }

  // Check AudioContext
  for (const ctx of activeAudioContexts) {
    if (ctx.state === 'running') {
      return true
    }
  }

  return false
}

/**
 * Get current audio status.
 */
export function getAudioStatus(): {
  speechSynthesisActive: boolean
  audioElementsActive: number
  audioContextsActive: number
  totalCallbacks: number
} {
  return {
    speechSynthesisActive: speechSynthesisRef?.speaking ?? false,
    audioElementsActive: Array.from(activeAudioElements).filter(a => !a.paused).length,
    audioContextsActive: Array.from(activeAudioContexts).filter(c => c.state === 'running').length,
    totalCallbacks: audioRegistry.size,
  }
}

// Export singleton functions
export default {
  init: initUniversalAudioStop,
  stopAll: stopAllAudio,
  stopSpeech: stopSpeechSynthesis,
  stopAudio: stopAudioElement,
  register: registerAudioSource,
  registerAudio: registerAudioElement,
  registerContext: registerAudioContext,
  isPlaying: isAnyAudioPlaying,
  status: getAudioStatus,
}
