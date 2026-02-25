'use client'

/**
 * Offline Verse Reader Component
 *
 * Features:
 * - Read 700+ Bhagavad Gita verses offline
 * - Browse by chapter and verse
 * - Search functionality (works offline)
 * - Favorite verses with offline sync
 * - Translation in multiple languages
 * - Works with cached verse data from IndexedDB
 *
 * Quantum Coherence: Timeless wisdom remains accessible even when
 * temporal network connections collapse
 */

import { useState, useEffect } from 'react'
import { useOfflineMode } from '@/hooks/useOfflineMode'
import { indexedDBManager, STORES } from '@/lib/offline/indexedDB'
import { AlertCircle, Book, BookOpen, Cloud, CloudOff, Heart, Loader2, Search } from 'lucide-react'

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

interface OfflineVerseReaderProps {
  userId: string
  defaultChapter?: number
  showSearch?: boolean
  compact?: boolean
}

export function OfflineVerseReader({
  userId,
  defaultChapter = 1,
  showSearch = true,
  compact = false
}: OfflineVerseReaderProps) {
  const [verses, setVerses] = useState<Verse[]>([])
  const [filteredVerses, setFilteredVerses] = useState<Verse[]>([])
  const [selectedChapter, setSelectedChapter] = useState(defaultChapter)
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')

  const { isOnline, queueCount } = useOfflineMode()

  // Load verses from IndexedDB on mount
  useEffect(() => {
    loadVersesFromCache()
    loadFavorites()
  }, [selectedChapter])

  // Filter verses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVerses(verses)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = verses.filter(verse =>
      verse.sanskrit?.toLowerCase().includes(query) ||
      verse.transliteration?.toLowerCase().includes(query) ||
      verse.translation?.toLowerCase().includes(query) ||
      verse.commentary?.toLowerCase().includes(query) ||
      verse.tags?.some(tag => tag.toLowerCase().includes(query))
    )

    setFilteredVerses(filtered)
  }, [searchQuery, verses])

  const loadVersesFromCache = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load verses from IndexedDB cache
      const cachedVerses = await indexedDBManager.getAll<Verse>(STORES.GITA_VERSES)

      // Filter by chapter
      const chapterVerses = cachedVerses.filter(
        (v) => v.chapter === selectedChapter
      )

      // Sort by verse number
      chapterVerses.sort((a, b) => a.verse - b.verse)

      setVerses(chapterVerses)
      setFilteredVerses(chapterVerses)
    } catch (err) {
      console.error('Failed to load verses from cache:', err)
      setError('Failed to load verses from cache. Please sync when online.')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    try {
      const favoritesJson = localStorage.getItem(`favorites_${userId}`)
      if (favoritesJson) {
        setFavorites(new Set(JSON.parse(favoritesJson)))
      }
    } catch (err) {
      console.error('Failed to load favorites:', err)
    }
  }

  const toggleFavorite = (verseId: string) => {
    const newFavorites = new Set(favorites)

    if (newFavorites.has(verseId)) {
      newFavorites.delete(verseId)
    } else {
      newFavorites.add(verseId)
    }

    setFavorites(newFavorites)

    // Save to localStorage
    try {
      localStorage.setItem(`favorites_${userId}`, JSON.stringify([...newFavorites]))
    } catch (err) {
      console.error('Failed to save favorites:', err)
    }

    // TODO: Queue sync operation to save favorites online
  }

  const handleVerseSelect = (verse: Verse) => {
    setSelectedVerse(verse)
    setViewMode('detail')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedVerse(null)
  }

  const chapters = Array.from({ length: 18 }, (_, i) => i + 1)

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'p-8' : 'p-12'} rounded-3xl border border-[#d4a44c]/15 bg-black/50`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4a44c]" />
          <p className="text-sm text-[#f5f0e8]/80">Loading verses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-6' : 'p-8'} rounded-3xl border border-red-500/20 bg-red-950/20`}>
        <div className="flex items-center gap-3 text-red-50">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${compact ? 'p-4' : 'p-6 md:p-8'} rounded-3xl border border-[#d4a44c]/15 bg-black/50 shadow-[0_20px_80px_rgba(212,164,76,0.12)]`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold text-[#f5f0e8] flex items-center gap-2`}>
            <BookOpen className="h-6 w-6" />
            Bhagavad Gita
          </h2>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <Cloud className="h-3.5 w-3.5" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                <CloudOff className="h-3.5 w-3.5" />
                <span>Offline Mode</span>
              </div>
            )}

            <div className="flex items-center gap-1 rounded-full bg-[#d4a44c]/20 px-2.5 py-1 text-xs text-[#e8b54a]">
              <Book className="h-3 w-3" />
              <span>{verses.length} verses cached</span>
            </div>
          </div>
        </div>

        {!compact && (
          <p className="text-sm text-[#f5f0e8]/80">
            {isOnline
              ? 'Browse all 700+ verses of the Bhagavad Gita'
              : 'Reading from offline cache - all verses available'
            }
          </p>
        )}
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Chapter Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#f5f0e8]">Select Chapter</label>
            <div className="flex flex-wrap gap-2">
              {chapters.map(chapter => (
                <button
                  key={chapter}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    selectedChapter === chapter
                      ? 'border-[#d4a44c] bg-[#d4a44c]/30 text-[#f5f0e8] ring-2 ring-[#d4a44c]/50'
                      : 'border-[#d4a44c]/25 bg-[#d4a44c]/10 text-[#f5f0e8] hover:bg-[#d4a44c]/20'
                  }`}
                >
                  {chapter}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f5f0e8]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search verses, translations, commentary..."
                className="w-full rounded-2xl border border-[#d4a44c]/25 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 outline-none focus:ring-2 focus:ring-[#d4a44c]/70"
              />
            </div>
          )}

          {/* Verse List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredVerses.length === 0 ? (
              <div className="py-12 text-center text-[#f5f0e8]/60">
                {searchQuery ? 'No verses found matching your search' : 'No verses available'}
              </div>
            ) : (
              filteredVerses.map(verse => (
                <button
                  key={verse.id}
                  onClick={() => handleVerseSelect(verse)}
                  className="w-full text-left rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/80 p-4 transition hover:bg-[#d4a44c]/10 hover:border-[#d4a44c]/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#d4a44c]">
                          Chapter {verse.chapter}, Verse {verse.verse}
                        </span>
                        {verse.tags && verse.tags.length > 0 && (
                          <div className="flex gap-1">
                            {verse.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs text-[#f5f0e8]/50">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-medium text-[#f5f0e8] line-clamp-1">
                        {verse.transliteration || verse.sanskrit}
                      </p>

                      <p className="text-xs text-[#f5f0e8]/70 line-clamp-2">
                        {verse.translation}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(verse.id)
                      }}
                      className="shrink-0"
                    >
                      <Heart
                        className={`h-4 w-4 transition ${
                          favorites.has(verse.id)
                            ? 'fill-red-400 text-red-400'
                            : 'text-[#f5f0e8]/40 hover:text-[#f5f0e8]/60'
                        }`}
                      />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* Detailed Verse View */
        selectedVerse && (
          <div className="space-y-4">
            <button
              onClick={handleBackToList}
              className="text-sm text-[#d4a44c] hover:text-[#e8b54a] transition"
            >
              ← Back to list
            </button>

            <div className="space-y-4 rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/80 p-6">
              {/* Verse Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#d4a44c]">
                    Chapter {selectedVerse.chapter}, Verse {selectedVerse.verse}
                  </span>
                </div>

                <button
                  onClick={() => toggleFavorite(selectedVerse.id)}
                  className="shrink-0"
                >
                  <Heart
                    className={`h-5 w-5 transition ${
                      favorites.has(selectedVerse.id)
                        ? 'fill-red-400 text-red-400'
                        : 'text-[#f5f0e8]/40 hover:text-[#f5f0e8]/60'
                    }`}
                  />
                </button>
              </div>

              {/* Sanskrit */}
              {selectedVerse.sanskrit && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-[#f5f0e8]/70 uppercase tracking-wider">
                    Sanskrit
                  </h3>
                  <p className="text-lg font-serif text-[#f5f0e8]">
                    {selectedVerse.sanskrit}
                  </p>
                </div>
              )}

              {/* Transliteration */}
              {selectedVerse.transliteration && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-[#f5f0e8]/70 uppercase tracking-wider">
                    Transliteration
                  </h3>
                  <p className="text-base italic text-[#f5f0e8]/90">
                    {selectedVerse.transliteration}
                  </p>
                </div>
              )}

              {/* Translation */}
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-[#f5f0e8]/70 uppercase tracking-wider">
                  Translation
                </h3>
                <p className="text-base text-[#f5f0e8] leading-relaxed">
                  {selectedVerse.translation}
                </p>
              </div>

              {/* Commentary */}
              {selectedVerse.commentary && (
                <div className="space-y-1">
                  <h3 className="text-xs font-medium text-[#f5f0e8]/70 uppercase tracking-wider">
                    Commentary
                  </h3>
                  <p className="text-sm text-[#f5f0e8]/80 leading-relaxed">
                    {selectedVerse.commentary}
                  </p>
                </div>
              )}

              {/* Tags */}
              {selectedVerse.tags && selectedVerse.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedVerse.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#d4a44c]/25 bg-[#d4a44c]/10 px-3 py-1 text-xs font-medium text-[#f5f0e8]/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Offline Notice */}
      {!isOnline && queueCount > 0 && (
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-950/20 p-3 text-xs text-yellow-50">
          <CloudOff className="inline h-3 w-3 mr-1.5" />
          You have {queueCount} action{queueCount > 1 ? 's' : ''} queued to sync when online.
        </div>
      )}
    </div>
  )
}
