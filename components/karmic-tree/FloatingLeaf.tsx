'use client'

import { motion } from 'framer-motion'

interface FloatingLeafProps {
  milestone: string
  icon: string
  position: { x: number; y: number }
  delay?: number
  onClick?: () => void
}

export function FloatingLeaf({ milestone, icon, position, delay = 0, onClick }: FloatingLeafProps) {
  return (
    <motion.button
      className="absolute cursor-pointer group"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-orange-400/30 blur-md"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Leaf icon */}
      <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-lg shadow-orange-500/25">
        <span className="text-lg">{icon}</span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="whitespace-nowrap rounded-lg bg-black/90 px-3 py-1.5 text-xs text-orange-50 shadow-lg">
          {milestone}
        </div>
      </div>
    </motion.button>
  )
}

export default FloatingLeaf
