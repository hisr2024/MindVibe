/**
 * State Glow Effect Component
 * Pulsing glow effect for emotional states
 */

'use client';

import { motion } from 'framer-motion';

interface StateGlowEffectProps {
  state: {
    color: string;
    glowColor: string;
  };
  isActive: boolean;
  className?: string;
}

export function StateGlowEffect({ state, isActive, className = '' }: StateGlowEffectProps) {
  if (!isActive) return null;

  return (
    <motion.div
      className={`absolute inset-0 rounded-full pointer-events-none ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.6, 0.3, 0.6],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        backgroundColor: state.color,
        filter: 'blur(20px)',
        boxShadow: `0 0 40px ${state.glowColor}`,
      }}
    />
  );
}
