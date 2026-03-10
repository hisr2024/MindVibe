/**
 * VRHud — Heads-up display for the VR experience
 *
 * Floating control panel with chapter indicator, question button,
 * volume control, subtitles toggle, and exit button.
 * Uses drei Html for DOM overlay in 3D scene.
 */

'use client'

import { Html } from '@react-three/drei'
import Link from 'next/link'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { CHAPTERS } from '@/data/gitaVerses'

export default function VRHud() {
  const currentChapter = useGitaVRStore((s) => s.currentChapter)
  const sceneState = useGitaVRStore((s) => s.sceneState)
  const subtitlesEnabled = useGitaVRStore((s) => s.subtitlesEnabled)
  const setSubtitlesEnabled = useGitaVRStore((s) => s.setSubtitlesEnabled)
  const setShowChapterSelector = useGitaVRStore((s) => s.setShowChapterSelector)
  const showChapterSelector = useGitaVRStore((s) => s.showChapterSelector)
  const volume = useGitaVRStore((s) => s.volume)
  const setVolume = useGitaVRStore((s) => s.setVolume)

  const chapterInfo = CHAPTERS[currentChapter - 1]

  return (
    <Html
      position={[0, 4.5, -3]}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex min-w-[320px] flex-col gap-2 rounded-xl border border-[#d4a44c]/20 bg-black/80 p-3 text-white backdrop-blur-lg select-none">
        {/* Chapter indicator */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowChapterSelector(!showChapterSelector)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition hover:bg-[#d4a44c]/20"
          >
            <span className="text-[#d4a44c]">Ch. {currentChapter}</span>
            <span className="text-xs text-white/60">
              {chapterInfo?.sanskritName || ''}
            </span>
            <span className="text-white/40">▼</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Subtitles toggle */}
            <button
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              className={`rounded-md px-2 py-1 text-xs transition ${
                subtitlesEnabled ? 'bg-[#d4a44c]/30 text-[#d4a44c]' : 'text-white/40 hover:text-white/60'
              }`}
              title="Toggle subtitles"
            >
              CC
            </button>

            {/* Volume */}
            <input
              type="range"
              min={0}
              max={100}
              value={volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/20 accent-[#d4a44c]"
              title="Volume"
            />
          </div>
        </div>

        {/* Scene state indicator */}
        <div className="text-center text-[10px] uppercase tracking-widest text-[#d4a44c]/50">
          {sceneState === 'intro' && 'Kurukshetra Battlefield'}
          {sceneState === 'teaching' && `${chapterInfo?.name || 'Teaching'}`}
          {sceneState === 'question' && 'Krishna Listens...'}
          {sceneState === 'vishwaroop' && 'Vishwaroop Darshan — The Cosmic Form'}
        </div>

        {/* Exit button */}
        <Link
          href="/"
          className="mt-1 block rounded-md bg-white/5 py-1 text-center text-xs text-white/40 transition hover:bg-white/10 hover:text-white/70"
        >
          Exit VR
        </Link>
      </div>
    </Html>
  )
}
