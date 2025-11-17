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