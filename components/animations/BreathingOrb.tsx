/**
 * Breathing Orb Component
 * Animated breathing visualization with 4-7-8 pattern
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BreathingOrbProps {
  className?: string;
  size?: number;
  color?: string;
  autoStart?: boolean;
  pattern?: '4-7-8' | '4-4-4' | 'custom';
  onCycleComplete?: () => void;
}

export function BreathingOrb({
  className = '',
  size = 200,
  color = '#8b5cf6',
  autoStart = true,
  pattern = '4-7-8',
  onCycleComplete,
}: BreathingOrbProps) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [isActive, setIsActive] = useState(autoStart);

  // Pattern timings in milliseconds
  const patterns = {
    '4-7-8': { inhale: 4000, hold: 7000, exhale: 8000, rest: 1000 },
    '4-4-4': { inhale: 4000, hold: 4000, exhale: 4000, rest: 1000 },
    custom: { inhale: 4000, hold: 4000, exhale: 6000, rest: 1000 },
  };

  const timing = patterns[pattern];

  useEffect(() => {
    if (!isActive) return;

    const phases: Array<'inhale' | 'hold' | 'exhale' | 'rest'> = ['inhale', 'hold', 'exhale', 'rest'];
    let currentPhaseIndex = 0;
    let timeout: NodeJS.Timeout;

    const nextPhase = () => {
      currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
      const newPhase = phases[currentPhaseIndex];
      setPhase(newPhase);

      if (newPhase === 'inhale' && onCycleComplete) {
        onCycleComplete();
      }

      timeout = setTimeout(nextPhase, timing[newPhase]);
    };

    timeout = setTimeout(nextPhase, timing[phase]);

    return () => clearTimeout(timeout);
  }, [isActive, phase, timing, onCycleComplete]);

  // Calculate scale based on phase
  const getScale = () => {
    switch (phase) {
      case 'inhale':
        return 1.8;
      case 'hold':
        return 1.8;
      case 'exhale':
        return 1;
      case 'rest':
        return 1;
      default:
        return 1;
    }
  };

  // Get instruction text
  const getInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'rest':
        return 'Rest';
      default:
        return '';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      {/* Orb Container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Particle trail effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            scale: getScale(),
            opacity: phase === 'inhale' || phase === 'hold' ? 0.6 : 0.3,
          }}
          transition={{
            duration: phase === 'inhale' ? timing.inhale / 1000 : timing.exhale / 1000,
            ease: 'easeInOut',
          }}
        />

        {/* Main orb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.6,
            height: size * 0.6,
            background: `radial-gradient(circle at 30% 30%, ${color}ff, ${color}99)`,
            boxShadow: `0 0 40px ${color}80, 0 0 80px ${color}40`,
          }}
          animate={{
            scale: getScale(),
          }}
          transition={{
            duration: phase === 'inhale' ? timing.inhale / 1000 : timing.exhale / 1000,
            ease: 'easeInOut',
          }}
        />

        {/* Inner glow */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.4,
            height: size * 0.4,
            background: `radial-gradient(circle, ${color}ff, transparent)`,
            filter: 'blur(10px)',
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Instruction Text */}
      <motion.div
        className="text-center"
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-2xl font-semibold text-white mb-2">{getInstruction()}</p>
        <p className="text-sm text-white/60">
          {phase === 'inhale' && `${timing.inhale / 1000} seconds`}
          {phase === 'hold' && `${timing.hold / 1000} seconds`}
          {phase === 'exhale' && `${timing.exhale / 1000} seconds`}
        </p>
      </motion.div>

      {/* Control Button */}
      <button
        onClick={() => setIsActive(!isActive)}
        className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
      >
        {isActive ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}
