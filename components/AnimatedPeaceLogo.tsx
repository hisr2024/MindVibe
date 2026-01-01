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

            {/* Om symbol (ॐ) in center - Enhanced authentic Devanagari design
                Larger and more visible in the lotus center
                Uses (0,0) centered coordinates due to parent g transform="translate(50, 50)" */}
            <motion.g
              animate={{
                opacity: [0.9, 1, 0.9],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              aria-label="Om symbol"
              role="img"
            >
              {/* Outer glow for better visibility */}
              <g opacity="0.6" filter="url(#om-glow)">
                <path
                  d="M-8 0 Q-8 -6 -3 -7 Q1 -8 4 -5 Q6 -3 6 0 Q6 3 4 5 Q1 7 -3 6 Q-5 5 -6 3"
                  fill="#fda4af"
                  stroke="none"
                />
              </g>
              
              {/* Main "3" shape - the characteristic curve of Om */}
              <path
                d="M-7 -1 Q-7 -6 -2 -6.5 Q2 -7 4 -4 Q5.5 -2 5.5 1 Q5.5 4 3 5.5 Q0.5 6.5 -2 5.5 L-2 4 Q0 5 2 4 Q3.5 3 3.5 1 Q3.5 -1 2 -2.5 Q0.5 -4 -2 -4 Q-5 -4 -5 -1 L-5 1"
                fill="#FFFFFF"
                stroke="#f9a8d4"
                strokeWidth="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Top curve (horizontal line with curve) */}
              <path
                d="M-3.5 -7.5 Q-1 -9 2 -7.5 Q3 -6.8 3 -5.8"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              
              {/* Chandrabindu (dot above) - signature element */}
              <circle cx="0" cy="-10.5" r="1.3" fill="#FFFFFF" stroke="#f9a8d4" strokeWidth="0.3" />
              
              {/* Right side extended curve */}
              <path
                d="M5.5 -2 Q7.5 -2 8.5 0 Q9 1.5 9 3 Q9 5 7 6 Q5 7 3 6"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeLinecap="round"
              />
              
              {/* Bottom left decorative curve */}
              <path
                d="M-5.5 2 Q-7.5 3 -7.5 5.5 Q-7.5 7.5 -6 8.5 Q-4.5 9 -2.5 8.5"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </motion.g>
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
            
            {/* Glow filter for Om symbol visibility */}
            <filter id="om-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
              <feColorMatrix type="saturate" values="2"/>
            </filter>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}

export default AnimatedPeaceLogo;
