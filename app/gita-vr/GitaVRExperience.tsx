/**
 * GitaVRExperience — Main orchestrator for the immersive Gita experience.
 *
 * Composes all visual layers:
 * - Battlefield (cinematic backdrop)
 * - Krishna & Arjuna figures (divine silhouettes)
 * - HUD (chapter nav, exit)
 * - Subtitle overlay (Krishna's words)
 * - Verse card (referenced verse display)
 * - Question input (user interaction)
 * - Chapter navigation panel
 *
 * Manages scene lifecycle: loading → intro → active.
 */

'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

import Battlefield from './components/Battlefield'
import KrishnaFigure from './components/KrishnaFigure'
import ArjunaFigure from './components/ArjunaFigure'
import HUD from './components/HUD'
import SubtitleOverlay from './components/SubtitleOverlay'
import VerseCard from './components/VerseCard'
import QuestionInput from './components/QuestionInput'
import ChapterNav from './components/ChapterNav'

export default function GitaVRExperience() {
  const scenePhase = useGitaVRStore((s) => s.scenePhase)
  const setScenePhase = useGitaVRStore((s) => s.setScenePhase)
  const setSubtitleText = useGitaVRStore((s) => s.setSubtitleText)
  const setKrishnaState = useGitaVRStore((s) => s.setKrishnaState)

  /* Track all timers for cleanup */
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    /* Phase 1: loading → intro after 1.5s */
    const t0 = setTimeout(() => {
      setScenePhase('intro')

      /* Phase 2: intro → active after another 2s */
      const t1 = setTimeout(() => {
        setScenePhase('active')
        setKrishnaState('speaking')
        setSubtitleText(
          'Welcome, dear friend. I am here on this sacred battlefield of Kurukshetra. ' +
          'Ask me anything — about dharma, about life, about the truth within your heart.'
        )
      }, 2000)
      timersRef.current.push(t1)

      /* Phase 3: Krishna returns to idle after welcome message */
      const t2 = setTimeout(() => {
        setKrishnaState('idle')
      }, 12000)
      timersRef.current.push(t2)
    }, 1500)
    timersRef.current.push(t0)

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [setScenePhase, setSubtitleText, setKrishnaState])

  return (
    <div className="relative h-[100dvh] w-full select-none overflow-hidden bg-black">
      {/* ═══ BACKDROP ═══ */}
      <Battlefield />

      {/* ═══ CHARACTERS ═══ */}
      <AnimatePresence>
        {scenePhase !== 'loading' && (
          <motion.div
            key="characters"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div className="absolute bottom-[8%] left-0 right-0 flex items-end justify-center gap-4 px-4 md:gap-12 lg:gap-20">
              <div className="relative h-[55vh] max-h-[500px] min-h-[280px] w-[40%] max-w-[260px]">
                <KrishnaFigure />
              </div>
              <div className="relative h-[48vh] max-h-[440px] min-h-[240px] w-[35%] max-w-[220px]">
                <ArjunaFigure />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ UI LAYERS (individually keyed for AnimatePresence) ═══ */}
      <AnimatePresence>
        {scenePhase === 'active' && (
          <motion.div
            key="ui-layer"
            className="absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HUD />
            <SubtitleOverlay />
            <VerseCard />
            <QuestionInput />
            <ChapterNav />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ LOADING OVERLAY ═══ */}
      <AnimatePresence>
        {scenePhase === 'loading' && (
          <motion.div
            key="loading"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="mb-6 text-6xl text-amber-400/80"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              &#x0950;
            </motion.div>
            <p className="text-sm tracking-widest text-amber-200/50">
              Entering the sacred battlefield...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INTRO OVERLAY ═══ */}
      <AnimatePresence>
        {scenePhase === 'intro' && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <motion.h1
              className="text-center font-serif text-3xl font-light tracking-wide text-amber-200/80 md:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
            >
              Bhagavad Gita
              <span className="mt-2 block text-lg font-normal text-amber-300/50">
                The Song of God
              </span>
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
