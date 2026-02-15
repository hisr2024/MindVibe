/**
 * Mood Particles Component
 * Particle burst effect for mood selection
 */

'use client';

import { useState, useEffect } from 'react';
import { ParticleSystem } from '../animations/ParticleSystem';

interface MoodParticlesProps {
  color: string;
  trigger: boolean;
  origin?: { x: number; y: number };
}

export function MoodParticles({ color, trigger, origin }: MoodParticlesProps) {
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Reset trigger to allow multiple bursts
  useEffect(() => {
    if (trigger) {
      setParticleTrigger(Date.now());
    }
  }, [trigger]);

  return (
    <ParticleSystem
      trigger={trigger}
      color={color}
      particleCount={20}
      origin={origin}
    />
  );
}
