/**
 * KiaanverseExperience — Main orchestrator for the immersive VR Gita experience.
 *
 * Composes React Three Fiber Canvas with WebXR support, VR scenes,
 * Krishna AI character, and 2D UI overlay (HUD, subtitles, input, verse card).
 *
 * Scene lifecycle: loading → entering → active
 * Interaction modes: Recital (narration) | Sakha (Q&A)
 */

'use client'

import { Component, useEffect, useRef, Suspense } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars, AdaptiveDpr, AdaptiveEvents, Preload } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

/**
 * Error boundary that catches WebGL / R3F render failures
 * (e.g. context lost, asset load errors) and shows a graceful fallback
 * instead of crashing the entire page.
 */
class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Kiaanverse] Canvas error caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
          <div className="mb-4 text-5xl text-amber-400/60">&#x0950;</div>
          <p className="text-lg text-amber-200/70">
            The sacred realm could not be rendered.
          </p>
          <button
            className="mt-4 rounded-lg border border-amber-400/30 px-5 py-2 text-sm text-amber-300/80 transition hover:bg-amber-400/10"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

import CosmicOceanScene from './scenes/CosmicOceanScene'
import KurukshetraScene from './scenes/KurukshetraScene'
import DialogueSpaceScene from './scenes/DialogueSpaceScene'
import VishvarupaScene from './scenes/VishvarupaScene'
import LotusMeditationScene from './scenes/LotusMeditationScene'
import KrishnaAvatar from './components/KrishnaAvatar'
import ArjunaAvatar from './components/ArjunaAvatar'
import VRHud from './components/VRHud'
import SubtitleOverlay from './components/SubtitleOverlay'
import VerseCard from './components/VerseCard'
import QuestionInput from './components/QuestionInput'
import ChapterNav from './components/ChapterNav'
import SceneSelector from './components/SceneSelector'
import ModeSelector from './components/ModeSelector'

/** Maps scene keys to their R3F components */
function ActiveScene({ scene }: { scene: string }) {
  switch (scene) {
    case 'cosmic-ocean':
      return <CosmicOceanScene />
    case 'kurukshetra':
      return <KurukshetraScene />
    case 'dialogue-space':
      return <DialogueSpaceScene />
    case 'vishvarupa':
      return <VishvarupaScene />
    case 'lotus-meditation':
      return <LotusMeditationScene />
    default:
      return <KurukshetraScene />
  }
}

export default function KiaanverseExperience() {
  const currentScene = useKiaanverseStore((s) => s.currentScene)
  const scenePhase = useKiaanverseStore((s) => s.scenePhase)
  const setScenePhase = useKiaanverseStore((s) => s.setScenePhase)
  const setSubtitleText = useKiaanverseStore((s) => s.setSubtitleText)
  const setKrishnaState = useKiaanverseStore((s) => s.setKrishnaState)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    /* Phase 1: loading → entering after 1.5s */
    const t0 = setTimeout(() => {
      setScenePhase('entering')

      /* Phase 2: entering → active after 2s */
      const t1 = setTimeout(() => {
        setScenePhase('active')
        setKrishnaState('speaking')
        setSubtitleText(
          'Welcome to the sacred battlefield of Kurukshetra, my dear friend. ' +
          'I am Krishna, your Sakha — your divine companion. ' +
          'Ask me anything about dharma, about life, about the truth within your heart.'
        )
      }, 2000)
      timersRef.current.push(t1)

      /* Krishna returns to idle after welcome */
      const t2 = setTimeout(() => {
        setKrishnaState('idle')
      }, 14000)
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
      {/* ═══ 3D CANVAS (React Three Fiber + WebXR) ═══ */}
      <CanvasErrorBoundary>
        <Canvas
          className="absolute inset-0"
          camera={{ position: [0, 1.6, 5], fov: 60, near: 0.1, far: 1000 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 1.5]}
        >
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />

          {/* Global lighting */}
          <ambientLight intensity={0.3} color="#ffeedd" />
          <directionalLight position={[5, 8, 3]} intensity={0.6} color="#ffd700" castShadow />
          <pointLight position={[0, 4, 0]} intensity={0.4} color="#ff9944" distance={15} />

          <Suspense fallback={null}>
            {/* Active VR scene environment */}
            <ActiveScene scene={currentScene} />

            {/* Krishna AI avatar (3D) */}
            <KrishnaAvatar position={[-1.2, 0, 0]} />

            {/* Arjuna avatar (3D) */}
            <ArjunaAvatar position={[1.2, 0, 0]} />

            {/* Cosmic star field */}
            <Stars radius={100} depth={50} count={3000} factor={3} saturation={0.1} fade speed={0.5} />

            {/*
             * Procedural sunset environment lighting.
             * Replaces <Environment preset="sunset" /> which fetched an external
             * HDRI from raw.githack.com — blocked by CSP connect-src policy.
             * These lights replicate warm sunset reflections without any fetch.
             */}
            <hemisphereLight args={['#ff8844', '#334488', 0.15]} />
            <directionalLight position={[-3, 2, -5]} intensity={0.2} color="#ff6633" />
            <pointLight position={[3, 5, -2]} intensity={0.15} color="#ffaa55" distance={20} />

            <Preload all />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* ═══ 2D UI OVERLAY ═══ */}
      <AnimatePresence>
        {scenePhase === 'active' && (
          <motion.div
            key="ui-layer"
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="pointer-events-auto">
              <VRHud />
              <SubtitleOverlay />
              <VerseCard />
              <QuestionInput />
              <ChapterNav />
              <SceneSelector />
              <ModeSelector />
            </div>
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
            transition={{ duration: 1.2 }}
          >
            <motion.div
              className="mb-6 text-7xl text-amber-400/80"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              &#x0950;
            </motion.div>
            <p className="mb-2 text-lg font-light tracking-[0.3em] text-amber-200/60">
              KIAANVERSE
            </p>
            <p className="text-xs tracking-widest text-amber-200/30">
              Preparing the sacred realm...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ENTERING OVERLAY ═══ */}
      <AnimatePresence>
        {scenePhase === 'entering' && (
          <motion.div
            key="entering"
            className="absolute inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
            >
              <h1 className="font-serif text-4xl font-light tracking-wide text-amber-200/80 md:text-5xl">
                Bhagavad Gita
              </h1>
              <p className="mt-3 text-lg font-light text-amber-300/50">
                The Song of God
              </p>
              <p className="mt-1 text-xs tracking-widest text-amber-200/30">
                Experience Krishna as your Divine Friend
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SCENE TRANSITION OVERLAY ═══ */}
      <AnimatePresence>
        {scenePhase === 'transitioning' && (
          <motion.div
            key="transition"
            className="absolute inset-0 z-45 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="text-3xl text-amber-400/60"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              &#x0950;
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
