"use client";

/**
 * Sacred Breathing Modal - Full-screen immersive breathing exercise
 *
 * Opens when user selects a breathing pattern from the Sacred Dashboard Widget.
 * Provides:
 * - Full-screen immersive experience via Portal (escapes parent stacking contexts)
 * - Visual breath circle animation
 * - Phase guidance (inhale, hold, exhale, pause)
 * - Divine messages and affirmations
 * - Close via X button, Escape key, or backdrop tap
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SacredBreathing } from './SacredBreathing';
import { useDivineConsciousness, BreathingPattern } from '@/contexts/DivineConsciousnessContext';
import { Portal } from '@/components/ui/Portal';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();

  const handleClose = useCallback(() => {
    actions.stopBreathing();
    onClose();
  }, [actions, onClose]);

  const handleComplete = () => {
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={t('divine.sacred.breathing.modalAriaLabel', 'Sacred breathing exercise')}
          >
            {/* Backdrop - click to close */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-purple-950/80 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
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
              aria-label={t('divine.sacred.breathing.closeAriaLabel', 'Close breathing exercise')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Main content - stop click propagation so tapping content doesn't close */}
            <motion.div
              className="relative z-10 w-full max-w-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
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
              className="absolute bottom-8 left-0 right-0 text-center text-white/40 text-sm pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {t('divine.sacred.breathing.escapeHint', 'Press Escape or tap outside to end the session')}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

export default SacredBreathingModal;
