'use client'

import { motion } from 'framer-motion'

interface TreeAnimationProps {
  moodScore: number // 1-10 scale
  journalStreak: number
  kiaanConversations: number
  season: 'spring' | 'summer' | 'autumn' | 'winter'
}

export function TreeAnimation({ moodScore, journalStreak, kiaanConversations, season }: TreeAnimationProps) {
  // Calculate tree health (0-100)
  const treeHealth = Math.min(100, (moodScore * 5) + (journalStreak * 2) + (kiaanConversations * 1.5))
  
  // Determine tree fullness based on health
  const leafCount = Math.floor(treeHealth / 10)
  
  // Season colors
  const seasonColors = {
    spring: { leaves: '#22c55e', accent: '#86efac' },
    summer: { leaves: '#15803d', accent: '#22c55e' },
    autumn: { leaves: '#f97316', accent: '#fbbf24' },
    winter: { leaves: '#94a3b8', accent: '#cbd5e1' },
  }
  
  const colors = seasonColors[season]
  
  return (
    <div className="relative w-full max-w-md mx-auto h-80">
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Tree trunk */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Ground */}
        <ellipse cx="100" cy="180" rx="60" ry="10" fill="#1a1a1a" opacity="0.5" />
        
        {/* Trunk */}
        <motion.path
          d="M95 180 L90 120 Q85 100 92 90 L92 90 Q95 85 100 85 Q105 85 108 90 L108 90 Q115 100 110 120 L105 180 Z"
          fill="#78350f"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        
        {/* Main branches */}
        <motion.path
          d="M92 90 Q70 70 55 60"
          stroke="#78350f"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M108 90 Q130 70 145 60"
          stroke="#78350f"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M100 85 Q100 50 100 35"
          stroke="#78350f"
          strokeWidth="5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
        
        {/* Leaves/Canopy based on health */}
        {leafCount > 0 && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            {/* Left canopy */}
            <motion.ellipse
              cx="55"
              cy="55"
              rx={15 + leafCount}
              ry={12 + leafCount * 0.8}
              fill={colors.leaves}
              animate={{
                rx: [15 + leafCount, 17 + leafCount, 15 + leafCount],
                ry: [12 + leafCount * 0.8, 14 + leafCount * 0.8, 12 + leafCount * 0.8],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Center canopy */}
            <motion.ellipse
              cx="100"
              cy="40"
              rx={25 + leafCount * 1.5}
              ry={20 + leafCount}
              fill={colors.leaves}
              animate={{
                rx: [25 + leafCount * 1.5, 28 + leafCount * 1.5, 25 + leafCount * 1.5],
                ry: [20 + leafCount, 22 + leafCount, 20 + leafCount],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Right canopy */}
            <motion.ellipse
              cx="145"
              cy="55"
              rx={15 + leafCount}
              ry={12 + leafCount * 0.8}
              fill={colors.leaves}
              animate={{
                rx: [15 + leafCount, 17 + leafCount, 15 + leafCount],
                ry: [12 + leafCount * 0.8, 14 + leafCount * 0.8, 12 + leafCount * 0.8],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Accent highlights */}
            <motion.ellipse
              cx="100"
              cy="35"
              rx={15 + leafCount}
              ry={12 + leafCount * 0.6}
              fill={colors.accent}
              opacity={0.5}
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>
        )}
        
        {/* Energy particles */}
        {Array.from({ length: Math.floor(treeHealth / 20) }).map((_, i) => (
          <motion.circle
            key={i}
            r="2"
            fill={colors.accent}
            initial={{ cx: 100, cy: 180, opacity: 0 }}
            animate={{
              cx: [100, 100 + Math.sin(i * 0.7) * 30, 100 + Math.sin(i * 0.7) * 20],
              cy: [180, 100, 40],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default TreeAnimation
