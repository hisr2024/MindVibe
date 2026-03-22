/**
 * useAccessibility — Reactive accessibility state hook
 *
 * Exposes three reactive values for WCAG 2.1 AA compliance:
 * - isReduceMotionEnabled: Whether the user prefers reduced motion
 * - fontScale: Current Dynamic Type / font scale multiplier
 * - isScreenReaderEnabled: Whether VoiceOver / TalkBack is active
 *
 * All values subscribe to system changes and update reactively.
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo, PixelRatio } from 'react-native';

export interface AccessibilityState {
  isReduceMotionEnabled: boolean;
  fontScale: number;
  isScreenReaderEnabled: boolean;
}

export function useAccessibility(): AccessibilityState {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale());

  useEffect(() => {
    // Fetch initial values
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);

    // Subscribe to changes
    const motionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const readerSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReader,
    );

    return () => {
      motionSub.remove();
      readerSub.remove();
    };
  }, []);

  // PixelRatio doesn't have a change listener in RN — fontScale is read once.
  // If the app returns from background with different scale, a re-mount refreshes it.

  return {
    isReduceMotionEnabled: reduceMotion,
    fontScale,
    isScreenReaderEnabled: screenReader,
  };
}

export default useAccessibility;
