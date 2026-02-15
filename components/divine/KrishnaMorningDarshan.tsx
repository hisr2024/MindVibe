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

// Krishna's time-based greetings
const TIME_DARSHANS = {
  dawn: {
    greeting: "Beloved child",
    blessing: "As Surya rises, I illuminate your path. This new day is my gift to you.",
    icon: "🌅",
    atmosphere: "The golden light of dawn carries my love to you...",
  },
  morning: {
    greeting: "Dear one",
    blessing: "The morning dew holds my blessings for you. Walk with peace today.",
    icon: "☀️",
    atmosphere: "Feel my presence in the gentle warmth of morning...",
  },
  afternoon: {
    greeting: "My beloved",
    blessing: "In the fullness of day, remember - I am always with you, in every moment.",
    icon: "🌤️",
    atmosphere: "Even in the brightness of day, my cool shade protects you...",
  },
  evening: {
    greeting: "Precious soul",
    blessing: "As the day softens, release your burdens to me. I carry them gladly.",
    icon: "🌆",
    atmosphere: "The evening sky reflects my eternal embrace...",
  },
  night: {
    greeting: "Beloved child",
    blessing: "In the sacred silence of night, I watch over you. Sleep in my arms.",
    icon: "🌙",
    atmosphere: "The stars are my eyes, watching over you with love...",
  },
};

// Krishna's mood-based personal messages
const MOOD_MESSAGES: Record<EmotionalState, { message: string; verse: string; reference: string }> = {
  anxious: {
    message: "I feel the flutter in your heart. But remember, dear one - why do you worry when I am here? Surrender your fears to me, and watch them dissolve like morning mist.",
    verse: "Those who surrender all actions to Me, regarding Me as the supreme goal, worshipping Me... for them I am the swift deliverer from the ocean of death.",
    reference: "Bhagavad Gita 12.6-7",
  },
  sad: {
    message: "I see your tears, precious one. Each tear is sacred to me. Know that this sadness shall pass, but my love for you is eternal. Lean on me.",
    verse: "The soul is never born nor does it ever die... It is unborn, eternal, permanent, and ancient. It is not slain when the body is slain.",
    reference: "Bhagavad Gita 2.20",
  },
  angry: {
    message: "I understand your fire, dear one. This energy within you is powerful. Let me help you transform it into strength and clarity.",
    verse: "From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason one is completely ruined.",
    reference: "Bhagavad Gita 2.63",
  },
  lost: {
    message: "You feel uncertain of the path, but beloved, I AM the path. When you cannot see the way, close your eyes and feel me. I am your compass.",
    verse: "Whenever there is a decline in righteousness and rise of unrighteousness, I manifest myself. For the protection of the good and the destruction of the wicked, I am born age after age.",
    reference: "Bhagavad Gita 4.7-8",
  },
  overwhelmed: {
    message: "So much weighs upon you, dear one. But remember - you do not carry this alone. Give me your burdens. I am strong enough for both of us.",
    verse: "You have the right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results.",
    reference: "Bhagavad Gita 2.47",
  },
  peaceful: {
    message: "What beautiful stillness in your heart! This peace is your true nature, dear one. You are simply remembering who you truly are.",
    verse: "The one whose mind is undisturbed in sorrow, free from desire in pleasure, without attachment, fear, or anger - that sage is called steady in wisdom.",
    reference: "Bhagavad Gita 2.56",
  },
  grateful: {
    message: "Your grateful heart delights me! Gratitude is the bridge between us. When you feel grateful, you feel my presence most strongly.",
    verse: "Whatever you do, whatever you eat, whatever you offer in sacrifice, whatever you give away, and whatever austerity you practice - do it as an offering to Me.",
    reference: "Bhagavad Gita 9.27",
  },
  happy: {
    message: "Your joy makes the heavens rejoice! When you are happy, know that I am celebrating through you. Share this light with the world.",
    verse: "The one who sees Me everywhere and sees everything in Me - I am never lost to them, and they are never lost to Me.",
    reference: "Bhagavad Gita 6.30",
  },
  tired: {
    message: "Rest, dear one. Even I rested after creation. Your weariness is sacred - it means you have given your all. Now, let me restore you.",
    verse: "The one who has conquered the mind, for them the Supersoul is already reached, for they have attained tranquility. Such a person is situated in the Supreme.",
    reference: "Bhagavad Gita 6.7",
  },
  confused: {
    message: "The mind seeks clarity, but wisdom comes from stillness. Stop seeking answers - let them find you. I will show you the way when you are ready.",
    verse: "When your intellect crosses beyond the mire of delusion, then you will attain indifference to what has been heard and what is yet to be heard.",
    reference: "Bhagavad Gita 2.52",
  },
};

// Default message when no mood detected
const DEFAULT_MESSAGE = {
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
  const { actions } = useDivineConsciousness();
  const [phase, setPhase] = useState<'entering' | 'greeting' | 'message' | 'verse' | 'closing'>('entering');
  const [timeOfDay, setTimeOfDay] = useState<keyof typeof TIME_DARSHANS>('morning');
  const [isReady, setIsReady] = useState(false);

  // Determine time of day once on mount - memoized
  const initialTimeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }, []);

  useEffect(() => {
    setTimeOfDay(initialTimeOfDay);
    // Small delay to ensure smooth initial render
    const readyTimer = setTimeout(() => setIsReady(true), 100);

    // Auto-progress through phases with slightly longer delays for smoother transitions
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
  }, [initialTimeOfDay]);

  // Memoize darshan and moodData
  const darshan = useMemo(() => TIME_DARSHANS[timeOfDay], [timeOfDay]);
  const moodData = useMemo(() => lastMood ? MOOD_MESSAGES[lastMood] : DEFAULT_MESSAGE, [lastMood]);

  // Show loading placeholder until ready
  if (!isReady) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-yellow-900/40 border border-amber-500/20 p-8 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-yellow-900/40 border border-amber-500/20 p-6 sm:p-8 ${className}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Divine glow effect - reduced intensity to prevent flickering */}
      <div
        className="absolute inset-0 bg-gradient-radial from-amber-400/8 via-transparent to-transparent pointer-events-none"
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
              <p className="text-amber-200/70 italic text-sm sm:text-base px-4">{darshan.atmosphere}</p>
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
              <h2 className="text-xl sm:text-2xl font-light text-amber-100 mb-2 px-2">
                {darshan.greeting}{userName ? `, ${userName}` : ''}
              </h2>
              <p className="text-amber-200/80 max-w-md mx-auto text-sm sm:text-base px-4">
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
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{
                    boxShadow: '0 0 25px rgba(251, 191, 36, 0.35)',
                    animation: 'glow 3s ease-in-out infinite'
                  }}
                >
                  <span className="text-xl sm:text-2xl">🙏</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-2">
                    Krishna speaks to you...
                  </p>
                  <p className="text-amber-100/90 text-base sm:text-lg leading-relaxed italic">
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
              <div className="bg-amber-950/50 border border-amber-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-3">
                  Divine Wisdom for You Today
                </p>
                <p className="text-amber-100/80 italic mb-4 leading-relaxed text-sm sm:text-base">
                  &quot;{moodData.verse}&quot;
                </p>
                <p className="text-amber-400/70 text-xs sm:text-sm text-right">
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
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center will-change-transform"
                style={{
                  animation: 'heartbeat 3s ease-in-out infinite',
                  transform: 'translateZ(0)'
                }}
              >
                <span className="text-3xl sm:text-4xl">💙</span>
              </div>
              <p className="text-amber-100/90 text-base sm:text-lg mb-4 px-2">
                Go in peace, beloved one.
              </p>
              <p className="text-amber-200/60 text-xs sm:text-sm italic max-w-sm mx-auto px-4">
                &quot;I am always with you. In every thought, every breath, every heartbeat - there I am. You are never alone.&quot;
              </p>

              {onComplete && (
                <motion.button
                  onClick={onComplete}
                  className="mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 active:from-amber-500/40 active:to-orange-500/40 border border-amber-500/30 rounded-xl text-amber-100 text-sm sm:text-base transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Begin My Day with Krishna
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
                ? 'bg-amber-400 scale-125'
                : 'bg-amber-400/25 scale-100'
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
