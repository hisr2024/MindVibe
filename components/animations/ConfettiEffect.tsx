/**
 * Confetti Effect Component
 * Triggers confetti celebration animation
 */

'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  colors?: string[];
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
}

export function ConfettiEffect({
  trigger,
  colors = ['#ff7327', '#ff9933', '#ffb347', '#ffa500'],
  particleCount = 100,
  spread = 70,
  origin = { x: 0.5, y: 0.5 },
}: ConfettiEffectProps) {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount,
        spread,
        origin,
        colors,
        ticks: 200,
        gravity: 1,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['circle', 'square'],
        scalar: 0.8,
      });
    }
  }, [trigger, colors, particleCount, spread, origin]);

  return null;
}

// Firework style confetti
export function fireConfetti(options?: Partial<ConfettiEffectProps>) {
  const defaults = {
    colors: ['#ff7327', '#ff9933', '#ffb347', '#ffa500'],
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
  };

  const config = { ...defaults, ...options };

  confetti({
    particleCount: config.particleCount,
    spread: config.spread,
    origin: config.origin,
    colors: config.colors,
    ticks: 200,
    gravity: 1,
    decay: 0.94,
    startVelocity: 30,
  });
}
