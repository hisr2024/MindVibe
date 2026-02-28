'use client'

/**
 * Mobile Wisdom Chat Rooms Page
 *
 * Real-time community chat rooms on mobile:
 * - Room tabs with swipe navigation
 * - WebSocket-powered live messaging
 * - Participant count and status indicator
 * - Touch-optimized message bubbles
 * - Offline graceful degradation
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Send,
  Users,
  MessageCircle,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const DEFAULT_ROOMS: RoomSummary[] = [
  { id: 'grounding', slug: 'grounding', name: 'Calm Grounding', theme: 'Deep breaths & check-ins' },
  { id: 'gratitude', slug: 'gratitude', name: 'Gratitude Garden', theme: 'Share what is going well' },
  { id: 'courage', slug: 'courage', name: 'Courage Circle', theme: 'Encouragement & support' },
  { id: 'clarity', slug: 'clarity', name: 'Clarity Corner', theme: 'Finding inner stillness' },
  { id: 'compassion', slug: 'compassion', name: 'Compassion Cave', theme: 'Self-kindness & acceptance' },
]

interface RoomSummary {
  id: string
  slug: string
  name: string
  theme: string
  active_count?: number
}

interface RoomMessage {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
}

interface Participant {
  id: string
  label: string
}

export default function MobileWisdomRoomsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [roomMessages, setRoomMessages] = useState<Record<string, RoomMessage[]>>({})
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({})
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [alert, setAlert] = useState<string | null>(null)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showParticipants, setShowParticipants] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch current user
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await apiFetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUserId(data.id || data.user_id || '')
        }
      } catch {
        // Not authenticated
      }
    }
    fetchCurrentUser()
  }, [])

  // Load rooms
  useEffect(() => {
    if (!isAuthenticated) {
      setRooms(DEFAULT_ROOMS)
      setActiveRoomId(DEFAULT_ROOMS[0].slug)
      return
    }

    async function loadRooms() {
      try {
        const response = await apiFetch('/api/rooms')
        if (!response.ok) throw new Error('Failed')
        const data = await response.json()
        setRooms(data.length ? data : DEFAULT_ROOMS)
        if (data.length) setActiveRoomId(data[0].id)
        else setActiveRoomId(DEFAULT_ROOMS[0].slug)
      } catch {
        setRooms(DEFAULT_ROOMS)
        setActiveRoomId(DEFAULT_ROOMS[0].slug)
        setAlert('Using default rooms — messages won\'t persist until reconnected.')
      }
    }

    loadRooms()
  }, [isAuthenticated])

  // WebSocket connection
  useEffect(() => {
    if (!activeRoomId || !rooms.length || !isAuthenticated) return

    const room = rooms.find(r => r.id === activeRoomId || r.slug === activeRoomId)
    if (!room) {
      setStatus('disconnected')
      return
    }

    const roomId = room.id || room.slug
    setStatus('connecting')
    setAlert(null)

    const wsUrl = `${apiUrl.replace(/^http/, 'ws')}/api/rooms/${roomId}/ws`
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
            [roomId]: [...(prev[roomId] || []), payload],
          }))
        }
        if (payload.type === 'participants') {
          setParticipants(prev => ({ ...prev, [roomId]: payload.participants }))
        }
        if (payload.type === 'error') {
          setAlert(payload.message || 'Unable to send message')
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
  }, [activeRoomId, rooms, isAuthenticated])

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'instant',
      })
    }
  }, [roomMessages, activeRoomId])

  const activeRoom = rooms.find(r => r.id === activeRoomId || r.slug === activeRoomId)
  const activeMessages = activeRoom ? roomMessages[activeRoom.id || activeRoom.slug] || [] : []
  const activeParticipants = activeRoom ? participants[activeRoom.id || activeRoom.slug] || [] : []

  const sendMessage = useCallback(() => {
    if (!message.trim()) return
    if (status !== 'connected' || !socket) {
      setAlert('Not connected. Please wait while we reconnect.')
      return
    }
    socket.send(JSON.stringify({ content: message.trim() }))
    setMessage('')
    triggerHaptic('light')
    inputRef.current?.focus()
  }, [message, status, socket, triggerHaptic])

  const handleRoomSwitch = (roomId: string) => {
    setActiveRoomId(roomId)
    setAlert(null)
    triggerHaptic('selection')
  }

  return (
    <MobileAppShell title="" showHeader={false} showTabBar={false}>
      <div className="flex flex-col h-[100dvh] bg-[#050507]">
        {/* Header */}
        <div
          className="bg-[#050507]/95 backdrop-blur-xl border-b border-white/[0.06]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => router.push('/m/wisdom')} className="p-2 -ml-2">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center">
              <h1 className="text-sm font-semibold text-white">Wisdom Rooms</h1>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'connected' ? 'bg-green-400 animate-pulse' : status === 'connecting' ? 'bg-[#d4a44c]' : 'bg-white/30'
                }`} />
                <span className="text-[10px] text-white/50">
                  {status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 -mr-2 relative"
            >
              <Users className="w-5 h-5 text-white/70" />
              {activeParticipants.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d4a44c] text-[8px] text-black font-bold flex items-center justify-center">
                  {activeParticipants.length}
                </span>
              )}
            </button>
          </div>

          {/* Room tabs */}
          <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {rooms.map(room => (
                <button
                  key={room.id || room.slug}
                  onClick={() => handleRoomSwitch(room.id || room.slug)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                    (room.id || room.slug) === activeRoomId
                      ? 'bg-[#d4a44c]/20 border border-[#d4a44c]/40 text-[#d4a44c]'
                      : 'bg-white/[0.04] border border-white/[0.08] text-white/60'
                  }`}
                >
                  {room.name}
                  {typeof room.active_count === 'number' && room.active_count > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-70">{room.active_count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Room theme */}
          {activeRoom && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-white/40">{activeRoom.theme}</p>
            </div>
          )}
        </div>

        {/* Participants panel */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/[0.06] bg-white/[0.02]"
            >
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-white/50 mb-2">
                  Active ({activeParticipants.length})
                </p>
                {activeParticipants.length === 0 ? (
                  <p className="text-xs text-white/30">No one is here yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeParticipants.map(person => (
                      <span
                        key={person.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-xs text-white/70"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        {person.id === currentUserId ? 'You' : person.label || person.id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert */}
        {alert && (
          <div className="px-4 py-2 bg-[#d4a44c]/10 border-b border-[#d4a44c]/20">
            <p className="text-[11px] text-[#d4a44c]">{alert}</p>
          </div>
        )}

        {/* Chat messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          {activeMessages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No messages yet.</p>
              <p className="text-xs text-white/20 mt-1">Say hello to open the conversation.</p>
            </div>
          )}

          {activeMessages.map(msg => {
            const isOwn = msg.user_id === currentUserId
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-gradient-to-r from-[#d4a44c]/30 to-[#d4a44c]/20 border border-[#d4a44c]/30 text-white'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white/90'
                }`}>
                  {!isOwn && (
                    <p className="text-[10px] font-medium text-[#d4a44c]/70 mb-1">Participant</p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] text-white/30 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Input area */}
        <div
          className="px-4 py-3 bg-[#050507]/95 backdrop-blur-xl border-t border-white/[0.06]"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div className="flex gap-2.5 items-end">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isAuthenticated ? 'Share something helpful...' : 'Sign in to chat'}
              disabled={!isAuthenticated}
              className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d4a44c]/40 disabled:opacity-50"
              style={{ fontSize: '16px' }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={!message.trim() || !isAuthenticated || status !== 'connected'}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-[#d4a44c] to-orange-500 flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            >
              <Send className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </div>
    </MobileAppShell>
  )
}
