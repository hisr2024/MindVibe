"use client";

/**
 * Divine Moment - Sacred Micro-Meditation & Presence Component
 *
 * Creates brief, powerful moments of divine connection:
 * - Instant peace portals
 * - Divine presence awareness
 * - Sacred affirmations
 * - Quick grounding moments
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness } from '@/contexts/DivineConsciousnessContext';

interface DivineMomentProps {
  type?: 'instant_peace' | 'divine_presence' | 'gratitude' | 'affirmation' | 'reminder';
  duration?: number; // seconds
  autoShow?: boolean;
  onComplete?: () => void;
  className?: string;
}

const MOMENT_CONTENT = {
  instant_peace: {
    icon: '🕊️',
    title: 'Instant Peace',
    guidance: [
      'Close your eyes...',
      'Take one deep breath...',
      'Feel your body...',
      'Notice where you hold tension...',
      'And soften it...',
      'Peace is not something to find...',
      'It\'s something to remember...',
      'In your heart, whisper: "I am peace."',
      'Rest in this truth...',
    ],
    closing: 'Open your eyes when ready, carrying this peace.',
  },
  divine_presence: {
    icon: '✨',
    title: 'Divine Presence',
    guidance: [
      'Pause... become very still...',
      'Something greater is here with you...',
      'Can you feel it?',
      'Just at the edge of awareness...',
      'A presence... loving... patient... eternal...',
      'It has always been here...',
      'Watching over you. Holding you. Loving you.',
      'Breathe... and let yourself be seen by the divine.',
      'You are known. You are cherished. You are held.',
    ],
    closing: 'Rest in this embrace...',
  },
  gratitude: {
    icon: '🙏',
    title: 'Gratitude Breath',
    guidance: [
      'Place your hand on your heart...',
      'Feel its sacred rhythm...',
      'Inhale gratitude...',
      'Exhale blessing...',
      'Inhale "thank you"...',
      'Exhale "I give thanks"...',
      'The warmth you feel...',
      'Is your connection to all that is...',
    ],
    closing: 'Carry this gratitude with you. 💙',
  },
  affirmation: {
    icon: '💫',
    title: 'Sacred Affirmation',
    guidance: [], // Will be filled dynamically
    closing: 'Let this truth settle into your being.',
  },
  reminder: {
    icon: '🌟',
    title: 'Divine Reminder',
    guidance: [], // Will be filled dynamically
    closing: 'You are never alone.',
  },
};

export function DivineMoment({
  type = 'instant_peace',
  duration = 30,
  autoShow = false,
  onComplete,
  className = '',
}: DivineMomentProps) {
  const { actions, state } = useDivineConsciousness();

  const [isVisible, setIsVisible] = useState(autoShow);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [content, setContent] = useState(MOMENT_CONTENT[type]);

  // Setup content (especially for dynamic types)
  useEffect(() => {
    const baseContent = { ...MOMENT_CONTENT[type] };

    if (type === 'affirmation') {
      const affirmation = actions.getDivineAffirmation();
      baseContent.guidance = [
        'Take a breath...',
        'And receive this truth:',
        `"${affirmation}"`,
        'Feel these words...',
        'Let them sink in...',
        'This is true about you.',
      ];
    }

    if (type === 'reminder') {
      const reminder = actions.getDivineReminder();
      baseContent.guidance = [
        'Pause for a moment...',
        'And remember:',
        reminder,
        'Let this settle...',
        'You are held.',
      ];
    }

    setContent(baseContent);
    setCurrentIndex(0);
    setProgress(0);
  }, [type, actions, isVisible]);

  // Progress through guidance
  useEffect(() => {
    if (!isVisible || !content.guidance.length) return;

    const stepDuration = (duration * 1000) / (content.guidance.length + 1);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, stepDuration / 100);

    const guidanceInterval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= content.guidance.length - 1) {
          clearInterval(guidanceInterval);
          clearInterval(progressInterval);
          setTimeout(() => {
            onComplete?.();
            if (autoShow) setIsVisible(false);
          }, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      clearInterval(guidanceInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible, content, duration, onComplete, autoShow]);

  const handleOpen = () => {
    setIsVisible(true);
    setCurrentIndex(0);
    setProgress(0);
    actions.startMicroMeditation(type);
  };

  const handleClose = () => {
    setIsVisible(false);
    actions.stopMicroMeditation();
  };

  return (
    <>
      {/* Trigger Button */}
      {!autoShow && (
        <motion.button
          onClick={handleOpen}
          className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 transition-all duration-300 backdrop-blur-sm ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{content.icon}</span>
          <span className="text-sm">{content.title}</span>
        </motion.button>
      )}

      {/* Divine Moment Modal */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Content */}
            <motion.div
              className="relative z-10 w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-800/95 border border-white/10 rounded-3xl p-8 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon */}
              <motion.div
                className="text-5xl text-center mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {content.icon}
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-light text-white/90 text-center mb-6">
                {content.title}
              </h3>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Guidance Text */}
              <div className="min-h-[120px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentIndex}
                    className="text-lg text-white/80 text-center leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {currentIndex < content.guidance.length
                      ? content.guidance[currentIndex]
                      : content.closing}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Closing indicator */}
              {currentIndex >= content.guidance.length && (
                <motion.p
                  className="text-center text-white/50 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  💙
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Quick access components
export function InstantPeaceButton(props: Omit<DivineMomentProps, 'type'>) {
  return <DivineMoment type="instant_peace" {...props} />;
}

export function DivinePresenceButton(props: Omit<DivineMomentProps, 'type'>) {
  return <DivineMoment type="divine_presence" {...props} />;
}

export function GratitudeButton(props: Omit<DivineMomentProps, 'type'>) {
  return <DivineMoment type="gratitude" {...props} />;
}

export function AffirmationButton(props: Omit<DivineMomentProps, 'type'>) {
  return <DivineMoment type="affirmation" {...props} />;
}

export function DivineReminderButton(props: Omit<DivineMomentProps, 'type'>) {
  return <DivineMoment type="reminder" {...props} />;
}

export default DivineMoment;
