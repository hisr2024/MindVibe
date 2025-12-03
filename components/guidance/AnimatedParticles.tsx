'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { GuidanceMode } from './TriangleOfEnergy'

interface NodeInfo {
  id: GuidanceMode
  x: number
  y: number
  color: string
}

interface AnimatedParticlesProps {
  size: number
  nodes: NodeInfo[]
  selectedMode: GuidanceMode | null
  hoveredMode: GuidanceMode | null
  isAnimated: boolean
}

interface Particle {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  duration: number
  delay: number
  size: number
}

/**
 * Animated particles flowing between nodes of the Triangle of Energy.
 * Creates subtle, calming, therapeutic particle effects.
 * Particles flow toward selected/hovered nodes for visual feedback.
 */
export function AnimatedParticles({
  size,
  nodes,
  selectedMode,
  hoveredMode,
  isAnimated,
}: AnimatedParticlesProps) {
  // Generate particles flowing between nodes
  const particles = useMemo(() => {
    if (!isAnimated) return []

    const result: Particle[] = []
    const particleCount = 6 // Keep minimal for performance

    // Create particles flowing along each edge
    nodes.forEach((node, index) => {
      const nextNode = nodes[(index + 1) % nodes.length]

      for (let i = 0; i < particleCount / 3; i++) {
        result.push({
          id: `${node.id}-${nextNode.id}-${i}`,
          startX: node.x,
          startY: node.y,
          endX: nextNode.x,
          endY: nextNode.y,
          color: node.color,
          duration: 4 + Math.random() * 3, // 4-7s (matching slow rhythmic flow)
          delay: i * 1.5,
          size: 2 + Math.random() * 2,
        })
      }
    })

    return result
  }, [nodes, isAnimated])

  // Get target node position for convergence effect
  const targetNode = useMemo(() => {
    const activeMode = selectedMode || hoveredMode
    if (!activeMode) return null
    return nodes.find((n) => n.id === activeMode) || null
  }, [nodes, selectedMode, hoveredMode])

  if (!isAnimated) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <defs>
        {/* Particle glow filter */}
        <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edge particles */}
      {particles.map((particle) => (
        <motion.circle
          key={particle.id}
          r={particle.size}
          fill={particle.color}
          filter="url(#particle-glow)"
          initial={{
            cx: particle.startX,
            cy: particle.startY,
            opacity: 0,
          }}
          animate={{
            cx: [particle.startX, particle.endX],
            cy: [particle.startY, particle.endY],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Convergence particles when mode is selected/hovered */}
      {targetNode && (
        <>
          {/* Outer convergence ring */}
          <motion.circle
            cx={targetNode.x}
            cy={targetNode.y}
            r={40}
            fill="none"
            stroke={targetNode.color}
            strokeWidth="1"
            strokeOpacity="0.3"
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{
              scale: [1.5, 1],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Inner convergence particles */}
          {[0, 1, 2].map((i) => {
            const angle = (i * 2 * Math.PI) / 3
            const startRadius = 60
            const startX = targetNode.x + Math.cos(angle) * startRadius
            const startY = targetNode.y + Math.sin(angle) * startRadius

            return (
              <motion.circle
                key={`converge-${i}`}
                r={3}
                fill={targetNode.color}
                filter="url(#particle-glow)"
                initial={{
                  cx: startX,
                  cy: startY,
                  opacity: 0,
                }}
                animate={{
                  cx: [startX, targetNode.x],
                  cy: [startY, targetNode.y],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            )
          })}

          {/* Central pulse when selected */}
          {selectedMode && (
            <motion.circle
              cx={targetNode.x}
              cy={targetNode.y}
              r={6}
              fill={targetNode.color}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{
                scale: [0.8, 1.3, 0.8],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </>
      )}

      {/* Ambient floating particles in center */}
      {[...Array(4)].map((_, i) => {
        const centerX = size / 2
        const centerY = size / 2 + 10
        const angle = (i * Math.PI * 2) / 4
        const radius = 15 + Math.random() * 10

        return (
          <motion.circle
            key={`ambient-${i}`}
            r={1.5}
            fill="rgba(255, 255, 255, 0.4)"
            initial={{
              cx: centerX,
              cy: centerY,
            }}
            animate={{
              cx: [
                centerX,
                centerX + Math.cos(angle) * radius,
                centerX,
              ],
              cy: [
                centerY,
                centerY + Math.sin(angle) * radius,
                centerY,
              ],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + i * 0.5,
              delay: i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </svg>
  )
}

export default AnimatedParticles
