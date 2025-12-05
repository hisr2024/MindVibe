/**
 * MindVibe Design System - Spacing & Border Radius Tokens
 *
 * Consistent spacing scale and border radius values for the platform.
 */

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const

export type SpacingScale = typeof spacing
export type BorderRadiusScale = typeof borderRadius

export default { spacing, borderRadius }
