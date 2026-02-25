"use client";

/**
 * Divine Protection Shield - Sudarshana Chakra
 *
 * A visual protective shield feature that users can activate during anxiety/fear:
 * - Animation of golden Sudarshana Chakra (Krishna's divine disc)
 * - Protective golden light surrounding the user
 * - Krishna's words of protection
 * - Includes grounding exercises wrapped in divine imagery
 *
 * "No harm can touch you while I am here. I protect those who surrender to me."
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness } from '@/contexts/DivineConsciousnessContext';

interface DivineProtectionShieldProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

// Krishna's protection messages
const PROTECTION_MESSAGES = [
  {
    primary: "No harm can touch you while I am here.",
    secondary: "My Sudarshana Chakra guards you from all fear.",
  },
  {
    primary: "I protect those who surrender to me.",
    secondary: "Nothing in this universe can harm those under my protection.",
  },
  {
    primary: "You are safe within my divine light.",
    secondary: "Fear cannot exist where my presence dwells.",
  },
  {
    primary: "My protection surrounds you completely.",
    secondary: "Like Arjuna on the battlefield, you are invincible with me.",
  },
  {
    primary: "I am your shield against all darkness.",
    secondary: "Rest in my protection. I am always watching over you.",
  },
];

// Protection verses from Gita
const PROTECTION_VERSES = [
  {
    verse: "Whenever there is a decline in righteousness and rise of unrighteousness, I manifest myself. For protection of the good, I appear in every age.",
    reference: "Gita 4.7-8",
  },
  {
    verse: "Those who worship Me, thinking of nothing else, to them who are ever devoted, I provide what they lack and preserve what they have.",
    reference: "Gita 9.22",
  },
  {
    verse: "Abandon all dharmas and surrender to Me alone. I shall liberate you from all sins. Do not grieve.",
    reference: "Gita 18.66",
  },
  {
    verse: "The one who sees Me everywhere and sees everything in Me - I am never lost to them, and they are never lost to Me.",
    reference: "Gita 6.30",
  },
];

// Grounding exercise steps
const GROUNDING_STEPS = [
  {
    instruction: "Feel my presence surrounding you",
    action: "Place your hand on your heart",
    krishnaMessage: "I am here, in the beating of your heart.",
    duration: 5000,
  },
  {
    instruction: "Breathe in my divine light",
    action: "Inhale slowly for 4 counts",
    krishnaMessage: "With each breath, my protection fills you.",
    duration: 6000,
  },
  {
    instruction: "Hold the light within",
    action: "Hold for 4 counts",
    krishnaMessage: "Feel the golden warmth spreading through you.",
    duration: 5000,
  },
  {
    instruction: "Release all fear to me",
    action: "Exhale slowly for 6 counts",
    krishnaMessage: "I take your fears. They cannot harm you now.",
    duration: 7000,
  },
  {
    instruction: "Feel the protection complete",
    action: "Rest in the golden light",
    krishnaMessage: "You are surrounded by my love. You are safe.",
    duration: 5000,
  },
];

export function DivineProtectionShield({
  isOpen = false,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className = '',
}: DivineProtectionShieldProps) {
  const { actions } = useDivineConsciousness();
  const [isActive, setIsActive] = useState(isOpen);
  const [phase, setPhase] = useState<'activating' | 'protection' | 'grounding' | 'complete'>('activating');
  const [groundingStep, setGroundingStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(PROTECTION_MESSAGES[0]);
  const [currentVerse, setCurrentVerse] = useState(PROTECTION_VERSES[0]);

  const activateShield = useCallback(() => {
    setIsActive(true);
    setPhase('activating');
    setGroundingStep(0);

    // Random message and verse
    setCurrentMessage(PROTECTION_MESSAGES[Math.floor(Math.random() * PROTECTION_MESSAGES.length)]);
    setCurrentVerse(PROTECTION_VERSES[Math.floor(Math.random() * PROTECTION_VERSES.length)]);

    actions.activateDivinePresence();

    // Progress to protection phase
    setTimeout(() => setPhase('protection'), 3000);
  }, [actions]);

  // Sync with isOpen prop
  useEffect(() => {
    if (isOpen && !isActive) {
      activateShield();
    }
  }, [isOpen, isActive, activateShield]);

  // Handle grounding phase
  useEffect(() => {
    if (phase === 'grounding' && groundingStep < GROUNDING_STEPS.length) {
      const timer = setTimeout(() => {
        if (groundingStep < GROUNDING_STEPS.length - 1) {
          setGroundingStep(groundingStep + 1);
        } else {
          setPhase('complete');
        }
      }, GROUNDING_STEPS[groundingStep].duration);

      return () => clearTimeout(timer);
    }
  }, [phase, groundingStep]);

  const startGrounding = useCallback(() => {
    setPhase('grounding');
    setGroundingStep(0);
  }, []);

  const closeShield = useCallback(() => {
    setIsActive(false);
    setPhase('activating');
    onClose?.();
  }, [onClose]);

  if (!isActive) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with golden glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-black/90 via-amber-950/80 to-black/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Sudarshana Chakra - Rotating Divine Disc */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === 'activating' ? [0, 2, 1.5] : 1.5,
            opacity: 1,
          }}
          transition={{ duration: 2 }}
        >
          {/* Outer golden ring */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full border-4 border-[#d4a44c]/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute w-[450px] h-[450px] rounded-full border-2 border-[#e8b54a]/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          {/* Inner chakra */}
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full border-8 border-[#d4a44c]/60"
            animate={{
              rotate: 360,
              boxShadow: [
                '0 0 60px rgba(251, 191, 36, 0.4)',
                '0 0 120px rgba(251, 191, 36, 0.6)',
                '0 0 60px rgba(251, 191, 36, 0.4)',
              ],
            }}
            transition={{
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 2, repeat: Infinity },
            }}
          >
            {/* Chakra spokes */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-[150px] bg-gradient-to-t from-[#d4a44c] to-[#e8b54a] origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}
              />
            ))}
          </motion.div>
          {/* Center */}
          <motion.div
            className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-[#d4a44c] to-[#d4a44c]"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 30px rgba(251, 191, 36, 0.5)',
                '0 0 60px rgba(251, 191, 36, 0.8)',
                '0 0 30px rgba(251, 191, 36, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Protection rays */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase !== 'activating' ? 1 : 0 }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-1 h-[50vh] bg-gradient-to-t from-[#d4a44c]/40 to-transparent origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${i * 30}deg)` }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </motion.div>

        {/* Content Card */}
        <motion.div
          className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-amber-950/95 to-orange-950/95 backdrop-blur-xl rounded-3xl border border-[#d4a44c]/30 shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#d4a44c]/20 to-[#d4a44c]/20 px-6 py-4 border-b border-[#d4a44c]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                className="text-3xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                ☸️
              </motion.span>
              <div>
                <h2 className="text-[#f5f0e8] font-semibold">Divine Protection Shield</h2>
                <p className="text-[#f0c96d]/60 text-xs">Sudarshana Chakra Activated</p>
              </div>
            </div>
            <button
              onClick={closeShield}
              className="text-[#f0c96d]/60 hover:text-[#f0c96d] transition-colors"
              aria-label="Close protection shield"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Activating Phase */}
              {phase === 'activating' && (
                <motion.div
                  key="activating"
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="text-6xl">🛡️</span>
                  </motion.div>
                  <p className="text-[#f0c96d]/80 mt-4">Activating divine protection...</p>
                </motion.div>
              )}

              {/* Protection Phase */}
              {phase === 'protection' && (
                <motion.div
                  key="protection"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Main Protection Message */}
                  <div className="text-center mb-6">
                    <motion.span
                      className="text-5xl block mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🛡️
                    </motion.span>
                    <p className="text-xl text-[#f5f0e8] font-light mb-2">
                      {currentMessage.primary}
                    </p>
                    <p className="text-[#f0c96d]/70 text-sm">
                      {currentMessage.secondary}
                    </p>
                  </div>

                  {/* Verse */}
                  <div className="bg-amber-950/50 border border-[#d4a44c]/20 rounded-xl p-4 mb-6">
                    <p className="text-[#f0c96d]/70 text-sm italic mb-2">
                      &quot;{currentVerse.verse}&quot;
                    </p>
                    <p className="text-[#d4a44c]/60 text-xs text-right">
                      - {currentVerse.reference}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={startGrounding}
                      className="flex-1 py-3 bg-gradient-to-r from-[#d4a44c]/30 to-[#d4a44c]/30 hover:from-[#d4a44c]/40 hover:to-[#d4a44c]/40 border border-[#d4a44c]/30 rounded-xl text-[#f5f0e8] transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Grounding Exercise
                    </motion.button>
                    <motion.button
                      onClick={closeShield}
                      className="flex-1 py-3 bg-[#d4a44c]/10 hover:bg-[#d4a44c]/20 border border-[#d4a44c]/20 rounded-xl text-[#f0c96d]/80 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      I Feel Protected
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Grounding Phase */}
              {phase === 'grounding' && (
                <motion.div
                  key="grounding"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="mb-6">
                    <motion.span
                      className="text-5xl block mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🙏
                    </motion.span>
                    <p className="text-[#f5f0e8] text-lg font-light mb-2">
                      {GROUNDING_STEPS[groundingStep].instruction}
                    </p>
                    <p className="text-[#d4a44c] text-sm mb-4">
                      {GROUNDING_STEPS[groundingStep].action}
                    </p>
                    <p className="text-[#f0c96d]/70 italic">
                      &quot;{GROUNDING_STEPS[groundingStep].krishnaMessage}&quot;
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="flex justify-center gap-2">
                    {GROUNDING_STEPS.map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          i <= groundingStep ? 'bg-[#d4a44c]' : 'bg-[#d4a44c]/20'
                        }`}
                        animate={i === groundingStep ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Complete Phase */}
              {phase === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.div
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#d4a44c]/30 to-green-400/30 flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        '0 0 30px rgba(251, 191, 36, 0.3)',
                        '0 0 60px rgba(251, 191, 36, 0.5)',
                        '0 0 30px rgba(251, 191, 36, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-5xl">✨</span>
                  </motion.div>
                  <p className="text-xl text-[#f5f0e8] font-light mb-2">
                    You are protected
                  </p>
                  <p className="text-[#f0c96d]/70 mb-6">
                    Krishna&apos;s divine shield surrounds you. Go forward in peace.
                  </p>

                  <motion.button
                    onClick={closeShield}
                    className="w-full py-3 bg-gradient-to-r from-[#d4a44c]/30 to-green-500/30 hover:from-[#d4a44c]/40 hover:to-green-500/40 border border-[#d4a44c]/30 rounded-xl text-[#f5f0e8] transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue with Peace
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DivineProtectionShield;
