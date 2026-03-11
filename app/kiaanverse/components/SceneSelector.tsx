/**
 * SceneSelector — VR scene navigation overlay.
 *
 * Allows users to teleport between the 5 VR environments.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import type { VRScene } from '@/types/kiaanverse.types'

const SCENES: { id: VRScene; name: string; description: string }[] = [
  { id: 'cosmic-ocean', name: 'Cosmic Ocean', description: 'The infinite Kshira Sagara — entry portal' },
  { id: 'kurukshetra', name: 'Kurukshetra', description: 'The sacred battlefield at golden sunset' },
  { id: 'dialogue-space', name: 'Sacred Grove', description: 'A serene banyan grove for deep dialogue' },
  { id: 'vishvarupa', name: 'Vishvarupa', description: 'The cosmic universal form of Krishna' },
  { id: 'lotus-meditation', name: 'Lotus Realm', description: 'A tranquil lotus pond for meditation' },
]

export default function SceneSelector() {
  const showSceneSelector = useKiaanverseStore((s) => s.showSceneSelector)
  const toggleSceneSelector = useKiaanverseStore((s) => s.toggleSceneSelector)
  const currentScene = useKiaanverseStore((s) => s.currentScene)
  const setScene = useKiaanverseStore((s) => s.setScene)
  const setScenePhase = useKiaanverseStore((s) => s.setScenePhase)

  const handleSelect = (scene: VRScene) => {
    setScene(scene)
    toggleSceneSelector()
    setScenePhase('transitioning')
    setTimeout(() => setScenePhase('active'), 1500)
  }

  return (
    <AnimatePresence>
      {showSceneSelector && (
        <>
          <motion.div
            key="scene-backdrop"
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label="Close scene selector"
            onClick={toggleSceneSelector}
            onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') toggleSceneSelector() }}
          />

          <motion.div
            key="scene-panel"
            role="dialog"
            aria-label="Scene navigation"
            aria-modal="true"
            className="absolute inset-x-4 top-16 z-50 max-w-lg mx-auto rounded-2xl border border-amber-400/15 bg-black/80 p-5 backdrop-blur-xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-amber-400/70">
              Sacred Realms
            </h2>

            <div className="flex flex-col gap-2">
              {SCENES.map(({ id, name, description }) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`rounded-lg px-4 py-3 text-left transition-colors ${
                    id === currentScene
                      ? 'border border-amber-400/30 bg-amber-500/15 text-amber-200'
                      : 'border border-transparent text-amber-100/60 hover:bg-amber-500/10 hover:text-amber-100/90'
                  }`}
                >
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-[11px] text-amber-300/40">{description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
