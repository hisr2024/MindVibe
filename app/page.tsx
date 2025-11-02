'use client'

import { useEffect, useRef, useState } from 'react'

// Utility functions for encrypted journal
function useLocalState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {} 
    }
  }, [key, val]);
  return [val, setVal] as const;
}

async function deriveKey(passphrase: string, salt: BufferSource) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
}

const b64 = (a: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(a)));
const ub64 = (s: string) => new Uint8Array(atob(s).split('').map(c=>c.charCodeAt(0)));

async function encryptText(plain: string, passphrase: string) { 
  const salt = crypto.getRandomValues(new Uint8Array(16)); 
  const iv = crypto.getRandomValues(new Uint8Array(12)); 
  const key = await deriveKey(passphrase, salt); 
  const ct = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, new TextEncoder().encode(plain)); 
  return { s: b64(salt), i: b64(iv), c: b64(ct) } 
}

async function decryptText(blob:{s:string,i:string,c:string}, passphrase:string) { 
  const salt = ub64(blob.s), iv = ub64(blob.i), ct = ub64(blob.c); 
  const key = await deriveKey(passphrase, salt); 
  const pt = await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, ct); 
  return new TextDecoder().decode(pt) 
}

// Main component
export default function MindVibePage() {
  const [activeTab, setActiveTab] = useState<'breathing' | 'journal' | 'mood' | 'chat'>('breathing')

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MindVibe 🧠✨
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Your Privacy-First Mental Health Companion</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'breathing' as const, label: '🫁 Breathing', icon: '🧘' },
            { id: 'journal' as const, label: '📝 Journal', icon: '🔒' },
            { id: 'mood' as const, label: '😊 Mood', icon: '📊' },
            { id: 'chat' as const, label: '💬 Chat', icon: '🤖' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {activeTab === 'breathing' && <BreathingExercise />}
        {activeTab === 'journal' && <EncryptedJournal />}
        {activeTab === 'mood' && <MoodTracker />}
        {activeTab === 'chat' && <AIChat />}
      </main>
    </div>
  )
}

// Breathing Exercise Component
function BreathingExercise() {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle')
  const [isRunning, setIsRunning] = useState(false)
  const ringRef = useRef<HTMLDivElement>(null)
  
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  
  useEffect(() => {
    const el = ringRef.current
    if (!el) return
    
    el.style.transition = 'all 1s ease-in-out'
    el.style.transform =
      phase === 'inhale'
        ? 'scale(1.3)'
        : phase === 'exhale'
        ? 'scale(0.8)'
        : 'scale(1)'
  }, [phase])
  
  async function run() {
    setIsRunning(true)
    for (let i = 0; i < 4; i++) {
      setPhase('inhale')
      await sleep(4000)
      setPhase('hold')
      await sleep(7000)
      setPhase('exhale')
      await sleep(8000)
    }
    setPhase('idle')
    setIsRunning(false)
  }
  
  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
      <h2 className="text-2xl font-semibold mb-6">SOS Breathing Exercise</h2>
      <p className="text-zinc-400 mb-8">Follow the circle. Inhale (4s) → Hold (7s) → Exhale (8s)</p>
      
      <div className="flex flex-col items-center">
        <div
          ref={ringRef}
          className="rounded-full w-64 h-64 border-8 border-blue-500 shadow-lg shadow-blue-500/50 mb-8"
          style={{ 
            background: phase === 'inhale' ? 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)' : 
                       phase === 'exhale' ? 'radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)' : 
                       'transparent'
          }}
        />
        
        <p className="text-3xl font-bold mb-6 h-12">
          {phase === 'idle' ? '🧘 Ready' : 
           phase === 'inhale' ? '😮‍💨 Inhale' : 
           phase === 'hold' ? '🫁 Hold' : 
           '😌 Exhale'}
        </p>
        
        <button
          onClick={run}
          disabled={isRunning}
          className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
            isRunning 
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50'
          }`}
        >
          {isRunning ? 'Breathing...' : 'Start Exercise'}
        </button>
      </div>
    </section>
  )
}

// Encrypted Journal Component
function EncryptedJournal() {
  const [pass, setPass] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cipherList, setCipherList] = useLocalState<any[]>('mindvibe_journal_cipher', [])
  const [entries, setEntries] = useState<any[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function addEntry() {
    if (!pass || !body.trim()) return
    const payload = JSON.stringify({ title, body, at: new Date().toISOString() })
    const blob = await encryptText(payload, pass)
    setCipherList([blob, ...cipherList])
    setTitle('')
    setBody('')
  }

  async function tryDecryptAll() {
    if (!pass) return setEntries(null)
    try {
      const out: any[] = []
      for (const b of cipherList) out.push(JSON.parse(await decryptText(b, pass)))
      setEntries(out)
    } catch {
      setEntries(null)
      alert('Wrong passphrase or corrupted data')
    }
  }

  function exportFile() {
    const data = JSON.stringify({ version: 1, entries: cipherList })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `mindvibe-journal-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const obj = JSON.parse(String(r.result || '{}'))
        if (obj.entries) setCipherList(obj.entries)
      } catch {
        alert('Invalid file')
      }
    }
    r.readAsText(f)
  }

  useEffect(() => {
    tryDecryptAll()
  }, [pass, cipherList])

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <h2 className="text-2xl font-semibold">🔒 Encrypted Journal</h2>
      <p className="text-zinc-400">Your thoughts are encrypted client-side. No one can read them without your passphrase.</p>

      <div className="space-y-4">
        <input
          type="password"
          placeholder="Enter passphrase"
          value={pass}
          onChange={e => setPass(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="text"
          placeholder="Entry title (optional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <textarea
          placeholder="Write your thoughts..."
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={addEntry}
            disabled={!pass || !body.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
          >
            💾 Save Entry
          </button>
          <button onClick={exportFile} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all">
            📤 Export
          </button>
          <button onClick={() => fileRef.current?.click()} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all">
            📥 Import
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={importFile} className="hidden" />
        </div>
      </div>

      {entries && entries.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">📖 Your Entries ({entries.length})</h3>
          {entries.map((e, i) => (
            <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6">
              {e.title && <h4 className="font-semibold text-lg mb-2">{e.title}</h4>}
              <p className="text-zinc-300 whitespace-pre-wrap">{e.body}</p>
              <p className="text-zinc-500 text-sm mt-3">{new Date(e.at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// Mood Tracker Component
function MoodTracker() {
  const [moods, setMoods] = useLocalState<{score: number, note: string, date: string}[]>('mindvibe_moods', [])
  const [currentMood, setCurrentMood] = useState(3)
  const [note, setNote] = useState('')

  function saveMood() {
    setMoods([{ score: currentMood, note, date: new Date().toISOString() }, ...moods])
    setNote('')
  }

  const moodEmojis = ['😢', '😟', '😐', '🙂', '😊']
  const moodLabels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great']

  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <h2 className="text-2xl font-semibold">😊 Mood Tracker</h2>
      <p className="text-zinc-400">Track your emotional journey over time</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3">How are you feeling?</label>
          <div className="flex justify-between items-center gap-4">
            {moodEmojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setCurrentMood(i)}
                className={`flex-1 py-6 rounded-2xl text-4xl transition-all ${
                  currentMood === i
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 scale-110 shadow-lg shadow-blue-500/50'
                    : 'bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="text-center mt-3 text-lg font-semibold">{moodLabels[currentMood]}</p>
        </div>

        <textarea
          placeholder="Any thoughts? (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />

        <button
          onClick={saveMood}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/50"
        >
          💾 Save Mood
        </button>
      </div>

      {moods.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">📊 Mood History</h3>
          <div className="grid gap-3">
            {moods.slice(0, 10).map((m, i) => (
              <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 flex items-center gap-4">
                <span className="text-3xl">{moodEmojis[m.score]}</span>
                <div className="flex-1">
                  <p className="font-medium">{moodLabels[m.score]}</p>
                  {m.note && <p className="text-zinc-400 text-sm mt-1">{m.note}</p>}
                  <p className="text-zinc-500 text-xs mt-1">{new Date(m.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// AI Chat Component
function AIChat() {
  const [messages, setMessages] = useLocalState<{role: 'user' | 'assistant', content: string}[]>('mindvibe_chat', [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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
    } catch (error) {
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
