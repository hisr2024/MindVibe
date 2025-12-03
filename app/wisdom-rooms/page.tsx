'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { KiaanLogo } from '@/src/components/KiaanLogo'

type RoomMessage = {
  room: string
  content: string
  at: string
  author: 'You' | 'Guide'
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

const rooms = [
  { id: 'grounding', name: 'Calm Grounding', theme: 'Gentle check-ins and deep breaths', emoji: '🧘' },
  { id: 'gratitude', name: 'Gratitude Garden', theme: 'Sharing what is going well today', emoji: '🌿' },
  { id: 'courage', name: 'Courage Circle', theme: 'Encouragement for challenging moments', emoji: '💪' },
  { id: 'clarity', name: 'Clarity Corner', theme: 'Finding mental stillness', emoji: '✨' },
  { id: 'compassion', name: 'Compassion Cave', theme: 'Self-kindness and acceptance', emoji: '💙' },
]

const prohibited = [
  /\b(?:fuck|shit|bitch|bastard|asshole|dick|cunt)\b/i,
  /\b(?:damn|hell)\b/i,
  /\b(?:idiot|stupid|dumb)\b/i,
  /\b(?:hate|kill|harm)\b/i,
]

function isRespectful(text: string) {
  const normalized = text.trim().toLowerCase()
  return normalized.length > 0 && !prohibited.some(pattern => pattern.test(normalized))
}

export default function WisdomRoomsPage() {
  const [activeRoom, setActiveRoom] = useState(rooms[0].id)
  const [message, setMessage] = useState('')
  const [alert, setAlert] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useLocalState<RoomMessage[]>('kiaan_wisdom_rooms', [
    {
      room: 'grounding',
      content: 'Welcome to Calm Grounding. Breathe slowly and keep your words kind—this circle is for encouragement only.',
      at: new Date().toISOString(),
      author: 'Guide'
    },
    {
      room: 'gratitude',
      content: 'Welcome to the Gratitude Garden. Share what brought you peace or joy today.',
      at: new Date().toISOString(),
      author: 'Guide'
    },
    {
      room: 'courage',
      content: 'Welcome to the Courage Circle. Share your challenges and receive encouragement.',
      at: new Date().toISOString(),
      author: 'Guide'
    },
    {
      room: 'clarity',
      content: 'Welcome to Clarity Corner. A space for mental stillness and clear thinking.',
      at: new Date().toISOString(),
      author: 'Guide'
    },
    {
      room: 'compassion',
      content: 'Welcome to the Compassion Cave. Practice self-kindness and acceptance here.',
      at: new Date().toISOString(),
      author: 'Guide'
    }
  ])

  const activeMessages = messages.filter(m => m.room === activeRoom)
  const activeRoomData = rooms.find(r => r.id === activeRoom)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [activeMessages.length])

  function sendRoomMessage() {
    if (!isRespectful(message)) {
      setAlert('Please keep the exchange kind and free of harmful language. Your message was not sent.')
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
      content: `Thank you for sharing. ${activeRoomData?.theme ?? 'Stay kind to one another.'}`,
      at: new Date().toISOString(),
      author: 'Guide'
    }

    setMessages([...messages, entry, supportiveReply])
    setMessage('')
    setAlert(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <KiaanLogo size="md" className="shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Community Space</p>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                  Wisdom Chat Rooms
                </h1>
                <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                  Move seamlessly between calm rooms. Kindness-first moderation keeps every exchange supportive.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Kindness-first moderation
              </span>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        {/* Room Selection Pills */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => { setActiveRoom(room.id); setAlert(null) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
                activeRoom === room.id
                  ? 'bg-gradient-to-r from-orange-400/80 via-[#ffb347]/80 to-orange-300/80 text-slate-950 border-transparent shadow-lg shadow-orange-500/25'
                  : 'bg-white/5 border-orange-400/20 text-orange-50 hover:border-orange-300/50 hover:bg-white/10'
              }`}
            >
              <span>{room.emoji}</span>
              <span>{room.name}</span>
            </button>
          ))}
        </div>

        {/* Chat Container */}
        <section className="rounded-3xl border border-orange-500/15 bg-[#0c0c10]/85 shadow-[0_20px_80px_rgba(255,115,39,0.14)] overflow-hidden">
          {/* Room Info Banner */}
          <div className="px-6 py-4 border-b border-orange-500/15 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeRoomData?.emoji}</span>
              <div>
                <h2 className="text-lg font-semibold text-orange-50">{activeRoomData?.name}</h2>
                <p className="text-xs text-orange-100/70">{activeRoomData?.theme}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="p-4 md:p-6 space-y-4 h-[400px] md:h-[500px] overflow-y-auto scroll-smooth"
          >
            {activeMessages.map((msg, index) => (
              <div
                key={`${msg.at}-${index}`}
                className={`flex ${msg.author === 'You' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                    msg.author === 'You'
                      ? 'bg-gradient-to-r from-orange-500/80 via-[#ff9933]/80 to-orange-400/80 text-white'
                      : 'bg-white/5 border border-orange-200/15 text-orange-50'
                  }`}
                >
                  <p className="font-semibold text-xs mb-1 opacity-80">
                    {msg.author === 'You' ? 'You' : 'Community Guide'}
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] opacity-60 mt-2">{new Date(msg.at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alert */}
          {alert && (
            <div className="mx-4 mb-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-400/30 text-sm text-red-200">
              {alert}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-orange-500/15 bg-black/30">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendRoomMessage()}
                placeholder="Share warmly..."
                className="flex-1 px-4 py-3 bg-black/50 border border-orange-500/30 rounded-2xl focus:ring-2 focus:ring-orange-400/50 outline-none placeholder:text-orange-100/50 text-orange-50 text-sm"
                aria-label="Share warmly"
              />
              <button
                onClick={sendRoomMessage}
                disabled={!message.trim()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 font-semibold text-slate-950 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
              >
                Share warmly
              </button>
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="rounded-2xl border border-orange-500/15 bg-black/30 p-4 md:p-6">
          <h3 className="text-sm font-semibold text-orange-50 mb-3">Community Guidelines</h3>
          <ul className="grid md:grid-cols-3 gap-3 text-xs text-orange-100/80">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Keep words kind and supportive</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Listen with compassion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Share from a place of growth</span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
