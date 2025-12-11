/**
 * Reduced Motion Hook
 * Checks user's preference for reduced motion and provides safe defaults
 */

import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Check user's preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

// Helper to get safe animation values based on reduced motion preference
export function getSafeAnimation(
  reducedMotion: boolean,
  fullAnimation: any,
  reducedAnimation: any = {}
) {
  return reducedMotion ? reducedAnimation : fullAnimation;
}
