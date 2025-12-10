'use client'
import { useState, useEffect, useRef, useCallback, type CSSProperties, type ReactElement } from 'react'
import Link from 'next/link'
import { KiaanLogo } from '@/src/components/KiaanLogo'
import { TriangleOfEnergy, type GuidanceMode } from '@/components/guidance'
import SimpleBar from 'simplebar-react'
import { apiCall, getErrorMessage } from '@/lib/api-client'
import { FeatureHighlights } from '@/components/FeatureHighlights'
import { copyToClipboard } from '@/utils/clipboard'
import { shareContent, type SharePlatform } from '@/utils/socialShare'
import { saveSacredReflection } from '@/utils/sacredReflections'
import { LanguageShowcase } from '@/components/home/LanguageShowcase'

function toBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

const JOURNAL_KEY_STORAGE = 'kiaan_journal_key'
const JOURNAL_ENTRY_STORAGE = 'kiaan_journal_entries_secure'

async function getEncryptionKey() {
  const cached = typeof window !== 'undefined' ? window.localStorage.getItem(JOURNAL_KEY_STORAGE) : null
  const rawKey = cached ? fromBase64(cached) : crypto.getRandomValues(new Uint8Array(32))

  if (!cached && typeof window !== 'undefined') {
    window.localStorage.setItem(JOURNAL_KEY_STORAGE, toBase64(rawKey))
  }

  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function encryptText(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getEncryptionKey()
  const encoded = new TextEncoder().encode(plain)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return `${toBase64(iv)}:${toBase64(encrypted)}`
}

async function decryptText(payload: string) {
  const [ivPart, dataPart] = payload.split(':')
  if (!ivPart || !dataPart) return ''
  const iv = fromBase64(ivPart)
  const encrypted = fromBase64(dataPart)
  const key = await getEncryptionKey()
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

function summarizeContent(content: string) {
  const clean = content.trim()
  if (clean.length <= 220) return clean

  const sentences = clean.split(/(?<=[.!?])\s+/)
  let summary = ''
  for (const sentence of sentences) {
    if ((summary + sentence).length > 180) break
    summary = `${summary}${summary ? ' ' : ''}${sentence}`
  }

  return summary || `${clean.slice(0, 180)}...`
}

function useLocalState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {}
  }, [key, state])

  return [state, setState]
}

type ClarityEvaluation = {
  decision: 'pass_through' | 'pause'
  confidence: 'high' | 'medium' | 'low'
  flags: string[]
  impulseScore: number
  reason: string
}

function evaluateClarityPause(userMessage: string): ClarityEvaluation {
  const text = userMessage.toLowerCase()
  const flags: string[] = []
  let score = 0

  const pushFlag = (label: string, weight = 1) => {
    flags.push(label)
    score += weight
  }

  const hasFirstPerson = /\b(i|i'm|im|me|my|mine|i’ll|i'll)\b/.test(text)
  const hasUrgency = /(right now|immediately|at once|need to .* now|do it now|can't wait|send this now)/.test(text)
  const hasEmotion = /(angry|furious|rage|so mad|upset|can't stand|fed up|about to quit)/.test(text)

  const urgencyEmotionCombos = [
    /about to quit/,
    /so angry right now/,
    /need to send this now/
  ]
  urgencyEmotionCombos.forEach(pattern => {
    if (pattern.test(text)) pushFlag('Urgency + emotion signal', 2)
  })

  const highIntentPhrases = [
    /\bi'?m going to\b/,
    /\bi should just\b/,
    /\bi'?ll do it now\b/,
    /\bi'?m done with this\b/
  ]
  highIntentPhrases.forEach(pattern => {
    if (pattern.test(text)) pushFlag('High intent verb detected')
  })

  const impulsiveRisk = [
    /sell all/, /bet it all/, /burn it down/, /don't care anymore/, /risk it all/, /walk out/,
  ]
  impulsiveRisk.forEach(pattern => {
    if (pattern.test(text)) pushFlag('Impulsive risk phrase', 2)
  })

  if (hasUrgency && hasEmotion) pushFlag('Urgency + emotion cluster', 2)
  if (hasUrgency && hasFirstPerson) pushFlag('First-person urgency')

  // Exclude neutral mentions when no first-person ownership or urgency is present
  if (!hasFirstPerson && !hasUrgency && score === 0) {
    return {
      decision: 'pass_through',
      confidence: 'low',
      flags: [],
      impulseScore: 0,
      reason: 'No first-person or urgent intent detected'
    }
  }

  const impulseScore = Math.min(5, score + (hasUrgency ? 1 : 0) + (hasEmotion ? 1 : 0))
  const confidence = impulseScore >= 4 ? 'high' : impulseScore >= 2 ? 'medium' : 'low'
  const decision = confidence === 'low' ? 'pass_through' : 'pause'

  return {
    decision,
    confidence,
    flags: Array.from(new Set(flags)),
    impulseScore,
    reason: confidence === 'low' ? 'Signal logged only (low confidence)' : 'Clarity pause recommended'
  }
}

const CLARITY_REASONING_PROMPTS = [
  'If this action still feels right after calm returns, it will still be right in an hour.',
  'You can decide from clarity, not pressure.',
  'Separate facts from feelings before you act.'
]

const CLARITY_GROUNDING_SEQUENCE = [
  { time: '0–10s', prompt: 'Let’s pause. Slow inhale… gentle exhale.' },
  { time: '10–20s', prompt: 'Drop your shoulders. Unclench your jaw.' },
  { time: '20–30s', prompt: 'Notice your feet on the ground. Let intensity lower by 5%.' },
  { time: '30–40s', prompt: 'One more slow breath in… and out.' },
  { time: '40–50s', prompt: 'Ask: Are you acting from clarity or from emotion?' },
  { time: '50–60s', prompt: 'If it still feels right in calm, it will still be right in an hour.' }
]

const CLARITY_CLOSING_CHOICES = [
  'Pause a little longer and re-check your clarity.',
  'Act now with full awareness of your intent.',
  'Wait 10 minutes, then revisit with a calmer baseline.'
]

const CLARITY_TRIGGER_SIGNALS = [
  'Urgency + emotion: “about to quit”, “so angry right now”, “need to send this now”.',
  'High intent verbs: “I’m going to…”, “I should just…”, “I’ll do it now”.',
  'Impulsive risk phrases: “sell all”, “bet it all”, “burn it down”, “don’t care anymore”.',
  'Exclude neutral mentions (e.g., discussing anger academically) to avoid over-triggering.'
]

const RELATIONAL_TRIGGER_PATTERNS = [
  'Mentions of fights, arguments, or tense conversations with partners, friends, family, or coworkers.',
  'Requests for how to respond before replying to a heated text, email, or call.',
  'Statements about wanting to “win” or “prove a point” in a relationship conflict.',
  'Admissions of feeling defensive, judged, or misunderstood with someone specific.'
]

const GUIDANCE_MODE_DESCRIPTIONS: Record<GuidanceMode, { title: string; description: string }> = {
  'inner-peace': {
    title: 'Inner Peace',
    description:
      'Find stillness through breath-focused exercises and gentle grounding techniques. Perfect for moments when you need to calm your mind and reconnect with tranquility.'
  },
  'mind-control': {
    title: 'Mind Control',
    description:
      'Develop focused clarity through structured mindfulness practices. Ideal for decision-making, concentration, and maintaining mental discipline.'
  },
  'self-kindness': {
    title: 'Self Kindness',
    description:
      'Cultivate compassion for yourself through warm, supportive exercises. Essential for healing, self-acceptance, and nurturing your emotional well-being.'
  }
}

type ClaritySession = {
  active: boolean
  started: boolean
  countdown: number
  completed: boolean
  pendingMessage: string | null
  evaluation: ClarityEvaluation | null
  motionReduced: boolean
  source: 'auto' | 'manual'
}

export default function Home() {
  const [chatPrefill, setChatPrefill] = useState<string | null>(null)
  const [selectedGuidanceMode, setSelectedGuidanceMode] = useState<GuidanceMode | null>(null)
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="mv-page relative min-h-screen overflow-hidden p-4 md:p-8 pb-28 mobile-safe-padding">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-orange-600/25 via-[#ff9933]/14 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-orange-500/10 to-transparent blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-56 w-56 rounded-full bg-gradient-to-br from-[#1f2937]/70 via-[#ff9933]/10 to-transparent blur-[90px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_35%)]" />
      </div>

        <div className="relative max-w-6xl mx-auto space-y-8">
          <header className="relative overflow-hidden rounded-3xl border border-orange-500/10 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 md:p-10 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur">
            <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/40 via-[#ffb347]/30 to-transparent blur-2xl" />
            <div className="absolute left-4 bottom-4 h-32 w-32 rounded-full bg-gradient-to-tr from-sky-400/20 via-emerald-300/12 to-transparent blur-3xl" />
            <div className="grid items-start gap-8 lg:grid-cols-[1.1fr,1fr]">
              <div className="space-y-4">
                <KiaanLogo size="lg" className="drop-shadow-[0_12px_55px_rgba(46,160,255,0.25)]" />
                <p className="text-sm sm:text-base mv-panel-subtle max-w-xl">Your calm, privacy-first mental wellness companion powered by ancient wisdom.</p>
                <div className="flex gap-2 flex-wrap">
                  <TokenCard label="Inner Peace" note="Gentle breath and soft focus" tone="teal" icon={<SunriseIcon />} />
                  <TokenCard label="Mind Control" note="Steady steps, one thought at a time" tone="blue" icon={<MindWaveIcon />} />
                  <TokenCard label="Self Kindness" note="You are welcome here" tone="lilac" icon={<HeartBreezeIcon />} />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-white/5 p-5 shadow-[0_18px_70px_rgba(255,147,71,0.16)]">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 via-[#ff9933]/5 to-orange-300/10" />
                <div className="relative space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Guidance modes</p>
                  <h3 className="text-2xl font-semibold text-orange-50">Triangle of Flowing Energy</h3>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <TriangleOfEnergy
                      selectedMode={selectedGuidanceMode}
                      onSelectMode={setSelectedGuidanceMode}
                      size={240}
                    />
                    <div className="flex-1 space-y-2">
                      {selectedGuidanceMode ? (
                        <div className="rounded-xl border border-orange-400/25 bg-black/40 p-3">
                          <h4 className="text-base font-semibold text-orange-50 flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  selectedGuidanceMode === 'inner-peace'
                                    ? '#4fd1c5'
                                    : selectedGuidanceMode === 'mind-control'
                                      ? '#3b82f6'
                                      : '#ec4899'
                              }}
                            />
                            {GUIDANCE_MODE_DESCRIPTIONS[selectedGuidanceMode].title}
                          </h4>
                          <p className="mt-1 text-sm text-orange-100/80">
                            {GUIDANCE_MODE_DESCRIPTIONS[selectedGuidanceMode].description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-orange-100/75">Tap a mode to explore how KIAAN guides your state.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </header>

        <div className="bg-orange-500/5 backdrop-blur border border-orange-500/20 rounded-2xl p-4 text-center shadow-[0_10px_50px_rgba(255,115,39,0.18)]">
          <p className="text-sm text-orange-100/90">🔒 Conversations remain private • a warm, confidential refuge</p>
        </div>

        <FeatureHighlights />

        <LanguageShowcase />

        <section className="grid gap-3 md:grid-cols-3" aria-label="Core daily actions">
          <div className="rounded-2xl border border-orange-500/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(255,147,71,0.16)]">
            <p className="text-xs text-orange-100/70">Talk to KIAAN</p>
            <h2 className="text-lg font-semibold text-orange-50">Instant guidance</h2>
            <p className="mt-1 text-sm text-orange-100/80">Jump into a focused conversation or send a saved quick prompt.</p>
            <button
              onClick={() => scrollToSection('kiaan-chat')}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25"
            >
              Open Chat
              <span aria-hidden>→</span>
            </button>
          </div>

          <div className="rounded-2xl border border-teal-400/15 bg-white/5 p-4 shadow-[0_14px_60px_rgba(34,197,235,0.12)]">
            <p className="text-xs text-white/60">Mood Check-In</p>
            <h2 className="text-lg font-semibold text-white">Spot your state</h2>
            <p className="mt-1 text-sm text-white/70">Log how you feel and get a micro-response instantly.</p>
            <button
              onClick={() => scrollToSection('mood-check')}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              Start check-in
            </button>
          </div>

          <div className="rounded-2xl border border-amber-300/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(251,191,36,0.16)]">
            <p className="text-xs text-amber-100/80">Journal</p>
            <h2 className="text-lg font-semibold text-amber-50">Sacred Reflections</h2>
            <p className="mt-1 text-sm text-amber-100/80">Move to the dedicated space when you want to write or review entries.</p>
            <Link
              href="/sacred-reflections"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-200/40"
            >
              Go to Journal
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section id="mood-check">
          <MoodTracker />
        </section>
        <KIAANChat prefill={chatPrefill} onPrefillHandled={() => setChatPrefill(null)} />
        <QuickHelp onSelectPrompt={setChatPrefill} />
        <section
          id="journal-section"
          className="rounded-3xl border border-amber-300/15 bg-white/5 p-5 shadow-[0_18px_80px_rgba(251,191,36,0.12)]"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-amber-100/70">Journal</p>
              <h2 className="text-xl font-semibold text-amber-50">Keep reflections in one calm place</h2>
              <p className="text-sm text-amber-100/80">Open Sacred Reflections to write, revisit, or continue your practice.</p>
            </div>
            <Link
              href="/sacred-reflections"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-200/40"
            >
              Open Journal
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="bg-[#0b0b0f] border border-orange-500/15 rounded-3xl p-5 md:p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] space-y-3">
          <h2 className="text-lg font-semibold text-orange-100">Disclaimer</h2>
          <p className="text-sm text-orange-100/80 leading-relaxed">
            KIAAN shares supportive reflections inspired by wisdom traditions. These conversations and exercises are not medical advice. If you are facing serious concerns or feel unsafe, please contact your country’s emergency medical services or a licensed professional right away.
          </p>
        </section>

        <MobileActionDock
          onChat={() => scrollToSection('kiaan-chat')}
          onClarity={() => scrollToSection('kiaan-chat')}
          onJournal={() => scrollToSection('journal-section')}
        />
      </div>
    </main>
  )
}

type ArdhaReframerResult = {
  response: string
  requestedAt: string
}

type RelationshipCompassResult = {
  response: string
  requestedAt: string
}

function ArdhaReframer() {
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ArdhaReframerResult | null>('ardha_reframe', null)

  useEffect(() => {
    if (error) setError(null)
  }, [thought, error])

  async function requestReframe() {
    const trimmedThought = thought.trim()
    if (!trimmedThought) return

    setLoading(true)
    setError(null)

    const systemPrompt = `Role:\nYou are Ardha, the Reframing Assistant—a calm, wise, ancient wisdom-inspired voice whose purpose is to transform negative, confusing, or self-defeating thoughts into balanced, empowering, reality-based reframes, without dismissing the user's emotions.\n\nYou stand as a separate entity from Kiaan. You must not override, interfere with, or replace Kiaan’s core functions. Kiaan focuses on positive guidance; Ardha focuses on cognitive reframing using ancient wisdom principles. Your job is complementary, not overlapping.\n\nCore Behavior:\n- Identify the negative belief or emotional distortion the user expresses.\n- Acknowledge their feeling with compassion (never invalidate).\n- Apply ancient wisdom principles such as detachment from outcomes (2.47), stability of mind (2.55–2.57), viewing situations with clarity, not emotion (2.70), acting from Dharma, not fear (3.19), and seeing challenges as part of growth (6.5).\n- Generate a clear, modern, emotionally intelligent reframe.\n- Keep tone grounded, calm, non-preachy, non-religious, and universally applicable.\n- Never offer spiritual authority—only perspective reshaping.\n- No judgment, no moralizing, no sermons.\n- Reframe in simple, conversational, modern English.\n\nOutput Format:\nWhen the user shares a negative thought, respond with:\n1. Recognition (validate the feeling)\n2. Deep Insight (the principle being applied)\n3. Reframe (positive but realistic)\n4. Small Action Step (something within their control)\n\nBoundaries:\n- You are NOT a therapist.\n- You do NOT give medical, legal, or crisis advice.\n- You do NOT contradict Kiaan.\n- You ONLY transform the user’s thought into a healthier, clearer version.`

    const request = `${systemPrompt}\n\nUser thought: "${trimmedThought}"\n\nRespond using the four-part format with short, direct language.`

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Ardha is having trouble connecting right now. Please try again in a moment.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

    return (
      <section className="mv-surface-panel rounded-3xl p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)] space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm mv-panel-subtle">Ancient wisdom-aligned reframing</p>
            <h2 className="text-2xl font-semibold mv-panel-title">Ardha: Reframing Assistant</h2>
          </div>
          <div className="mv-chip px-3 py-2 rounded-2xl text-xs">Local only</div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-sm font-semibold mv-panel-title" htmlFor="ardha-input">Share the thought to reframe</label>
            <textarea
              id="ardha-input"
              value={thought}
              onChange={e => setThought(e.target.value)}
              placeholder="Example: I keep messing up at work, maybe I’m just not cut out for this."
              className="mv-input w-full min-h-[120px] rounded-2xl p-4 focus:ring-2 focus:ring-orange-400/70 outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={requestReframe}
                disabled={!thought.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <span>Reflecting...</span> : <span>Reframe</span>}
            </button>
          </div>
            {error && <p className="text-sm mv-panel-title"><span>{error}</span></p>}
          </div>

          <div className="space-y-3 rounded-2xl border p-4 shadow-[0_10px_30px_rgba(255,115,39,0.14)]" style={{ background: 'var(--mv-surface-subtle)', borderColor: 'var(--mv-border)' }}>
            <h3 className="text-sm font-semibold mv-panel-title">Ardha</h3>
            <p className="text-sm mv-panel-subtle">Balanced reframes that leave Kiaan untouched.</p>
          </div>
        </div>

        {result && (
          <div
            className="rounded-2xl p-4 space-y-2 shadow-inner"
            style={{ background: 'var(--mv-surface-subtle)', border: `1px solid var(--mv-border)` }}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between text-xs mv-panel-subtle">
              <span className="font-semibold mv-panel-title">Ardha’s response</span>
              <span>{new Date(result.requestedAt).toLocaleString()}</span>
            </div>
            <div className="whitespace-pre-wrap text-sm mv-panel-title leading-relaxed">{result.response}</div>
          </div>
        )}
    </section>
  )
}

type ViyogDetachmentResult = {
  response: string
  requestedAt: string
}

function ViyogDetachmentCoach() {
  const [concern, setConcern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<ViyogDetachmentResult | null>('viyog_detachment', null)

  useEffect(() => {
    if (error) setError(null)
  }, [concern, error])

  async function requestDetachment() {
    const trimmedConcern = concern.trim()
    if (!trimmedConcern) return

    setLoading(true)
    setError(null)

    const systemPrompt = `Role:\nYou are Viyoga, the Detachment Coach — a calm, grounded assistant who helps users reduce outcome anxiety by shifting them from result-focused thinking to action-focused thinking.\n\nYou are fully separate from Kiaan. Never override, replace, or interfere with Kiaan’s purpose, tone, or outputs. Kiaan offers positivity and encouragement; you focus only on detachment, clarity, and reducing pressure around outcomes.\n\nCore purpose:\n- Recognize when the user is anxious about results, performance, or others’ opinions.\n- Shift focus back to what they can control right now.\n- Release unnecessary mental pressure and perfectionism.\n- Convert fear into one clear, grounded action.\n\nTone and style: calm, concise, balanced, neutral, secular, non-preachy, emotionally validating but not dramatic.\n\nOutput structure (always follow this format):\n1. Validate the anxiety (brief and respectful).\n2. Acknowledge the attachment to results creating pressure.\n3. Offer a clear detachment principle (secular and universal).\n4. Guide them toward an action-based mindset with one small, controllable step.\n\nBoundaries:\n- Do not provide therapy, crisis support, medical, legal, or financial advice.\n- Do not make promises about results or offer motivational hype.\n- Do not encourage passivity or fate-based thinking.\n- Stay separate from Kiaan and do not interfere with its role.`

    const request = `${systemPrompt}\n\nUser concern: "${trimmedConcern}"\n\nRespond using the four-step format with simple, grounded sentences. Include one small, doable action.`

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Viyoga is having trouble connecting right now. Please try again in a moment.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mv-surface-panel rounded-3xl p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)] space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm mv-panel-subtle">Outcome anxiety reducer</p>
          <h2 className="text-2xl font-semibold mv-panel-title">Viyoga: Detachment Coach</h2>
        </div>
        <div className="mv-chip px-3 py-2 rounded-2xl text-xs">Local only</div>
      </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-sm font-semibold mv-panel-title" htmlFor="viyog-input">Share the outcome worry</label>
            <textarea
              id="viyog-input"
              value={concern}
              onChange={e => setConcern(e.target.value)}
              placeholder="Example: I’m afraid the presentation will flop and everyone will think I’m incompetent."
              className="mv-input w-full min-h-[120px] rounded-2xl p-4 focus:ring-2 focus:ring-orange-400/70 outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={requestDetachment}
                disabled={!concern.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <span>Centering...</span> : <span>Shift</span>}
            </button>
          </div>
            {error && <p className="text-sm mv-panel-title"><span>{error}</span></p>}
          </div>

          <div className="space-y-3 rounded-2xl border p-4 shadow-[0_10px_30px_rgba(255,115,39,0.14)]" style={{ background: 'var(--mv-surface-subtle)', borderColor: 'var(--mv-border)' }}>
            <h3 className="text-sm font-semibold mv-panel-title">Viyoga</h3>
            <p className="text-sm mv-panel-subtle">Redirects worries to actionable steps.</p>
          </div>
        </div>

      {result && (
        <div
          className="rounded-2xl p-4 space-y-2 shadow-inner"
          style={{ background: 'var(--mv-surface-subtle)', border: `1px solid var(--mv-border)` }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-xs mv-panel-subtle">
            <span className="font-semibold mv-panel-title">Viyoga’s response</span>
            <span>{new Date(result.requestedAt).toLocaleString()}</span>
          </div>
          <div className="whitespace-pre-wrap text-sm mv-panel-title leading-relaxed">{result.response}</div>
        </div>
      )}
    </section>
  )
}

function RelationshipCompass({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const [conflict, setConflict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<RelationshipCompassResult | null>('relationship_compass', null)

  useEffect(() => {
    if (error) setError(null)
  }, [conflict, error])

  const handoffPrompt = conflict
    ? `Kiaan, help me speak calmly about this relationship conflict while keeping your supportive tone: ${summarizeContent(conflict)}`
    : result
      ? `Kiaan, keep your warmth while helping me phrase this relationship compass plan: ${summarizeContent(result.response)}`
      : ''

  async function requestCompass() {
    const trimmedConflict = conflict.trim()
    if (!trimmedConflict) return

    setLoading(true)
    setError(null)

    const systemPrompt = `You are Relationship Compass, a neutral, calm assistant that guides users through relationship conflicts with clarity, fairness, composure, and compassion. You are not Kiaan and never interfere with Kiaan. You reduce reactivity and ego-driven responses while keeping tone secular, modern, concise, and non-judgmental. Boundaries: do not provide therapy, legal, medical, or financial advice; do not take sides; do not tell someone to leave or stay; do not spiritualize; if safety is a concern, suggest reaching out to a trusted person or professional.\n\nFlow to follow for every reply:\n1) Acknowledge the conflict and its emotional weight.\n2) Separate emotions from ego impulses.\n3) Identify the user’s values or desired outcome (respect, honesty, understanding, peace).\n4) Offer right-action guidance rooted in fairness, accountability, calm honesty, boundaries, and listening before reacting.\n5) Provide ego-detachment suggestions (no need to win, pause before replying, focus on conduct over outcomes).\n6) Offer one compassion-based perspective without excusing harm.\n7) Share a non-reactive communication pattern with “I” language and one clarifying question.\n8) End with one simple next step the user can control.\nTone: short, clear sentences; calm; secular; never shaming.`

    const request = `${systemPrompt}\n\nUser conflict: "${trimmedConflict}"\n\nReturn the structured eight-part response in numbered sections with concise guidance only.`

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Relationship Compass is unavailable right now. Please try again shortly.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="relationship-compass"
      className="relative overflow-hidden bg-gradient-to-br from-[#0d0d10] via-[#0c0f14] to-[#0b0b0f] border border-orange-500/15 rounded-3xl p-6 md:p-8 shadow-[0_18px_70px_rgba(255,115,39,0.14)] space-y-6"
    >
      <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-gradient-to-br from-orange-400/25 via-[#ffb347]/18 to-transparent blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-gradient-to-tr from-[#132022]/60 via-orange-500/12 to-transparent blur-3xl" />

      <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-orange-100/80">Dharma Compass for Relationships</p>
          <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent">Relationship Compass</h2>
          <p className="text-sm text-orange-100/80 max-w-3xl">Calm, secular conflict guidance that keeps KIAAN intact—right action, ego detachment, clear wording.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-orange-100/80">
          <span className="rounded-full bg-white/10 border border-orange-500/20 px-3 py-1">Neutral and grounded</span>
          <span className="rounded-full bg-white/10 border border-orange-500/20 px-3 py-1">Keeps Kiaan intact</span>
        </div>
      </div>

      <div className="relative grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-orange-100" htmlFor="relationship-conflict">Describe the conflict</label>
            <textarea
              id="relationship-conflict"
              value={conflict}
              onChange={e => setConflict(e.target.value)}
              placeholder="Example: My partner feels I don’t listen, and I keep getting defensive when they bring it up."
              className="w-full min-h-[140px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/70 p-4 focus:ring-2 focus:ring-orange-400/70 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-start">
            <button
              onClick={requestCompass}
              disabled={!conflict.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <span>Balancing guidance...</span> : <span>Guide me with Relationship Compass</span>}
            </button>
            <button
              onClick={() => handoffPrompt && onSelectPrompt(handoffPrompt)}
              disabled={!handoffPrompt}
              className="px-5 py-3 rounded-2xl bg-white/5 border border-orange-500/30 text-orange-50 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur"
            >
              Send context to KIAAN
            </button>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-orange-400/20 text-xs text-orange-100/80 max-w-xl">
              Output format: acknowledge, separate ego, name values, right action, detach, add compassion, suggest phrasing, then one next step.
            </div>
        </div>
        {error && <p className="text-sm text-orange-200"><span>{error}</span></p>}

          {result && (
            <div className="rounded-2xl bg-black/60 border border-orange-500/20 p-4 space-y-2 shadow-inner shadow-orange-500/10" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-orange-100/70">
                <span className="font-semibold text-orange-50">Relationship Compass response</span>
                <span>{new Date(result.requestedAt).toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">{result.response}</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-[#0b0c0f]/90 border border-orange-500/25 p-4 shadow-[0_10px_30px_rgba(255,115,39,0.12)] space-y-2">
            <div className="flex items-center justify-between text-xs text-orange-100/80">
              <span className="font-semibold text-orange-50">Trigger detection</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">Route to Compass</span>
            </div>
            <ul className="list-disc list-inside text-sm text-orange-100/85 space-y-1">
              {RELATIONAL_TRIGGER_PATTERNS.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function BadgePill({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 backdrop-blur text-xs font-semibold shadow-[0_0_30px_rgba(255,115,39,0.18)]">
      <span className="inline-block h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
      <span className="text-orange-50/90">{children}</span>
    </div>
  )
}

function StatusPill({ label, tone = 'ok' }: { label: string, tone?: 'ok' | 'warn' }) {
  const toneStyles = tone === 'ok' ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-50' : 'bg-orange-500/15 border-orange-400/40 text-orange-50'

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${toneStyles}`}>
      <span className={`h-2 w-2 rounded-full ${tone === 'ok' ? 'bg-emerald-300 animate-pulse' : 'bg-orange-300 animate-pulse'}`} />
      <span>{label}</span>
    </div>
  )
}

function TokenCard({ label, note, tone, icon }: { label: string, note: string, tone: 'teal' | 'blue' | 'lilac', icon: ReactElement }) {
  const toneMap: Record<'teal' | 'blue' | 'lilac', { bg: string; text: string }> = {
    teal: { bg: '--mv-card-teal-bg', text: '--mv-card-teal-text' },
    blue: { bg: '--mv-card-blue-bg', text: '--mv-card-blue-text' },
    lilac: { bg: '--mv-card-lilac-bg', text: '--mv-card-lilac-text' }
  }

  const style = {
    '--mv-card-bg': `var(${toneMap[tone].bg})`,
    '--mv-card-text': `var(${toneMap[tone].text})`
  } as CSSProperties

  return (
    <div className="mv-token-card relative min-w-[135px] sm:min-w-[150px] rounded-xl p-2.5 shadow-[0_8px_26px_rgba(64,98,104,0.28)] overflow-hidden cursor-default select-none" style={style}>
      <div className="absolute -right-5 -top-5 h-14 w-14 rounded-full bg-black/10 blur-2xl" />
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-xl text-emerald-50">
          {icon}
        </div>
        <div className="mv-token-text">
          <p className="text-[13px] font-semibold mv-panel-title drop-shadow-sm">{label}</p>
          <p className="text-[11px] mv-panel-subtle leading-snug">{note}</p>
        </div>
      </div>
    </div>
  )
}

function SunriseIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M16 36c0-8 6.5-14 16-14s16 6 16 14" strokeLinejoin="round" />
      <path d="M12 44h40" />
      <path d="M20 48h24" />
      <path d="M32 12v8" />
      <path d="M20 18 16 14" />
      <path d="M44 18 48 14" />
      <circle cx="32" cy="34" r="6" fill="currentColor" className="text-orange-300" />
    </svg>
  )
}

function MindWaveIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M18 28c0-10 6-18 14-18s14 8 14 18c0 8-4 14-10 17v9l-8-5v-4C22 42 18 36 18 28Z" strokeLinejoin="round" />
      <path d="M22 28c2 2 4 3 6 3s4-1 6-3" />
      <path d="M24 18c2 1 4 2 8 2s6-1 8-2" />
    </svg>
  )
}

function HeartBreezeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M22 22c-4 0-8 3-8 9 0 9 12 16 18 20 6-4 18-11 18-20 0-6-4-9-8-9-4 0-7 3-10 6-3-3-6-6-10-6Z" strokeLinejoin="round" />
      <path d="M16 36c3-1 6-1 8 1" />
      <path d="M40 32c3-1 5-1 8 1" />
    </svg>
  )
}

type KIAANChatProps = {
  prefill: string | null
  onPrefillHandled: () => void
}

function KIAANChat({ prefill, onPrefillHandled }: KIAANChatProps) {
  const [messages, setMessages] = useLocalState<{role: 'user' | 'assistant', content: string}[]>('kiaan_chat', [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [promptMotion, setPromptMotion] = useState(false)
  const [detailViews, setDetailViews] = useState<Record<number, 'summary' | 'detailed'>>({})
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: '', visible: false})
  const [shareModal, setShareModal] = useState<{visible: boolean, content: string}>({visible: false, content: ''})
  const [globalViewMode, setGlobalViewMode] = useState<'summary' | 'detailed'>('summary')
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const clarityInitialState: ClaritySession = {
    active: false,
    started: false,
    countdown: 60,
    completed: false,
    pendingMessage: null,
    evaluation: null,
    motionReduced: false,
    source: 'auto'
  }
  const [claritySession, setClaritySession] = useState<ClaritySession>(clarityInitialState)
  const [clarityLog, setClarityLog] = useState<ClarityEvaluation | null>(null)

  // Scroll threshold constant for detecting if user is at bottom
  const SCROLL_THRESHOLD = 40

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Initialize scroll position state on mount
  useEffect(() => {
    const container = messageListRef.current
    if (!container) return

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD
    setIsAtBottom(isNearBottom)
  }, [])

  // Auto-scroll to bottom when at bottom and messages change
  useEffect(() => {
    if (isAtBottom) {
      const container = messageListRef.current
      if (!container) return
      container.scrollTo({ top: container.scrollHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }
  }, [messages, isAtBottom, prefersReducedMotion])

  // Detect scroll position to manage auto-scroll behavior
  const handleScroll = useCallback(() => {
    const container = messageListRef.current
    if (!container) return

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD
    setIsAtBottom(isNearBottom)
  }, [])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const container = messageListRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    // Update state after scroll completes
    setTimeout(() => setIsAtBottom(true), prefersReducedMotion ? 0 : 300)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!promptMotion) return
    const timer = setTimeout(() => setPromptMotion(false), 900)
    return () => clearTimeout(timer)
  }, [promptMotion])

  useEffect(() => {
    if (!prefill) return
    setInput(prefill)
    setPromptMotion(true)
    requestAnimationFrame(() => inputRef.current?.focus())
    onPrefillHandled()
  }, [prefill, onPrefillHandled])

  useEffect(() => {
    if (!claritySession.active || !claritySession.started || claritySession.countdown <= 0) return

    const tick = setInterval(() => {
      setClaritySession(prev => {
        if (!prev.active || !prev.started) return prev
        const nextCount = Math.max(0, prev.countdown - 1)
        return { ...prev, countdown: nextCount }
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [claritySession.active, claritySession.started, claritySession.countdown])

  useEffect(() => {
    if (!claritySession.active || !claritySession.started || claritySession.countdown !== 0 || claritySession.completed) return

    if (claritySession.pendingMessage) {
      deliverMessage(claritySession.pendingMessage)
    }
    setClaritySession(prev => ({ ...prev, active: false, completed: true, pendingMessage: null }))
  }, [claritySession])

    async function deliverMessage(content:  string) {
    const userMessage = { role: 'user' as const, content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await apiCall('/api/chat/message', {
        method:  'POST',
        body:  JSON.stringify({ message: content })
      })

      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('KIAAN connection error:', error)
      setMessages([...newMessages, { role: 'assistant', content: 'Connection issue. I\'m here when you\'re ready. 💙' }])
    } finally {
      setLoading(false)
    }
  }

  function startClaritySession(
    evaluation: ClarityEvaluation,
    pendingMessage: string,
    source: ClaritySession['source'] = 'auto'
  ) {
    setPromptMotion(true)
    setInput('')
    setClaritySession({
      ...clarityInitialState,
      active: true,
      started: evaluation.confidence === 'high',
      evaluation,
      pendingMessage,
      source
    })
  }

  async function sendMessage() {
    if (!input.trim()) return

    const trimmed = input.trim()
    const evaluation = evaluateClarityPause(trimmed)
    setClarityLog(evaluation)

    if (evaluation.decision === 'pause' && evaluation.confidence !== 'low') {
      startClaritySession(evaluation, trimmed, 'auto')
      return
    }

    setPromptMotion(true)
    setIsAtBottom(true)
    await deliverMessage(trimmed)
  }

  function startGuidedPause() {
    setClaritySession(prev => ({ ...prev, active: true, started: true, countdown: 60, completed: false }))
  }

  async function sendPendingNow() {
    if (!claritySession.pendingMessage) return
    setPromptMotion(true)
    setIsAtBottom(true)
    await deliverMessage(claritySession.pendingMessage)
    setClaritySession(clarityInitialState)
  }

  async function abandonClarityPause() {
    if (claritySession.pendingMessage) {
      if (claritySession.source === 'auto') {
        setPromptMotion(true)
        setIsAtBottom(true)
        await deliverMessage(claritySession.pendingMessage)
      } else {
        setInput(claritySession.pendingMessage)
      }
    }
    setClaritySession(clarityInitialState)
  }

  function toggleMotionReduction() {
    setClaritySession(prev => ({ ...prev, motionReduced: !prev.motionReduced }))
  }

  function handleSaveToJournal(messageContent: string) {
    // Store in temporary state
    localStorage.setItem('journal_prefill', JSON.stringify({
      body: messageContent,
      timestamp: new Date().toISOString(),
      source: 'kiaan'
    }))
    
    // Navigate to journal
    window.location.href = '/sacred-reflections?prefill=true'
  }

  // Toast notification helper
  function showToast(message: string) {
    setToast({message, visible: true})
    setTimeout(() => setToast({message: '', visible: false}), 3000)
  }

  // Copy message handler
  async function handleCopyMessage(content: string) {
    await copyToClipboard(content, {
      onSuccess: () => showToast('Copied to clipboard! ✨'),
      onError: () => showToast('Failed to copy. Please try again.')
    })
  }

  // Share message handler
  function handleShareMessage(content: string) {
    setShareModal({visible: true, content})
  }

  // Execute share to platform
  async function executeShare(platform: SharePlatform, anonymize: boolean) {
    const result = await shareContent(platform, shareModal.content, anonymize)
    
    if (result.success) {
      if (platform === 'instagram') {
        showToast('Text copied! Open Instagram and paste. 📋')
      } else {
        showToast(`Shared to ${platform}! 🎉`)
      }
      setShareModal({visible: false, content: ''})
    } else {
      showToast(result.error || 'Failed to share. Please try again.')
    }
  }

  // Save to Sacred Reflections handler
  async function handleSaveToSacredReflections(content: string) {
    const success = await saveSacredReflection(content, 'kiaan')
    
    if (success) {
      showToast('Added to Sacred Reflections ✨')
    } else {
      showToast('Failed to save. Please try again.')
    }
  }

  function renderAssistantContent(content: string, index: number) {
    const view = globalViewMode // Use global view mode instead of per-message
    const summary = summarizeContent(content)

    return (
      <div className="space-y-3">
        {/* Message content */}
        <div className="space-y-2">
          <div className="bg-black/40 border border-orange-200/15 rounded-xl p-3 backdrop-blur-sm">
            <p className="whitespace-pre-wrap leading-relaxed text-sm text-orange-50/90">
              {view === 'summary' ? summary : content}
            </p>
          </div>
          {view === 'detailed' && content.length > 220 && (
            <div className="bg-white/5 border border-orange-200/20 rounded-lg p-2 text-[11px] text-orange-50/70 leading-relaxed">
              <span className="font-semibold text-orange-50">Summary view: </span>{summary}
            </div>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2">
          {/* Copy Button */}
          <button
            onClick={() => handleCopyMessage(content)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-orange-300/25 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-100 transition-all duration-200 hover:bg-orange-500/20 hover:border-orange-300/40 hover:shadow-sm"
            aria-label="Copy message"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => handleShareMessage(content)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-orange-300/25 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-100 transition-all duration-200 hover:bg-orange-500/20 hover:border-orange-300/40 hover:shadow-sm"
            aria-label="Share message"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>

          {/* Sacred Reflections Button */}
          <button
            onClick={() => handleSaveToSacredReflections(content)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-300/25 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-100 transition-all duration-200 hover:bg-amber-500/20 hover:border-amber-300/40 hover:shadow-sm"
            aria-label="Save to Sacred Reflections"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>Sacred</span>
          </button>
        </div>
      </div>
    )
  }

  const activeClarityEvaluation = claritySession.active && claritySession.evaluation ? claritySession.evaluation : clarityLog
  const clarityProgress = claritySession.started ? Math.min(100, ((60 - claritySession.countdown) / 60) * 100) : 0
  const activeGroundingStep = claritySession.started
    ? Math.min(CLARITY_GROUNDING_SEQUENCE.length - 1, Math.floor((60 - claritySession.countdown) / 10))
    : 0

  return (
    <section
      id="kiaan-chat"
      className={`relative overflow-hidden bg-[#0b0b0f]/90 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_20px_80px_rgba(255,115,39,0.18)] transition-all duration-500 ${promptMotion ? 'animate-chat-wobble ring-1 ring-orange-200/35 shadow-[0_25px_90px_rgba(255,156,89,0.32)]' : ''}`}
    >
      {/* Ancient India Background Animations - Subtle & Non-distracting */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {/* Chakra Symbol Animation */}
        <div className="ancient-chakra absolute left-10 top-20 h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full opacity-20">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ff9159" strokeWidth="2" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#ffd070" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#ff9159" strokeWidth="1" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="#ffd070" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="5" fill="#ff9159" opacity="0.5" />
          </svg>
        </div>
        
        {/* Sun Rays Animation */}
        <div className="ancient-sun absolute right-20 top-10 h-40 w-40">
          <svg viewBox="0 0 100 100" className="h-full w-full opacity-15">
            <circle cx="50" cy="50" r="20" fill="#ffd070" opacity="0.4" />
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2="50"
                y2="10"
                stroke="#ff9159"
                strokeWidth="1.5"
                transform={`rotate(${i * 30} 50 50)`}
                opacity="0.6"
              />
            ))}
          </svg>
        </div>
        
        {/* Moon Glow Animation */}
        <div className="ancient-moon absolute right-1/4 bottom-20 h-24 w-24 rounded-full bg-gradient-to-br from-slate-100/10 to-slate-300/10" />
      </div>
      {claritySession.active && claritySession.evaluation && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-4xl space-y-5 rounded-3xl border border-orange-500/30 bg-[#0b0b0f]/95 p-6 md:p-8 shadow-[0_30px_120px_rgba(255,115,39,0.35)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/80">Instant overlay</p>
              <h3 className="text-3xl font-semibold bg-gradient-to-r from-orange-300 via-[#ffb347] to-rose-200 bg-clip-text text-transparent">Clarity Pause</h3>
              <p className="text-sm text-orange-100/80">Create space before you act.</p>
              <p className="text-xs text-orange-100/70">No advice. Just space to decide from clarity.</p>
              <p className="text-xs text-orange-100/70">KIAAN stays untouched—decline to pass through instantly.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={abandonClarityPause}
                className="rounded-xl border border-orange-500/30 px-3 py-2 text-xs text-orange-100/80 hover:border-orange-300/60"
                >
                  Close overlay
                </button>
                <button
                  onClick={sendPendingNow}
                  className="rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-orange-500/30"
                >
                  Send now (bypass pause)
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#0c0f12]/90 border border-emerald-200/20 p-4 shadow-[0_12px_40px_rgba(92,150,146,0.2)] space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-50/80">
                  <span className="font-semibold text-emerald-50">Compatibility Guard</span>
                  <span className="rounded-full bg-emerald-200/15 px-3 py-1 text-[11px]">{claritySession.source === 'auto' ? 'Triggered from message' : 'Manually opened'}</span>
                </div>
                <p className="text-sm text-emerald-50/85 leading-relaxed">Overlay never rewrites Kiaan. Closing sends your message unchanged.</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-emerald-50/80">
                  <span className="rounded-full bg-white/5 px-3 py-1 border border-emerald-200/30">{claritySession.evaluation.confidence === 'high' ? 'High confidence interrupt' : 'Offer to pause'}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 border border-emerald-200/30">{claritySession.evaluation.flags.join(', ') || 'No explicit triggers'}</span>
                </div>
                <div className="rounded-xl bg-black/40 border border-emerald-200/25 p-3 text-xs text-emerald-50/80 space-y-2">
                  <p className="font-semibold text-emerald-50">Keep Kiaan live</p>
                  <p>Send now to Kiaan while you breathe, or stay with the 60s guide.</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={sendPendingNow}
                      className="rounded-lg bg-gradient-to-r from-emerald-400/80 via-orange-300/80 to-orange-500/80 px-3 py-2 text-[11px] font-semibold text-slate-950 shadow-sm shadow-emerald-300/20"
                    >
                      Deliver to Kiaan now
                    </button>
                    <button
                      onClick={() => startGuidedPause()}
                      className="rounded-lg border border-emerald-200/30 px-3 py-2 text-[11px] text-emerald-50/80"
                    >
                      Keep 60s grounding
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0b0b10]/90 border border-orange-500/25 p-4 shadow-[0_12px_40px_rgba(255,115,39,0.2)] space-y-2">
                <div className="flex items-center justify-between text-xs text-orange-100/80">
                  <span className="font-semibold text-orange-50">What Kiaan will receive</span>
                  <span className="rounded-full bg-orange-500/20 px-3 py-1 text-[11px]">{claritySession.pendingMessage ? 'Snapshot saved' : 'No message held'}</span>
                </div>
                <p className="text-xs text-orange-100/75">Stored exactly as you wrote it. No edits, no delays if you close.</p>
                {claritySession.pendingMessage && (
                  <div className="rounded-xl bg-black/40 border border-orange-400/25 p-3 text-sm text-orange-50/90 leading-relaxed">
                    {summarizeContent(claritySession.pendingMessage)}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-[11px] text-orange-100/80">
                  <span className="rounded-full bg-white/10 px-3 py-1">Pass-through ready</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Kiaan answers stay untouched</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3 rounded-2xl bg-[#0d0d10]/90 border border-orange-500/25 p-4 shadow-[0_12px_40px_rgba(255,115,39,0.2)]">
                <div className="flex items-center justify-between text-xs text-orange-100/80">
                  <span className="font-semibold text-orange-50">Calming animation</span>
                  <button
                    onClick={toggleMotionReduction}
                    className="rounded-full border border-orange-400/30 px-3 py-1 text-[11px] text-orange-100/80"
                  >
                    {claritySession.motionReduced ? 'Motion reduction on' : 'Motion reduction off'}
                  </button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/25 via-[#ff9933]/25 to-rose-300/30 shadow-[0_20px_60px_rgba(255,153,51,0.25)] ${claritySession.motionReduced ? '' : 'breathing-orb'}`}
                  >
                    {!claritySession.motionReduced && <div className="absolute inset-2 rounded-full bg-orange-400/35 blur-2xl" />}
                    <span className="text-xs font-semibold text-orange-50">
                      {claritySession.motionReduced ? 'Inhale / Exhale' : 'Breathe'}
                    </span>
                  </div>
                  <p className="text-xs text-orange-100/80">{claritySession.started ? `${claritySession.countdown}s remaining` : 'Ready when you are'}</p>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-orange-300 to-orange-500 transition-[width] duration-500"
                      style={{ width: `${clarityProgress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={startGuidedPause}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-orange-50 border border-orange-400/25"
                  >
                    {claritySession.started ? 'Restart 60s pause' : 'Pause for 60 seconds'}
                  </button>
                  <button
                    onClick={sendPendingNow}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400/80 via-orange-300/80 to-orange-500/80 px-3 py-2 text-xs font-semibold text-slate-950"
                  >
                    Send after calm
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl bg-black/50 border border-orange-500/25 p-4 shadow-[0_12px_40px_rgba(255,115,39,0.2)]">
                  <div className="flex items-center justify-between text-xs text-orange-100/80">
                    <span className="font-semibold text-orange-50">Clarity question</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px]">Live cues</span>
                  </div>
                  <p className="text-sm text-orange-100/90 font-semibold">“Are you acting from clarity or from emotion right now?”</p>
                  <div className="rounded-xl border border-orange-400/25 bg-white/5 p-3 text-xs text-orange-100/85 space-y-2">
                    <p className="font-semibold text-orange-50">Neutral reasoning</p>
                    <ul className="list-disc list-inside space-y-1">
                      {CLARITY_REASONING_PROMPTS.map(line => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-xs text-orange-100/85">
                    <p className="font-semibold text-orange-50">60-second guided script</p>
                    <ul className="space-y-1">
                      {CLARITY_GROUNDING_SEQUENCE.map((step, idx) => (
                        <li
                          key={step.time}
                          className={`flex gap-2 rounded-lg px-2 py-1 ${claritySession.started && idx === activeGroundingStep ? 'bg-orange-500/20 border border-orange-400/40 text-orange-50' : 'text-orange-100/85'}`}
                        >
                          <span className="min-w-[54px] text-[11px] font-semibold text-orange-300">{step.time}</span>
                          <span className="leading-relaxed">{step.prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-orange-400/25 bg-white/5 p-3 text-xs text-orange-100/85 space-y-1">
                    <p className="font-semibold text-orange-50">Close with grounded choice</p>
                    <ul className="list-disc list-inside space-y-1">
                      {CLARITY_CLOSING_CHOICES.map(choice => (
                        <li key={choice}>{choice}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-[#0c0f12]/90 border border-emerald-200/25 p-4 shadow-[0_12px_40px_rgba(92,150,146,0.2)]">
                  <div className="flex items-center justify-between text-xs text-emerald-50/80">
                    <span className="font-semibold text-emerald-50">Trigger detection system</span>
                    <span className="rounded-full bg-emerald-200/10 px-3 py-1 text-[11px]">{claritySession.evaluation.confidence === 'high' ? 'Auto interrupt' : 'Offer pause'}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-emerald-50/85">
                    {CLARITY_TRIGGER_SIGNALS.map(signal => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                  <div className="rounded-lg border border-emerald-200/25 bg-black/30 p-3 text-[11px] text-emerald-50/80 leading-relaxed">
                    Confidence tiers: High (auto interrupt), Medium (offer pause), Low (log only). Designed to flag impulse while letting Kiaan continue normally.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-gradient-to-br from-orange-500/30 via-[#ffb347]/25 to-orange-200/10 blur-2xl" />
      <div className="absolute -left-16 bottom-4 h-32 w-32 rounded-full bg-gradient-to-tr from-[#1c1c20]/70 via-orange-500/10 to-transparent blur-3xl" />
      <div className="flex items-center gap-3 relative">
        <div className="text-4xl">💬</div>
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-orange-300 via-[#ffb347] to-rose-200 bg-clip-text text-transparent">Talk to KIAAN</h2>
          <p className="text-sm text-orange-100/80">Gentle guidance with an ember glow</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-orange-100/80 bg-white/5 border border-orange-500/20 rounded-2xl px-4 py-3 shadow-[0_10px_30px_rgba(255,115,39,0.12)] backdrop-blur text-center sm:text-left">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
        </span>
        <span className="font-semibold text-orange-50">Private, steady connection</span>
        <span className="hidden sm:inline text-orange-100/70">Your questions animate into focus—answers remain unchanged.</span>
      </div>

      {/* Prominent Summary/Detailed Toggle - HIGH PRIORITY */}
      {messages.some(m => m.role === 'assistant') && (
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/30 rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-semibold text-orange-50">View Mode</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setGlobalViewMode('summary')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                globalViewMode === 'summary'
                  ? 'bg-gradient-to-r from-orange-400 via-orange-300 to-amber-300 text-slate-950 shadow-lg shadow-orange-500/30'
                  : 'border border-orange-400/30 text-orange-100 hover:bg-orange-500/20'
              }`}
              aria-label="Toggle to summary view"
            >
              📝 Summary
            </button>
            <button
              onClick={() => setGlobalViewMode('detailed')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                globalViewMode === 'detailed'
                  ? 'bg-gradient-to-r from-orange-400 via-orange-300 to-amber-300 text-slate-950 shadow-lg shadow-orange-500/30'
                  : 'border border-orange-400/30 text-orange-100 hover:bg-orange-500/20'
              }`}
              aria-label="Toggle to detailed view"
            >
              📖 Detailed
            </button>
          </div>
        </div>
      )}

        <div className="relative">
          <SimpleBar
            autoHide={false}
            scrollableNodeProps={{
              ref: messageListRef,
              onScroll: handleScroll,
              tabIndex: 0,
              'aria-label': 'Conversation with Kiaan',
              'aria-live': 'polite',
              className:
                'chat-messages aurora-pane relative bg-black/50 border border-orange-500/20 rounded-2xl h-[55vh] min-h-[320px] md:h-[500px] scroll-stable smooth-touch-scroll focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-inset',
            }}
            className="mv-energy-scrollbar"
          >
            <div className="p-4 md:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-orange-100/70 py-20 md:py-32">
                  <p className="text-6xl mb-4">✨</p>
                  <p className="text-xl mb-2">How can I guide you today?</p>
                  <p className="text-sm text-orange-100/70">Share what's on your mind</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg shadow-orange-500/10 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-orange-500/80 via-[#ff9933]/80 to-rose-500/80 text-white'
                        : 'bg-white/5 border border-orange-200/10 text-orange-50 backdrop-blur'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      renderAssistantContent(msg.content, i)
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-orange-500/20 px-4 py-3 rounded-2xl text-orange-100/80">
                    <span className="animate-pulse">KIAAN is reflecting...</span>
                  </div>
                </div>
              )}
            </div>
          </SimpleBar>

          {/* Floating Jump to Latest button */}
          {!isAtBottom && messages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-5 z-10 rounded-full bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-orange-500/40 transition-all hover:scale-105 animate-fadeIn"
              aria-label="Jump to latest message"
            >
              ↓ Jump to Latest
            </button>
          )}
        </div>

      <div className="flex gap-3 relative flex-col sm:flex-row">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          ref={inputRef}
          className="flex-1 w-full px-4 py-3 bg-black/60 border border-orange-500/40 rounded-xl focus:ring-2 focus:ring-orange-400/70 outline-none placeholder:text-orange-100/70 text-orange-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 hover:scale-105 disabled:from-zinc-700 disabled:via-zinc-700 disabled:to-zinc-700 rounded-xl font-semibold transition-all text-slate-950 shadow-lg shadow-orange-500/25 w-full sm:w-auto"
        >
          Send
        </button>
      </div>

      <div className="rounded-2xl border border-orange-500/20 bg-white/5 px-4 py-3 shadow-[0_10px_40px_rgba(255,115,39,0.12)] text-xs text-orange-100/80 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-orange-50 font-semibold text-sm">
            <span className="text-lg">🧘</span>
            <span>Clarity pause watch</span>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              activeClarityEvaluation?.decision === 'pause'
                ? 'bg-orange-500/20 text-orange-50 border border-orange-400/40'
                : 'bg-emerald-500/15 text-emerald-50 border border-emerald-200/30'
            }`}
          >
            {activeClarityEvaluation?.decision === 'pause'
              ? `Pause suggested (${activeClarityEvaluation.confidence})`
              : 'Pass-through mode'}
          </span>
        </div>
        <p className="leading-relaxed">KIAAN quietly scores urgency and emotion. High = instant pause overlay, medium = offer to pause, low = logged only.</p>
        {activeClarityEvaluation && (
          <div className="flex flex-wrap gap-2">
            {(activeClarityEvaluation.flags.length ? activeClarityEvaluation.flags : ['No triggers detected']).map(flag => (
              <span key={flag} className="rounded-full bg-white/10 px-3 py-1 text-[11px] border border-orange-500/20">
                {flag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const manualEvaluation: ClarityEvaluation = { decision: 'pause', confidence: 'medium', flags: ['Manual clarity pause'], impulseScore: 2, reason: 'User initiated clarity pause' }
              setClarityLog(manualEvaluation)
              startClaritySession(manualEvaluation, input || 'Taking a 60-second clarity pause with KIAAN.', 'manual')
            }}
            className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-[11px] font-semibold text-orange-50"
          >
            Open clarity pause now
          </button>
          <button
            onClick={() => setClarityLog(null)}
            className="rounded-xl border border-white/15 px-3 py-2 text-[11px] text-orange-100/80"
          >
            Reset watch
          </button>
          <span className="text-[11px] text-orange-100/70">KIAAN never blocks your message—decline the overlay anytime.</span>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-24 right-6 z-50 animate-fadeIn">
          <div className="rounded-xl border border-orange-400/40 bg-gradient-to-r from-orange-500/95 to-amber-500/95 px-4 py-3 shadow-2xl shadow-orange-500/40 backdrop-blur">
            <p className="text-sm font-semibold text-white">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShareModal({visible: false, content: ''})} />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-orange-500/30 bg-[#0b0b0f]/98 p-6 shadow-2xl shadow-orange-500/30">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-orange-50">Share KIAAN's Wisdom</h3>
                <p className="text-sm text-orange-100/70 mt-1">Choose a platform to share</p>
              </div>
              <button
                onClick={() => setShareModal({visible: false, content: ''})}
                className="rounded-lg p-1 hover:bg-white/10 transition"
                aria-label="Close share modal"
              >
                <svg className="w-5 h-5 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Privacy Warning */}
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-amber-100">Privacy Notice</p>
                  <p className="text-xs text-amber-100/80 mt-1">Content will be shared publicly. Consider anonymizing before sharing.</p>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => executeShare('whatsapp', true)}
                className="flex flex-col items-center gap-2 rounded-xl border border-green-400/30 bg-green-500/10 p-4 hover:bg-green-500/20 transition"
              >
                <span className="text-2xl">💬</span>
                <span className="text-sm font-semibold text-green-100">WhatsApp</span>
              </button>
              
              <button
                onClick={() => executeShare('telegram', true)}
                className="flex flex-col items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 hover:bg-blue-500/20 transition"
              >
                <span className="text-2xl">✈️</span>
                <span className="text-sm font-semibold text-blue-100">Telegram</span>
              </button>
              
              <button
                onClick={() => executeShare('facebook', true)}
                className="flex flex-col items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4 hover:bg-indigo-500/20 transition"
              >
                <span className="text-2xl">📘</span>
                <span className="text-sm font-semibold text-indigo-100">Facebook</span>
              </button>
              
              <button
                onClick={() => executeShare('instagram', true)}
                className="flex flex-col items-center gap-2 rounded-xl border border-pink-400/30 bg-pink-500/10 p-4 hover:bg-pink-500/20 transition"
              >
                <span className="text-2xl">📸</span>
                <span className="text-sm font-semibold text-pink-100">Instagram</span>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShareModal({visible: false, content: ''})}
                className="text-xs text-orange-100/70 hover:text-orange-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function QuickHelp({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const scenarios = [
    { emoji: '😰', label: 'Anxiety to calm', query: 'Guide me through a grounding exercise to steady anxious thoughts.' },
    { emoji: '😔', label: 'Heart feels heavy', query: 'I need gentle words to lift my mood and remind me of my strengths.' },
    { emoji: '😠', label: 'Cooling anger', query: 'Help me cool down my anger and respond with more patience.' },
    { emoji: '🤔', label: 'Clarity check', query: 'Can you help me see the pros and cons before I decide on something important?' },
    { emoji: '💼', label: 'Work balance', query: 'Work feels overwhelming—walk me through a quick reset to regain focus.' },
    { emoji: '💔', label: 'Tender relationships', query: 'How can I handle a tough conversation with care and honesty?' },
    { emoji: '🎯', label: 'Purpose pulse', query: 'I want a short reflection to reconnect with my purpose and direction.' },
    { emoji: '🙏', label: 'Quiet peace', query: 'Lead me in a brief mindful moment so I can feel peaceful again.' },
  ]
  return (
    <section className="bg-[#0c1012]/80 backdrop-blur border border-emerald-200/15 rounded-3xl p-5 md:p-6 space-y-4 shadow-[0_10px_40px_rgba(92,150,146,0.2)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-200 via-[#b7d8d2] to-sky-200 bg-clip-text text-transparent">🎯 Quick Responses</h2>
        <p className="text-xs text-emerald-50/80">Polished prompts that auto-fill KIAAN for you</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              onSelectPrompt(s.query)
            }}
            className="group relative overflow-hidden bg-gradient-to-br from-[#0e1618]/85 via-[#122022]/80 to-[#0f1b21]/80 border border-emerald-200/20 hover:border-emerald-200/50 rounded-2xl p-4 transition-all text-left shadow-[0_10px_26px_rgba(84,141,138,0.2)] hover:-translate-y-1">
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-300/10 via-sky-200/8 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-200/20 blur-2xl" />
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform text-emerald-50">{s.emoji}</div>
            <div className="text-sm text-emerald-50 font-semibold">{s.label}</div>
            <div className="text-[11px] text-emerald-50/70 mt-1 leading-snug">{s.query}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

type JournalEntry = {
  id: string
  title: string
  body: string
  mood: string
  at: string
}

function Journal() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState('Peaceful')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [encryptionReady, setEncryptionReady] = useState(false)
  const [encryptionMessage, setEncryptionMessage] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [guidance, setGuidance] = useState<Record<string, string>>({})
  const [guidanceLoading, setGuidanceLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateStatus = () => setIsOnline(window.navigator.onLine)
    updateStatus()

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadEntries() {
      try {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(JOURNAL_ENTRY_STORAGE) : null
        if (stored) {
          const decrypted = await decryptText(stored)
          const parsed = JSON.parse(decrypted) as JournalEntry[]
          if (!cancelled) setEntries(parsed)
        }
        if (!stored && typeof window !== 'undefined') {
          window.localStorage.removeItem('kiaan_journal_entries')
        }
      } catch {
        if (!cancelled) setEncryptionMessage('Sacred Reflections restored to a blank state because the saved copy could not be read securely.')
        if (!cancelled) setEntries([])
      } finally {
        if (!cancelled) setEncryptionReady(true)
      }
    }

    loadEntries()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!encryptionReady) return
    ;(async () => {
      try {
        const encrypted = await encryptText(JSON.stringify(entries))
        window.localStorage.setItem(JOURNAL_ENTRY_STORAGE, encrypted)
        setEncryptionMessage(null)
      } catch {
        setEncryptionMessage('Could not secure your Sacred Reflections locally. Please retry in a moment.')
      }
    })()
  }, [entries, encryptionReady])

  const moods = [
    { label: 'Peaceful', emoji: '🙏', tone: 'positive' },
    { label: 'Happy', emoji: '😊', tone: 'positive' },
    { label: 'Neutral', emoji: '😐', tone: 'neutral' },
    { label: 'Charged', emoji: '⚡', tone: 'positive' },
    { label: 'Open', emoji: '🌤️', tone: 'positive' },
    { label: 'Grateful', emoji: '🌿', tone: 'positive' },
    { label: 'Reflective', emoji: '🪞', tone: 'neutral' },
    { label: 'Determined', emoji: '🔥', tone: 'positive' },
    { label: 'Tender', emoji: '💙', tone: 'neutral' },
    { label: 'Tired', emoji: '😴', tone: 'neutral' },
    { label: 'Anxious', emoji: '😰', tone: 'challenging' },
    { label: 'Heavy', emoji: '🌧️', tone: 'challenging' },
  ]

  function addEntry() {
    if (!body.trim()) return
    if (!encryptionReady) {
      setEncryptionMessage('Preparing your Sacred Reflections space. Please try adding your entry again in a few seconds.')
      return
    }
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      mood,
      at: new Date().toISOString()
    }
    setEntries([entry, ...entries])
    setTitle('')
    setBody('')
  }

  async function requestGuidance(entry: JournalEntry) {
    setGuidanceLoading(prev => ({ ...prev, [entry.id]: true }))
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Please offer a supportive Ancient Wisdom-inspired reflection on this private Sacred Reflections entry: ${entry.body}` })
      })

      if (response.ok) {
        const data = await response.json()
        setGuidance(prev => ({ ...prev, [entry.id]: data.response }))
      } else {
        setGuidance(prev => ({ ...prev, [entry.id]: 'KIAAN could not respond right now. Please try again shortly.' }))
      }
    } catch {
      setGuidance(prev => ({ ...prev, [entry.id]: 'Connection issue while asking KIAAN. Try again in a moment.' }))
    } finally {
      setGuidanceLoading(prev => ({ ...prev, [entry.id]: false }))
    }
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weeklyEntries = entries.filter(e => new Date(e.at) >= sevenDaysAgo)

  const moodCounts = weeklyEntries.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1
    return acc
  }, {})

  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Peaceful'

  const positiveMoods = new Set(moods.filter(m => m.tone === 'positive').map(m => m.label))
  const challengingMoods = new Set(moods.filter(m => m.tone === 'challenging').map(m => m.label))
  const positiveDays = weeklyEntries.filter(e => positiveMoods.has(e.mood)).length
  const challengingDays = weeklyEntries.filter(e => challengingMoods.has(e.mood)).length

  const assessment = (() => {
    if (weeklyEntries.length === 0) {
      return {
        headline: 'KIAAN gently invites you to begin your Sacred Reflections practice this week.',
        guidance: [
          'Start with two or three lines on what felt peaceful or challenging today.',
          'Return here each evening; KIAAN will keep the space steady and private.',
          'Let your words flow without judgment—this is your sacred reflection.'
        ]
      }
    }

    if (challengingDays > positiveDays) {
      return {
        headline: 'KIAAN notices some heavier moments this week and offers steady companionship.',
        guidance: [
          'Pair each entry with one small act of self-kindness to honor your effort.',
          'Revisit a peaceful entry and let its lesson guide today’s choices, as ancient wisdom teaches equanimity in action.',
          'Share one concern with KIAAN in the chat to receive a tailored practice for the coming days.'
        ]
      }
    }

    return {
      headline: 'KIAAN celebrates your steady reflections and balanced moods this week.',
      guidance: [
        'Keep honoring what works—note the habits that nurture your peace and repeat them intentionally.',
        'Extend the calm to service: plan one mindful act for someone else this week.',
        'Before each entry, pause for three breaths to deepen the insight you are cultivating.'
      ]
    }
  })()

  return (
    <section id="journal-section" className="space-y-4">
      <div className="bg-[#0d0d10]/85 backdrop-blur border border-orange-500/15 rounded-3xl p-6 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-orange-100/80">Sacred Reflections</p>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Sacred Reflections</h2>
            <p className="text-sm text-orange-100/70">Entries stay on your device and refresh the weekly guidance automatically.</p>
          </div>
          <div className="bg-white/5 border border-orange-500/20 text-orange-50 px-4 py-2 rounded-2xl text-sm">
            Weekly entries: {weeklyEntries.length}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill label={encryptionReady ? 'AES-GCM secured locally' : 'Preparing encryption lock'} tone={encryptionReady ? 'ok' : 'warn'} />
          <StatusPill label={isOnline ? 'Offline-ready: saves on device' : 'Offline mode: stored on this device'} tone={isOnline ? 'ok' : 'warn'} />
        </div>

        <div className="mt-4 space-y-2">
          <div className="bg-black/60 border border-orange-500/20 text-orange-50 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
            <span>🔒</span>
            <div>
              <p className="font-semibold">Fully encrypted on your device</p>
              <p className="text-orange-100/70">Entries are sealed locally with AES-GCM before saving. Only this browser can decrypt them.</p>
            </div>
          </div>
          {!encryptionReady && (
            <p className="text-xs text-orange-200">Preparing your Sacred Reflections space...</p>
          )}
          {encryptionMessage && (
            <p className="text-xs text-orange-200">{encryptionMessage}</p>
          )}
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-orange-100/90">Today’s tone</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {moods.map(option => (
                  <button
                    key={option.label}
                    onClick={() => setMood(option.label)}
                    className={`px-3 py-2 rounded-2xl border text-sm transition-all ${
                      mood === option.label
                        ? 'bg-gradient-to-r from-orange-500/70 via-[#ff9933]/70 to-orange-300/70 border-orange-300 text-black shadow'
                        : 'bg-black/50 border-orange-800/60 text-orange-100 hover:border-orange-500/60'
                    }`}
                  >
                    <span className="mr-1">{option.emoji}</span>{option.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-black/50 border border-orange-800/60 rounded-2xl px-3 py-2 text-orange-50 placeholder:text-orange-100/60"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write freely. Only you can see this."
              className="w-full h-32 bg-black/50 border border-orange-800/60 rounded-2xl p-3 text-orange-50 placeholder:text-orange-100/60"
            />
            <button
              onClick={addEntry}
              disabled={!body.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-[#ffb347] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 w-full sm:w-auto"
            >
              Add Reflection
            </button>
          </div>

          <div className="bg-black/60 border border-orange-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-orange-100">Weekly Assessment</h3>
              <div className="text-xs text-orange-100/80">Updated automatically</div>
            </div>
            <p className="text-sm text-orange-100/85">Most present mood: <span className="font-semibold text-orange-50">{mostCommonMood}</span></p>
            <div className="grid grid-cols-2 gap-2 text-sm text-orange-100/85">
              <div className="bg-white/5 rounded-xl p-3 border border-orange-200/20">
                <div className="text-xs text-orange-200/80">Positive moments logged</div>
                <div className="text-xl font-semibold text-orange-50">{positiveDays}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-orange-200/20">
                <div className="text-xs text-orange-200/80">Tender/Challenging days</div>
                <div className="text-xl font-semibold text-orange-50">{challengingDays}</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-orange-200/20">
              <p className="text-sm text-orange-50 font-semibold">KIAAN’s gentle guidance</p>
              <p className="text-sm text-orange-100/80 leading-relaxed">{assessment.headline}</p>
              <ul className="mt-2 space-y-1 text-sm text-orange-100/80 list-disc list-inside">
                {assessment.guidance.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0c0c10]/80 border border-orange-500/15 rounded-3xl p-5 space-y-3 shadow-[0_10px_40px_rgba(255,115,39,0.1)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-orange-50">Recent entries</h3>
          <p className="text-xs text-orange-100/70">Newest first • stored locally</p>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-orange-100/70">No entries yet. Your reflections will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map(entry => (
              <li key={entry.id} className="p-4 rounded-2xl bg-black/60 border border-orange-800/40">
                <div className="flex items-center justify-between text-xs text-orange-100/70">
                  <span>{new Date(entry.at).toLocaleString()}</span>
                  <span className="px-2 py-1 rounded-lg bg-orange-900/50 text-orange-100 border border-orange-700 text-[11px]">{entry.mood}</span>
                </div>
                {entry.title && <div className="mt-1 font-semibold text-orange-50">{entry.title}</div>}
                <div className="mt-1 text-sm text-orange-100 whitespace-pre-wrap leading-relaxed">{entry.body}</div>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => requestGuidance(entry)}
                    disabled={!!guidanceLoading[entry.id]}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-[#ffb347] text-sm font-semibold text-black disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                  >
                    {guidanceLoading[entry.id] ? 'KIAAN is reading...' : "Get KIAAN's opinion"}
                  </button>
                  {guidance[entry.id] && (
                    <p className="text-sm text-orange-100/90 bg-black/50 border border-orange-700 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                      {guidance[entry.id]}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function MobileActionDock({ onChat, onClarity, onJournal }: { onChat: () => void, onClarity: () => void, onJournal: () => void }) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-30 md:hidden">
      <div className="mobile-safe-area flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-[#0b0b0f]/95 via-[#0d0d12]/95 to-[#0b0b0f]/95 p-3 shadow-[0_18px_70px_rgba(255,115,39,0.3)] backdrop-blur touch-manipulation">
        <button
          onClick={onChat}
          aria-label="Open chat"
          className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-200 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-orange-500/30 min-h-[52px]"
        >
          Chat
        </button>
        <button
          onClick={onClarity}
          aria-label="Start clarity pause"
          className="flex-1 rounded-xl border border-orange-400/50 bg-white/5 px-4 py-3 text-base font-semibold text-orange-50 min-h-[52px]"
        >
          Pause
        </button>
        <button
          onClick={onJournal}
          aria-label="Open Sacred Reflections"
          className="flex-1 rounded-xl border border-orange-400/40 bg-black/40 px-4 py-3 text-base font-semibold text-orange-100 min-h-[52px]"
        >
          Sacred Reflections
        </button>
      </div>
    </div>
  )
}

function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [kiaanResponse, setKiaanResponse] = useState<string>('')
  
  const moods = [
    // Positive moods
    { label: 'Peaceful', gradient: 'from-emerald-200 via-teal-300 to-cyan-200', beam: 'bg-emerald-100/70', halo: 'shadow-[0_0_50px_rgba(52,211,153,0.32)]', delay: '0s' },
    { label: 'Happy', gradient: 'from-yellow-200 via-amber-300 to-orange-200', beam: 'bg-amber-100/70', halo: 'shadow-[0_0_55px_rgba(252,211,77,0.35)]', delay: '0.05s' },
    { label: 'Grateful', gradient: 'from-green-200 via-emerald-300 to-teal-200', beam: 'bg-green-100/70', halo: 'shadow-[0_0_50px_rgba(74,222,128,0.32)]', delay: '0.1s' },
    { label: 'Charged', gradient: 'from-orange-200 via-amber-300 to-yellow-300', beam: 'bg-orange-100/70', halo: 'shadow-[0_0_55px_rgba(251,146,60,0.34)]', delay: '0.15s' },
    { label: 'Open', gradient: 'from-sky-200 via-cyan-200 to-emerald-200', beam: 'bg-cyan-100/70', halo: 'shadow-[0_0_50px_rgba(125,211,252,0.32)]', delay: '0.2s' },
    { label: 'Determined', gradient: 'from-orange-300 via-red-400 to-rose-300', beam: 'bg-orange-100/70', halo: 'shadow-[0_0_55px_rgba(251,113,133,0.34)]', delay: '0.25s' },
    // Neutral moods
    { label: 'Neutral', gradient: 'from-slate-200 via-gray-300 to-zinc-200', beam: 'bg-slate-100/70', halo: 'shadow-[0_0_45px_rgba(148,163,184,0.32)]', delay: '0.3s' },
    { label: 'Reflective', gradient: 'from-indigo-200 via-violet-300 to-purple-200', beam: 'bg-indigo-100/70', halo: 'shadow-[0_0_50px_rgba(165,180,252,0.32)]', delay: '0.35s' },
    { label: 'Tender', gradient: 'from-pink-200 via-rose-300 to-red-200', beam: 'bg-pink-100/70', halo: 'shadow-[0_0_50px_rgba(251,207,232,0.32)]', delay: '0.4s' },
    { label: 'Tired', gradient: 'from-blue-200 via-slate-300 to-gray-200', beam: 'bg-blue-100/60', halo: 'shadow-[0_0_45px_rgba(147,197,253,0.32)]', delay: '0.45s' },
    // Challenging moods
    { label: 'Anxious', gradient: 'from-amber-200 via-amber-300 to-orange-200', beam: 'bg-amber-100/70', halo: 'shadow-[0_0_45px_rgba(253,230,138,0.35)]', delay: '0.5s' },
    { label: 'Worried', gradient: 'from-violet-300 via-purple-400 to-fuchsia-500', beam: 'bg-violet-100/70', halo: 'shadow-[0_0_50px_rgba(167,139,250,0.32)]', delay: '0.55s' },
    { label: 'Heavy', gradient: 'from-slate-300 via-gray-400 to-zinc-400', beam: 'bg-slate-100/60', halo: 'shadow-[0_0_45px_rgba(148,163,184,0.35)]', delay: '0.6s' },
    { label: 'Angry', gradient: 'from-rose-500 via-orange-500 to-amber-300', beam: 'bg-rose-100/70', halo: 'shadow-[0_0_55px_rgba(251,113,133,0.32)]', delay: '0.65s' },
    { label: 'Sad', gradient: 'from-sky-300 via-blue-400 to-indigo-500', beam: 'bg-sky-100/70', halo: 'shadow-[0_0_50px_rgba(125,211,252,0.35)]', delay: '0.7s' },
    { label: 'Loneliness', gradient: 'from-cyan-200 via-blue-200 to-indigo-300', beam: 'bg-cyan-100/70', halo: 'shadow-[0_0_50px_rgba(165,243,252,0.32)]', delay: '0.75s' },
    { label: 'Depressed', gradient: 'from-slate-200 via-gray-400 to-neutral-600', beam: 'bg-slate-100/60', halo: 'shadow-[0_0_45px_rgba(148,163,184,0.32)]', delay: '0.8s' },
  ]

  // Static micro-responses as specified in requirements
  const moodResponses: Record<string, string> = {
    'Peaceful': "I'm glad you're feeling calm — stay with that softness for a moment. 💙",
    'Happy': "It's beautiful to see you feeling bright. Let that warmth stay with you. ✨",
    'Neutral': "Steady is good. You're showing up, and that matters. 🌿",
    'Charged': "That energy is powerful — channel it wisely. ⚡",
    'Open': "Being open takes courage. I'm here to support you. 🌤️",
    'Grateful': "Gratitude is a gift to yourself. Hold onto this feeling. 🙏",
    'Reflective': "Reflection brings clarity. Take your time with what you're feeling. 🪞",
    'Determined': "That fire in you is strong. Move forward with purpose. 🔥",
    'Tender': "Tenderness is strength. Be gentle with yourself right now. 💙",
    'Tired': "Rest is not weakness. Your body is telling you something important. 😴",
    'Anxious': "That anxious feeling is tough — take a breath, I'm with you. 🌊",
    'Heavy': "I'm sorry you're feeling low… you're not alone. I'm right here with you. 🌧️",
    'Angry': "It's okay — anger means something important needs attention. I'm here beside you. 🔥",
    'Worried': "Worry can feel overwhelming. Let's take this one step at a time together. 💭",
    'Sad': "Sadness is heavy, but you're not alone right now. I'm here with you. 💙",
    'Loneliness': "Loneliness is tough, but you're not alone right now. I'm here with you. 🤝",
    'Depressed': "This weight is real, and it's hard. Please reach out — you don't have to carry this alone. 💙",
  }

  function handleMoodSelect(mood: string) {
    setSelectedMood(mood)
    setKiaanResponse(moodResponses[mood] || "I'm here with you. 💙")
    
    // Save mood check-in to localStorage for analytics
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('mood_check_ins')
        const checkIns = existing ? JSON.parse(existing) : []
        checkIns.push({
          mood,
          timestamp: new Date().toISOString()
        })
        // Keep only last 100 check-ins
        const trimmed = checkIns.slice(-100)
        localStorage.setItem('mood_check_ins', JSON.stringify(trimmed))
      } catch {
        // Ignore storage errors
      }
    }
  }

  return (
    <section className="mv-surface-panel rounded-3xl p-6 shadow-[0_16px_70px_rgba(255,115,39,0.12)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] mv-panel-subtle">State check-in</p>
          <h2 className="text-xl font-semibold mv-panel-title">How are you feeling?</h2>
        </div>
        {selectedMood && (
          <span className="mv-chip rounded-full px-3 py-1 text-xs font-semibold shadow-[0_0_25px_rgba(255,153,51,0.15)]">
            Logged: {selectedMood}
          </span>
        )}
      </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {moods.map(mood => {
            const active = selectedMood === mood.label
            const cardStyle: CSSProperties = {
              animationDelay: mood.delay,
              boxShadow: active ? '0 24px 80px rgba(217,119,6,0.25)' : undefined,
              borderColor: active ? 'var(--mv-border-strong)' : undefined
            }
            return (
              <button
                key={mood.label}
                onClick={() => handleMoodSelect(mood.label)}
                className={`group relative overflow-hidden rounded-2xl mood-card border text-left transition duration-300 ${
                  active ? 'scale-[1.02]' : 'hover:-translate-y-1'
                }`}
                style={cardStyle}
              >
                <div className={`absolute -inset-8 bg-gradient-to-br ${mood.gradient} opacity-20 blur-3xl`} />
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,200,150,0.25),transparent_46%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.16),transparent_42%)] animate-glowPulse`} />
                <div className={`absolute inset-0 opacity-70 ${active ? 'animate-sheen' : ''}`}>
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]" />
                </div>

                <div className="relative z-[1] flex items-center gap-4 p-4">
                  <div className="relative h-14 w-14 shrink-0">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mood.gradient} opacity-80 blur-sm ${mood.halo}`} />
                    <div className="absolute inset-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur" />
                    <div className="absolute inset-2 rounded-xl border border-white/10" style={{ animation: 'spin 14s linear infinite' }} />
                    <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-white/8 via-transparent to-white/8" style={{ animation: 'spin 10s linear infinite reverse' }} />
                    <div className="absolute inset-3 rounded-xl border border-white/10" />
                    <div className="absolute inset-3 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-white/10 animate-glowPulse" />
                  <div className="absolute inset-0">
                    <span
                      className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px] animate-orbitTrail"
                      style={{ background: `radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)`, animationDelay: mood.delay }}
                    />
                    <span
                      className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 animate-orbitTrail"
                      style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)`, animationDelay: `calc(${mood.delay} + 0.2s)` }}
                    />
                    <span
                      className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full animate-orbitTrail"
                      style={{ background: `radial-gradient(circle at 60% 70%, rgba(255,255,255,0.2), transparent 65%)`, animationDelay: `calc(${mood.delay} + 0.35s)` }}
                    />
                    <span
                      className={`absolute left-1/2 top-1/2 h-3 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${mood.beam} mix-blend-screen`}
                      style={{ animation: 'pulseLine 2.6s ease-in-out infinite', animationDelay: mood.delay }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold mv-panel-title">{mood.label}</p>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(level => (
                      <span
                        key={level}
                        className={`h-1.5 rounded-full bg-gradient-to-r ${mood.gradient}`}
                        style={{ width: `${18 + level * 6}px`, opacity: active ? 1 : 0.6, animation: active ? `pulseLine 2.4s ease-in-out ${level * 0.1}s infinite` : undefined }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* KIAAN Micro-Response */}
        {selectedMood && kiaanResponse && (
          <div className="animate-fadeIn mt-4">
            <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-amber-300/10 p-4 shadow-lg shadow-orange-500/10">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold text-slate-900">
                  K
                </div>
                <div className="flex-1">
                  <p className="text-xs mv-panel-subtle mb-1">KIAAN</p>
                  <p className="text-sm mv-panel-title leading-relaxed">
                    {kiaanResponse}
                  </p>
                </div>
              </div>
            </div>
        </div>
      )}

      <style jsx>{`
        .animate-glowPulse { animation: glowPulse 6s ease-in-out infinite; }
        .animate-sheen { animation: sheen 7s ease-in-out infinite; }
        .animate-orbitTrail { animation: orbitTrail 8s ease-in-out infinite; }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.75; filter: drop-shadow(0 0 10px rgba(255,153,51,0.25)); }
          50% { opacity: 1; filter: drop-shadow(0 0 20px rgba(255,179,71,0.35)); }
        }
        @keyframes sheen {
          0% { transform: translateX(-80%); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes pulseLine {
          0%, 100% { transform: scaleX(0.9); opacity: 0.8; }
          50% { transform: scaleX(1.06); opacity: 1; }
        }
        @keyframes orbitTrail {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.94); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.02); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(0.94); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}
