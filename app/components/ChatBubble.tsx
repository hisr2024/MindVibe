'use client'

import { motion } from 'framer-motion'

interface ChatBubbleProps {
  text: string
  sender: 'user' | 'assistant'
}

export function ChatBubble({ text, sender }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`max-w-[18rem] rounded-2xl px-4 py-3 text-sm shadow-soft backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue/50 focus-visible:ring-offset-2 ${
        sender === 'assistant'
          ? 'bg-white text-ink-100 ring-1 ring-vibrant-blue/40'
          : 'ml-auto bg-calm-100 text-ink-100 ring-1 ring-vibrant-pink/30'
      }`}
      style={{ alignSelf: sender === 'user' ? 'flex-end' : 'flex-start' }}
      tabIndex={0}
      role="article"
      aria-label={`${sender === 'assistant' ? 'KIAAN' : 'You'} message`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-300/80">
        {sender === 'assistant' ? 'KIAAN' : 'You'}
      </p>
      <p className="leading-relaxed text-ink-100/90">{text}</p>
    </motion.div>
  )
}
