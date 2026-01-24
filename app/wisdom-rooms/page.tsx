'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { KiaanLogo } from '@/src/components/KiaanLogo'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const defaultRooms: RoomSummary[] = [
  { id: 'grounding', slug: 'grounding', name: 'Calm Grounding', theme: 'Gentle check-ins and deep breaths' },
  { id: 'gratitude', slug: 'gratitude', name: 'Gratitude Garden', theme: 'Sharing what is going well today' },
  { id: 'courage', slug: 'courage', name: 'Courage Circle', theme: 'Encouragement for challenging moments' },
  { id: 'clarity', slug: 'clarity', name: 'Clarity Corner', theme: 'Finding mental stillness' },
  { id: 'compassion', slug: 'compassion', name: 'Compassion Cave', theme: 'Self-kindness and acceptance' }
]

type RoomSummary = {
  id: string
  slug: string
  name: string
  theme: string
  active_count?: number
}

type RoomMessage = {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
}

type Participant = {
  id: string
  label: string
}

export default function WisdomRoomsPage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [roomMessages, setRoomMessages] = useState<Record<string, RoomMessage[]>>({})
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({})
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [alert, setAlert] = useState<string | null>(null)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const token = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('access_token') || localStorage.getItem('admin_token') || ''
  }, [])

  useEffect(() => {
    async function loadRooms() {
      try {
        const response = await fetch(`${apiUrl}/api/rooms`)
        if (!response.ok) throw new Error('Unable to load rooms')
        const data = await response.json()
        setRooms(data.length ? data : defaultRooms)
        if (data.length) {
          setActiveRoomId(data[0].id)
        }
      } catch (err) {
        console.error(err)
        setRooms(defaultRooms)
        setActiveRoomId(defaultRooms[0].slug)
        setAlert('Using default rooms because the server is offline. Messages will not persist until reconnected.')
      }
    }

    loadRooms()
  }, [])

  useEffect(() => {
    if (!activeRoomId || !rooms.length) return
    const room = rooms.find(r => r.id === activeRoomId || r.slug === activeRoomId)
    if (!room || !token) {
      setStatus('disconnected')
      return
    }

    const roomId = room.id || room.slug
    setStatus('connecting')
    setAlert(null)

    const wsUrl = `${apiUrl.replace(/^http/, 'ws')}/api/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setStatus('connected')
      setAlert(null)
    }

    ws.onmessage = event => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'history') {
          setRoomMessages(prev => ({ ...prev, [roomId]: payload.messages }))
        }
        if (payload.type === 'message') {
          setRoomMessages(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), payload]
          }))
        }
        if (payload.type === 'participants') {
          setParticipants(prev => ({ ...prev, [roomId]: payload.participants }))
        }
        if (payload.type === 'error') {
          setAlert(payload.message || 'Unable to send message right now')
        }
      } catch (error) {
        console.error('Failed to parse message', error)
      }
    }

    ws.onclose = () => {
      setStatus('disconnected')
    }

    setSocket(ws)

    return () => {
      ws.close()
      setSocket(null)
    }
  }, [activeRoomId, rooms, token])

  useEffect(() => {
    if (chatContainerRef.current) {
      // Use instant scroll on mobile to prevent zoom/jank issues
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: isMobile ? 'instant' : 'smooth'
      })
    }
  }, [roomMessages, activeRoomId])

  const activeRoom = rooms.find(r => r.id === activeRoomId || r.slug === activeRoomId)
  const activeMessages = activeRoom ? roomMessages[activeRoom.id || activeRoom.slug] || [] : []
  const activeParticipants = activeRoom ? participants[activeRoom.id || activeRoom.slug] || [] : []

  async function sendMessage() {
    if (!message.trim()) return
    if (status !== 'connected' || !socket) {
      setAlert('You are not connected. Please wait while we reconnect to the room.')
      return
    }
    socket.send(JSON.stringify({ content: message.trim() }))
    setMessage('')
  }

  const participantLabel = (userId: string) => {
    if (!token) return userId
    return userId === extractUserId(token) ? 'You' : userId.slice(0, 8)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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
                  Real-time rooms with server-side moderation. Messages are stored safely so you can rejoin without losing the thread.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-orange-300'}`} />
                {status === 'connected' ? 'Live & moderated' : status === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
              <Link href="/" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                ← Back to home
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {rooms.map(room => (
            <button
              key={room.id || room.slug}
              onClick={() => { setActiveRoomId(room.id || room.slug); setAlert(null) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
                (room.id || room.slug) === activeRoomId
                  ? 'bg-gradient-to-r from-orange-400/80 via-[#ffb347]/80 to-orange-300/80 text-slate-950 border-transparent shadow-lg shadow-orange-500/25'
                  : 'bg-white/5 border-orange-400/20 text-orange-50 hover:border-orange-300/50 hover:bg-white/10'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-orange-300" />
              <span>{room.name}</span>
              <span className="text-[11px] text-orange-100/80">{room.active_count ?? 0} active</span>
            </button>
          ))}
        </div>

        <section className="rounded-3xl border border-orange-500/15 bg-[#0c0c10]/85 shadow-[0_20px_80px_rgba(255,115,39,0.14)] overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-500/15 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧘</span>
              <div>
                <h2 className="text-lg font-semibold text-orange-50">{activeRoom?.name ?? 'Choose a room'}</h2>
                <p className="text-xs text-orange-100/70">{activeRoom?.theme ?? 'Pick a room to start chatting'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] divide-y md:divide-y-0 md:divide-x divide-orange-500/15">
            {/* Chat container - disable smooth scroll on mobile to prevent jank and zoom issues */}
            <div
              className="p-4 md:p-6 space-y-4 h-[420px] overflow-y-auto md:scroll-smooth overscroll-contain"
              ref={chatContainerRef}
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              {activeMessages.length === 0 && (
                <p className="text-orange-100/70 text-sm">No messages yet. Say hello to open the conversation.</p>
              )}
              {activeMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.user_id === extractUserId(token) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                    msg.user_id === extractUserId(token)
                      ? 'bg-gradient-to-r from-orange-500/80 via-[#ff9933]/80 to-orange-400/80 text-white'
                      : 'bg-white/5 border border-orange-200/10 text-orange-50 backdrop-blur'
                  }`}>
                    <p className="font-semibold mb-1">{msg.user_id === extractUserId(token) ? 'You' : 'Participant'}</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[11px] text-orange-100/70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <aside className="p-4 md:p-6 bg-white/5">
              <h3 className="text-sm font-semibold text-orange-50 mb-2">Active participants</h3>
              <div className="space-y-2 text-sm text-orange-100/80">
                {activeParticipants.length === 0 && <p className="text-orange-100/60">No one is here yet.</p>}
                {activeParticipants.map(person => (
                  <div key={person.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    <span>{participantLabel(person.id)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {alert && <p className="text-xs text-orange-200">{alert}</p>}

        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={token ? 'Share something helpful for the room...' : 'Sign in to start sharing'}
            disabled={!token}
            className="flex-1 w-full px-4 py-3 bg-black/60 border border-orange-500/40 rounded-xl focus:ring-2 focus:ring-orange-400/70 outline-none placeholder:text-orange-100/70 text-orange-50 disabled:opacity-70"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || !token || status !== 'connected'}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 font-semibold disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-orange-500/20 w-full sm:w-auto"
          >
            {status === 'connected' ? 'Share warmly' : 'Connecting...'}
          </button>
        </div>
      </div>
    </main>
  )
}

function extractUserId(token: string): string {
  if (!token) return ''
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload))
    return decoded.sub || ''
  } catch {
    return ''
  }
}
