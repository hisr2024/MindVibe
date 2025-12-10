'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

/**
 * Enhanced Minimal Mood Check-In Component
 * Beautiful animations, glassmorphism, and KIAAN integration
 */
export function MinimalMoodCheckIn() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Compact mood stones with enhanced visuals
  const moodStones = [
    { 
      label: 'Peaceful', 
      emoji: '🙏', 
      color: 'from-emerald-400 to-teal-400', 
      response: 'Beautiful calm. Stay with it. 💙',
      glowColor: 'rgba(52, 211, 153, 0.4)'
    },
    { 
      label: 'Happy', 
      emoji: '😊', 
      color: 'from-yellow-400 to-amber-400', 
      response: 'Let that warmth stay with you. ✨',
      glowColor: 'rgba(251, 191, 36, 0.4)'
    },
    { 
      label: 'Neutral', 
      emoji: '😐', 
      color: 'from-slate-400 to-gray-400', 
      response: 'Steady is good. You\'re showing up. 🌿',
      glowColor: 'rgba(148, 163, 184, 0.4)'
    },
    { 
      label: 'Tired', 
      emoji: '😴', 
      color: 'from-blue-400 to-indigo-400', 
      response: 'Rest is not weakness. 💙',
      glowColor: 'rgba(96, 165, 250, 0.4)'
    },
    { 
      label: 'Anxious', 
      emoji: '😰', 
      color: 'from-amber-400 to-orange-400', 
      response: 'Take a breath. I\'m with you. 🌊',
      glowColor: 'rgba(251, 146, 60, 0.4)'
    },
    { 
      label: 'Heavy', 
      emoji: '🌧️', 
      color: 'from-slate-500 to-gray-500', 
      response: 'You\'re not alone. I\'m here. 💙',
      glowColor: 'rgba(100, 116, 139, 0.4)'
    },
  ];

  const handleMoodSelect = async (mood: typeof moodStones[0]) => {
    setSelectedMood(mood.label);
    setShowResponse(true);

    // Save to localStorage for tracking
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('mood_check_ins');
        const checkIns = existing ? JSON.parse(existing) : [];
        checkIns.push({
          mood: mood.label,
          emoji: mood.emoji,
          timestamp: new Date().toISOString(),
        });
        // Keep only last 50 check-ins
        const trimmed = checkIns.slice(-50);
        localStorage.setItem('mood_check_ins', JSON.stringify(trimmed));
      } catch {
        // Ignore storage errors
      }
    }

    // Show response for 3 seconds, then navigate to KIAAN Chat with mood context
    setTimeout(() => {
      setIsNavigating(true);
      // Navigate to KIAAN Chat with mood context
      const moodPrompt = encodeURIComponent(`I'm feeling ${mood.label.toLowerCase()} right now.`);
      router.push(`/kiaan/chat?mood=${mood.label.toLowerCase()}&message=${moodPrompt}`);
    }, 3000);
  };

  const selectedMoodData = moodStones.find(m => m.label === selectedMood);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-slate-900/40 via-slate-900/30 to-slate-900/40 backdrop-blur-xl p-5 shadow-[0_16px_70px_rgba(255,115,39,0.12)]"
    >
      <div className="text-center">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs uppercase tracking-wider text-orange-100/70"
        >
          Quick Check-In
        </motion.p>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-xl font-semibold text-orange-50"
        >
          How are you feeling?
        </motion.h3>
      </div>

      {/* Stone Grid - Compact Layout with Staggered Animation */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {moodStones.map((mood, index) => {
          const isSelected = selectedMood === mood.label;
          return (
            <motion.button
              key={mood.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: index * 0.1,
                type: 'spring',
                stiffness: 260,
                damping: 20
              }}
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.4 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !isNavigating && handleMoodSelect(mood)}
              disabled={isNavigating}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                isSelected 
                  ? 'scale-105 shadow-2xl ring-2 ring-orange-400/60' 
                  : 'hover:shadow-xl'
              }`}
              aria-label={`Select ${mood.label} mood`}
              style={{
                boxShadow: isSelected ? `0 20px 60px ${mood.glowColor}` : undefined
              }}
            >
              {/* Glassmorphism Stone background */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-80`}
                animate={isSelected ? { opacity: 1 } : { opacity: 0.8 }}
              />
              
              {/* Animated shine overlay */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent"
                animate={!isSelected ? {
                  opacity: [0.3, 0.5, 0.3],
                  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                } : { opacity: 0.5 }}
              />
              
              {/* Texture overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
              
              {/* Stone border with shimmer */}
              <div className="absolute inset-0 rounded-2xl border border-white/30" />

              {/* Ripple effect on tap */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-white"
                  initial={{ opacity: 0.6, scale: 0 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.6 }}
                />
              )}

              {/* Content */}
              <div className="relative flex flex-col items-center gap-2">
                <motion.span 
                  className="text-2xl sm:text-3xl" 
                  role="img" 
                  aria-label={mood.label}
                  animate={isSelected ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                    transition: { duration: 0.5 }
                  } : {}}
                >
                  {mood.emoji}
                </motion.span>
                <span className="text-[10px] font-semibold text-white drop-shadow-lg sm:text-xs">
                  {mood.label}
                </span>
              </div>

              {/* Selection indicator with pulse */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -right-1 -top-1"
                  >
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      <motion.div
                        className="absolute h-5 w-5 rounded-full bg-orange-400"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 shadow-lg">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* KIAAN Micro-Response with smooth animation */}
      <AnimatePresence>
        {showResponse && selectedMoodData && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-amber-300/10 backdrop-blur-sm p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 360] }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 text-sm font-bold text-slate-900 shadow-lg"
              >
                K
              </motion.div>
              <div className="flex-1">
                <p className="mb-1 text-xs text-orange-100/70">KIAAN</p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm leading-relaxed text-orange-50"
                >
                  {selectedMoodData.response}
                </motion.p>
                {isNavigating && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-orange-200/80"
                  >
                    Opening KIAAN Chat...
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <p className="text-xs text-orange-100/60">
          Tap a stone to log your mood • Takes you to KIAAN Chat for support
        </p>
      </motion.div>
    </motion.section>
  );
}
