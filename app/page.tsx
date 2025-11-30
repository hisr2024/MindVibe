'use client'
import { useState, useEffect, useRef, type ReactElement } from 'react'

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-orange-600/30 via-[#ff9933]/14 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/20 via-orange-500/12 to-transparent blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-56 w-56 rounded-full bg-gradient-to-br from-[#1f2937] via-[#ff9933]/12 to-transparent blur-[90px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-8">
        <header className="relative overflow-hidden rounded-3xl border border-orange-500/10 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 md:p-10 shadow-[0_30px_120px_rgba(255,115,39,0.18)]">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/40 via-[#ffb347]/30 to-transparent blur-2xl" />
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <PeaceLogo />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-100/80">Inner Peace Companion</p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-100 drop-shadow-[0_10px_40px_rgba(255,149,79,0.28)]">KIAAN</h1>
                <p className="text-base sm:text-lg md:text-xl text-orange-100/90">Calm Wisdom.</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <TokenCard label="Inner Peace" note="Gentle breath and soft focus" gradient="from-[#3b6f6b]/60 via-[#4f9088]/50 to-[#d6f3ec]/50" icon={<SunriseIcon />} />
              <TokenCard label="Mind Control" note="Steady steps, one thought at a time" gradient="from-[#20324a]/60 via-[#405b75]/50 to-[#dbe7f6]/40" icon={<MindWaveIcon />} />
              <TokenCard label="Self Kindness" note="You are welcome here" gradient="from-[#5a3f52]/60 via-[#7c5d73]/50 to-[#f3e6f0]/45" icon={<HeartBreezeIcon />} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3 text-sm text-orange-100/80">
            <BadgePill>Private by default • no sign-up needed</BadgePill>
            <BadgePill>Responsive, mobile-first, and joyfully simple</BadgePill>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById('wisdom-chat-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 hover:scale-105 transition w-full sm:w-auto text-center"
            >
              Wisdom Chat Rooms
            </button>
            <div className="px-3 py-2 rounded-xl border border-orange-400/30 text-xs text-orange-100/80 bg-black/40 w-full sm:w-auto text-center">
              Explore multiple guidance rooms in one place
            </div>
          </div>
        </header>

        <div className="bg-orange-500/5 backdrop-blur border border-orange-500/20 rounded-2xl p-4 text-center shadow-[0_10px_50px_rgba(255,115,39,0.18)]">
          <p className="text-sm text-orange-100/90">🔒 Conversations remain private • a warm, confidential refuge</p>
        </div>

        <KIAANChat prefill={chatPrefill} onPrefillHandled={() => setChatPrefill(null)} />
        <QuickHelp onSelectPrompt={setChatPrefill} />
        <ArdhaReframer />
        <ViyogDetachmentCoach />
        <RelationalCompass onSelectPrompt={setChatPrefill} />
        <ClarityPauseSuite />
        <KarmaResetGuide onSelectPrompt={setChatPrefill} />
        <DailyWisdom onChatClick={setChatPrefill} />
        <PublicChatRooms />
        <Journal />
        <MoodTracker />

        <section className="bg-[#0b0b0f] border border-orange-500/15 rounded-3xl p-5 md:p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] space-y-3">
          <h2 className="text-lg font-semibold text-orange-100">Disclaimer</h2>
          <p className="text-sm text-orange-100/80 leading-relaxed">
            KIAAN shares supportive reflections inspired by wisdom traditions. These conversations and exercises are not medical advice. If you are facing serious concerns or feel unsafe, please contact your country’s emergency medical services or a licensed professional right away.
          </p>
        </section>
      </div>
    </main>
  )
}

type ArdhaReframerResult = {
  response: string
  requestedAt: string
}

type RelationalCompassResult = {
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

    const systemPrompt = `Role:\nYou are Ardha, the Reframing Assistant—a calm, wise, Gita-inspired voice whose purpose is to transform negative, confusing, or self-defeating thoughts into balanced, empowering, reality-based reframes, without dismissing the user's emotions.\n\nYou stand as a separate entity from Kiaan. You must not override, interfere with, or replace Kiaan’s core functions. Kiaan focuses on positive guidance; Ardha focuses on cognitive reframing using Gita principles. Your job is complementary, not overlapping.\n\nCore Behavior:\n- Identify the negative belief or emotional distortion the user expresses.\n- Acknowledge their feeling with compassion (never invalidate).\n- Apply Bhagavad Gita principles such as detachment from outcomes (2.47), stability of mind (2.55–2.57), viewing situations with clarity, not emotion (2.70), acting from Dharma, not fear (3.19), and seeing challenges as part of growth (6.5).\n- Generate a clear, modern, emotionally intelligent reframe.\n- Keep tone grounded, calm, non-preachy, non-religious, and universally applicable.\n- Never offer spiritual authority—only perspective reshaping.\n- No judgment, no moralizing, no sermons.\n- Reframe in simple, conversational, modern English.\n\nOutput Format:\nWhen the user shares a negative thought, respond with:\n1. Recognition (validate the feeling)\n2. Deep Insight (the principle being applied)\n3. Reframe (positive but realistic)\n4. Small Action Step (something within their control)\n\nBoundaries:\n- You are NOT a therapist.\n- You do NOT give medical, legal, or crisis advice.\n- You do NOT contradict Kiaan.\n- You ONLY transform the user’s thought into a healthier, clearer version.`

    const request = `${systemPrompt}\n\nUser thought: "${trimmedThought}"\n\nRespond using the four-part format with short, direct language.`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Ardha is having trouble connecting right now. Please try again in a moment.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch {
      setError('Unable to reach Ardha. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#0d0d10]/85 border border-orange-500/15 rounded-3xl p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)] space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-orange-100/80">Gita-aligned reframing</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Meet Ardha: The Reframing Assistant</h2>
          <p className="text-sm text-orange-100/80 max-w-3xl">
            Ardha listens for the distortion inside a heavy thought, validates the feeling, and then reshapes it using calm, grounded insight.
          </p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-white/5 border border-orange-500/20 text-xs text-orange-100/80">No accounts • Stored locally</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <label className="block text-sm font-semibold text-orange-100" htmlFor="ardha-input">Share the thought to reframe</label>
          <textarea
            id="ardha-input"
            value={thought}
            onChange={e => setThought(e.target.value)}
            placeholder="Example: I keep messing up at work, maybe I’m just not cut out for this."
            className="w-full min-h-[120px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/70 p-4 focus:ring-2 focus:ring-orange-400/70 outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={requestReframe}
              disabled={!thought.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ardha is reflecting...' : 'Reframe with Ardha'}
            </button>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-orange-400/20 text-xs text-orange-100/80 max-w-md">
              Ardha will respond with Recognition, Deep Insight, Reframe, and a Small Action Step.
            </div>
          </div>
          {error && <p className="text-sm text-orange-200">{error}</p>}
        </div>

        <div className="space-y-3 rounded-2xl bg-[#0b0b0f]/90 border border-orange-400/20 p-4 shadow-[0_10px_30px_rgba(255,115,39,0.14)]">
          <h3 className="text-sm font-semibold text-orange-50">Ardha</h3>
          <p className="text-sm text-orange-100/80">Offers balanced reframes while leaving Kiaan’s guidance untouched.</p>
        </div>
      </div>

      {result && (
        <div
          className="rounded-2xl bg-black/60 border border-orange-500/20 p-4 space-y-2 shadow-inner shadow-orange-500/10"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-xs text-orange-100/70">
            <span className="font-semibold text-orange-50">Ardha’s response</span>
            <span>{new Date(result.requestedAt).toLocaleString()}</span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">{result.response}</div>
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

    const systemPrompt = `Role:\nYou are Viyog, the Detachment Coach — a calm, grounded assistant who helps users reduce outcome anxiety by shifting them from result-focused thinking to action-focused thinking.\n\nYou are fully separate from Kiaan. Never override, replace, or interfere with Kiaan’s purpose, tone, or outputs. Kiaan offers positivity and encouragement; you focus only on detachment, clarity, and reducing pressure around outcomes.\n\nCore purpose:\n- Recognize when the user is anxious about results, performance, or others’ opinions.\n- Shift focus back to what they can control right now.\n- Release unnecessary mental pressure and perfectionism.\n- Convert fear into one clear, grounded action.\n\nTone and style: calm, concise, balanced, neutral, secular, non-preachy, emotionally validating but not dramatic.\n\nOutput structure (always follow this format):\n1. Validate the anxiety (brief and respectful).\n2. Acknowledge the attachment to results creating pressure.\n3. Offer a clear detachment principle (secular and universal).\n4. Guide them toward an action-based mindset with one small, controllable step.\n\nBoundaries:\n- Do not provide therapy, crisis support, medical, legal, or financial advice.\n- Do not make promises about results or offer motivational hype.\n- Do not encourage passivity or fate-based thinking.\n- Stay separate from Kiaan and do not interfere with its role.`

    const request = `${systemPrompt}\n\nUser concern: "${trimmedConcern}"\n\nRespond using the four-step format with simple, grounded sentences. Include one small, doable action.`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Viyog is having trouble connecting right now. Please try again in a moment.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch {
      setError('Unable to reach Viyog. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#0d0d10]/85 border border-orange-500/15 rounded-3xl p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)] space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-orange-100/80">Outcome anxiety reducer</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Meet Viyog: The Detachment Coach</h2>
          <p className="text-sm text-orange-100/80 max-w-3xl">
            Viyog calms result-focused pressure and guides you back to present actions with one clear, doable step.
          </p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-white/5 border border-orange-500/20 text-xs text-orange-100/80">No accounts • Stored locally</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <label className="block text-sm font-semibold text-orange-100" htmlFor="viyog-input">Share the outcome worry</label>
          <textarea
            id="viyog-input"
            value={concern}
            onChange={e => setConcern(e.target.value)}
            placeholder="Example: I’m afraid the presentation will flop and everyone will think I’m incompetent."
            className="w-full min-h-[120px] rounded-2xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/70 p-4 focus:ring-2 focus:ring-orange-400/70 outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={requestDetachment}
              disabled={!concern.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Viyog is centering...' : 'Shift with Viyog'}
            </button>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-orange-400/20 text-xs text-orange-100/80 max-w-md">
              Viyog always responds with Validation, Attachment Check, Detachment Principle, and One Small Action.
            </div>
          </div>
          {error && <p className="text-sm text-orange-200">{error}</p>}
        </div>

        <div className="space-y-3 rounded-2xl bg-[#0b0b0f]/90 border border-orange-400/20 p-4 shadow-[0_10px_30px_rgba(255,115,39,0.14)]">
          <h3 className="text-sm font-semibold text-orange-50">Viyog</h3>
          <p className="text-sm text-orange-100/80">Guide outcome worries back toward steady, actionable steps.</p>
        </div>
      </div>

      {result && (
        <div
          className="rounded-2xl bg-black/60 border border-orange-500/20 p-4 space-y-2 shadow-inner shadow-orange-500/10"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-xs text-orange-100/70">
            <span className="font-semibold text-orange-50">Viyog’s response</span>
            <span>{new Date(result.requestedAt).toLocaleString()}</span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-orange-50 leading-relaxed">{result.response}</div>
        </div>
      )}
    </section>
  )
}

function RelationalCompass({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const [conflict, setConflict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useLocalState<RelationalCompassResult | null>('relational_compass', null)

  useEffect(() => {
    if (error) setError(null)
  }, [conflict, error])

  const handoffPrompt = conflict
    ? `Kiaan, help me speak calmly about this relationship conflict while keeping your supportive tone: ${summarizeContent(conflict)}`
    : result
      ? `Kiaan, keep your warmth while helping me phrase this relational compass plan: ${summarizeContent(result.response)}`
      : ''

  async function requestCompass() {
    const trimmedConflict = conflict.trim()
    if (!trimmedConflict) return

    setLoading(true)
    setError(null)

    const systemPrompt = `You are Relational Compass, a neutral, calm assistant that guides users through relationship conflicts with clarity, fairness, composure, and compassion. You are not Kiaan and never interfere with Kiaan. You reduce reactivity and ego-driven responses while keeping tone secular, modern, concise, and non-judgmental. Boundaries: do not provide therapy, legal, medical, or financial advice; do not take sides; do not tell someone to leave or stay; do not spiritualize; if safety is a concern, suggest reaching out to a trusted person or professional.\n\nFlow to follow for every reply:\n1) Acknowledge the conflict and its emotional weight.\n2) Separate emotions from ego impulses.\n3) Identify the user’s values or desired outcome (respect, honesty, understanding, peace).\n4) Offer right-action guidance rooted in fairness, accountability, calm honesty, boundaries, and listening before reacting.\n5) Provide ego-detachment suggestions (no need to win, pause before replying, focus on conduct over outcomes).\n6) Offer one compassion-based perspective without excusing harm.\n7) Share a non-reactive communication pattern with “I” language and one clarifying question.\n8) End with one simple next step the user can control.\nTone: short, clear sentences; calm; secular; never shaming.`

    const request = `${systemPrompt}\n\nUser conflict: "${trimmedConflict}"\n\nReturn the structured eight-part response in numbered sections with concise guidance only.`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request })
      })

      if (!response.ok) {
        setError('Relational Compass is unavailable right now. Please try again shortly.')
        return
      }

      const data = await response.json()
      setResult({ response: data.response, requestedAt: new Date().toISOString() })
    } catch {
      setError('Unable to reach Relational Compass. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0d10] via-[#0c0f14] to-[#0b0b0f] border border-orange-500/15 rounded-3xl p-6 md:p-8 shadow-[0_18px_70px_rgba(255,115,39,0.14)] space-y-6">
      <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-gradient-to-br from-orange-400/25 via-[#ffb347]/18 to-transparent blur-3xl" />
      <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-gradient-to-tr from-[#132022]/60 via-orange-500/12 to-transparent blur-3xl" />

      <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-orange-100/80">Dharma Compass for Relationships</p>
          <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent">Relational Compass</h2>
          <p className="text-sm text-orange-100/80 max-w-3xl">
            Calm, secular guidance for conflicts while KIAAN stays untouched—focus on right action, ego-detachment, and respectful communication.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-orange-100/80">
          <span className="rounded-full bg-white/10 border border-orange-500/20 px-3 py-1">Neutral and grounded</span>
          <span className="rounded-full bg-white/10 border border-orange-500/20 px-3 py-1">Keeps Kiaan intact</span>
        </div>
      </div>

      <div className="relative grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-orange-100" htmlFor="relational-conflict">Describe the conflict</label>
            <textarea
              id="relational-conflict"
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
              {loading ? 'Balancing guidance...' : 'Guide me with Relational Compass'}
            </button>
            <button
              onClick={() => handoffPrompt && onSelectPrompt(handoffPrompt)}
              disabled={!handoffPrompt}
              className="px-5 py-3 rounded-2xl bg-white/5 border border-orange-500/30 text-orange-50 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur"
            >
              Send context to KIAAN
            </button>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-orange-400/20 text-xs text-orange-100/80 max-w-xl">
              Output format: 1) Acknowledge 2) Emotion vs ego 3) Values 4) Right Action 5) Ego-detachment 6) Compassion lens 7) Non-reactive phrasing 8) Next step.
            </div>
          </div>
          {error && <p className="text-sm text-orange-200">{error}</p>}

          {result && (
            <div className="rounded-2xl bg-black/60 border border-orange-500/20 p-4 space-y-2 shadow-inner shadow-orange-500/10" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-orange-100/70">
                <span className="font-semibold text-orange-50">Relational Compass response</span>
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

function PeaceLogo() {
  return (
    <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-[#141414] via-[#1a120f] to-[#0c0c0e] border border-orange-500/30 shadow-[0_20px_60px_rgba(255,115,39,0.25)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,rgba(255,140,64,0.4),rgba(255,255,255,0.08),rgba(255,140,64,0.4))] opacity-70" />
      <svg viewBox="0 0 120 120" className="relative h-14 w-14 text-orange-100">
        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="6" className="opacity-60" />
        <path d="M60 16c12 14 17 28 17 44 0 16-5 30-17 44-12-14-17-28-17-44 0-16 5-30 17-44Z" fill="url(#peaceGlow)" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M45 64c5 6 10 9 15 9s10-3 15-9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <defs>
          <linearGradient id="peaceGlow" x1="40" y1="20" x2="80" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff7a1f" stopOpacity="0.8" />
            <stop offset="1" stopColor="#f3d9b0" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function TokenCard({ label, note, gradient, icon }: { label: string, note: string, gradient: string, icon: ReactElement }) {
  return (
    <div className={`relative min-w-[135px] sm:min-w-[150px] rounded-xl border border-white/10 bg-gradient-to-br ${gradient} p-2.5 shadow-[0_8px_26px_rgba(64,98,104,0.28)] overflow-hidden cursor-default select-none`}> 
      <div className="absolute -right-5 -top-5 h-14 w-14 rounded-full bg-white/20 blur-2xl" />
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-lg bg-black/40 border border-white/20 flex items-center justify-center text-xl text-emerald-50">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-emerald-50 drop-shadow-sm">{label}</p>
          <p className="text-[11px] text-emerald-50/80 leading-snug">{note}</p>
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

  useEffect(() => {
    const container = messageListRef.current
    if (!container) return

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages])

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

  async function deliverMessage(content: string) {
    const userMessage = { role: 'user' as const, content }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'I\'m having trouble connecting. Please try again. 💙' }])
      }
    } catch {
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
    await deliverMessage(trimmed)
  }

  function startGuidedPause() {
    setClaritySession(prev => ({ ...prev, active: true, started: true, countdown: 60, completed: false }))
  }

  async function sendPendingNow() {
    if (!claritySession.pendingMessage) return
    setPromptMotion(true)
    await deliverMessage(claritySession.pendingMessage)
    setClaritySession(clarityInitialState)
  }

  async function abandonClarityPause() {
    if (claritySession.pendingMessage) {
      if (claritySession.source === 'auto') {
        setPromptMotion(true)
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

  function renderAssistantContent(content: string, index: number) {
    const view = detailViews[index] ?? 'summary'
    const summary = summarizeContent(content)

    return (
      <div className="space-y-3">
        <div className="flex gap-2 text-[11px] text-orange-100/70 font-semibold">
          <button
            className={`px-3 py-1 rounded-full border transition ${
              view === 'summary'
                ? 'border-orange-300/60 bg-orange-400/20 text-orange-50 shadow-[0_6px_20px_rgba(255,179,71,0.25)]'
                : 'border-orange-200/15 hover:border-orange-300/40'
            }`}
            onClick={() => setDetailViews(prev => ({ ...prev, [index]: 'summary' }))}
          >
            summary
          </button>
          <button
            className={`px-3 py-1 rounded-full border transition ${
              view === 'detailed'
                ? 'border-orange-300/60 bg-orange-400/20 text-orange-50 shadow-[0_6px_20px_rgba(255,179,71,0.25)]'
                : 'border-orange-200/15 hover:border-orange-300/40'
            }`}
            onClick={() => setDetailViews(prev => ({ ...prev, [index]: 'detailed' }))}
          >
            detailed view
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs tracking-wide text-orange-200/70 font-semibold">{view === 'summary' ? 'summary' : 'detailed explanation'}</div>
          {view === 'detailed' && (
            <div className="bg-white/5 border border-orange-200/20 rounded-lg p-3 text-[12px] text-orange-50/80 leading-relaxed">
              <span className="font-semibold text-orange-50">Quick summary:</span> {summary}
            </div>
          )}
          <div className="bg-black/40 border border-orange-200/15 rounded-xl p-3 backdrop-blur-sm">
            <p className="whitespace-pre-wrap leading-relaxed text-sm text-orange-50/90">
              {view === 'summary' ? summary : content}
            </p>
          </div>
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

      <div ref={messageListRef} className="aurora-pane relative bg-black/50 border border-orange-500/20 rounded-2xl p-4 md:p-6 h-[55vh] min-h-[320px] md:h-[500px] overflow-y-auto space-y-4 shadow-inner shadow-orange-500/10">
        {messages.length === 0 && (
          <div className="text-center text-orange-100/70 py-20 md:py-32">
            <p className="text-6xl mb-4">✨</p>
            <p className="text-xl mb-2">How can I guide you today?</p>
            <p className="text-sm text-orange-100/70">Share what's on your mind</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg shadow-orange-500/10 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-orange-500/80 via-[#ff9933]/80 to-rose-500/80 text-white'
                : 'bg-white/5 border border-orange-200/10 text-orange-50 backdrop-blur'
            }`}>
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
    </section>
  )
}

function ClarityPauseSuite() {
  const [labMessage, setLabMessage] = useState("I'm about to quit and need to send this now.")
  const [labEvaluation, setLabEvaluation] = useState<ClarityEvaluation | null>(null)
  const [labOverlayOpen, setLabOverlayOpen] = useState(false)
  const [labStarted, setLabStarted] = useState(false)
  const [labCountdown, setLabCountdown] = useState(60)
  const [labMotionReduced, setLabMotionReduced] = useState(false)
  const [labAction, setLabAction] = useState<'pass_through' | 'pause_payload'>('pass_through')
  const [labLog, setLabLog] = useState<string[]>([])

  const labTriggers = [
    'I am about to quit and fire this off right now.',
    'So angry right now I want to send this message immediately.',
    'I should just walk out and be done with this.',
    'Talking through urgency without acting yet.',
  ]

  useEffect(() => {
    if (!labOverlayOpen || !labStarted || labCountdown <= 0) return

    const timer = setInterval(() => {
      setLabCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [labOverlayOpen, labStarted, labCountdown])

  useEffect(() => {
    if (labCountdown === 0 && labOverlayOpen) {
      setLabStarted(false)
      setLabLog(prev => [`60-second calm cycle complete`, ...prev].slice(0, 4))
    }
  }, [labCountdown, labOverlayOpen])

  const activeCue = labOverlayOpen
    ? Math.min(CLARITY_GROUNDING_SEQUENCE.length - 1, Math.floor((60 - labCountdown) / 10))
    : 0

  function runEvaluation() {
    const clean = labMessage.trim()
    if (!clean) return null

    const evaluation = evaluateClarityPause(clean)
    setLabEvaluation(evaluation)
    setLabAction(evaluation.decision === 'pause' ? 'pause_payload' : 'pass_through')
    setLabLog(prev => [`${evaluation.confidence.toUpperCase()} • ${evaluation.reason}`, ...prev].slice(0, 4))
    return evaluation
  }

  function launchOverlay() {
    const evaluation = runEvaluation()
    if (!evaluation) return

    const autoStart = evaluation.confidence === 'high' && evaluation.decision === 'pause'
    setLabCountdown(60)
    setLabStarted(autoStart)
    setLabOverlayOpen(true)
  }

  function resetLab() {
    setLabOverlayOpen(false)
    setLabStarted(false)
    setLabCountdown(60)
    setLabLog([])
  }

  const payloadPreview = {
    user_message: labMessage,
    context_intent_score: labEvaluation?.impulseScore ?? 0,
    impulse_trigger_flags: labEvaluation?.flags ?? [],
    action: labAction,
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0d10] via-[#111014] to-[#0c0c0f] border border-orange-500/20 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.14)] space-y-6">
      <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-orange-400/20 via-[#ffb347]/16 to-transparent blur-3xl" />
      <div className="absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-[#1b1f29]/60 via-orange-500/14 to-transparent blur-3xl" />

      <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs text-orange-100/80">High-Stress Decision Timer</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Clarity Pause</h2>
          <p className="text-sm text-orange-100/80 max-w-3xl">Interact with the pause overlay Kiaan uses—detect a trigger, launch a pause prompt, and watch the 60-second guide animate in real time.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-orange-100/80">
          <span className="rounded-full border border-orange-400/40 bg-white/5 px-3 py-1">Separate from Kiaan</span>
          <span className="rounded-full border border-orange-400/40 bg-white/5 px-3 py-1">Never edits responses</span>
          <span className="rounded-full border border-orange-400/40 bg-white/5 px-3 py-1">Decline anytime</span>
        </div>
      </div>

      <div className="relative grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl bg-black/50 border border-orange-500/20 p-4 shadow-[0_10px_40px_rgba(255,115,39,0.14)]">
          <div className="flex items-center justify-between text-xs text-orange-100/80">
            <span className="font-semibold text-orange-50">Trigger detection system</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Non-blocking</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-orange-100/80">
            {labTriggers.map(trigger => (
              <button
                key={trigger}
                onClick={() => setLabMessage(trigger)}
                className="rounded-full border border-orange-400/30 px-3 py-1 hover:border-orange-300/60 transition"
              >
                {trigger}
              </button>
            ))}
          </div>
          <textarea
            value={labMessage}
            onChange={e => setLabMessage(e.target.value)}
            className="w-full rounded-xl border border-orange-500/30 bg-black/40 p-3 text-sm text-orange-50 focus:border-orange-300/70 focus:outline-none"
            rows={3}
            placeholder="Type a high-intent, urgent, or calm message"
          />
          <div className="flex flex-wrap gap-2 text-[11px] text-orange-100/80">
            <button
              onClick={runEvaluation}
              className="rounded-lg bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-orange-500/25"
            >
              Evaluate triggers
            </button>
            <button
              onClick={launchOverlay}
              className="rounded-lg border border-orange-500/40 bg-white/5 px-4 py-2 font-semibold text-orange-50"
            >
              Launch clarity overlay
            </button>
            <button
              onClick={resetLab}
              className="rounded-lg border border-white/10 px-4 py-2 text-orange-100/80"
            >
              Reset model
            </button>
          </div>

          {labEvaluation && (
            <div className="space-y-2 rounded-xl border border-orange-400/30 bg-white/5 p-3 text-sm text-orange-100/85">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-orange-50">{labEvaluation.decision === 'pause' ? 'pause_payload' : 'pass_through'}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-orange-50">Confidence: {labEvaluation.confidence}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-orange-50">Intent score: {labEvaluation.impulseScore}/5</span>
              </div>
              <p className="font-semibold text-orange-50">Flags</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-orange-100/80">
                {(labEvaluation.flags.length ? labEvaluation.flags : ['No explicit triggers']).map(flag => (
                  <span key={flag} className="rounded-full border border-orange-400/30 bg-black/40 px-3 py-1">{flag}</span>
                ))}
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-orange-300 to-orange-500 transition-[width] duration-700"
                  style={{ width: `${((labEvaluation.impulseScore ?? 0) / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-orange-100/70">Confidence tiers: High auto-starts, Medium offers pause, Low logs only—Kiaan still responds.</p>
            </div>
          )}

          {labLog.length > 0 && (
            <div className="rounded-xl border border-orange-400/20 bg-black/30 p-3 text-[11px] text-orange-100/80 space-y-1">
              <p className="font-semibold text-orange-50">Recent actions</p>
              {labLog.map(entry => (
                <div key={entry} className="rounded-lg bg-white/5 px-3 py-2">{entry}</div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl bg-[#0b0b10]/85 border border-orange-500/25 p-4 shadow-[0_12px_48px_rgba(255,115,39,0.18)]">
          <div className="flex items-center justify-between text-xs text-orange-100/80">
            <span className="font-semibold text-orange-50">Clarity overlay</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setLabMotionReduced(prev => !prev)}
                className="rounded-full border border-orange-400/30 px-3 py-1 text-[11px] text-orange-100/80"
              >
                {labMotionReduced ? 'Motion reduction on' : 'Motion reduction off'}
              </button>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px]">{labOverlayOpen ? 'Overlay active' : 'Inactive'}</span>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-[#0c0c0f]/90 via-[#0f0d10]/90 to-[#140d0a]/90 p-4 space-y-3 ${labOverlayOpen ? 'shadow-[0_20px_60px_rgba(255,115,39,0.25)] ring-1 ring-orange-400/40' : ''}`}>
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Instant overlay</p>
              <h3 className="text-xl font-semibold text-orange-50">Clarity Pause</h3>
              <p className="text-sm text-orange-100/80">Create space before you act. No advice. Just the 60-second neutral pause.</p>
              <p className="text-[11px] text-orange-100/70">Kiaan stays untouched—decline to pass through instantly.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200/25 bg-black/40 p-3 text-xs text-emerald-50/85 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-50">Compatibility Guard</span>
                  <span className="rounded-full bg-emerald-200/15 px-2 py-1 text-[10px]">{labEvaluation?.confidence === 'high' ? 'Auto interrupt' : 'Offer pause'}</span>
                </div>
                <p>Overlay never rewrites Kiaan. Closing sends the message unchanged.</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    onClick={() => setLabAction('pass_through')}
                    className={`rounded-lg px-3 py-2 ${labAction === 'pass_through' ? 'bg-gradient-to-r from-emerald-300 to-orange-400 text-slate-950' : 'border border-emerald-200/30 text-emerald-50'}`}
                  >
                    Pass through now
                  </button>
                  <button
                    onClick={() => setLabAction('pause_payload')}
                    className={`rounded-lg px-3 py-2 ${labAction === 'pause_payload' ? 'bg-gradient-to-r from-orange-400 to-rose-300 text-slate-950' : 'border border-orange-400/40 text-orange-50'}`}
                  >
                    Hold for pause
                  </button>
                </div>
              </div>

            </div>

            <div className="grid gap-3 md:grid-cols-3 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/25 via-[#ff9933]/25 to-rose-300/30 shadow-[0_16px_50px_rgba(255,153,51,0.25)] ${labMotionReduced ? '' : 'breathing-orb'}`}
                >
                  {!labMotionReduced && <div className="absolute inset-2 rounded-full bg-orange-400/35 blur-2xl" />}
                  <span className="text-[11px] font-semibold text-orange-50">{labMotionReduced ? 'Inhale / Exhale' : 'Breathe'}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-orange-300 to-orange-500 transition-[width] duration-500"
                    style={{ width: `${((60 - labCountdown) / 60) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-orange-100/70">{labOverlayOpen ? `${labCountdown}s remaining` : 'Ready when you are'}</p>
              </div>

              <div className="md:col-span-2 space-y-2 rounded-xl border border-orange-500/30 bg-white/5 p-3 text-xs text-orange-100/85">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-orange-50">Live cues</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => { setLabStarted(true); setLabOverlayOpen(true) }}
                      className="rounded-lg border border-orange-400/30 px-3 py-1"
                    >
                      {labStarted ? 'Restart 60s' : 'Start 60s pause'}
                    </button>
                    <button
                      onClick={() => { setLabStarted(false); setLabCountdown(60) }}
                      className="rounded-lg border border-orange-400/20 px-3 py-1"
                    >
                      Reset timer
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-orange-50">“Are you acting from clarity or from emotion right now?”</p>
                <ul className="space-y-1">
                  {CLARITY_GROUNDING_SEQUENCE.map((step, idx) => (
                    <li
                      key={step.time}
                      className={`flex gap-2 rounded-lg px-2 py-1 ${labOverlayOpen && idx === activeCue ? 'bg-orange-500/20 border border-orange-400/40 text-orange-50' : 'text-orange-100/85'}`}
                    >
                      <span className="min-w-[54px] text-[11px] font-semibold text-orange-300">{step.time}</span>
                      <span className="leading-relaxed">{step.prompt}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-lg border border-orange-400/25 bg-black/30 p-3 space-y-1">
                  <p className="font-semibold text-orange-50">Close with grounded choice</p>
                  <ul className="list-disc list-inside space-y-1">
                    {CLARITY_CLOSING_CHOICES.map(choice => (
                      <li key={choice}>{choice}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/20 bg-black/40 p-3 text-xs text-emerald-50/85 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-50">Neutral reasoning</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">Guided reflection</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {CLARITY_REASONING_PROMPTS.map(line => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="text-[11px] text-emerald-50/70">Decide from clarity, not pressure. Kiaan keeps replying normally while you pause.</p>
            </div>
          </div>
        </div>
      </div>
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

function KarmaResetGuide({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const resetSteps = [
    { title: 'Pause and breathe', detail: 'Take 4 slow breaths to let the nervous system settle before reacting.' },
    { title: 'Name the ripple', detail: 'What happened? Who was impacted? Acknowledge it without self-blame.' },
    { title: 'Choose the repair', detail: 'Pick one caring action: apology, clarification, or a calm follow-up.' },
    { title: 'Move with intention', detail: 'Return to your values; act in a way future-you will respect.' }
  ]

  const actions = [
    { label: 'Apology', helper: 'Offer a sincere apology that stays brief and grounded.' },
    { label: 'Clarification', helper: 'Gently clarify what you meant and invite understanding.' },
    { label: 'Calm follow-up', helper: 'Return with a warm note that re-centers the conversation.' }
  ]

  const prompts = [
    "Help me reset after a misstep so I stay aligned with Kiaan's calm guidance.",
    'I want to repair a small mistake—walk me through a kind response.',
    'Give me a short reflection to release guilt and act with clarity.'
  ]

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [breathActive, setBreathActive] = useState(false)
  const [breathTick, setBreathTick] = useState(0)
  const [misstep, setMisstep] = useState('')
  const [impact, setImpact] = useState('')
  const [repairAction, setRepairAction] = useState(actions[0].label)
  const [intention, setIntention] = useState('')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    if (!breathActive) return
    setBreathTick(0)
    let current = 0
    const id = setInterval(() => {
      current += 1
      setBreathTick(current)
      if (current >= 16) {
        setBreathActive(false)
        clearInterval(id)
      }
    }, 900)

    return () => clearInterval(id)
  }, [breathActive])

  const breathPhase = ['Inhale gently', 'Hold softly', 'Exhale slowly', 'Rest in calm'][breathTick % 4] ?? 'Inhale gently'
  const breathsDone = Math.min(4, Math.floor(breathTick / 4))

  function buildPlan() {
    const summary = `Gentle course correction\n\n- Pause: ${breathActive ? 'in progress' : breathsDone >= 4 ? 'completed 4 slow breaths' : 'begin with 4 slow breaths'}\n- What happened: ${misstep || 'a brief misstep'}\n- Who felt it: ${impact || 'I noticed the tone shifted'}\n- Repair choice: ${repairAction}\n- Intention: ${intention || 'stay kind, steady, and clear'}`
    const prompt = `${summary}\n\nGuide me through a calm message that keeps Kiaan's supportive tone and helps me repair with care.`
    setPlan(prompt)
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0c10] via-[#120d0c] to-[#0b0b0f] border border-orange-500/15 p-6 md:p-7 space-y-5 shadow-[0_20px_80px_rgba(255,115,39,0.14)]">
      <div className="absolute -right-6 -top-8 h-40 w-40 rounded-full bg-gradient-to-br from-orange-400/20 via-[#ffb347]/18 to-transparent blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-gradient-to-tr from-[#1f1720]/60 via-orange-500/14 to-transparent blur-3xl" />

      <div className="relative flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-orange-100/80">Gentle course correction</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Karma Reset Guide</h2>
          <p className="text-sm text-orange-100/80 max-w-2xl">
            A calm checklist to reset after small missteps while keeping KIAAN’s warm, non-judgmental tone intact.
          </p>
        </div>
        <div className="text-xs text-orange-100/80 bg-white/5 border border-orange-500/25 rounded-full px-3 py-1">Keeps conversations kind and respectful</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          <div className="rounded-2xl border border-orange-500/20 bg-black/40 p-4 shadow-[0_10px_30px_rgba(255,115,39,0.12)]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-orange-50">4-breath reset</p>
                <p className="text-xs text-orange-100/75">Let the guided breathing animation lead you.</p>
              </div>
              <button
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-orange-500 to-[#ffb347] text-slate-950 shadow-md shadow-orange-500/25 hover:scale-105 transition"
                onClick={() => setBreathActive(true)}
              >
                {breathActive ? 'Reset in motion' : breathsDone >= 4 ? 'Replay reset' : 'Begin reset'}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/20 via-[#ffb347]/20 to-transparent flex items-center justify-center">
                <div
                  className={`h-16 w-16 rounded-full bg-gradient-to-br from-orange-400/25 via-[#ff9933]/20 to-orange-200/10 shadow-inner shadow-orange-500/30 ${breathActive ? 'animate-ping' : 'animate-pulse'}`}
                />
                <div className="absolute inset-2 rounded-full border border-orange-400/30" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-orange-50">{breathPhase}</div>
                <div className="text-xs text-orange-100/75">{Math.min(4, breathsDone + 1)} / 4 breaths</div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-[#ffb347] transition-all" style={{ width: `${(Math.min(breathTick, 16) / 16) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {resetSteps.map(step => (
              <button
                key={step.title}
                onClick={() => setCompletedSteps(prev => ({ ...prev, [step.title]: !prev[step.title] }))}
                className={`text-left rounded-2xl border bg-black/40 p-4 shadow-[0_10px_30px_rgba(255,115,39,0.12)] transition ${
                  completedSteps[step.title]
                    ? 'border-green-300/50 bg-green-500/10 shadow-green-500/20'
                    : 'border-orange-500/20 hover:border-orange-300/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-5 w-5 rounded-full border flex items-center justify-center text-[11px] ${
                      completedSteps[step.title]
                        ? 'border-green-300 bg-green-500/30 text-green-50'
                        : 'border-orange-400/60 text-orange-100'
                    }`}
                  >
                    {completedSteps[step.title] ? '✓' : '○'}
                  </span>
                  <p className="text-sm font-semibold text-orange-50">{step.title}</p>
                </div>
                <p className="text-xs text-orange-100/75 leading-relaxed mt-2">{step.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-400/25 bg-[#0b0b0f]/85 p-4 space-y-4 shadow-[0_10px_40px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-orange-50">Talk it through with KIAAN</h3>
            <span className="text-[11px] text-orange-100/70 bg-white/5 border border-orange-500/20 rounded-full px-2 py-1">Quick fill</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-orange-100/80">What happened?</label>
            <textarea
              value={misstep}
              onChange={e => setMisstep(e.target.value)}
              placeholder="A brief slip or tone that felt off..."
              className="w-full rounded-xl border border-orange-400/25 bg-white/5 p-3 text-sm text-orange-50 focus:border-orange-300/70 outline-none"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-orange-100/80">Who felt the ripple?</label>
            <input
              value={impact}
              onChange={e => setImpact(e.target.value)}
              placeholder="A teammate, friend, or even myself"
              className="w-full rounded-xl border border-orange-400/25 bg-white/5 p-3 text-sm text-orange-50 focus:border-orange-300/70 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-orange-100/80">Choose the repair</label>
            <div className="grid grid-cols-1 gap-2">
              {actions.map(action => (
                <button
                  key={action.label}
                  onClick={() => setRepairAction(action.label)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    repairAction === action.label
                      ? 'border-green-300/60 bg-green-500/10 text-green-50 shadow-[0_8px_24px_rgba(52,211,153,0.18)]'
                      : 'border-orange-400/25 bg-white/5 text-orange-50 hover:border-orange-300/60'
                  }`}
                >
                  <div className="text-sm font-semibold">{action.label}</div>
                  <div className="text-[11px] text-orange-100/75">{action.helper}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-orange-100/80">Move with intention</label>
            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="How do you want to show up next?"
              className="w-full rounded-xl border border-orange-400/25 bg-white/5 p-3 text-sm text-orange-50 focus:border-orange-300/70 outline-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={buildPlan}
              className="flex-1 min-w-[140px] px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 hover:scale-105 transition"
            >
              Build reset plan
            </button>
            <button
              onClick={() => {
                const chosen = plan || prompts[0]
                onSelectPrompt(chosen)
                document.getElementById('kiaan-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-4 py-2 rounded-xl border border-orange-400/25 bg-white/5 text-sm text-orange-50 hover:border-orange-300/60 transition"
            >
              Send to KIAAN
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {prompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  onSelectPrompt(prompt)
                  document.getElementById('kiaan-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-left rounded-xl border border-orange-400/25 bg-white/5 px-3 py-3 text-sm text-orange-50 hover:border-orange-300/60 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {plan && (
            <div className="text-[11px] text-orange-100/80 bg-white/5 border border-orange-500/20 rounded-lg p-3 whitespace-pre-line">
              {plan}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DailyWisdom({ onChatClick }: { onChatClick: (prompt: string) => void }) {
  const [saved, setSaved] = useState(false)
  const wisdom = {
    text: "The key to peace lies not in controlling outcomes, but in mastering your response. Focus your energy on doing your best without attachment to results, and discover true freedom.",
    principle: "Action without Attachment"
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f0d0c] via-[#140f0c] to-[#0c0a0a] border border-orange-400/15 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.16)]">
      <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-orange-400/25 via-[#ffb347]/20 to-transparent blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-gradient-to-tr from-[#2b1a13]/50 via-orange-500/15 to-transparent blur-3xl" />
      <div className="relative flex justify-between mb-4 items-start gap-3">
        <div className="flex gap-2 items-center">
          <span className="text-3xl">💎</span>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Today's Wisdom</h2>
        </div>
        <div className="text-sm text-orange-100/80 bg-white/5 border border-orange-500/20 rounded-full px-3 py-1">{new Date().toLocaleDateString()}</div>
      </div>

      <blockquote className="relative text-lg text-orange-50 mb-4 italic leading-relaxed bg-white/5 border border-orange-200/15 rounded-2xl p-4 shadow-[0_10px_40px_rgba(255,115,39,0.14)]">
        “{wisdom.text}”
      </blockquote>

      <p className="text-sm text-orange-100/80 mb-4">✨ Principle: {wisdom.principle}</p>

      <div className="flex gap-3 flex-wrap">
        <button
          className="px-4 py-2 bg-gradient-to-r from-orange-400 to-[#ffb347] text-slate-950 font-semibold rounded-lg text-sm shadow-lg shadow-orange-500/20 hover:scale-105 transition"
          onClick={() => {
            onChatClick(`I'd like to talk about today's wisdom: "${wisdom.text}"`)
            document.getElementById('kiaan-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          💬 Chat about this
        </button>
        <button onClick={() => setSaved(!saved)} className="px-4 py-2 bg-white/10 border border-orange-200/20 hover:border-orange-300/60 rounded-lg text-sm text-orange-50 transition">
          {saved ? '⭐ Saved' : '☆ Save'}
        </button>
        <button className="px-4 py-2 bg-white/10 border border-orange-200/20 hover:border-orange-300/60 rounded-lg text-sm text-orange-50 transition">📤 Share</button>
      </div>
    </section>
  )
}

type RoomMessage = {
  room: string
  content: string
  at: string
  author: 'You' | 'Guide'
}

function PublicChatRooms() {
  const rooms = [
    { id: 'grounding', name: 'Calm Grounding', theme: 'Gentle check-ins and deep breaths' },
    { id: 'gratitude', name: 'Gratitude Garden', theme: 'Sharing what is going well today' },
    { id: 'courage', name: 'Courage Circle', theme: 'Encouragement for challenging moments' }
  ]

  const [activeRoom, setActiveRoom] = useState(rooms[0].id)
  const [message, setMessage] = useState('')
  const [alert, setAlert] = useState<string | null>(null)
  const [messages, setMessages] = useLocalState<RoomMessage[]>('kiaan_public_rooms', [
    {
      room: 'grounding',
      content: 'Welcome. Breathe slowly and keep your words kind—this circle is for encouragement only.',
      at: new Date().toISOString(),
      author: 'Guide'
    }
  ])

  const prohibited = [
    /\b(?:fuck|shit|bitch|bastard|asshole|dick|cunt)\b/i,
    /\b(?:damn|hell)\b/i,
    /\b(?:idiot|stupid|dumb)\b/i,
    /\b(?:hate|kill|harm)\b/i,
    /[\u0900-\u097F]*अपशब्द/i // broad match to discourage Hindi slurs placeholder
  ]

  function isRespectful(text: string) {
    const normalized = text.trim().toLowerCase()
    return normalized.length > 0 && !prohibited.some(pattern => pattern.test(normalized))
  }

  const activeMessages = messages.filter(m => m.room === activeRoom)

  function sendRoomMessage() {
    if (!isRespectful(message)) {
      setAlert('Please keep the exchange kind and free of any harmful or foul language. Your message was not sent.')
      return
    }

    const entry: RoomMessage = {
      room: activeRoom,
      content: message.trim(),
      at: new Date().toISOString(),
      author: 'You'
    }

    const supportiveReply: RoomMessage = {
      room: activeRoom,
      content: `Thank you for keeping this space supportive. ${rooms.find(r => r.id === activeRoom)?.theme ?? 'Stay kind to one another.'}`,
      at: new Date().toISOString(),
      author: 'Guide'
    }

    setMessages([...messages, entry, supportiveReply])
    setMessage('')
    setAlert(null)
  }

  return (
    <section id="wisdom-chat-rooms" className="bg-[#0c0c10]/85 backdrop-blur border border-orange-500/15 rounded-3xl p-6 md:p-8 space-y-4 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-orange-100/80">Community Rooms</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Wisdom Chat Rooms</h2>
          <p className="text-sm text-orange-100/70">Move seamlessly into multiple calm rooms. Positive, helpful exchanges only—foul language in any language is blocked.</p>
        </div>
        <div className="text-xs text-orange-100/80 bg-white/5 border border-orange-500/20 px-3 py-2 rounded-2xl">Kindness-first moderation</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => { setActiveRoom(room.id); setAlert(null); }}
            className={`px-4 py-2 rounded-2xl border text-sm transition-all ${
              activeRoom === room.id
                ? 'bg-gradient-to-r from-orange-400/70 via-[#ffb347]/70 to-rose-400/70 text-slate-950 font-semibold shadow shadow-orange-500/25'
                : 'bg-white/5 border-orange-200/10 text-orange-50 hover:border-orange-300/40'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      <div className="bg-black/50 border border-orange-500/20 rounded-2xl p-4 space-y-3 min-h-[280px] max-h-[50vh] md:min-h-[320px] md:max-h-none overflow-y-auto shadow-inner shadow-orange-500/5">
        {activeMessages.map((msg, index) => (
          <div key={`${msg.at}-${index}`} className={`flex ${msg.author === 'You' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-lg shadow-orange-500/10 ${
              msg.author === 'You'
                ? 'bg-gradient-to-r from-orange-500/80 via-[#ff9933]/80 to-rose-500/80 text-white'
                : 'bg-white/5 border border-orange-200/10 text-orange-50 backdrop-blur'
            }`}>
              <p className="font-semibold mb-1">{msg.author === 'You' ? 'You' : 'Community Guide'}</p>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[11px] text-orange-100/70 mt-1">{new Date(msg.at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>

      {alert && <p className="text-xs text-orange-200">{alert}</p>}

      <div className="flex gap-3 flex-col sm:flex-row">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendRoomMessage()}
          placeholder="Share something helpful for the room..."
          className="flex-1 w-full px-4 py-3 bg-black/60 border border-orange-500/40 rounded-xl focus:ring-2 focus:ring-orange-400/70 outline-none placeholder:text-orange-100/70 text-orange-50"
        />
        <button
          onClick={sendRoomMessage}
          disabled={!message.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 font-semibold disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-orange-500/20 w-full sm:w-auto"
        >
          Share warmly
        </button>
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
  const [guidance, setGuidance] = useState<Record<string, string>>({})
  const [guidanceLoading, setGuidanceLoading] = useState<Record<string, boolean>>({})

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
        if (!cancelled) setEncryptionMessage('Journal restored to a blank state because the saved copy could not be read securely.')
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
        setEncryptionMessage('Could not secure your journal locally. Please retry in a moment.')
      }
    })()
  }, [entries, encryptionReady])

  const moods = [
    { label: 'Peaceful', emoji: '🙏', tone: 'positive' },
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
      setEncryptionMessage('Preparing secure journal space. Please try adding your entry again in a few seconds.')
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
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Please offer a supportive Gita-inspired reflection on this private journal entry: ${entry.body}` })
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
        headline: 'KIAAN gently invites you to begin your journal practice this week.',
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
          'Revisit a peaceful entry and let its lesson guide today’s choices, as the Gita teaches equanimity in action.',
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
    <section className="space-y-4">
      <div className="bg-[#0d0d10]/85 backdrop-blur border border-orange-500/15 rounded-3xl p-6 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-orange-100/80">Private Journal</p>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-200 to-[#ffb347] bg-clip-text text-transparent">Sacred Reflections</h2>
            <p className="text-sm text-orange-100/70">Entries stay on your device and refresh the weekly guidance automatically.</p>
          </div>
          <div className="bg-white/5 border border-orange-500/20 text-orange-50 px-4 py-2 rounded-2xl text-sm">
            Weekly entries: {weeklyEntries.length}
          </div>
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
            <p className="text-xs text-orange-200">Preparing secure journal space...</p>
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
              Add Journal Entry
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

function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const moods = [
    { emoji: '😊', label: 'Great', color: 'from-orange-500 to-[#ffb347]' },
    { emoji: '😐', label: 'Okay', color: 'from-[#ffae42] to-orange-500' },
    { emoji: '😔', label: 'Low', color: 'from-zinc-700 to-slate-700' },
    { emoji: '😰', label: 'Anxious', color: 'from-red-600 to-orange-600' },
    { emoji: '🙏', label: 'Peaceful', color: 'from-[#ffb347] to-rose-400' },
  ]

  return (
    <section className="bg-[#0d0d10]/80 border border-orange-500/15 rounded-2xl p-6 shadow-[0_10px_40px_rgba(255,115,39,0.08)]">
      <h2 className="text-xl font-semibold mb-4 text-orange-100">📊 How are you feeling?</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {moods.map((m) => (
          <button
            key={m.label}
            onClick={() => setSelectedMood(m.label)}
            className={`flex flex-col items-center p-4 rounded-xl transition-all ${
              selectedMood === m.label ? `bg-gradient-to-br ${m.color} scale-105 text-black` : 'bg-black/50 text-orange-50 hover:bg-zinc-800'
            }`}
          >
            <span className="text-4xl mb-2">{m.emoji}</span>
            <span className="text-sm">{m.label}</span>
          </button>
        ))}
      </div>
      {selectedMood && <p className="mt-4 text-center text-sm text-orange-300">✓ Mood logged</p>}
    </section>
  )
}
