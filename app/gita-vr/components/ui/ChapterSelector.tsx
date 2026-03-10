/**
 * ChapterSelector — Chapter navigation for VR
 *
 * Displays all 18 Gita chapters as selectable orbs.
 * Active chapter glows golden. Selecting a chapter
 * transitions the scene to that chapter's teaching.
 */

'use client'

import { Html } from '@react-three/drei'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import { CHAPTERS } from '@/data/gitaVerses'

export default function ChapterSelector() {
  const showChapterSelector = useGitaVRStore((s) => s.showChapterSelector)
  const currentChapter = useGitaVRStore((s) => s.currentChapter)
  const setCurrentChapter = useGitaVRStore((s) => s.setCurrentChapter)
  const setCurrentVerse = useGitaVRStore((s) => s.setCurrentVerse)
  const setSceneState = useGitaVRStore((s) => s.setSceneState)
  const setShowChapterSelector = useGitaVRStore((s) => s.setShowChapterSelector)

  if (!showChapterSelector) return null

  const handleChapterSelect = (chapter: number) => {
    setCurrentChapter(chapter)
    setCurrentVerse(1)
    setShowChapterSelector(false)

    if (chapter === 11) {
      setSceneState('vishwaroop')
    } else {
      setSceneState('teaching')
    }
  }

  return (
    <Html
      position={[0, 3, -2]}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="max-h-[70vh] w-[400px] overflow-y-auto rounded-xl border border-[#d4a44c]/20 bg-black/90 p-4 backdrop-blur-lg">
        <h3 className="mb-3 text-center text-sm tracking-widest text-[#d4a44c]">
          SELECT CHAPTER
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {CHAPTERS.map((chapter) => {
            const isActive = chapter.number === currentChapter
            const isVishwaroop = chapter.number === 11
            return (
              <button
                key={chapter.number}
                onClick={() => handleChapterSelect(chapter.number)}
                className={`group relative rounded-lg p-2 text-left transition ${
                  isActive
                    ? 'bg-[#d4a44c]/20 ring-1 ring-[#d4a44c]/40'
                    : 'hover:bg-white/5'
                } ${isVishwaroop ? 'ring-1 ring-purple-400/30' : ''}`}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-lg font-bold ${isActive ? 'text-[#d4a44c]' : 'text-white/70'}`}>
                    {chapter.number}
                  </span>
                  <span className="text-[8px] text-white/30">
                    ({chapter.totalVerses})
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[9px] text-white/40">
                  {chapter.sanskritName}
                </p>
                <p className="truncate text-[8px] text-white/25">
                  {chapter.name}
                </p>
                {isVishwaroop && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-purple-500/80 px-1.5 py-0.5 text-[7px] text-white">
                    Cosmic
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setShowChapterSelector(false)}
          className="mt-3 w-full rounded-md bg-white/5 py-1.5 text-xs text-white/40 transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </Html>
  )
}
