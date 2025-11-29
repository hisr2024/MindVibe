'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

export function KiaanAvatar() {
  return (
    <motion.div
      className="flex items-center justify-start gap-4"
      animate={{ scale: [1, 1.1, 1], rotate: [0, 12, -12, 0] }}
      transition={{ repeat: Infinity, repeatType: 'mirror', duration: 5 }}
    >
      <motion.div
        animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="p-3"
      >
        <div className="relative grid place-items-center rounded-full bg-gradient-two p-4 shadow-glow">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-one opacity-40 blur-2xl" aria-hidden />
          <Star className="h-10 w-10 text-white" />
        </div>
      </motion.div>
      <div className="max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-vibrant-blue">KIAAN</p>
        <p className="text-lg font-semibold text-white">Hello, I’m KIAAN 🌟 Let’s chat for clarity!</p>
        <p className="text-sm text-slate-200/80">Fast, empowering, and tuned for neon-smooth late-night vibes.</p>
      </div>
    </motion.div>
  )
}
