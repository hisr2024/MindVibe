'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { GuidanceNode } from './GuidanceNode'
import { AnimatedParticles } from './AnimatedParticles'

export type GuidanceMode = 'inner-peace' | 'mind-control' | 'self-kindness'

interface TriangleOfEnergyProps {
  selectedMode?: GuidanceMode | null
  onSelectMode?: (mode: GuidanceMode) => void
  size?: number
  className?: string
}

/**
 * Triangle of Flowing Energy - Equilateral triangle with three guidance mode nodes.
 * Continuous energy flow between nodes with therapeutic animations.
 * Idle: Slow rhythmic flow (5-7s loop)
 * Hover: Energy flows toward hovered node
 * Selected: Enhanced glow + energy convergence
 */
export function TriangleOfEnergy({
  selectedMode = null,
  onSelectMode,
  size = 280,
  className = '',
}: TriangleOfEnergyProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = !shouldReduceMotion
  const [hoveredMode, setHoveredMode] = useState<GuidanceMode | null>(null)

  // Calculate triangle vertices for equilateral triangle
  const center = size / 2
  const radius = size * 0.38 // Distance from center to vertices
  
  const nodes = useMemo(() => {
    // Top vertex (12 o'clock position)
    const topX = center
    const topY = center - radius

    // Bottom-left vertex
    const bottomLeftX = center - radius * Math.cos(Math.PI / 6)
    const bottomLeftY = center + radius * Math.sin(Math.PI / 6) + radius * 0.3

    // Bottom-right vertex
    const bottomRightX = center + radius * Math.cos(Math.PI / 6)
    const bottomRightY = center + radius * Math.sin(Math.PI / 6) + radius * 0.3

    return [
      {
        id: 'inner-peace' as GuidanceMode,
        label: 'Inner Peace',
        x: topX,
        y: topY,
        color: '#1fb8c0', // Soft teal
        secondaryColor: '#6dd7f2',
        description: 'Breath-like expanding rings',
      },
      {
        id: 'mind-control' as GuidanceMode,
        label: 'Mind Control',
        x: bottomLeftX,
        y: bottomLeftY,
        color: '#1e3a8a', // Deep blue
        secondaryColor: '#3b82f6',
        description: 'Focused linear pulse',
      },
      {
        id: 'self-kindness' as GuidanceMode,
        label: 'Self Kindness',
        x: bottomRightX,
        y: bottomRightY,
        color: '#e57ac5', // Rose-lilac
        secondaryColor: '#c2a5ff', // Lilac gradient
        description: 'Warm heart bloom',
      },
    ]
  }, [center, radius])

  // Generate path between nodes for energy flow
  const trianglePath = useMemo(() => {
    return nodes.map((node, i) => {
      const nextNode = nodes[(i + 1) % nodes.length]
      return {
        from: node,
        to: nextNode,
        path: `M ${node.x} ${node.y} L ${nextNode.x} ${nextNode.y}`,
      }
    })
  }, [nodes])

  // Animation for idle flow (5-7s loop)
  const flowAnimateValues = isAnimated ? { strokeDashoffset: [0, -30] } : undefined
  const flowTransition = {
    duration: 6,
    repeat: Infinity,
    ease: 'linear' as const,
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      role="group"
      aria-label="Triangle of Flowing Energy - Guidance mode selector"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        <defs>
          {/* Gradient for energy flow */}
          <linearGradient id="energy-flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1fb8c0" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#1e3a8a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#e57ac5" stopOpacity="0.6" />
          </linearGradient>

          {/* Glow filter for selected state */}
          <filter id="energy-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Inner Peace teal glow */}
          <filter id="inner-peace-glow">
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.31 0 0 0 0 0.82 0 0 0 0 0.77 0 0 0 0.6 0"
            />
          </filter>

          {/* Mind Control blue glow */}
          <filter id="mind-control-glow">
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.23 0 0 0 0 0.51 0 0 0 0 0.96 0 0 0 0.6 0"
            />
          </filter>

          {/* Self Kindness rose glow */}
          <filter id="self-kindness-glow">
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.93 0 0 0 0 0.29 0 0 0 0 0.6 0 0 0 0.6 0"
            />
          </filter>
        </defs>

        {/* Background triangle outline */}
        <motion.polygon
          points={nodes.map((n) => `${n.x},${n.y}`).join(' ')}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
          animate={
            isAnimated
              ? {
                  opacity: [0.1, 0.2, 0.1],
                }
              : undefined
          }
          transition={
            isAnimated
              ? {
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : undefined
          }
        />

        {/* Energy flow paths */}
        {trianglePath.map((edge, index) => (
          <motion.path
            key={`edge-${index}`}
            d={edge.path}
            fill="none"
            stroke="url(#energy-flow-gradient)"
            strokeWidth="2"
            strokeDasharray="8 8"
            strokeLinecap="round"
            animate={flowAnimateValues}
            transition={isAnimated ? flowTransition : undefined}
            style={{
              filter:
                hoveredMode === edge.from.id || hoveredMode === edge.to.id
                  ? 'url(#energy-glow)'
                  : 'none',
            }}
          />
        ))}

        {/* Center convergence point */}
        <motion.circle
          cx={center}
          cy={center + radius * 0.1}
          r={8}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          animate={
            isAnimated
              ? {
                  r: selectedMode ? [8, 12, 8] : [8, 10, 8],
                  opacity: selectedMode ? [0.4, 0.7, 0.4] : [0.2, 0.3, 0.2],
                }
              : undefined
          }
          transition={
            isAnimated
              ? {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : undefined
          }
        />

        {/* Energy convergence when mode selected */}
        {selectedMode && isAnimated && (
          <motion.circle
            cx={center}
            cy={center + radius * 0.1}
            r={4}
            fill={nodes.find((n) => n.id === selectedMode)?.color || '#fff'}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </svg>

      {/* Animated particles layer */}
      <AnimatedParticles
        size={size}
        nodes={nodes}
        selectedMode={selectedMode}
        hoveredMode={hoveredMode}
        isAnimated={isAnimated}
      />

      {/* Guidance nodes */}
      {nodes.map((node) => (
        <GuidanceNode
          key={node.id}
          mode={node.id}
          label={node.label}
          x={node.x}
          y={node.y}
          color={node.color}
          secondaryColor={node.secondaryColor}
          isSelected={selectedMode === node.id}
          isHovered={hoveredMode === node.id}
          isAnimated={isAnimated}
          onSelect={() => onSelectMode?.(node.id)}
          onHover={(hovered) => setHoveredMode(hovered ? node.id : null)}
        />
      ))}
    </div>
  )
}
