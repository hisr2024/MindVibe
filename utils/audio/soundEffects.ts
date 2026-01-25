/**
 * Sound Effects Utility for KIAAN Voice System
 *
 * Procedurally generated audio feedback for voice interactions.
 * All sounds are created using Web Audio API - no external audio files needed.
 */

export type SoundType =
  | 'wakeWord'      // Wake word detected
  | 'listening'     // Started listening
  | 'success'       // Successful action
  | 'error'         // Error occurred
  | 'notification'  // General notification
  | 'thinking'      // AI is processing
  | 'complete'      // Task completed
  | 'click'         // Button click
  | 'toggle'        // Toggle switch
  | 'message'       // New message received

export interface SoundConfig {
  frequency: number
  duration: number
  type: OscillatorType
  volume: number
  ramp?: 'exponential' | 'linear'
  secondFrequency?: number  // For two-tone sounds
  delay?: number            // Delay before second tone
}

// Sound configurations for each effect type
const SOUND_CONFIGS: Record<SoundType, SoundConfig | SoundConfig[]> = {
  wakeWord: {
    frequency: 800,
    duration: 0.15,
    type: 'sine',
    volume: 0.3,
    ramp: 'exponential',
  },
  listening: [
    { frequency: 440, duration: 0.08, type: 'sine', volume: 0.2 },
    { frequency: 660, duration: 0.12, type: 'sine', volume: 0.25, delay: 0.1 },
  ],
  success: [
    { frequency: 523, duration: 0.1, type: 'sine', volume: 0.25 },  // C5
    { frequency: 659, duration: 0.1, type: 'sine', volume: 0.25, delay: 0.1 },  // E5
    { frequency: 784, duration: 0.15, type: 'sine', volume: 0.3, delay: 0.2 },  // G5
  ],
  error: [
    { frequency: 200, duration: 0.15, type: 'sawtooth', volume: 0.2 },
    { frequency: 150, duration: 0.2, type: 'sawtooth', volume: 0.15, delay: 0.15 },
  ],
  notification: {
    frequency: 880,
    duration: 0.1,
    type: 'sine',
    volume: 0.2,
    secondFrequency: 1100,
    delay: 0.12,
  },
  thinking: {
    frequency: 300,
    duration: 0.5,
    type: 'sine',
    volume: 0.1,
    ramp: 'linear',
  },
  complete: [
    { frequency: 392, duration: 0.1, type: 'sine', volume: 0.2 },   // G4
    { frequency: 523, duration: 0.1, type: 'sine', volume: 0.25, delay: 0.1 },  // C5
    { frequency: 659, duration: 0.2, type: 'sine', volume: 0.3, delay: 0.2 },   // E5
  ],
  click: {
    frequency: 1000,
    duration: 0.05,
    type: 'square',
    volume: 0.1,
    ramp: 'exponential',
  },
  toggle: [
    { frequency: 600, duration: 0.06, type: 'sine', volume: 0.15 },
    { frequency: 800, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.05 },
  ],
  message: {
    frequency: 700,
    duration: 0.08,
    type: 'sine',
    volume: 0.2,
    secondFrequency: 900,
    delay: 0.1,
  },
}

// Singleton audio context
let audioContext: AudioContext | null = null

// Track if user has interacted with the page (required for AudioContext autoplay policy)
let userHasInteracted = false

// Setup user interaction tracking
if (typeof window !== 'undefined') {
  const markUserInteraction = () => {
    userHasInteracted = true
    // Clean up listeners after first interaction
    document.removeEventListener('click', markUserInteraction)
    document.removeEventListener('touchstart', markUserInteraction)
    document.removeEventListener('keydown', markUserInteraction)
    document.removeEventListener('pointerdown', markUserInteraction)
  }

  // Listen for first user interaction
  document.addEventListener('click', markUserInteraction)
  document.addEventListener('touchstart', markUserInteraction)
  document.addEventListener('keydown', markUserInteraction)
  document.addEventListener('pointerdown', markUserInteraction)
}

/**
 * Get or create the audio context
 * Returns null if user hasn't interacted yet (browser autoplay policy)
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  // Don't create AudioContext before user interaction to avoid browser warnings
  if (!userHasInteracted) {
    return null
  }

  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        audioContext = new AudioContextClass()
      }
    } catch (e) {
      console.warn('AudioContext not available:', e)
      return null
    }
  }

  // Resume if suspended (required for some browsers after user interaction)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }

  return audioContext
}

/**
 * Play a single tone
 */
function playTone(ctx: AudioContext, config: SoundConfig, startTime: number): void {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.value = config.frequency
  oscillator.type = config.type

  const actualStart = startTime + (config.delay || 0)

  // Volume envelope
  gainNode.gain.setValueAtTime(0, actualStart)
  gainNode.gain.linearRampToValueAtTime(config.volume, actualStart + 0.01)

  if (config.ramp === 'exponential') {
    gainNode.gain.exponentialRampToValueAtTime(0.001, actualStart + config.duration)
  } else {
    gainNode.gain.linearRampToValueAtTime(0, actualStart + config.duration)
  }

  oscillator.start(actualStart)
  oscillator.stop(actualStart + config.duration + 0.01)

  // Play second frequency if specified
  if (config.secondFrequency) {
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.frequency.value = config.secondFrequency
    osc2.type = config.type

    const secondStart = actualStart + (config.delay || 0.1)

    gain2.gain.setValueAtTime(0, secondStart)
    gain2.gain.linearRampToValueAtTime(config.volume, secondStart + 0.01)

    if (config.ramp === 'exponential') {
      gain2.gain.exponentialRampToValueAtTime(0.001, secondStart + config.duration)
    } else {
      gain2.gain.linearRampToValueAtTime(0, secondStart + config.duration)
    }

    osc2.start(secondStart)
    osc2.stop(secondStart + config.duration + 0.01)
  }
}

/**
 * Play a sound effect
 */
export function playSound(type: SoundType): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const config = SOUND_CONFIGS[type]
  const startTime = ctx.currentTime

  if (Array.isArray(config)) {
    // Multi-tone sound
    config.forEach((tone) => {
      playTone(ctx, tone, startTime)
    })
  } else {
    // Single tone
    playTone(ctx, config, startTime)
  }
}

/**
 * Play haptic feedback (if available)
 */
export function playHaptic(pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 30,
    heavy: 50,
    success: [30, 50, 30],
    error: [50, 100, 50, 100, 50],
  }

  try {
    navigator.vibrate(patterns[pattern])
  } catch (e) {
    // Silent fail - haptic not critical
  }
}

/**
 * Play sound with haptic feedback
 */
export function playSoundWithHaptic(
  type: SoundType,
  haptic: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'
): void {
  playSound(type)
  playHaptic(haptic)
}

/**
 * Create a custom sound effect
 */
export function playCustomSound(configs: SoundConfig[]): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const startTime = ctx.currentTime
  configs.forEach((config) => {
    playTone(ctx, config, startTime)
  })
}

/**
 * Om/spiritual chime sound for meditation contexts
 */
export function playOmChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const startTime = ctx.currentTime

  // Create a rich, harmonic Om sound
  const frequencies = [136.1, 272.2, 408.3, 544.4] // Om frequency harmonics
  const durations = [2, 1.8, 1.5, 1.2]
  const volumes = [0.15, 0.1, 0.07, 0.04]

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = freq
    osc.type = 'sine'

    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volumes[i], startTime + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[i])

    osc.start(startTime)
    osc.stop(startTime + durations[i] + 0.1)
  })
}

/**
 * Singing bowl sound for mindfulness
 */
export function playSingingBowl(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const startTime = ctx.currentTime

  // Singing bowl has multiple harmonics with slow decay
  const frequencies = [528, 1056, 1584, 2112] // Healing frequency harmonics
  const decays = [4, 3.5, 3, 2.5]
  const volumes = [0.2, 0.12, 0.08, 0.05]

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Add slight vibrato for realism
    const vibrato = ctx.createOscillator()
    const vibratoGain = ctx.createGain()

    vibrato.frequency.value = 5 // 5 Hz vibrato
    vibratoGain.gain.value = freq * 0.005 // Slight pitch variation

    vibrato.connect(vibratoGain)
    vibratoGain.connect(osc.frequency)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = freq
    osc.type = 'sine'

    // Bell-like envelope
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volumes[i], startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decays[i])

    vibrato.start(startTime)
    vibrato.stop(startTime + decays[i])
    osc.start(startTime)
    osc.stop(startTime + decays[i] + 0.1)
  })
}

/**
 * Cleanup audio context (call on unmount)
 */
export function cleanupAudio(): void {
  if (audioContext) {
    audioContext.close().catch(() => {})
    audioContext = null
  }
}

/**
 * Check if audio is supported
 */
export function isAudioSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.AudioContext || (window as any).webkitAudioContext)
}
