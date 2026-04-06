/**
 * Gita Chapter Browser — All 18 chapters in a 2-column grid.
 *
 * Filterable by yoga type. Includes "Play Entire Gita" button
 * and total stats bar.
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { ChapterCard } from '@/components/mobile/vibe/ChapterCard'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { createChapterTracks } from '@/lib/kiaan-vibe/gita-voice-tracks'
import { SUPPORTED_LANGUAGES } from '@/lib/kiaan-vibe/gita'
import {
  GITA_MOBILE_CHAPTERS,
  GITA_STATS,
} from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

const YOGA_FILTERS: { id: string; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'karma',  label: 'Karma Yoga' },
  { id: 'jnana',  label: 'Jnana Yoga' },
  { id: 'bhakti', label: 'Bhakti Yoga' },
  { id: 'raja',   label: 'Raja Yoga' },
]

export default function GitaChaptersPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [loadingAll, setLoadingAll] = useState(false)
  const { triggerHaptic } = useHapticFeedback()
  const { setQueue, play, gitaLang, setGitaLang } = usePlayerStore()

  const totalHours = Math.round(GITA_STATS.totalDurationMinutes / 60)

  const filteredChapters = useMemo(() => {
    if (activeFilter === 'all') return GITA_MOBILE_CHAPTERS
    return GITA_MOBILE_CHAPTERS.filter(c => c.yogaType === activeFilter)
  }, [activeFilter])

  const handlePlayEntireGita = useCallback(async () => {
    triggerHaptic('heavy')
    setLoadingAll(true)
    try {
      // Load all chapters sequentially to build the full queue
      const allTracks = []
      for (const chapter of GITA_MOBILE_CHAPTERS) {
        const tracks = await createChapterTracks(chapter.number, gitaLang, 'divine')
        allTracks.push(...tracks)
      }
      if (allTracks.length > 0) {
        setQueue(allTracks, 0)
        play(allTracks[0])
      }
    } catch (e) {
      console.warn('[GitaChapters] Failed to load all chapters:', e)
    } finally {
      setLoadingAll(false)
    }
  }, [triggerHaptic, setQueue, play, gitaLang])

  return (
    <MobileAppShell title={'\u0936\u094D\u0930\u0940\u092E\u0926\u094D \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E'} subtitle={'18 Chapters \u00B7 700 Verses'} showBack>
      <div className="px-4 pb-32">
        {/* Subtitle */}
        <p
          className="text-[11px] text-center mb-4 font-[family-name:var(--font-scripture)] italic"
          style={{ color: '#6B6355' }}
        >
          18 Chapters {'\u00B7'} 700 Verses {'\u00B7'} The eternal teaching
        </p>

        {/* Yoga type filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-none">
          {YOGA_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => { setActiveFilter(filter.id); triggerHaptic('selection') }}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full text-[12px] transition-all font-[family-name:var(--font-ui)] ${
                activeFilter === filter.id
                  ? 'bg-[#D4A017] text-[#050714] font-medium'
                  : 'bg-transparent border border-[#D4A017]/20 text-[#D4A017]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4 scrollbar-none">
          <span className="text-[9px] text-[#D4A017] tracking-[0.14em] uppercase flex-shrink-0 font-[family-name:var(--font-ui)]">
            Listen in
          </span>
          {Object.values(SUPPORTED_LANGUAGES).map(lang => {
            const isSelected = lang.code === gitaLang
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => { setGitaLang(lang.code); triggerHaptic('selection') }}
                aria-pressed={isSelected}
                className="flex-shrink-0 h-7 px-3 rounded-full text-[11px] transition-all font-[family-name:var(--font-ui)]"
                style={{
                  color: isSelected ? '#D4A017' : '#B8AE98',
                  backgroundColor: isSelected ? 'rgba(212,160,23,0.15)' : 'transparent',
                  border: isSelected
                    ? '1px solid rgba(212,160,23,0.5)'
                    : '1px solid rgba(212,160,23,0.15)',
                  fontWeight: isSelected ? 500 : 400,
                }}
              >
                {lang.nativeName}
              </button>
            )
          })}
        </div>

        {/* Total stats bar */}
        <div
          className="rounded-2xl p-4 mb-5 flex justify-around"
          style={{
            background: 'linear-gradient(135deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.12)',
          }}
        >
          {[
            { value: '700', label: 'Verses' },
            { value: `~${totalHours}`, label: 'Hours' },
            { value: '4', label: 'Voices' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-[family-name:var(--font-divine)] text-[28px] text-[#EDE8DC]" style={{ fontWeight: 300 }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-[#6B6355] font-[family-name:var(--font-ui)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Chapter grid (2 columns) */}
        <div className="grid grid-cols-2 gap-3">
          {filteredChapters.map(chapter => (
            <ChapterCard
              key={chapter.number}
              chapter={chapter}
              onPress={() => {
                triggerHaptic('medium')
                router.push(`/m/kiaan-vibe/chapters/${chapter.number}`)
              }}
            />
          ))}
        </div>

        {/* Empty state for filters */}
        {filteredChapters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[#6B6355] font-[family-name:var(--font-divine)]">
              No chapters match this filter
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom: Play Entire Gita */}
      <div
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] left-0 right-0 px-4 pb-3 pt-2 z-30"
        style={{
          background: 'linear-gradient(transparent, #050714 30%)',
        }}
      >
        <motion.button
          onClick={handlePlayEntireGita}
          disabled={loadingAll}
          className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 font-[family-name:var(--font-ui)]"
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.3), rgba(212,160,23,0.15))',
            border: '1px solid rgba(212,160,23,0.4)',
            color: '#D4A017',
            fontWeight: 500,
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Play size={18} fill="#D4A017" />
          <span className="text-[14px]">
            {loadingAll ? 'Loading...' : 'Play Entire Gita'}
          </span>
          <span className="text-[11px] opacity-70">~{totalHours} hours</span>
        </motion.button>
      </div>
    </MobileAppShell>
  )
}
