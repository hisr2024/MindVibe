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
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-4 py-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            🕉️ MindVibe
          </h1>
          <p className="text-2xl text-zinc-400">AI-Powered Mental Wellness & Ancient Wisdom</p>
          <p className="text-zinc-500">Your journey to peace begins here</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <FeatureCard
            icon="🧘‍♂️"
            title="Daily Meditation"
            description="Guided meditation sessions tailored to your mental state"
          />
          <FeatureCard
            icon="📊"
            title="Mood Tracking"
            description="Track your emotional wellness journey with AI insights"
          />
          <FeatureCard
            icon="🎯"
            title="Goal Setting"
            description="Set and achieve your mental wellness goals"
          />
          <FeatureCard
            icon="📚"
            title="Gita Wisdom"
            description="Ancient wisdom from Bhagavad Gita for modern life"
          />
        </div>

        <AIChat />
        <GitaWisdom />
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-all">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

function AIChat() {
  const [messages, setMessages] = useLocalState<{role: 'user' | 'assistant', content: string}[]>('mindvibe_chat', [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return
    
    const userMessage = { role: 'user' as const, content: input }
    setMessages([...messages, userMessage])
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
        setMessages([...messages, userMessage, { role: 'assistant', content: data.response }])
      } else {
        setMessages([...messages, userMessage, { 
          role: 'assistant', 
          content: '❌ Unable to connect to AI backend. Please check your backend deployment.' 
        }])
      }
    } catch {
      setMessages([...messages, userMessage, { 
        role: 'assistant', 
        content: '💡 AI backend not connected. This feature requires the backend API to be running.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <h2 className="text-2xl font-semibold">🤖 AI Mental Health Guide</h2>
      <p className="text-zinc-400">Get compassionate AI-powered guidance for your mental health journey</p>

      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 h-96 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 py-20">
            <p className="text-4xl mb-4">💭</p>
            <p>Start a conversation with your AI guide</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                : 'bg-zinc-700 text-zinc-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-700 px-4 py-3 rounded-2xl">
              <span className="animate-pulse">Thinking...</span>
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
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
        >
          Send
        </button>
      </div>
    </section>
  )
}

function GitaWisdom() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function searchWisdom() {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/gita/wisdom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: 'english' })
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data)
      } else {
        setResponse({ error: 'Unable to fetch wisdom. Backend may not be running.' })
      }
    } catch {
      setResponse({ error: 'Connection failed. Please ensure backend is running.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <h2 className="text-2xl font-semibold">📿 Bhagavad Gita Wisdom</h2>
      <p className="text-zinc-400">Get ancient wisdom for your modern life challenges</p>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Ask for wisdom... (e.g., How to deal with stress?)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && searchWisdom()}
          className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <button
          onClick={searchWisdom}
          disabled={!query.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {response && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-4">
          {response.error ? (
            <p className="text-red-400">{response.error}</p>
          ) : (
            <>
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-zinc-200">{response.guidance}</div>
              </div>
              
              {response.verses && response.verses.length > 0 && (
                <div className="border-t border-zinc-700 pt-4 space-y-3">
                  <h3 className="text-lg font-semibold text-purple-400">📚 Referenced Verses:</h3>
                  {response.verses.map((verse: any, i: number) => (
                    <div key={i} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700">
                      <p className="text-sm text-purple-400 font-semibold mb-2">
                        Bhagavad Gita {verse.verse_id} - {verse.theme}
                      </p>
                      <p className="text-zinc-300 italic">{verse.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
