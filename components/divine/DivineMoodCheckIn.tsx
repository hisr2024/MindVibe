"use client";

/**
 * Divine Mood Check-In - Sacred Emotional State Assessment
 *
 * A beautiful, calming mood check-in experience that:
 * - Invites users to connect with their feelings
 * - Provides sacred feedback for each mood level
 * - Offers divine comfort and practices
 * - Creates a sense of being seen and held
 *
 * FIXES APPLIED:
 * - Memoized mood bar components to prevent excessive re-renders
 * - Added error boundary for context access
 * - Optimized animation transitions
 * - Added will-change hints for GPU acceleration
 * - Fixed rendering issues causing site jam
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness, EmotionalState } from '@/contexts/DivineConsciousnessContext';

// Pre-calculate mood score colors and heights to prevent recalculation
const MOOD_SCORE_CONFIG = [
  { score: 1, height: 24, colors: 'from-purple-500/60 to-blue-400/60' },
  { score: 2, height: 32, colors: 'from-purple-500/60 to-blue-400/60' },
  { score: 3, height: 40, colors: 'from-purple-500/60 to-blue-400/60' },
  { score: 4, height: 48, colors: 'from-blue-400/60 to-teal-400/60' },
  { score: 5, height: 56, colors: 'from-blue-400/60 to-teal-400/60' },
  { score: 6, height: 64, colors: 'from-blue-400/60 to-teal-400/60' },
  { score: 7, height: 72, colors: 'from-amber-400/60 to-yellow-300/60' },
  { score: 8, height: 80, colors: 'from-amber-400/60 to-yellow-300/60' },
  { score: 9, height: 88, colors: 'from-amber-400/60 to-yellow-300/60' },
  { score: 10, height: 96, colors: 'from-amber-400/60 to-yellow-300/60' },
];

// Memoized mood bar component
const MoodBar = memo(({
  config,
  isSelected,
  onClick
}: {
  config: typeof MOOD_SCORE_CONFIG[number];
  isSelected: boolean;
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center transition-all duration-200 ${
      isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'
    }`}
    style={{ transform: 'translateZ(0)' }}
    aria-label={`Select mood level ${config.score}`}
  >
    <div
      className={`w-6 sm:w-8 rounded-t-full bg-gradient-to-t ${config.colors} transition-all duration-200`}
      style={{
        height: `${config.height}px`,
        willChange: isSelected ? 'transform' : 'auto'
      }}
    />
    <span className="mt-2 text-xs text-white/60">{config.score}</span>
  </button>
));
MoodBar.displayName = 'MoodBar';

interface DivineMoodCheckInProps {
  onMoodSubmit?: (mood: { score: number; emotion: EmotionalState | null; response: SacredMoodResponse }) => void;
  showPractice?: boolean;
  showAffirmation?: boolean;
  compact?: boolean;
  className?: string;
}

interface SacredMoodResponse {
  response: string;
  divineMessage: string;
  practice: string;
  affirmation: string;
}

// Sacred mood responses for each level (1-10)
const SACRED_MOOD_RESPONSES: Record<number, SacredMoodResponse> = {
  1: {
    response: "I see you in this darkness, and I hold you with infinite tenderness. This pain is real, and you don't have to carry it alone. 💙",
    divineMessage: "Even in the deepest night, the divine light within you never goes out. It waits, patient and eternal.",
    practice: "Place your hand on your heart. Breathe. Whisper: 'I am held. I am loved. This too shall pass.'",
    affirmation: "I am worthy of compassion, especially in my darkest moments.",
  },
  2: {
    response: "This heaviness is hard to carry. I'm here with you, not trying to fix anything. Just being here. 💙",
    divineMessage: "The sacred meets you exactly where you are. There is no place too dark for grace to find you.",
    practice: "Breathe in for 4... hold for 4... out for 8. Let each exhale carry away a little of the weight.",
    affirmation: "I allow myself to feel without judgment. My feelings are valid.",
  },
  3: {
    response: "I sense the struggle within you. Whatever you're moving through, you're showing courage by being present with it. 💙",
    divineMessage: "Every challenge is the universe inviting you to grow. You are being shaped by sacred hands.",
    practice: "Close your eyes. Find one thing, however small, that brings a flicker of peace. Rest your attention there.",
    affirmation: "I am stronger than I know. Peace finds me even in difficulty.",
  },
  4: {
    response: "There's a quietness to your energy today. That's okay. Sometimes we need to walk slowly through the valley. 💙",
    divineMessage: "The divine never rushes. In slowness, you are aligned with sacred timing.",
    practice: "Step outside if you can. Feel the air on your skin. Remember: you are part of something vast.",
    affirmation: "I trust the rhythm of my own healing.",
  },
  5: {
    response: "A quiet steadiness today. You're here, you're present, you're showing up. That matters more than you know. 💙",
    divineMessage: "In the middle place, wisdom speaks. Listen to what stillness wants to teach you today.",
    practice: "Take three conscious breaths. With each one, silently say: 'Here. Now. Peace.'",
    affirmation: "I am at peace with where I am. This moment is enough.",
  },
  6: {
    response: "There's a gentle balance in your being today. A readiness for what comes next. 💙",
    divineMessage: "From this centered place, you can move in any direction the soul calls you.",
    practice: "Set one small intention for today. Hold it lightly, like a feather in your palm.",
    affirmation: "I am centered. I move through life with grace.",
  },
  7: {
    response: "A warmth is building within you. Let yourself receive this goodness - you deserve it. 💙",
    divineMessage: "Joy is the language of the soul. When you feel good, the divine smiles through you.",
    practice: "Pause and savor this feeling. Let it sink into your cells. This is what you're here for.",
    affirmation: "I welcome joy. I am worthy of feeling good.",
  },
  8: {
    response: "There's a brightness in your energy today - like sunlight breaking through clouds. Beautiful. 💙",
    divineMessage: "You are aligned with your true nature. This peace, this joy - this is who you really are.",
    practice: "Share a kind word with someone today. Let your light touch another soul.",
    affirmation: "My joy blesses everyone I meet.",
  },
  9: {
    response: "Such radiance flows through you! This is the soul shining through. Bask in this beautiful energy. 💙",
    divineMessage: "In moments like these, you glimpse your eternal nature - boundless, peaceful, whole.",
    practice: "Breathe this feeling into your heart. Store it as a treasure you can always return to.",
    affirmation: "I am connected to infinite peace and joy.",
  },
  10: {
    response: "You are glowing with the light of true peace. This is sacred. This is you, remembering who you really are. 💙",
    divineMessage: "This feeling of wholeness is not temporary - it is your true nature revealed.",
    practice: "Sit in silence for a moment. Send this peace out as a blessing for all beings.",
    affirmation: "I am peace itself. I am love itself. I am whole.",
  },
};

// Emotion options with icons
const EMOTIONS: { value: EmotionalState; label: string; icon: string }[] = [
  { value: 'peaceful', label: 'Peaceful', icon: '🕊️' },
  { value: 'grateful', label: 'Grateful', icon: '🙏' },
  { value: 'happy', label: 'Happy', icon: '☀️' },
  { value: 'anxious', label: 'Anxious', icon: '🌊' },
  { value: 'sad', label: 'Sad', icon: '🌧️' },
  { value: 'tired', label: 'Tired', icon: '🌙' },
  { value: 'overwhelmed', label: 'Overwhelmed', icon: '🌪️' },
  { value: 'confused', label: 'Confused', icon: '🌫️' },
  { value: 'angry', label: 'Frustrated', icon: '🔥' },
  { value: 'lost', label: 'Lost', icon: '🧭' },
];

export function DivineMoodCheckIn({
  onMoodSubmit,
  showPractice = true,
  showAffirmation = true,
  compact = false,
  className = '',
}: DivineMoodCheckInProps) {
  // Safe context access with error handling
  let contextActions: ReturnType<typeof useDivineConsciousness>['actions'] | null = null;
  let contextError = false;

  try {
    const context = useDivineConsciousness();
    contextActions = context.actions;
  } catch {
    contextError = true;
  }

  const [step, setStep] = useState<'mood' | 'emotion' | 'response'>('mood');
  const [moodScore, setMoodScore] = useState<number>(5);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | null>(null);
  const [response, setResponse] = useState<SacredMoodResponse | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Ensure component is mounted before showing animations
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Memoized handlers to prevent recreation on every render
  const handleMoodSelect = useCallback((score: number) => {
    // Use requestAnimationFrame to prevent UI blocking
    requestAnimationFrame(() => {
      setMoodScore(score);
      if (compact) {
        const sacredResponse = SACRED_MOOD_RESPONSES[score];
        setResponse(sacredResponse);
        setStep('response');
        onMoodSubmit?.({ score, emotion: null, response: sacredResponse });
      } else {
        setStep('emotion');
      }
    });
  }, [compact, onMoodSubmit]);

  const handleEmotionSelect = useCallback((emotion: EmotionalState) => {
    requestAnimationFrame(() => {
      setSelectedEmotion(emotion);
      const sacredResponse = SACRED_MOOD_RESPONSES[moodScore];
      setResponse(sacredResponse);
      setStep('response');
      if (contextActions && !contextError) {
        contextActions.setEmotion(emotion);
      }
      onMoodSubmit?.({ score: moodScore, emotion, response: sacredResponse });
    });
  }, [moodScore, contextActions, contextError, onMoodSubmit]);

  const handleReset = useCallback(() => {
    setStep('mood');
    setMoodScore(5);
    setSelectedEmotion(null);
    setResponse(null);
  }, []);

  // Memoize greeting to prevent recalculation
  const greeting = useMemo(() => {
    if (contextActions && !contextError) {
      return contextActions.getTimeAppropriateGreeting();
    }
    // Fallback greeting based on time
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "As the morning unfolds, let your heart open...";
    if (hour >= 12 && hour < 17) return "In the fullness of the day, find your center...";
    if (hour >= 17 && hour < 21) return "As the day softens, let your heart soften too...";
    return "In the quiet of night, surrender to stillness...";
  }, [contextActions, contextError]);

  // Memoize serenity moment
  const serenityMoment = useMemo(() => {
    if (contextActions && !contextError) {
      return contextActions.getSerenityMoment();
    }
    return "🕊️ *Peace settles like soft snow...*";
  }, [contextActions, contextError]);

  // Show loading state until ready
  if (!isReady) {
    return (
      <div className={`w-full max-w-lg mx-auto ${className}`}>
        <div className="text-center py-4">
          <div className="text-white/40 text-sm">Preparing sacred space...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto ${className}`}>
      <AnimatePresence mode="wait">
        {/* Step 1: Mood Score */}
        {step === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            {/* Sacred opening */}
            <motion.p
              className="text-white/60 text-sm mb-2 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              *Take a gentle breath...*
            </motion.p>

            <motion.p
              className="text-white/80 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {greeting}
            </motion.p>

            <h3 className="text-xl font-light text-white/90 mb-6">
              How does your heart feel right now?
            </h3>

            {/* Mood slider visualization - optimized with memoized bars */}
            <div className="relative mb-6 sm:mb-8 flex flex-col items-center">
              <div className="flex justify-center items-end h-28 gap-2 sm:gap-3 w-full max-w-md mx-auto">
                {MOOD_SCORE_CONFIG.map((config) => (
                  <MoodBar
                    key={config.score}
                    config={config}
                    isSelected={moodScore === config.score}
                    onClick={() => handleMoodSelect(config.score)}
                  />
                ))}
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-3 w-full max-w-md mx-auto px-2">
                <span className="text-[10px] sm:text-xs text-white/40">Struggling</span>
                <span className="text-[10px] sm:text-xs text-white/40">Steady</span>
                <span className="text-[10px] sm:text-xs text-white/40">Radiant</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Emotion Selection */}
        {step === 'emotion' && (
          <motion.div
            key="emotion"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            <h3 className="text-lg sm:text-xl font-light text-white/90 mb-2">
              What best describes this feeling?
            </h3>
            <p className="text-white/50 text-xs sm:text-sm mb-5 sm:mb-6">
              Select the emotion closest to your experience
            </p>

            {/* Responsive grid - 5 cols on desktop, 3 on mobile */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
              {EMOTIONS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => handleEmotionSelect(value)}
                  className={`flex flex-col items-center p-2.5 sm:p-3 rounded-xl transition-all duration-200 active:scale-95 ${
                    selectedEmotion === value
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                  style={{ transform: 'translateZ(0)' }}
                >
                  <span className="text-xl sm:text-2xl mb-1">{icon}</span>
                  <span className="text-[10px] sm:text-xs text-white/70">{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('mood')}
              className="mt-5 sm:mt-6 text-white/40 hover:text-white/60 text-sm transition-colors px-4 py-2"
            >
              ← Back
            </button>
          </motion.div>
        )}

        {/* Step 3: Sacred Response */}
        {step === 'response' && response && (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            {/* Serenity moment - using memoized value */}
            <motion.p
              className="text-xl sm:text-2xl mb-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {serenityMoment}
            </motion.p>

            {/* Main response */}
            <motion.p
              className="text-lg text-white/90 mb-6 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {response.response}
            </motion.p>

            {/* Divine message */}
            <motion.p
              className="text-white/60 italic mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              *{response.divineMessage}*
            </motion.p>

            {/* Sacred practice */}
            {showPractice && (
              <motion.div
                className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-sm text-white/50 mb-2">🙏 Sacred Practice</p>
                <p className="text-white/80 text-sm">{response.practice}</p>
              </motion.div>
            )}

            {/* Affirmation */}
            {showAffirmation && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <p className="text-sm text-white/50 mb-1">✨ Affirmation</p>
                <p className="text-white/80 italic">&quot;{response.affirmation}&quot;</p>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              className="flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/80 text-sm transition-all"
              >
                Check In Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DivineMoodCheckIn;
