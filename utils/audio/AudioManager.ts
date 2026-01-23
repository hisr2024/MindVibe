/**
 * Unified Audio Manager for MindVibe
 *
 * ॐ श्री गणेशाय नमः
 *
 * Central hub for all audio functionality based on Vedic wisdom:
 * - UI Sound Effects (clicks, toggles, notifications)
 * - Binaural Beats & Brainwave Entrainment
 * - Solfeggio Healing Frequencies (174-963 Hz)
 * - Chakra Alignment Frequencies
 * - Gita-Based Guna States (Sattva, Rajas, Tamas)
 * - Activity Soundscapes (Sleep, Meditation, Reading, Focus, Listening)
 * - Isochronic Tones for Enhanced Entrainment
 * - Ambient Soundscapes (Nature, Temple, Cosmic)
 * - Breath-Synced Audio
 *
 * Based on Bhagavad Gita principles:
 * - Chapter 6: Dhyana Yoga (Meditation)
 * - Chapter 14: Gunatray Vibhag Yoga (Three Gunas)
 * - Chapter 18: Moksha Sanyasa Yoga (Liberation)
 *
 * Usage:
 *   import { audioManager } from '@/utils/audio/AudioManager'
 *   audioManager.playUISound('click')
 *   audioManager.startBinauralBeats('meditation')
 *   audioManager.startActivitySoundscape('sleep')
 *   audioManager.playChakraFrequency('anahata')
 */

// ============ Types ============

export type UISound =
  | 'click'
  | 'toggle'
  | 'success'
  | 'error'
  | 'notification'
  | 'message'
  | 'wakeWord'
  | 'listening'
  | 'thinking'
  | 'complete'
  | 'transition'
  | 'hover'
  | 'select'
  | 'deselect'
  | 'open'
  | 'close'
  | 'swipe'
  | 'refresh'
  | 'save'
  | 'delete'
  | 'send'
  | 'receive'
  | 'levelUp'
  | 'achievement'
  | 'streak'
  | 'meditation_start'
  | 'meditation_end'
  | 'breath_in'
  | 'breath_out'
  | 'breath_hold'
  | 'gong'
  | 'bell'
  | 'chime'
  | 'om'
  | 'singing_bowl'

export type BrainwavePreset =
  | 'focus'         // Beta 14-30 Hz - Karma Yoga (Action)
  | 'relaxation'    // Alpha 8-14 Hz - Shanti (Peace)
  | 'meditation'    // Theta 4-8 Hz - Dhyana Yoga
  | 'deep_sleep'    // Delta 0.5-4 Hz - Yoga Nidra
  | 'creativity'    // Theta 6 Hz - Shristi (Creation)
  | 'healing'       // Solfeggio 528 Hz - Arogya (Health)
  | 'grounding'     // Root 396 Hz - Muladhara
  | 'clarity'       // Third Eye 852 Hz - Ajna
  | 'transcendence' // Crown 963 Hz - Sahasrara
  | 'sattva'        // Pure consciousness state
  | 'rajas'         // Active energy state
  | 'tamas'         // Deep rest state
  | 'bhakti'        // Devotional heart-centered
  | 'jnana'         // Wisdom/knowledge state
  | 'karma'         // Action/focus state
  | 'samadhi'       // Highest consciousness

// Solfeggio Frequencies - Ancient sacred healing tones
export type SolfeggioFrequency =
  | 'ut_174'    // 174 Hz - Foundation, security
  | 'ut_285'    // 285 Hz - Healing, transformation
  | 'ut_396'    // 396 Hz - Liberation from fear (UT)
  | 're_417'    // 417 Hz - Facilitating change (RE)
  | 'mi_528'    // 528 Hz - DNA repair, miracles (MI)
  | 'fa_639'    // 639 Hz - Connecting, relationships (FA)
  | 'sol_741'   // 741 Hz - Expression, solutions (SOL)
  | 'la_852'    // 852 Hz - Awakening intuition (LA)
  | 'si_963'    // 963 Hz - Divine consciousness (SI)

// Chakra System aligned with Vedic tradition
export type ChakraFrequency =
  | 'muladhara'     // Root - 396 Hz - Stability, grounding
  | 'svadhisthana'  // Sacral - 417 Hz - Creativity, emotion
  | 'manipura'      // Solar Plexus - 528 Hz - Power, will
  | 'anahata'       // Heart - 639 Hz - Love, compassion (Krishna's teachings)
  | 'vishuddha'     // Throat - 741 Hz - Truth, expression
  | 'ajna'          // Third Eye - 852 Hz - Intuition, wisdom
  | 'sahasrara'     // Crown - 963 Hz - Divine connection

// Activity-based presets for daily life
export type ActivitySoundscape =
  | 'sleep'         // Deep restorative sleep (Tamas state)
  | 'meditation'    // Deep meditation (Dhyana state)
  | 'reading'       // Study & learning (Jnana state)
  | 'focus'         // Work & concentration (Karma state)
  | 'listening'     // Receptive awareness (Bhakti state)
  | 'creativity'    // Creative flow (Shristi state)
  | 'healing'       // Physical/emotional healing
  | 'yoga'          // Yoga practice
  | 'prayer'        // Devotional practice
  | 'relaxation'    // Gentle unwinding

// Gita-based Guna states (from Chapter 14)
export type GunaState = 'sattva' | 'rajas' | 'tamas'

export type AmbientSoundscape =
  | 'nature'
  | 'rain'
  | 'ocean'
  | 'forest'
  | 'temple'
  | 'cosmic'
  | 'fire'
  | 'wind'
  | 'river'
  | 'birds'
  | 'night'
  | 'tibetan'

export type SpatialScene =
  | 'chakra_journey'
  | 'orbiting_wisdom'
  | 'nature_surround'
  | 'cosmic_meditation'
  | 'breathing_guide'
  | 'temple_bells'

export type ConsciousnessLayer =
  | 'annamaya'
  | 'pranamaya'
  | 'manomaya'
  | 'vijnanamaya'
  | 'anandamaya'

export interface AudioManagerState {
  initialized: boolean
  masterVolume: number
  uiSoundsEnabled: boolean
  binauralEnabled: boolean
  spatialEnabled: boolean
  ambientEnabled: boolean
  activityEnabled: boolean
  isochronicEnabled: boolean
  currentBrainwave: BrainwavePreset | null
  currentAmbient: AmbientSoundscape | null
  currentSpatialScene: SpatialScene | null
  currentActivity: ActivitySoundscape | null
  currentChakra: ChakraFrequency | null
  currentGuna: GunaState | null
}

export interface AudioManagerConfig {
  masterVolume?: number
  uiSoundsEnabled?: boolean
  binauralVolume?: number
  ambientVolume?: number
  spatialVolume?: number
  onStateChange?: (state: AudioManagerState) => void
}

// ============ Sound Configurations ============

const UI_SOUNDS: Record<UISound, {
  frequencies: { freq: number; duration: number; type: OscillatorType; volume: number; delay?: number }[]
  haptic?: 'light' | 'medium' | 'heavy'
}> = {
  click: {
    frequencies: [{ freq: 1000, duration: 0.04, type: 'sine', volume: 0.15 }],
    haptic: 'light'
  },
  toggle: {
    frequencies: [
      { freq: 600, duration: 0.05, type: 'sine', volume: 0.12 },
      { freq: 800, duration: 0.06, type: 'sine', volume: 0.15, delay: 0.04 }
    ],
    haptic: 'light'
  },
  success: {
    frequencies: [
      { freq: 523, duration: 0.08, type: 'sine', volume: 0.2 },  // C5
      { freq: 659, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.08 },  // E5
      { freq: 784, duration: 0.12, type: 'sine', volume: 0.25, delay: 0.16 }  // G5
    ],
    haptic: 'medium'
  },
  error: {
    frequencies: [
      { freq: 200, duration: 0.12, type: 'sawtooth', volume: 0.15 },
      { freq: 150, duration: 0.15, type: 'sawtooth', volume: 0.12, delay: 0.1 }
    ],
    haptic: 'heavy'
  },
  notification: {
    frequencies: [
      { freq: 880, duration: 0.08, type: 'sine', volume: 0.18 },
      { freq: 1100, duration: 0.1, type: 'sine', volume: 0.2, delay: 0.08 }
    ],
    haptic: 'medium'
  },
  message: {
    frequencies: [
      { freq: 700, duration: 0.06, type: 'sine', volume: 0.15 },
      { freq: 900, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.05 }
    ],
    haptic: 'light'
  },
  wakeWord: {
    frequencies: [{ freq: 800, duration: 0.12, type: 'sine', volume: 0.25 }],
    haptic: 'medium'
  },
  listening: {
    frequencies: [
      { freq: 440, duration: 0.06, type: 'sine', volume: 0.18 },
      { freq: 660, duration: 0.1, type: 'sine', volume: 0.22, delay: 0.08 }
    ]
  },
  thinking: {
    frequencies: [{ freq: 300, duration: 0.4, type: 'sine', volume: 0.1 }]
  },
  complete: {
    frequencies: [
      { freq: 392, duration: 0.08, type: 'sine', volume: 0.18 },  // G4
      { freq: 523, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.08 },  // C5
      { freq: 659, duration: 0.15, type: 'sine', volume: 0.25, delay: 0.16 }  // E5
    ],
    haptic: 'medium'
  },
  transition: {
    frequencies: [
      { freq: 400, duration: 0.1, type: 'sine', volume: 0.1 },
      { freq: 500, duration: 0.15, type: 'sine', volume: 0.12, delay: 0.08 }
    ]
  },
  hover: {
    frequencies: [{ freq: 1200, duration: 0.02, type: 'sine', volume: 0.05 }]
  },
  select: {
    frequencies: [{ freq: 800, duration: 0.04, type: 'sine', volume: 0.12 }],
    haptic: 'light'
  },
  deselect: {
    frequencies: [{ freq: 600, duration: 0.04, type: 'sine', volume: 0.1 }]
  },
  open: {
    frequencies: [
      { freq: 300, duration: 0.06, type: 'sine', volume: 0.1 },
      { freq: 450, duration: 0.08, type: 'sine', volume: 0.12, delay: 0.04 },
      { freq: 600, duration: 0.1, type: 'sine', volume: 0.15, delay: 0.1 }
    ]
  },
  close: {
    frequencies: [
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.12 },
      { freq: 450, duration: 0.08, type: 'sine', volume: 0.1, delay: 0.04 },
      { freq: 300, duration: 0.1, type: 'sine', volume: 0.08, delay: 0.1 }
    ]
  },
  swipe: {
    frequencies: [
      { freq: 400, duration: 0.03, type: 'sine', volume: 0.08 },
      { freq: 600, duration: 0.05, type: 'sine', volume: 0.1, delay: 0.02 }
    ]
  },
  refresh: {
    frequencies: [
      { freq: 500, duration: 0.05, type: 'sine', volume: 0.1 },
      { freq: 700, duration: 0.08, type: 'sine', volume: 0.12, delay: 0.15 }
    ]
  },
  save: {
    frequencies: [
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.12 },
      { freq: 800, duration: 0.1, type: 'sine', volume: 0.15, delay: 0.05 }
    ],
    haptic: 'light'
  },
  delete: {
    frequencies: [
      { freq: 300, duration: 0.08, type: 'triangle', volume: 0.12 },
      { freq: 200, duration: 0.12, type: 'triangle', volume: 0.1, delay: 0.06 }
    ],
    haptic: 'medium'
  },
  send: {
    frequencies: [
      { freq: 500, duration: 0.04, type: 'sine', volume: 0.1 },
      { freq: 700, duration: 0.05, type: 'sine', volume: 0.12, delay: 0.03 },
      { freq: 900, duration: 0.06, type: 'sine', volume: 0.1, delay: 0.06 }
    ],
    haptic: 'light'
  },
  receive: {
    frequencies: [
      { freq: 800, duration: 0.05, type: 'sine', volume: 0.12 },
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.1, delay: 0.04 }
    ],
    haptic: 'light'
  },
  levelUp: {
    frequencies: [
      { freq: 523, duration: 0.1, type: 'sine', volume: 0.2 },
      { freq: 659, duration: 0.1, type: 'sine', volume: 0.22, delay: 0.1 },
      { freq: 784, duration: 0.1, type: 'sine', volume: 0.25, delay: 0.2 },
      { freq: 1047, duration: 0.2, type: 'sine', volume: 0.3, delay: 0.3 }
    ],
    haptic: 'heavy'
  },
  achievement: {
    frequencies: [
      { freq: 440, duration: 0.08, type: 'sine', volume: 0.15 },
      { freq: 554, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.08 },
      { freq: 659, duration: 0.08, type: 'sine', volume: 0.2, delay: 0.16 },
      { freq: 880, duration: 0.2, type: 'sine', volume: 0.25, delay: 0.24 }
    ],
    haptic: 'heavy'
  },
  streak: {
    frequencies: [
      { freq: 600, duration: 0.06, type: 'sine', volume: 0.15 },
      { freq: 800, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.06 },
      { freq: 1000, duration: 0.12, type: 'sine', volume: 0.2, delay: 0.14 }
    ],
    haptic: 'medium'
  },
  meditation_start: {
    frequencies: [
      { freq: 396, duration: 0.5, type: 'sine', volume: 0.15 },
      { freq: 528, duration: 0.8, type: 'sine', volume: 0.12, delay: 0.3 }
    ]
  },
  meditation_end: {
    frequencies: [
      { freq: 528, duration: 0.4, type: 'sine', volume: 0.15 },
      { freq: 639, duration: 0.5, type: 'sine', volume: 0.12, delay: 0.3 },
      { freq: 741, duration: 0.6, type: 'sine', volume: 0.1, delay: 0.6 }
    ]
  },
  breath_in: {
    frequencies: [
      { freq: 200, duration: 0.3, type: 'sine', volume: 0.08 },
      { freq: 300, duration: 0.4, type: 'sine', volume: 0.1, delay: 0.2 }
    ]
  },
  breath_out: {
    frequencies: [
      { freq: 300, duration: 0.3, type: 'sine', volume: 0.1 },
      { freq: 200, duration: 0.4, type: 'sine', volume: 0.08, delay: 0.2 }
    ]
  },
  breath_hold: {
    frequencies: [{ freq: 250, duration: 0.2, type: 'sine', volume: 0.05 }]
  },
  gong: {
    frequencies: [
      { freq: 100, duration: 2, type: 'sine', volume: 0.3 },
      { freq: 200, duration: 1.5, type: 'sine', volume: 0.2, delay: 0 },
      { freq: 400, duration: 1, type: 'sine', volume: 0.1, delay: 0 }
    ]
  },
  bell: {
    frequencies: [
      { freq: 800, duration: 0.8, type: 'sine', volume: 0.2 },
      { freq: 1200, duration: 0.5, type: 'sine', volume: 0.15, delay: 0 },
      { freq: 1600, duration: 0.3, type: 'sine', volume: 0.1, delay: 0 }
    ]
  },
  chime: {
    frequencies: [
      { freq: 1000, duration: 0.3, type: 'sine', volume: 0.15 },
      { freq: 1500, duration: 0.25, type: 'sine', volume: 0.12, delay: 0.1 },
      { freq: 2000, duration: 0.2, type: 'sine', volume: 0.1, delay: 0.2 }
    ]
  },
  om: {
    frequencies: [
      { freq: 136.1, duration: 2, type: 'sine', volume: 0.25 },  // OM frequency
      { freq: 272.2, duration: 1.5, type: 'sine', volume: 0.15, delay: 0.5 },
      { freq: 408.3, duration: 1, type: 'sine', volume: 0.1, delay: 1 }
    ]
  },
  singing_bowl: {
    frequencies: [
      { freq: 528, duration: 3, type: 'sine', volume: 0.2 },  // Healing frequency
      { freq: 1056, duration: 2, type: 'sine', volume: 0.1, delay: 0 },
      { freq: 1584, duration: 1.5, type: 'sine', volume: 0.05, delay: 0 }
    ]
  }
}

// ============ GITA-BASED FREQUENCY CONFIGURATIONS ============

/**
 * Brainwave Configurations
 * Based on modern neuroscience + Vedic wisdom
 *
 * Bhagavad Gita References:
 * - "योगस्थः कुरु कर्माणि" (BG 2.48) - Perform action in yoga
 * - "समत्वं योग उच्यते" (BG 2.48) - Equanimity is yoga
 */
const BRAINWAVE_CONFIGS: Record<BrainwavePreset, {
  beatFrequency: number
  baseFrequency: number
  chakraFrequency?: number
  solfeggioFrequency?: number
  description: string
  descriptionSanskrit?: string
  gitaReference?: string
}> = {
  // Standard brainwave presets
  focus: {
    beatFrequency: 18,
    baseFrequency: 200,
    description: 'Beta waves for concentration',
    descriptionSanskrit: 'एकाग्रता - Ekagrata (One-pointed focus)',
    gitaReference: 'BG 6.12 - एकाग्रं मनः कृत्वा'
  },
  relaxation: {
    beatFrequency: 10,
    baseFrequency: 200,
    description: 'Alpha waves for calm awareness',
    descriptionSanskrit: 'शान्ति - Shanti (Peace)',
    gitaReference: 'BG 2.66 - नास्ति बुद्धिरयुक्तस्य'
  },
  meditation: {
    beatFrequency: 6,
    baseFrequency: 200,
    chakraFrequency: 528,
    solfeggioFrequency: 528,
    description: 'Theta waves for deep meditation',
    descriptionSanskrit: 'ध्यान - Dhyana (Meditation)',
    gitaReference: 'BG 6.10-13 - Dhyana Yoga'
  },
  deep_sleep: {
    beatFrequency: 2,
    baseFrequency: 100,
    description: 'Delta waves for restorative sleep',
    descriptionSanskrit: 'निद्रा - Nidra (Sleep)',
    gitaReference: 'BG 6.17 - युक्तस्वप्नावबोधस्य'
  },
  creativity: {
    beatFrequency: 6,
    baseFrequency: 150,
    solfeggioFrequency: 417,
    description: 'Theta waves for inspiration',
    descriptionSanskrit: 'सृष्टि - Shristi (Creation)',
    gitaReference: 'BG 10.34 - कीर्तिः श्रीर्वाक्च नारीणाम्'
  },
  healing: {
    beatFrequency: 8,
    baseFrequency: 528,
    chakraFrequency: 528,
    solfeggioFrequency: 528,
    description: 'Solfeggio 528 Hz for cellular repair',
    descriptionSanskrit: 'आरोग्य - Arogya (Health)',
    gitaReference: 'BG 6.17 - युक्ताहारविहारस्य'
  },
  grounding: {
    beatFrequency: 10,
    baseFrequency: 396,
    chakraFrequency: 396,
    solfeggioFrequency: 396,
    description: 'Root chakra for stability',
    descriptionSanskrit: 'मूलाधार - Muladhara (Root)',
    gitaReference: 'BG 6.13 - समं कायशिरोग्रीवं'
  },
  clarity: {
    beatFrequency: 6,
    baseFrequency: 852,
    chakraFrequency: 852,
    solfeggioFrequency: 852,
    description: 'Third eye for intuition',
    descriptionSanskrit: 'आज्ञा - Ajna (Command/Wisdom)',
    gitaReference: 'BG 5.16 - ज्ञानेन तु तदज्ञानं'
  },
  transcendence: {
    beatFrequency: 2,
    baseFrequency: 963,
    chakraFrequency: 963,
    solfeggioFrequency: 963,
    description: 'Crown chakra for divine connection',
    descriptionSanskrit: 'सहस्रार - Sahasrara (Thousand-petaled)',
    gitaReference: 'BG 15.19 - ब्रह्म भूय गच्छति'
  },

  // Gita-based Guna States (Chapter 14)
  sattva: {
    beatFrequency: 8,
    baseFrequency: 528,
    chakraFrequency: 639,
    solfeggioFrequency: 528,
    description: 'Pure consciousness - clarity, wisdom, harmony',
    descriptionSanskrit: 'सत्त्व - Sattva (Purity/Goodness)',
    gitaReference: 'BG 14.6 - सत्त्वं निर्मलत्वात्'
  },
  rajas: {
    beatFrequency: 15,
    baseFrequency: 200,
    chakraFrequency: 528,
    description: 'Active energy - passion, desire, action',
    descriptionSanskrit: 'रजस् - Rajas (Activity/Passion)',
    gitaReference: 'BG 14.7 - रजो रागात्मकं विद्धि'
  },
  tamas: {
    beatFrequency: 1,
    baseFrequency: 100,
    chakraFrequency: 396,
    description: 'Deep rest - stillness, restoration, grounding',
    descriptionSanskrit: 'तमस् - Tamas (Inertia/Rest)',
    gitaReference: 'BG 14.8 - तमस्त्वज्ञानजं विद्धि'
  },

  // Gita Yoga Paths
  bhakti: {
    beatFrequency: 7,
    baseFrequency: 639,
    chakraFrequency: 639,
    solfeggioFrequency: 639,
    description: 'Devotional heart-centered awareness',
    descriptionSanskrit: 'भक्ति - Bhakti (Devotion)',
    gitaReference: 'BG 12.2 - मय्यावेश्य मनो ये मां'
  },
  jnana: {
    beatFrequency: 10,
    baseFrequency: 852,
    chakraFrequency: 852,
    solfeggioFrequency: 852,
    description: 'Wisdom and knowledge state',
    descriptionSanskrit: 'ज्ञान - Jnana (Knowledge)',
    gitaReference: 'BG 4.33 - श्रेयान्द्रव्यमयाद्यज्ञात्'
  },
  karma: {
    beatFrequency: 16,
    baseFrequency: 200,
    chakraFrequency: 528,
    description: 'Focused action state',
    descriptionSanskrit: 'कर्म - Karma (Action)',
    gitaReference: 'BG 3.19 - असक्तो ह्याचरन्कर्म'
  },
  samadhi: {
    beatFrequency: 0.5,
    baseFrequency: 963,
    chakraFrequency: 963,
    solfeggioFrequency: 963,
    description: 'Highest state of consciousness - unity',
    descriptionSanskrit: 'समाधि - Samadhi (Complete absorption)',
    gitaReference: 'BG 6.20 - यत्रोपरमते चित्तं'
  }
}

/**
 * Solfeggio Frequency Configurations
 *
 * Ancient sacred frequencies discovered in Gregorian chants
 * Mathematically derived from sacred geometry patterns
 * Each frequency has specific healing properties
 */
const SOLFEGGIO_CONFIGS: Record<SolfeggioFrequency, {
  frequency: number
  name: string
  nameSanskrit: string
  description: string
  healingProperty: string
  chakraAlignment: ChakraFrequency
  color: string
}> = {
  ut_174: {
    frequency: 174,
    name: 'Foundation',
    nameSanskrit: 'आधार - Adhara',
    description: 'Lowest Solfeggio frequency - foundation of consciousness',
    healingProperty: 'Reduces pain, gives sense of security, stabilizes the physical body',
    chakraAlignment: 'muladhara',
    color: '#FF0000'
  },
  ut_285: {
    frequency: 285,
    name: 'Quantum Cognition',
    nameSanskrit: 'परिवर्तन - Parivartan',
    description: 'Influences energy field and cellular regeneration',
    healingProperty: 'Heals tissues, restructures damaged organs, promotes cell repair',
    chakraAlignment: 'svadhisthana',
    color: '#FF7F00'
  },
  ut_396: {
    frequency: 396,
    name: 'Liberation',
    nameSanskrit: 'मुक्ति - Mukti',
    description: 'UT - Liberating guilt and fear',
    healingProperty: 'Releases fear, guilt, and negative beliefs; grounds energy',
    chakraAlignment: 'muladhara',
    color: '#FF0000'
  },
  re_417: {
    frequency: 417,
    name: 'Transformation',
    nameSanskrit: 'रूपान्तर - Rupantar',
    description: 'RE - Undoing situations and facilitating change',
    healingProperty: 'Clears traumatic experiences, facilitates change, removes negativity',
    chakraAlignment: 'svadhisthana',
    color: '#FF7F00'
  },
  mi_528: {
    frequency: 528,
    name: 'Miracles',
    nameSanskrit: 'चमत्कार - Chamatkar',
    description: 'MI - Transformation and miracles (DNA repair)',
    healingProperty: 'DNA repair, cellular healing, transformation, miracles',
    chakraAlignment: 'manipura',
    color: '#FFFF00'
  },
  fa_639: {
    frequency: 639,
    name: 'Connection',
    nameSanskrit: 'संबंध - Sambandh',
    description: 'FA - Connecting and relationships',
    healingProperty: 'Enhances communication, understanding, tolerance, love',
    chakraAlignment: 'anahata',
    color: '#00FF00'
  },
  sol_741: {
    frequency: 741,
    name: 'Expression',
    nameSanskrit: 'अभिव्यक्ति - Abhivyakti',
    description: 'SOL - Awakening intuition and expression',
    healingProperty: 'Solves problems, cleanses cells, self-expression',
    chakraAlignment: 'vishuddha',
    color: '#0000FF'
  },
  la_852: {
    frequency: 852,
    name: 'Intuition',
    nameSanskrit: 'अंतर्ज्ञान - Antarjnana',
    description: 'LA - Returning to spiritual order',
    healingProperty: 'Awakens intuition, returns to spiritual order, inner strength',
    chakraAlignment: 'ajna',
    color: '#4B0082'
  },
  si_963: {
    frequency: 963,
    name: 'Divine',
    nameSanskrit: 'दिव्य - Divya',
    description: 'SI - Connection with divine consciousness',
    healingProperty: 'Activates pineal gland, connects to source, divine consciousness',
    chakraAlignment: 'sahasrara',
    color: '#9400D3'
  }
}

/**
 * Chakra Frequency Configurations
 *
 * Based on traditional Tantra and Kundalini yoga
 * Each chakra resonates with specific frequencies
 *
 * "कुण्डलिनी शक्ति" - The serpent power rises through chakras
 */
const CHAKRA_CONFIGS: Record<ChakraFrequency, {
  frequency: number
  binauralBeat: number
  element: string
  elementSanskrit: string
  name: string
  nameSanskrit: string
  location: string
  color: string
  bija: string  // Seed mantra
  qualities: string[]
  gitaConnection: string
}> = {
  muladhara: {
    frequency: 396,
    binauralBeat: 8,
    element: 'Earth',
    elementSanskrit: 'पृथ्वी',
    name: 'Root',
    nameSanskrit: 'मूलाधार',
    location: 'Base of spine',
    color: '#FF0000',
    bija: 'लं (LAM)',
    qualities: ['Stability', 'Security', 'Grounding', 'Survival'],
    gitaConnection: 'BG 6.13 - समं कायशिरोग्रीवं (steady body posture)'
  },
  svadhisthana: {
    frequency: 417,
    binauralBeat: 7,
    element: 'Water',
    elementSanskrit: 'जल',
    name: 'Sacral',
    nameSanskrit: 'स्वाधिष्ठान',
    location: 'Below navel',
    color: '#FF7F00',
    bija: 'वं (VAM)',
    qualities: ['Creativity', 'Emotion', 'Sexuality', 'Pleasure'],
    gitaConnection: 'BG 7.11 - कामोऽस्मि (I am desire aligned with dharma)'
  },
  manipura: {
    frequency: 528,
    binauralBeat: 10,
    element: 'Fire',
    elementSanskrit: 'अग्नि',
    name: 'Solar Plexus',
    nameSanskrit: 'मणिपूर',
    location: 'Above navel',
    color: '#FFFF00',
    bija: 'रं (RAM)',
    qualities: ['Power', 'Will', 'Energy', 'Transformation'],
    gitaConnection: 'BG 4.37 - ज्ञानाग्निः (fire of knowledge burns karma)'
  },
  anahata: {
    frequency: 639,
    binauralBeat: 6,
    element: 'Air',
    elementSanskrit: 'वायु',
    name: 'Heart',
    nameSanskrit: 'अनाहत',
    location: 'Center of chest',
    color: '#00FF00',
    bija: 'यं (YAM)',
    qualities: ['Love', 'Compassion', 'Empathy', 'Forgiveness'],
    gitaConnection: 'BG 18.61 - ईश्वरः सर्वभूतानां हृद्देशे (Lord dwells in heart)'
  },
  vishuddha: {
    frequency: 741,
    binauralBeat: 12,
    element: 'Ether/Space',
    elementSanskrit: 'आकाश',
    name: 'Throat',
    nameSanskrit: 'विशुद्ध',
    location: 'Throat',
    color: '#0000FF',
    bija: 'हं (HAM)',
    qualities: ['Expression', 'Truth', 'Communication', 'Creativity'],
    gitaConnection: 'BG 17.15 - अनुद्वेगकरं वाक्यं सत्यं (truthful, non-agitating speech)'
  },
  ajna: {
    frequency: 852,
    binauralBeat: 4,
    element: 'Mind',
    elementSanskrit: 'मनस्',
    name: 'Third Eye',
    nameSanskrit: 'आज्ञा',
    location: 'Between eyebrows',
    color: '#4B0082',
    bija: 'ॐ (OM)',
    qualities: ['Intuition', 'Wisdom', 'Insight', 'Vision'],
    gitaConnection: 'BG 6.13 - संप्रेक्ष्य नासिकाग्रं (gaze at tip of nose/between brows)'
  },
  sahasrara: {
    frequency: 963,
    binauralBeat: 1,
    element: 'Consciousness',
    elementSanskrit: 'चैतन्य',
    name: 'Crown',
    nameSanskrit: 'सहस्रार',
    location: 'Top of head',
    color: '#9400D3',
    bija: 'Silence/ॐ',
    qualities: ['Divine connection', 'Enlightenment', 'Unity', 'Bliss'],
    gitaConnection: 'BG 15.15 - वेदैश्च सर्वैरहमेव वेद्यो (I am to be known from all Vedas)'
  }
}

/**
 * Activity Soundscape Configurations
 *
 * Optimized frequencies for different daily activities
 * Based on scientific research + Vedic wisdom
 */
const ACTIVITY_CONFIGS: Record<ActivitySoundscape, {
  name: string
  nameSanskrit: string
  description: string
  brainwaveTarget: string
  primaryBeat: number
  baseFrequency: number
  solfeggioLayer?: number
  chakraLayer?: number
  ambientSoundscape?: AmbientSoundscape
  duration?: string
  gitaWisdom: string
}> = {
  sleep: {
    name: 'Deep Sleep',
    nameSanskrit: 'गहन निद्रा - Gahan Nidra',
    description: 'Delta waves for deep restorative sleep',
    brainwaveTarget: 'Delta (0.5-4 Hz)',
    primaryBeat: 2,
    baseFrequency: 100,
    solfeggioLayer: 174,
    chakraLayer: 396,
    ambientSoundscape: 'night',
    duration: '8 hours',
    gitaWisdom: 'BG 6.17 - युक्तस्वप्नावबोधस्य योगो भवति दुःखहा (Yoga destroys sorrow for one of regulated sleep)'
  },
  meditation: {
    name: 'Deep Meditation',
    nameSanskrit: 'गहन ध्यान - Gahan Dhyana',
    description: 'Theta waves for profound meditative states',
    brainwaveTarget: 'Theta (4-8 Hz)',
    primaryBeat: 6,
    baseFrequency: 136.1,  // OM frequency
    solfeggioLayer: 528,
    chakraLayer: 639,
    ambientSoundscape: 'temple',
    duration: '20-60 minutes',
    gitaWisdom: 'BG 6.10 - योगी युञ्जीत सततमात्मानं (The yogi should constantly practice)'
  },
  reading: {
    name: 'Study & Learning',
    nameSanskrit: 'अध्ययन - Adhyayan',
    description: 'Alpha waves for enhanced comprehension and retention',
    brainwaveTarget: 'Alpha (8-14 Hz)',
    primaryBeat: 10,
    baseFrequency: 200,
    solfeggioLayer: 852,
    chakraLayer: 852,
    ambientSoundscape: 'forest',
    duration: '1-3 hours',
    gitaWisdom: 'BG 4.38 - न हि ज्ञानेन सदृशं पवित्रमिह विद्यते (Nothing purifies like knowledge)'
  },
  focus: {
    name: 'Work & Concentration',
    nameSanskrit: 'एकाग्रता - Ekagrata',
    description: 'Beta waves for peak mental performance',
    brainwaveTarget: 'Beta (14-30 Hz)',
    primaryBeat: 16,
    baseFrequency: 200,
    solfeggioLayer: 741,
    chakraLayer: 528,
    ambientSoundscape: 'nature',
    duration: '90 minutes (pomodoro)',
    gitaWisdom: 'BG 2.48 - योगस्थः कुरु कर्माणि (Established in yoga, perform action)'
  },
  listening: {
    name: 'Receptive Awareness',
    nameSanskrit: 'ग्रहणशीलता - Grahanashilata',
    description: 'Alpha-Theta border for deep listening and absorption',
    brainwaveTarget: 'Alpha-Theta (7-8 Hz)',
    primaryBeat: 7.5,
    baseFrequency: 639,  // Heart frequency
    solfeggioLayer: 639,
    chakraLayer: 639,
    ambientSoundscape: 'tibetan',
    duration: 'Variable',
    gitaWisdom: 'BG 18.70 - अध्येष्यते च य इमं (One who studies this sacred dialogue)'
  },
  creativity: {
    name: 'Creative Flow',
    nameSanskrit: 'सृजनात्मक प्रवाह - Srijanatmak Pravah',
    description: 'Theta waves for accessing creative inspiration',
    brainwaveTarget: 'Theta (4-8 Hz)',
    primaryBeat: 6,
    baseFrequency: 150,
    solfeggioLayer: 417,
    chakraLayer: 417,
    ambientSoundscape: 'cosmic',
    duration: 'Flow state duration',
    gitaWisdom: 'BG 10.36 - द्यूतं छलयतामस्मि (I am the intelligence of the intelligent)'
  },
  healing: {
    name: 'Healing Session',
    nameSanskrit: 'उपचार - Upchar',
    description: 'Solfeggio frequencies for physical and emotional healing',
    brainwaveTarget: 'Alpha-Theta (6-10 Hz)',
    primaryBeat: 8,
    baseFrequency: 528,  // Miracle/DNA repair frequency
    solfeggioLayer: 528,
    chakraLayer: 528,
    ambientSoundscape: 'tibetan',
    duration: '30-60 minutes',
    gitaWisdom: 'BG 6.17 - युक्ताहारविहारस्य (For one moderate in eating and recreation)'
  },
  yoga: {
    name: 'Yoga Practice',
    nameSanskrit: 'योगाभ्यास - Yogabhyas',
    description: 'Balanced alpha waves for body-mind harmony',
    brainwaveTarget: 'Alpha (8-12 Hz)',
    primaryBeat: 10,
    baseFrequency: 136.1,  // OM frequency
    solfeggioLayer: 528,
    chakraLayer: 528,
    ambientSoundscape: 'temple',
    duration: '45-90 minutes',
    gitaWisdom: 'BG 6.46 - तपस्विभ्योऽधिको योगी (The yogi is greater than ascetics)'
  },
  prayer: {
    name: 'Devotional Practice',
    nameSanskrit: 'भक्ति साधना - Bhakti Sadhana',
    description: 'Heart-centered frequencies for devotion',
    brainwaveTarget: 'Alpha-Theta (6-8 Hz)',
    primaryBeat: 7,
    baseFrequency: 639,  // Heart connection
    solfeggioLayer: 639,
    chakraLayer: 639,
    ambientSoundscape: 'temple',
    duration: 'Personal',
    gitaWisdom: 'BG 9.22 - अनन्याश्चिन्तयन्तो मां (Those who worship Me with exclusive devotion)'
  },
  relaxation: {
    name: 'Gentle Unwinding',
    nameSanskrit: 'विश्रांति - Vishranti',
    description: 'Low alpha waves for peaceful relaxation',
    brainwaveTarget: 'Low Alpha (8-10 Hz)',
    primaryBeat: 8,
    baseFrequency: 200,
    solfeggioLayer: 396,
    chakraLayer: 396,
    ambientSoundscape: 'rain',
    duration: '15-45 minutes',
    gitaWisdom: 'BG 2.66 - नास्ति बुद्धिरयुक्तस्य न चायुक्तस्य भावना (No peace for the unconnected)'
  }
}

/**
 * Isochronic Tone Configurations
 *
 * More effective than binaural beats for some purposes
 * Single tone pulsed at specific rate - works without headphones
 */
const ISOCHRONIC_CONFIGS: Record<string, {
  frequency: number
  pulseRate: number  // Hz
  dutyCycle: number  // 0-1
  description: string
}> = {
  delta_deep: { frequency: 100, pulseRate: 2, dutyCycle: 0.5, description: 'Deep delta for sleep' },
  theta_meditation: { frequency: 200, pulseRate: 6, dutyCycle: 0.6, description: 'Theta for meditation' },
  alpha_relaxation: { frequency: 200, pulseRate: 10, dutyCycle: 0.5, description: 'Alpha for relaxation' },
  beta_focus: { frequency: 200, pulseRate: 18, dutyCycle: 0.4, description: 'Beta for focus' },
  gamma_insight: { frequency: 300, pulseRate: 40, dutyCycle: 0.3, description: 'Gamma for insight' },
  schumann_earth: { frequency: 136.1, pulseRate: 7.83, dutyCycle: 0.5, description: 'Earth resonance' },
  om_universal: { frequency: 136.1, pulseRate: 7.5, dutyCycle: 0.6, description: 'OM frequency pulse' }
}

// Layer to brainwave mapping
const LAYER_BRAINWAVES: Record<ConsciousnessLayer, BrainwavePreset> = {
  annamaya: 'grounding',
  pranamaya: 'relaxation',
  manomaya: 'meditation',
  vijnanamaya: 'clarity',
  anandamaya: 'transcendence'
}

// Soundscape layer configuration
interface SoundscapeLayer {
  useNoise: boolean           // Use noise buffer for natural sounds
  filterType?: BiquadFilterType
  filterFreq?: number
  filterQ?: number
  frequency?: number          // For oscillator-based sounds
  type?: OscillatorType
  volume: number
  pan?: number                // -1 (left) to 1 (right)
  modFreq?: number            // LFO modulation frequency
  fadeIn?: number             // Fade in time in seconds
}

interface SoundscapeConfig {
  layers: SoundscapeLayer[]
  ambientTone?: { frequency: number; volume: number }
}

// Realistic soundscape configurations with noise-based nature sounds
const SOUNDSCAPE_CONFIGS: Record<AmbientSoundscape, SoundscapeConfig> = {
  rain: {
    layers: [
      // Gentle rain - highpass filtered noise
      { useNoise: true, filterType: 'highpass', filterFreq: 1000, filterQ: 0.5, volume: 0.35, fadeIn: 3 },
      // Rain texture - bandpass filtered
      { useNoise: true, filterType: 'bandpass', filterFreq: 2500, filterQ: 1, volume: 0.15, fadeIn: 2 },
      // Low rumble
      { useNoise: true, filterType: 'lowpass', filterFreq: 200, filterQ: 0.5, volume: 0.1, fadeIn: 4 }
    ]
  },
  ocean: {
    layers: [
      // Deep ocean waves - lowpass filtered
      { useNoise: true, filterType: 'lowpass', filterFreq: 400, filterQ: 1, volume: 0.4, modFreq: 0.08, fadeIn: 4 },
      // Wave crashes - bandpass
      { useNoise: true, filterType: 'bandpass', filterFreq: 800, filterQ: 0.5, volume: 0.2, modFreq: 0.12, fadeIn: 3 },
      // Foam/spray - highpass
      { useNoise: true, filterType: 'highpass', filterFreq: 3000, filterQ: 0.3, volume: 0.08, modFreq: 0.15, fadeIn: 2 }
    ]
  },
  forest: {
    layers: [
      // Wind through leaves
      { useNoise: true, filterType: 'bandpass', filterFreq: 1500, filterQ: 0.5, volume: 0.2, modFreq: 0.3, fadeIn: 3 },
      // Ambient forest tone
      { useNoise: true, filterType: 'lowpass', filterFreq: 300, filterQ: 0.5, volume: 0.1, fadeIn: 4 },
      // Bird-like chirps (high frequency oscillator)
      { useNoise: false, frequency: 2000, type: 'sine', volume: 0.03, modFreq: 5, fadeIn: 2 }
    ],
    ambientTone: { frequency: 396, volume: 0.05 }
  },
  wind: {
    layers: [
      // Main wind - lowpass filtered
      { useNoise: true, filterType: 'lowpass', filterFreq: 400, filterQ: 0.8, volume: 0.3, modFreq: 0.1, fadeIn: 3 },
      // Wind gusts
      { useNoise: true, filterType: 'bandpass', filterFreq: 600, filterQ: 0.5, volume: 0.15, modFreq: 0.2, fadeIn: 2 },
      // High whistle
      { useNoise: true, filterType: 'highpass', filterFreq: 2000, filterQ: 1, volume: 0.05, modFreq: 0.3, fadeIn: 2 }
    ]
  },
  river: {
    layers: [
      // Flowing water - bandpass
      { useNoise: true, filterType: 'bandpass', filterFreq: 2000, filterQ: 0.5, volume: 0.35, modFreq: 0.2, fadeIn: 3 },
      // Deep current
      { useNoise: true, filterType: 'lowpass', filterFreq: 300, filterQ: 0.5, volume: 0.15, modFreq: 0.08, fadeIn: 4 },
      // Bubbling
      { useNoise: true, filterType: 'bandpass', filterFreq: 3000, filterQ: 2, volume: 0.08, modFreq: 0.5, fadeIn: 2 }
    ]
  },
  fire: {
    layers: [
      // Crackling - bandpass
      { useNoise: true, filterType: 'bandpass', filterFreq: 1500, filterQ: 2, volume: 0.25, modFreq: 3, fadeIn: 2 },
      // Low roar
      { useNoise: true, filterType: 'lowpass', filterFreq: 200, filterQ: 0.5, volume: 0.15, fadeIn: 3 },
      // Pops and snaps
      { useNoise: true, filterType: 'highpass', filterFreq: 2500, filterQ: 1, volume: 0.1, modFreq: 5, fadeIn: 1 }
    ]
  },
  birds: {
    layers: [
      // Background ambient
      { useNoise: true, filterType: 'lowpass', filterFreq: 400, filterQ: 0.3, volume: 0.1, fadeIn: 3 },
      // Bird chirps simulation
      { useNoise: false, frequency: 2500, type: 'sine', volume: 0.04, modFreq: 8, fadeIn: 2 },
      { useNoise: false, frequency: 3500, type: 'sine', volume: 0.03, modFreq: 12, fadeIn: 2 },
      { useNoise: false, frequency: 4500, type: 'sine', volume: 0.02, modFreq: 6, fadeIn: 2 }
    ]
  },
  night: {
    layers: [
      // Night ambient - very low
      { useNoise: true, filterType: 'lowpass', filterFreq: 150, filterQ: 0.5, volume: 0.15, fadeIn: 5 },
      // Crickets simulation
      { useNoise: false, frequency: 4000, type: 'sine', volume: 0.02, modFreq: 10, fadeIn: 3 },
      { useNoise: false, frequency: 4200, type: 'sine', volume: 0.015, modFreq: 12, fadeIn: 3 },
      // Distant sounds
      { useNoise: true, filterType: 'bandpass', filterFreq: 800, filterQ: 0.3, volume: 0.05, modFreq: 0.1, fadeIn: 4 }
    ]
  },
  temple: {
    layers: [
      // OM frequency drone
      { useNoise: false, frequency: 136.1, type: 'sine', volume: 0.15, fadeIn: 4 },
      // Harmonic
      { useNoise: false, frequency: 272.2, type: 'sine', volume: 0.08, fadeIn: 3 },
      // Healing frequency
      { useNoise: false, frequency: 528, type: 'sine', volume: 0.06, fadeIn: 3 }
    ],
    ambientTone: { frequency: 396, volume: 0.05 }
  },
  tibetan: {
    layers: [
      // Singing bowl frequencies
      { useNoise: false, frequency: 528, type: 'sine', volume: 0.15, fadeIn: 4 },
      { useNoise: false, frequency: 639, type: 'sine', volume: 0.1, fadeIn: 3 },
      { useNoise: false, frequency: 741, type: 'sine', volume: 0.08, fadeIn: 3 },
      // Subtle resonance
      { useNoise: true, filterType: 'bandpass', filterFreq: 528, filterQ: 10, volume: 0.05, fadeIn: 5 }
    ]
  },
  cosmic: {
    layers: [
      // Deep space drone
      { useNoise: false, frequency: 40, type: 'sine', volume: 0.12, modFreq: 0.02, fadeIn: 5 },
      { useNoise: false, frequency: 80, type: 'sine', volume: 0.08, modFreq: 0.03, fadeIn: 4 },
      // Cosmic wind
      { useNoise: true, filterType: 'lowpass', filterFreq: 100, filterQ: 0.5, volume: 0.1, modFreq: 0.05, fadeIn: 6 },
      // Ethereal shimmer
      { useNoise: true, filterType: 'highpass', filterFreq: 4000, filterQ: 0.5, volume: 0.03, modFreq: 0.1, fadeIn: 4 }
    ]
  },
  nature: {
    layers: [
      // General nature ambient
      { useNoise: true, filterType: 'lowpass', filterFreq: 300, filterQ: 0.5, volume: 0.15, fadeIn: 4 },
      // Leaves rustling
      { useNoise: true, filterType: 'bandpass', filterFreq: 1200, filterQ: 0.5, volume: 0.1, modFreq: 0.2, fadeIn: 3 },
      // Distant birds
      { useNoise: false, frequency: 2000, type: 'sine', volume: 0.02, modFreq: 4, fadeIn: 2 }
    ],
    ambientTone: { frequency: 396, volume: 0.03 }
  }
}

// ============ Audio Manager Class ============

class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null

  // Binaural beats nodes
  private binauralLeftOsc: OscillatorNode | null = null
  private binauralRightOsc: OscillatorNode | null = null
  private binauralGain: GainNode | null = null
  private binauralMerger: ChannelMergerNode | null = null
  private chakraOsc: OscillatorNode | null = null
  private chakraGain: GainNode | null = null

  // Ambient soundscape nodes
  private ambientOscillators: OscillatorNode[] = []
  private ambientSources: AudioBufferSourceNode[] = []
  private ambientGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null  // For realistic nature sounds

  // State
  private state: AudioManagerState = {
    initialized: false,
    masterVolume: 0.7,
    uiSoundsEnabled: true,
    binauralEnabled: false,
    spatialEnabled: false,
    ambientEnabled: false,
    activityEnabled: false,
    isochronicEnabled: false,
    currentBrainwave: null,
    currentAmbient: null,
    currentSpatialScene: null,
    currentActivity: null,
    currentChakra: null,
    currentGuna: null
  }

  // Activity soundscape nodes
  private activityOscillators: OscillatorNode[] = []
  private activitySources: AudioBufferSourceNode[] = []
  private activityGain: GainNode | null = null
  private activityVolume = 0.4

  // Isochronic tone nodes
  private isochronicOsc: OscillatorNode | null = null
  private isochronicGain: GainNode | null = null
  private isochronicLFO: OscillatorNode | null = null
  private isochronicVolume = 0.25

  // Solfeggio/Chakra nodes
  private solfeggioOsc: OscillatorNode | null = null
  private solfeggioGain: GainNode | null = null
  private chakraOscillators: OscillatorNode[] = []
  private chakraGains: GainNode[] = []

  private config: AudioManagerConfig = {}
  private binauralVolume = 0.3
  private ambientVolume = 0.25

  /**
   * Initialize the audio manager
   */
  async initialize(config?: AudioManagerConfig): Promise<boolean> {
    if (this.state.initialized) return true

    if (typeof window === 'undefined' || !('AudioContext' in window)) {
      console.warn('AudioManager: Web Audio API not supported')
      return false
    }

    try {
      this.config = config || {}
      this.audioContext = new AudioContext()

      // Create master gain
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = config?.masterVolume ?? 0.7
      this.masterGain.connect(this.audioContext.destination)

      // Create noise buffer for realistic nature sounds
      this.noiseBuffer = this.createNoiseBuffer()

      // Setup binaural beats infrastructure
      this.setupBinauralInfrastructure()

      // Setup ambient infrastructure
      this.setupAmbientInfrastructure()

      this.state.initialized = true
      this.state.masterVolume = config?.masterVolume ?? 0.7
      this.state.uiSoundsEnabled = config?.uiSoundsEnabled ?? true

      if (config?.binauralVolume) this.binauralVolume = config.binauralVolume
      if (config?.ambientVolume) this.ambientVolume = config.ambientVolume

      console.log('AudioManager: Initialized successfully')
      return true
    } catch (error) {
      console.error('AudioManager: Initialization failed', error)
      return false
    }
  }

  /**
   * Create white noise buffer for nature sounds (rain, ocean, wind, etc.)
   */
  private createNoiseBuffer(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    // Create 2 seconds of stereo white noise
    const sampleRate = this.audioContext.sampleRate
    const bufferSize = sampleRate * 2
    const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        // White noise with slight stereo variation
        data[i] = (Math.random() * 2 - 1) * (channel === 0 ? 1 : 0.98)
      }
    }

    return buffer
  }

  private setupBinauralInfrastructure(): void {
    if (!this.audioContext || !this.masterGain) return

    // Create binaural gain
    this.binauralGain = this.audioContext.createGain()
    this.binauralGain.gain.value = 0

    // Create channel merger for stereo separation
    this.binauralMerger = this.audioContext.createChannelMerger(2)
    this.binauralMerger.connect(this.binauralGain)
    this.binauralGain.connect(this.masterGain)

    // Create chakra frequency layer
    this.chakraGain = this.audioContext.createGain()
    this.chakraGain.gain.value = 0
    this.chakraGain.connect(this.masterGain)
  }

  private setupAmbientInfrastructure(): void {
    if (!this.audioContext || !this.masterGain) return

    this.ambientGain = this.audioContext.createGain()
    this.ambientGain.gain.value = 0
    this.ambientGain.connect(this.masterGain)
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // ============ UI Sounds ============

  /**
   * Play a UI sound effect
   */
  playUISound(sound: UISound): void {
    if (!this.state.uiSoundsEnabled || !this.audioContext || !this.masterGain) {
      this.ensureInitialized()
      return
    }

    this.resume()

    const config = UI_SOUNDS[sound]
    if (!config) return

    // Play haptic if available
    if (config.haptic) {
      this.playHaptic(config.haptic)
    }

    // Play audio
    config.frequencies.forEach(({ freq, duration, type, volume, delay = 0 }) => {
      setTimeout(() => {
        this.playTone(freq, duration, type, volume * this.state.masterVolume)
      }, delay * 1000)
    })
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.audioContext || !this.masterGain) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration + 0.1)
  }

  private playHaptic(pattern: 'light' | 'medium' | 'heavy'): void {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    const patterns = {
      light: [10],
      medium: [20, 10, 20],
      heavy: [30, 15, 30, 15, 30]
    }

    navigator.vibrate(patterns[pattern])
  }

  // ============ Binaural Beats ============

  /**
   * Start binaural beats
   */
  async startBinauralBeats(preset: BrainwavePreset): Promise<void> {
    if (!this.audioContext || !this.binauralMerger || !this.binauralGain) {
      await this.ensureInitialized()
      if (!this.audioContext) return
    }

    await this.resume()

    // Stop any existing binaural beats
    this.stopBinauralBeats()

    const config = BRAINWAVE_CONFIGS[preset]

    // Create left oscillator (base frequency)
    this.binauralLeftOsc = this.audioContext!.createOscillator()
    this.binauralLeftOsc.type = 'sine'
    this.binauralLeftOsc.frequency.value = config.baseFrequency

    const leftGain = this.audioContext!.createGain()
    leftGain.gain.value = 0.5
    this.binauralLeftOsc.connect(leftGain)
    leftGain.connect(this.binauralMerger!, 0, 0)

    // Create right oscillator (base + beat frequency)
    this.binauralRightOsc = this.audioContext!.createOscillator()
    this.binauralRightOsc.type = 'sine'
    this.binauralRightOsc.frequency.value = config.baseFrequency + config.beatFrequency

    const rightGain = this.audioContext!.createGain()
    rightGain.gain.value = 0.5
    this.binauralRightOsc.connect(rightGain)
    rightGain.connect(this.binauralMerger!, 0, 1)

    // Add chakra frequency if specified
    if (config.chakraFrequency && this.chakraGain) {
      this.chakraOsc = this.audioContext!.createOscillator()
      this.chakraOsc.type = 'sine'
      this.chakraOsc.frequency.value = config.chakraFrequency
      this.chakraOsc.connect(this.chakraGain)
      this.chakraOsc.start()

      this.chakraGain.gain.setTargetAtTime(0.1 * this.binauralVolume, this.audioContext!.currentTime, 0.5)
    }

    // Start oscillators
    this.binauralLeftOsc.start()
    this.binauralRightOsc.start()

    // Fade in
    this.binauralGain!.gain.setTargetAtTime(this.binauralVolume, this.audioContext!.currentTime, 1)

    this.state.binauralEnabled = true
    this.state.currentBrainwave = preset
    this.emitStateChange()

    console.log(`AudioManager: Started binaural beats - ${preset}`)
  }

  /**
   * Stop binaural beats
   */
  stopBinauralBeats(): void {
    if (this.binauralGain && this.audioContext) {
      this.binauralGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5)
    }

    if (this.chakraGain && this.audioContext) {
      this.chakraGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5)
    }

    setTimeout(() => {
      this.binauralLeftOsc?.stop()
      this.binauralRightOsc?.stop()
      this.chakraOsc?.stop()
      this.binauralLeftOsc = null
      this.binauralRightOsc = null
      this.chakraOsc = null
    }, 600)

    this.state.binauralEnabled = false
    this.state.currentBrainwave = null
    this.emitStateChange()
  }

  /**
   * Set binaural beats for consciousness layer
   */
  async setBinauralForLayer(layer: ConsciousnessLayer): Promise<void> {
    const preset = LAYER_BRAINWAVES[layer]
    await this.startBinauralBeats(preset)
  }

  /**
   * Set binaural beats volume
   */
  setBinauralVolume(volume: number): void {
    this.binauralVolume = Math.max(0, Math.min(1, volume))

    if (this.binauralGain && this.audioContext && this.state.binauralEnabled) {
      this.binauralGain.gain.setTargetAtTime(this.binauralVolume, this.audioContext.currentTime, 0.1)
    }

    if (this.chakraGain && this.audioContext) {
      this.chakraGain.gain.setTargetAtTime(0.1 * this.binauralVolume, this.audioContext.currentTime, 0.1)
    }
  }

  // ============ Ambient Soundscapes ============

  /**
   * Start ambient soundscape with realistic noise-based sounds
   */
  async startAmbientSoundscape(soundscape: AmbientSoundscape): Promise<void> {
    if (!this.audioContext || !this.ambientGain || !this.noiseBuffer) {
      await this.ensureInitialized()
      if (!this.audioContext || !this.noiseBuffer) return
    }

    await this.resume()

    // Stop existing ambient
    this.stopAmbientSoundscape()

    // Get soundscape configuration
    const config = SOUNDSCAPE_CONFIGS[soundscape]
    const now = this.audioContext!.currentTime

    // Create each layer of the soundscape
    config.layers.forEach(layer => {
      if (layer.useNoise) {
        // Noise-based sound (rain, ocean, wind, etc.)
        this.createNoiseLayer(layer, now)
      } else {
        // Oscillator-based sound (sacred tones, drones)
        this.createOscillatorLayer(layer, now)
      }
    })

    // Fade in master ambient gain
    this.ambientGain!.gain.setTargetAtTime(this.ambientVolume, now, 2)

    // Add ambient tone if specified
    const ambientTone = config.ambientTone
    if (ambientTone) {
      const toneOsc = this.audioContext!.createOscillator()
      toneOsc.type = 'sine'
      toneOsc.frequency.value = ambientTone.frequency

      const toneGain = this.audioContext!.createGain()
      toneGain.gain.setValueAtTime(0, now)
      toneGain.gain.linearRampToValueAtTime(ambientTone.volume * this.ambientVolume, now + 4)

      toneOsc.connect(toneGain)
      toneGain.connect(this.ambientGain!)
      toneOsc.start()

      this.ambientOscillators.push(toneOsc)
    }

    this.state.ambientEnabled = true
    this.state.currentAmbient = soundscape
    this.emitStateChange()

    console.log(`AudioManager: Started ambient soundscape - ${soundscape}`)
  }

  /**
   * Create a noise-based ambient layer (rain, ocean, wind, etc.)
   */
  private createNoiseLayer(layer: SoundscapeLayer, startTime: number): void {
    if (!this.audioContext || !this.noiseBuffer || !this.ambientGain) return

    // Create noise source from buffer
    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = this.noiseBuffer
    noiseSource.loop = true

    // Create filter for shaping the noise
    const filter = this.audioContext.createBiquadFilter()
    filter.type = layer.filterType || 'lowpass'
    filter.frequency.value = layer.filterFreq || 1000
    filter.Q.value = layer.filterQ || 0.5

    // Create gain node
    const gainNode = this.audioContext.createGain()
    const targetVolume = layer.volume * this.ambientVolume
    const fadeIn = layer.fadeIn || 2
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + fadeIn)

    // Add modulation (LFO) for natural movement
    if (layer.modFreq) {
      const lfo = this.audioContext.createOscillator()
      const lfoGain = this.audioContext.createGain()
      lfo.frequency.value = layer.modFreq
      lfoGain.gain.value = targetVolume * 0.4  // Modulation depth
      lfo.connect(lfoGain)
      lfoGain.connect(gainNode.gain)
      lfo.start()
    }

    // Add stereo panning if specified
    if (layer.pan !== undefined && 'createStereoPanner' in this.audioContext) {
      const panner = this.audioContext.createStereoPanner()
      panner.pan.value = layer.pan
      noiseSource.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(panner)
      panner.connect(this.ambientGain)
    } else {
      noiseSource.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.ambientGain)
    }

    noiseSource.start()
    this.ambientSources.push(noiseSource)
  }

  /**
   * Create an oscillator-based ambient layer (drones, sacred tones)
   */
  private createOscillatorLayer(layer: SoundscapeLayer, startTime: number): void {
    if (!this.audioContext || !this.ambientGain) return

    const osc = this.audioContext.createOscillator()
    osc.type = layer.type || 'sine'
    osc.frequency.value = layer.frequency || 440

    // Slight detuning for richer sound
    osc.detune.value = Math.random() * 10 - 5

    // Create gain node with fade in
    const gainNode = this.audioContext.createGain()
    const targetVolume = layer.volume * this.ambientVolume
    const fadeIn = layer.fadeIn || 2
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + fadeIn)

    // Add modulation for natural movement
    if (layer.modFreq) {
      const lfo = this.audioContext.createOscillator()
      const lfoGain = this.audioContext.createGain()
      lfo.frequency.value = layer.modFreq
      lfoGain.gain.value = layer.frequency ? layer.frequency * 0.02 : 10  // Subtle pitch modulation
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start()
    }

    osc.connect(gainNode)
    gainNode.connect(this.ambientGain)
    osc.start()

    this.ambientOscillators.push(osc)
  }

  /**
   * Stop ambient soundscape
   */
  stopAmbientSoundscape(): void {
    if (this.ambientGain && this.audioContext) {
      this.ambientGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 1)
    }

    setTimeout(() => {
      // Stop oscillators
      this.ambientOscillators.forEach(osc => {
        try { osc.stop() } catch {}
      })
      this.ambientOscillators = []

      // Stop noise sources
      this.ambientSources.forEach(source => {
        try { source.stop() } catch {}
      })
      this.ambientSources = []
    }, 1200)

    this.state.ambientEnabled = false
    this.state.currentAmbient = null
    this.emitStateChange()
  }

  /**
   * Set ambient volume
   */
  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume))

    if (this.ambientGain && this.audioContext && this.state.ambientEnabled) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.audioContext.currentTime, 0.1)
    }
  }

  // ============ GITA-BASED ACTIVITY SOUNDSCAPES ============

  /**
   * Start activity-optimized soundscape
   *
   * Combines brainwave entrainment, solfeggio frequencies,
   * chakra alignment, and ambient soundscapes for specific activities
   *
   * Based on Bhagavad Gita's guidance for different states of being
   */
  async startActivitySoundscape(activity: ActivitySoundscape): Promise<void> {
    if (!this.audioContext) {
      await this.ensureInitialized()
      if (!this.audioContext) return
    }

    await this.resume()

    // Stop existing activity soundscape
    this.stopActivitySoundscape()

    const config = ACTIVITY_CONFIGS[activity]
    const now = this.audioContext!.currentTime

    // Setup activity gain
    if (!this.activityGain) {
      this.activityGain = this.audioContext!.createGain()
      this.activityGain.gain.value = 0
      this.activityGain.connect(this.masterGain!)
    }

    // 1. Start binaural beats for brainwave entrainment
    await this.createActivityBinauralLayer(config.primaryBeat, config.baseFrequency, now)

    // 2. Add solfeggio frequency layer
    if (config.solfeggioLayer) {
      this.createSolfeggioLayer(config.solfeggioLayer, 0.15, now)
    }

    // 3. Add chakra alignment layer
    if (config.chakraLayer) {
      this.createChakraLayer(config.chakraLayer, 0.1, now)
    }

    // 4. Start ambient soundscape if specified
    if (config.ambientSoundscape) {
      await this.startAmbientSoundscape(config.ambientSoundscape)
    }

    // Fade in
    this.activityGain!.gain.setTargetAtTime(this.activityVolume, now, 2)

    this.state.activityEnabled = true
    this.state.currentActivity = activity
    this.emitStateChange()

    console.log(`AudioManager: Started activity soundscape - ${activity} (${config.nameSanskrit})`)
    console.log(`Gita Wisdom: ${config.gitaWisdom}`)
  }

  /**
   * Create binaural beat layer for activity
   */
  private async createActivityBinauralLayer(
    beatFreq: number,
    baseFreq: number,
    startTime: number
  ): Promise<void> {
    if (!this.audioContext || !this.activityGain) return

    // Left ear - base frequency
    const leftOsc = this.audioContext.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = baseFreq

    const leftGain = this.audioContext.createGain()
    leftGain.gain.setValueAtTime(0, startTime)
    leftGain.gain.linearRampToValueAtTime(0.15, startTime + 3)

    // Pan left
    const leftPanner = this.audioContext.createStereoPanner()
    leftPanner.pan.value = -1

    leftOsc.connect(leftGain)
    leftGain.connect(leftPanner)
    leftPanner.connect(this.activityGain)

    // Right ear - base + beat frequency
    const rightOsc = this.audioContext.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.value = baseFreq + beatFreq

    const rightGain = this.audioContext.createGain()
    rightGain.gain.setValueAtTime(0, startTime)
    rightGain.gain.linearRampToValueAtTime(0.15, startTime + 3)

    // Pan right
    const rightPanner = this.audioContext.createStereoPanner()
    rightPanner.pan.value = 1

    rightOsc.connect(rightGain)
    rightGain.connect(rightPanner)
    rightPanner.connect(this.activityGain)

    // Start
    leftOsc.start()
    rightOsc.start()

    this.activityOscillators.push(leftOsc, rightOsc)
  }

  /**
   * Create solfeggio frequency layer
   */
  private createSolfeggioLayer(frequency: number, volume: number, startTime: number): void {
    if (!this.audioContext || !this.activityGain) return

    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volume * this.activityVolume, startTime + 4)

    // Add subtle chorus effect with second detuned oscillator
    const osc2 = this.audioContext.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = frequency
    osc2.detune.value = 5

    const gain2 = this.audioContext.createGain()
    gain2.gain.setValueAtTime(0, startTime)
    gain2.gain.linearRampToValueAtTime(volume * 0.3 * this.activityVolume, startTime + 4)

    osc.connect(gain)
    gain.connect(this.activityGain)

    osc2.connect(gain2)
    gain2.connect(this.activityGain)

    osc.start()
    osc2.start()

    this.activityOscillators.push(osc, osc2)
  }

  /**
   * Create chakra frequency layer
   */
  private createChakraLayer(frequency: number, volume: number, startTime: number): void {
    if (!this.audioContext || !this.activityGain) return

    // Main chakra frequency
    const osc = this.audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volume * this.activityVolume, startTime + 5)

    // Add harmonic for richness
    const harmonic = this.audioContext.createOscillator()
    harmonic.type = 'sine'
    harmonic.frequency.value = frequency * 2

    const harmonicGain = this.audioContext.createGain()
    harmonicGain.gain.setValueAtTime(0, startTime)
    harmonicGain.gain.linearRampToValueAtTime(volume * 0.15 * this.activityVolume, startTime + 5)

    osc.connect(gain)
    gain.connect(this.activityGain)

    harmonic.connect(harmonicGain)
    harmonicGain.connect(this.activityGain)

    osc.start()
    harmonic.start()

    this.activityOscillators.push(osc, harmonic)
  }

  /**
   * Stop activity soundscape
   */
  stopActivitySoundscape(): void {
    if (this.activityGain && this.audioContext) {
      this.activityGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 1)
    }

    setTimeout(() => {
      this.activityOscillators.forEach(osc => {
        try { osc.stop() } catch {}
      })
      this.activityOscillators = []

      this.activitySources.forEach(source => {
        try { source.stop() } catch {}
      })
      this.activitySources = []
    }, 1200)

    // Also stop ambient if it was started
    this.stopAmbientSoundscape()

    this.state.activityEnabled = false
    this.state.currentActivity = null
    this.emitStateChange()
  }

  /**
   * Set activity soundscape volume
   */
  setActivityVolume(volume: number): void {
    this.activityVolume = Math.max(0, Math.min(1, volume))

    if (this.activityGain && this.audioContext && this.state.activityEnabled) {
      this.activityGain.gain.setTargetAtTime(this.activityVolume, this.audioContext.currentTime, 0.1)
    }
  }

  // ============ SOLFEGGIO FREQUENCIES ============

  /**
   * Play individual solfeggio frequency
   *
   * Ancient sacred healing tones for specific purposes
   */
  async playSolfeggioFrequency(solfeggio: SolfeggioFrequency, duration?: number): Promise<void> {
    if (!this.audioContext) {
      await this.ensureInitialized()
      if (!this.audioContext) return
    }

    await this.resume()

    // Stop existing solfeggio
    this.stopSolfeggioFrequency()

    const config = SOLFEGGIO_CONFIGS[solfeggio]
    const now = this.audioContext!.currentTime

    // Create main frequency
    this.solfeggioOsc = this.audioContext!.createOscillator()
    this.solfeggioOsc.type = 'sine'
    this.solfeggioOsc.frequency.value = config.frequency

    // Create gain with fade in
    this.solfeggioGain = this.audioContext!.createGain()
    this.solfeggioGain.gain.setValueAtTime(0, now)
    this.solfeggioGain.gain.linearRampToValueAtTime(0.3, now + 3)

    // Add subtle harmonic
    const harmonic = this.audioContext!.createOscillator()
    harmonic.type = 'sine'
    harmonic.frequency.value = config.frequency * 2

    const harmonicGain = this.audioContext!.createGain()
    harmonicGain.gain.setValueAtTime(0, now)
    harmonicGain.gain.linearRampToValueAtTime(0.08, now + 4)

    this.solfeggioOsc.connect(this.solfeggioGain)
    this.solfeggioGain.connect(this.masterGain!)

    harmonic.connect(harmonicGain)
    harmonicGain.connect(this.masterGain!)

    this.solfeggioOsc.start()
    harmonic.start()

    console.log(`AudioManager: Playing Solfeggio ${config.frequency}Hz - ${config.name} (${config.nameSanskrit})`)
    console.log(`Healing: ${config.healingProperty}`)

    // Auto-stop after duration if specified
    if (duration) {
      setTimeout(() => {
        this.stopSolfeggioFrequency()
      }, duration * 1000)
    }
  }

  /**
   * Stop solfeggio frequency
   */
  stopSolfeggioFrequency(): void {
    if (this.solfeggioGain && this.audioContext) {
      this.solfeggioGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5)
    }

    setTimeout(() => {
      this.solfeggioOsc?.stop()
      this.solfeggioOsc = null
      this.solfeggioGain = null
    }, 600)
  }

  // ============ CHAKRA FREQUENCIES ============

  /**
   * Play chakra alignment frequency
   *
   * Based on Kundalini yoga tradition
   * "कुण्डलिनी शक्ति जागरण" - Kundalini Shakti awakening
   */
  async playChakraFrequency(chakra: ChakraFrequency, withBinaural = true): Promise<void> {
    if (!this.audioContext) {
      await this.ensureInitialized()
      if (!this.audioContext) return
    }

    await this.resume()

    // Stop existing chakra sounds
    this.stopChakraFrequency()

    const config = CHAKRA_CONFIGS[chakra]
    const now = this.audioContext!.currentTime

    // Main chakra frequency
    const mainOsc = this.audioContext!.createOscillator()
    mainOsc.type = 'sine'
    mainOsc.frequency.value = config.frequency

    const mainGain = this.audioContext!.createGain()
    mainGain.gain.setValueAtTime(0, now)
    mainGain.gain.linearRampToValueAtTime(0.25, now + 4)

    mainOsc.connect(mainGain)
    mainGain.connect(this.masterGain!)
    mainOsc.start()

    this.chakraOscillators.push(mainOsc)
    this.chakraGains.push(mainGain)

    // Add binaural entrainment if requested
    if (withBinaural) {
      // Left oscillator
      const leftOsc = this.audioContext!.createOscillator()
      leftOsc.type = 'sine'
      leftOsc.frequency.value = config.frequency

      const leftGain = this.audioContext!.createGain()
      leftGain.gain.setValueAtTime(0, now)
      leftGain.gain.linearRampToValueAtTime(0.12, now + 3)

      const leftPanner = this.audioContext!.createStereoPanner()
      leftPanner.pan.value = -1

      leftOsc.connect(leftGain)
      leftGain.connect(leftPanner)
      leftPanner.connect(this.masterGain!)
      leftOsc.start()

      // Right oscillator with binaural beat
      const rightOsc = this.audioContext!.createOscillator()
      rightOsc.type = 'sine'
      rightOsc.frequency.value = config.frequency + config.binauralBeat

      const rightGain = this.audioContext!.createGain()
      rightGain.gain.setValueAtTime(0, now)
      rightGain.gain.linearRampToValueAtTime(0.12, now + 3)

      const rightPanner = this.audioContext!.createStereoPanner()
      rightPanner.pan.value = 1

      rightOsc.connect(rightGain)
      rightGain.connect(rightPanner)
      rightPanner.connect(this.masterGain!)
      rightOsc.start()

      this.chakraOscillators.push(leftOsc, rightOsc)
      this.chakraGains.push(leftGain, rightGain)
    }

    this.state.currentChakra = chakra
    this.emitStateChange()

    console.log(`AudioManager: Playing Chakra ${config.name} (${config.nameSanskrit}) - ${config.frequency}Hz`)
    console.log(`Bija Mantra: ${config.bija}`)
    console.log(`Element: ${config.element} (${config.elementSanskrit})`)
    console.log(`Gita: ${config.gitaConnection}`)
  }

  /**
   * Stop chakra frequency
   */
  stopChakraFrequency(): void {
    this.chakraGains.forEach(gain => {
      if (this.audioContext) {
        gain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5)
      }
    })

    setTimeout(() => {
      this.chakraOscillators.forEach(osc => {
        try { osc.stop() } catch {}
      })
      this.chakraOscillators = []
      this.chakraGains = []
    }, 600)

    this.state.currentChakra = null
    this.emitStateChange()
  }

  /**
   * Play full chakra journey - ascend through all 7 chakras
   *
   * Based on Kundalini yoga - energy rises from Muladhara to Sahasrara
   */
  async playChakraJourney(durationPerChakra = 60): Promise<void> {
    const chakras: ChakraFrequency[] = [
      'muladhara', 'svadhisthana', 'manipura',
      'anahata', 'vishuddha', 'ajna', 'sahasrara'
    ]

    console.log('AudioManager: Starting Chakra Journey - कुण्डलिनी जागरण')

    for (const chakra of chakras) {
      await this.playChakraFrequency(chakra, true)
      await new Promise(resolve => setTimeout(resolve, durationPerChakra * 1000))
    }

    console.log('AudioManager: Chakra Journey complete - समाधि प्राप्ति')
    this.stopChakraFrequency()
  }

  // ============ ISOCHRONIC TONES ============

  /**
   * Start isochronic tone for brain entrainment
   *
   * More effective than binaural beats for some purposes
   * Works without headphones
   */
  async startIsochronicTone(
    frequency: number,
    pulseRate: number,
    dutyCycle = 0.5
  ): Promise<void> {
    if (!this.audioContext) {
      await this.ensureInitialized()
      if (!this.audioContext) return
    }

    await this.resume()

    // Stop existing isochronic
    this.stopIsochronicTone()

    const now = this.audioContext!.currentTime

    // Main carrier oscillator
    this.isochronicOsc = this.audioContext!.createOscillator()
    this.isochronicOsc.type = 'sine'
    this.isochronicOsc.frequency.value = frequency

    // Gain for the pulse
    this.isochronicGain = this.audioContext!.createGain()
    this.isochronicGain.gain.value = 0

    // LFO to create the pulse (square wave)
    this.isochronicLFO = this.audioContext!.createOscillator()
    this.isochronicLFO.type = 'square'
    this.isochronicLFO.frequency.value = pulseRate

    // LFO gain to control pulse depth
    const lfoGain = this.audioContext!.createGain()
    lfoGain.gain.value = this.isochronicVolume * dutyCycle

    // Connect
    this.isochronicOsc.connect(this.isochronicGain)
    this.isochronicLFO.connect(lfoGain)
    lfoGain.connect(this.isochronicGain.gain)
    this.isochronicGain.connect(this.masterGain!)

    // Start
    this.isochronicOsc.start()
    this.isochronicLFO.start()

    this.state.isochronicEnabled = true
    this.emitStateChange()

    console.log(`AudioManager: Started isochronic tone - ${frequency}Hz @ ${pulseRate}Hz pulse`)
  }

  /**
   * Start preset isochronic tone
   */
  async startIsochronicPreset(preset: keyof typeof ISOCHRONIC_CONFIGS): Promise<void> {
    const config = ISOCHRONIC_CONFIGS[preset]
    await this.startIsochronicTone(config.frequency, config.pulseRate, config.dutyCycle)
  }

  /**
   * Stop isochronic tone
   */
  stopIsochronicTone(): void {
    if (this.isochronicGain && this.audioContext) {
      this.isochronicGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3)
    }

    setTimeout(() => {
      this.isochronicOsc?.stop()
      this.isochronicLFO?.stop()
      this.isochronicOsc = null
      this.isochronicGain = null
      this.isochronicLFO = null
    }, 400)

    this.state.isochronicEnabled = false
    this.emitStateChange()
  }

  /**
   * Set isochronic tone volume
   */
  setIsochronicVolume(volume: number): void {
    this.isochronicVolume = Math.max(0, Math.min(1, volume))
  }

  // ============ GUNA-BASED PRESETS ============

  /**
   * Set audio state based on Gita's three Gunas
   *
   * From Bhagavad Gita Chapter 14:
   * - Sattva: Purity, clarity, wisdom
   * - Rajas: Activity, passion, energy
   * - Tamas: Rest, stillness, grounding
   */
  async setGunaState(guna: GunaState): Promise<void> {
    this.state.currentGuna = guna

    switch (guna) {
      case 'sattva':
        // Pure consciousness - clarity and wisdom
        await this.startBinauralBeats('sattva')
        await this.playSolfeggioFrequency('mi_528')
        break

      case 'rajas':
        // Active energy - action and focus
        await this.startBinauralBeats('rajas')
        await this.startActivitySoundscape('focus')
        break

      case 'tamas':
        // Deep rest - stillness and restoration
        await this.startBinauralBeats('tamas')
        await this.startActivitySoundscape('sleep')
        break
    }

    this.emitStateChange()
    console.log(`AudioManager: Set Guna state to ${guna} based on BG Chapter 14`)
  }

  // ============ Master Controls ============

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume))

    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(this.state.masterVolume, this.audioContext.currentTime, 0.1)
    }

    this.emitStateChange()
  }

  /**
   * Toggle UI sounds
   */
  setUISoundsEnabled(enabled: boolean): void {
    this.state.uiSoundsEnabled = enabled
    this.emitStateChange()
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.stopBinauralBeats()
    this.stopAmbientSoundscape()
    this.stopActivitySoundscape()
    this.stopSolfeggioFrequency()
    this.stopChakraFrequency()
    this.stopIsochronicTone()
  }

  /**
   * Get current state
   */
  getState(): AudioManagerState {
    return { ...this.state }
  }

  /**
   * Get available brainwave presets
   */
  getBrainwavePresets(): { id: BrainwavePreset; description: string }[] {
    return Object.entries(BRAINWAVE_CONFIGS).map(([id, config]) => ({
      id: id as BrainwavePreset,
      description: config.description
    }))
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAll()

    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
    this.masterGain = null
    this.state.initialized = false
  }

  // ============ Private Helpers ============

  private async ensureInitialized(): Promise<void> {
    if (!this.state.initialized) {
      await this.initialize(this.config)
    }
  }

  private emitStateChange(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange(this.getState())
    }
  }
}

// ============ Singleton Export ============

let audioManagerInstance: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager()
  }
  return audioManagerInstance
}

export const audioManager = getAudioManager()

// ============ Convenience Functions ============

/**
 * Play a UI sound (auto-initializes if needed)
 */
export function playUISound(sound: UISound): void {
  audioManager.playUISound(sound)
}

/**
 * Start binaural beats (auto-initializes if needed)
 */
export async function startBinauralBeats(preset: BrainwavePreset): Promise<void> {
  await audioManager.startBinauralBeats(preset)
}

/**
 * Stop binaural beats
 */
export function stopBinauralBeats(): void {
  audioManager.stopBinauralBeats()
}

/**
 * Start ambient soundscape (auto-initializes if needed)
 */
export async function startAmbientSoundscape(soundscape: AmbientSoundscape): Promise<void> {
  await audioManager.startAmbientSoundscape(soundscape)
}

/**
 * Stop ambient soundscape
 */
export function stopAmbientSoundscape(): void {
  audioManager.stopAmbientSoundscape()
}

/**
 * Play meditation sounds
 */
export function playMeditationStart(): void {
  audioManager.playUISound('meditation_start')
}

export function playMeditationEnd(): void {
  audioManager.playUISound('meditation_end')
}

export function playGong(): void {
  audioManager.playUISound('gong')
}

export function playBell(): void {
  audioManager.playUISound('bell')
}

export function playOm(): void {
  audioManager.playUISound('om')
}

export function playSingingBowl(): void {
  audioManager.playUISound('singing_bowl')
}

// ============ Gita-Based Functions ============

/**
 * Start activity-optimized soundscape
 */
export async function startActivitySoundscape(activity: ActivitySoundscape): Promise<void> {
  await audioManager.startActivitySoundscape(activity)
}

/**
 * Stop activity soundscape
 */
export function stopActivitySoundscape(): void {
  audioManager.stopActivitySoundscape()
}

/**
 * Play solfeggio healing frequency
 */
export async function playSolfeggioFrequency(solfeggio: SolfeggioFrequency, duration?: number): Promise<void> {
  await audioManager.playSolfeggioFrequency(solfeggio, duration)
}

/**
 * Stop solfeggio frequency
 */
export function stopSolfeggioFrequency(): void {
  audioManager.stopSolfeggioFrequency()
}

/**
 * Play chakra alignment frequency
 */
export async function playChakraFrequency(chakra: ChakraFrequency, withBinaural = true): Promise<void> {
  await audioManager.playChakraFrequency(chakra, withBinaural)
}

/**
 * Stop chakra frequency
 */
export function stopChakraFrequency(): void {
  audioManager.stopChakraFrequency()
}

/**
 * Play full chakra journey
 */
export async function playChakraJourney(durationPerChakra = 60): Promise<void> {
  await audioManager.playChakraJourney(durationPerChakra)
}

/**
 * Start isochronic tone
 */
export async function startIsochronicTone(
  frequency: number,
  pulseRate: number,
  dutyCycle?: number
): Promise<void> {
  await audioManager.startIsochronicTone(frequency, pulseRate, dutyCycle)
}

/**
 * Stop isochronic tone
 */
export function stopIsochronicTone(): void {
  audioManager.stopIsochronicTone()
}

/**
 * Set Guna state (Sattva, Rajas, Tamas)
 */
export async function setGunaState(guna: GunaState): Promise<void> {
  await audioManager.setGunaState(guna)
}

// ============ Config Exports ============

export {
  SOLFEGGIO_CONFIGS,
  CHAKRA_CONFIGS,
  ACTIVITY_CONFIGS,
  BRAINWAVE_CONFIGS,
  ISOCHRONIC_CONFIGS
}

export default audioManager
