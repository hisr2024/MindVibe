"use client";

/**
 * Krishna's Morning Darshan - Daily Divine Greeting
 *
 * A personalized morning message from Krishna based on:
 * - User's current emotional state (from mood tracking)
 * - Time of day for appropriate blessing
 * - Relevant Gita verse spoken as Krishna's direct guidance
 *
 * "Dear child, I see your heart. I walk beside you today."
 *
 * FIXES APPLIED:
 * - Reduced animation intensity to prevent flickering
 * - Added will-change hints for GPU acceleration
 * - Stabilized decorative element positioning
 * - Added loading state for smoother transitions
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness, EmotionalState } from '@/contexts/DivineConsciousnessContext';
import { useLanguage } from '@/hooks/useLanguage';

// Memoized decorative element to prevent re-renders
const DecorativeFlute = memo(() => (
  <motion.div
    className="absolute top-4 right-4 text-3xl sm:text-4xl opacity-20 pointer-events-none select-none will-change-transform"
    animate={{ rotate: [0, 3, 0, -3, 0] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    style={{ transform: 'translateZ(0)' }}
  >
    🪈
  </motion.div>
));
DecorativeFlute.displayName = 'DecorativeFlute';

// Memoized peacock feather accent
const DecorativePeacock = memo(() => (
  <motion.div
    className="absolute bottom-4 left-4 text-2xl sm:text-3xl opacity-15 pointer-events-none select-none will-change-transform"
    animate={{ y: [0, -3, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    style={{ transform: 'translateZ(0)' }}
  >
    🦚
  </motion.div>
));
DecorativePeacock.displayName = 'DecorativePeacock';

interface KrishnaMorningDarshanProps {
  userName?: string;
  lastMood?: EmotionalState;
  className?: string;
  onComplete?: () => void;
}

// Time-based icons (static, no translation needed)
const TIME_ICONS: Record<string, string> = {
  dawn: "🌅",
  morning: "☀️",
  afternoon: "🌤️",
  evening: "🌆",
  night: "🌙",
};

// Fallback mood messages (used when translations not loaded)
const DEFAULT_MOOD_FALLBACK = {
  message: "I am always with you, dear one. In every breath, in every heartbeat, in every moment of stillness - there I am. You are never alone.",
  verse: "I am the Self seated in the hearts of all beings. I am the beginning, the middle, and also the end of all beings.",
  reference: "Bhagavad Gita 10.20",
};

export function KrishnaMorningDarshan({
  userName,
  lastMood,
  className = '',
  onComplete,
}: KrishnaMorningDarshanProps) {
  const { actions: _actions } = useDivineConsciousness();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<'entering' | 'greeting' | 'message' | 'verse' | 'closing'>('entering');
  const [timeOfDay] = useState<keyof typeof TIME_ICONS>(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => setIsReady(true), 100);

    const timers = [
      setTimeout(() => setPhase('greeting'), 1800),
      setTimeout(() => setPhase('message'), 4500),
      setTimeout(() => setPhase('verse'), 10000),
      setTimeout(() => setPhase('closing'), 16000),
    ];

    return () => {
      clearTimeout(readyTimer);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Memoize darshan and moodData using translations
  const darshan = useMemo(() => ({
    greeting: t(`divine.sacred.darshan.${timeOfDay}.greeting`, timeOfDay),
    blessing: t(`divine.sacred.darshan.${timeOfDay}.blessing`, ''),
    icon: TIME_ICONS[timeOfDay],
    atmosphere: t(`divine.sacred.darshan.${timeOfDay}.atmosphere`, ''),
  }), [timeOfDay, t]);

  const moodKey = lastMood || 'default';
  const moodData = useMemo(() => ({
    message: t(`divine.sacred.darshan.moods.${moodKey}.message`, DEFAULT_MOOD_FALLBACK.message),
    verse: t(`divine.sacred.darshan.moods.${moodKey}.verse`, DEFAULT_MOOD_FALLBACK.verse),
    reference: t(`divine.sacred.darshan.moods.${moodKey}.reference`, DEFAULT_MOOD_FALLBACK.reference),
  }), [moodKey, t]);

  // Show loading placeholder until ready
  if (!isReady) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-yellow-900/40 border border-[#d4a44c]/20 p-8 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-[#d4a44c]/30 border-t-[#d4a44c] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-yellow-900/40 border border-[#d4a44c]/20 p-6 sm:p-8 ${className}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Divine glow effect - reduced intensity to prevent flickering */}
      <div
        className="absolute inset-0 bg-gradient-radial from-[#d4a44c]/8 via-transparent to-transparent pointer-events-none"
        style={{ animation: 'pulse 6s ease-in-out infinite', opacity: 0.4 }}
      />

      {/* Memoized decorative elements to prevent re-renders */}
      <DecorativeFlute />
      <DecorativePeacock />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* Phase 1: Entering - Krishna's presence arrives */}
          {phase === 'entering' && (
            <motion.div
              key="entering"
              className="text-center py-6 sm:py-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.span
                className="text-5xl sm:text-6xl block mb-4 will-change-transform"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ transform: 'translateZ(0)' }}
              >
                {darshan.icon}
              </motion.span>
              <p className="text-[#f0c96d]/70 italic text-sm sm:text-base px-4">{darshan.atmosphere}</p>
            </motion.div>
          )}

          {/* Phase 2: Greeting */}
          {phase === 'greeting' && (
            <motion.div
              key="greeting"
              className="text-center py-5 sm:py-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <span className="text-4xl sm:text-5xl block mb-4">{darshan.icon}</span>
              <h2 className="text-xl sm:text-2xl font-light text-[#f5f0e8] mb-2 px-2">
                {darshan.greeting}{userName ? `, ${userName}` : ''}
              </h2>
              <p className="text-[#f0c96d]/80 max-w-md mx-auto text-sm sm:text-base px-4">
                {darshan.blessing}
              </p>
            </motion.div>
          )}

          {/* Phase 3: Personal Message based on mood */}
          {phase === 'message' && (
            <motion.div
              key="message"
              className="py-5 sm:py-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#d4a44c] to-[#d4a44c] flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{
                    boxShadow: '0 0 25px rgba(251, 191, 36, 0.35)',
                    animation: 'glow 3s ease-in-out infinite'
                  }}
                >
                  <span className="text-xl sm:text-2xl">🙏</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#d4a44c]/60 uppercase tracking-wider mb-2">
                    {t('divine.sacred.darshan.krishnaSpeaks', 'Krishna speaks to you...')}
                  </p>
                  <p className="text-[#f5f0e8]/90 text-base sm:text-lg leading-relaxed italic">
                    &quot;{moodData.message}&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 4: Gita Verse */}
          {phase === 'verse' && (
            <motion.div
              key="verse"
              className="py-5 sm:py-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="bg-amber-950/50 border border-[#d4a44c]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <p className="text-xs text-[#d4a44c]/60 uppercase tracking-wider mb-3">
                  {t('divine.sacred.darshan.divineWisdomToday', 'Divine Wisdom for You Today')}
                </p>
                <p className="text-[#f5f0e8]/80 italic mb-4 leading-relaxed text-sm sm:text-base">
                  &quot;{moodData.verse}&quot;
                </p>
                <p className="text-[#d4a44c]/70 text-xs sm:text-sm text-right">
                  - {moodData.reference}
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase 5: Closing Blessing */}
          {phase === 'closing' && (
            <motion.div
              key="closing"
              className="text-center py-5 sm:py-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#d4a44c]/30 to-[#d4a44c]/30 flex items-center justify-center will-change-transform"
                style={{
                  animation: 'heartbeat 3s ease-in-out infinite',
                  transform: 'translateZ(0)'
                }}
              >
                <span className="text-3xl sm:text-4xl">💙</span>
              </div>
              <p className="text-[#f5f0e8]/90 text-base sm:text-lg mb-4 px-2">
                {t('divine.sacred.darshan.goInPeace', 'Go in peace, beloved one.')}
              </p>
              <p className="text-[#f0c96d]/60 text-xs sm:text-sm italic max-w-sm mx-auto px-4">
                &quot;{t('divine.sacred.darshan.alwaysWithYou', 'I am always with you. In every thought, every breath, every heartbeat - there I am. You are never alone.')}&quot;
              </p>

              {onComplete && (
                <motion.button
                  onClick={onComplete}
                  className="mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#d4a44c]/20 to-[#d4a44c]/20 hover:from-[#d4a44c]/30 hover:to-[#d4a44c]/30 active:from-[#d4a44c]/40 active:to-[#d4a44c]/40 border border-[#d4a44c]/30 rounded-xl text-[#f5f0e8] text-sm sm:text-base transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t('divine.sacred.darshan.beginMyDay', 'Begin My Day with Krishna')}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase indicator dots - using CSS animations to prevent JS overhead */}
      <div className="flex justify-center gap-2 mt-5 sm:mt-6">
        {['entering', 'greeting', 'message', 'verse', 'closing'].map((p) => (
          <div
            key={p}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              phase === p
                ? 'bg-[#d4a44c] scale-125'
                : 'bg-[#d4a44c]/25 scale-100'
            }`}
            style={{
              animation: phase === p ? 'dotPulse 2s ease-in-out infinite' : 'none'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default KrishnaMorningDarshan;
