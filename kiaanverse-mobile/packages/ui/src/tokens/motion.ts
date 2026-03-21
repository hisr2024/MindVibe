/**
 * Kiaanverse Animation Tokens
 *
 * Timing durations for react-native-reanimated withTiming / withSpring.
 * "Sacred" is the slowest — used for meditative transitions and aura glows.
 */

export const duration = {
  /** 100ms — instant feedback (button press, toggle) */
  instant: 100,
  /** 200ms — micro-interactions (icon swap, badge pop) */
  fast: 200,
  /** 350ms — standard transitions (card expand, tab switch) */
  normal: 350,
  /** 600ms — deliberate transitions (sheet open, page fade) */
  slow: 600,
  /** 1200ms — meditative animations (aura glow, lotus bloom) */
  sacred: 1200,
} as const;

/** Spring presets for gesture-driven and physics-based animations */
export const spring = {
  /** Standard responsive spring */
  default: { damping: 20, stiffness: 200, mass: 1 },
  /** Gentle spring for sheet transitions */
  sheet: { damping: 25, stiffness: 150, mass: 1 },
  /** Bouncy spring for celebrations and achievements */
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;

/** Touch target constraints (WCAG 2.1 AA) */
export const accessibility = {
  minTouchTarget: 44,
  minContrastNormal: 4.5,
  minContrastLarge: 3.0,
} as const;

export type Duration = typeof duration;
export type Spring = typeof spring;
