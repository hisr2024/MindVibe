/**
 * Divine Theme — Color Tokens
 *
 * The sacred palette of Kiaanverse. Every hex, every rgba lives here.
 * Components MUST NEVER introduce hardcoded colors — reach for a token.
 *
 * Philosophy:
 *   Deep cosmos ground the user in stillness.
 *   Gold invokes the divine (Krishna, Surya, aarti flame).
 *   Peacock blue echoes Krishna's feather (Mayura Pankha).
 *   Lotus rose honors the awakening heart.
 *   Saffron is the color of the sadhu's renunciation.
 */

export const colors = {
  /** The three-stop cosmic gradient — the entire app floats on this */
  cosmos: {
    top: '#050714',
    mid: '#0B0E2A',
    bottom: '#050714',
  },

  /** Gold scale — aura, CTAs, highlights, sacred flame */
  gold: {
    deepest: '#3D2B00',
    deep: '#8B6914',
    primary: '#D4A017',
    bright: '#F0C040',
    lightest: '#FFF8DC',
    aura: '#FFD700',
  },

  /** Peacock scale — Krishna's feather, iridescent accents */
  peacock: {
    deep: '#0F5E8C',
    primary: '#0E7490',
    bright: '#06B6D4',
    sheen: '#17B1A7',
  },

  /** Lotus scale — awakening heart, compassion moments */
  lotus: {
    rose: '#FF6B6B',
    soft: '#FFB4B4',
  },

  /** Saffron scale — renunciation, sunrise, dharma */
  saffron: {
    primary: '#FF6600',
    warm: '#E67E22',
  },

  /** Surface layers — from deepest void to elevated card */
  surface: {
    void: '#050714',
    deep: '#080B1A',
    base: '#0B0E2A',
    elevated: '#0D1229',
    overlay: '#131A3D',
  },

  /** Text hierarchy on cosmic dark surfaces */
  text: {
    primary: '#F5F0E8',
    secondary: '#C8BFA8',
    muted: '#7A7060',
    accent: '#D4A017',
    inverse: '#050714',
  },

  /** Semantic feedback — chosen for accessible contrast on dark cosmos */
  semantic: {
    success: '#3D8B5E',
    error: '#C0392B',
    warning: '#E67E22',
    info: '#2980B9',
  },

  /** Chakra colors (root → crown) for emotional state rings */
  chakra: {
    root: '#C0392B',
    sacral: '#E67E22',
    solarPlexus: '#F0C040',
    heart: '#3D8B5E',
    throat: '#2980B9',
    thirdEye: '#6C3483',
    crown: '#FFD700',
  },

  /** Alpha utilities — glows, overlays, scrims */
  alpha: {
    goldFaint: 'rgba(212, 160, 23, 0.05)',
    goldLight: 'rgba(212, 160, 23, 0.08)',
    goldMedium: 'rgba(212, 160, 23, 0.16)',
    goldStrong: 'rgba(212, 160, 23, 0.32)',
    goldParticle: 'rgba(212, 160, 23, 0.30)',
    peacockFaint: 'rgba(14, 116, 144, 0.08)',
    peacockMedium: 'rgba(14, 116, 144, 0.16)',
    peacockParticle: 'rgba(14, 116, 144, 0.25)',
    scrimLight: 'rgba(0, 0, 0, 0.2)',
    scrimMedium: 'rgba(0, 0, 0, 0.4)',
    scrimHeavy: 'rgba(0, 0, 0, 0.7)',
    whiteLight: 'rgba(255, 255, 255, 0.05)',
    whiteMedium: 'rgba(255, 255, 255, 0.10)',
    whiteStrong: 'rgba(255, 255, 255, 0.20)',
  },

  /** Raw — escape hatch for theme definitions only */
  raw: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
} as const;

/**
 * The sacred cosmos gradient — the foundation of every screen.
 * Exported as an immutable tuple so LinearGradient receives a stable
 * reference (prevents re-renders from array identity churn).
 */
export const cosmosGradient = [
  colors.cosmos.top,
  colors.cosmos.mid,
  colors.cosmos.bottom,
] as const;

/** Gradient stop positions matching cosmosGradient. */
export const cosmosGradientLocations = [0, 0.5, 1] as const;

/**
 * Particle palette — the drifting motes of the celestial field.
 * 35 gold + 15 peacock = 50 total.
 */
export const particlePalette = {
  gold: colors.alpha.goldParticle,
  peacock: colors.alpha.peacockParticle,
} as const;

export type Colors = typeof colors;
export type CosmosGradient = typeof cosmosGradient;
