/**
 * MindVibe Design System - Breakpoint Tokens
 *
 * Responsive breakpoints for mobile-first design approach.
 */

export const breakpoints = {
  mobile: '0px', // 0-767px
  tablet: '768px', // 768-1023px
  desktop: '1024px', // 1024-1439px
  wide: '1440px', // 1440px+
} as const

/**
 * Media query helpers for use in CSS-in-JS or styled components
 */
export const mediaQueries = {
  tablet: `@media (min-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
} as const

export type Breakpoint = keyof typeof breakpoints
export type MediaQuery = keyof typeof mediaQueries

export default breakpoints
