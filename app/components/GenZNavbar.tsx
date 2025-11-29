'use client'

import { motion } from 'framer-motion'

const navItems = ['Home', 'Journal', 'KIAAN Chat', 'Insights']

export function GenZNavbar() {
  return (
    <motion.nav
      className="relative z-20 flex items-center justify-between rounded-2xl bg-black/60 px-6 py-4 shadow-neon-strong ring-1 ring-vibrant-blue/40 backdrop-blur-lg"
      animate={{ boxShadow: '0 6px 26px rgba(0,255,255,.35)' }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-one shadow-glow" aria-hidden />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-vibrant-blue">MindVibe</p>
          <p className="text-sm font-medium text-white/80">Fast, neon, and empowering</p>
        </div>
      </div>
      <ul className="flex items-center space-x-5 text-sm font-semibold text-slate-100/80">
        {navItems.map(item => (
          <motion.li
            key={item}
            whileHover={{ scale: 1.08, color: '#39ff14' }}
            className="relative cursor-pointer px-2 py-1 transition"
          >
            <span className="relative z-10">{item}</span>
            <motion.span
              className="absolute inset-x-0 -bottom-1 h-0.5 origin-left bg-gradient-one"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.25 }}
              aria-hidden
            />
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  )
}
