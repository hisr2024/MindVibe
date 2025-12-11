/**
 * Mood Particles Component
 * Particle burst effect for mood selection
 */

'use client';

import { useState } from 'react';
import { ParticleSystem } from '../animations/ParticleSystem';

interface MoodParticlesProps {
  color: string;
  trigger: boolean;
  origin?: { x: number; y: number };
}

export function MoodParticles({ color, trigger, origin }: MoodParticlesProps) {
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Reset trigger to allow multiple bursts
  if (trigger && particleTrigger !== Date.now()) {
    setParticleTrigger(Date.now());
  }

  return (
    <ParticleSystem
      trigger={trigger}
      color={color}
      particleCount={20}
      origin={origin}
    />
  );
}
