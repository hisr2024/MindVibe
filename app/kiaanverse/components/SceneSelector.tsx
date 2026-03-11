/**
 * SceneSelector — Refined VR scene navigation overlay.
 *
 * Teleport between the 5 sacred realms.
 */

'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import type { VRScene } from '@/types/kiaanverse.types'

const SCENES: { id: VRScene; name: string; description: string }[] = [
  { id: 'cosmic-ocean', name: 'Cosmic Ocean', description: 'The infinite Kshira Sagara — entry portal' },
  { id: 'kurukshetra', name: 'Kurukshetra', description: 'The sacred battlefield at golden sunset' },
  { id: 'dialogue-space', name: 'Sacred Grove', description: 'A serene banyan grove for deep dialogue' },
  { id: 'vishvarupa', name: 'Vishvarupa', description: 'The cosmic universal form revealed' },
  { id: 'lotus-meditation', name: 'Lotus Realm', description: 'A tranquil lotus pond for meditation' },
]

export default function SceneSelector() {
  const showSceneSelector = useKiaanverseStore((s) => s.showSceneSelector)
  const toggleSceneSelector = useKiaanverseStore((s) => s.toggleSceneSelector)
  const currentScene = useKiaanverseStore((s) => s.currentScene)
  const setScene = useKiaanverseStore((s) => s.setScene)
  const setScenePhase = useKiaanverseStore((s) => s.setScenePhase)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleSelect = (scene: VRScene) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setScene(scene)
    toggleSceneSelector()
    setScenePhase('transitioning')
    timerRef.current = setTimeout(() => {
      setScenePhase('active')
      timerRef.current = null
    }, 1500)
  }

  return (
    <AnimatePresence>
      {showSceneSelector && (
        <>
          <motion.div
            key="scene-backdrop"
            className="absolute inset-0 z-50 bg-black/65 backdrop-blur-sm"
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
            className="absolute inset-x-4 top-14 z-50 mx-auto max-w-md rounded-2xl border border-white/[0.06] bg-black/75 p-5 backdrop-blur-2xl"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="mb-5 text-center text-[10px] font-light uppercase tracking-[0.3em] text-amber-400/50">
              Sacred Realms
            </h2>

            <div className="flex flex-col gap-1.5">
              {SCENES.map(({ id, name, description }) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`rounded-xl px-4 py-3 text-left transition-all ${
                    id === currentScene
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
