/**
 * Haptic Feedback System for KIAAN Voice Companion
 *
 * Provides vibration patterns synced with KIAAN's speech rhythm,
 * verse sharing, and emotional moments on mobile devices.
 *
 * Implements Item #15: Haptic feedback.
 */

type PatternType = 'gentle-pulse' | 'verse-share' | 'breathing' | 'celebration'
  | 'wisdom-moment' | 'greeting' | 'error' | 'speech-emphasis'

// ─── Vibration Patterns (milliseconds: [vibrate, pause, vibrate, pause, ...]) ──

const PATTERNS: Record<PatternType, number[]> = {
  'gentle-pulse': [50],
  'verse-share': [30, 50, 30, 50, 80],
  'breathing': [100, 200, 100, 200, 100, 200, 100],
  'celebration': [50, 30, 50, 30, 100, 50, 150],
  'wisdom-moment': [80, 100, 80],
  'greeting': [40, 60, 40],
  'error': [100, 50, 100],
  'speech-emphasis': [30],
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Check if haptic feedback is available on this device.
 */
export function isHapticAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

/**
 * Trigger a haptic pattern.
 */
export function haptic(type: PatternType): void {
  if (!isHapticAvailable()) return
  const pattern = PATTERNS[type]
  if (pattern) {
    navigator.vibrate(pattern)
  }
}

/**
 * Gentle pulse - for button taps, message send, etc.
 */
export function hapticPulse(): void {
  haptic('gentle-pulse')
}

/**
 * Verse share - when KIAAN shares a Gita verse.
 */
export function hapticVerse(): void {
  haptic('verse-share')
}

/**
 * Breathing rhythm - synced with pranayama exercises.
 */
export function hapticBreathing(): void {
  haptic('breathing')
}

/**
 * Celebration - quiz correct answer, journey completion, etc.
 */
export function hapticCelebration(): void {
  haptic('celebration')
}

/**
 * Wisdom moment - when KIAAN delivers a deep insight.
 */
export function hapticWisdom(): void {
  haptic('wisdom-moment')
}

/**
 * Speech emphasis - brief pulse on key words.
 */
export function hapticEmphasis(): void {
  haptic('speech-emphasis')
}

/**
 * Stop any ongoing vibration.
 */
export function hapticStop(): void {
  if (isHapticAvailable()) {
    navigator.vibrate(0)
  }
}
