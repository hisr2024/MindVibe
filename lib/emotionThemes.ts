/**
 * Emotion-Driven Theme System
 *
 * Defines visual themes for 5 emotional states with colors, animations, and visual properties.
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

import { Emotion } from './emotionClassifier'

export interface EmotionTheme {
  // Core colors
  primary: string
  secondary: string
  background: string
  text: string
  accent: string

  // Gradients
  gradient: string
  cardGradient: string

  // Particle system
  particleColor: string
  particleCount: number

  // Animation
  animationType: 'gentle-flow' | 'dynamic-pulse' | 'slow-drift' | 'steady-breathe' | 'subtle-wave'
  animationSpeed: number  // Multiplier (0.5 = slow, 1.0 = normal, 1.5 = fast)

  // Visual effects
  blurIntensity: number   // Background blur in pixels
  shadowColor: string
  borderColor: string
}

/**
 * Complete theme definitions for all 5 emotions
 */
export const emotionThemes: Record<Emotion, EmotionTheme> = {
  /**
   * CALM - Serene blues and teals
   * For peaceful, meditative states
   */
  calm: {
    primary: '#4F86C6',       // Serene blue
    secondary: '#7EC8B7',     // Soft teal
    background: '#F0F9FF',    // Light sky blue
    text: '#1E3A5F',          // Deep navy
    accent: '#A7D7C5',        // Mint green

    gradient: 'linear-gradient(135deg, #4F86C6 0%, #7EC8B7 100%)',
    cardGradient: 'linear-gradient(180deg, rgba(79, 134, 198, 0.08) 0%, rgba(126, 200, 183, 0.12) 100%)',

    particleColor: 'rgba(79, 134, 198, 0.3)',
    particleCount: 25,

    animationType: 'gentle-flow',
    animationSpeed: 0.7,

    blurIntensity: 20,
    shadowColor: 'rgba(79, 134, 198, 0.2)',
    borderColor: 'rgba(79, 134, 198, 0.2)'
  },

  /**
   * ENERGIZED - Warm oranges and yellows
   * For motivated, active states
   */
  energized: {
    primary: '#FF9A56',       // Warm orange
    secondary: '#FFD93D',     // Bright yellow
    background: '#FFF8E7',    // Cream
    text: '#5C4033',          // Rich brown
    accent: '#FFC857',        // Golden yellow

    gradient: 'linear-gradient(135deg, #FF9A56 0%, #FFD93D 100%)',
    cardGradient: 'linear-gradient(180deg, rgba(255, 154, 86, 0.1) 0%, rgba(255, 217, 61, 0.15) 100%)',

    particleColor: 'rgba(255, 154, 86, 0.4)',
    particleCount: 35,

    animationType: 'dynamic-pulse',
    animationSpeed: 1.3,

    blurIntensity: 15,
    shadowColor: 'rgba(255, 154, 86, 0.25)',
    borderColor: 'rgba(255, 154, 86, 0.25)'
  },

  /**
   * MELANCHOLIC - Soft purples and grays
   * For reflective, low-mood states
   */
  melancholic: {
    primary: '#8E7DBE',       // Soft purple
    secondary: '#B4A5D1',     // Lavender
    background: '#F5F5F5',    // Light gray
    text: '#4A4A4A',          // Charcoal
    accent: '#D4C5E8',        // Pale lavender

    gradient: 'linear-gradient(135deg, #8E7DBE 0%, #B4A5D1 100%)',
    cardGradient: 'linear-gradient(180deg, rgba(142, 125, 190, 0.06) 0%, rgba(180, 165, 209, 0.1) 100%)',

    particleColor: 'rgba(142, 125, 190, 0.2)',
    particleCount: 18,

    animationType: 'slow-drift',
    animationSpeed: 0.5,

    blurIntensity: 25,
    shadowColor: 'rgba(142, 125, 190, 0.15)',
    borderColor: 'rgba(142, 125, 190, 0.15)'
  },

  /**
   * ANXIOUS - Muted teals and dusty rose
   * For stressed, anxious states (grounding colors)
   */
  anxious: {
    primary: '#9DC3C2',       // Muted teal
    secondary: '#D4A5A5',     // Dusty rose
    background: '#F9F7F7',    // Off-white
    text: '#5A5A5A',          // Soft gray
    accent: '#C7CEEA',        // Soft periwinkle

    gradient: 'linear-gradient(135deg, #9DC3C2 0%, #D4A5A5 100%)',
    cardGradient: 'linear-gradient(180deg, rgba(157, 195, 194, 0.07) 0%, rgba(212, 165, 165, 0.11) 100%)',

    particleColor: 'rgba(157, 195, 194, 0.25)',
    particleCount: 20,

    animationType: 'steady-breathe',
    animationSpeed: 0.6,

    blurIntensity: 18,
    shadowColor: 'rgba(157, 195, 194, 0.18)',
    borderColor: 'rgba(157, 195, 194, 0.18)'
  },

  /**
   * BALANCED - Earth tones
   * For neutral, stable states
   */
  balanced: {
    primary: '#8B7355',       // Earth brown
    secondary: '#A0937D',     // Taupe
    background: '#FAF8F3',    // Warm white
    text: '#3E3E3E',          // Charcoal
    accent: '#C9B8A0',        // Beige

    gradient: 'linear-gradient(135deg, #8B7355 0%, #A0937D 100%)',
    cardGradient: 'linear-gradient(180deg, rgba(139, 115, 85, 0.05) 0%, rgba(160, 147, 125, 0.09) 100%)',

    particleColor: 'rgba(139, 115, 85, 0.2)',
    particleCount: 22,

    animationType: 'subtle-wave',
    animationSpeed: 0.8,

    blurIntensity: 16,
    shadowColor: 'rgba(139, 115, 85, 0.15)',
    borderColor: 'rgba(139, 115, 85, 0.15)'
  }
}

/**
 * Gets theme for a given emotion
 */
export function getEmotionTheme(emotion: Emotion): EmotionTheme {
  return emotionThemes[emotion]
}

/**
 * Converts theme to CSS custom properties
 */
export function themeToCSSProperties(theme: EmotionTheme): Record<string, string> {
  return {
    '--emotion-primary': theme.primary,
    '--emotion-secondary': theme.secondary,
    '--emotion-background': theme.background,
    '--emotion-text': theme.text,
    '--emotion-accent': theme.accent,
    '--emotion-gradient': theme.gradient,
    '--emotion-card-gradient': theme.cardGradient,
    '--emotion-particle-color': theme.particleColor,
    '--emotion-shadow': theme.shadowColor,
    '--emotion-border': theme.borderColor,
    '--emotion-blur': `${theme.blurIntensity}px`,
    '--emotion-animation-speed': theme.animationSpeed.toString()
  }
}

/**
 * Applies theme transition with smooth animation
 */
export function applyThemeTransition(
  theme: EmotionTheme,
  duration: number = 1500
): void {
  const root = document.documentElement

  // Apply transition
  root.style.transition = `
    background-color ${duration}ms ease,
    color ${duration}ms ease,
    border-color ${duration}ms ease
  `

  // Apply theme properties
  const cssProps = themeToCSSProperties(theme)
  Object.entries(cssProps).forEach(([prop, value]) => {
    root.style.setProperty(prop, value)
  })

  // Remove transition after complete
  setTimeout(() => {
    root.style.transition = ''
  }, duration + 100)
}

/**
 * Accessibility: High-contrast theme overrides
 */
export function getHighContrastTheme(baseTheme: EmotionTheme): EmotionTheme {
  return {
    ...baseTheme,
    background: '#FFFFFF',
    text: '#000000',
    borderColor: 'rgba(0, 0, 0, 0.5)',
    // Keep other properties
    primary: baseTheme.primary,
    secondary: baseTheme.secondary,
    accent: baseTheme.accent,
    gradient: baseTheme.gradient,
    cardGradient: 'linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%)',
    particleColor: 'rgba(0, 0, 0, 0.3)',
    particleCount: baseTheme.particleCount,
    animationType: baseTheme.animationType,
    animationSpeed: baseTheme.animationSpeed,
    blurIntensity: 0,  // Disable blur for clarity
    shadowColor: 'rgba(0, 0, 0, 0.3)'
  }
}
