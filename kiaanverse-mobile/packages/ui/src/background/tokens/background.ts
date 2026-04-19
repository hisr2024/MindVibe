/**
 * Background system tokens — Section A colors, particle counts, timings.
 *
 * Single source of truth for the Living Background System.
 * Web parity: values mirror components/divine/DivineCelestialBackground.tsx
 * on the Kiaanverse web.
 */

// ---------------------------------------------------------------------------
// Sacred particle counts
// ---------------------------------------------------------------------------

/** Sacred mala number — 108 particles. NEVER change. */
export const PARTICLE_COUNT_FULL = 108;

/** Reduced-motion / late-night count — half mala. */
export const PARTICLE_COUNT_REDUCED = 54;

// ---------------------------------------------------------------------------
// Particle palette (hex strings for Skia)
// ---------------------------------------------------------------------------

export const PARTICLE_COLORS = {
  gold: '#D4A017',
  peacockTeal: '#06B6D4',
  krishnaBlue: '#1B4FBB',
} as const;

/** Distribution of colors across the 108 particles — sums to 1.0 */
export const PARTICLE_COLOR_WEIGHTS = {
  gold: 0.6,
  peacockTeal: 0.25,
  krishnaBlue: 0.15,
} as const;

// ---------------------------------------------------------------------------
// Particle size / opacity ranges
// ---------------------------------------------------------------------------

export const PARTICLE_SIZE_MIN = 0.5;
export const PARTICLE_SIZE_MAX = 2.0;

export const PARTICLE_OPACITY_MIN = 0.04;
export const PARTICLE_OPACITY_MAX = 0.18;

/** Random per-particle drift cycle duration (ms). */
export const PARTICLE_DURATION_MIN = 8000;
export const PARTICLE_DURATION_MAX = 18000;

/** Occasional bloom: how many particles glow together. */
export const PARTICLE_BLOOM_SIZE_MIN = 3;
export const PARTICLE_BLOOM_SIZE_MAX = 5;

// ---------------------------------------------------------------------------
// Aurora layers (CSS equivalents translated to RN)
// ---------------------------------------------------------------------------

export const AURORA_LAYERS = {
  krishnaBlue: {
    color: '#1B4FBB',
    width: 800,
    height: 400,
    duration: 45_000,
    opacity: 0.06,
  },
  peacock: {
    color: '#0E7490',
    width: 600,
    height: 300,
    duration: 60_000,
    opacity: 0.04,
  },
  gold: {
    color: '#D4A017',
    width: 400,
    height: 200,
    duration: 4_000,
    opacity: 0.03,
  },
} as const;

// ---------------------------------------------------------------------------
// Time of day — Vedic muhurtas
// ---------------------------------------------------------------------------

export type TimeOfDay =
  | 'brahma' // 3:30–5:30am — pre-dawn, most sacred
  | 'pratah' // 5:30–8am — morning
  | 'madhyanha' // mid-day
  | 'sandhya' // 6–8pm — dusk
  | 'ratri' // 9pm–3am — night
  | 'standard'; // everything else

/**
 * Per-muhurta atmospheric modifiers applied at runtime.
 * - opacityMultiplier: scales particle opacity (1.0 = default)
 * - background: solid bg color behind the canvas
 * - dominantAuroraKey: which aurora layer glows strongest
 * - particleCount: override count (undefined = use default)
 */
export const TIME_OF_DAY_ATMOSPHERE: Record<
  TimeOfDay,
  {
    opacityMultiplier: number;
    background: string;
    dominantAuroraKey: keyof typeof AURORA_LAYERS | null;
    particleCount?: number;
  }
> = {
  brahma: {
    opacityMultiplier: 1.4,
    background: '#03050F',
    dominantAuroraKey: 'gold',
  },
  pratah: {
    opacityMultiplier: 1.1,
    background: '#0A0814',
    dominantAuroraKey: 'gold',
  },
  madhyanha: {
    opacityMultiplier: 0.9,
    background: '#05070F',
    dominantAuroraKey: 'krishnaBlue',
  },
  sandhya: {
    opacityMultiplier: 1.15,
    background: '#0C0812',
    dominantAuroraKey: 'gold',
  },
  ratri: {
    opacityMultiplier: 1.0,
    background: '#020310',
    dominantAuroraKey: 'krishnaBlue',
    particleCount: PARTICLE_COUNT_REDUCED,
  },
  standard: {
    opacityMultiplier: 1.0,
    background: '#050510',
    dominantAuroraKey: 'peacock',
  },
};

/** Update interval for useTimeOfDay hook (ms). */
export const TIME_OF_DAY_POLL_INTERVAL = 60_000;
