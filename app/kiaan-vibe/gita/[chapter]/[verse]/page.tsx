'use client'

/**
 * KIAAN Vibe - Verse Detail
 *
 * Full verse with Sanskrit, transliteration, and translation.
 */

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Check, Play, Pause, ChevronLeft, ChevronRight, Share2, Volume2 } from 'lucide-react'
import { getVerse, getVerseMultiLang, GITA_CHAPTERS_META, SUPPORTED_LANGUAGES, getAvailableLanguages } from '@/lib/kiaan-vibe/gita'
import type { GitaVerse } from '@/lib/kiaan-vibe/types'

// Language code mapping for browser TTS
const TTS_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  sa: 'hi-IN', // Sanskrit uses Hindi voice as closest match
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
}

interface PageProps {
  params: Promise<{ chapter: string; verse: string }>
}

export default function VerseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const chapterNumber = parseInt(resolvedParams.chapter, 10)
  const verseNumber = parseInt(resolvedParams.verse, 10)
  const languageCode = searchParams.get('lang') || 'en'

  const [verse, setVerse] = useState<GitaVerse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showAllTranslations, setShowAllTranslations] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingSection, setPlayingSection] = useState<'sanskrit' | 'translation' | null>(null)

  const chapterMeta = GITA_CHAPTERS_META.find((c) => c.number === chapterNumber)
  const langInfo = SUPPORTED_LANGUAGES[languageCode] || SUPPORTED_LANGUAGES['en']

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Stop playing when verse changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      setPlayingSection(null)
    }
  }, [chapterNumber, verseNumber])

  const handlePlayVerse = useCallback((text: string, section: 'sanskrit' | 'translation', lang: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[GitaVerse] Speech synthesis not supported')
      return
    }

    const synth = window.speechSynthesis

    // If already playing this section, stop it
    if (isPlaying && playingSection === section) {
      synth.cancel()
      setIsPlaying(false)
      setPlayingSection(null)
      return
    }

    // Cancel any existing speech
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = TTS_LANGUAGE_MAP[lang] || 'en-US'
    utterance.rate = 0.9 // Slightly slower for clarity
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      setIsPlaying(true)
      setPlayingSection(section)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setPlayingSection(null)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setPlayingSection(null)
    }

    synth.speak(utterance)
  }, [isPlaying, playingSection])

  useEffect(() => {
    const loadVerse = async () => {
      setLoading(true)

      if (showAllTranslations) {
        const langs = await getAvailableLanguages()
        const multiVerse = await getVerseMultiLang(chapterNumber, verseNumber, langs)
        setVerse(multiVerse)
      } else {
        const singleVerse = await getVerse(chapterNumber, verseNumber, languageCode)
        setVerse(singleVerse)
      }

      setLoading(false)
    }
    loadVerse()
  }, [chapterNumber, verseNumber, languageCode, showAllTranslations])

  const handleCopy = async () => {
    if (!verse) return

    const text = [
      `Bhagavad Gita ${chapterNumber}.${verseNumber}`,
      '',
      verse.sanskrit,
      '',
      verse.transliteration,
      '',
      verse.translations[languageCode] || '',
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (!verse) return

    const shareData = {
      title: `Bhagavad Gita ${chapterNumber}.${verseNumber}`,
      text: verse.translations[languageCode] || verse.sanskrit || '',
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!verse) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40">Verse not found</p>
        <Link
          href={`/kiaan-vibe/gita/${chapterNumber}?lang=${languageCode}`}
          className="mt-4 inline-block text-orange-400 hover:text-orange-300"
        >
          Back to chapter
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div>
        <Link
          href={`/kiaan-vibe/gita/${chapterNumber}?lang=${languageCode}`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Chapter {chapterNumber}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 font-medium">
                {chapterNumber}.{verseNumber}
              </span>
            </div>
            <p className="text-white/60 text-sm">
              {chapterMeta?.nameSanskrit} • {chapterMeta?.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Copy verse"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Share verse"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sanskrit */}
      {verse.sanskrit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-orange-400">Sanskrit</p>
            <button
              onClick={() => handlePlayVerse(verse.sanskrit || '', 'sanskrit', 'sa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                playingSection === 'sanskrit'
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
              }`}
              aria-label={playingSection === 'sanskrit' ? 'Stop playing Sanskrit' : 'Play Sanskrit'}
            >
              {playingSection === 'sanskrit' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Listen
                </>
              )}
            </button>
          </div>
          <p className="text-xl text-orange-200 font-sanskrit leading-relaxed">
            {verse.sanskrit}
          </p>
        </motion.div>
      )}

      {/* Transliteration */}
      {verse.transliteration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <p className="text-xs uppercase tracking-wider text-white/50 mb-3">Transliteration</p>
          <p className="text-white/80 italic leading-relaxed">
            {verse.transliteration}
          </p>
        </motion.div>
      )}

      {/* Translation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-white/50">
            Translation • {langInfo.flag} {langInfo.nativeName}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllTranslations(!showAllTranslations)}
              className="text-xs text-orange-400 hover:text-orange-300"
            >
              {showAllTranslations ? 'Show current' : 'Show all'}
            </button>
          </div>
        </div>

        {showAllTranslations ? (
          <div className="space-y-4">
            {Object.entries(verse.translations).map(([lang, translation]) => {
              const langConfig = SUPPORTED_LANGUAGES[lang]
              return (
                <div key={lang} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/40">
                      {langConfig?.flag} {langConfig?.nativeName || lang}
                    </p>
                    <button
                      onClick={() => handlePlayVerse(translation, 'translation', lang)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                        playingSection === 'translation'
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                      aria-label={`Listen in ${langConfig?.name || lang}`}
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-white leading-relaxed">{translation}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <p className="text-white leading-relaxed mb-4">
              {verse.translations[languageCode] || 'Translation not available for this language.'}
            </p>
            {verse.translations[languageCode] && (
              <button
                onClick={() => handlePlayVerse(verse.translations[languageCode], 'translation', languageCode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  playingSection === 'translation'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
                aria-label={playingSection === 'translation' ? 'Stop playing translation' : 'Play translation'}
              >
                {playingSection === 'translation' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Listen to Translation
                  </>
                )}
              </button>
            )}
          </>
        )}
      </motion.div>

      {/* Play meditation CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href="/kiaan-vibe/library?category=spiritual"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:from-orange-400 hover:to-amber-400 transition-all"
        >
          <Play className="w-5 h-5" />
          Play Meditation Track
        </Link>
      </motion.div>

      {/* Verse navigation */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        {verseNumber > 1 ? (
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber}/${verseNumber - 1}?lang=${languageCode}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Verse {verseNumber - 1}
          </Link>
        ) : chapterNumber > 1 ? (
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber - 1}?lang=${languageCode}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Chapter
          </Link>
        ) : (
          <div />
        )}

        {chapterMeta && verseNumber < chapterMeta.verseCount ? (
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber}/${verseNumber + 1}?lang=${languageCode}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            Verse {verseNumber + 1}
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : chapterNumber < 18 ? (
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber + 1}?lang=${languageCode}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            Next Chapter
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
