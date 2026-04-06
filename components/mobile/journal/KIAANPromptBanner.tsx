'use client'

import { motion } from 'framer-motion'

interface Props {
  prompt: string
  subtitle?: string
}

export const KIAANPromptBanner: React.FC<Props> = ({
  prompt,
  subtitle = 'Based on your recent moods and journaling patterns',
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
    role="note"
    aria-label="KIAAN prompt"
    style={{
      margin: '10px 14px',
      padding: '11px 14px',
      background:
        'radial-gradient(ellipse at 0% 50%, rgba(212,160,23,0.08), rgba(17,20,53,0.98))',
      border: '1px solid rgba(212,160,23,0.15)',
      borderLeft: '3px solid rgba(212,160,23,0.55)',
      borderRadius: '0 14px 14px 0',
    }}
  >
    <div
      style={{
        fontSize: 8,
        color: '#D4A017',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginBottom: 5,
      }}
    >
      ✦ KIAAN asks
    </div>
    <div
      style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontStyle: 'italic',
        fontSize: 16,
        color: '#EDE8DC',
        lineHeight: 1.6,
      }}
    >
      {prompt}
    </div>
    <div style={{ fontSize: 10, color: '#6B6355', marginTop: 5 }}>{subtitle}</div>
  </motion.div>
)
