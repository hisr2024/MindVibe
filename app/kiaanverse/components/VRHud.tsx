/**
 * VRHud — Minimal heads-up display overlay for Kiaanverse.
 *
 * Top-left:  Chapter indicator + scene name
 * Top-right: Exit button
 * Top-center: Mode toggle (Recital | Sakha)
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
    <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
      {/* Left: Chapter + Scene */}
      <div className="flex gap-2">
        <button
          onClick={toggleChapterNav}
          aria-label={`Chapter ${currentChapter}. Open chapter navigation`}
          aria-expanded={showChapterNav}
          className="rounded-lg border border-amber-400/15 bg-black/40 px-3 py-1.5 text-sm text-amber-200/70 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-amber-200"
        >
          Ch. {currentChapter}
          <svg className="ml-1 inline-block h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          onClick={toggleSceneSelector}
          className="rounded-lg border border-amber-400/15 bg-black/40 px-3 py-1.5 text-sm text-amber-200/50 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-amber-200"
        >
          {SCENE_LABELS[currentScene] || 'Scene'}
        </button>
      </div>

      {/* Center: Mode toggle */}
      <button
        onClick={toggleModeSelector}
        className="rounded-lg border border-amber-400/15 bg-black/40 px-4 py-1.5 text-xs uppercase tracking-widest text-amber-300/60 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-amber-300"
      >
        {interactionMode === 'recital' ? 'Recital Mode' : 'Sakha Mode'}
      </button>

      {/* Right: Exit */}
      <Link
        href="/"
        aria-label="Exit Kiaanverse"
        className="rounded-lg border border-amber-400/15 bg-black/40 px-3 py-1.5 text-sm text-amber-200/40 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-amber-200"
      >
        Exit
      </Link>
    </div>
  )
}
