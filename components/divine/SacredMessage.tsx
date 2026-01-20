"use client";

/**
 * Sacred Message Component - Divine KIAAN Chat Messages
 *
 * Transforms chat messages into sacred experiences with:
 * - Gentle animations
 * - Divine presence indicators
 * - Sacred formatting
 * - Breathing pauses
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SacredMessageProps {
  message: string;
  isKiaan?: boolean;
  showDivineIndicator?: boolean;
  animateIn?: boolean;
  className?: string;
}

export function SacredMessage({
  message,
  isKiaan = true,
  showDivineIndicator = true,
  animateIn = true,
  className = '',
}: SacredMessageProps) {
  // Parse message for sacred formatting
  const formatMessage = (text: string) => {
    // Convert *text* to italics (sacred pauses)
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={index} className="block my-4 text-white/60 italic text-center">
            {part.slice(1, -1)}
          </span>
        );
      }
      // Handle line breaks
      return part.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial={animateIn ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Divine presence indicator */}
      {isKiaan && showDivineIndicator && (
        <motion.div
          className="absolute -left-3 top-0 w-1 h-full bg-gradient-to-b from-blue-400/50 via-purple-400/50 to-transparent rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      )}

      {/* Message content */}
      <div
        className={`
          ${isKiaan
            ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10'
            : 'bg-white/10 border border-white/5'
          }
          rounded-2xl px-5 py-4 backdrop-blur-sm
        `}
      >
        {/* KIAAN badge */}
        {isKiaan && (
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-blue-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs text-white/50 font-medium tracking-wider uppercase">
              KIAAN
            </span>
          </div>
        )}

        {/* Message text */}
        <div className="text-white/90 leading-relaxed">
          {formatMessage(message)}
        </div>

        {/* Sacred closing glow for KIAAN messages */}
        {isKiaan && message.includes('💙') && (
          <motion.div
            className="absolute bottom-2 right-4 text-lg"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💙
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default SacredMessage;
