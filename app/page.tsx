'use client'
import { useState, useEffect, useRef } from 'react'

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
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-3 py-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🕉️ KIAAN
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 font-light">Your AI Guide to Inner Peace</p>
          <p className="text-sm text-zinc-500">Ancient Wisdom for Modern Life • Powered by 700+ Timeless Teachings</p>
        </header>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-2xl p-4 text-center">
          <p className="text-sm text-blue-200">🔒 All conversations are private and confidential • Your journey, your space</p>
        </div>

        <KIAANChat />
        <QuickHelp />
        <DailyWisdom />
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
    <section className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border border-zinc-700 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-4xl">💬</div>
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Talk to KIAAN</h2>
          <p className="text-sm text-zinc-400">Powered by ancient wisdom and modern AI</p>
        </div>
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 md:p-6 h-[400px] md:h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 py-20 md:py-32">
            <p className="text-6xl mb-4">🕉️</p>
            <p className="text-xl mb-2">How can I guide you today?</p>
            <p className="text-sm text-zinc-600">Share what\'s on your mind</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}> 
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'bg-gradient-to-r from-zinc-700 to-zinc-600 text-zinc-100 shadow-md' 
            }`}> 
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-700 px-4 py-3 rounded-2xl">
              <span className="animate-pulse">KIAAN is reflecting...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-semibold transition-all"
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
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-300">🎯 Quick Help</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Type"]') as HTMLInputElement
              if (input) { input.value = s.query; input.focus() }
            }}
            className="bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all text-left group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{s.emoji}</div>
            <div className="text-sm text-zinc-300">{s.label}</div>
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
    <section className="bg-gradient-to-r from-orange-900/30 to-yellow-900/20 border border-orange-800/50 rounded-3xl p-6 md:p-8">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <span className="text-3xl">💎</span>
          <h2 className="text-xl font-semibold text-orange-200">Today's Wisdom</h2>
        </div>
        <div className="text-sm text-orange-400">{new Date().toLocaleDateString()}</div>
      </div>
      
      <blockquote className="text-lg text-zinc-100 mb-4 italic leading-relaxed">
        "{wisdom.text}"
      </blockquote>
      
      <p className="text-sm text-orange-300 mb-4">✨ Principle: {wisdom.principle}</p>
      
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-orange-600/50 hover:bg-orange-600 rounded-lg text-sm">💬 Chat about this</button>
        <button onClick={() => setSaved(!saved)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">
          {saved ? '⭐ Saved' : '☆ Save'}
        </button>
        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">📤 Share</button>
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
  const [entries, setEntries] = useLocalState<JournalEntry[]>('kiaan_journal_entries', [])

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
      <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/20 border border-emerald-800/40 rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-emerald-200">Private Journal</p>
            <h2 className="text-2xl font-semibold text-emerald-100">Sacred Reflections</h2>
            <p className="text-sm text-emerald-200/80">Entries stay on your device and refresh the weekly guidance automatically.</p>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-100 px-4 py-2 rounded-2xl text-sm">
            Weekly entries: {weeklyEntries.length}
          </div>
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

          <div className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-100">Weekly Assessment</h3>
              <div className="text-xs text-emerald-200">Updated automatically</div>
            </div>
            <p className="text-sm text-emerald-200/90">Most present mood: <span className="font-semibold text-emerald-100">{mostCommonMood}</span></p>
            <div className="grid grid-cols-2 gap-2 text-sm text-emerald-200/90">
              <div className="bg-emerald-900/70 rounded-xl p-3 border border-emerald-800">
                <div className="text-xs text-emerald-300/80">Positive moments logged</div>
                <div className="text-xl font-semibold text-emerald-100">{positiveDays}</div>
              </div>
              <div className="bg-emerald-900/70 rounded-xl p-3 border border-emerald-800">
                <div className="text-xs text-emerald-300/80">Tender/Challenging days</div>
                <div className="text-xl font-semibold text-emerald-100">{challengingDays}</div>
              </div>
            </div>
            <div className="bg-emerald-900/50 rounded-xl p-3 border border-emerald-800/80">
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