/**
 * MindVibe Design System - Typography Tokens
 *
 * Typography system for consistent text styling across the platform.
 * Uses Inter and SF Pro Display for a clean, modern look.
 */

export const typography = {
  fonts: {
    sans: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif',
    display: '"SF Pro Display", var(--font-inter), sans-serif',
  },

  pageHeadings: {
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },

  sectionHeadings: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.3,
  },

  cardTitles: {
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.4,
  },

  body: {
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.6,
  },

  small: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.5,
  },

  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
  },
} as const

export type TypographyFonts = typeof typography.fonts
export type TypographyStyle = typeof typography.pageHeadings

export default typography
