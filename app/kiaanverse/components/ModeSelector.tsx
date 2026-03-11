/**
 * ModeSelector — Toggle between Gita Recital and Sakha (Q&A) Mode.
 *
 * Recital: Sacred verse narration experience.
 * Sakha: Divine friend conversation.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import type { InteractionMode } from '@/types/kiaanverse.types'

const MODES: { id: InteractionMode; name: string; description: string }[] = [
  {
    id: 'sakha',
    name: 'Sakha — Divine Friend',
    description: 'Ask questions and receive Gita wisdom as guidance',
  },
  {
    id: 'recital',
    name: 'Gita Recital',
    description: 'Sacred verse narration with Sanskrit chanting',
  },
]

export default function ModeSelector() {
  const showModeSelector = useKiaanverseStore((s) => s.showModeSelector)
  const toggleModeSelector = useKiaanverseStore((s) => s.toggleModeSelector)
  const interactionMode = useKiaanverseStore((s) => s.interactionMode)
  const setInteractionMode = useKiaanverseStore((s) => s.setInteractionMode)
  const setKrishnaState = useKiaanverseStore((s) => s.setKrishnaState)
  const setSubtitleText = useKiaanverseStore((s) => s.setSubtitleText)

  const handleSelect = (mode: InteractionMode) => {
    setInteractionMode(mode)
    toggleModeSelector()

    if (mode === 'recital') {
      setKrishnaState('reciting')
      setSubtitleText('Let me recite the sacred verses for you, dear friend. Request any chapter and verse.')
    } else {
      setKrishnaState('idle')
      setSubtitleText('Ask me anything, dear friend. I am here as your Sakha — your divine companion.')
    }
  }

  return (
    <AnimatePresence>
      {showModeSelector && (
        <>
          <motion.div
            key="mode-backdrop"
            className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label="Close mode selector"
            onClick={toggleModeSelector}
            onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') toggleModeSelector() }}
          />

          <motion.div
            key="mode-panel"
            role="dialog"
            aria-label="Interaction mode"
            aria-modal="true"
            className="absolute left-1/2 top-14 z-50 w-80 -translate-x-1/2 rounded-2xl border border-white/[0.06] bg-black/75 p-5 backdrop-blur-2xl"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="mb-5 text-center text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/50">
              Experience Mode
            </h2>

            <div className="flex flex-col gap-2">
              {MODES.map(({ id, name, description }) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`rounded-xl px-4 py-3 text-left transition-all ${
                    id === interactionMode
                      ? 'border border-amber-400/20 bg-amber-500/10 text-amber-200'
                      : 'border border-transparent text-amber-100/45 hover:bg-amber-500/[0.06] hover:text-amber-100/80'
                  }`}
                >
                  <p className="text-[13px] font-light">{name}</p>
                  <p className="mt-0.5 text-[10px] font-light tracking-wide text-amber-300/30">{description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
