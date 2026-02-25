/**
 * Circle List Component
 *
 * Browse and filter community wisdom circles by category.
 *
 * Quantum Enhancement #5: Community Wisdom Circles
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus, Loader2 } from 'lucide-react'
import { CircleCard } from './CircleCard'

interface Circle {
  id: number
  name: string
  description: string
  category: string
  privacy: 'open' | 'moderated' | 'invite_only'
  member_count: number
  post_count: number
  is_member: boolean
  moderator_count: number
}

interface CircleListProps {
  onJoinCircle?: (circleId: number) => Promise<void>
  onLeaveCircle?: (circleId: number) => Promise<void>
  onViewCircle?: (circleId: number) => void
  onCreateCircle?: () => void
  className?: string
}

const CATEGORIES = [
  { value: '', label: 'All Circles' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'depression', label: 'Depression' },
  { value: 'stress', label: 'Stress' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'work_life', label: 'Work & Life' },
  { value: 'self_growth', label: 'Self Growth' },
  { value: 'grief', label: 'Grief & Loss' },
  { value: 'general', label: 'General' }
]

export function CircleList({
  onJoinCircle,
  onLeaveCircle,
  onViewCircle,
  onCreateCircle,
  className = ''
}: CircleListProps) {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showMyCircles, setShowMyCircles] = useState(false)

  useEffect(() => {
    fetchCircles()
  }, [selectedCategory])

  const fetchCircles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const response = await fetch(`/api/community/circles?${params}`, {
        credentials: 'include',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error('Failed to fetch circles')

      const data = await response.json()
      setCircles(data)
    } catch (err) {
      const message = err instanceof Error
        ? (err.name === 'AbortError' ? 'Request timed out' : err.message)
        : 'Failed to load circles'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredCircles = circles.filter((circle) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circle.description.toLowerCase().includes(searchQuery.toLowerCase())

    // My circles filter
    const matchesMyCircles = !showMyCircles || circle.is_member

    return matchesSearch && matchesMyCircles
  })

  const myCirclesCount = circles.filter((c) => c.is_member).length

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#f5f0e8] mb-1">Community Circles</h2>
            <p className="text-sm text-[#f5f0e8]/60">
              Join anonymous peer support spaces for shared experiences
            </p>
          </div>

          {onCreateCircle && (
            <button
              onClick={onCreateCircle}
              className="px-4 py-2 rounded-xl bg-[#d4a44c]/20 text-[#d4a44c] font-medium hover:bg-[#d4a44c]/30 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Circle</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f0e8]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circles..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 text-[#f5f0e8] text-sm placeholder:text-[#f5f0e8]/40 focus:outline-none focus:border-[#d4a44c]/40"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f0e8]/40 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none pl-12 pr-10 py-3 rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 text-[#f5f0e8] text-sm focus:outline-none focus:border-[#d4a44c]/40 cursor-pointer min-w-[180px]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-black">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* My Circles Toggle */}
          <button
            onClick={() => setShowMyCircles(!showMyCircles)}
            className={`px-4 py-3 rounded-2xl text-sm font-medium transition ${
              showMyCircles
                ? 'bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30'
                : 'border border-[#d4a44c]/20 text-[#f5f0e8]/80 hover:border-[#d4a44c]/40'
            }`}
          >
            My Circles {myCirclesCount > 0 && `(${myCirclesCount})`}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-[#d4a44c] animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#f5f0e8]/60">Loading circles...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-3xl border border-red-500/15 bg-red-950/20 p-6 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={fetchCircles}
            className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCircles.length === 0 && (
        <div className="rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-[#d4a44c]/10 flex items-center justify-center">
                <Search className="h-8 w-8 text-[#d4a44c]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">No circles found</h3>
            <p className="text-sm text-[#f5f0e8]/60 mb-4">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : showMyCircles
                ? "You haven't joined any circles yet"
                : 'No circles available in this category'}
            </p>
            {showMyCircles && (
              <button
                onClick={() => setShowMyCircles(false)}
                className="px-4 py-2 rounded-xl bg-[#d4a44c]/20 text-[#d4a44c] text-sm hover:bg-[#d4a44c]/30 transition"
              >
                Browse All Circles
              </button>
            )}
          </div>
        </div>
      )}

      {/* Circle Grid */}
      {!loading && !error && filteredCircles.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#f5f0e8]/60">
              {filteredCircles.length} {filteredCircles.length === 1 ? 'circle' : 'circles'} found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCircles.map((circle, index) => (
              <motion.div
                key={circle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CircleCard
                  circle={circle}
                  onJoin={onJoinCircle}
                  onLeave={onLeaveCircle}
                  onView={onViewCircle}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 rounded-3xl border border-indigo-400/20 bg-indigo-950/20 p-6">
        <h4 className="text-sm font-semibold text-indigo-100 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>About Community Circles</span>
        </h4>
        <ul className="space-y-2 text-sm text-indigo-100/80">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>
              <strong>Anonymous participation:</strong> Your identity is protected through anonymous
              pseudonyms unique to each circle
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>
              <strong>Mindful moderation:</strong> All posts are nurtured for compassion and respect
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>
              <strong>Compassionate care:</strong> Gentle support resources provided when someone needs extra care
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>
              <strong>Compassion badges:</strong> Award badges to recognize supportive community members
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
