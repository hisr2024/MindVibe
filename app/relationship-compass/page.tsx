'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiCall, getErrorMessage } from '@/lib/api-client'

// Sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\\/g, '') // Remove backslashes
    .slice(0, 3000) // Limit length
}

// Custom hook for localStorage with hydration safety
function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initial)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        setState(parsed)
      }
    } catch (error) {
      console.warn(`Failed to load localStorage key "${key}":`, error)
    }
    setIsHydrated(true)
  }, [key])

  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.warn(`Failed to save localStorage key "${key}":`, error)
    }
  }, [key, state, isHydrated])

  return [state, setState]
}

// Relationship types
const RELATIONSHIP_TYPES = [
  { value: 'romantic', label: 'Romantic Partner', icon: '💕', description: 'Partner, spouse, significant other' },
  { value: 'family', label: 'Family Member', icon: '👨‍👩‍👧‍👦', description: 'Parents, siblings, children, relatives' },
  { value: 'friendship', label: 'Friend', icon: '🤝', description: 'Close friends, acquaintances' },
  { value: 'workplace', label: 'Workplace', icon: '💼', description: 'Colleagues, boss, employees' },
  { value: 'self', label: 'Yourself', icon: '🪞', description: 'Inner conflict, self-criticism' },
  { value: 'community', label: 'Community', icon: '🌍', description: 'Neighbors, groups, society' },
] as const

// Primary emotions
const EMOTIONS = [
  { value: 'hurt', label: 'Hurt' },
  { value: 'anger', label: 'Anger' },
  { value: 'confusion', label: 'Confusion' },
  { value: 'fear', label: 'Fear' },
  { value: 'guilt', label: 'Guilt' },
  { value: 'loneliness', label: 'Loneliness' },
  { value: 'jealousy', label: 'Jealousy' },
  { value: 'betrayal', label: 'Betrayal' },
  { value: 'resentment', label: 'Resentment' },
  { value: 'grief', label: 'Grief' },
] as const

// Section display configuration for beautiful rendering
const SECTION_CONFIG: Record<string, { title: string; icon: string; gradient: string }> = {
  sacred_witnessing: {
    title: 'Sacred Witnessing',
    icon: '🙏',
    gradient: 'from-amber-500/20 to-orange-500/10'
  },
  mirror_of_relationship: {
    title: 'Mirror of Relationship',
    icon: '🪞',
    gradient: 'from-purple-500/20 to-indigo-500/10'
  },
  others_inner_world: {
    title: "The Other's Inner World",
    icon: '💫',
    gradient: 'from-blue-500/20 to-cyan-500/10'
  },
  dharmic_path: {
    title: 'The Dharmic Path',
    icon: '🛤️',
    gradient: 'from-emerald-500/20 to-teal-500/10'
  },
  ego_illumination: {
    title: 'Ego Illumination',
    icon: '💡',
    gradient: 'from-yellow-500/20 to-amber-500/10'
  },
  sacred_communication: {
    title: 'Sacred Communication',
    icon: '🗣️',
    gradient: 'from-rose-500/20 to-pink-500/10'
  },
  forgiveness_teaching: {
    title: 'The Teaching of Kshama',
    icon: '🕊️',
    gradient: 'from-sky-500/20 to-blue-500/10'
  },
  eternal_anchor: {
    title: 'Eternal Anchor',
    icon: '⚓',
    gradient: 'from-orange-500/20 to-red-500/10'
  },
  // Fallback section names from older format
  acknowledgment: {
    title: 'Acknowledgment',
    icon: '🙏',
    gradient: 'from-amber-500/20 to-orange-500/10'
  },
  underneath: {
    title: 'What Lies Beneath',
    icon: '🔍',
    gradient: 'from-purple-500/20 to-indigo-500/10'
  },
  clarity: {
    title: 'Finding Clarity',
    icon: '✨',
    gradient: 'from-blue-500/20 to-cyan-500/10'
  },
  path_forward: {
    title: 'The Path Forward',
    icon: '🛤️',
    gradient: 'from-emerald-500/20 to-teal-500/10'
  },
  reminder: {
    title: 'A Gentle Reminder',
    icon: '💫',
    gradient: 'from-orange-500/20 to-red-500/10'
  },
}

// Gita teachings per relationship type
const GITA_TEACHINGS: Record<string, { principle: string; sanskrit: string; meaning: string }> = {
  romantic: {
    principle: 'Nishkama Prema',
    sanskrit: 'निष्काम प्रेम',
    meaning: 'Love without selfish attachment - seeing the divine in your partner',
  },
  family: {
    principle: 'Svadharma',
    sanskrit: 'स्वधर्म',
    meaning: 'Sacred duty - honoring family while maintaining inner equanimity',
  },
  friendship: {
    principle: 'Maitri',
    sanskrit: 'मैत्री',
    meaning: 'Unconditional friendship - being a friend to all beings',
  },
  workplace: {
    principle: 'Karma Yoga',
    sanskrit: 'कर्मयोग',
    meaning: 'Work as worship - excellence in action without attachment to results',
  },
  self: {
    principle: 'Atma-jnana',
    sanskrit: 'आत्मज्ञान',
    meaning: 'Self-knowledge - you are complete, eternal, unchanging',
  },
  community: {
    principle: 'Lokasangraha',
    sanskrit: 'लोकसंग्रह',
    meaning: 'Welfare of the world - acting for the good of all beings',
  },
}

type CompassResult = {
  response: string
  compass_guidance: Record<string, string>
  relationship_type: string
  relationship_teachings?: {
    core_principles: string[]
    key_teaching: string
  }
  emotion_insight?: string
  gita_verses_used: number
  requestedAt: string
}

export default function RelationshipCompassPage() {
  const [conflict, setConflict] = useState('')
  const [relationshipType, setRelationshipType] = useState('romantic')
  const [primaryEmotion, setPrimaryEmotion] = useState('')
  const [context, setContext] = useState('')
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<CompassResult | null>('relationship_compass_result', null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Clear error when input changes
  useEffect(() => {
    if (error) setError(null)
  }, [conflict, relationshipType, primaryEmotion, error])

  const requestCompass = useCallback(async () => {
    const trimmedConflict = sanitizeInput(conflict.trim())
    if (!trimmedConflict) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiCall('/api/relationship-compass/guide', {
        method: 'POST',
        body: JSON.stringify({
          conflict: trimmedConflict,
          relationship_type: relationshipType,
          primary_emotion: primaryEmotion || undefined,
          context: context.trim() || undefined,
          desired_outcome: desiredOutcome.trim() || undefined,
        }),
        timeout: 60000, // Extended timeout for deep analysis
      })

      const data = await response.json()

      if (data.status === 'success') {
        setResult({
          response: data.response,
          compass_guidance: data.compass_guidance,
          relationship_type: data.relationship_type,
          relationship_teachings: data.relationship_teachings,
          emotion_insight: data.emotion_insight,
          gita_verses_used: data.gita_verses_used,
          requestedAt: new Date().toISOString(),
        })
        setActiveSection(null) // Reset active section
      } else {
        throw new Error(data.detail || 'Failed to get guidance')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [conflict, relationshipType, primaryEmotion, context, desiredOutcome])

  const selectedRelType = RELATIONSHIP_TYPES.find(t => t.value === relationshipType)
  const gitaTeaching = GITA_TEACHINGS[relationshipType]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10] via-[#0c0f14] to-[#0b0b0f] p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Through the Wisdom of 700+ Gita Verses</p>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent">
                Relationship Compass
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                Navigate the sacred terrain of human connection with dharma (right action), daya (compassion), and kshama (forgiveness).
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 border border-orange-500/20 px-3 py-1 text-xs text-orange-100/80">
                  Ultra-deep guidance
                </span>
                <span className="rounded-full bg-white/10 border border-orange-500/20 px-3 py-1 text-xs text-orange-100/80">
                  Gita-grounded wisdom
                </span>
              </div>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          {/* Left: Input Section */}
          <section className="space-y-4">
            {/* Relationship Type Selection */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-3">
                Who is this relationship with?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {RELATIONSHIP_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setRelationshipType(type.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      relationshipType === type.value
                        ? 'border-orange-400/60 bg-orange-500/15 shadow-lg shadow-orange-500/10'
                        : 'border-orange-500/20 bg-black/30 hover:border-orange-500/40 hover:bg-orange-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium text-orange-50">{type.label}</span>
                    </div>
                    <p className="text-[10px] text-orange-100/60 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Conflict Input */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <label className="text-sm font-semibold text-orange-100 block mb-3">
                Share your situation
                <span className="font-normal text-orange-100/60 ml-2">(The more detail, the deeper the guidance)</span>
              </label>
              <textarea
                value={conflict}
                onChange={e => setConflict(e.target.value)}
                placeholder={
                  relationshipType === 'romantic'
                    ? "Example: My partner and I keep having the same argument about feeling unheard. When I try to share my feelings, they get defensive, and I end up withdrawing..."
                    : relationshipType === 'family'
                    ? "Example: My parent constantly criticizes my life choices. No matter what I achieve, it never feels enough for them..."
                    : relationshipType === 'friendship'
                    ? "Example: My close friend has been distant lately. When I reach out, they give short replies. I'm not sure if I did something wrong..."
                    : relationshipType === 'workplace'
                    ? "Example: My colleague takes credit for my work. When I brought it up, they dismissed my concerns. I feel unseen and undervalued..."
                    : relationshipType === 'self'
                    ? "Example: I'm extremely hard on myself. Every mistake replays in my mind. I can't seem to forgive myself for past decisions..."
                    : "Example: I feel disconnected from my community. Despite trying to contribute, I feel like an outsider..."
                }
                className="w-full min-h-[180px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-orange-100/50">{conflict.length}/3000 characters</span>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-orange-200/70 hover:text-orange-200 transition"
                >
                  {showAdvanced ? '− Less options' : '+ More options'}
                </button>
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] space-y-4">
                {/* Emotion Selection */}
                <div>
                  <label className="text-sm font-semibold text-orange-100 block mb-3">
                    Primary emotion you're feeling
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((emotion) => (
                      <button
                        key={emotion.value}
                        onClick={() => setPrimaryEmotion(primaryEmotion === emotion.value ? '' : emotion.value)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          primaryEmotion === emotion.value
                            ? 'bg-orange-500/30 border border-orange-400/60 text-orange-50'
                            : 'bg-black/30 border border-orange-500/20 text-orange-100/70 hover:border-orange-500/40'
                        }`}
                      >
                        {emotion.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context */}
                <div>
                  <label className="text-sm font-semibold text-orange-100 block mb-2">
                    Additional context <span className="font-normal text-orange-100/50">(optional)</span>
                  </label>
                  <textarea
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="Any history or pattern you've noticed..."
                    className="w-full min-h-[80px] rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-3 text-sm focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
                  />
                </div>

                {/* Desired Outcome */}
                <div>
                  <label className="text-sm font-semibold text-orange-100 block mb-2">
                    What are you hoping for? <span className="font-normal text-orange-100/50">(optional)</span>
                  </label>
                  <textarea
                    value={desiredOutcome}
                    onChange={e => setDesiredOutcome(e.target.value)}
                    placeholder="What outcome would bring you peace..."
                    className="w-full min-h-[60px] rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-3 text-sm focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={requestCompass}
                disabled={!conflict.trim() || loading}
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Consulting ancient wisdom...
                  </span>
                ) : (
                  <span>Seek Guidance from the Gita</span>
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Response Section */}
            {result && (
              <div className="space-y-4">
                {/* Response Header */}
                <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#0d0d10]/90 to-[#0b0a0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.15)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center">
                        <span className="text-lg">🧭</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-50">Relationship Compass Guidance</h3>
                        <p className="text-xs text-orange-100/60">
                          {result.gita_verses_used > 0
                            ? `Drawing from ${result.gita_verses_used} Gita verses`
                            : 'Rooted in Bhagavad Gita wisdom'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-orange-100/50">
                      {new Date(result.requestedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Emotion Insight */}
                  {result.emotion_insight && (
                    <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm text-purple-100/90 italic leading-relaxed">
                        "{result.emotion_insight}"
                      </p>
                    </div>
                  )}

                  {/* Key Teaching */}
                  {result.relationship_teachings?.key_teaching && (
                    <div className="mb-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <p className="text-sm text-orange-100/90 leading-relaxed">
                        <span className="font-semibold text-orange-200">Gita Teaching: </span>
                        {result.relationship_teachings.key_teaching}
                      </p>
                    </div>
                  )}
                </div>

                {/* Structured Sections */}
                {result.compass_guidance && Object.keys(result.compass_guidance).length > 0 && (
                  <div className="space-y-3">
                    {Object.entries(result.compass_guidance).map(([key, content]) => {
                      if (!content || content.trim().length === 0) return null
                      const config = SECTION_CONFIG[key] || {
                        title: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        icon: '📖',
                        gradient: 'from-orange-500/20 to-amber-500/10'
                      }
                      const isActive = activeSection === key

                      return (
                        <div
                          key={key}
                          className={`rounded-xl border border-orange-500/20 overflow-hidden transition-all duration-300 ${
                            isActive ? 'shadow-lg shadow-orange-500/10' : ''
                          }`}
                        >
                          <button
                            onClick={() => setActiveSection(isActive ? null : key)}
                            className={`w-full p-4 flex items-center justify-between bg-gradient-to-r ${config.gradient} hover:opacity-90 transition`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{config.icon}</span>
                              <span className="font-medium text-orange-50">{config.title}</span>
                            </div>
                            <svg
                              className={`w-5 h-5 text-orange-200/70 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isActive ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="p-5 bg-black/40">
                              <p className="text-sm text-orange-50/90 leading-relaxed whitespace-pre-wrap">
                                {content}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Full Response Toggle */}
                <details className="rounded-xl border border-orange-500/20 bg-black/40 overflow-hidden">
                  <summary className="p-4 cursor-pointer text-sm font-medium text-orange-100/80 hover:text-orange-100 transition">
                    View full response as continuous text
                  </summary>
                  <div className="px-5 pb-5">
                    <div className="whitespace-pre-wrap text-sm text-orange-50/85 leading-relaxed">
                      {result.response}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </section>

          {/* Right: Info Sidebar */}
          <section className="space-y-4">
            {/* Current Relationship Type Info */}
            {selectedRelType && gitaTeaching && (
              <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#0d0d10]/90 to-[#0b0a0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{selectedRelType.icon}</span>
                  <div>
                    <h3 className="font-semibold text-orange-50">{selectedRelType.label}</h3>
                    <p className="text-xs text-orange-100/60">{selectedRelType.description}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-300 font-semibold">{gitaTeaching.principle}</span>
                    <span className="text-orange-200/70 text-sm">({gitaTeaching.sanskrit})</span>
                  </div>
                  <p className="text-sm text-orange-100/80 leading-relaxed">{gitaTeaching.meaning}</p>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">How the Compass Works</h3>
              <ol className="space-y-3 text-sm text-orange-100/85">
                {[
                  'Deep acknowledgment of your pain',
                  'Mirror reflection - what this reveals within',
                  'Compassionate view of the other',
                  'Dharmic path - right action from highest self',
                  'Ego illumination - seeing beyond reactions',
                  'Sacred communication guidance',
                  'Kshama - the path of forgiveness',
                  'Eternal anchor - your unchanging truth',
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347] text-xs font-bold text-slate-950 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Core Principles */}
            <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <h3 className="text-sm font-semibold text-orange-50 mb-4">Gita's Core Teachings for Relationships</h3>
              <div className="space-y-3">
                {[
                  { sanskrit: 'धर्म', term: 'Dharma', meaning: 'Right action aligned with your highest self' },
                  { sanskrit: 'दया', term: 'Daya', meaning: 'Deep compassion for self and others' },
                  { sanskrit: 'क्षमा', term: 'Kshama', meaning: 'Forgiveness as liberation, not condoning' },
                  { sanskrit: 'अहिंसा', term: 'Ahimsa', meaning: 'Non-violent truth in communication' },
                  { sanskrit: 'समदर्शन', term: 'Sama-darshana', meaning: 'Equal vision - seeing the divine in all' },
                ].map((teaching, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-orange-500/10">
                    <span className="text-orange-300 font-semibold text-lg">{teaching.sanskrit}</span>
                    <div>
                      <span className="font-medium text-orange-100">{teaching.term}</span>
                      <p className="text-xs text-orange-100/60">{teaching.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Note */}
            <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
              <p className="text-xs text-orange-100/80 leading-relaxed">
                <strong className="text-orange-50">Sacred Boundaries:</strong> This compass offers wisdom, not therapy.
                It never takes sides or tells you to leave or stay. If you're experiencing harm or abuse,
                please reach out to a trusted person or professional support.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/kiaan/chat"
                className="px-4 py-2 rounded-xl bg-white/5 border border-orange-500/30 text-orange-50 text-xs font-semibold hover:border-orange-300/50 transition"
              >
                Deepen with KIAAN
              </Link>
              <Link
                href="/viyog"
                className="px-4 py-2 rounded-xl bg-white/5 border border-orange-500/30 text-orange-50 text-xs font-semibold hover:border-orange-300/50 transition"
              >
                Detachment Coach
              </Link>
              <Link
                href="/ardha"
                className="px-4 py-2 rounded-xl bg-white/5 border border-orange-500/30 text-orange-50 text-xs font-semibold hover:border-orange-300/50 transition"
              >
                Reframe Thoughts
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
