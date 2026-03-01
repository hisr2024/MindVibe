/**
 * Accessibility Utilities — MindVibe Mobile
 *
 * Helpers for WCAG 2.1 AA compliance:
 * - Contrast ratio calculation
 * - Reduced motion detection
 * - Screen reader announcements
 * - Dynamic type scaling
 */

import { AccessibilityInfo, PixelRatio } from 'react-native';

/**
 * Announce a message to screen readers (VoiceOver / TalkBack).
 * Use for state changes that aren't visually obvious.
 */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Check if the user has enabled reduced motion.
 * Returns a promise — use with useEffect.
 */
export async function isReducedMotionEnabled(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

/**
 * Get the user's preferred font scale factor.
 * Used to respect Dynamic Type on iOS / font scale on Android.
 * Returns a multiplier (1.0 = default, 2.0 = 200% scale).
 */
export function getFontScale(): number {
  return PixelRatio.getFontScale();
}

/**
 * Calculate WCAG 2.0 contrast ratio between two hex colors.
 * Returns a number between 1 (identical) and 21 (max contrast).
 *
 * WCAG 2.1 AA targets:
 * - Normal text: >= 4.5
 * - Large text (>= 18pt or 14pt bold): >= 3.0
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hex1);
  const lum2 = relativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}
