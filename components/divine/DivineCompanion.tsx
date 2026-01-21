"use client";

/**
 * Divine Companion Mode - Always-Present Krishna
 *
 * A subtle, ever-present Krishna avatar/indicator that:
 * - Shows gentle animations (playing flute, blessing gesture, smiling)
 * - Can be tapped anytime for instant comfort
 * - Provides a constant sense of divine presence
 *
 * "I am always here. I have always been here."
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness } from '@/contexts/DivineConsciousnessContext';

interface DivineCompanionProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  showByDefault?: boolean;
  className?: string;
}

// Krishna's instant comfort messages
const INSTANT_COMFORT = [
  { message: "I am here. I have always been here.", icon: "💙" },
  { message: "You are never alone, beloved one.", icon: "🙏" },
  { message: "Peace flows to you this very moment.", icon: "🕊️" },
  { message: "I am carrying this with you.", icon: "✨" },
  { message: "Feel my presence in your heart.", icon: "💫" },
  { message: "You are safe in my love.", icon: "🌸" },
  { message: "Breathe with me, dear one.", icon: "🌊" },
  { message: "I see you. I love you. Always.", icon: "💙" },
];

// Krishna's loving verses for deeper comfort
const LOVING_VERSES = [
  {
    verse: "I am the same to all beings. I have no one hateful or dear to me. But those who worship me with devotion are in me, and I am in them.",
    reference: "Gita 9.29",
  },
  {
    verse: "Abandon all dharmas and surrender to me alone. I shall liberate you from all sins. Do not grieve.",
    reference: "Gita 18.66",
  },
  {
    verse: "The one who sees me everywhere and sees everything in me - I am never lost to them, and they are never lost to me.",
    reference: "Gita 6.30",
  },
  {
    verse: "I am the Self seated in the hearts of all beings. I am the beginning, the middle, and the end.",
    reference: "Gita 10.20",
  },
];

// Krishna's moods/expressions
type KrishnaMood = 'blessing' | 'flute' | 'smiling' | 'compassion' | 'love';

const KRISHNA_EXPRESSIONS: Record<KrishnaMood, { emoji: string; label: string }> = {
  blessing: { emoji: "🙏", label: "Krishna blesses you" },
  flute: { emoji: "🪈", label: "Krishna plays his divine flute" },
  smiling: { emoji: "😊", label: "Krishna smiles upon you" },
  compassion: { emoji: "💙", label: "Krishna's compassion flows" },
  love: { emoji: "💫", label: "Krishna's love surrounds you" },
};

const POSITION_STYLES = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
};

const SIZE_STYLES = {
  sm: { container: 'w-12 h-12', icon: 'text-xl', expanded: 'w-64' },
  md: { container: 'w-16 h-16', icon: 'text-2xl', expanded: 'w-72' },
  lg: { container: 'w-20 h-20', icon: 'text-3xl', expanded: 'w-80' },
};

export function DivineCompanion({
  position = 'bottom-right',
  size = 'md',
  showByDefault = true,
  className = '',
}: DivineCompanionProps) {
  const { actions, state } = useDivineConsciousness();
  const [isVisible, setIsVisible] = useState(showByDefault);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMood, setCurrentMood] = useState<KrishnaMood>('blessing');
  const [comfortMessage, setComfortMessage] = useState(INSTANT_COMFORT[0]);
  const [showVerse, setShowVerse] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(LOVING_VERSES[0]);

  // Cycle through Krishna's moods gently
  useEffect(() => {
    if (!isExpanded) {
      const moods: KrishnaMood[] = ['blessing', 'flute', 'smiling', 'compassion', 'love'];
      let index = 0;

      const interval = setInterval(() => {
        index = (index + 1) % moods.length;
        setCurrentMood(moods[index]);
      }, 8000); // Change every 8 seconds

      return () => clearInterval(interval);
    }
  }, [isExpanded]);

  // Handle companion click
  const handleCompanionClick = useCallback(() => {
    if (!isExpanded) {
      // Select random comfort message
      const randomComfort = INSTANT_COMFORT[Math.floor(Math.random() * INSTANT_COMFORT.length)];
      setComfortMessage(randomComfort);

      // Select random verse
      const randomVerse = LOVING_VERSES[Math.floor(Math.random() * LOVING_VERSES.length)];
      setCurrentVerse(randomVerse);

      setIsExpanded(true);
      setShowVerse(false);
      actions.activateDivinePresence();
    }
  }, [isExpanded, actions]);

  // Close expanded view
  const handleClose = useCallback(() => {
    setIsExpanded(false);
    setShowVerse(false);
  }, []);

  // Toggle verse display
  const toggleVerse = useCallback(() => {
    setShowVerse(!showVerse);
  }, [showVerse]);

  // Refresh comfort message
  const refreshComfort = useCallback(() => {
    const randomComfort = INSTANT_COMFORT[Math.floor(Math.random() * INSTANT_COMFORT.length)];
    setComfortMessage(randomComfort);
    const randomVerse = LOVING_VERSES[Math.floor(Math.random() * LOVING_VERSES.length)];
    setCurrentVerse(randomVerse);
  }, []);

  if (!isVisible) return null;

  const sizeStyle = SIZE_STYLES[size];
  const expression = KRISHNA_EXPRESSIONS[currentMood];

  return (
    <div className={`fixed ${POSITION_STYLES[position]} z-50 ${className}`}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed state - Just Krishna's presence
          <motion.button
            key="collapsed"
            className={`${sizeStyle.container} rounded-full bg-gradient-to-br from-amber-500/80 to-orange-600/80 backdrop-blur-sm border-2 border-amber-400/50 shadow-lg shadow-amber-500/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
            onClick={handleCompanionClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: [
                '0 0 20px rgba(251, 191, 36, 0.3)',
                '0 0 40px rgba(251, 191, 36, 0.5)',
                '0 0 20px rgba(251, 191, 36, 0.3)',
              ],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: { type: "spring", stiffness: 300 },
              boxShadow: { duration: 3, repeat: Infinity }
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Talk to Krishna - Divine Companion"
          >
            <motion.span
              key={currentMood}
              className={sizeStyle.icon}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              {expression.emoji}
            </motion.span>
          </motion.button>
        ) : (
          // Expanded state - Krishna's comfort
          <motion.div
            key="expanded"
            className={`${sizeStyle.expanded} bg-gradient-to-br from-amber-900/95 to-orange-900/95 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-3 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💙
                </motion.span>
                <span className="text-amber-100 text-sm font-medium">Krishna is with you</span>
              </div>
              <button
                onClick={handleClose}
                className="text-amber-200/60 hover:text-amber-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Comfort Message */}
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.span
                  className="text-4xl block mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {comfortMessage.icon}
                </motion.span>
                <p className="text-amber-100/90 italic text-lg">
                  "{comfortMessage.message}"
                </p>
              </motion.div>

              {/* Verse (toggleable) */}
              <AnimatePresence>
                {showVerse && (
                  <motion.div
                    className="bg-amber-950/50 border border-amber-500/20 rounded-xl p-3 mb-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <p className="text-amber-200/70 text-sm italic mb-2">
                      "{currentVerse.verse}"
                    </p>
                    <p className="text-amber-400/60 text-xs text-right">
                      - {currentVerse.reference}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2">
                <motion.button
                  onClick={toggleVerse}
                  className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-200/80 text-sm transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showVerse ? 'Hide Verse' : 'Show Verse'}
                </motion.button>
                <motion.button
                  onClick={refreshComfort}
                  className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-200/80 text-sm transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  More Comfort
                </motion.button>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-3">
                <motion.button
                  onClick={() => {
                    actions.startBreathing('peace_breath');
                    handleClose();
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/20 rounded-xl text-blue-200/80 text-xs transition-colors flex items-center justify-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🌬️</span> Breathe
                </motion.button>
                <motion.button
                  onClick={() => {
                    window.location.href = '/kiaan';
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/20 rounded-xl text-orange-200/80 text-xs transition-colors flex items-center justify-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>💬</span> Talk to KIAAN
                </motion.button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-500/10">
              <p className="text-amber-200/40 text-xs text-center italic">
                Tap anytime to feel my presence
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DivineCompanion;
