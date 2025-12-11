import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Group } from 'three';

/**
 * Custom hook for common 3D animation patterns
 * Provides reusable animation logic for 3D components
 */

interface UseBreathingOptions {
  speed?: number;
  intensity?: number;
  baseScale?: number;
}

/**
 * Creates a breathing animation effect (pulsing scale)
 */
export function useBreathing(
  meshRef: React.RefObject<Mesh | Group>,
  { speed = 1, intensity = 0.05, baseScale = 1 }: UseBreathingOptions = {}
) {
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const breathScale = baseScale + Math.sin(clock.getElapsedTime() * speed) * intensity;
      meshRef.current.scale.setScalar(breathScale);
    }
  });
}

interface UseFloatingOptions {
  speed?: number;
  amplitude?: number;
}

/**
 * Creates a floating animation effect (vertical sine wave motion)
 */
export function useFloating(
  meshRef: React.RefObject<Mesh | Group>,
  { speed = 1, amplitude = 0.2 }: UseFloatingOptions = {}
) {
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * speed) * amplitude;
    }
  });
}

interface UseRotationOptions {
  speed?: number;
  axis?: 'x' | 'y' | 'z';
}

/**
 * Creates a continuous rotation animation
 */
export function useRotation(
  meshRef: React.RefObject<Mesh | Group>,
  { speed = 1, axis = 'y' }: UseRotationOptions = {}
) {
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation[axis] += 0.01 * speed;
    }
  });
}

/**
 * Prefers reduced motion hook for accessibility
 */
export function usePrefersReducedMotion(): boolean {
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = mediaQuery.matches;

    const handler = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotionRef.current;
}
