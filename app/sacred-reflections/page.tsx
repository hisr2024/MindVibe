'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VoiceInputButton, VoiceResponseButton } from '@/components/voice'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/hooks/useLanguage'

type EncryptedPayload = {
  ciphertext: string
  iv: string
  salt: string
  auth_tag?: string | null
  algorithm?: string
  key_version?: string
}

type JournalEntry = {
  id: string
  title?: string
  body: string
  mood?: string
  at: string
}

type ApiEntry = {
  id: string
  encrypted_title?: EncryptedPayload | null
  encrypted_content: EncryptedPayload
  moods?: string[] | null
  tags?: string[] | null
  client_updated_at: string
  created_at: string
  updated_at: string
}

const JOURNAL_ENTRY_STORAGE = 'kiaan_journal_entries_secure'

// Sanitize user input to prevent prompt injection when sending to API
function sanitizeForApi(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\\/g, '') // Remove backslashes
    .slice(0, 5000) // Limit length for journal entries
}

function toBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: ArrayBuffer) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

async function encryptText(plain: string, passphrase: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt.buffer)
  const encoded = new TextEncoder().encode(plain)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return { ciphertext: toBase64(encrypted), iv: toBase64(iv), salt: toBase64(salt), algorithm: 'AES-GCM' }
}

async function decryptText(payload: EncryptedPayload, passphrase: string): Promise<string> {
  const salt = fromBase64(payload.salt)
  const iv = fromBase64(payload.iv)
  const encrypted = fromBase64(payload.ciphertext)
  const key = await deriveKey(passphrase, salt.buffer)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

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

export default function SacredReflectionsPage() {
  const [passphrase, setPassphrase] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState('Peaceful')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [encryptionReady, setEncryptionReady] = useState(false)
  const [encryptionMessage, setEncryptionMessage] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [guidance, setGuidance] = useState<Record<string, string>>({})
  const [guidanceLoading, setGuidanceLoading] = useState<Record<string, boolean>>({})

  // Voice integration
  const { language } = useLanguage()

  // Track passphrase only in-memory; do not persist sensitive material to disk
  useEffect(() => {
    if (passphrase) {
      setEncryptionReady(true)
    } else {
      setEncryptionReady(false)
    }
  }, [passphrase])

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

  // Handle prefill from KIAAN chat
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    if (params.get('prefill') === 'true') {
      const prefillData = localStorage.getItem('journal_prefill')
      if (prefillData) {
        try {
          const { body: prefillBody } = JSON.parse(prefillData)
          if (prefillBody) {
            setBody(prefillBody)
          }
          localStorage.removeItem('journal_prefill')
        } catch {
          // Ignore parsing errors
        }
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadEntries() {
      if (!passphrase) return
      try {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(JOURNAL_ENTRY_STORAGE) : null
        if (stored) {
          const parsedPayload = JSON.parse(stored) as EncryptedPayload
          const decrypted = await decryptText(parsedPayload, passphrase)
          const parsed = JSON.parse(decrypted) as JournalEntry[]
          if (!cancelled) setEntries(parsed)
        }
      } catch {
        if (!cancelled) setEncryptionMessage('Journal restored to a blank state because the saved copy could not be read securely.')
        if (!cancelled) setEntries([])
      } finally {
        if (!cancelled) setEncryptionReady(true)
      }
    }

    loadEntries()
    return () => { cancelled = true }
  }, [passphrase])

  useEffect(() => {
    if (!encryptionReady || !passphrase) return
    ;(async () => {
      try {
        const encrypted = await encryptText(JSON.stringify(entries), passphrase)
        window.localStorage.setItem(JOURNAL_ENTRY_STORAGE, JSON.stringify(encrypted))
        setEncryptionMessage(null)
      } catch {
        setEncryptionMessage('Could not secure your journal locally. Please retry.')
      }
    })()
  }, [entries, encryptionReady, passphrase])

  async function syncFromServer() {
    if (!passphrase) return
    try {
      const response = await apiFetch('/api/journal/entries')
      if (!response.ok) return
      const data: ApiEntry[] = await response.json()
      const decrypted: JournalEntry[] = []
      for (const entry of data) {
        const raw = await decryptText(entry.encrypted_content, passphrase)
        const parsed = JSON.parse(raw) as JournalEntry
        decrypted.push(parsed)
      }
      setEntries(prev => {
        const merged = [...decrypted, ...prev]
        const seen = new Set<string>()
        return merged.filter(entry => {
          if (seen.has(entry.id)) return false
          seen.add(entry.id)
          return true
        }).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      })
    } catch {
      // ignore sync failures in offline mode
    }
  }

  useEffect(() => {
    if (!passphrase) return
    syncFromServer()
  }, [passphrase])

  async function addEntry() {
    if (!body.trim()) return
    if (!encryptionReady || !passphrase) {
        setEncryptionMessage('Enter a passphrase to secure your journal.')
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

    // Push to backend for cross-device sync (encrypted only)
    try {
      const payload = await encryptText(JSON.stringify(entry), passphrase)
      await apiFetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entry.id,
          content: payload,
          moods: mood ? [mood] : [],
          tags: mood ? [mood] : [],
          client_updated_at: entry.at
        })
      })
    } catch {
      // remain silent if offline; local cache holds encrypted data
    }
  }

  async function requestGuidance(entry: JournalEntry) {
    setGuidanceLoading(prev => ({ ...prev, [entry.id]: true }))
    try {
      const sanitizedBody = sanitizeForApi(entry.body)
      // Use local Next.js API route which handles backend proxying
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: `Please offer a supportive Ancient Wisdom-inspired reflection on this private journal entry: ${sanitizedBody}` })
      })

      if (response.ok) {
        const data = await response.json()
        setGuidance(prev => ({ ...prev, [entry.id]: data.response }))
      } else {
        setGuidance(prev => ({ ...prev, [entry.id]: 'KIAAN could not respond right now. Please try again shortly.' }))
      }
    } catch {
      setGuidance(prev => ({ ...prev, [entry.id]: 'Connection issue. Try again in a moment.' }))
    } finally {
      setGuidanceLoading(prev => ({ ...prev, [entry.id]: false }))
    }
  }

  // Weekly assessment
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weeklyEntries = entries.filter(e => new Date(e.at) >= sevenDaysAgo)

  const moodCounts = weeklyEntries.reduce<Record<string, number>>((acc, curr) => {
    const moodKey = curr.mood ?? 'Unspecified'
    acc[moodKey] = (acc[moodKey] || 0) + 1
    return acc
  }, {})

  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Peaceful'

  const positiveMoods = new Set(moods.filter(m => m.tone === 'positive').map(m => m.label))
  const challengingMoods = new Set(moods.filter(m => m.tone === 'challenging').map(m => m.label))
  const positiveDays = weeklyEntries.filter(e => positiveMoods.has(e.mood ?? '')).length
  const challengingDays = weeklyEntries.filter(e => challengingMoods.has(e.mood ?? '')).length

  const assessment = (() => {
    if (weeklyEntries.length === 0) {
      return {
        headline: 'KIAAN gently invites you to begin your journal practice this week.',
        guidance: [
          'Start with two or three lines on what felt peaceful or challenging today.',
          'Return here each evening; KIAAN will keep the space steady and private.',
        ]
      }
    }

    if (challengingDays > positiveDays) {
      return {
        headline: 'KIAAN notices some heavier moments this week and offers steady companionship.',
        guidance: [
          'Pair each entry with one small act of self-kindness.',
          'Revisit a peaceful entry and let its lesson guide today.',
        ]
      }
    }

    return {
      headline: 'KIAAN celebrates your steady reflections and balanced moods this week.',
      guidance: [
        'Keep honoring what works—repeat habits that nurture your peace.',
        'Before each entry, pause for three breaths.',
      ]
    }
  })()

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-3 sm:p-4 md:p-8 pb-28 sm:pb-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="rounded-2xl sm:rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-4 sm:p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Private Sanctuary</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Sacred Reflections
              </h1>
              <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                Your encrypted private journal. Entries are sealed with AES-GCM in your browser and synced to the cloud only as ciphertext.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>

          {/* Encryption Badges */}
          <div className="mt-4 flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
              encryptionReady
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-50'
                : 'bg-orange-500/15 border-orange-400/40 text-orange-50'
            }`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${encryptionReady ? 'bg-emerald-300' : 'bg-orange-300'}`} />
              AES-GCM secured locally
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-50'
                : 'bg-orange-500/15 border-orange-400/40 text-orange-50'
            }`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-300' : 'bg-orange-300'}`} />
              Offline-ready saves on device
            </span>
          </div>

          {encryptionMessage && (
            <p className="mt-3 text-xs text-orange-200">{encryptionMessage}</p>
          )}
        </header>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-[1.4fr,1fr]">
          {/* Left: Journal Entry Form */}
          <section className="rounded-2xl sm:rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-4 sm:p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-orange-50">New Reflection</h2>
              <p className="text-xs text-orange-100/70 mt-1">KIAAN holds space for your thoughts with warmth and privacy.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-orange-100">Encryption passphrase</label>
              <input
                type="password"
                autoComplete="off"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="Required for decryption and sync"
                className="mt-2 w-full bg-black/50 border border-orange-800/60 rounded-2xl px-4 py-3 text-orange-50 placeholder:text-orange-100/50 focus:ring-2 focus:ring-orange-400/50 outline-none"
              />
              <p className="mt-1 text-xs text-orange-100/60">Stored only in your browser. MindVibe never sees it.</p>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="text-sm font-semibold text-orange-100">Select today's tone</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {moods.map(option => (
                  <button
                    key={option.label}
                    onClick={() => setMood(option.label)}
                    className={`px-3 py-2.5 sm:py-2 rounded-2xl border text-sm transition-all ${
                      mood === option.label
                        ? 'bg-gradient-to-r from-orange-500/70 via-[#ff9933]/70 to-orange-300/70 border-orange-300 text-black shadow-lg shadow-orange-500/25'
                        : 'bg-black/50 border-orange-800/60 text-orange-100 hover:border-orange-500/60'
                    }`}
                  >
                    <span className="mr-1">{option.emoji}</span>{option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-orange-100">Title (optional)</label>
              <div className="mt-2 flex gap-2 items-center">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="A word or phrase for this moment..."
                  className="flex-1 bg-black/50 border border-orange-800/60 rounded-2xl px-4 py-3 text-orange-50 placeholder:text-orange-100/50 focus:ring-2 focus:ring-orange-400/50 outline-none"
                />
                <VoiceInputButton
                  language={language}
                  onTranscript={(text) => setTitle(prev => prev ? `${prev} ${text}` : text)}
                />
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-orange-100">Write freely</label>
                <VoiceInputButton
                  language={language}
                  onTranscript={(text) => setBody(prev => prev ? `${prev} ${text}` : text)}
                />
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Let your thoughts flow. Tap the microphone to speak your reflection."
                className="w-full h-40 bg-black/50 border border-orange-800/60 rounded-2xl p-4 text-orange-50 placeholder:text-orange-100/50 focus:ring-2 focus:ring-orange-400/50 outline-none"
              />
            </div>

            <button
              onClick={addEntry}
              disabled={!body.trim()}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
            >
              Save Reflection
            </button>
          </section>

          {/* Right: Weekly Assessment */}
          <section className="rounded-2xl sm:rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-4 sm:p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-orange-50">Weekly Assessment</h2>
              <span className="text-xs text-orange-100/60">Auto-updates</span>
            </div>

            <div className="rounded-2xl bg-black/40 border border-orange-500/20 p-4 space-y-3">
              <div className="text-sm text-orange-100/85">
                Most present mood: <span className="font-semibold text-orange-50">{mostCommonMood}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-orange-200/20">
                  <div className="text-xs text-orange-200/80">Positive moments</div>
                  <div className="text-2xl font-semibold text-orange-50">{positiveDays}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-orange-200/20">
                  <div className="text-xs text-orange-200/80">Tender days</div>
                  <div className="text-2xl font-semibold text-orange-50">{challengingDays}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-400/20 p-4">
              <h3 className="text-sm font-semibold text-orange-50 mb-2">KIAAN's gentle guidance</h3>
              <p className="text-sm text-orange-100/80 leading-relaxed">{assessment.headline}</p>
              <ul className="mt-3 space-y-2 text-xs text-orange-100/70">
                {assessment.guidance.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center">
              <span className="text-xs text-orange-100/50">Entries this week: {weeklyEntries.length}</span>
            </div>
          </section>
        </div>

        {/* Recent Entries */}
        <section className="rounded-2xl sm:rounded-3xl border border-orange-500/15 bg-[#0c0c10]/85 p-4 sm:p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-orange-50">Recent Reflections</h2>
            <span className="text-xs text-orange-100/60">Stored locally • Newest first</span>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-orange-100/70 text-center py-8">
              Your reflections will appear here. Begin with a thought that needs space.
            </p>
          ) : (
            <ul className="space-y-4">
              {entries.slice(0, 10).map(entry => (
                <li key={entry.id} className="rounded-2xl bg-black/50 border border-orange-800/40 p-3 sm:p-4">
                  <div className="flex items-center justify-between text-xs text-orange-100/70 mb-2">
                    <span>{new Date(entry.at).toLocaleString()}</span>
                    <span className="px-2 py-1 rounded-lg bg-orange-900/50 text-orange-100 border border-orange-700">
                      {entry.mood}
                    </span>
                  </div>
                  {entry.title && (
                    <h3 className="font-semibold text-orange-50 mb-1">{entry.title}</h3>
                  )}
                  <p className="text-sm text-orange-100 whitespace-pre-wrap leading-relaxed">{entry.body}</p>

                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => requestGuidance(entry)}
                      disabled={!!guidanceLoading[entry.id]}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/80 to-[#ffb347]/80 text-sm font-semibold text-black disabled:opacity-60 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
                    >
                      {guidanceLoading[entry.id] ? 'KIAAN is reflecting...' : "Get KIAAN's insight"}
                    </button>
                    {guidance[entry.id] && (
                      <div className="text-sm text-orange-100/90 bg-black/40 border border-orange-700/50 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex-1">{guidance[entry.id]}</span>
                          <VoiceResponseButton
                            text={guidance[entry.id]}
                            language={language}
                            size="sm"
                            variant="minimal"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
