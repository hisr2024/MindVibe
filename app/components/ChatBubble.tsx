'use client'

import { motion } from 'framer-motion'

interface ChatBubbleProps {
  text: string
  sender: 'user' | 'assistant'
}

export function ChatBubble({ text, sender }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`max-w-[18rem] rounded-2xl px-4 py-3 text-sm shadow-neon-strong backdrop-blur-md transition hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue/60 focus-visible:ring-offset-2 ${
        sender === 'assistant' ? 'bg-vibrant-blue/30 text-white ring-1 ring-vibrant-blue/50' : 'ml-auto bg-white/10 text-slate-100 ring-1 ring-vibrant-pink/40'
      }`}
      style={{ alignSelf: sender === 'user' ? 'flex-end' : 'flex-start' }}
      tabIndex={0}
      role="article"
      aria-label={`${sender === 'assistant' ? 'KIAAN' : 'You'} message`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200/80">
        {sender === 'assistant' ? 'KIAAN' : 'You'}
      </p>
      <p className="leading-relaxed text-white/90">{text}</p>
    </motion.div>
  )
}
