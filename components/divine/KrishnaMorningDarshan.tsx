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
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness, EmotionalState } from '@/contexts/DivineConsciousnessContext';

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

  useEffect(() => {
    // Determine time of day
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 7) setTimeOfDay('dawn');
    else if (hour >= 7 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');

    // Auto-progress through phases
    const timers = [
      setTimeout(() => setPhase('greeting'), 1500),
      setTimeout(() => setPhase('message'), 4000),
      setTimeout(() => setPhase('verse'), 9000),
      setTimeout(() => setPhase('closing'), 15000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const darshan = TIME_DARSHANS[timeOfDay];
  const moodData = lastMood ? MOOD_MESSAGES[lastMood] : DEFAULT_MESSAGE;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-yellow-900/40 border border-amber-500/20 p-8 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Divine glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-amber-400/10 via-transparent to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Krishna's flute decorative element */}
      <motion.div
        className="absolute top-4 right-4 text-4xl opacity-30"
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        🪈
      </motion.div>

      {/* Peacock feather accent */}
      <motion.div
        className="absolute bottom-4 left-4 text-3xl opacity-20"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🦚
      </motion.div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* Phase 1: Entering - Krishna's presence arrives */}
          {phase === 'entering' && (
            <motion.div
              key="entering"
              className="text-center py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.span
                className="text-6xl block mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {darshan.icon}
              </motion.span>
              <p className="text-amber-200/70 italic">{darshan.atmosphere}</p>
            </motion.div>
          )}

          {/* Phase 2: Greeting */}
          {phase === 'greeting' && (
            <motion.div
              key="greeting"
              className="text-center py-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.span className="text-5xl block mb-4">{darshan.icon}</motion.span>
              <h2 className="text-2xl font-light text-amber-100 mb-2">
                {darshan.greeting}{userName ? `, ${userName}` : ''}
              </h2>
              <p className="text-amber-200/80 max-w-md mx-auto">
                {darshan.blessing}
              </p>
            </motion.div>
          )}

          {/* Phase 3: Personal Message based on mood */}
          {phase === 'message' && (
            <motion.div
              key="message"
              className="py-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-start gap-4">
                <motion.div
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(251, 191, 36, 0.3)',
                      '0 0 40px rgba(251, 191, 36, 0.5)',
                      '0 0 20px rgba(251, 191, 36, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl">🙏</span>
                </motion.div>
                <div>
                  <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-2">
                    Krishna speaks to you...
                  </p>
                  <p className="text-amber-100/90 text-lg leading-relaxed italic">
                    "{moodData.message}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase 4: Gita Verse */}
          {phase === 'verse' && (
            <motion.div
              key="verse"
              className="py-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-amber-950/50 border border-amber-500/20 rounded-2xl p-6">
                <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-3">
                  Divine Wisdom for You Today
                </p>
                <p className="text-amber-100/80 italic mb-4 leading-relaxed">
                  "{moodData.verse}"
                </p>
                <p className="text-amber-400/70 text-sm text-right">
                  - {moodData.reference}
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase 5: Closing Blessing */}
          {phase === 'closing' && (
            <motion.div
              key="closing"
              className="text-center py-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-4xl">💙</span>
              </motion.div>
              <p className="text-amber-100/90 text-lg mb-4">
                Go in peace, beloved one.
              </p>
              <p className="text-amber-200/60 text-sm italic max-w-sm mx-auto">
                "I am always with you. In every thought, every breath, every heartbeat - there I am. You are never alone."
              </p>

              {onComplete && (
                <motion.button
                  onClick={onComplete}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-xl text-amber-100 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Begin My Day with Krishna
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase indicator dots */}
      <div className="flex justify-center gap-2 mt-6">
        {['entering', 'greeting', 'message', 'verse', 'closing'].map((p, i) => (
          <motion.div
            key={p}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              phase === p ? 'bg-amber-400' : 'bg-amber-400/20'
            }`}
            animate={phase === p ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default KrishnaMorningDarshan;
