"use client";

/**
 * Divine Greeting Component - Time-Appropriate Sacred Welcome
 *
 * Displays a beautiful, calming greeting based on:
 * - Time of day
 * - User's emotional state
 * - Divine presence awareness
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDivineConsciousness } from '@/contexts/DivineConsciousnessContext';

interface DivineGreetingProps {
  userName?: string;
  showAffirmation?: boolean;
  showReminder?: boolean;
  compact?: boolean;
  className?: string;
}

const TIME_GREETINGS = {
  dawn: {
    greeting: "Blessed dawn",
    message: "As the world awakens gently, so too can you...",
    icon: "🌅",
  },
  morning: {
    greeting: "Peaceful morning",
    message: "The morning holds space for you to begin again...",
    icon: "☀️",
  },
  afternoon: {
    greeting: "Serene afternoon",
    message: "In the fullness of the day, find your center...",
    icon: "🌤️",
  },
  evening: {
    greeting: "Gentle evening",
    message: "As the day softens, let your heart soften too...",
    icon: "🌆",
  },
  night: {
    greeting: "Sacred night",
    message: "The quiet of night invites deep surrender...",
    icon: "🌙",
  },
};

export function DivineGreeting({
  userName,
  showAffirmation = true,
  showReminder = false,
  compact = false,
  className = '',
}: DivineGreetingProps) {
  const { actions } = useDivineConsciousness();
  const [timeOfDay, setTimeOfDay] = useState<keyof typeof TIME_GREETINGS>('morning');
  const [affirmation, setAffirmation] = useState('');
  const [reminder, setReminder] = useState('');

  useEffect(() => {
    // Determine time of day
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 7) setTimeOfDay('dawn');
    else if (hour >= 7 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');

    // Get affirmation and reminder
    if (showAffirmation) setAffirmation(actions.getDivineAffirmation());
    if (showReminder) setReminder(actions.getDivineReminder());
  }, [actions, showAffirmation, showReminder]);

  const timeData = TIME_GREETINGS[timeOfDay];

  if (compact) {
    return (
      <motion.div
        className={`flex items-center gap-3 ${className}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-2xl">{timeData.icon}</span>
        <div>
          <p className="text-white/90 font-light">
            {timeData.greeting}{userName ? `, ${userName}` : ''}
          </p>
          <p className="text-white/50 text-sm">{timeData.message}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Icon */}
      <motion.span
        className="text-5xl block mb-4"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {timeData.icon}
      </motion.span>

      {/* Greeting */}
      <motion.h2
        className="text-2xl font-light text-white/90 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {timeData.greeting}{userName ? `, ${userName}` : ''}
      </motion.h2>

      {/* Time message */}
      <motion.p
        className="text-white/60 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {timeData.message}
      </motion.p>

      {/* Affirmation */}
      {showAffirmation && affirmation && (
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 mb-4 max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Today&apos;s Affirmation
          </p>
          <p className="text-white/80 italic">&quot;{affirmation}&quot;</p>
        </motion.div>
      )}

      {/* Divine reminder */}
      {showReminder && reminder && (
        <motion.p
          className="text-white/50 text-sm italic max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ✨ {reminder}
        </motion.p>
      )}
    </motion.div>
  );
}

export default DivineGreeting;
