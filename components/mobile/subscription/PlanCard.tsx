'use client'

import { motion } from 'framer-motion'

export interface PlanCardProps {
  id: string
  name: string
  tagline: string
  price: string
  period: string
  annualNote?: string
  features: string[]
  cta: string
  badge?: string
  accent: string
  selected: boolean
  onSelect: () => void
  onContinue: () => void
}

export function PlanCard({
  name,
  tagline,
  price,
  period,
  annualNote,
  features,
  cta,
  badge,
  accent,
  selected,
  onSelect,
  onContinue,
}: PlanCardProps) {
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className="relative rounded-3xl p-5 cursor-pointer transition-all"
      style={{
        background: selected
          ? `linear-gradient(160deg, ${accent}22 0%, #0A0F1F 70%)`
          : 'linear-gradient(160deg, rgba(255,255,255,0.04) 0%, #0A0F1F 80%)',
        border: `1px solid ${selected ? accent : 'rgba(255,255,255,0.08)'}`,
        boxShadow: selected ? `0 0 32px -8px ${accent}66` : 'none',
      }}
    >
      {badge && (
        <div
          className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
          style={{ background: accent, color: '#050714' }}
        >
          {badge}
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-2xl font-serif text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {name}
          </h3>
          <p className="text-sm italic text-white/60" style={{ fontFamily: 'Crimson Text, serif' }}>
            {tagline}
          </p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all`}
          style={{ borderColor: selected ? accent : 'rgba(255,255,255,0.25)' }}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-3 mb-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-white/60 text-sm">{period}</span>
      </div>
      {annualNote && <p className="text-xs text-white/50 mb-4">{annualNote}</p>}

      <ul className="space-y-2 mt-4 mb-5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/80">
            <span style={{ color: accent }}>✦</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {selected && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => {
            e.stopPropagation()
            onContinue()
          }}
          className="w-full py-3 rounded-full font-semibold text-[#050714] transition-transform active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${accent}, #F0C040)` }}
        >
          {cta}
        </motion.button>
      )}
    </motion.div>
  )
}
