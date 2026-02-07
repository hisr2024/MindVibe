/**
 * Emotion Voice Adapter
 *
 * Maps detected emotions to TTS voice parameters so KIAAN's
 * voice tone adapts to the user's emotional state.
 *
 * When user is anxious → slower, softer, lower pitch
 * When user is joyful → warmer, brighter, slightly faster
 * When user is sad → gentle, slow, soothing
 * When user is angry → calm, measured, grounding
 */

export interface VoiceParams {
  rate: number        // Speech rate (0.5 - 1.5)
  pitch: number       // Pitch adjustment (-2.0 to 2.0)
  volume: number      // Volume (0.0 - 1.0)
  style: string       // TTS style hint
  warmth: number      // Conceptual warmth (0-1) for UI
}

export type VoicePersona = 'divine_guide' | 'friendly_kiaan' | 'meditation_voice'

// Base voice params per persona
const PERSONA_DEFAULTS: Record<VoicePersona, VoiceParams> = {
  divine_guide: {
    rate: 0.88,
    pitch: -0.5,
    volume: 0.9,
    style: 'divine',
    warmth: 0.9,
  },
  friendly_kiaan: {
    rate: 0.95,
    pitch: 0.1,
    volume: 1.0,
    style: 'friendly',
    warmth: 0.8,
  },
  meditation_voice: {
    rate: 0.78,
    pitch: -1.0,
    volume: 0.7,
    style: 'calm',
    warmth: 1.0,
  },
}

// Emotion adjustments (applied on top of persona defaults)
const EMOTION_ADJUSTMENTS: Record<string, Partial<VoiceParams>> = {
  anxiety: {
    rate: -0.08,       // Slower to be calming
    pitch: -0.3,       // Lower pitch is grounding
    volume: -0.1,      // Softer, less overwhelming
    warmth: 0.15,
  },
  sadness: {
    rate: -0.06,       // Gentle pace
    pitch: -0.2,       // Warm, low
    volume: -0.05,     // Soft but present
    warmth: 0.2,
  },
  anger: {
    rate: -0.04,       // Measured, steady
    pitch: -0.4,       // Deep, grounding
    volume: 0,         // Normal - don't whisper at angry person
    warmth: 0.1,
  },
  confusion: {
    rate: -0.02,       // Slightly slower for clarity
    pitch: 0.1,        // Slightly brighter, encouraging
    volume: 0,
    warmth: 0.05,
  },
  peace: {
    rate: -0.03,       // Relaxed pace
    pitch: -0.1,       // Warm
    volume: -0.05,     // Soft
    warmth: 0.1,
  },
  hope: {
    rate: 0.03,        // Slightly upbeat
    pitch: 0.2,        // Brighter
    volume: 0.05,      // Slightly more energy
    warmth: 0.1,
  },
  love: {
    rate: -0.02,       // Tender pace
    pitch: 0.1,        // Warm brightness
    volume: -0.05,     // Intimate softness
    warmth: 0.15,
  },
}

/**
 * Get voice parameters adapted to current emotion and persona
 */
export function getEmotionAdaptedParams(
  emotion?: string,
  persona: VoicePersona = 'friendly_kiaan'
): VoiceParams {
  const base = { ...PERSONA_DEFAULTS[persona] }

  if (!emotion || !EMOTION_ADJUSTMENTS[emotion]) {
    return base
  }

  const adj = EMOTION_ADJUSTMENTS[emotion]

  return {
    rate: clamp(base.rate + (adj.rate || 0), 0.5, 1.5),
    pitch: clamp(base.pitch + (adj.pitch || 0), -2.0, 2.0),
    volume: clamp(base.volume + (adj.volume || 0), 0.3, 1.0),
    style: base.style,
    warmth: clamp(base.warmth + (adj.warmth || 0), 0, 1),
  }
}

/**
 * Get all available personas
 */
export function getPersonas(): { id: VoicePersona; name: string; description: string }[] {
  return [
    {
      id: 'divine_guide',
      name: 'Divine Guide',
      description: 'Slow, deep, reverent - like Krishna speaking sacred wisdom',
    },
    {
      id: 'friendly_kiaan',
      name: 'Friendly KIAAN',
      description: 'Natural, warm, conversational - your everyday companion',
    },
    {
      id: 'meditation_voice',
      name: 'Meditation Voice',
      description: 'Whisper-soft, deeply calm - for breathwork and meditation',
    },
  ]
}

/**
 * Get recommended persona for current context
 */
export function getRecommendedPersona(
  emotion?: string,
  mode?: 'conversation' | 'meditation' | 'breathing' | 'verse'
): VoicePersona {
  if (mode === 'meditation' || mode === 'breathing') return 'meditation_voice'
  if (mode === 'verse') return 'divine_guide'
  if (emotion === 'anxiety' || emotion === 'sadness') return 'divine_guide'
  return 'friendly_kiaan'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
