/**
 * KiaanverseExperience — Main orchestrator for the immersive divine Gita experience.
 *
 * Composes React Three Fiber Canvas with VR scenes, sacred DivinePresence
 * (replacing character avatars), and refined 2D UI overlay.
 *
 * Scene lifecycle: loading → entering → active
 * Interaction modes: Recital (narration) | Sakha (Q&A)
 *
 * The user IS Arjuna — no second avatar needed.
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
 * and shows a graceful fallback instead of crashing the page.
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
          <div className="mb-6 text-6xl text-amber-400/40">&#x0950;</div>
          <p className="text-lg font-light tracking-wide text-amber-200/60">
            The sacred realm could not be rendered.
          </p>
          <button
            className="mt-6 rounded-full border border-amber-400/20 px-6 py-2 text-sm font-light tracking-wider text-amber-300/60 transition hover:bg-amber-400/10 hover:text-amber-300"
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
import DivinePresence from './components/DivinePresence'
import VRHud from './components/VRHud'
import SubtitleOverlay from './components/SubtitleOverlay'
import VerseCard from './components/VerseCard'
import QuestionInput from './components/QuestionInput'
import ChapterNav from './components/ChapterNav'
import SceneSelector from './components/SceneSelector'
import ModeSelector from './components/ModeSelector'

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
    const t0 = setTimeout(() => {
      setScenePhase('entering')

      const t1 = setTimeout(() => {
        setScenePhase('active')
        setKrishnaState('speaking')
        setSubtitleText(
          'Welcome, dear friend. I am here as your Sakha — your divine companion. ' +
          'Ask me anything about dharma, about life, about the truth within your heart.'
        )
      }, 2500)
      timersRef.current.push(t1)

      const t2 = setTimeout(() => {
        setKrishnaState('idle')
      }, 14000)
      timersRef.current.push(t2)
    }, 2000)
    timersRef.current.push(t0)

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [setScenePhase, setSubtitleText, setKrishnaState])

  return (
    <div className="relative h-[100dvh] w-full select-none overflow-hidden bg-black">
      {/* ═══ 3D CANVAS ═══ */}
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

          {/* Subtle global lighting */}
          <ambientLight intensity={0.2} color="#ffeedd" />
          <directionalLight position={[5, 8, 3]} intensity={0.5} color="#ffd700" castShadow />

          <Suspense fallback={null}>
            <ActiveScene scene={currentScene} />

            {/* Divine Presence — sacred geometry + particles (replaces character avatars) */}
            <DivinePresence position={[0, 0, 0]} />

            {/* Cosmic starfield */}
            <Stars radius={120} depth={60} count={4000} factor={3} saturation={0.05} fade speed={0.3} />

            {/* Procedural sunset-warm environment lighting */}
            <hemisphereLight args={['#ff8844', '#223366', 0.1]} />
            <directionalLight position={[-3, 2, -5]} intensity={0.15} color="#ff6633" />
            <pointLight position={[3, 5, -2]} intensity={0.1} color="#ffaa55" distance={20} />

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
            transition={{ duration: 0.8 }}
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
            transition={{ duration: 1.5 }}
          >
            <motion.div
              className="mb-8 text-8xl font-light text-amber-400/60"
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              &#x0950;
            </motion.div>
            <p className="mb-2 text-sm font-light tracking-[0.4em] text-amber-200/40">
              KIAANVERSE
            </p>
            <motion.div
              className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
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
            transition={{ duration: 1.8 }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.2 }}
            >
              <motion.div
                className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <h1 className="font-serif text-4xl font-extralight tracking-wider text-amber-100/70 md:text-5xl">
                Bhagavad Gita
              </h1>
              <p className="mt-4 text-base font-extralight tracking-widest text-amber-200/35">
                The Song of God
              </p>
              <motion.div
                className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SCENE TRANSITION OVERLAY ═══ */}
      <AnimatePresence>
        {scenePhase === 'transitioning' && (
          <motion.div
            key="transition"
            className="absolute inset-0 z-[45] flex items-center justify-center bg-black/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="text-4xl font-light text-amber-400/40"
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              &#x0950;
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
