/**
 * Sound Effects Utility
 *
 * Provides UI sound feedback for the application using Web Audio API synthesis.
 * These are simple interaction sounds, not the music player or KIAAN voice system.
 */

import { playSynthSound, cleanupSynthAudio, type SynthSoundType } from './webAudioSounds'

// Map sound names to synth types
const SOUND_MAP: Record<string, SynthSoundType> = {
  click: 'click',
  success: 'success',
  error: 'error',
  notification: 'notification',
  om: 'om',
  bell: 'bell',
  chime: 'chime',
  toggle: 'toggle',
  select: 'select',
  deselect: 'deselect',
  transition: 'transition',
  open: 'open',
  close: 'close',
  complete: 'complete',
  gong: 'gong',
  'singing-bowl': 'singing-bowl',
}

/**
 * Play a UI sound effect
 */
export function playSound(soundName: string, volume = 0.5): void {
  const synthType = SOUND_MAP[soundName]
  if (synthType) {
    playSynthSound(synthType, volume)
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
  soundName: string,
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
  cleanupSynthAudio()
}

const soundEffects = {
  playSound,
  playSoundWithHaptic,
  playOmChime,
  cleanupAudio,
}
export default soundEffects
