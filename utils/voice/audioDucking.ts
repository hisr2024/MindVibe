/**
 * Audio Ducking & Adaptive Speech Rate
 *
 * - Audio ducking: Reduces KIAAN's TTS volume when the user starts speaking
 *   mid-response, so they can interrupt naturally without shouting.
 * - Adaptive rate: Adjusts TTS speed based on the user's own speaking pace
 *   and message complexity.
 *
 * Implements Items #10 (Adaptive speech rate) and #11 (Audio ducking).
 */

// ─── Audio Ducking ──────────────────────────────────────────────────────────

const DUCK_VOLUME = 0.15       // Volume during ducking (15%)
const NORMAL_VOLUME = 1.0      // Normal volume
const DUCK_FADE_MS = 200       // Fade duration

let currentAudioElement: HTMLAudioElement | null = null
let isDucked = false

/**
 * Register the current audio element for ducking control.
 * Call this when KIAAN starts speaking via an <audio> element.
 */
export function registerAudioElement(audio: HTMLAudioElement): void {
  currentAudioElement = audio
  isDucked = false
}

/**
 * Unregister the audio element when speech ends.
 */
export function unregisterAudioElement(): void {
  if (currentAudioElement && isDucked) {
    currentAudioElement.volume = NORMAL_VOLUME
  }
  currentAudioElement = null
  isDucked = false
}

/**
 * Duck KIAAN's audio (reduce volume) when user starts speaking.
 */
export function duckAudio(): void {
  if (!currentAudioElement || isDucked) return
  isDucked = true

  // Smooth fade to duck volume
  const startVolume = currentAudioElement.volume
  const startTime = performance.now()
  const audio = currentAudioElement

  function fade(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / DUCK_FADE_MS, 1)
    audio.volume = startVolume - (startVolume - DUCK_VOLUME) * progress
    if (progress < 1) requestAnimationFrame(fade)
  }
  requestAnimationFrame(fade)
}

/**
 * Restore KIAAN's audio to normal volume when user stops speaking.
 */
export function unduckAudio(): void {
  if (!currentAudioElement || !isDucked) return
  isDucked = false

  const startVolume = currentAudioElement.volume
  const startTime = performance.now()
  const audio = currentAudioElement

  function fade(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / DUCK_FADE_MS, 1)
    audio.volume = startVolume + (NORMAL_VOLUME - startVolume) * progress
    if (progress < 1) requestAnimationFrame(fade)
  }
  requestAnimationFrame(fade)
}

/**
 * Check if audio is currently ducked.
 */
export function isAudioDucked(): boolean {
  return isDucked
}

// ─── Adaptive Speech Rate ───────────────────────────────────────────────────

const DEFAULT_RATE = 0.95
const MIN_RATE = 0.7
const MAX_RATE = 1.3

// Track user's speaking pace over time
const userSpeakingPaces: number[] = [] // words per second

/**
 * Record the user's speaking pace for a given transcript.
 * Call this after each voice input with the transcript and duration.
 */
export function recordUserSpeakingPace(
  transcript: string,
  durationMs: number
): void {
  if (durationMs < 500 || !transcript.trim()) return

  const wordCount = transcript.trim().split(/\s+/).length
  const wordsPerSecond = wordCount / (durationMs / 1000)

  // Only track reasonable speaking rates (0.5 to 5 words/sec)
  if (wordsPerSecond >= 0.5 && wordsPerSecond <= 5) {
    userSpeakingPaces.push(wordsPerSecond)
    // Keep last 20 measurements
    if (userSpeakingPaces.length > 20) {
      userSpeakingPaces.shift()
    }
  }
}

/**
 * Get the adaptive speech rate based on user's speaking pace.
 *
 * Slow speakers get a slightly slower KIAAN voice.
 * Fast speakers get a slightly faster KIAAN voice.
 * Complex or emotional content gets a slower rate.
 */
export function getAdaptiveRate(options?: {
  /** The text KIAAN will speak (longer = slightly slower) */
  responseText?: string
  /** Detected emotion (heavier emotions = slower) */
  emotion?: string
  /** User-set base rate override */
  baseRate?: number
}): number {
  const baseRate = options?.baseRate ?? DEFAULT_RATE

  // Factor 1: User's average speaking pace
  let paceFactor = 0
  if (userSpeakingPaces.length >= 3) {
    const avgPace = userSpeakingPaces.reduce((a, b) => a + b, 0) / userSpeakingPaces.length
    // Average human speaks at ~2.5 words/sec
    // Map pace to rate adjustment: faster speakers → faster rate, slower → slower
    paceFactor = (avgPace - 2.5) * 0.06 // ±0.06 per word/sec difference
  }

  // Factor 2: Response complexity (longer = slightly slower for comprehension)
  let complexityFactor = 0
  if (options?.responseText) {
    const wordCount = options.responseText.split(/\s+/).length
    if (wordCount > 80) complexityFactor = -0.04
    else if (wordCount > 50) complexityFactor = -0.02
  }

  // Factor 3: Emotional weight (heavier emotions = slower, gentler delivery)
  let emotionFactor = 0
  if (options?.emotion) {
    const slowEmotions = ['sadness', 'anxiety', 'guilt', 'loneliness']
    const normalEmotions = ['confusion', 'anger']
    if (slowEmotions.includes(options.emotion)) emotionFactor = -0.05
    else if (normalEmotions.includes(options.emotion)) emotionFactor = -0.02
  }

  // Combine factors
  const adjustedRate = baseRate + paceFactor + complexityFactor + emotionFactor
  return Math.max(MIN_RATE, Math.min(MAX_RATE, adjustedRate))
}

/**
 * Reset all adaptive rate tracking (e.g., on session clear).
 */
export function resetAdaptiveRate(): void {
  userSpeakingPaces.length = 0
}
