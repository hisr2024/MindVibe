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
      {/* Outer glow rings - contained with overflow hidden */}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ isolation: 'isolate' }}
        variants={motionEnabled ? glowVariants : undefined}
        initial="initial"
        animate={motionEnabled ? 'animate' : undefined}
        transition={motionEnabled ? glowTransition : undefined}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0">
          <defs>
            <radialGradient id="peace-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#fb7185" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#peace-glow)" />
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
          {/* Gradients for lotus petals - Updated to pink/rose colors */}
          <linearGradient id="petal-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>
          <linearGradient id="petal-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#fb7185" />
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
          
          {/* Glow filter for Om symbol - contained to prevent overlap */}
          <filter id="om-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur"/>
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
              } : undefined}
              transition={{ duration: 2.5, repeat: Infinity, ease: easeInOut, delay: 0.2 }}
            />
          ))}
        </g>

        {/* Center circle with subtle pulse - base layer */}
        <motion.circle
          cx="50"
          cy="50"
          r="14"
          fill="url(#center-gradient)"
          animate={motionEnabled ? {
            r: isClicked ? [14, 17, 14] : [14, 15, 14],
          } : undefined}
          transition={{ duration: isClicked ? 2 : 3, repeat: Infinity, ease: easeInOut }}
        />

        {/* Inner highlight - positioned above center */}
        <circle
          cx="50"
          cy="45"
          r="7"
          fill="white"
          opacity="0.5"
        />

        {/* Om symbol (ॐ) in center - Properly contained and scaled
            Positioned with isolation to prevent overlap */}
        <g style={{ isolation: 'isolate' }}>
          <motion.g
            animate={motionEnabled ? {
              opacity: isClicked ? [1, 1, 1] : [0.9, 1, 0.9],
              scale: isClicked ? [1, 1.1, 1] : [1, 1.02, 1],
            } : undefined}
            transition={motionEnabled ? {
              duration: isClicked ? 1.5 : 3.5,
              repeat: Infinity,
              ease: easeInOut,
            } : undefined}
            style={{ transformOrigin: '50px 50px' }}
            aria-label="Om symbol"
            role="img"
            filter="url(#om-glow)"
          >
            {/* Main "3" shape - scaled and centered properly */}
            <path
              d="M44 49.5 Q44 45 47.5 44.5 Q51 44 52.5 46.5 Q54 48.5 54 51 Q54 53.5 52 55 Q50 56 47.5 55 L47.5 53.5 Q49.5 54.5 51 53.5 Q52 52.5 52 51 Q52 49 50.5 47.5 Q49 46.5 47.5 46.5 Q45 46.5 45 49.5 L45 51"
              fill="#92400e"
              stroke="#7c2d12"
              strokeWidth="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Top curve (horizontal line with curve) */}
            <path
              d="M47 43.5 Q49.5 42 51.5 43.5 Q52.5 44 52.5 45"
              fill="none"
              stroke="#92400e"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Chandrabindu (dot above) - signature element */}
            <circle cx="50" cy="41" r="1.2" fill="#92400e" stroke="#7c2d12" strokeWidth="0.2" />

            {/* Right side extended curve - adjusted */}
            <path
              d="M54 49 Q55.5 49 56.5 50.5 Q57 52 57 53.5 Q57 55 55.5 56 Q54 56.5 52.5 56"
              fill="none"
              stroke="#92400e"
              strokeWidth="0.8"
              strokeLinecap="round"
            />

            {/* Bottom left decorative curve - adjusted */}
            <path
              d="M44 52 Q42.5 53 42.5 55 Q42.5 56.5 44 57.5 Q45.5 58 47 57.5"
              fill="none"
              stroke="#92400e"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </motion.g>
        </g>
      </motion.svg>

      {/* Ripple effect on click - contained */}
      {isClicked && motionEnabled && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-pink-300 pointer-events-none"
          style={{ zIndex: -1 }}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.2, ease: easeOut }}
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
