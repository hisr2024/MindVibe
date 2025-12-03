'use client'

import { motion } from 'framer-motion'
import type { GuidanceMode } from './TriangleOfEnergy'

interface GuidanceNodeProps {
  mode: GuidanceMode
  label: string
  x: number
  y: number
  color: string
  secondaryColor: string
  isSelected: boolean
  isHovered: boolean
  isAnimated: boolean
  onSelect: () => void
  onHover: (hovered: boolean) => void
}

/**
 * Individual guidance node component for the Triangle of Flowing Energy.
 * Each node represents a guidance mode with unique animation style:
 * - Inner Peace (teal): breath-like expanding rings
 * - Mind Control (blue): focused linear pulse
 * - Self Kindness (rose-lilac): warm heart bloom
 */
export function GuidanceNode({
  mode,
  label,
  x,
  y,
  color,
  secondaryColor,
  isSelected,
  isHovered,
  isAnimated,
  onSelect,
  onHover,
}: GuidanceNodeProps) {
  const nodeSize = 48
  const halfSize = nodeSize / 2

  // Get mode-specific animation values (without transition)
  const getModeAnimateValues = () => {
    if (!isAnimated) return undefined
    switch (mode) {
      case 'inner-peace':
        // Breath-like expanding rings
        return { scale: [1, 1.15, 1] }
      case 'mind-control':
        // Focused linear pulse
        return { opacity: [0.7, 1, 0.7] }
      case 'self-kindness':
        // Warm heart bloom
        return { scale: [1, 1.08, 1.12, 1] }
      default:
        return undefined
    }
  }

  // Get mode-specific transition
  const getModeTransition = () => {
    switch (mode) {
      case 'inner-peace':
        return {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        }
      case 'mind-control':
        return {
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear' as const,
        }
      case 'self-kindness':
        return {
          duration: 2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
        }
      default:
        return undefined
    }
  }

  const modeAnimateValues = getModeAnimateValues()
  const modeTransition = getModeTransition()

  return (
    <motion.button
      className="absolute flex flex-col items-center gap-2"
      style={{
        left: x - halfSize,
        top: y - halfSize,
        width: nodeSize,
        height: nodeSize + 24, // Extra space for label
      }}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      aria-label={`Select ${label} guidance mode`}
      aria-pressed={isSelected}
    >
      {/* Outer glow ring for selected/hovered state */}
      {(isSelected || isHovered) && isAnimated && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: nodeSize + 20,
            height: nodeSize + 20,
            left: -10,
            top: -10,
            background: `radial-gradient(circle, ${color}40, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main node circle */}
      <motion.div
        className="relative flex items-center justify-center rounded-full shadow-lg"
        style={{
          width: nodeSize,
          height: nodeSize,
          background: `linear-gradient(135deg, ${color}, ${secondaryColor})`,
          boxShadow: isSelected
            ? `0 8px 32px ${color}60, 0 0 20px ${color}40`
            : isHovered
              ? `0 4px 20px ${color}40`
              : `0 4px 12px ${color}25`,
        }}
        animate={modeAnimateValues}
        transition={modeTransition}
      >
        {/* Mode-specific inner decoration */}
        {mode === 'inner-peace' && (
          <>
            {/* Expanding breath rings */}
            {isAnimated && (
              <>
                <motion.div
                  className="absolute rounded-full border"
                  style={{
                    width: nodeSize - 8,
                    height: nodeSize - 8,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  }}
                  animate={{
                    scale: [1, 1.4],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.div
                  className="absolute rounded-full border"
                  style={{
                    width: nodeSize - 16,
                    height: nodeSize - 16,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  }}
                  animate={{
                    scale: [1, 1.6],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 0.8,
                  }}
                />
              </>
            )}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" opacity="0.9" />
              <circle cx="12" cy="12" r="3" fill="white" opacity="0.8" />
            </svg>
          </>
        )}

        {mode === 'mind-control' && (
          <>
            {/* Focused linear pulse lines */}
            {isAnimated && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="absolute h-px w-3/4 bg-white/40" />
                <div className="absolute h-3/4 w-px bg-white/40" />
              </motion.div>
            )}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4 L12 8 M12 16 L12 20 M4 12 L8 12 M16 12 L20 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <circle cx="12" cy="12" r="4" fill="white" opacity="0.8" />
            </svg>
          </>
        )}

        {mode === 'self-kindness' && (
          <>
            {/* Warm heart bloom effect */}
            {isAnimated && (
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: nodeSize - 12,
                  height: nodeSize - 12,
                  background: `radial-gradient(circle, ${secondaryColor}60, transparent)`,
                }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            )}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.9">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </>
        )}
      </motion.div>

      {/* Label */}
      <motion.span
        className="text-xs font-semibold text-center whitespace-nowrap"
        style={{
          color: isSelected ? color : isHovered ? color : 'rgba(255, 255, 255, 0.8)',
          textShadow: isSelected ? `0 0 10px ${color}80` : 'none',
        }}
        animate={
          isSelected && isAnimated
            ? {
                opacity: [0.9, 1, 0.9],
              }
            : { opacity: 1 }
        }
        transition={{
          duration: 2,
          repeat: isSelected ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {label}
      </motion.span>
    </motion.button>
  )
}

export default GuidanceNode
