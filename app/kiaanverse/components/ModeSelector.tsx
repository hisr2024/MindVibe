/**
 * ModeSelector — Toggle between Gita Recital Mode and Sakha (Q&A) Mode.
 *
 * Recital Mode: Krishna narrates verses — sacred recitation experience.
 * Sakha Mode:   User asks questions — divine friend conversation.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import type { InteractionMode } from '@/types/kiaanverse.types'

const MODES: { id: InteractionMode; name: string; description: string }[] = [
  {
    id: 'sakha',
    name: 'Sakha Mode (Divine Friend)',
    description: 'Ask Krishna questions and receive Gita wisdom as guidance',
  },
  {
    id: 'recital',
    name: 'Gita Recital Mode',
    description: 'Krishna narrates sacred verses with Sanskrit chanting',
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
      setSubtitleText('Ask me anything, my dear friend. I am here as your Sakha — your divine companion.')
    }
  }

  return (
    <AnimatePresence>
      {showModeSelector && (
        <>
          <motion.div
            key="mode-backdrop"
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
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
            className="absolute left-1/2 top-16 z-50 w-80 -translate-x-1/2 rounded-2xl border border-amber-400/15 bg-black/80 p-5 backdrop-blur-xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-amber-400/70">
              Experience Mode
            </h2>

            <div className="flex flex-col gap-3">
              {MODES.map(({ id, name, description }) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`rounded-lg px-4 py-3 text-left transition-colors ${
                    id === interactionMode
                      ? 'border border-amber-400/30 bg-amber-500/15 text-amber-200'
                      : 'border border-transparent text-amber-100/60 hover:bg-amber-500/10 hover:text-amber-100/90'
                  }`}
                >
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-0.5 text-[11px] text-amber-300/40">{description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
