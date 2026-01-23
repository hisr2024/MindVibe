'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

interface NamasteIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  showGlow?: boolean;
}

/**
 * Professionally Polished Namaste Icon Component
 * Features elegant gradient backgrounds, multi-layered glow effects,
 * and smooth breathing animations for a premium spiritual feel.
 */
export function NamasteIcon({
  size = 'lg',
  className = '',
  animated = true,
  showGlow = true,
}: NamasteIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const motionEnabled = animated && !reduceMotion;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-12 h-12',
      emoji: 'text-2xl',
      glow: 'blur-lg',
      outerRing: 'w-14 h-14',
    },
    md: {
      container: 'w-16 h-16',
      emoji: 'text-3xl',
      glow: 'blur-xl',
      outerRing: 'w-20 h-20',
    },
    lg: {
      container: 'w-20 h-20 sm:w-24 sm:h-24',
      emoji: 'text-4xl sm:text-5xl',
      glow: 'blur-2xl',
      outerRing: 'w-24 h-24 sm:w-28 sm:h-28',
    },
    xl: {
      container: 'w-28 h-28 sm:w-32 sm:h-32',
      emoji: 'text-5xl sm:text-6xl md:text-7xl',
      glow: 'blur-3xl',
      outerRing: 'w-32 h-32 sm:w-40 sm:h-40',
    },
  };

  const config = sizeConfig[size];

  // Breathing animation variants
  const breathingVariants = {
    initial: { scale: 1 },
    animate: {
      scale: isPressed ? [1, 1.15, 1] : [1, 1.05, 1],
    },
  };

  const breathingTransition = {
    duration: isPressed ? 1.5 : 4,
    repeat: isPressed ? 0 : Infinity,
    ease: 'easeInOut' as const,
  };

  // Glow pulse animation
  const glowVariants = {
    initial: { opacity: 0.4, scale: 1 },
    animate: {
      opacity: isHovered ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
      scale: isHovered ? [1, 1.1, 1] : [1, 1.05, 1],
    },
  };

  const glowTransition = {
    duration: isHovered ? 2 : 3.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  // Outer ring rotation
  const ringVariants = {
    initial: { rotate: 0, opacity: 0.2 },
    animate: {
      rotate: 360,
      opacity: isHovered ? [0.3, 0.5, 0.3] : [0.15, 0.25, 0.15],
    },
  };

  const ringTransition = {
    rotate: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear' as const,
    },
    opacity: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      whileTap={motionEnabled ? { scale: 0.95 } : undefined}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Outer decorative ring */}
      <motion.div
        className={`absolute ${config.outerRing} rounded-full`}
        style={{
          background: 'conic-gradient(from 0deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.3), rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.3))',
        }}
        variants={motionEnabled ? ringVariants : undefined}
        initial="initial"
        animate={motionEnabled ? 'animate' : undefined}
        transition={motionEnabled ? ringTransition : undefined}
      />

      {/* Multi-layered glow effects */}
      {showGlow && (
        <>
          {/* Outer ambient glow */}
          <motion.div
            className={`absolute ${config.container} rounded-full ${config.glow}`}
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.2) 40%, transparent 70%)',
            }}
            variants={motionEnabled ? glowVariants : undefined}
            initial="initial"
            animate={motionEnabled ? 'animate' : undefined}
            transition={motionEnabled ? { ...glowTransition, delay: 0.2 } : undefined}
          />

          {/* Inner warm glow */}
          <motion.div
            className={`absolute ${config.container} rounded-full blur-xl`}
            style={{
              background: 'radial-gradient(circle, rgba(253, 230, 138, 0.5) 0%, rgba(251, 191, 36, 0.3) 50%, transparent 70%)',
            }}
            variants={motionEnabled ? glowVariants : undefined}
            initial="initial"
            animate={motionEnabled ? 'animate' : undefined}
            transition={motionEnabled ? glowTransition : undefined}
          />
        </>
      )}

      {/* Main container with gradient background */}
      <motion.div
        className={`relative ${config.container} rounded-full flex items-center justify-center overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 45, 0.95) 0%, rgba(23, 20, 35, 0.98) 50%, rgba(15, 13, 25, 0.95) 100%)',
          boxShadow: isHovered
            ? '0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            : '0 0 20px rgba(251, 191, 36, 0.25), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.2)',
          transition: 'box-shadow 0.3s ease',
        }}
        variants={motionEnabled ? breathingVariants : undefined}
        initial="initial"
        animate={motionEnabled ? 'animate' : undefined}
        transition={motionEnabled ? breathingTransition : undefined}
      >
        {/* Inner gradient overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(253, 230, 138, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Subtle inner border glow */}
        <div
          className="absolute inset-[2px] rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, transparent 50%, rgba(245, 158, 11, 0.05) 100%)',
          }}
        />

        {/* Namaste emoji with subtle shadow */}
        <motion.span
          className={`relative ${config.emoji} select-none`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            transform: 'translateZ(0)',
          }}
          animate={
            motionEnabled
              ? {
                  y: isPressed ? [0, -3, 0] : [0, -2, 0],
                }
              : undefined
          }
          transition={{
            duration: isPressed ? 0.8 : 3,
            repeat: isPressed ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          🙏
        </motion.span>
      </motion.div>

      {/* Sparkle effects on hover */}
      {isHovered && motionEnabled && (
        <>
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-amber-300"
            style={{ top: '10%', right: '20%' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-yellow-200"
            style={{ bottom: '15%', left: '15%' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-orange-300"
            style={{ top: '25%', left: '10%' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: 0.6 }}
          />
        </>
      )}
    </motion.div>
  );
}

export default NamasteIcon;
