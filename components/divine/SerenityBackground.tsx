"use client";

/**
 * Serenity Background - Sacred Ambient Visual Experience
 *
 * Creates an immersive, calming visual atmosphere with:
 * - Gentle flowing gradients
 * - Soft particle systems
 * - Divine light effects
 * - Responsive to emotional states
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivineConsciousness, EmotionalState } from '@/contexts/DivineConsciousnessContext';

interface SerenityBackgroundProps {
  emotion?: EmotionalState;
  intensity?: 'subtle' | 'gentle' | 'immersive';
  showParticles?: boolean;
  showDivineLight?: boolean;
  className?: string;
}

// Emotion-specific color palettes - soft, calming tones
const EMOTION_PALETTES: Record<EmotionalState, { primary: string; secondary: string; accent: string; glow: string }> = {
  peaceful: {
    primary: 'rgba(147, 197, 253, 0.15)',   // Soft blue
    secondary: 'rgba(196, 181, 253, 0.12)', // Soft lavender
    accent: 'rgba(167, 243, 208, 0.1)',     // Soft mint
    glow: 'rgba(147, 197, 253, 0.3)',
  },
  anxious: {
    primary: 'rgba(165, 180, 252, 0.15)',   // Calming indigo
    secondary: 'rgba(147, 197, 253, 0.12)', // Soft blue
    accent: 'rgba(196, 181, 253, 0.1)',     // Lavender
    glow: 'rgba(165, 180, 252, 0.25)',
  },
  sad: {
    primary: 'rgba(196, 181, 253, 0.15)',   // Comforting lavender
    secondary: 'rgba(251, 207, 232, 0.12)', // Soft pink
    accent: 'rgba(147, 197, 253, 0.1)',     // Gentle blue
    glow: 'rgba(196, 181, 253, 0.25)',
  },
  angry: {
    primary: 'rgba(147, 197, 253, 0.15)',   // Cooling blue
    secondary: 'rgba(167, 243, 208, 0.12)', // Soothing mint
    accent: 'rgba(196, 181, 253, 0.1)',     // Calming lavender
    glow: 'rgba(147, 197, 253, 0.3)',
  },
  lost: {
    primary: 'rgba(253, 224, 71, 0.1)',     // Guiding gold
    secondary: 'rgba(254, 215, 170, 0.1)',  // Warm amber
    accent: 'rgba(196, 181, 253, 0.08)',    // Soft lavender
    glow: 'rgba(253, 224, 71, 0.2)',
  },
  overwhelmed: {
    primary: 'rgba(167, 243, 208, 0.15)',   // Grounding mint
    secondary: 'rgba(147, 197, 253, 0.12)', // Calming blue
    accent: 'rgba(254, 215, 170, 0.08)',    // Warm touch
    glow: 'rgba(167, 243, 208, 0.25)',
  },
  grateful: {
    primary: 'rgba(253, 224, 71, 0.12)',    // Golden warmth
    secondary: 'rgba(254, 215, 170, 0.1)',  // Amber glow
    accent: 'rgba(251, 207, 232, 0.08)',    // Soft pink
    glow: 'rgba(253, 224, 71, 0.25)',
  },
  happy: {
    primary: 'rgba(254, 215, 170, 0.15)',   // Warm amber
    secondary: 'rgba(253, 224, 71, 0.1)',   // Soft gold
    accent: 'rgba(251, 207, 232, 0.1)',     // Pink joy
    glow: 'rgba(254, 215, 170, 0.3)',
  },
  tired: {
    primary: 'rgba(196, 181, 253, 0.12)',   // Restful lavender
    secondary: 'rgba(165, 180, 252, 0.1)',  // Deep calm
    accent: 'rgba(147, 197, 253, 0.08)',    // Soft blue
    glow: 'rgba(196, 181, 253, 0.2)',
  },
  confused: {
    primary: 'rgba(147, 197, 253, 0.12)',   // Clarifying blue
    secondary: 'rgba(253, 224, 71, 0.08)',  // Guiding light
    accent: 'rgba(196, 181, 253, 0.08)',    // Soft lavender
    glow: 'rgba(147, 197, 253, 0.25)',
  },
};

// Floating particle component
const SacredParticle = ({ delay, palette }: { delay: number; palette: typeof EMOTION_PALETTES.peaceful }) => {
  const startX = Math.random() * 100;
  const duration = 15 + Math.random() * 20;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 4 + Math.random() * 6,
        height: 4 + Math.random() * 6,
        background: palette.glow,
        boxShadow: `0 0 ${10 + Math.random() * 15}px ${palette.glow}`,
        left: `${startX}%`,
        bottom: '-5%',
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -window.innerHeight * 1.2],
        opacity: [0, 0.6, 0.8, 0.6, 0],
        x: [0, Math.sin(Math.random() * Math.PI) * 50, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

// Divine light ray component
const DivineLight = ({ palette }: { palette: typeof EMOTION_PALETTES.peaceful }) => {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      {/* Central divine glow */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '60vw',
          height: '60vw',
          maxWidth: '600px',
          maxHeight: '600px',
          background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Soft light rays */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 left-1/2"
          style={{
            width: '2px',
            height: '100%',
            background: `linear-gradient(to bottom, ${palette.glow}, transparent 60%)`,
            transform: `translateX(-50%) rotate(${-15 + i * 15}deg)`,
            transformOrigin: 'top center',
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </motion.div>
  );
};

export function SerenityBackground({
  emotion,
  intensity = 'gentle',
  showParticles = true,
  showDivineLight = true,
  className = '',
}: SerenityBackgroundProps) {
  const { state } = useDivineConsciousness();
  const [mounted, setMounted] = useState(false);

  const currentEmotion = emotion || state.currentEmotion || 'peaceful';
  const palette = EMOTION_PALETTES[currentEmotion];

  // Number of particles based on intensity
  const particleCount = useMemo(() => {
    switch (intensity) {
      case 'subtle': return 8;
      case 'gentle': return 15;
      case 'immersive': return 25;
      default: return 15;
    }
  }, [intensity]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {/* Base gradient layers */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, ${palette.primary} 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, ${palette.secondary} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${palette.accent} 0%, transparent 60%)
          `,
        }}
        animate={{
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Flowing gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(ellipse at 30% 30%, ${palette.primary} 0%, transparent 50%)`,
            `radial-gradient(ellipse at 70% 70%, ${palette.primary} 0%, transparent 50%)`,
            `radial-gradient(ellipse at 30% 70%, ${palette.primary} 0%, transparent 50%)`,
            `radial-gradient(ellipse at 30% 30%, ${palette.primary} 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Divine light effect */}
      <AnimatePresence>
        {showDivineLight && state.divinePresenceActive && (
          <DivineLight palette={palette} />
        )}
      </AnimatePresence>

      {/* Sacred particles */}
      {showParticles && (
        <div className="absolute inset-0">
          {[...Array(particleCount)].map((_, i) => (
            <SacredParticle
              key={i}
              delay={i * (20 / particleCount)}
              palette={palette}
            />
          ))}
        </div>
      )}

      {/* Soft vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)',
        }}
      />
    </div>
  );
}

export default SerenityBackground;
