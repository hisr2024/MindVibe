'use client'

/**
 * Voice-Enabled Verse Reader Component
 *
 * Enhanced verse display with integrated text-to-speech playback.
 * Allows users to read and listen to Gita verses simultaneously.
 *
 * Quantum Coherence: Visual and auditory channels create multi-modal
 * resonance, deepening comprehension through synchronized perception.
 */

import { useState } from 'react'
import { VoiceButton } from '@/components/voice/VoicePlayer'
import { BookOpen, Heart, Languages } from 'lucide-react'

interface Verse {
  id: string
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
  commentary?: string
  tags?: string[]
}

interface VoiceVerseReaderProps {
  userId: string
  verse: Verse
  language?: string
  onFavorite?: (verseId: string) => void
  isFavorited?: boolean
  showCommentary?: boolean
  className?: string
}

export function VoiceVerseReader({
  userId,
  verse,
  language = 'en',
  onFavorite,
  isFavorited = false,
  showCommentary = true,
  className = ''
}: VoiceVerseReaderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [includeCommentary, setIncludeCommentary] = useState(false)

  // Supported languages for verse audio
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'sa', name: 'Sanskrit' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'bn', name: 'Bengali' }
  ]

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(verse.id)
    }
  }

  return (
    <div className={`space-y-6 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-orange-950/20 via-purple-950/20 to-orange-950/20 p-6 md:p-8 ${className}`}>
      {/* Header with Chapter/Verse Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
          <BookOpen className="h-4 w-4" />
          <span>Chapter {verse.chapter}, Verse {verse.verse}</span>
        </div>

        <button
          onClick={handleFavorite}
          className="rounded-full p-2 transition hover:bg-orange-500/10"
        >
          <Heart
            className={`h-5 w-5 transition ${
              isFavorited
                ? 'fill-red-400 text-red-400'
                : 'text-orange-100/40 hover:text-orange-100/60'
            }`}
          />
        </button>
      </div>

      {/* Sanskrit Text */}
      {verse.sanskrit && (
        <div className="space-y-2 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-xs font-medium text-orange-100/70 uppercase tracking-wider">
            Sanskrit
          </h3>
          <p className="text-lg font-serif text-orange-50 leading-relaxed">
            {verse.sanskrit}
          </p>
        </div>
      )}

      {/* Transliteration */}
      {verse.transliteration && (
        <div className="space-y-2 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-xs font-medium text-orange-100/70 uppercase tracking-wider">
            Transliteration
          </h3>
          <p className="text-base italic text-orange-100/90 leading-relaxed">
            {verse.transliteration}
          </p>
        </div>
      )}

      {/* Translation with Voice */}
      <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-orange-100/70 uppercase tracking-wider">
            Translation
          </h3>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="h-3.5 w-3.5 text-orange-100/60" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-lg border border-orange-500/25 bg-[#0b0b0f] px-2 py-1 text-xs text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/70"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-base text-orange-50 leading-relaxed">
          {verse.translation}
        </p>

        {/* Voice Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <VoiceButton
            userId={userId}
            text={verse.translation}
            language={selectedLanguage}
            voiceType="wisdom"
          >
            Listen to Translation
          </VoiceButton>

          {showCommentary && verse.commentary && (
            <label className="flex items-center gap-2 text-xs text-orange-100/70">
              <input
                type="checkbox"
                checked={includeCommentary}
                onChange={(e) => setIncludeCommentary(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <span>Include commentary</span>
            </label>
          )}

          {includeCommentary && verse.commentary && (
            <VoiceButton
              userId={userId}
              text={`${verse.translation}... ${verse.commentary}`}
              language={selectedLanguage}
              voiceType="wisdom"
              className="bg-purple-500/10 text-purple-100/80 hover:bg-purple-500/20"
            >
              Listen with Commentary
            </VoiceButton>
          )}
        </div>
      </div>

      {/* Commentary (if shown and available) */}
      {showCommentary && verse.commentary && (
        <div className="space-y-2 rounded-2xl border border-purple-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-xs font-medium text-purple-100/70 uppercase tracking-wider">
            Commentary
          </h3>
          <p className="text-sm text-purple-100/80 leading-relaxed">
            {verse.commentary}
          </p>
        </div>
      )}

      {/* Tags */}
      {verse.tags && verse.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {verse.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-100/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Audio Info */}
      <div className="rounded-2xl border border-orange-500/20 bg-orange-950/20 p-3 text-xs text-orange-100/70">
        <p>
          🎤 Voice-enabled in {availableLanguages.length} languages. Select a language and click "Listen" to hear this verse narrated.
        </p>
      </div>
    </div>
  )
}
