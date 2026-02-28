'use client'

/**
 * Mobile Journeys Page
 *
 * Browse templates and track active transformational journeys.
 * Fetches user's active journeys from journey-engine and available
 * templates from the templates endpoint.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import type {
  JourneyResponse,
  JourneyTemplate,
} from '@/types/journeyEngine.types'

// Map enemy types to UI categories
const ENEMY_TO_CATEGORY: Record<string, string> = {
  krodha: 'anger',
  kama: 'growth',
  lobha: 'growth',
  moha: 'peace',
  mada: 'growth',
  matsarya: 'growth',
  bhaya: 'anxiety',
}

// Journey categories with icons
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'anger', label: 'Anger', icon: Flame },
  { id: 'anxiety', label: 'Anxiety', icon: Heart },
  { id: 'peace', label: 'Peace', icon: Leaf },
  { id: 'growth', label: 'Growth', icon: Sun },
]

// Difficulty number to label
function difficultyLabel(level: number): 'beginner' | 'intermediate' | 'advanced' {
  if (level <= 1) return 'beginner'
  if (level <= 2) return 'intermediate'
  return 'advanced'
}

// Static fallback catalog shown when backend and templates endpoint are unavailable
const STATIC_CATALOG: DisplayTemplate[] = [
  {
    id: 'transform-anger-krodha',
    title: 'Transform Anger (Krodha)',
    description: 'A 14-day journey to understand and transform anger through Gita wisdom and modern psychology.',
    category: 'anger',
    duration_days: 14,
    difficulty: 'beginner',
    is_premium: false,
    rating: 4.8,
  },
  {
    id: 'overcome-anxiety-bhaya',
    title: 'Overcome Anxiety (Bhaya)',
    description: 'Release fear and anxiety with ancient breathing techniques and wisdom from Chapter 2 of the Gita.',
    category: 'anxiety',
    duration_days: 14,
    difficulty: 'beginner',
    is_premium: false,
    rating: 4.9,
  },
  {
    id: 'find-inner-peace-shanti',
    title: 'Find Inner Peace (Shanti)',
    description: 'Discover lasting inner peace through meditation, self-reflection, and the teachings of Lord Krishna.',
    category: 'peace',
    duration_days: 21,
    difficulty: 'intermediate',
    is_premium: false,
    rating: 4.9,
  },
  {
    id: 'personal-growth-vikas',
    title: 'Personal Growth (Vikas)',
    description: "Unlock your potential with daily practices rooted in the Gita's teachings on self-mastery.",
    category: 'growth',
    duration_days: 14,
    difficulty: 'intermediate',
    is_premium: false,
    rating: 4.7,
  },
]

interface DisplayActiveJourney {
  id: string
  title: string
  progress: number
  current_day: number
  duration_days: number
  started_at: string | null
}

interface DisplayTemplate {
  id: string
  title: string
  description: string
  category: string
  duration_days: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_premium: boolean
  rating: number
}

export default function MobileJourneysPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [activeJourneys, setActiveJourneys] = useState<DisplayActiveJourney[]>([])
  const [availableTemplates, setAvailableTemplates] = useState<DisplayTemplate[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null)
  const isStartingRef = useRef(false)

  // Map backend JourneyResponse to display format
  const mapJourney = (j: JourneyResponse): DisplayActiveJourney => ({
    id: j.journey_id,
    title: j.title,
    progress: Math.round(j.progress_percentage),
    current_day: j.current_day,
    duration_days: j.total_days,
    started_at: j.started_at,
  })

  // Map backend JourneyTemplate to display format
  const mapTemplate = (t: JourneyTemplate): DisplayTemplate => ({
    id: t.slug || t.id,
    title: t.title,
    description: t.description || '',
    category: t.primary_enemy_tags?.[0]
      ? (ENEMY_TO_CATEGORY[t.primary_enemy_tags[0]] || 'growth')
      : 'growth',
    duration_days: t.duration_days,
    difficulty: difficultyLabel(t.difficulty),
    is_premium: !t.is_free,
    rating: 4.8,
  })

  // Fetch active journeys and available templates
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    const [activeResult, templatesResult] = await Promise.allSettled([
      journeyEngineService.listJourneys({ status_filter: 'active' }).catch(() => null),
      journeyEngineService.listTemplates({ limit: 20 }).catch(() => null),
    ])

    let hadError = false

    // Process active journeys
    if (activeResult.status === 'fulfilled' && activeResult.value) {
      setActiveJourneys(activeResult.value.journeys.map(mapJourney))
    } else {
      setActiveJourneys([])
      hadError = true
    }

    // Process available templates
    if (templatesResult.status === 'fulfilled' && templatesResult.value) {
      setAvailableTemplates(templatesResult.value.templates.map(mapTemplate))
    } else {
      // Use static catalog as fallback
      setAvailableTemplates(STATIC_CATALOG)
      hadError = true
    }

    if (hadError) setHasError(true)
    setIsLoading(false)
  }, [])

  // Fetch on mount and when auth state changes
  useEffect(() => {
    if (!isAuthenticated) return
    fetchData()
  }, [isAuthenticated, fetchData])

  // Filter templates
  const filteredTemplates = availableTemplates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = !searchQuery ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle active journey press → navigate to detail page
  const handleActiveJourneyPress = useCallback((journeyId: string) => {
    triggerHaptic('selection')
    router.push(`/m/journeys/${journeyId}`)
  }, [router, triggerHaptic])

  // Handle template press → start journey then navigate
  const handleTemplatePress = useCallback(async (templateId: string) => {
    if (isStartingRef.current) return
    isStartingRef.current = true
    setStartingTemplateId(templateId)
    triggerHaptic('selection')

    try {
      const journey = await journeyEngineService.startJourney({
        template_id: templateId,
      })
      triggerHaptic('success')
      router.push(`/m/journeys/${journey.journey_id}`)
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isAuthError()) {
          router.push('/onboarding')
          return
        }
        if (err.isMaxJourneysError()) {
          setHasError(true)
          return
        }
      }
      triggerHaptic('error')
      setHasError(true)
    } finally {
      isStartingRef.current = false
      setStartingTemplateId(null)
    }
  }, [router, triggerHaptic])

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string) => {
    triggerHaptic('selection')
    setSelectedCategory(categoryId)
  }, [triggerHaptic])

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
      onRefresh={fetchData}
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
      <div className="pb-safe-bottom">
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
                className="w-full px-4 py-3 mb-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 outline-none focus:border-[#d4a44c]/40"
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${isSelected ? 'bg-[#d4a44c]/20 border border-[#d4a44c]/40 text-[#e8b54a]' : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'}`}
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
                  onClick={() => handleActiveJourneyPress(journey.id)}
                  className="w-full p-4 rounded-2xl text-left bg-gradient-to-br from-[#d4a44c]/10 to-[#d4a44c]/5 border border-[#d4a44c]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#d4a44c]/20 flex items-center justify-center flex-shrink-0">
                      <Compass className="w-6 h-6 text-[#d4a44c]" />
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
                            className="h-full bg-gradient-to-r from-[#d4a44c] to-[#d4a44c] rounded-full"
                          />
                        </div>
                        <p className="text-[10px] text-[#d4a44c] mt-1">{journey.progress}% complete</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Available Templates */}
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
          ) : filteredTemplates.length === 0 ? (
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
              {filteredTemplates.map((template, index) => (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTemplatePress(template.id)}
                  disabled={startingTemplateId !== null}
                  className="w-full p-4 rounded-2xl text-left bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      {startingTemplateId === template.id ? (
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      ) : (
                        <Target className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white truncate">
                          {template.title}
                        </h3>
                        {template.is_premium && (
                          <Sparkles className="w-4 h-4 text-[#d4a44c] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {template.description}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{template.duration_days} days</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Star className="w-3 h-3 text-[#d4a44c]" />
                          <span>{(template.rating ?? 0).toFixed(1)}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColors[template.difficulty]}`}>
                          {template.difficulty}
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

        {/* Error hint */}
        <AnimatePresence>
          {hasError && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#d4a44c]/10 border border-[#d4a44c]/15"
            >
              <RefreshCw className="w-4 h-4 text-[#d4a44c] flex-shrink-0" />
              <p className="text-xs text-[#e8b54a]">
                Could not load some data. Pull down to refresh.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileAppShell>
  )
}
