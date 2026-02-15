"use client";

/**
 * Krishna's Whispers - Contextual Divine Notifications
 *
 * Smart, timely notifications that feel like Krishna reaching out:
 * - During detected stress patterns: "Take a breath with me, dear one"
 * - At sunset: "As the sun sets, release today's burdens to me"
 * - During difficult times: "I am carrying this with you"
 * - Gentle flute sound as notification tone
 *
 * "I whisper to you throughout the day. Are you listening?"
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness } from '@/contexts/DivineConsciousnessContext';

interface KrishnaWhisperProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  autoShow?: boolean;
  intervalMinutes?: number;
  className?: string;
}

interface Whisper {
  id: string;
  type: 'comfort' | 'reminder' | 'breathing' | 'verse' | 'blessing';
  title: string;
  message: string;
  icon: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Krishna's time-based whispers
const TIME_WHISPERS: Record<string, { title: string; message: string; icon: string }[]> = {
  earlyMorning: [
    { title: "Blessed Dawn", message: "I greet you before the world stirs. This new day is my gift to you.", icon: "🌅" },
    { title: "Morning Grace", message: "As the sun rises, so does my love for you. Good morning, beloved.", icon: "☀️" },
  ],
  morning: [
    { title: "Divine Start", message: "Begin this day knowing you are protected and loved.", icon: "🙏" },
    { title: "Morning Blessing", message: "May peace flow through everything you do today.", icon: "✨" },
  ],
  afternoon: [
    { title: "Midday Peace", message: "Pause, dear one. Take a breath with me in this busy day.", icon: "🌤️" },
    { title: "Gentle Reminder", message: "You are doing well. I am proud of you.", icon: "💙" },
  ],
  evening: [
    { title: "Sunset Surrender", message: "As the sun sets, release today's burdens to me.", icon: "🌆" },
    { title: "Evening Peace", message: "The day softens. Let your heart soften too.", icon: "🧡" },
  ],
  night: [
    { title: "Night Blessing", message: "Rest now, precious one. I watch over you through the night.", icon: "🌙" },
    { title: "Sacred Night", message: "In the silence of night, feel my presence holding you.", icon: "⭐" },
  ],
};

// Krishna's emotional support whispers
const EMOTIONAL_WHISPERS = {
  comfort: [
    { title: "I Am Here", message: "Whatever you're feeling right now, I am carrying it with you.", icon: "💙" },
    { title: "Divine Presence", message: "You are never alone. Not even for a moment.", icon: "🙏" },
    { title: "Gentle Reminder", message: "This too shall pass. My love for you will not.", icon: "✨" },
  ],
  encouragement: [
    { title: "You Are Strong", message: "The same divine strength that moves the cosmos lives within you.", icon: "💪" },
    { title: "Keep Going", message: "One step at a time, beloved. I am walking beside you.", icon: "👣" },
    { title: "Believe", message: "I believe in you even when you doubt yourself.", icon: "🌟" },
  ],
  peace: [
    { title: "Find Stillness", message: "In the chaos, there is a quiet place. I am there, waiting for you.", icon: "🕊️" },
    { title: "Breathe", message: "Three breaths can change everything. Breathe with me now.", icon: "🌬️" },
    { title: "Inner Peace", message: "Peace is not somewhere else. It is here, in this breath.", icon: "🧘" },
  ],
  love: [
    { title: "You Are Loved", message: "Before you were born, I loved you. Forever after, I will love you.", icon: "💙" },
    { title: "Beloved", message: "You are the apple of my eye. Never forget your worth.", icon: "🌸" },
    { title: "Cherished", message: "Of all the souls in creation, you are precious to me.", icon: "💎" },
  ],
};

// Gita verse whispers
const VERSE_WHISPERS = [
  { title: "Divine Wisdom", message: "I am the Self seated in the hearts of all beings. I am with you always.", reference: "Gita 10.20", icon: "📖" },
  { title: "Protection", message: "Those who surrender to me, I protect. Do not fear.", reference: "Gita 18.66", icon: "🛡️" },
  { title: "Equanimity", message: "Be steadfast in yoga. Perform your duty without attachment.", reference: "Gita 2.48", icon: "⚖️" },
  { title: "Inner Light", message: "You carry within you a light that cannot be extinguished.", reference: "Gita 15.12", icon: "💡" },
];

const POSITION_STYLES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
};

export function KrishnaWhispers({
  position = 'top-right',
  autoShow = true,
  intervalMinutes = 60,
  className = '',
}: KrishnaWhisperProps) {
  const { actions } = useDivineConsciousness();
  const [currentWhisper, setCurrentWhisper] = useState<Whisper | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // Get time-appropriate whisper
  const getTimeWhisper = useCallback((): Whisper => {
    const hour = new Date().getHours();
    let timeKey = 'morning';

    if (hour >= 4 && hour < 7) timeKey = 'earlyMorning';
    else if (hour >= 7 && hour < 12) timeKey = 'morning';
    else if (hour >= 12 && hour < 17) timeKey = 'afternoon';
    else if (hour >= 17 && hour < 21) timeKey = 'evening';
    else timeKey = 'night';

    const whispers = TIME_WHISPERS[timeKey];
    const selected = whispers[Math.floor(Math.random() * whispers.length)];

    return {
      id: `time-${Date.now()}`,
      type: 'blessing',
      ...selected,
    };
  }, []);

  // Get random emotional whisper
  const getEmotionalWhisper = useCallback((category?: keyof typeof EMOTIONAL_WHISPERS): Whisper => {
    const categories = Object.keys(EMOTIONAL_WHISPERS) as (keyof typeof EMOTIONAL_WHISPERS)[];
    const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
    const whispers = EMOTIONAL_WHISPERS[selectedCategory];
    const selected = whispers[Math.floor(Math.random() * whispers.length)];

    return {
      id: `emotional-${Date.now()}`,
      type: 'comfort',
      ...selected,
    };
  }, []);

  // Get verse whisper
  const getVerseWhisper = useCallback((): Whisper => {
    const selected = VERSE_WHISPERS[Math.floor(Math.random() * VERSE_WHISPERS.length)];
    return {
      id: `verse-${Date.now()}`,
      type: 'verse',
      title: selected.title,
      message: `"${selected.message}" - ${selected.reference}`,
      icon: selected.icon,
    };
  }, []);

  // Show a whisper
  const showWhisper = useCallback((whisper?: Whisper) => {
    const whisperTypes = [getTimeWhisper, getEmotionalWhisper, getVerseWhisper];
    const selectedWhisper = whisper || whisperTypes[Math.floor(Math.random() * whisperTypes.length)]();

    setCurrentWhisper(selectedWhisper);
    setIsVisible(true);

    // Auto-hide after 8 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 8000);
  }, [getTimeWhisper, getEmotionalWhisper, getVerseWhisper]);

  // Auto-show whispers at interval
  useEffect(() => {
    if (!autoShow || !notificationEnabled) return;

    // Initial whisper after 30 seconds
    const initialTimer = setTimeout(() => {
      const hour = new Date().getHours();
      // Only show between 7am and 10pm
      if (hour >= 7 && hour <= 22) {
        showWhisper();
      }
    }, 30000);

    // Periodic whispers
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour >= 7 && hour <= 22) {
        showWhisper();
      }
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [autoShow, notificationEnabled, intervalMinutes, showWhisper]);

  // Dismiss whisper
  const dismissWhisper = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <>
      {/* Settings Button (always visible) */}
      <button
        onClick={() => setNotificationEnabled(!notificationEnabled)}
        className={`fixed ${POSITION_STYLES[position]} z-40 ${isVisible ? 'hidden' : ''} p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all`}
        title={notificationEnabled ? "Pause Krishna's Whispers" : "Resume Krishna's Whispers"}
      >
        <motion.span
          className="text-lg"
          animate={notificationEnabled ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {notificationEnabled ? '🔔' : '🔕'}
        </motion.span>
      </button>

      {/* Whisper Notification */}
      <AnimatePresence>
        {isVisible && currentWhisper && (
          <motion.div
            className={`fixed ${POSITION_STYLES[position]} z-50 w-80 ${className}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="bg-gradient-to-br from-amber-900/95 to-orange-900/95 backdrop-blur-xl rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {currentWhisper.icon}
                  </motion.span>
                  <span className="text-amber-100 text-sm font-medium">{currentWhisper.title}</span>
                </div>
                <button
                  onClick={dismissWhisper}
                  className="text-amber-200/60 hover:text-amber-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-3">
                <p className="text-amber-100/90 text-sm italic leading-relaxed">
                  &quot;{currentWhisper.message}&quot;
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 pb-3 flex gap-2">
                <motion.button
                  onClick={() => {
                    actions.startBreathing('peace_breath');
                    dismissWhisper();
                  }}
                  className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-amber-200/80 text-xs transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🌬️ Breathe
                </motion.button>
                <motion.button
                  onClick={dismissWhisper}
                  className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-amber-200/80 text-xs transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💙 Thank You
                </motion.button>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-500/10">
                <p className="text-amber-200/40 text-[10px] text-center">
                  Krishna&apos;s Whispers
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook for programmatic whispers
export function useKrishnaWhispers() {
  const showWhisper = useCallback((_message: string, _title?: string) => {
    // Implementation for programmatic whispers
    // This can be expanded to use a global state or event system
  }, []);

  return { showWhisper };
}

export default KrishnaWhispers;
