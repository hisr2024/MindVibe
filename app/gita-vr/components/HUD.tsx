/**
 * HUD — Minimal heads-up display overlay.
 *
 * Top-left:  Chapter indicator + toggle for chapter navigation
 * Top-right: Back/exit button
 * Designed to be unobtrusive — fades slightly when not interacted with.
 */

'use client'

import { useGitaVRStore } from '@/stores/gitaVRStore'
import Link from 'next/link'

export default function HUD() {
  const currentChapter = useGitaVRStore((s) => s.currentChapter)
  const showChapterNav = useGitaVRStore((s) => s.showChapterNav)
  const toggleChapterNav = useGitaVRStore((s) => s.toggleChapterNav)

  return (
    <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
      {/* Chapter indicator */}
      <button
        onClick={toggleChapterNav}
        aria-label={`Chapter ${currentChapter}. Open chapter navigation`}
        aria-expanded={showChapterNav}
        className="rounded-lg border border-amber-400/15 bg-black/30 px-3 py-1.5 text-sm text-amber-200/70 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-amber-200"
      >
        Chapter {currentChapter}
        <svg
          className="ml-1.5 inline-block h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Exit */}
      <Link
        href="/"
        aria-label="Exit Gita experience"
        className="rounded-lg border border-amber-400/15 bg-black/30 px-3 py-1.5 text-sm text-amber-200/50 backdrop-blur-md transition-colors hover:bg-black/50 hover:text-amber-200"
      >
        Exit
      </Link>
    </div>
  )
}
