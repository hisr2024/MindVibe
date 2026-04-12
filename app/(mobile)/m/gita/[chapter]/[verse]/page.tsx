/**
 * Mobile Gita Verse Detail Page
 *
 * Full verse view with Sanskrit reveal, transliteration, translation,
 * word meanings, commentary, Divine Voice Player, and verse navigation.
 * Route: /m/gita/13/28 (chapter/verse)
 *
 * Matches the Kiaanverse mobile theme (dark navy #050714, gold #D4A017).
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Copy,
  Check,
  Share2,
  Play,
  Pause,
  BookOpen,
} from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SanskritReveal } from '@/components/mobile/vibe/SanskritReveal'
import { GitaVoiceSelector } from '@/components/mobile/vibe/GitaVoiceSelector'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { loadGitaLanguage, SUPPORTED_LANGUAGES } from '@/lib/kiaan-vibe/gita'
import {
  createVerseTrack,
  createChapterTracks,
  type GitaVoiceStyle,
} from '@/lib/kiaan-vibe/gita-voice-tracks'
import {
  getGitaMobileChapter,
  getGitaVoiceConfig,
} from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface VerseData {
  sanskrit: string
  transliteration: string
  translation: string
  wordMeanings?: string
  commentary?: string
}

type TabId = 'meaning' | 'word' | 'commentary'

export default function MobileGitaVersePage() {
  const params = useParams()
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore()

  const chapter = Number(params.chapter)
  const verse = Number(params.verse)

  const chapterMeta = useMemo(() => getGitaMobileChapter(chapter), [chapter])

  const [verseData, setVerseData] = useState<VerseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('meaning')
  const [isLiked, setIsLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('divine-krishna')
  const [selectedLang, setSelectedLang] = useState('en')
  const [translitVisible, setTranslitVisible] = useState(false)

  // Check if this verse's track is currently playing
  const isThisVersePlaying = useMemo(() => {
    if (!isPlaying || !currentTrack?.gitaData) return false
    return currentTrack.gitaData.chapter === chapter && currentTrack.gitaData.verse === verse
  }, [isPlaying, currentTrack, chapter, verse])

  // Load verse data from local Gita JSON files
  useEffect(() => {
    if (!chapter || !verse) return
    let cancelled = false
    setLoading(true)
    setTranslitVisible(false)

    async function load() {
      const [saData, enData] = await Promise.all([
        loadGitaLanguage('sa'),
        loadGitaLanguage('en'),
      ])
      if (cancelled) return

      const saChapter = saData?.chapters.find(c => c.chapterNumber === chapter)
      const enChapter = enData?.chapters.find(c => c.chapterNumber === chapter)
      const saVerse = saChapter?.verses.find(v => v.verseNumber === verse)
      const enVerse = enChapter?.verses.find(v => v.verseNumber === verse)

      if (saVerse || enVerse) {
        setVerseData({
          sanskrit: saVerse?.sanskrit || '',
          transliteration: saVerse?.transliteration || '',
          translation: enVerse?.translation || saVerse?.translation || '',
        })
      } else {
        setVerseData(null)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [chapter, verse])

  // Play this verse with the selected voice
  const handlePlay = useCallback(() => {
    if (!verseData || !chapterMeta) return
    triggerHaptic('medium')
    const cfg = getGitaVoiceConfig(selectedVoice)
    const voiceStyle = cfg.style as GitaVoiceStyle
    const track = createVerseTrack(
      chapter,
      verse,
      verseData.sanskrit,
      verseData.transliteration,
      verseData.translation,
      selectedLang,
      voiceStyle,
      cfg.speed,
      selectedVoice,
      cfg.gender,
    )
    track.gitaData = {
      chapter,
      verse,
      chapterName: chapterMeta.english,
      chapterSanskrit: chapterMeta.sanskrit,
      sanskrit: verseData.sanskrit,
      transliteration: verseData.transliteration,
      translation: verseData.translation,
      yogaType: chapterMeta.yogaType,
    }
    setQueue([track], 0)
    play(track)
  }, [verseData, chapterMeta, chapter, verse, selectedVoice, selectedLang, triggerHaptic, setQueue, play])

  // Play entire chapter
  const handlePlayChapter = useCallback(async () => {
    if (!chapterMeta) return
    triggerHaptic('heavy')
    const cfg = getGitaVoiceConfig(selectedVoice)
    const voiceStyle = cfg.style as GitaVoiceStyle
    const tracks = await createChapterTracks(chapter, selectedLang, voiceStyle)
    tracks.forEach(t => {
      if (t.src && !t.src.includes('voice_id=')) {
        t.src = t.src + `&voice_id=${encodeURIComponent(selectedVoice)}`
      }
      if (t.ttsMetadata) {
        t.ttsMetadata.voiceId = selectedVoice
        t.ttsMetadata.voiceGender = cfg.gender
      }
    })
    if (tracks.length > 0) {
      setQueue(tracks, 0)
      play(tracks[0])
    }
  }, [chapterMeta, chapter, selectedVoice, selectedLang, triggerHaptic, setQueue, play])

  // Copy verse text
  const handleCopy = useCallback(() => {
    if (!verseData) return
    triggerHaptic('light')
    const text = [
      verseData.sanskrit,
      '',
      verseData.transliteration,
      '',
      `"${verseData.translation}"`,
      '',
      `— Bhagavad Gita ${chapter}.${verse}`,
      '— via Kiaanverse',
    ].join('\n')
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [verseData, chapter, verse, triggerHaptic])

  // Share verse
  const handleShare = useCallback(async () => {
    if (!verseData) return
    triggerHaptic('light')
    const text = [
      verseData.sanskrit,
      '',
      `"${verseData.translation}"`,
      '',
      `Bhagavad Gita ${chapter}.${verse}`,
      '— via Kiaanverse',
    ].join('\n')
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard?.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [verseData, chapter, verse, triggerHaptic])

  // Navigate to adjacent verses (wraps across chapters)
  const navigateVerse = useCallback((delta: number) => {
    if (!chapterMeta) return
    const maxVerse = chapterMeta.verseCount
    let newVerse = verse + delta
    let newChapter = chapter

    if (newVerse < 1) {
      const prevChapter = getGitaMobileChapter(chapter - 1)
      if (prevChapter) {
        newChapter = prevChapter.number
        newVerse = prevChapter.verseCount
      } else {
        return
      }
    } else if (newVerse > maxVerse) {
      const nextChapter = getGitaMobileChapter(chapter + 1)
      if (nextChapter) {
        newChapter = nextChapter.number
        newVerse = 1
      } else {
        return
      }
    }

    triggerHaptic('selection')
    router.push(`/m/gita/${newChapter}/${newVerse}`)
  }, [chapterMeta, chapter, verse, triggerHaptic, router])

  // Toggle favourite in localStorage
  const handleLike = useCallback(() => {
    triggerHaptic('medium')
    setIsLiked(prev => {
      const next = !prev
      try {
        const key = 'mindvibe-sacred-library'
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]')
        const verseKey = `${chapter}-${verse}`
        if (next && !existing.includes(verseKey)) {
          existing.push(verseKey)
        } else if (!next) {
          const idx = existing.indexOf(verseKey)
          if (idx > -1) existing.splice(idx, 1)
        }
        localStorage.setItem(key, JSON.stringify(existing))
      } catch { /* localStorage unavailable */ }
      return next
    })
  }, [chapter, verse, triggerHaptic])

  // Load favourite state on mount
  useEffect(() => {
    try {
      const key = 'mindvibe-sacred-library'
      const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]')
      setIsLiked(existing.includes(`${chapter}-${verse}`))
    } catch { /* */ }
  }, [chapter, verse])

  // Not found
  if (!loading && (!verseData || !chapterMeta)) {
    return (
      <MobileAppShell title="Verse" showBack>
        <div className="flex flex-col items-center justify-center h-64 gap-3 px-6">
          <span className="text-3xl">📖</span>
          <p className="font-[family-name:var(--font-divine)] italic text-lg text-[#EDE8DC]">
            Verse not found
          </p>
          <p className="text-[13px] text-[#6B6355] text-center">
            BG {chapter}.{verse} could not be loaded
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-2 px-5 py-2.5 rounded-2xl text-[13px] text-[#D4A017] font-[family-name:var(--font-ui)]"
            style={{
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.3)',
            }}
          >
            ← Go back
          </button>
        </div>
      </MobileAppShell>
    )
  }

  // Loading state
  if (loading) {
    return (
      <MobileAppShell title="Verse" showBack>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(212,160,23,0.15), rgba(5,7,20,0.9))',
              border: '1.5px solid rgba(212,160,23,0.4)',
            }}
          >
            <span className="font-[family-name:var(--font-divine)] text-3xl text-[#F0C040]">ॐ</span>
          </motion.div>
          <span className="font-[family-name:var(--font-scripture)] italic text-sm text-[#B8AE98]">
            Opening the sacred text...
          </span>
        </div>
      </MobileAppShell>
    )
  }

  const data = verseData!
  const meta = chapterMeta!

  return (
    <MobileAppShell
      title={`BG ${chapter}.${verse}`}
      subtitle={meta.english}
      showBack
    >
      <div className="px-4 pb-8">

        {/* Verse reference + actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* BG badge */}
            <div
              className="px-3 py-1 rounded-lg font-[family-name:var(--font-ui)] text-sm font-bold tracking-wide"
              style={{
                background: 'radial-gradient(circle, rgba(212,160,23,0.2), rgba(22,26,66,0.8))',
                border: '1px solid rgba(212,160,23,0.45)',
                color: '#F0C040',
              }}
            >
              BG {chapter}.{verse}
            </div>
            <div>
              <div className="font-[family-name:var(--font-scripture)] text-[11px] text-[#D4A017] leading-snug">
                {meta.sanskrit}
              </div>
              <div className="font-[family-name:var(--font-ui)] text-[10px] text-[#6B6355]">
                {meta.transliteration}
              </div>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex gap-1.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              aria-label="Copy verse"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(22,26,66,0.6)',
                border: copied ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#B8AE98" />}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              aria-label="Share verse"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(22,26,66,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Share2 size={14} color="#B8AE98" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: isLiked ? 'rgba(212,160,23,0.15)' : 'rgba(22,26,66,0.6)',
                border: isLiked ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Heart size={15} color={isLiked ? '#D4A017' : '#B8AE98'} fill={isLiked ? '#D4A017' : 'none'} />
            </motion.button>
          </div>
        </div>

        {/* Sanskrit block */}
        <div
          className="rounded-2xl p-4 mb-3"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.1), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.2)',
            borderTop: '2px solid rgba(212,160,23,0.6)',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] text-[#D4A017] tracking-[0.14em] uppercase font-[family-name:var(--font-ui)]">
              ✦ Sanskrit
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              aria-label={isThisVersePlaying ? 'Pause recitation' : 'Listen to Sanskrit recitation'}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-[family-name:var(--font-ui)]"
              style={{
                background: isThisVersePlaying ? 'rgba(212,160,23,0.2)' : 'rgba(212,160,23,0.1)',
                border: `1px solid rgba(212,160,23,${isThisVersePlaying ? '0.5' : '0.25'})`,
                color: '#D4A017',
              }}
            >
              {isThisVersePlaying ? <Pause size={12} /> : <Play size={12} fill="#D4A017" />}
              <span>{isThisVersePlaying ? 'Playing...' : 'Listen'}</span>
            </motion.button>
          </div>

          {data.sanskrit ? (
            <SanskritReveal
              text={data.sanskrit}
              staggerMs={60}
              onComplete={() => setTimeout(() => setTranslitVisible(true), 400)}
              style={{
                fontSize: 20,
                lineHeight: 2,
                color: '#F0C040',
                textShadow: '0 0 20px rgba(212,160,23,0.25)',
              }}
            />
          ) : (
            <p className="text-[#6B6355] italic text-sm font-[family-name:var(--font-scripture)]">
              Sanskrit text not available for this verse.
            </p>
          )}

          <div className="mt-1 font-[family-name:var(--font-scripture)] text-sm" style={{ color: 'rgba(240,192,64,0.5)' }}>
            {chapter}.{verse}।।
          </div>
        </div>

        {/* Transliteration block */}
        {translitVisible && data.transliteration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-4 mb-3"
            style={{
              background: 'linear-gradient(145deg, rgba(22,26,66,0.85), rgba(17,20,53,0.98))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="text-[9px] text-[#B8AE98] tracking-[0.14em] uppercase font-[family-name:var(--font-ui)] mb-2.5">
              Transliteration
            </div>
            <p className="font-[family-name:var(--font-scripture)] italic text-[15px] text-[#B8AE98] leading-relaxed">
              {data.transliteration}
            </p>
          </motion.div>
        )}

        {/* Gold divider */}
        <div className="h-px my-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />

        {/* Tabs: Meaning / Word by Word / Commentary */}
        <div
          className="flex gap-1 mb-3 p-0.5 rounded-xl"
          style={{
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
          role="tablist"
        >
          {([
            { id: 'meaning' as TabId, label: 'Meaning' },
            { id: 'word' as TabId, label: 'Word by Word' },
            { id: 'commentary' as TabId, label: 'Commentary' },
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => { triggerHaptic('selection'); setActiveTab(tab.id) }}
              className="flex-1 h-9 rounded-lg font-[family-name:var(--font-ui)] text-[11px] transition-all"
              style={{
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: activeTab === tab.id ? 'rgba(212,160,23,0.15)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(212,160,23,0.35)' : '1px solid transparent',
                color: activeTab === tab.id ? '#D4A017' : '#6B6355',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'meaning' && (
            <motion.div
              key="meaning"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-4 mb-3"
              style={{
                background: 'linear-gradient(145deg, rgba(22,26,66,0.85), rgba(17,20,53,0.98))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[9px] text-[#D4A017] tracking-[0.14em] uppercase font-[family-name:var(--font-ui)] mb-2.5">
                Translation · English
              </div>
              <p className="font-[family-name:var(--font-scripture)] italic text-[17px] text-[#EDE8DC] leading-relaxed">
                &ldquo;{data.translation}&rdquo;
              </p>
            </motion.div>
          )}

          {activeTab === 'word' && (
            <motion.div
              key="word"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-4 mb-3"
              style={{
                background: 'linear-gradient(145deg, rgba(22,26,66,0.85), rgba(17,20,53,0.98))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[9px] text-[#D4A017] tracking-[0.14em] uppercase font-[family-name:var(--font-ui)] mb-2.5">
                Word by Word
              </div>
              {data.wordMeanings ? (
                <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#B8AE98] leading-relaxed">
                  {data.wordMeanings}
                </p>
              ) : (
                <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#6B6355]">
                  Word-by-word meanings coming soon for this verse.
                </p>
              )}
            </motion.div>
          )}

          {activeTab === 'commentary' && (
            <motion.div
              key="commentary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-4 mb-3"
              style={{
                background: 'linear-gradient(145deg, rgba(22,26,66,0.85), rgba(17,20,53,0.98))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[9px] text-[#D4A017] tracking-[0.14em] uppercase font-[family-name:var(--font-ui)] mb-2.5">
                Commentary
              </div>
              {data.commentary ? (
                <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#B8AE98] leading-relaxed">
                  {data.commentary}
                </p>
              ) : (
                <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#6B6355]">
                  Commentary coming soon for this verse.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divine Voice Player */}
        <div
          className="rounded-2xl p-4 mb-3"
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.15)',
            borderTop: '2px solid rgba(212,160,23,0.4)',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Play size={14} color="#D4A017" />
              <span className="font-[family-name:var(--font-ui)] text-sm font-semibold text-[#EDE8DC]">
                Divine Voice Player
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push('/m/kiaan-vibe')}
              className="px-2.5 py-1 rounded-lg font-[family-name:var(--font-ui)] text-[10px] text-[#D4A017] cursor-pointer"
              style={{
                background: 'rgba(212,160,23,0.1)',
                border: '1px solid rgba(212,160,23,0.25)',
              }}
            >
              KIAAN Vibe →
            </button>
          </div>

          {/* Voice selector */}
          <div className="mb-4">
            <GitaVoiceSelector
              selectedVoiceId={selectedVoice}
              onSelect={setSelectedVoice}
            />
          </div>

          {/* Language pills */}
          <div className="mb-3">
            <p className="text-[10px] text-[#6B6355] uppercase tracking-[0.1em] mb-2 font-[family-name:var(--font-ui)]">
              Listen in
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {Object.values(SUPPORTED_LANGUAGES).map(lang => {
                const isSelected = lang.code === selectedLang
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { triggerHaptic('selection'); setSelectedLang(lang.code) }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] transition-all font-[family-name:var(--font-ui)]"
                    style={{
                      color: isSelected ? '#D4A017' : '#B8AE98',
                      backgroundColor: isSelected ? 'rgba(212,160,23,0.15)' : 'transparent',
                      border: isSelected
                        ? '1px solid rgba(212,160,23,0.5)'
                        : '1px solid rgba(212,160,23,0.15)',
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    {lang.flag} {lang.nativeName}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Play verse button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handlePlay}
            className="w-full h-[52px] rounded-3xl flex items-center justify-center gap-2 font-[family-name:var(--font-ui)] text-sm font-medium mb-2"
            style={{
              background: isThisVersePlaying
                ? 'rgba(22,26,66,0.6)'
                : 'linear-gradient(135deg, rgba(212,160,23,0.5), rgba(212,160,23,0.25))',
              border: `1px solid rgba(212,160,23,${isThisVersePlaying ? '0.2' : '0.45'})`,
              color: '#F8F6F0',
            }}
          >
            {isThisVersePlaying ? <Pause size={16} /> : <Play size={16} fill="#F8F6F0" />}
            <span>
              {isThisVersePlaying
                ? 'Pause'
                : `Play in ${SUPPORTED_LANGUAGES[selectedLang]?.nativeName || 'English'}`}
            </span>
          </motion.button>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSelectedLang('sa'); handlePlay() }}
              className="flex-1 h-11 rounded-xl font-[family-name:var(--font-ui)] text-[12px] text-[#B8AE98]"
              style={{
                background: 'rgba(22,26,66,0.6)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              🕉️ Sanskrit + English
            </button>
            <button
              type="button"
              onClick={handlePlayChapter}
              className="flex-1 h-11 rounded-xl font-[family-name:var(--font-ui)] text-[12px] text-[#B8AE98]"
              style={{
                background: 'rgba(22,26,66,0.6)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              ≡ Full Chapter {chapter}
            </button>
          </div>
        </div>

        {/* Verse navigation */}
        <div className="flex gap-2.5 mb-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigateVerse(-1)}
            disabled={verse <= 1 && chapter <= 1}
            className="flex-1 h-[52px] rounded-2xl flex items-center justify-center gap-1.5 font-[family-name:var(--font-ui)] text-[13px]"
            style={{
              background: (verse <= 1 && chapter <= 1) ? 'rgba(22,26,66,0.3)' : 'rgba(22,26,66,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: (verse <= 1 && chapter <= 1) ? '#6B6355' : '#EDE8DC',
            }}
          >
            <ChevronLeft size={16} />
            <span>Verse {verse > 1 ? verse - 1 : 'Prev'}</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigateVerse(1)}
            disabled={verse >= (meta.verseCount) && chapter >= 18}
            className="flex-1 h-[52px] rounded-2xl flex items-center justify-center gap-1.5 font-[family-name:var(--font-ui)] text-[13px]"
            style={{
              background: (verse >= meta.verseCount && chapter >= 18) ? 'rgba(22,26,66,0.3)' : 'rgba(22,26,66,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: (verse >= meta.verseCount && chapter >= 18) ? '#6B6355' : '#EDE8DC',
            }}
          >
            <span>Verse {verse < meta.verseCount ? verse + 1 : 'Next'}</span>
            <ChevronRight size={16} />
          </motion.button>
        </div>

        {/* View full chapter link */}
        <button
          type="button"
          onClick={() => router.push(`/m/gita/${chapter}`)}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-[family-name:var(--font-ui)] text-[13px] text-[#B8AE98]"
          style={{
            background: 'rgba(22,26,66,0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <BookOpen size={14} />
          <span>View All {meta.verseCount} Verses of Chapter {chapter}</span>
        </button>
      </div>
    </MobileAppShell>
  )
}
