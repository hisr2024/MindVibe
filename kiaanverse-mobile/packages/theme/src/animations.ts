/**
 * Divine Theme — Motion Tokens
 *
 * All durations and easing curves for the Reanimated 3 runtime.
 *
 * Curves are returned by functions rather than stored as values because
 * `Easing.bezier` constructs a worklet-bound function — calling it at
 * module scope is fine under Reanimated 3, but consumers that destructure
 * these into their own worklets benefit from the explicit factory.
 *
 * Duration philosophy:
 *   instant  (100ms) — button press, toggle flip
 *   fast     (200ms) — icon swap, badge pop
 *   normal   (350ms) — card expand, tab switch
 *   slow     (600ms) — sheet open, page fade
 *   sacred  (1200ms) — aura glow, lotus bloom
 *   breath  (4000ms) — breathing orb cycle
 *   drift   (8000ms) — celestial particle slow drift
 *
 * NOTE on importing Easing: Reanimated's Easing is a plain JS export
 * (not a worklet factory) — safe to import at module top level without
 * triggering Hermes worklet warnings.
 */

import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 100,
  fast: 200,
  normal: 350,
  slow: 600,
  sacred: 1200,
  breath: 4000,
  drift: 8000,
} as const;

/** Spring presets for physics-based gesture responses. */
export const spring = {
  /** Standard responsive — default for button press, card lift */
  default: { damping: 20, stiffness: 200, mass: 1 },
  /** Gentle — bottom sheets, keyboard avoidance */
  sheet: { damping: 25, stiffness: 150, mass: 1 },
  /** Bouncy — celebrations, completion cheers */
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
  /** Whisper — sacred transitions, meditative UI */
  whisper: { damping: 30, stiffness: 100, mass: 1.2 },
} as const;

/**
 * Sacred easing curves — hand-tuned Bézier for the Kiaanverse feel.
 *
 *   sacredEase     — primary curve, balanced ease-in-out
 *   lotusBloom     — blooms from rest, settles softly (material "standard")
 *   peacockShimmer — slight overshoot, used for reveals and shimmers
 *   divineBreath   — symmetric ease-in-out, used for breathing loops
 */
export const easing = {
  sacredEase: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  lotusBloom: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  peacockShimmer: Easing.bezier(0.34, 1.56, 0.64, 1.0),
  divineBreath: Easing.bezier(0.45, 0.05, 0.55, 0.95),
} as const;

/** Accessibility targets — WCAG 2.1 AA */
export const accessibility = {
  minTouchTarget: 44,
  minContrastNormal: 4.5,
  minContrastLarge: 3.0,
} as const;

/**
 * Celestial particle animation tuning. The Skia canvas in
 * DivineCelestialBackground reads these to size the particle field.
 * Exposed here so a designer can tune feel without editing the canvas.
 */
export const particleField = {
  /** Total particles on screen (35 gold + 15 peacock = 50) */
  totalCount: 50,
  goldCount: 35,
  peacockCount: 15,
  /** Particle radius range (px) */
  minRadius: 1,
  maxRadius: 2.5,
  /** Individual particle opacity range */
  minOpacity: 0.15,
  maxOpacity: 0.35,
  /** Drift range in px — each particle picks a random target in this box */
  driftX: 40,
  driftY: 60,
  /** Drift duration range (ms) — each particle picks a random duration */
  minDriftDuration: 8000,
  maxDriftDuration: 18000,
  /** Larger breathing glow orbs behind the motes */
  glowOrbCount: 4,
  glowOrbMinRadius: 40,
  glowOrbMaxRadius: 80,
  glowOrbMinOpacity: 0.03,
  glowOrbMaxOpacity: 0.06,
  /** Breath cycle in ms (scale 0.8 → 1.2 → 0.8) */
  glowOrbBreathMs: 8000,
  glowOrbScaleMin: 0.8,
  glowOrbScaleMax: 1.2,
} as const;

export type Duration = typeof duration;
export type DurationKey = keyof typeof duration;
export type Spring = typeof spring;
export type SpringKey = keyof typeof spring;
export type Easing = typeof easing;
export type EasingKey = keyof typeof easing;
export type ParticleField = typeof particleField;
