/**
 * Verse Full-Screen Reader — Single verse with complete display.
 *
 * Shows the full Sanskrit text, transliteration, translation,
 * and KIAAN insight with the sacred reveal animations.
 * Route: /m/kiaan-vibe/verse/2-47 (chapter-verse)
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Play, Pause, Bookmark, Share2, ChevronLeft, ChevronRight, Globe, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { SanskritReveal } from '@/components/mobile/vibe/SanskritReveal'
import { GitaVoiceSelector } from '@/components/mobile/vibe/GitaVoiceSelector'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { loadGitaLanguage, SUPPORTED_LANGUAGES } from '@/lib/kiaan-vibe/gita'
import { createVerseTrack, type GitaVoiceStyle } from '@/lib/kiaan-vibe/gita-voice-tracks'
import {
  getGitaMobileChapter,
  VOICE_TO_STYLE_MAP,
  VOICE_TO_SPEED_MAP,
  getGitaVoiceConfig,
} from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface VerseData {
  sanskrit: string
  transliteration: string
  translation: string
}

export default function VerseReaderPage() {
  const params = useParams()
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const play = usePlayerStore(s => s.play)
  const pause = usePlayerStore(s => s.pause)
  const stop = usePlayerStore(s => s.stop)
  const setQueue = usePlayerStore(s => s.setQueue)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const currentTrack = usePlayerStore(s => s.currentTrack)

  // Is THIS verse currently the active track?
  const isThisVerseActive = !!currentTrack?.id?.startsWith(`gita-voice-${chapterNum}-${verseNum}-`)
  const isThisVersePlaying = isThisVerseActive && isPlaying

  // Parse chapter-verse from URL (e.g. "2-47")
  const [chapterNum, verseNum] = useMemo(() => {
    const parts = String(params.chapterVerse).split('-').map(Number)
    return [parts[0] || 1, parts[1] || 1]
  }, [params.chapterVerse])

  const chapter = useMemo(() => getGitaMobileChapter(chapterNum), [chapterNum])
  const [verse, setVerse] = useState<VerseData | null>(null)
  const [selectedVoice, setSelectedVoice] = useState('divine-krishna')
  const [selectedLang, setSelectedLang] = useState<string>('sa')
  const [showLangSheet, setShowLangSheet] = useState(false)
  const [translitVisible, setTranslitVisible] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load verse data — Sanskrit text is always loaded for the shloka, plus
  // the user-selected translation language (defaults to English).
  useEffect(() => {
    let cancelled = false
    async function load() {
      const translationLang = selectedLang === 'sa' ? 'en' : selectedLang
      const [saData, langData] = await Promise.all([
        loadGitaLanguage('sa'),
        loadGitaLanguage(translationLang),
      ])
      if (cancelled) return

      const saChapter = saData?.chapters.find(c => c.chapterNumber === chapterNum)
      const langChapter = langData?.chapters.find(c => c.chapterNumber === chapterNum)
      const saVerse = saChapter?.verses.find(v => v.verseNumber === verseNum)
      const langVerse = langChapter?.verses.find(v => v.verseNumber === verseNum)

      if (saVerse || langVerse) {
        setVerse({
          sanskrit: saVerse?.sanskrit || '',
          transliteration: saVerse?.transliteration || '',
          translation: langVerse?.translation || saVerse?.translation || '',
        })
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterNum, verseNum, selectedLang])

  // Reset transliteration visibility when verse changes
  useEffect(() => {
    setTranslitVisible(false)
  }, [chapterNum, verseNum])

  // Stop playback automatically whenever the user navigates to a new verse
  // — no more "runs on its own that I can't stop".
  useEffect(() => {
    stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterNum, verseNum])

  // When the user picks a different voice, stop the current playback so
  // the next tap on Listen synthesizes with the newly chosen voice.
  const handleSelectVoice = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId)
    if (isThisVerseActive) stop()
    triggerHaptic('selection')
  }, [isThisVerseActive, stop, triggerHaptic])

  const handleSelectLanguage = useCallback((langCode: string) => {
    setSelectedLang(langCode)
    if (isThisVerseActive) stop()
    triggerHaptic('selection')
  }, [isThisVerseActive, stop, triggerHaptic])

  const handlePlay = useCallback(() => {
    if (!verse || !chapter) return
    triggerHaptic('medium')
    // Toggle: if this verse is already playing, pause it.
    if (isThisVersePlaying) {
      pause()
      return
    }
    // If paused on this verse, resume.
    if (isThisVerseActive && !isPlaying) {
      play()
      return
    }
    const cfg = getGitaVoiceConfig(selectedVoice)
    const voiceStyle = cfg.style as GitaVoiceStyle
    const speed = cfg.speed
    const track = createVerseTrack(
      chapterNum,
      verseNum,
      verse.sanskrit,
      verse.transliteration,
      verse.translation,
      selectedLang,
      voiceStyle,
      speed,
      selectedVoice,
      cfg.gender,
    )
    track.gitaData = {
      chapter: chapterNum,
      verse: verseNum,
      chapterName: chapter.english,
      chapterSanskrit: chapter.sanskrit,
      sanskrit: verse.sanskrit,
      transliteration: verse.transliteration,
      translation: verse.translation,
      yogaType: chapter.yogaType,
    }
    setQueue([track], 0)
    play(track)
  }, [verse, chapter, chapterNum, verseNum, selectedVoice, selectedLang, isThisVersePlaying, isThisVerseActive, isPlaying, triggerHaptic, setQueue, play, pause])

  const handleSave = useCallback(() => {
    triggerHaptic('medium')
    setSaved(true)
    try {
      const key = 'mindvibe-sacred-library'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const verseKey = `${chapterNum}-${verseNum}`
      if (!existing.includes(verseKey)) {
        existing.push(verseKey)
        localStorage.setItem(key, JSON.stringify(existing))
      }
    } catch { /* localStorage unavailable */ }
    setTimeout(() => setSaved(false), 1500)
  }, [chapterNum, verseNum, triggerHaptic])

  const handleShare = useCallback(async () => {
    if (!verse) return
    triggerHaptic('light')
    const text = [
      verse.sanskrit,
      '',
      verse.translation,
      '',
      `Bhagavad Gita ${chapterNum}.${verseNum}`,
      '\u2014 via Kiaanverse',
    ].join('\n')

    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard?.writeText(text)
    }
  }, [verse, chapterNum, verseNum, triggerHaptic])

  const navigateVerse = useCallback((delta: number) => {
    const maxVerse = chapter?.verseCount || 1
    let newVerse = verseNum + delta
    let newChapter = chapterNum

    if (newVerse < 1) {
      // Go to previous chapter's last verse
      const prevChapter = getGitaMobileChapter(chapterNum - 1)
      if (prevChapter) {
        newChapter = prevChapter.number
        newVerse = prevChapter.verseCount
      } else {
        return
      }
    } else if (newVerse > maxVerse) {
      // Go to next chapter's first verse
      const nextChapter = getGitaMobileChapter(chapterNum + 1)
      if (nextChapter) {
        newChapter = nextChapter.number
        newVerse = 1
      } else {
        return
      }
    }

    triggerHaptic('selection')
    router.push(`/m/kiaan-vibe/verse/${newChapter}-${newVerse}`)
  }, [chapter, chapterNum, verseNum, triggerHaptic, router])

  if (!chapter) {
    return (
      <MobileAppShell title="Verse" showBack>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#6B6355]">Verse not found</p>
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title={`BG ${chapterNum}.${verseNum}`}
      subtitle={chapter.english}
      showBack
    >
      <div className="px-4 pb-8">
        {/* Verse reference + navigation */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[10px] tracking-[0.1em] uppercase font-[family-name:var(--font-ui)]"
            style={{ color: '#D4A017' }}
          >
            BG {chapterNum}.{verseNum} \u00B7 {chapter.transliteration}
          </span>
          <div className="flex gap-2">
            <motion.button
              onClick={() => navigateVerse(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={16} color="#D4A017" />
            </motion.button>
            <motion.button
              onClick={() => navigateVerse(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={16} color="#D4A017" />
            </motion.button>
          </div>
        </div>

        {/* Sanskrit text */}
        {verse?.sanskrit && (
          <div className="mb-4">
            <SanskritReveal
              text={verse.sanskrit}
              staggerMs={60}
              onComplete={() => setTimeout(() => setTranslitVisible(true), 400)}
              style={{
                fontSize: 20,
                lineHeight: 2,
                textShadow: '0 0 15px rgba(212,160,23,0.3)',
              }}
            />
          </div>
        )}

        {/* Gold divider */}
        <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />

        {/* Transliteration */}
        {translitVisible && verse?.transliteration && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-[family-name:var(--font-scripture)] italic text-[13px] leading-relaxed text-[#B8AE98] mb-4"
          >
            {verse.transliteration}
          </motion.p>
        )}

        {/* Gold divider */}
        <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />

        {/* English translation */}
        {verse?.translation && (
          <p className="text-[15px] leading-relaxed text-[#EDE8DC] mb-6 font-[family-name:var(--font-ui)]" style={{ lineHeight: 1.8 }}>
            {verse.translation}
          </p>
        )}

        {/* Language selector — touch target opens a bottom sheet */}
        <div className="mb-4">
          <p className="text-[10px] text-[#6B6355] uppercase tracking-[0.1em] mb-2 font-[family-name:var(--font-ui)]">
            Listening language
          </p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowLangSheet(true); triggerHaptic('light') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-[family-name:var(--font-ui)]"
            style={{
              background: 'rgba(22,26,66,0.5)',
              border: '1px solid rgba(212,160,23,0.2)',
            }}
          >
            <Globe size={16} color="#D4A017" />
            <span className="text-lg leading-none">
              {SUPPORTED_LANGUAGES[selectedLang]?.flag || '🌐'}
            </span>
            <span className="text-[13px] text-[#EDE8DC] flex-1 text-left">
              {SUPPORTED_LANGUAGES[selectedLang]?.nativeName || 'Select language'}
            </span>
            <span className="text-[10px] text-[#6B6355] uppercase tracking-wider">Change</span>
          </motion.button>
        </div>

        {/* Voice selector */}
        <div className="mb-5">
          <GitaVoiceSelector
            selectedVoiceId={selectedVoice}
            onSelect={handleSelectVoice}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handlePlay}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-[family-name:var(--font-ui)]"
            style={{
              background: `linear-gradient(135deg, ${chapter.color}30, ${chapter.color}15)`,
              border: `1px solid ${chapter.color}40`,
              color: chapter.color,
              fontWeight: 500,
            }}
            whileTap={{ scale: 0.97 }}
          >
            {isThisVersePlaying ? (
              <Pause size={16} fill={chapter.color} />
            ) : (
              <Play size={16} fill={chapter.color} />
            )}
            <span className="text-[13px]">{isThisVersePlaying ? 'Pause' : isThisVerseActive ? 'Resume' : 'Listen'}</span>
          </motion.button>

          <motion.button
            onClick={handleSave}
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{
              background: saved ? 'rgba(212,160,23,0.15)' : 'rgba(22,26,66,0.5)',
              border: saved ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(212,160,23,0.15)',
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Bookmark size={18} color={saved ? '#D4A017' : '#B8AE98'} fill={saved ? '#D4A017' : 'none'} />
          </motion.button>

          <motion.button
            onClick={handleShare}
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(22,26,66,0.5)',
              border: '1px solid rgba(212,160,23,0.15)',
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Share2 size={18} color="#B8AE98" />
          </motion.button>
        </div>
      </div>

      {/* Language bottom sheet — full-width, touch-friendly list */}
      <MobileBottomSheet
        isOpen={showLangSheet}
        onClose={() => setShowLangSheet(false)}
        title="Listening language"
        subtitle="Choose the language for the divine voice"
        height="half"
        showHandle
        dismissible
      >
        <div className="px-1 pb-4 space-y-1">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => {
            const isSelected = code === selectedLang
            return (
              <motion.button
                key={code}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleSelectLanguage(code)
                  setShowLangSheet(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isSelected ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid rgba(212,160,23,0.4)' : '1px solid transparent',
                }}
              >
                <span className="text-xl leading-none">{info.flag}</span>
                <div className="flex-1 text-left">
                  <p
                    className="text-[14px] font-[family-name:var(--font-ui)]"
                    style={{
                      color: isSelected ? '#D4A017' : '#EDE8DC',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {info.nativeName}
                  </p>
                  <p className="text-[10px] text-[#6B6355]">{info.name}</p>
                </div>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#D4A017' }}
                  >
                    <Check size={12} color="#0B1037" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </MobileBottomSheet>
    </MobileAppShell>
  )
}
