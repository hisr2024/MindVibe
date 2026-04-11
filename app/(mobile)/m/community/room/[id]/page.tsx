'use client'

/**
 * Mobile Community Room Detail Page
 *
 * Full-screen real-time discussion room with:
 * - WebSocket-powered live messaging
 * - Current verse anchor display
 * - Participant list
 * - Touch-optimized message bubbles
 * - Sakha design system inline styles
 *
 * Route: /m/community/room/[id]
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

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

interface RoomInfo {
  id: string
  name: string
  title: string
  theme: string
  theme_label: string
  current_verse: string | null
  participant_count: number
  description?: string
}

/* ---------------------------------------------------------------------------
 * Theme color utility
 * --------------------------------------------------------------------------- */

const THEME_COLORS: Record<string, string> = {
  dharma: '#67E8F9',
  karma: '#6EE7B7',
  meditation: '#C4B5FD',
  gita: '#D4A017',
  devotion: '#FCA5A5',
}

function getThemeColor(theme: string | undefined): string {
  if (!theme) return THEME_COLORS.gita
  const lower = theme.toLowerCase()
  for (const [key, color] of Object.entries(THEME_COLORS)) {
    if (lower.includes(key)) return color
  }
  return THEME_COLORS.gita
}

/* ---------------------------------------------------------------------------
 * Room Detail Page
 * --------------------------------------------------------------------------- */

export default function CommunityRoomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [alert, setAlert] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showParticipants, setShowParticipants] = useState(false)

  const socketRef = useRef<WebSocket | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const themeColor = getThemeColor(roomInfo?.theme)

  /* ---- Fetch current user ---- */
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await apiFetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUserId(data.id || data.user_id || '')
        }
      } catch {
        // Not authenticated — handled gracefully
      }
    }
    fetchCurrentUser()
  }, [])

  /* ---- Fetch room info ---- */
  useEffect(() => {
    async function fetchRoomInfo() {
      try {
        const response = await apiFetch(`/api/community/circles/${roomId}`)
        if (response.ok) {
          const data = await response.json()
          setRoomInfo(data)
        } else {
          // Provide minimal fallback info
          setRoomInfo({
            id: roomId,
            name: 'Wisdom Room',
            title: 'Wisdom Room',
            theme: 'gita',
            theme_label: 'Gita',
            current_verse: null,
            participant_count: 0,
          })
        }
      } catch {
        setRoomInfo({
          id: roomId,
          name: 'Wisdom Room',
          title: 'Wisdom Room',
          theme: 'gita',
          theme_label: 'Gita',
          current_verse: null,
          participant_count: 0,
        })
      }
    }
    fetchRoomInfo()
  }, [roomId])

  /* ---- WebSocket connection ---- */
  useEffect(() => {
    if (!roomId || !isAuthenticated) return

    setStatus('connecting')
    setAlert(null)

    const wsUrl = `${apiUrl.replace(/^http/, 'ws')}/api/rooms/${roomId}/ws`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setStatus('connected')
      setAlert(null)
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'history') {
          setMessages(payload.messages || [])
        }
        if (payload.type === 'message') {
          setMessages((prev) => [...prev, payload])
        }
        if (payload.type === 'participants') {
          setParticipants(payload.participants || [])
        }
        if (payload.type === 'error') {
          setAlert(payload.message || 'Unable to send message')
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message', error)
      }
    }

    ws.onclose = () => {
      setStatus('disconnected')
    }

    socketRef.current = ws

    return () => {
      ws.close()
      socketRef.current = null
    }
  }, [roomId, isAuthenticated])

  /* ---- Auto-scroll on new messages ---- */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'instant',
      })
    }
  }, [messages])

  /* ---- Send message ---- */
  const sendMessage = useCallback(() => {
    if (!message.trim()) return
    if (status !== 'connected' || !socketRef.current) {
      setAlert('Not connected. Please wait while we reconnect.')
      return
    }
    socketRef.current.send(JSON.stringify({ content: message.trim() }))
    setMessage('')
    triggerHaptic('light')
    inputRef.current?.focus()
  }, [message, status, triggerHaptic])

  return (
    <MobileAppShell title="" showHeader={false} showTabBar={false}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          background: '#050714',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'rgba(5, 7, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
            }}
          >
            {/* Back button */}
            <button
              onClick={() => router.push('/m/community')}
              style={{
                padding: '8px',
                marginLeft: '-8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5f0e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Room title + status */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#f5f0e8',
                  margin: 0,
                }}
              >
                {roomInfo?.title || roomInfo?.name || 'Wisdom Room'}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '2px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                      status === 'connected'
                        ? '#4ade80'
                        : status === 'connecting'
                          ? '#D4A017'
                          : 'rgba(255,255,255,0.3)',
                    animation: status === 'connected' ? 'livePulse 2s ease-in-out infinite' : 'none',
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '11px',
                    color: 'rgba(245, 240, 232, 0.5)',
                  }}
                >
                  {status === 'connected'
                    ? 'Live'
                    : status === 'connecting'
                      ? 'Connecting...'
                      : 'Offline'}
                </span>
              </div>
            </div>

            {/* Participants button */}
            <button
              onClick={() => {
                setShowParticipants(!showParticipants)
                triggerHaptic('selection')
              }}
              style={{
                padding: '8px',
                marginRight: '-8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {participants.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#D4A017',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '8px',
                    fontWeight: 700,
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {participants.length}
                </span>
              )}
            </button>
          </div>

          {/* Verse anchor (if any) */}
          {roomInfo?.current_verse && (
            <div
              style={{
                padding: '0 16px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: `${themeColor}`,
                  background: `${themeColor}15`,
                  padding: '3px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${themeColor}20`,
                }}
              >
                Anchored to {roomInfo.current_verse}
              </span>
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
              style={{
                overflow: 'hidden',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ padding: '12px 16px' }}>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'rgba(245, 240, 232, 0.5)',
                    marginBottom: '8px',
                  }}
                >
                  Active ({participants.length})
                </p>
                {participants.length === 0 ? (
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '12px',
                      color: 'rgba(245, 240, 232, 0.4)',
                    }}
                  >
                    No one is here yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {participants.map((person) => (
                      <span
                        key={person.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: '12px',
                          color: 'rgba(245, 240, 232, 0.6)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#4ade80',
                          }}
                        />
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
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(212, 160, 23, 0.08)',
              borderBottom: '1px solid rgba(212, 160, 23, 0.15)',
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '12px',
                color: '#D4A017',
              }}
            >
              {alert}
            </p>
          </div>
        )}

        {/* Chat messages */}
        <div
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(245,240,232,0.1)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: '0 auto 12px' }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(245, 240, 232, 0.4)',
                }}
              >
                No messages yet.
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '12px',
                  color: 'rgba(245, 240, 232, 0.25)',
                  marginTop: '4px',
                }}
              >
                Say hello to open the conversation.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.user_id === currentUserId
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    background: isOwn
                      ? `linear-gradient(135deg, ${themeColor}25, ${themeColor}15)`
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isOwn
                      ? `1px solid ${themeColor}30`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {!isOwn && (
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '10px',
                        fontWeight: 500,
                        color: `${themeColor}80`,
                        marginBottom: '4px',
                      }}
                    >
                      Seeker
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '14px',
                      color: isOwn ? '#f5f0e8' : 'rgba(245, 240, 232, 0.85)',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {msg.content}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '10px',
                      color: 'rgba(245, 240, 232, 0.35)',
                      marginTop: '4px',
                      textAlign: isOwn ? 'right' : 'left',
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '12px 16px',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            background: 'rgba(5, 7, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isAuthenticated ? 'Share something helpful...' : 'Sign in to chat'}
              disabled={!isAuthenticated}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.04)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '16px',
                color: '#f5f0e8',
                outline: 'none',
                opacity: !isAuthenticated ? 0.5 : 1,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={!message.trim() || !isAuthenticated || status !== 'connected'}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${themeColor}, ${themeColor}CC)`,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor:
                  !message.trim() || !isAuthenticated || status !== 'connected'
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  !message.trim() || !isAuthenticated || status !== 'connected' ? 0.4 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </MobileAppShell>
  )
}
