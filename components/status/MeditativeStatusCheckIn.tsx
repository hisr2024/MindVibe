'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EmotionIcon3D, type Emotion } from './EmotionIcon3D';
import { BreathingOrb } from '@/components/animations/BreathingOrb';

/**
 * Meditative Status Check-In - Full-Screen Immersive Experience
 * 
 * Features:
 * - Full-screen immersive experience
 * - Ambient wave background (3 layers)
 * - Grid of 8 emotion icons
 * - Intensity slider (1-10) appears when emotion selected
 * - Affirmations for each emotion
 * - "Breathe with me" button opens breathing exercise
 * - Staggered entrance animations
 */

const EMOTIONS: Emotion[] = [
  { id: 'joyful', label: 'Joyful', emoji: '😊', color: '#FFD700', energy: 'high' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🕊️', color: '#87CEEB', energy: 'low' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: '#FF7F39', energy: 'medium' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#9370DB', energy: 'high' },
  { id: 'sad', label: 'Heavy', emoji: '😢', color: '#4682B4', energy: 'low' },
  { id: 'energized', label: 'Energized', emoji: '⚡', color: '#FF6347', energy: 'high' },
  { id: 'calm', label: 'Centered', emoji: '🧘', color: '#98FB98', energy: 'low' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌅', color: '#FFA07A', energy: 'medium' },
];

const AFFIRMATIONS: Record<string, string> = {
  joyful: 'Embrace this beautiful energy ✨',
  peaceful: 'Rest in this calm moment 🌊',
  grateful: 'Your gratitude radiates light 🌟',
  anxious: 'Breathe... You are safe here 🌬️',
  sad: "This feeling is valid. You're not alone 💙",
  energized: 'Channel this power wisely 🔥',
  calm: 'Stay rooted in this balance 🌿',
  hopeful: 'Your hope lights the path forward 🌄',
};

export function MeditativeStatusCheckIn() {
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [showBreathing, setShowBreathing] = useState(false);

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
  };

  const handleSubmit = () => {
    if (selectedEmotion) {
      // Handle submission - could save to local storage or backend
      console.log('Emotion check-in:', { emotion: selectedEmotion.id, intensity });
      // Show success message or navigate
      alert(`Check-in saved: ${selectedEmotion.label} at intensity ${intensity}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Ambient wave background */}
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(255, 115, 39, 0.05), transparent)`,
              width: '80%',
              height: '80%',
              left: '10%',
              top: '10%',
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: ['-10%', '10%', '-10%'],
              y: ['-10%', '10%', '-10%'],
            }}
            transition={{
              duration: 15 + index * 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-light text-orange-50 md:text-5xl">
            How are you feeling?
          </h1>
          <p className="text-lg text-orange-100/70">
            Take a moment to check in with yourself
          </p>
        </motion.div>

        {/* Emotion grid */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {EMOTIONS.map((emotion, index) => (
            <motion.div
              key={emotion.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <EmotionIcon3D
                emotion={emotion}
                intensity={intensity}
                selected={selectedEmotion?.id === emotion.id}
                hovered={hoveredEmotion === emotion.id}
                onClick={() => handleEmotionSelect(emotion)}
                onHover={(hovered) => setHoveredEmotion(hovered ? emotion.id : null)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Affirmation and controls */}
        {selectedEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Affirmation */}
            <div className="text-center">
              <motion.p
                key={selectedEmotion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-light text-orange-50"
              >
                {AFFIRMATIONS[selectedEmotion.id]}
              </motion.p>
            </div>

            {/* Intensity slider */}
            <div className="mx-auto max-w-md space-y-3">
              <label className="block text-center text-sm text-orange-100/80">
                How intense is this feeling? ({intensity}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full"
                style={{
                  accentColor: selectedEmotion.color,
                }}
              />
              <div className="flex justify-between text-xs text-orange-100/60">
                <span>Subtle</span>
                <span>Overwhelming</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowBreathing(true)}
                className="rounded-xl border border-orange-500/30 bg-white/5 px-6 py-3 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10"
              >
                🌬️ Breathe with me
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
              >
                Save Check-In
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty state hint */}
        {!selectedEmotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm text-orange-100/50"
          >
            Select an emotion to continue
          </motion.div>
        )}
      </div>

      {/* Breathing exercise modal */}
      <BreathingOrb
        isOpen={showBreathing}
        onClose={() => setShowBreathing(false)}
        color={selectedEmotion?.color || '#FF7327'}
      />
    </div>
  );
}

export default MeditativeStatusCheckIn;
