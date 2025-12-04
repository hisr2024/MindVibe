/**
 * MindVibe Design System - Color Tokens
 *
 * A comprehensive color palette for the MindVibe platform redesign.
 * Includes neutrals, brand colors, semantic colors, and tool-specific gradients.
 */

export const colors = {
  // Neutrals (calming, minimal)
  gray: {
    50: '#F9FAFB', // Backgrounds
    100: '#F3F4F6', // Subtle backgrounds
    200: '#E5E7EB', // Borders
    300: '#D1D5DB',
    400: '#9CA3AF', // Disabled text
    500: '#6B7280', // Secondary text
    600: '#4B5563',
    700: '#374151',
    900: '#111827', // Primary text
  },

  // Brand (preserved MindVibe identity)
  brand: {
    primary: '#6366F1', // Indigo - KIAAN accent
    secondary: '#8B5CF6', // Purple - Wisdom accent
    success: '#10B981', // Green - Positive moods
    warning: '#F59E0B', // Amber - Neutral moods
    calm: '#3B82F6', // Blue - Calming elements
  },

  // Semantic colors
  background: '#FFFFFF',
  surface: '#F9FAFB',
  error: '#EF4444',

  // Tool-specific gradients
  viyog: {
    from: '#06B6D4', // Cyan
    to: '#3B82F6', // Blue
  },
  ardha: {
    from: '#8B5CF6', // Purple
    to: '#6366F1', // Indigo
  },
  compass: {
    from: '#F43F5E', // Rose
    to: '#FB923C', // Orange
  },
  karmicTree: {
    from: '#10B981', // Green
    to: '#34D399', // Emerald
  },
} as const

export type ColorScale = typeof colors.gray
export type BrandColors = typeof colors.brand
export type GradientColors = typeof colors.viyog | typeof colors.ardha | typeof colors.compass | typeof colors.karmicTree

export default colors
