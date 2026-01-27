/**
 * KIAAN Binaural Beats Generator
 *
 * Generates alpha, theta, delta, and gamma brainwave frequencies
 * using Web Audio API for enhanced meditation experience.
 *
 * Binaural beats work by playing slightly different frequencies
 * in each ear, causing the brain to perceive a third frequency
 * equal to the difference - entraining brainwaves to that frequency.
 *
 * Safety: Volume is limited and frequencies are within safe ranges.
 */

export type BrainwaveType = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

export interface BinauralPreset {
  name: string
  type: BrainwaveType
  baseFrequency: number
  beatFrequency: number
  description: string
  benefits: string[]
  recommendedDuration: number // minutes
  fadeInSeconds: number
  fadeOutSeconds: number
}

export interface BinauralSession {
  preset: BinauralPreset
  isPlaying: boolean
  currentVolume: number
  elapsedSeconds: number
  remainingSeconds: number
}

// Brainwave frequency ranges
const BRAINWAVE_RANGES = {
  delta: { min: 0.5, max: 4, description: 'Deep sleep, healing, regeneration' },
  theta: { min: 4, max: 8, description: 'Deep meditation, creativity, REM sleep' },
  alpha: { min: 8, max: 13, description: 'Relaxation, calm focus, light meditation' },
  beta: { min: 13, max: 30, description: 'Active thinking, focus, alertness' },
  gamma: { min: 30, max: 100, description: 'Higher consciousness, insight, peak focus' }
}

// Preset binaural beat sessions
const BINAURAL_PRESETS: BinauralPreset[] = [
  {
    name: 'Deep Meditation',
    type: 'theta',
    baseFrequency: 200,
    beatFrequency: 6,
    description: 'Theta waves for deep meditative states and spiritual connection',
    benefits: [
      'Deeper meditation experience',
      'Enhanced intuition',
      'Creative insights',
      'Spiritual awareness',
      'Reduced anxiety'
    ],
    recommendedDuration: 20,
    fadeInSeconds: 30,
    fadeOutSeconds: 30
  },
  {
    name: 'Calm Relaxation',
    type: 'alpha',
    baseFrequency: 200,
    beatFrequency: 10,
    description: 'Alpha waves for relaxed awareness and stress relief',
    benefits: [
      'Stress reduction',
      'Mental clarity',
      'Relaxed alertness',
      'Improved learning',
      'Mind-body harmony'
    ],
    recommendedDuration: 15,
    fadeInSeconds: 20,
    fadeOutSeconds: 20
  },
  {
    name: 'Sleep Preparation',
    type: 'delta',
    baseFrequency: 180,
    beatFrequency: 2,
    description: 'Delta waves to prepare for deep, restorative sleep',
    benefits: [
      'Easier sleep onset',
      'Deeper sleep quality',
      'Physical healing',
      'Cellular regeneration',
      'Subconscious processing'
    ],
    recommendedDuration: 30,
    fadeInSeconds: 60,
    fadeOutSeconds: 0 // Keeps playing as you sleep
  },
  {
    name: 'Focus & Concentration',
    type: 'beta',
    baseFrequency: 220,
    beatFrequency: 15,
    description: 'Low beta waves for calm focus and mental clarity',
    benefits: [
      'Improved concentration',
      'Mental alertness',
      'Task completion',
      'Analytical thinking',
      'Active learning'
    ],
    recommendedDuration: 25,
    fadeInSeconds: 15,
    fadeOutSeconds: 15
  },
  {
    name: 'Transcendent Insight',
    type: 'gamma',
    baseFrequency: 250,
    beatFrequency: 40,
    description: 'Gamma waves for higher consciousness and peak experiences',
    benefits: [
      'Heightened perception',
      'Unity consciousness',
      'Spiritual insights',
      'Enhanced cognition',
      'Bliss states'
    ],
    recommendedDuration: 10,
    fadeInSeconds: 20,
    fadeOutSeconds: 20
  },
  {
    name: 'Morning Awakening',
    type: 'alpha',
    baseFrequency: 200,
    beatFrequency: 12,
    description: 'Upper alpha waves for gentle awakening and morning energy',
    benefits: [
      'Gentle wake-up',
      'Morning alertness',
      'Positive mood',
      'Mental preparation',
      'Day intention setting'
    ],
    recommendedDuration: 10,
    fadeInSeconds: 30,
    fadeOutSeconds: 10
  },
  {
    name: 'Gita Contemplation',
    type: 'theta',
    baseFrequency: 196, // Matches Earth's frequency
    beatFrequency: 7.83, // Schumann resonance
    description: 'Theta at Schumann resonance for spiritual contemplation',
    benefits: [
      'Earth-attuned meditation',
      'Deep spiritual connection',
      'Enhanced receptivity to wisdom',
      'Natural harmony',
      'Grounding while expanding'
    ],
    recommendedDuration: 20,
    fadeInSeconds: 30,
    fadeOutSeconds: 30
  },
  {
    name: 'Anxiety Relief',
    type: 'alpha',
    baseFrequency: 180,
    beatFrequency: 9,
    description: 'Mid-alpha waves for calming anxiety and nervous tension',
    benefits: [
      'Anxiety reduction',
      'Nervous system calming',
      'Mental peace',
      'Emotional balance',
      'Present moment awareness'
    ],
    recommendedDuration: 15,
    fadeInSeconds: 20,
    fadeOutSeconds: 20
  }
]

// Audio context and nodes
let audioContext: AudioContext | null = null
let leftOscillator: OscillatorNode | null = null
let rightOscillator: OscillatorNode | null = null
let leftGain: GainNode | null = null
let rightGain: GainNode | null = null
let merger: ChannelMergerNode | null = null
let masterGain: GainNode | null = null

// Session state
let currentPreset: BinauralPreset | null = null
let isPlaying = false
let sessionStartTime: number = 0
let sessionDuration: number = 0
let fadeTimeoutId: ReturnType<typeof setTimeout> | null = null

// Maximum safe volume (0.3 = 30% of max)
const MAX_VOLUME = 0.3
const DEFAULT_VOLUME = 0.15

/**
 * Initialize audio context
 */
function initAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

/**
 * Create binaural beat oscillators
 */
function createBinauralBeat(
  baseFreq: number,
  beatFreq: number,
  volume: number = DEFAULT_VOLUME
): void {
  const ctx = initAudioContext()

  // Clean up existing nodes
  stopBinauralBeat()

  // Create oscillators for left and right channels
  leftOscillator = ctx.createOscillator()
  rightOscillator = ctx.createOscillator()

  // Set frequencies (difference creates the binaural beat)
  leftOscillator.frequency.value = baseFreq
  rightOscillator.frequency.value = baseFreq + beatFreq

  // Use sine waves for pure tones
  leftOscillator.type = 'sine'
  rightOscillator.type = 'sine'

  // Create gain nodes for each channel
  leftGain = ctx.createGain()
  rightGain = ctx.createGain()
  leftGain.gain.value = 0 // Start silent for fade-in
  rightGain.gain.value = 0

  // Create channel merger for stereo output
  merger = ctx.createChannelMerger(2)

  // Create master gain
  masterGain = ctx.createGain()
  masterGain.gain.value = Math.min(volume, MAX_VOLUME)

  // Connect left oscillator to left channel (0)
  leftOscillator.connect(leftGain)
  leftGain.connect(merger, 0, 0)

  // Connect right oscillator to right channel (1)
  rightOscillator.connect(rightGain)
  rightGain.connect(merger, 0, 1)

  // Connect merger to master gain to destination
  merger.connect(masterGain)
  masterGain.connect(ctx.destination)

  // Start oscillators
  leftOscillator.start()
  rightOscillator.start()

  isPlaying = true
}

/**
 * Stop binaural beat playback
 */
export function stopBinauralBeat(): void {
  if (fadeTimeoutId) {
    clearTimeout(fadeTimeoutId)
    fadeTimeoutId = null
  }

  if (leftOscillator) {
    try {
      leftOscillator.stop()
      leftOscillator.disconnect()
    } catch { /* Already stopped */ }
    leftOscillator = null
  }

  if (rightOscillator) {
    try {
      rightOscillator.stop()
      rightOscillator.disconnect()
    } catch { /* Already stopped */ }
    rightOscillator = null
  }

  if (leftGain) {
    leftGain.disconnect()
    leftGain = null
  }

  if (rightGain) {
    rightGain.disconnect()
    rightGain = null
  }

  if (merger) {
    merger.disconnect()
    merger = null
  }

  if (masterGain) {
    masterGain.disconnect()
    masterGain = null
  }

  isPlaying = false
  currentPreset = null
}

/**
 * Fade in the binaural beat
 */
function fadeIn(seconds: number, targetVolume: number = DEFAULT_VOLUME): void {
  if (!leftGain || !rightGain || !audioContext) return

  const now = audioContext.currentTime
  const safeVolume = Math.min(targetVolume, MAX_VOLUME)

  leftGain.gain.setValueAtTime(0, now)
  rightGain.gain.setValueAtTime(0, now)

  leftGain.gain.linearRampToValueAtTime(safeVolume, now + seconds)
  rightGain.gain.linearRampToValueAtTime(safeVolume, now + seconds)
}

/**
 * Fade out the binaural beat
 */
function fadeOut(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    if (!leftGain || !rightGain || !audioContext) {
      resolve()
      return
    }

    const now = audioContext.currentTime
    const currentVolume = leftGain.gain.value

    leftGain.gain.setValueAtTime(currentVolume, now)
    rightGain.gain.setValueAtTime(currentVolume, now)

    leftGain.gain.linearRampToValueAtTime(0, now + seconds)
    rightGain.gain.linearRampToValueAtTime(0, now + seconds)

    fadeTimeoutId = setTimeout(() => {
      stopBinauralBeat()
      resolve()
    }, seconds * 1000)
  })
}

/**
 * Start a binaural beat session with a preset
 */
export async function startBinauralSession(
  presetName: string,
  durationMinutes?: number,
  volume: number = DEFAULT_VOLUME
): Promise<boolean> {
  const preset = BINAURAL_PRESETS.find(p => p.name === presetName)
  if (!preset) return false

  // Resume audio context if suspended (browser autoplay policy)
  if (audioContext?.state === 'suspended') {
    await audioContext.resume()
  }

  currentPreset = preset
  sessionDuration = (durationMinutes || preset.recommendedDuration) * 60 * 1000 // Convert to ms
  sessionStartTime = Date.now()

  // Create and start the binaural beat
  createBinauralBeat(preset.baseFrequency, preset.beatFrequency, volume)

  // Fade in
  fadeIn(preset.fadeInSeconds, volume)

  // Schedule fade out before end
  const fadeOutStart = sessionDuration - (preset.fadeOutSeconds * 1000)
  if (fadeOutStart > 0 && preset.fadeOutSeconds > 0) {
    fadeTimeoutId = setTimeout(() => {
      fadeOut(preset.fadeOutSeconds)
    }, fadeOutStart)
  }

  return true
}

/**
 * Start a custom binaural beat
 */
export function startCustomBinaural(
  baseFrequency: number,
  beatFrequency: number,
  volume: number = DEFAULT_VOLUME,
  fadeInSeconds: number = 20
): void {
  createBinauralBeat(baseFrequency, beatFrequency, volume)
  fadeIn(fadeInSeconds, volume)
}

/**
 * Get all available presets
 */
export function getBinauralPresets(): BinauralPreset[] {
  return BINAURAL_PRESETS
}

/**
 * Get preset by name
 */
export function getBinauralPreset(name: string): BinauralPreset | null {
  return BINAURAL_PRESETS.find(p => p.name === name) || null
}

/**
 * Get presets by brainwave type
 */
export function getPresetsByType(type: BrainwaveType): BinauralPreset[] {
  return BINAURAL_PRESETS.filter(p => p.type === type)
}

/**
 * Get recommended preset based on context
 */
export function getRecommendedPreset(context: {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  mood?: 'anxious' | 'tired' | 'scattered' | 'neutral' | 'spiritual'
  activity?: 'meditation' | 'sleep' | 'focus' | 'relaxation'
}): BinauralPreset {
  // Night time + sleep activity
  if (context.timeOfDay === 'night' || context.activity === 'sleep') {
    return BINAURAL_PRESETS.find(p => p.name === 'Sleep Preparation')!
  }

  // Morning awakening
  if (context.timeOfDay === 'morning' && !context.activity) {
    return BINAURAL_PRESETS.find(p => p.name === 'Morning Awakening')!
  }

  // Anxious mood
  if (context.mood === 'anxious') {
    return BINAURAL_PRESETS.find(p => p.name === 'Anxiety Relief')!
  }

  // Focus activity
  if (context.activity === 'focus' || context.mood === 'scattered') {
    return BINAURAL_PRESETS.find(p => p.name === 'Focus & Concentration')!
  }

  // Spiritual or meditation
  if (context.mood === 'spiritual' || context.activity === 'meditation') {
    return BINAURAL_PRESETS.find(p => p.name === 'Gita Contemplation')!
  }

  // Default to calm relaxation
  return BINAURAL_PRESETS.find(p => p.name === 'Calm Relaxation')!
}

/**
 * Set volume (0-1, will be capped at MAX_VOLUME)
 */
export function setVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.min(Math.max(0, volume), MAX_VOLUME)
  }
}

/**
 * Get current session info
 */
export function getCurrentSession(): BinauralSession | null {
  if (!isPlaying || !currentPreset) return null

  const elapsed = Date.now() - sessionStartTime
  const remaining = Math.max(0, sessionDuration - elapsed)

  return {
    preset: currentPreset,
    isPlaying: true,
    currentVolume: masterGain?.gain.value || 0,
    elapsedSeconds: Math.floor(elapsed / 1000),
    remainingSeconds: Math.floor(remaining / 1000)
  }
}

/**
 * Check if binaural beats are currently playing
 */
export function isBinauralPlaying(): boolean {
  return isPlaying
}

/**
 * Get brainwave information
 */
export function getBrainwaveInfo(type: BrainwaveType): { min: number; max: number; description: string } {
  return BRAINWAVE_RANGES[type]
}

/**
 * Generate introduction speech for a binaural session
 */
export function getBinauralIntroSpeech(presetName: string): string[] {
  const preset = BINAURAL_PRESETS.find(p => p.name === presetName)
  if (!preset) return ['Preset not found.']

  const speech: string[] = []

  speech.push(`Let us begin the ${preset.name} session.`)
  speech.push(preset.description)
  speech.push(`This uses ${preset.type} brainwaves at ${preset.beatFrequency} hertz.`)

  const brainwaveInfo = BRAINWAVE_RANGES[preset.type]
  speech.push(`${preset.type.charAt(0).toUpperCase() + preset.type.slice(1)} waves are associated with ${brainwaveInfo.description}.`)

  speech.push(`The benefits include: ${preset.benefits.slice(0, 3).join(', ')}.`)
  speech.push(`This session will last ${preset.recommendedDuration} minutes.`)
  speech.push(`For best results, use headphones and close your eyes.`)
  speech.push(`The sound will fade in gently over ${preset.fadeInSeconds} seconds.`)
  speech.push(`Beginning now.`)

  return speech
}

/**
 * Safety check - ensure user has headphones prompt
 */
export function getHeadphoneReminder(): string {
  return 'Binaural beats require stereo headphones to work properly. Each ear receives a slightly different frequency, and your brain perceives the difference as a rhythmic beat. Without headphones, you will just hear two tones. Are you wearing headphones?'
}

/**
 * Get explanation of how binaural beats work
 */
export function getBinauralExplanation(): string {
  return `Binaural beats work through a phenomenon called brainwave entrainment.

When you listen through headphones, each ear receives a slightly different frequency. For example, 200 hertz in the left ear and 206 hertz in the right ear.

Your brain perceives the difference - in this case, 6 hertz - as a rhythmic pulsing sound. This is the binaural beat.

Remarkably, your brainwaves begin to synchronize with this frequency. A 6 hertz beat encourages theta brainwaves, associated with deep meditation and creativity.

The Gita teaches that the mind can be trained through consistent practice. Binaural beats are a modern tool that supports this ancient wisdom, helping the mind settle into states conducive to spiritual growth.

For safety, I keep the volume moderate. Deep listening, not loud listening, is the key.`
}

/**
 * Clean up audio resources
 */
export function cleanupAudio(): void {
  stopBinauralBeat()
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}
