/**
 * Sound Effects Utility
 *
 * Provides UI sound feedback for the application.
 * These are simple interaction sounds, not the music player.
 */

// Audio cache to avoid re-loading sounds
const audioCache: Map<string, HTMLAudioElement> = new Map()

// Sound definitions with fallback to silence
const SOUNDS: Record<string, string> = {
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  om: '/sounds/om.mp3',
  bell: '/sounds/bell.mp3',
  chime: '/sounds/chime.mp3',
}

/**
 * Play a UI sound effect
 */
export function playSound(soundName: keyof typeof SOUNDS | string, volume = 0.5): void {
  try {
    const soundPath = SOUNDS[soundName] || soundName

    let audio = audioCache.get(soundPath)
    if (!audio) {
      audio = new Audio(soundPath)
      audioCache.set(soundPath, audio)
    }

    audio.volume = Math.max(0, Math.min(1, volume))
    audio.currentTime = 0
    audio.play().catch(() => {
      // Silently fail - user hasn't interacted yet or sound not found
    })
  } catch {
    // Silently fail
  }
}

/**
 * Play sound with haptic feedback
 *
 * Can be called as:
 * - playSoundWithHaptic('click', 'medium') - sound name and haptic type
 * - playSoundWithHaptic('click', 0.5, 'medium') - sound name, volume, and haptic type
 */
export function playSoundWithHaptic(
  soundName: keyof typeof SOUNDS | string,
  volumeOrHaptic: number | 'light' | 'medium' | 'heavy' = 0.5,
  hapticType?: 'light' | 'medium' | 'heavy'
): void {
  let volume = 0.5
  let haptic: 'light' | 'medium' | 'heavy' = 'light'

  // Determine if second arg is volume or haptic type
  if (typeof volumeOrHaptic === 'number') {
    volume = volumeOrHaptic
    haptic = hapticType || 'light'
  } else {
    haptic = volumeOrHaptic
  }

  playSound(soundName, volume)

  // Trigger haptic if available
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns: Record<string, number[]> = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    }
    navigator.vibrate(patterns[haptic] || [10])
  }
}

/**
 * Play Om chime sound
 */
export function playOmChime(volume = 0.6): void {
  playSound('om', volume)
}

/**
 * Clean up audio resources
 */
export function cleanupAudio(): void {
  audioCache.forEach((audio) => {
    audio.pause()
    audio.src = ''
  })
  audioCache.clear()
}

export default {
  playSound,
  playSoundWithHaptic,
  playOmChime,
  cleanupAudio,
}
