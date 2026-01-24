"use client";

/**
 * Sacred Breathing Modal - Full-screen immersive breathing exercise
 *
 * Opens when user selects a breathing pattern from the Sacred Dashboard Widget.
 * Provides:
 * - Full-screen immersive experience
 * - Visual breath circle animation
 * - Phase guidance (inhale, hold, exhale, pause)
 * - Divine messages and affirmations
 * - Close/dismiss functionality
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SacredBreathing } from './SacredBreathing';
import { useDivineConsciousness, BreathingPattern } from '@/contexts/DivineConsciousnessContext';

interface SacredBreathingModalProps {
  pattern?: BreathingPattern;
  isOpen: boolean;
  onClose: () => void;
  cycles?: number;
}

export function SacredBreathingModal({
  pattern = 'peace_breath',
  isOpen,
  onClose,
  cycles = 3,
}: SacredBreathingModalProps) {
  const { actions } = useDivineConsciousness();

  const handleComplete = () => {
    // Wait a bit before closing to show the completion message
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    actions.stopBreathing();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-purple-950/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Ambient glow effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Close button */}
          <motion.button
            onClick={handleClose}
            className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>

          {/* Main content */}
          <motion.div
            className="relative z-10 w-full max-w-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <SacredBreathing
              pattern={pattern}
              autoStart={true}
              showInstructions={true}
              showDivineMessage={true}
              onComplete={handleComplete}
              cycles={cycles}
              className="p-4"
            />
          </motion.div>

          {/* Bottom guidance */}
          <motion.p
            className="absolute bottom-8 left-0 right-0 text-center text-white/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Press Escape or tap outside to end the session
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SacredBreathingModal;
