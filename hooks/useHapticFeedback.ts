/**
 * Haptic Feedback Hook
 * Provides haptic feedback for supported devices
 */

import { useCallback, useRef } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/** Minimum ms between vibrations to prevent jarring rapid-tap bursts */
const DEBOUNCE_MS = 50;

export function useHapticFeedback() {
  const lastTriggerRef = useRef(0);

  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Check if the Vibration API is supported
    if (typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }

    // Debounce rapid triggers
    const now = Date.now();
    if (now - lastTriggerRef.current < DEBOUNCE_MS) {
      return;
    }
    lastTriggerRef.current = now;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Map haptic types to vibration patterns
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: 5,
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [30, 100, 30, 100, 30],
    };

    const pattern = patterns[type];
    navigator.vibrate(pattern);
  }, []);

  return { triggerHaptic };
}
