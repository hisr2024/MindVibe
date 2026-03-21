/**
 * Kiaanverse Animation Timing Presets
 *
 * For use with react-native-reanimated withTiming / withSpring.
 */

export const motion = {
  /** Micro-interactions (button press, toggle) */
  fast: { duration: 150 },
  /** Standard transitions (card expand, tab switch) */
  normal: { duration: 250 },
  /** Deliberate transitions (sheet open, screen change) */
  slow: { duration: 350 },
  /** Spring config for gesture-driven animations */
  spring: { damping: 20, stiffness: 200, mass: 1 },
  /** Gentle spring for sheet transitions */
  sheetSpring: { damping: 25, stiffness: 150, mass: 1 },
  /** Bouncy spring for celebrations */
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;

/** Touch target constraints (accessibility) */
export const accessibility = {
  /** Minimum touch target (WCAG 2.1 AA) */
  minTouchTarget: 44,
  /** Minimum contrast ratio for normal text */
  minContrastNormal: 4.5,
  /** Minimum contrast ratio for large text */
  minContrastLarge: 3.0,
} as const;
