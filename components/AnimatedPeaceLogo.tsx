'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * Animated Interactive Logo for Inner Peace
 * 
 * Features:
 * - Lotus flower design symbolizing inner peace
 * - Breathing animation effect
 * - Glow effects on hover
 * - Click interaction with ripple effect
 * - Zen-like subtle animations
 */

export function AnimatedPeaceLogo() {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1000);
  };

  return (
    <div className="relative inline-block">
      {/* Ripple effect on click */}
      {isClicked && (
        <motion.div
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-pink-400"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}

      <motion.div
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative cursor-pointer"
      >
        {/* Breathing glow effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-rose-300 blur-xl"
        />

        {/* Main SVG Logo */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Outer circle (zen circle) */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />

          {/* Lotus petals */}
          <g transform="translate(50, 50)">
            {/* Center circle (lotus center) */}
            <motion.circle
              cx="0"
              cy="0"
              r="8"
              fill="url(#gradient2)"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* 8 lotus petals arranged in a circle */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
              <motion.ellipse
                key={angle}
                cx="0"
                cy="-20"
                rx="8"
                ry="16"
                fill="url(#gradient3)"
                opacity="0.8"
                transform={`rotate(${angle})`}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.7, 0.9, 0.7],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.1,
                }}
              />
            ))}

            {/* Inner petals for depth */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, index) => (
              <motion.ellipse
                key={`inner-${angle}`}
                cx="0"
                cy="-14"
                rx="6"
                ry="12"
                fill="url(#gradient4)"
                opacity="0.6"
                transform={`rotate(${angle})`}
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.15 + 0.5,
                }}
              />
            ))}

            {/* Om symbol in center
                Path structure: Main upper curve + inner dot details + vertical stem + bottom curve
                Note: Uses (0,0) centered coordinates due to parent g transform="translate(50, 50)" */}
            <motion.path
              d="M0 -5 Q-2 -7 -4 -6 Q-6 -5 -6 -3 Q-6 -1 -4 0 Q-2 1 0 0 Q2 1 4 0 Q6 -1 6 -3 Q6 -5 4 -6 Q2 -7 0 -5 M-3 -2 Q-3 -1 -2 0 Q-1 1 0 1 Q1 1 2 0 Q3 -1 3 -2 M0 2 L0 7 M-2 7 Q-2 8 0 8 Q2 8 2 7"
              fill="#FFF"
              aria-label="Om symbol"
              role="img"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fb7185" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
            </linearGradient>

            <radialGradient id="gradient2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#fb7185" />
            </radialGradient>

            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#fda4af" />
            </linearGradient>

            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}

export default AnimatedPeaceLogo;
