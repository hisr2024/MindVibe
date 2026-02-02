'use client'

/**
 * Mobile Journeys Page
 *
 * Browse and track transformational journeys.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Compass,
  Clock,
  Star,
  ChevronRight,
  Sparkles,
  Target,
  Heart,
  Flame,
  Leaf,
  Sun,
  Filter,
  Search,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

// Journey categories with icons
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'anger', label: 'Anger', icon: Flame },
  { id: 'anxiety', label: 'Anxiety', icon: Heart },
  { id: 'peace', label: 'Peace', icon: Leaf },
  { id: 'growth', label: 'Growth', icon: Sun },
]

interface Journey {
  id: string
  title: string
  description: string
  category: string
  duration_days: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  image_url?: string
  is_premium: boolean
  enrolled_count: number
  rating: number
}

interface ActiveJourney extends Journey {
  progress: number
  current_day: number
  started_at: string
}

export default function MobileJourneysPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [activeJourneys, setActiveJourneys] = useState<ActiveJourney[]>([])
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)

  // Fetch journeys
  useEffect(() => {
    const fetchJourneys = async () => {
      if (!isAuthenticated) return

      setIsLoading(true)

      try {
        const [activeResponse, availableResponse] = await Promise.all([
          apiFetch('/api/journeys/active'),
          apiFetch('/api/journeys/catalog'),
        ])

        if (activeResponse.ok) {
          const data = await activeResponse.json()
          setActiveJourneys(data.journeys || [])
        }

        if (availableResponse.ok) {
          const data = await availableResponse.json()
          setAvailableJourneys(data.journeys || [])
        }
      } catch (error) {
        console.error('Failed to fetch journeys:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJourneys()
  }, [isAuthenticated])

  // Filter journeys
  const filteredJourneys = availableJourneys.filter((journey) => {
    const matchesCategory = selectedCategory === 'all' || journey.category === selectedCategory
    const matchesSearch = !searchQuery ||
      journey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle journey press
  const handleJourneyPress = useCallback((journeyId: string) => {
    triggerHaptic('selection')
    router.push(`/m/journeys/${journeyId}`)
  }, [router, triggerHaptic])

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string) => {
    triggerHaptic('selection')
    setSelectedCategory(categoryId)
  }, [triggerHaptic])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    // Re-fetch journeys
    try {
      const [activeResponse, availableResponse] = await Promise.all([
        apiFetch('/api/journeys/active'),
        apiFetch('/api/journeys/catalog'),
      ])

      if (activeResponse.ok) {
        const data = await activeResponse.json()
        setActiveJourneys(data.journeys || [])
      }

      if (availableResponse.ok) {
        const data = await availableResponse.json()
        setAvailableJourneys(data.journeys || [])
      }
    } catch (error) {
      console.error('Failed to refresh journeys:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Difficulty badge colors
  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <MobileAppShell
      title="Journeys"
      largeTitle
      enablePullToRefresh
      onRefresh={handleRefresh}
      rightActions={
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSearch(!showSearch)}
          className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center"
        >
          <Search className="w-5 h-5 text-white" />
        </motion.button>
      }
    >
      <div className="pb-safe">
        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 overflow-hidden"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journeys..."
                className="
                  w-full px-4 py-3 mb-4 rounded-xl
                  bg-white/[0.06] border border-white/[0.08]
                  text-white text-sm
                  placeholder:text-slate-500
                  outline-none focus:border-orange-500/40
                "
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filters */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id
              const Icon = category.icon

              return (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl
                    whitespace-nowrap transition-all
                    ${isSelected
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                      : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Active Journeys */}
        {activeJourneys.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Continue Your Journey</h2>
            <div className="space-y-3">
              {activeJourneys.map((journey) => (
                <motion.button
                  key={journey.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleJourneyPress(journey.id)}
                  className="
                    w-full p-4 rounded-2xl text-left
                    bg-gradient-to-br from-orange-500/10 to-amber-500/5
                    border border-orange-500/20
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Compass className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {journey.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Day {journey.current_day} of {journey.duration_days}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${journey.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                          />
                        </div>
                        <p className="text-[10px] text-orange-400 mt-1">{journey.progress}% complete</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Available Journeys */}
        <div className="px-4">
          <h2 className="text-sm font-medium text-slate-400 mb-3">
            {selectedCategory === 'all' ? 'Explore Journeys' : `${CATEGORIES.find(c => c.id === selectedCategory)?.label} Journeys`}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : filteredJourneys.length === 0 ? (
            <div className="text-center py-12">
              <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No journeys found</p>
              {searchQuery && (
                <p className="text-sm text-slate-500 mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredJourneys.map((journey, index) => (
                <motion.button
                  key={journey.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleJourneyPress(journey.id)}
                  className="
                    w-full p-4 rounded-2xl text-left
                    bg-white/[0.02] border border-white/[0.06]
                    hover:bg-white/[0.04]
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white truncate">
                          {journey.title}
                        </h3>
                        {journey.is_premium && (
                          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {journey.description}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{journey.duration_days} days</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>{journey.rating.toFixed(1)}</span>
                        </div>
                        <span className={`
                          text-[10px] px-2 py-0.5 rounded-full border
                          ${difficultyColors[journey.difficulty]}
                        `}>
                          {journey.difficulty}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileAppShell>
  )
}
