/**
 * Sacred Design Tokens
 *
 * Constants from Vedic geometry and sacred proportions used
 * throughout divine animations and spiritual UI elements.
 */

/** The golden ratio — foundational to all sacred geometry */
export const GOLDEN_RATIO = 1.618033988749895;

/** Mandala geometry constants */
export const mandala = {
  /** Number of outer petal segments in the mandala loader */
  outerPetals: 12,
  /** Number of inner petal segments */
  innerPetals: 8,
  /** Rotation increment per frame (degrees) */
  rotationStep: 0.5,
  /** Base radius for mandala drawing */
  baseRadius: 60,
} as const;

/** Lotus bloom progression constants */
export const lotus = {
  /** Number of petals in a full lotus */
  petalCount: 8,
  /** Angular spread for each petal (degrees) */
  petalSpread: 45,
  /** Scale factor for bloom animation */
  bloomScale: 1.4,
  /** Duration for a single petal bloom (ms) */
  petalBloomDuration: 400,
} as const;

/** Breathing pattern presets (in seconds) */
export const breathingPatterns = {
  /** Classic 4-7-8 calming breath */
  calm: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  /** Box breathing for focus */
  box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  /** Energizing breath */
  energize: { inhale: 6, holdIn: 0, exhale: 2, holdOut: 0 },
  /** Deep relaxation */
  deep: { inhale: 5, holdIn: 5, exhale: 10, holdOut: 2 },
} as const;

export type BreathingPattern = keyof typeof breathingPatterns;

/** Sacred color transitions for emotional states */
export const sacredGradients = {
  peace: ['#0F5E8C', '#17b1a7', '#FFD700'],
  healing: ['#080B1A', '#3D8B5E', '#FFD700'],
  release: ['#2C1654', '#C0392B', '#FFD700'],
  renewal: ['#080B1A', '#0F5E8C', '#F0C040'],
  divine: ['#050507', '#3D2B00', '#FFD700'],
} as const;

/** Particle system constants */
export const particles = {
  /** Number of particles in confetti cannon */
  confettiCount: 60,
  /** Number of particles in ambient dust effect */
  ambientDustCount: 30,
  /** Number of particles in release visualization */
  releaseCount: 40,
  /** Gravity acceleration for falling particles */
  gravity: 0.15,
  /** Base particle size */
  baseSize: 4,
} as const;

/** Chakra color mapping for emotional states */
export const chakraColors = {
  root: '#C0392B',
  sacral: '#E67E22',
  solarPlexus: '#F0C040',
  heart: '#3D8B5E',
  throat: '#2980B9',
  thirdEye: '#6C3483',
  crown: '#FFD700',
} as const;

export type ChakraColor = keyof typeof chakraColors;
