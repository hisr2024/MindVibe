/**
 * VRHud — Minimal, barely-there heads-up display.
 *
 * Whispered guidance, not loud controls. Premium transparency.
 * Top-left: Chapter + Scene selectors
 * Top-center: Mode indicator
 * Top-right: Exit
 */

'use client'

import { useKiaanverseStore } from '@/stores/kiaanverseStore'
import Link from 'next/link'

const SCENE_LABELS: Record<string, string> = {
  'cosmic-ocean': 'Cosmic Ocean',
  'kurukshetra': 'Kurukshetra',
  'dialogue-space': 'Sacred Grove',
  'vishvarupa': 'Vishvarupa',
  'lotus-meditation': 'Lotus Realm',
}

export default function VRHud() {
  const currentChapter = useKiaanverseStore((s) => s.currentChapter)
  const currentScene = useKiaanverseStore((s) => s.currentScene)
  const toggleChapterNav = useKiaanverseStore((s) => s.toggleChapterNav)
  const toggleSceneSelector = useKiaanverseStore((s) => s.toggleSceneSelector)
  const toggleModeSelector = useKiaanverseStore((s) => s.toggleModeSelector)
  const showChapterNav = useKiaanverseStore((s) => s.showChapterNav)
  const interactionMode = useKiaanverseStore((s) => s.interactionMode)

  return (
    <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between px-5 py-4">
      {/* Left: Chapter + Scene */}
      <div className="flex gap-2">
        <button
          onClick={toggleChapterNav}
          aria-label={`Chapter ${currentChapter}. Open chapter navigation`}
          aria-expanded={showChapterNav}
          className="rounded-full border border-white/[0.06] bg-black/30 px-3.5 py-1.5 text-[11px] font-light tracking-wider text-amber-200/50 backdrop-blur-xl transition-all hover:border-white/[0.12] hover:text-amber-200/80"
        >
          Ch. {currentChapter}
          <svg className="ml-1.5 inline-block h-2.5 w-2.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          onClick={toggleSceneSelector}
          className="rounded-full border border-white/[0.06] bg-black/30 px-3.5 py-1.5 text-[11px] font-light tracking-wider text-amber-200/35 backdrop-blur-xl transition-all hover:border-white/[0.12] hover:text-amber-200/70"
        >
          {SCENE_LABELS[currentScene] || 'Scene'}
        </button>
      </div>

      {/* Center: Mode */}
      <button
        onClick={toggleModeSelector}
        className="rounded-full border border-white/[0.06] bg-black/30 px-4 py-1.5 text-[10px] font-light uppercase tracking-[0.2em] text-amber-300/40 backdrop-blur-xl transition-all hover:border-white/[0.12] hover:text-amber-300/70"
      >
        {interactionMode === 'recital' ? 'Recital' : 'Sakha'}
      </button>

      {/* Right: Exit */}
      <Link
        href="/"
        aria-label="Exit Kiaanverse"
        className="rounded-full border border-white/[0.06] bg-black/30 px-3.5 py-1.5 text-[11px] font-light tracking-wider text-amber-200/30 backdrop-blur-xl transition-all hover:border-white/[0.12] hover:text-amber-200/60"
      >
        Exit
      </Link>
    </div>
  )
}
