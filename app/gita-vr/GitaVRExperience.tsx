/**
 * GitaVRExperience — Cinematic 2D Gita Experience
 *
 * Layered 2D composition replacing the Three.js 3D scene:
 * Layer 0: Battlefield backdrop (CSS gradients + SVG silhouettes)
 * Layer 1: Divine aura effect (CSS radial gradient)
 * Layer 2: Vishwaroop cosmic effect (CSS, Chapter 11 only)
 * Layer 3: Characters (Krishna + Arjuna SVG illustrations)
 * Layer 4: UI overlays (HUD, subtitles, chapter selector, question input, verse display)
 *
 * No WebGL, no Canvas, no Three.js — pure DOM/CSS/SVG.
 * Stable on all devices, beautiful animations, zero crash risk.
 */

'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'

// Illustrations
import BattlefieldBackdrop from './components/illustrations/BattlefieldBackdrop'
import KrishnaIllustration from './components/illustrations/KrishnaIllustration'
import ArjunaIllustration from './components/illustrations/ArjunaIllustration'

// Effects
import DivineAura2D from './components/effects/DivineAura2D'
import VishwaroopEffect2D from './components/effects/VishwaroopEffect2D'

// UI
import VRHud from './components/ui/VRHud'
import SubtitlePanel from './components/ui/SubtitlePanel'
import ChapterSelector from './components/ui/ChapterSelector'
import QuestionInput from './components/ui/QuestionInput'
import VerseDisplay from './components/ui/VerseDisplay'

// Audio
import AmbienceManager from './components/audio/AmbienceManager'

// State
import { useGitaVR } from '@/hooks/useGitaVR'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function GitaVRExperience() {
  const { askQuestion, startExperience } = useGitaVR()
  const sceneState = useGitaVRStore((s) => s.sceneState)

  useEffect(() => {
    startExperience()
  }, [startExperience])

  const handleAskQuestion = useCallback(async (question: string) => {
    await askQuestion(question)
  }, [askQuestion])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      {/* === LAYER 0: BATTLEFIELD BACKDROP === */}
      <BattlefieldBackdrop />

      {/* === LAYER 1: DIVINE AURA (behind Krishna) === */}
      <DivineAura2D />

      {/* === LAYER 2: VISHWAROOP COSMIC EFFECT (Chapter 11) === */}
      <VishwaroopEffect2D />

      {/* === LAYER 3: CHARACTERS === */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[8%]">
        {/* Character container — centered, responsive */}
        <div className="relative flex items-end gap-8 sm:gap-16 md:gap-24">
          {/* Krishna — left-center, larger */}
          <div
            className="relative z-10 transition-transform duration-1000"
            style={{
              transform: sceneState === 'vishwaroop' ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <KrishnaIllustration />
          </div>

          {/* Arjuna — right, slightly smaller and further back */}
          <div className="relative z-[5] opacity-90">
            <ArjunaIllustration />
          </div>
        </div>
      </div>

      {/* === LAYER 4: UI OVERLAYS === */}
      <div className="pointer-events-none absolute inset-0">
        {/* HUD — top center */}
        <div className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2">
          <VRHud />
        </div>

        {/* Subtitle Panel — bottom center, above question input */}
        <div className="pointer-events-none absolute bottom-[160px] left-1/2 -translate-x-1/2">
          <SubtitlePanel />
        </div>

        {/* Question Input — bottom center */}
        <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2">
          <QuestionInput onAskQuestion={handleAskQuestion} />
        </div>

        {/* Chapter Selector — centered overlay */}
        <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ChapterSelector />
        </div>

        {/* Verse Display — right side */}
        <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
          <VerseDisplay />
        </div>

        {/* Back button — top left */}
        <Link
          href="/"
          className="pointer-events-auto absolute left-4 top-4 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/60 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
        >
          ← Back
        </Link>

        {/* Scene badge — bottom center */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[#d4a44c]/30">
            Bhagavad Gita Divine Experience
          </p>
        </div>
      </div>

      {/* === AUDIO (non-visual) === */}
      <AmbienceManager />

      {/* Intro overlay — fade out after scene starts */}
      {sceneState === 'loading' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-48 w-48 animate-pulse rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(212, 164, 76, 0.15) 0%, transparent 70%)',
              }}
            />
            <span
              className="relative text-7xl"
              style={{
                color: '#d4a44c',
                textShadow: '0 0 30px rgba(212, 164, 76, 0.5)',
              }}
            >
              &#x0950;
            </span>
          </div>
          <p className="mt-8 text-sm tracking-widest text-[#d4a44c]/60">
            Preparing the Sacred Battlefield...
          </p>
        </div>
      )}
    </div>
  )
}
