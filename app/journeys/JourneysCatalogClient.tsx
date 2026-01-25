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
  Lock,
  Star,
  Zap,
  X,
} from 'lucide-react'
import * as journeysService from '@/services/journeysEnhancedService'
import type {
  JourneyTemplate,
  Personalization,
  JourneyAccess,
} from '@/services/journeysEnhancedService'

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

// =============================================================================
// Premium Paywall Modal
// =============================================================================

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  access: JourneyAccess | null
  variant: 'no_access' | 'limit_reached'
}

function PaywallModal({ isOpen, onClose, access, variant }: PaywallModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const isLimitReached = variant === 'limit_reached'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-orange-500/30 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/50 p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-orange-100/40 hover:text-orange-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Premium badge */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 shadow-lg shadow-orange-500/25">
          {isLimitReached ? (
            <Zap className="h-10 w-10 text-white" />
          ) : (
            <Lock className="h-10 w-10 text-white" />
          )}
        </div>

        {/* Title */}
        <h2 className="mt-6 text-center text-2xl font-bold text-orange-50">
          {isLimitReached ? 'Journey Limit Reached' : 'Unlock Wisdom Journeys'}
        </h2>

        {/* Description */}
        <p className="mt-3 text-center text-orange-100/70">
          {isLimitReached ? (
            <>
              You&apos;ve reached your limit of{' '}
              <span className="font-semibold text-orange-300">
                {access?.journey_limit} active journey
                {(access?.journey_limit ?? 0) > 1 ? 's' : ''}
              </span>{' '}
              on your {access?.tier} plan. Upgrade to start more journeys simultaneously.
            </>
          ) : (
            <>
              Wisdom Journeys is a{' '}
              <span className="font-semibold text-orange-300">premium feature</span> that provides
              AI-powered spiritual transformation paths. Upgrade to Basic or higher to begin your
              journey.
            </>
          )}
        </p>

        {/* Features list */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="text-sm font-semibold text-orange-100">What you&apos;ll unlock:</h4>
          <ul className="mt-3 space-y-2">
            {[
              'Personalized multi-day spiritual journeys',
              'KIAAN AI-generated daily guidance',
              'Transform the 6 inner enemies (Sad-Ripu)',
              'Bhagavad Gita verse-based teachings',
              'Progress tracking & reflections',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-orange-100/70">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Tier comparison */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div
            className={`rounded-xl border p-3 ${
              access?.tier === 'basic'
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <p className="text-xs font-medium text-orange-100/60">Basic</p>
            <p className="mt-1 text-lg font-bold text-orange-50">1</p>
            <p className="text-xs text-orange-100/50">journey</p>
          </div>
          <div
            className={`rounded-xl border p-3 ${
              access?.tier === 'premium'
                ? 'border-orange-500/50 bg-orange-500/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <p className="text-xs font-medium text-orange-100/60">Premium</p>
            <p className="mt-1 text-lg font-bold text-orange-300">5</p>
            <p className="text-xs text-orange-100/50">journeys</p>
          </div>
          <div
            className={`rounded-xl border p-3 ${
              access?.tier === 'enterprise'
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <p className="text-xs font-medium text-orange-100/60">Enterprise</p>
            <p className="mt-1 text-lg font-bold text-purple-300">∞</p>
            <p className="text-xs text-orange-100/50">unlimited</p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-orange-100 hover:bg-white/5"
          >
            Maybe Later
          </button>
          <button
            onClick={() => router.push(access?.upgrade_url || '/pricing')}
            className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30"
          >
            <span className="flex items-center justify-center gap-2">
              <Star className="h-4 w-4" />
              {access?.upgrade_cta || 'View Plans'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Personalization Modal
// =============================================================================

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

// =============================================================================
// Premium Badge Component
// =============================================================================

function PremiumBadge({ tier }: { tier: string }) {
  if (tier === 'free') return null

  const badgeConfig: Record<string, { bg: string; text: string; label: string }> = {
    basic: { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-100', label: 'Basic' },
    premium: { bg: 'from-orange-500 to-amber-500', text: 'text-orange-100', label: 'Premium' },
    enterprise: { bg: 'from-purple-500 to-pink-500', text: 'text-purple-100', label: 'Enterprise' },
  }

  const config = badgeConfig[tier] || badgeConfig.basic

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${config.bg} px-3 py-1 text-xs font-semibold ${config.text}`}
    >
      <Crown className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// =============================================================================
// Main Catalog Component
// =============================================================================

export default function JourneysCatalogClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [access, setAccess] = useState<JourneyAccess | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallVariant, setPaywallVariant] = useState<'no_access' | 'limit_reached'>('no_access')
  const [personalization, setPersonalization] = useState<Personalization | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      // Load catalog and access info in parallel
      const [catalogData, accessData] = await Promise.all([
        journeysService.getCatalog(),
        journeysService.getJourneyAccess().catch(() => null),
      ])
      setTemplates(catalogData)
      setAccess(accessData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load journey catalog. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelection(id: string) {
    // Check if user has access first
    if (!access?.has_access) {
      setPaywallVariant('no_access')
      setShowPaywall(true)
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        // Check journey limit
        const maxAllowed = access?.is_unlimited
          ? Infinity
          : Math.max(0, (access?.journey_limit ?? 0) - (access?.active_journeys ?? 0))

        if (next.size >= maxAllowed) {
          setPaywallVariant('limit_reached')
          setShowPaywall(true)
          return prev
        }
        if (next.size >= 5) {
          // Hard limit even for unlimited
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  async function handleStartJourneys() {
    if (selectedIds.size === 0) return

    // Check access before starting
    if (!access?.has_access) {
      setPaywallVariant('no_access')
      setShowPaywall(true)
      return
    }

    try {
      setStarting(true)
      setError(null)

      await journeysService.startJourneys(Array.from(selectedIds), personalization || undefined)

      // Navigate to today's agenda
      router.push('/journeys/today')
    } catch (err) {
      console.error('Failed to start journeys:', err)

      // Handle premium errors
      if (journeysService.isPremiumError(err)) {
        if (err.errorCode === 'journey_limit_reached') {
          setPaywallVariant('limit_reached')
        } else {
          setPaywallVariant('no_access')
        }
        setShowPaywall(true)
        return
      }

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
  const maxSelectable = access?.is_unlimited
    ? 5
    : Math.min(5, Math.max(0, (access?.journey_limit ?? 0) - (access?.active_journeys ?? 0)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold text-orange-50">Wisdom Journeys</h1>
            {access && <PremiumBadge tier={access.tier} />}
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-orange-100/70">
            Transform your inner world by overcoming the six inner enemies (Sad-Ripu). Select one or
            more journeys to begin your path to inner peace.
          </p>

          {/* Premium Feature Badge for Free Users */}
          {access && !access.has_access && (
            <div className="mx-auto mt-6 max-w-md">
              <button
                onClick={() => {
                  setPaywallVariant('no_access')
                  setShowPaywall(true)
                }}
                className="group flex w-full items-center justify-between rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-purple-500/10 p-4 text-left transition-all hover:border-orange-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-purple-600">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-100">Premium Feature</p>
                    <p className="text-sm text-orange-100/60">Upgrade to unlock Wisdom Journeys</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-orange-400 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {/* Journey Limit Info for Subscribed Users */}
          {access && access.has_access && !access.is_unlimited && (
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-medium text-orange-100">Active Journeys</p>
                  <p className="text-xs text-orange-100/60">
                    {access.active_journeys} of {access.journey_limit} used
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: access.journey_limit }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-6 rounded-full ${
                        i < access.active_journeys ? 'bg-orange-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {access.remaining === 0 && (
                <button
                  onClick={() => router.push(access.upgrade_url || '/pricing')}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500/20 py-2 text-sm font-medium text-orange-300 hover:bg-orange-500/30"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade for More Journeys
                </button>
              )}
            </div>
          )}
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
                  {maxSelectable < 5 && (
                    <span className="ml-2 text-sm text-orange-100/60">
                      (max {maxSelectable} available)
                    </span>
                  )}
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
                const gradient =
                  ENEMY_GRADIENTS[template.primary_enemy_tags[0]] || 'from-gray-500 to-gray-600'
                const isSelected = selectedIds.has(template.id)
                const isLocked = !access?.has_access

                return (
                  <button
                    key={template.id}
                    onClick={() => toggleSelection(template.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : isLocked
                          ? 'border-white/5 bg-gradient-to-br from-gray-800/30 to-gray-900/30 opacity-75'
                          : 'border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-white/20'
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Lock indicator for free users */}
                    {isLocked && !isSelected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                        <Lock className="h-3.5 w-3.5 text-orange-100/50" />
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
                      <span>{journeysService.getDifficultyLabel(template.difficulty)}</span>
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
                const isLocked = !access?.has_access

                return (
                  <button
                    key={template.id}
                    onClick={() => toggleSelection(template.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : isLocked
                          ? 'border-white/5 bg-gradient-to-br from-gray-800/30 to-gray-900/30 opacity-75'
                          : 'border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-white/20'
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Lock indicator */}
                    {isLocked && !isSelected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                        <Lock className="h-3.5 w-3.5 text-orange-100/50" />
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
                      <span>{journeysService.getDifficultyLabel(template.difficulty)}</span>
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
            <p className="mt-2 text-orange-100/60">Check back soon for new wisdom journeys.</p>
          </div>
        )}

        {/* Modals */}
        <PersonalizationModal
          isOpen={showPersonalization}
          onClose={() => setShowPersonalization(false)}
          onSave={(p) => setPersonalization(p)}
        />
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          access={access}
          variant={paywallVariant}
        />
      </div>
    </div>
  )
}
