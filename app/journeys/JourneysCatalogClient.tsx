'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Flame,
  Heart,
  Coins,
  Cloud,
  Crown,
  Eye,
  Sparkles,
  Check,
  ArrowRight,
  Settings,
} from 'lucide-react'
import * as journeysService from '@/services/journeysEnhancedService'
import type { JourneyTemplate, Personalization } from '@/services/journeysEnhancedService'

// Enemy icons mapping
const ENEMY_ICONS: Record<string, typeof Flame> = {
  kama: Heart,
  krodha: Flame,
  lobha: Coins,
  moha: Cloud,
  mada: Crown,
  matsarya: Eye,
  mixed: Sparkles,
  general: Sparkles,
}

// Enemy gradients
const ENEMY_GRADIENTS: Record<string, string> = {
  kama: 'from-rose-500 to-pink-600',
  krodha: 'from-red-500 to-orange-600',
  lobha: 'from-amber-500 to-yellow-600',
  moha: 'from-purple-500 to-violet-600',
  mada: 'from-orange-500 to-amber-600',
  matsarya: 'from-emerald-500 to-teal-600',
  mixed: 'from-indigo-500 to-purple-600',
  general: 'from-blue-500 to-cyan-600',
}

interface PersonalizationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (personalization: Personalization) => void
}

function PersonalizationModal({ isOpen, onClose, onSave }: PersonalizationModalProps) {
  const [pace, setPace] = useState<'daily' | 'every_other_day' | 'weekly'>('daily')
  const [tone, setTone] = useState<'gentle' | 'direct' | 'inspiring'>('gentle')
  const [provider, setProvider] = useState<'auto' | 'openai' | 'sarvam'>('auto')
  const [timeBudget, setTimeBudget] = useState(10)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6">
        <h3 className="text-xl font-bold text-orange-50">Personalize Your Journey</h3>
        <p className="mt-2 text-sm text-orange-100/60">Customize how KIAAN guides you</p>

        <div className="mt-6 space-y-6">
          {/* Pace */}
          <div>
            <label className="block text-sm font-medium text-orange-100">Pace</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['daily', 'every_other_day', 'weekly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPace(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pace === p
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/5 text-orange-100/70 hover:bg-white/10'
                  }`}
                >
                  {p === 'daily' ? 'Daily' : p === 'every_other_day' ? 'Alt Days' : 'Weekly'}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-orange-100">Guidance Tone</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['gentle', 'direct', 'inspiring'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    tone === t
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-orange-100/70 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium text-orange-100">AI Provider</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['auto', 'openai', 'sarvam'] as const).map((pr) => (
                <button
                  key={pr}
                  onClick={() => setProvider(pr)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    provider === pr
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-orange-100/70 hover:bg-white/10'
                  }`}
                >
                  {pr === 'auto' ? 'Auto' : pr === 'openai' ? 'OpenAI' : 'Sarvam'}
                </button>
              ))}
            </div>
          </div>

          {/* Time Budget */}
          <div>
            <label className="block text-sm font-medium text-orange-100">
              Daily Time Budget: {timeBudget} min
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={timeBudget}
              onChange={(e) => setTimeBudget(Number(e.target.value))}
              className="mt-2 w-full accent-orange-500"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-orange-100 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                pace,
                preferred_tone: tone,
                provider_preference: provider,
                time_budget_minutes: timeBudget,
              })
              onClose()
            }}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default function JourneysCatalogClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [personalization, setPersonalization] = useState<Personalization | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCatalog()
  }, [])

  async function loadCatalog() {
    try {
      setLoading(true)
      const data = await journeysService.getCatalog()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to load catalog:', err)
      setError('Failed to load journey catalog. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= 5) {
          // Max 5 journeys
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  async function handleStartJourneys() {
    if (selectedIds.size === 0) return

    try {
      setStarting(true)
      setError(null)

      await journeysService.startJourneys(Array.from(selectedIds), personalization || undefined)

      // Navigate to today's agenda
      router.push('/journeys/today')
    } catch (err) {
      console.error('Failed to start journeys:', err)
      setError(err instanceof Error ? err.message : 'Failed to start journeys')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-lg text-orange-100/70">Loading wisdom journeys...</p>
        </div>
      </div>
    )
  }

  const featuredTemplates = templates.filter((t) => t.is_featured)
  const regularTemplates = templates.filter((t) => !t.is_featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-orange-50">Wisdom Journeys</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-orange-100/70">
            Transform your inner world by overcoming the six inner enemies (Ṣaḍ-Ripu). Select one
            or more journeys to begin your path to inner peace.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Selection Summary */}
        {selectedIds.size > 0 && (
          <div className="mb-8 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-100">
                  {selectedIds.size} journey{selectedIds.size > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-orange-100/60">
                  You can start multiple journeys and work on them simultaneously
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPersonalization(true)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-orange-100 hover:bg-white/5"
                >
                  <Settings className="h-4 w-4" />
                  Personalize
                </button>
                <button
                  onClick={handleStartJourneys}
                  disabled={starting}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:from-orange-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Start Journeys
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Featured Journeys */}
        {featuredTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-xl font-semibold text-orange-100">Featured Journeys</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredTemplates.map((template) => {
                const Icon = ENEMY_ICONS[template.primary_enemy_tags[0]] || Sparkles
                const gradient = ENEMY_GRADIENTS[template.primary_enemy_tags[0]] || 'from-gray-500 to-gray-600'
                const isSelected = selectedIds.has(template.id)

                return (
                  <button
                    key={template.id}
                    onClick={() => toggleSelection(template.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-white/20'
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Featured badge */}
                    <div className="absolute left-4 top-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </span>
                    </div>

                    {/* Icon */}
                    <div
                      className={`mt-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="mt-4 text-lg font-bold text-orange-50">{template.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-orange-100/60">
                      {template.description}
                    </p>

                    {/* Meta */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-orange-100/50">
                      <span>{journeysService.formatDuration(template.duration_days)}</span>
                      <span>
                        {journeysService.getDifficultyLabel(template.difficulty)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.primary_enemy_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-orange-100/70"
                        >
                          {journeysService.getEnemyDisplayName(tag)}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Regular Journeys */}
        {regularTemplates.length > 0 && (
          <div>
            <h2 className="mb-6 text-xl font-semibold text-orange-100">All Journeys</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularTemplates.map((template) => {
                const Icon = ENEMY_ICONS[template.primary_enemy_tags[0]] || Sparkles
                const gradient =
                  ENEMY_GRADIENTS[template.primary_enemy_tags[0]] || 'from-gray-500 to-gray-600'
                const isSelected = selectedIds.has(template.id)

                return (
                  <button
                    key={template.id}
                    onClick={() => toggleSelection(template.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-white/20'
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="mt-4 text-lg font-bold text-orange-50">{template.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-orange-100/60">
                      {template.description}
                    </p>

                    {/* Meta */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-orange-100/50">
                      <span>{journeysService.formatDuration(template.duration_days)}</span>
                      <span>
                        {journeysService.getDifficultyLabel(template.difficulty)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {templates.length === 0 && (
          <div className="py-16 text-center">
            <Sparkles className="mx-auto h-16 w-16 text-orange-500/50" />
            <h3 className="mt-4 text-xl font-semibold text-orange-100">No journeys available</h3>
            <p className="mt-2 text-orange-100/60">
              Check back soon for new wisdom journeys.
            </p>
          </div>
        )}

        {/* Personalization Modal */}
        <PersonalizationModal
          isOpen={showPersonalization}
          onClose={() => setShowPersonalization(false)}
          onSave={(p) => setPersonalization(p)}
        />
      </div>
    </div>
  )
}
