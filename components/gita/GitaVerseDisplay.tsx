'use client'

/**
 * Gita Verse Display Component
 *
 * Beautiful display for Bhagavad Gita verses with:
 * - Sanskrit text with transliteration
 * - Word-by-word meaning
 * - Full translation
 * - Commentary (optional)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Languages,
  MessageSquare,
  ChevronDown,
  Copy,
  Share2,
  Heart,
  Bookmark
} from 'lucide-react'

export interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  wordMeaning: string
  translation: string
  commentary?: string
}

export interface GitaVerseDisplayProps {
  verse: GitaVerse
  showTransliteration?: boolean
  showWordMeaning?: boolean
  showCommentary?: boolean
  isPlaying?: boolean
  className?: string
  onCopy?: () => void
  onShare?: () => void
  onFavorite?: () => void
  onBookmark?: () => void
}

export function GitaVerseDisplay({
  verse,
  showTransliteration = true,
  showWordMeaning = true,
  showCommentary = false,
  isPlaying = false,
  className = '',
  onCopy,
  onShare,
  onFavorite,
  onBookmark
}: GitaVerseDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    onFavorite?.()
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark?.()
  }

  return (
    <motion.div
      className={`
        relative rounded-2xl border border-white/10 bg-gradient-to-br
        from-[#0d0d10]/95 to-[#0a0a0d]/95 backdrop-blur-xl overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">
                Chapter {verse.chapter}, Verse {verse.verse}
              </h3>
              <p className="text-xs text-white/50">
                अध्याय {verse.chapter}, श्लोक {verse.verse}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite ? 'text-rose-400 bg-rose-500/10' : 'text-white/40 hover:text-white/60'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked ? 'text-amber-400 bg-amber-500/10' : 'text-white/40 hover:text-white/60'
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onCopy}
              className="p-2 rounded-lg text-white/40 hover:text-white/60 transition-colors"
              aria-label="Copy verse"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onShare}
              className="p-2 rounded-lg text-white/40 hover:text-white/60 transition-colors"
              aria-label="Share verse"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <motion.div
            className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 w-fit"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-orange-400 rounded-full"
                  animate={{ height: [4, 16, 4] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-orange-400">Now Playing</span>
          </motion.div>
        )}
      </div>

      {/* Sanskrit Text */}
      <div className="p-6 border-b border-white/5">
        <motion.p
          className="text-2xl leading-relaxed text-center font-sanskrit text-amber-200/90"
          animate={isPlaying ? {
            textShadow: [
              '0 0 20px rgba(251, 191, 36, 0)',
              '0 0 20px rgba(251, 191, 36, 0.3)',
              '0 0 20px rgba(251, 191, 36, 0)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {verse.sanskrit}
        </motion.p>
      </div>

      {/* Transliteration */}
      {showTransliteration && (
        <div className="px-6 py-4 border-b border-white/5">
          <button
            onClick={() => toggleSection('transliteration')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/70">Transliteration</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${
              expandedSection === 'transliteration' ? 'rotate-180' : ''
            }`} />
          </button>

          <AnimatePresence>
            {expandedSection === 'transliteration' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-3 text-sm text-white/60 italic leading-relaxed">
                  {verse.transliteration}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Word Meaning */}
      {showWordMeaning && (
        <div className="px-6 py-4 border-b border-white/5">
          <button
            onClick={() => toggleSection('wordMeaning')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/70">Word by Word</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${
              expandedSection === 'wordMeaning' ? 'rotate-180' : ''
            }`} />
          </button>

          <AnimatePresence>
            {expandedSection === 'wordMeaning' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  {verse.wordMeaning}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Translation */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Translation
        </h4>
        <p className="text-base text-white/80 leading-relaxed">
          {verse.translation}
        </p>
      </div>

      {/* Commentary */}
      {showCommentary && verse.commentary && (
        <div className="px-6 py-4">
          <button
            onClick={() => toggleSection('commentary')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/70">Commentary</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${
              expandedSection === 'commentary' ? 'rotate-180' : ''
            }`} />
          </button>

          <AnimatePresence>
            {expandedSection === 'commentary' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  {verse.commentary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default GitaVerseDisplay
