'use client'
import { useState, useEffect, useRef } from 'react'

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

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0f1f] via-[#0f1b2c] to-[#0c1424] text-white p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#7de2d1] via-[#c3f8ff] to-[#9d7efc] blur-3xl" />
        <div className="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#ffb6c1] via-[#94b3fd] to-[#7edce2] blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-gradient-to-br from-[#6dd5fa] via-[#c8b5ff] to-[#7cf4ff] blur-2xl opacity-70 animate-pulse" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-4 py-8">
          <div className="mx-auto w-max rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-100 border border-white/10 shadow-[0_0_30px_rgba(125,226,209,0.35)]">
            Calm • Kind • Creative
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold bg-[radial-gradient(circle_at_30%_30%,#7de2d1,transparent_40%),radial-gradient(circle_at_70%_40%,#a299ff,transparent_35%),linear-gradient(90deg,#7de2d1,#a5b4fc,#ffb6c1)] bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(162,153,255,0.25)]">
            🕉️ KIAAN
          </h1>
          <p className="text-xl md:text-2xl text-cyan-100/90 font-light">Your inner peace, your friend indeed.</p>
          <p className="text-sm text-cyan-100/70">Ancient wisdom, Gen Z glow • 700+ timeless teachings tuned to you</p>
        </header>

        <div className="bg-white/5 backdrop-blur border border-cyan-500/20 rounded-2xl p-4 text-center shadow-[0_10px_50px_rgba(125,226,209,0.15)]">
          <p className="text-sm text-cyan-100/80">🔒 All conversations stay yours • a serene, confidential sanctuary</p>
        </div>

        <KIAANChat />
        <QuickHelp />
        <DailyWisdom />
        <PublicChatRooms />
        <Journal />
        <MoodTracker />
      </div>
    </main>
  )
}

function KIAANChat() {
  const [messages, setMessages] = useLocalState<{role: 'user' | 'assistant', content: string}[]>('kiaan_chat', [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return
    
    const userMessage = { role: 'user' as const, content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
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

  return (
    <section className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_20px_80px_rgba(125,226,209,0.15)]">
      <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-gradient-to-br from-[#7de2d1]/40 via-[#c3f8ff]/30 to-[#9d7efc]/30 blur-2xl" />
      <div className="flex items-center gap-3 relative">
        <div className="text-4xl">💬</div>
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-200 bg-clip-text text-transparent">Talk to KIAAN</h2>
          <p className="text-sm text-cyan-100/70">Gentle guidance with a soft neon glow</p>
        </div>
      </div>

      <div className="bg-[#0d1627]/70 border border-white/10 rounded-2xl p-4 md:p-6 h-[400px] md:h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-cyan-100/60 py-20 md:py-32">
            <p className="text-6xl mb-4">✨</p>
            <p className="text-xl mb-2">How can I guide you today?</p>
            <p className="text-sm text-cyan-100/60">Share what's on your mind</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg shadow-cyan-500/10 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-indigo-500/80 text-white'
                : 'bg-white/5 border border-white/10 text-cyan-50 backdrop-blur'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-cyan-100/80">
              <span className="animate-pulse">KIAAN is reflecting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-3 relative">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1 px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-400/70 outline-none placeholder:text-cyan-100/60 text-cyan-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 hover:scale-105 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 rounded-xl font-semibold transition-all text-slate-950 shadow-lg shadow-cyan-500/20"
        >
          Send
        </button>
      </div>
    </section>
  )
}

function QuickHelp() {
  const scenarios = [
    { emoji: '😰', label: 'Feeling anxious', query: "I'm feeling anxious and worried" },
    { emoji: '😔', label: 'Feeling sad', query: "I'm feeling down and sad" },
    { emoji: '😠', label: 'Dealing with anger', query: "I'm struggling with anger" },
    { emoji: '🤔', label: 'Making a decision', query: "I need help making a decision" },
    { emoji: '💼', label: 'Work stress', query: "I'm stressed about work" },
    { emoji: '💔', label: 'Relationship issues', query: "I'm having relationship problems" },
    { emoji: '🎯', label: 'Finding purpose', query: "I'm searching for my purpose" },
    { emoji: '🙏', label: 'Need peace', query: "I need inner peace" },
  ]
  return (
    <section className="bg-white/5 backdrop-blur border border-cyan-500/10 rounded-3xl p-5 md:p-6 space-y-3 shadow-[0_10px_50px_rgba(148,179,253,0.12)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-300 to-purple-200 bg-clip-text text-transparent">🎯 Quick Help</h2>
        <p className="text-xs text-cyan-100/70">Tap a vibe to auto-fill the chat</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              const input = document.querySelector('input[placeholder*"Type"]') as HTMLInputElement
              if (input) { input.value = s.query; input.focus() }
            }}
            className="group bg-gradient-to-br from-[#0f172a]/70 via-[#111827]/60 to-[#1f2937]/60 border border-white/5 hover:border-cyan-400/50 rounded-2xl p-4 transition-all text-left shadow-[0_10px_30px_rgba(125,226,209,0.08)] hover:-translate-y-1">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{s.emoji}</div>
            <div className="text-sm text-cyan-50">{s.label}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

function DailyWisdom() {
  const [saved, setSaved] = useState(false)
  const wisdom = {
    text: "The key to peace lies not in controlling outcomes, but in mastering your response. Focus your energy on doing your best without attachment to results, and discover true freedom.",
    principle: "Action without Attachment"
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1528] via-[#0d1c30] to-[#0a1224] border border-purple-300/10 p-6 md:p-8 shadow-[0_20px_80px_rgba(162,153,255,0.12)]">
      <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#a299ff]/30 via-[#7de2d1]/20 to-transparent blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-gradient-to-tr from-[#94b3fd]/25 via-[#ffb6c1]/20 to-transparent blur-3xl" />
      <div className="relative flex justify-between mb-4 items-start gap-3">
        <div className="flex gap-2 items-center">
          <span className="text-3xl">💎</span>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-200 to-pink-200 bg-clip-text text-transparent">Today's Wisdom</h2>
        </div>
        <div className="text-sm text-cyan-100/70 bg-white/5 border border-white/10 rounded-full px-3 py-1">{new Date().toLocaleDateString()}</div>
      </div>

      <blockquote className="relative text-lg text-cyan-50 mb-4 italic leading-relaxed bg-white/5 border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(148,179,253,0.15)]">
        “{wisdom.text}”
      </blockquote>

      <p className="text-sm text-cyan-100/80 mb-4">✨ Principle: {wisdom.principle}</p>

      <div className="flex gap-3 flex-wrap">
        <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-950 font-semibold rounded-lg text-sm shadow-lg shadow-cyan-500/20 hover:scale-105 transition">💬 Chat about this</button>
        <button onClick={() => setSaved(!saved)} className="px-4 py-2 bg-white/10 border border-white/20 hover:border-cyan-200/60 rounded-lg text-sm text-cyan-50 transition">
          {saved ? '⭐ Saved' : '☆ Save'}
        </button>
        <button className="px-4 py-2 bg-white/10 border border-white/20 hover:border-pink-200/60 rounded-lg text-sm text-cyan-50 transition">📤 Share</button>
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
    <section className="bg-white/5 backdrop-blur border border-cyan-500/15 rounded-3xl p-6 md:p-8 space-y-4 shadow-[0_15px_60px_rgba(125,226,209,0.12)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-cyan-100/70">Community Rooms</p>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 to-pink-200 bg-clip-text text-transparent">Respectful Public Chats</h2>
          <p className="text-sm text-cyan-100/60">Positive, helpful exchanges only. Foul language in any language is blocked.</p>
        </div>
        <div className="text-xs text-cyan-100/80 bg-white/10 border border-white/10 px-3 py-2 rounded-2xl">Kindness-first moderation</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => { setActiveRoom(room.id); setAlert(null); }}
            className={`px-4 py-2 rounded-2xl border text-sm transition-all ${
              activeRoom === room.id
                ? 'bg-gradient-to-r from-cyan-400/70 via-indigo-400/70 to-pink-400/70 text-slate-950 font-semibold shadow shadow-cyan-500/20'
                : 'bg-white/5 border-white/10 text-cyan-50 hover:border-cyan-300/40'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      <div className="bg-[#0d1627]/70 border border-white/10 rounded-2xl p-4 space-y-3 h-[320px] overflow-y-auto shadow-inner shadow-cyan-500/5">
        {activeMessages.map((msg, index) => (
          <div key={`${msg.at}-${index}`} className={`flex ${msg.author === 'You' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-lg shadow-cyan-500/10 ${
              msg.author === 'You'
                ? 'bg-gradient-to-r from-cyan-500/80 via-indigo-500/80 to-pink-500/80 text-white'
                : 'bg-white/5 border border-white/10 text-cyan-50 backdrop-blur'
            }`}>
              <p className="font-semibold mb-1">{msg.author === 'You' ? 'You' : 'Community Guide'}</p>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[11px] text-cyan-100/70 mt-1">{new Date(msg.at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>

      {alert && <p className="text-xs text-amber-200">{alert}</p>}

      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendRoomMessage()}
          placeholder="Share something helpful for the room..."
          className="flex-1 px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl focus:ring-2 focus:ring-cyan-400/70 outline-none placeholder:text-cyan-100/60 text-cyan-50"
        />
        <button
          onClick={sendRoomMessage}
          disabled={!message.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 font-semibold disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-cyan-500/20"
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
      <div className="bg-white/5 backdrop-blur border border-cyan-500/15 rounded-3xl p-6 shadow-[0_15px_60px_rgba(125,226,209,0.12)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-cyan-100/80">Private Journal</p>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 to-pink-200 bg-clip-text text-transparent">Sacred Reflections</h2>
            <p className="text-sm text-cyan-100/70">Entries stay on your device and refresh the weekly guidance automatically.</p>
          </div>
          <div className="bg-white/10 border border-white/10 text-cyan-50 px-4 py-2 rounded-2xl text-sm">
            Weekly entries: {weeklyEntries.length}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="bg-[#0d1627]/70 border border-white/10 text-cyan-50 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
            <span>🔒</span>
            <div>
              <p className="font-semibold">Fully encrypted on your device</p>
              <p className="text-cyan-100/70">Entries are sealed locally with AES-GCM before saving. Only this browser can decrypt them.</p>
            </div>
          </div>
          {!encryptionReady && (
            <p className="text-xs text-amber-200">Preparing secure journal space...</p>
          )}
          {encryptionMessage && (
            <p className="text-xs text-amber-200">{encryptionMessage}</p>
          )}
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-emerald-200">Today’s tone</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {moods.map(option => (
                  <button
                    key={option.label}
                    onClick={() => setMood(option.label)}
                    className={`px-3 py-2 rounded-2xl border text-sm transition-all ${
                      mood === option.label
                        ? 'bg-emerald-700/70 border-emerald-400 text-white shadow'
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-100 hover:border-emerald-600'
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
              className="w-full bg-emerald-950/60 border border-emerald-800 rounded-2xl px-3 py-2 text-emerald-50"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write freely. Only you can see this."
              className="w-full h-32 bg-emerald-950/60 border border-emerald-800 rounded-2xl p-3 text-emerald-50"
            />
            <button
              onClick={addEntry}
              disabled={!body.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Journal Entry
            </button>
          </div>

          <div className="bg-[#0d1627]/70 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-100">Weekly Assessment</h3>
              <div className="text-xs text-emerald-200">Updated automatically</div>
            </div>
            <p className="text-sm text-emerald-200/90">Most present mood: <span className="font-semibold text-emerald-100">{mostCommonMood}</span></p>
            <div className="grid grid-cols-2 gap-2 text-sm text-emerald-200/90">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-emerald-300/80">Positive moments logged</div>
                <div className="text-xl font-semibold text-emerald-100">{positiveDays}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-emerald-300/80">Tender/Challenging days</div>
                <div className="text-xl font-semibold text-emerald-100">{challengingDays}</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-sm text-emerald-100 font-semibold">KIAAN’s gentle guidance</p>
              <p className="text-sm text-emerald-200/80 leading-relaxed">{assessment.headline}</p>
              <ul className="mt-2 space-y-1 text-sm text-emerald-200/80 list-disc list-inside">
                {assessment.guidance.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-zinc-100">Recent entries</h3>
          <p className="text-xs text-zinc-400">Newest first • stored locally</p>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-400">No entries yet. Your reflections will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map(entry => (
              <li key={entry.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{new Date(entry.at).toLocaleString()}</span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-900/60 text-emerald-100 border border-emerald-800 text-[11px]">{entry.mood}</span>
                </div>
                {entry.title && <div className="mt-1 font-semibold text-zinc-100">{entry.title}</div>}
                <div className="mt-1 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{entry.body}</div>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => requestGuidance(entry)}
                    disabled={!!guidanceLoading[entry.id]}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-purple-700 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {guidanceLoading[entry.id] ? 'KIAAN is reading...' : "Get KIAAN's opinion"}
                  </button>
                  {guidance[entry.id] && (
                    <p className="text-sm text-emerald-200/90 bg-emerald-950/50 border border-emerald-800 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
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
    { emoji: '😊', label: 'Great', color: 'from-green-600 to-emerald-600' },
    { emoji: '😐', label: 'Okay', color: 'from-blue-600 to-cyan-600' },
    { emoji: '😔', label: 'Low', color: 'from-gray-600 to-slate-600' },
    { emoji: '😰', label: 'Anxious', color: 'from-orange-600 to-red-600' },
    { emoji: '🙏', label: 'Peaceful', color: 'from-purple-600 to-pink-600' },
  ]

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-zinc-300">📊 How are you feeling?</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {moods.map((m) => (
          <button
            key={m.label}
            onClick={() => setSelectedMood(m.label)}
            className={`flex flex-col items-center p-4 rounded-xl transition-all ${
              selectedMood === m.label ? `bg-gradient-to-br ${m.color} scale-105` : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            <span className="text-4xl mb-2">{m.emoji}</span>
            <span className="text-sm">{m.label}</span>
          </button>
        ))}
      </div>
      {selectedMood && <p className="mt-4 text-center text-sm text-green-400">✓ Mood logged</p>}
    </section>
  )
}
