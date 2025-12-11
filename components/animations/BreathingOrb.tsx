/**
 * Breathing Orb Component - Guided Breathing Exercise Modal
 * 
 * Full-screen modal with 4-7-8 breathing pattern
 * Features: live count, phase instructions, ripple effects
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathingOrbProps {
  isOpen: boolean;
  onClose: () => void;
  color?: string;
  // Legacy props for compatibility
  className?: string;
  size?: number;
  autoStart?: boolean;
  pattern?: '4-7-8' | '4-4-4' | 'custom';
  onCycleComplete?: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

interface PhaseConfig {
  duration: number;
  label: string;
  emoji: string;
  scale: number;
  easing: string;
}

const phaseConfigs: Record<BreathPhase, PhaseConfig> = {
  inhale: {
    duration: 4,
    label: 'Breathe In',
    emoji: '🌬️',
    scale: 2,
    easing: 'easeIn',
  },
  hold: {
    duration: 7,
    label: 'Hold',
    emoji: '🙏',
    scale: 2,
    easing: 'linear',
  },
  exhale: {
    duration: 8,
    label: 'Breathe Out',
    emoji: '🍃',
    scale: 1,
    easing: 'easeOut',
  },
};

export function BreathingOrb({ 
  isOpen = false,
  onClose = () => {},
  color = '#FF7327',
  // Legacy props - render inline version if these are provided
  className,
  size = 200,
  autoStart = true,
  pattern = '4-7-8',
  onCycleComplete,
}: BreathingOrbProps) {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [count, setCount] = useState(1);
  const [cycleCount, setCycleCount] = useState(0);

  // If legacy props are used, render the old inline version
  const isLegacyMode = className !== undefined || !isOpen;

  useEffect(() => {
    if (!isOpen && !isLegacyMode) {
      setPhase('inhale');
      setCount(1);
      setCycleCount(0);
      return;
    }

    const config = phaseConfigs[phase];
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= config.duration) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
          } else if (phase === 'hold') {
            setPhase('exhale');
          } else {
            setPhase('inhale');
            setCycleCount(c => c + 1);
            if (onCycleComplete) onCycleComplete();
          }
          return 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, phase, isLegacyMode, onCycleComplete]);

  const handleClose = () => {
    onClose();
  };

  const config = phaseConfigs[phase];

  // Legacy inline mode (no modal)
  if (isLegacyMode) {
    return (
      <div className={`flex flex-col items-center justify-center gap-6 ${className || ''}`}>
        <div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
            animate={{
              scale: config.scale,
              opacity: phase === 'hold' ? 0.6 : 0.3,
            }}
            transition={{
              duration: config.duration,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: size * 0.6,
              height: size * 0.6,
              background: `radial-gradient(circle at 30% 30%, ${color}ff, ${color}99)`,
              boxShadow: `0 0 40px ${color}80, 0 0 80px ${color}40`,
            }}
            animate={{
              scale: config.scale,
            }}
            transition={{
              duration: config.duration,
              ease: 'easeInOut',
            }}
          />
        </div>
        <motion.div
          className="text-center"
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-semibold text-white mb-2">{config.label}</p>
          <p className="text-sm text-white/60">{count} / {config.duration}</p>
        </motion.div>
      </div>
    );
  }

  // New modal mode
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Breathing exercise"
        >
          <div className="relative flex flex-col items-center gap-8">
            {/* Cycle counter */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-white/60"
            >
              Cycle {cycleCount + 1}
            </motion.div>

            {/* Phase instruction */}
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-3 text-2xl font-light text-white"
            >
              <span className="text-3xl">{config.emoji}</span>
              <span>{config.label}</span>
            </motion.div>

            {/* Breathing orb with ripples */}
            <div className="relative flex items-center justify-center">
              {/* Ripple rings */}
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute rounded-full border-2"
                  style={{
                    borderColor: `${color}60`,
                    width: 264,
                    height: 264,
                  }}
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 1,
                    ease: 'easeOut',
                  }}
                  initial={{ scale: 1, opacity: 0.6 }}
                />
              ))}

              {/* Main breathing orb */}
              <motion.div
                className="relative flex items-center justify-center rounded-full"
                style={{
                  width: 264,
                  height: 264,
                  background: `radial-gradient(circle, ${color}40, ${color}20)`,
                  boxShadow: `0 0 60px ${color}60, inset 0 0 40px ${color}30`,
                }}
                animate={{
                  scale: config.scale,
                }}
                transition={{
                  duration: config.duration,
                  ease: config.easing as any,
                }}
                key={`${phase}-${count}`}
              >
                {/* Count display */}
                <motion.div
                  key={`count-${count}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="text-6xl font-light text-white"
                >
                  {count}
                </motion.div>
              </motion.div>
            </div>

            {/* Close instruction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-sm text-white/40"
            >
              Click anywhere to close
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
