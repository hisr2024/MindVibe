"use client";

/**
 * Sacred Breathing Component - Guided Divine Breathing Exercises
 *
 * Creates immersive breathing experiences with:
 * - Visual breath circle animation
 * - Phase guidance (inhale, hold, exhale, pause)
 * - Divine messages and affirmations
 * - Sacred sound integration ready
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness, BreathingPattern, SacredBreathingExercise } from '@/contexts/DivineConsciousnessContext';

interface SacredBreathingProps {
  pattern?: BreathingPattern;
  autoStart?: boolean;
  showInstructions?: boolean;
  showDivineMessage?: boolean;
  onComplete?: () => void;
  onPhaseChange?: (phase: string) => void;
  cycles?: number;
  className?: string;
}

type BreathPhase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'pause' | 'complete';

const PHASE_LABELS: Record<BreathPhase, string> = {
  ready: 'Prepare to breathe...',
  inhale: 'Breathe in...',
  hold: 'Hold gently...',
  exhale: 'Release...',
  pause: 'Rest...',
  complete: 'Peace be with you',
};

const PHASE_COLORS: Record<BreathPhase, string> = {
  ready: 'from-blue-400/30 to-purple-400/30',
  inhale: 'from-blue-400/50 to-cyan-400/50',
  hold: 'from-purple-400/50 to-pink-400/50',
  exhale: 'from-teal-400/50 to-green-400/50',
  pause: 'from-indigo-400/40 to-blue-400/40',
  complete: 'from-amber-400/40 to-yellow-400/40',
};

export function SacredBreathing({
  pattern = 'peace_breath',
  autoStart = false,
  showInstructions = true,
  showDivineMessage = true,
  onComplete,
  onPhaseChange,
  cycles = 3,
  className = '',
}: SacredBreathingProps) {
  const { actions } = useDivineConsciousness();

  const [exercise, setExercise] = useState<SacredBreathingExercise | null>(null);
  const [phase, setPhase] = useState<BreathPhase>('ready');
  const [isActive, setIsActive] = useState(autoStart);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(0);

  // Ref to hold the latest transitionPhase callback to avoid effect re-runs
  const transitionPhaseRef = useRef<() => void>(() => {});

  // Track if autoStart has been triggered to prevent re-runs
  const autoStartTriggeredRef = useRef(false);

  // Load exercise on mount or pattern change
  useEffect(() => {
    const ex = actions.getBreathingExercise(pattern);
    setExercise(ex);
    setPhase('ready');
    setCurrentCycle(0);
    setCurrentInstruction(0);
    // Reset autoStart trigger when pattern changes
    autoStartTriggeredRef.current = false;
  }, [pattern, actions]);

  // Auto-start the breathing exercise when autoStart is true and exercise is loaded
  useEffect(() => {
    if (autoStart && exercise && phase === 'ready' && !autoStartTriggeredRef.current) {
      autoStartTriggeredRef.current = true;
      // Small delay to allow the UI to render and show the "Prepare to breathe" state
      const timer = setTimeout(() => {
        setIsActive(true);
        setPhase('inhale');
        setCountdown(exercise.inhale);
        setCurrentCycle(0);
        actions.startBreathing(pattern);
      }, 1500); // 1.5 second delay to let user prepare
      return () => clearTimeout(timer);
    }
  }, [autoStart, exercise, phase, pattern, actions]);

  // Handle phase transitions
  const transitionPhase = useCallback(() => {
    if (!exercise) return;

    setPhase(current => {
      let next: BreathPhase;

      switch (current) {
        case 'ready':
          next = 'inhale';
          setCountdown(exercise.inhale);
          break;
        case 'inhale':
          if (exercise.hold > 0) {
            next = 'hold';
            setCountdown(exercise.hold);
          } else {
            next = 'exhale';
            setCountdown(exercise.exhale);
          }
          break;
        case 'hold':
          next = 'exhale';
          setCountdown(exercise.exhale);
          break;
        case 'exhale':
          if (exercise.pause && exercise.pause > 0) {
            next = 'pause';
            setCountdown(exercise.pause);
          } else {
            // Check if we should continue
            if (currentCycle + 1 < cycles) {
              next = 'inhale';
              setCountdown(exercise.inhale);
              setCurrentCycle(prev => prev + 1);
            } else {
              next = 'complete';
              setIsActive(false);
              onComplete?.();
            }
          }
          break;
        case 'pause':
          // Check if we should continue
          if (currentCycle + 1 < cycles) {
            next = 'inhale';
            setCountdown(exercise.inhale);
            setCurrentCycle(prev => prev + 1);
          } else {
            next = 'complete';
            setIsActive(false);
            onComplete?.();
          }
          break;
        default:
          next = current;
      }

      onPhaseChange?.(next);
      return next;
    });
  }, [exercise, currentCycle, cycles, onComplete, onPhaseChange]);

  // Keep ref in sync with the latest callback
  useEffect(() => {
    transitionPhaseRef.current = transitionPhase;
  }, [transitionPhase]);

  // Countdown timer - use ref to avoid re-triggering on transitionPhase changes
  useEffect(() => {
    if (!isActive || phase === 'ready' || phase === 'complete') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      transitionPhaseRef.current();
    }
  }, [isActive, phase, countdown]);

  // Update instruction index during exercise
  useEffect(() => {
    if (!exercise || !isActive) return;

    const instructionTimer = setInterval(() => {
      setCurrentInstruction(prev =>
        (prev + 1) % exercise.instructions.length
      );
    }, 5000);

    return () => clearInterval(instructionTimer);
  }, [exercise, isActive]);

  const handleStart = () => {
    if (!exercise) return;
    setIsActive(true);
    setPhase('inhale');
    setCountdown(exercise.inhale);
    setCurrentCycle(0);
    actions.startBreathing(pattern);
  };

  const handleStop = () => {
    setIsActive(false);
    setPhase('ready');
    setCurrentCycle(0);
    actions.stopBreathing();
  };

  // Calculate circle scale based on phase
  const getCircleScale = () => {
    switch (phase) {
      case 'inhale': return 1.5;
      case 'hold': return 1.5;
      case 'exhale': return 1;
      case 'pause': return 1;
      default: return 1;
    }
  };

  if (!exercise) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Exercise Name */}
      <motion.h3
        className="text-xl font-light text-white/90 mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {exercise.name}
      </motion.h3>

      {/* Pattern Display */}
      <motion.p
        className="text-sm text-white/60 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Pattern: {exercise.pattern}
      </motion.p>

      {/* Breathing Circle */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        {/* Outer glow ring */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${PHASE_COLORS[phase]} blur-xl`}
          animate={{
            scale: getCircleScale() * 1.1,
            opacity: isActive ? 0.6 : 0.3,
          }}
          transition={{
            duration: countdown > 0 ? countdown : 1,
            ease: "easeInOut",
          }}
        />

        {/* Main breathing circle */}
        <motion.div
          className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${PHASE_COLORS[phase]} backdrop-blur-sm border border-white/20`}
          animate={{
            scale: getCircleScale(),
          }}
          transition={{
            duration: countdown > 0 ? countdown : 1,
            ease: phase === 'inhale' ? 'easeOut' : phase === 'exhale' ? 'easeIn' : 'easeInOut',
          }}
        >
          {/* Inner content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Phase label */}
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                className="text-lg font-light text-white/90 text-center px-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {PHASE_LABELS[phase]}
              </motion.span>
            </AnimatePresence>

            {/* Countdown */}
            {isActive && phase !== 'ready' && phase !== 'complete' && (
              <motion.span
                className="text-4xl font-light text-white/80 mt-2"
                key={countdown}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {countdown}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Cycle indicator */}
        {isActive && (
          <motion.div
            className="absolute -bottom-4 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(cycles)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= currentCycle ? 'bg-white/80' : 'bg-white/20'
                }`}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      {showInstructions && (
        <AnimatePresence mode="wait">
          <motion.p
            key={currentInstruction}
            className="text-center text-white/70 max-w-sm mb-6 min-h-[3rem]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            {isActive
              ? exercise.instructions[currentInstruction]
              : 'Press start when you are ready to begin your sacred breathing journey.'}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Divine Message */}
      {showDivineMessage && phase === 'complete' && (
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-white/80 italic mb-2">
            *{exercise.divineMessage}*
          </p>
          <p className="text-white/90 font-light">
            {exercise.closing}
          </p>
        </motion.div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isActive && phase !== 'complete' && (
          <motion.button
            onClick={handleStart}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 transition-all duration-300 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Begin Sacred Breathing
          </motion.button>
        )}

        {isActive && (
          <motion.button
            onClick={handleStop}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Pause
          </motion.button>
        )}

        {phase === 'complete' && (
          <motion.button
            onClick={handleStart}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 transition-all duration-300 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Practice Again
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default SacredBreathing;
