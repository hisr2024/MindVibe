/**
 * GitaVRExperience — Main 3D VR Orchestrator
 *
 * The heart of the Bhagavad Gita VR experience. Assembles:
 * - Kurukshetra battlefield scene (sky, ground, chariot, armies)
 * - Krishna and Arjuna 3D models with animations
 * - Divine visual effects (aura, particles, god rays, Vishwaroop)
 * - UI overlays (HUD, subtitles, chapter selector, question input)
 * - Audio system (ambience, spatial TTS)
 * - Camera controls (orbit/touch/VR)
 * - Post-processing (bloom, vignette)
 *
 * All wrapped in React Three Fiber Canvas with XR support.
 */

'use client'

import { Suspense, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

// Scene
import KurukshetraScene from './components/scene/KurukshetraScene'

// Characters
import KrishnaModel from './components/characters/KrishnaModel'
import ArjunaModel from './components/characters/ArjunaModel'

// Effects
import DivineAura from './components/effects/DivineAura'
import CosmicParticles3D from './components/effects/CosmicParticles3D'
import VishwaroopEffect from './components/effects/VishwaroopEffect'
import SudarshanaChakra from './components/effects/SudarshanaChakra'
import GodRays from './components/effects/GodRays'

// UI
import VRHud from './components/ui/VRHud'
import SubtitlePanel from './components/ui/SubtitlePanel'
import ChapterSelector from './components/ui/ChapterSelector'
import QuestionInput from './components/ui/QuestionInput'
import VerseDisplay from './components/ui/VerseDisplay'
import VRControls from './components/ui/VRControls'

// Audio
import AmbienceManager from './components/audio/AmbienceManager'

// State
import { useGitaVR } from '@/hooks/useGitaVR'

function Scene() {
  const { askQuestion, startExperience, sceneState } = useGitaVR()

  useEffect(() => {
    startExperience()
  }, [startExperience])

  const handleAskQuestion = useCallback(async (question: string) => {
    await askQuestion(question)
  }, [askQuestion])

  return (
    <>
      {/* === ENVIRONMENT === */}
      <KurukshetraScene />

      {/* === CHARACTERS === */}
      <KrishnaModel />
      <ArjunaModel />

      {/* === DIVINE EFFECTS === */}
      <DivineAura />
      <CosmicParticles3D />
      <SudarshanaChakra />
      <GodRays />
      <VishwaroopEffect />

      {/* === UI OVERLAYS === */}
      <VRHud />
      <SubtitlePanel />
      <ChapterSelector />
      <QuestionInput onAskQuestion={handleAskQuestion} />
      <VerseDisplay />

      {/* === CONTROLS === */}
      <VRControls />

      {/* === POST-PROCESSING === */}
      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
        />
      </EffectComposer>

      {/* Preload assets */}
      <Preload all />
    </>
  )
}

export default function GitaVRExperience() {
  return (
    <div className="relative h-screen w-screen">
      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 2.5, 6],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#000000' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* HTML Overlay — Back button (always visible) */}
      <div className="pointer-events-none absolute inset-0">
        <a
          href="/"
          className="pointer-events-auto absolute left-4 top-4 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/60 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
        >
          ← Back
        </a>

        {/* VR Entry badge */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[#d4a44c]/30">
            Bhagavad Gita VR Experience
          </p>
        </div>
      </div>

      {/* Audio manager (non-visual) */}
      <AmbienceManager />
    </div>
  )
}
