/**
 * Mood Particles Component
 * Particle burst effect for mood selection
 */

'use client';

import { ParticleSystem } from '../animations/ParticleSystem';

interface MoodParticlesProps {
  color: string;
  trigger: boolean;
  origin?: { x: number; y: number };
}

export function MoodParticles({ color, trigger, origin }: MoodParticlesProps) {
  return (
    <ParticleSystem
      trigger={trigger}
      color={color}
      particleCount={20}
      origin={origin}
    />
  );
}
