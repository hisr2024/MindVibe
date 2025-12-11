/**
 * Spring Animation Configurations
 * Predefined spring physics settings for consistent animations
 */

export const springConfigs = {
  // Gentle spring for subtle animations
  gentle: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 20,
    mass: 0.8,
  },

  // Bouncy spring for playful interactions
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
    mass: 1,
  },

  // Smooth spring for elegant transitions
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  },

  // Snappy spring for quick responses
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.3,
  },

  // Slow spring for dramatic effects
  slow: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
    mass: 1.2,
  },
} as const;

// Animation variants for common patterns
export const animationVariants = {
  // Fade in/out
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide up
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Slide down
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  // Scale
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  // Bounce
  bounce: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: springConfigs.bouncy,
    },
    exit: { opacity: 0, scale: 0.5 },
  },

  // Rotate
  rotate: {
    hidden: { opacity: 0, rotate: -180 },
    visible: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 },
  },
} as const;

// Stagger children animation
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Common transition durations
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;
