'use client'

/**
 * KIAAN Vibe - Bhagavad Gita Chapters
 *
 * List of all 18 chapters with language selection.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Globe, ChevronRight, Search } from 'lucide-react'
import {
  GITA_CHAPTERS_META,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  getAvailableLanguages,
  type LanguageInfo,
} from '@/lib/kiaan-vibe/gita'

export default function GitaChaptersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en'])
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  // Load available languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      const langs = await getAvailableLanguages()
      setAvailableLanguages(langs)

      // Auto-detect browser language
      const browserLang = detectBrowserLanguage()
      if (langs.includes(browserLang)) {
        setSelectedLanguage(browserLang)
      }
    }
    loadLanguages()
  }, [])

  // Filter chapters by search
  const filteredChapters = GITA_CHAPTERS_META.filter(
    (chapter) =>
      chapter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.nameSanskrit.includes(searchQuery) ||
      chapter.number.toString() === searchQuery
  )

  const currentLang = SUPPORTED_LANGUAGES[selectedLanguage] || SUPPORTED_LANGUAGES['en']

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          श्रीमद्भगवद्गीता
        </h1>
        <p className="text-white/60">
          Bhagavad Gita - 18 Chapters, 700 Verses
        </p>
      </div>

      {/* Language selector & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Language button */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Globe className="w-4 h-4 text-orange-400" />
            <span className="text-lg">{currentLang.flag}</span>
            <span>{currentLang.nativeName}</span>
          </button>

          {/* Language dropdown */}
          {showLanguageSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 z-50 w-64 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-2 max-h-64 overflow-y-auto">
                <p className="px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Select Language
                </p>
                {availableLanguages.map((code) => {
                  const lang = SUPPORTED_LANGUAGES[code]
                  if (!lang) return null
                  const isActive = code === selectedLanguage

                  return (
                    <button
                      key={code}
                      onClick={() => {
                        setSelectedLanguage(code)
                        setShowLanguageSelector(false)
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        ${isActive ? 'bg-orange-500/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{lang.nativeName}</p>
                        <p className="text-xs text-white/50">{lang.name}</p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Click outside to close language selector */}
      {showLanguageSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLanguageSelector(false)}
        />
      )}

      {/* Chapters List */}
      <div className="space-y-3">
        {filteredChapters.map((chapter, index) => (
          <Link
            key={chapter.number}
            href={`/kiaan-vibe/gita/${chapter.number}?lang=${selectedLanguage}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all"
            >
              {/* Chapter number */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-orange-400">{chapter.number}</span>
              </div>

              {/* Chapter info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {chapter.nameSanskrit}
                </h3>
                <p className="text-sm text-white/60 truncate">
                  {chapter.name}
                </p>
                <p className="text-xs text-white/40">
                  {chapter.verseCount} verses
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </motion.div>
          </Link>
        ))}

        {filteredChapters.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No chapters found</p>
          </div>
        )}
      </div>
    </div>
  )
}
