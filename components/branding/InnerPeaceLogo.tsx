'use client';

import { motion, useReducedMotion, easeInOut, easeOut } from 'framer-motion';
import { useState } from 'react';

interface InnerPeaceLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Animated Inner Peace Logo Component
 * Features a breathing lotus flower with zen-like animations
 * Interactive on hover and click with calming effects
 */
export function InnerPeaceLogo({ 
  size = 80, 
  className = '',
  animated = true 
}: InnerPeaceLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const reduceMotion = useReducedMotion();
  const motionEnabled = animated && !reduceMotion;

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);
  };

  // Breathing animation - inhale and exhale cycle
  const breathingVariants = {
    initial: { scale: 1, opacity: 0.9 },
    animate: {
      scale: isClicked ? [1, 1.3, 1] : [1, 1.08, 1],
      opacity: [0.9, 1, 0.9],
    },
  };

  const breathingTransition = {
    duration: isClicked ? 2 : 4,
    repeat: isClicked ? 0 : Infinity,
    ease: easeInOut,
  };

  // Glow effect
  const glowVariants = {
    initial: { opacity: 0.3 },
    animate: {
      opacity: isHovered ? [0.6, 0.9, 0.6] : [0.3, 0.5, 0.3],
    },
  };

  const glowTransition = {
    duration: isHovered ? 2 : 3,
    repeat: Infinity,
    ease: easeInOut,
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileTap={motionEnabled ? { scale: 0.95 } : undefined}
      aria-label="Inner Peace - Click for calming breath"
      role="button"
      tabIndex={0}
    >
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0"
        variants={motionEnabled ? glowVariants : undefined}
        initial="initial"
        animate={motionEnabled ? 'animate' : undefined}
        transition={motionEnabled ? glowTransition : undefined}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0">
          <defs>
            <radialGradient id="peace-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#peace-glow)" />
        </svg>
      </motion.div>

      {/* Lotus flower with breathing animation */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="relative z-10"
        variants={motionEnabled ? breathingVariants : undefined}
        initial="initial"
        animate={motionEnabled ? 'animate' : undefined}
        transition={motionEnabled ? breathingTransition : undefined}
      >
        <defs>
          {/* Gradients for lotus petals */}
          <linearGradient id="petal-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="petal-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ddd6fe" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
          <linearGradient id="center-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          
          {/* Soft shadow */}
          <filter id="soft-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Bottom layer petals (5 petals) */}
        <g filter="url(#soft-shadow)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.ellipse
              key={`petal-outer-${i}`}
              cx="50"
              cy="50"
              rx="18"
              ry="28"
              fill="url(#petal-gradient-1)"
              opacity="0.9"
              transform={`rotate(${angle} 50 50) translate(0 -22)`}
              animate={motionEnabled ? {
                opacity: isHovered ? [0.9, 1, 0.9] : 0.9,
                transform: isHovered 
                  ? `rotate(${angle} 50 50) translate(0 -24)`
                  : `rotate(${angle} 50 50) translate(0 -22)`,
              } : undefined}
              transition={{ duration: 2, repeat: Infinity, ease: easeInOut }}
            />
          ))}
        </g>

        {/* Middle layer petals (5 petals, offset) */}
        <g filter="url(#soft-shadow)">
          {[36, 108, 180, 252, 324].map((angle, i) => (
            <motion.ellipse
              key={`petal-middle-${i}`}
              cx="50"
              cy="50"
              rx="16"
              ry="24"
              fill="url(#petal-gradient-2)"
              opacity="0.95"
              transform={`rotate(${angle} 50 50) translate(0 -18)`}
              animate={motionEnabled ? {
                opacity: isHovered ? [0.95, 1, 0.95] : 0.95,
                transform: isHovered 
                  ? `rotate(${angle} 50 50) translate(0 -20)`
                  : `rotate(${angle} 50 50) translate(0 -18)`,
              } : undefined}
              transition={{ duration: 2.5, repeat: Infinity, ease: easeInOut, delay: 0.2 }}
            />
          ))}
        </g>

        {/* Center circle with subtle pulse */}
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="url(#center-gradient)"
          animate={motionEnabled ? {
            r: isClicked ? [12, 16, 12] : [12, 13, 12],
          } : undefined}
          transition={{ duration: isClicked ? 2 : 3, repeat: Infinity, ease: easeInOut }}
        />

        {/* Inner highlight */}
        <circle
          cx="50"
          cy="46"
          r="6"
          fill="white"
          opacity="0.6"
        />

        {/* Om symbol in center - using path for better cross-platform support 
            Path structure: Main curve + inner details + vertical stem + bottom curve
            Note: Uses (50,50) centered coordinates in standard viewBox space */}
        <motion.path
          d="M50 45 Q48 43 46 44 Q44 45 44 47 Q44 49 46 50 Q48 51 50 50 Q52 51 54 50 Q56 49 56 47 Q56 45 54 44 Q52 43 50 45 M47 48 Q47 49 48 50 Q49 51 50 51 Q51 51 52 50 Q53 49 53 48 M50 52 L50 57 M48 57 Q48 58 50 58 Q52 58 52 57"
          fill="#92400e"
          opacity="0.7"
          aria-label="Om symbol"
          role="img"
          animate={motionEnabled ? {
            opacity: isClicked ? [0.7, 1, 0.7] : 0.7,
          } : undefined}
        />
      </motion.svg>

      {/* Ripple effect on click */}
      {isClicked && motionEnabled && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-sky-300"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.5, ease: easeOut }}
        />
      )}

      {/* Tooltip on hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/90 px-3 py-1 text-xs text-slate-100 shadow-lg backdrop-blur-sm"
        >
          Take a breath
        </motion.div>
      )}
    </motion.div>
  );
}

export default InnerPeaceLogo;
