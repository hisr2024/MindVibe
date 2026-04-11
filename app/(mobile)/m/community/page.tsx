'use client'

/**
 * Mobile Community Page — Wisdom Rooms & Sacred Circles
 *
 * Two-tab interface for community features:
 * 1. Live Rooms: Real-time discussion rooms anchored by Gita verses
 * 2. Sacred Circles: Ongoing peer support groups
 *
 * Uses the Sakha design system with inline styles:
 * - #050714 background, #D4A017 gold accent
 * - Cormorant Garamond display, Crimson Text scripture, Outfit UI
 * - Noto Sans Devanagari for Sanskrit (lineHeight 2.0)
 *
 * API endpoints:
 * - GET /api/community/circles?type=room   → rooms list
 * - GET /api/community/circles?type=circle → circles list
 * - POST /api/community/circles            → join circle
 * - DELETE /api/community/circles           → leave circle
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

/* ---------------------------------------------------------------------------
 * Theme colors mapped to room/circle themes
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
 * Types
 * --------------------------------------------------------------------------- */

interface WisdomRoom {
  id: string | number
  name: string
  title: string
  theme: string
  participant_count: number
  is_live: boolean
  current_verse: string | null
  theme_label: string
  description?: string
}

interface SacredCircle {
  id: string | number
  name: string
  description: string
  member_count: number
  posts_today: number
  is_joined: boolean
  category?: string
}

type TabId = 'rooms' | 'circles'

/* ---------------------------------------------------------------------------
 * Fallback data — shown when API is unavailable or returns empty
 * --------------------------------------------------------------------------- */

const FALLBACK_ROOMS: WisdomRoom[] = [
  {
    id: 'grounding-room',
    name: 'Calm Grounding',
    title: 'Calm Grounding',
    theme: 'meditation',
    participant_count: 12,
    is_live: true,
    current_verse: 'BG 6.35',
    theme_label: 'Meditation',
    description: 'Deep breaths and present-moment awareness',
  },
  {
    id: 'karma-room',
    name: 'Karma Discussion',
    title: 'Karma Discussion',
    theme: 'karma',
    participant_count: 8,
    is_live: true,
    current_verse: 'BG 3.19',
    theme_label: 'Karma',
    description: 'Understanding action without attachment',
  },
  {
    id: 'devotion-room',
    name: 'Bhakti Circle',
    title: 'Bhakti Circle',
    theme: 'devotion',
    participant_count: 5,
    is_live: false,
    current_verse: 'BG 12.8',
    theme_label: 'Devotion',
    description: 'Cultivating loving devotion',
  },
  {
    id: 'dharma-room',
    name: 'Dharma Path',
    title: 'Dharma Path',
    theme: 'dharma',
    participant_count: 0,
    is_live: false,
    current_verse: 'BG 2.47',
    theme_label: 'Dharma',
    description: 'Walking the path of righteousness',
  },
]

const FALLBACK_CIRCLES: SacredCircle[] = [
  {
    id: 'anxiety-circle',
    name: 'Inner Peace Seekers',
    description: 'A safe space for those working through anxiety with Gita wisdom',
    member_count: 234,
    posts_today: 12,
    is_joined: false,
    category: 'anxiety',
  },
  {
    id: 'growth-circle',
    name: 'Self Growth Sangha',
    description: 'Community of seekers dedicated to personal transformation',
    member_count: 189,
    posts_today: 8,
    is_joined: true,
    category: 'self_growth',
  },
  {
    id: 'grief-circle',
    name: 'Healing Hearts',
    description: 'Supporting each other through loss with compassion and wisdom',
    member_count: 97,
    posts_today: 5,
    is_joined: false,
    category: 'grief',
  },
]

/* ---------------------------------------------------------------------------
 * Sacred OM Icon (SVG) for empty states
 * --------------------------------------------------------------------------- */

function SacredOmIcon({ size = 48, color = '#D4A017' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.3 }}
    >
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill={color}
        style={{ fontFamily: "'Noto Sans Devanagari', serif", fontSize: '28px' }}
      >
        ॐ
      </text>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
 * Tab animation variants
 * --------------------------------------------------------------------------- */

const tabContentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
}

/* ---------------------------------------------------------------------------
 * WisdomRoomCard Component
 * --------------------------------------------------------------------------- */

function WisdomRoomCard({
  room,
  onTap,
}: {
  room: WisdomRoom
  onTap: (roomId: string | number) => void
}) {
  const themeColor = getThemeColor(room.theme)

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onTap(room.id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        borderRadius: '16px',
        border: `1px solid ${themeColor}20`,
        background: `linear-gradient(135deg, ${themeColor}08, ${themeColor}04)`,
        backdropFilter: 'blur(12px)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle corner glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColor}15, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top row: Theme label + Live badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            color: themeColor,
            background: `${themeColor}18`,
            padding: '3px 10px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {room.theme_label}
        </span>

        {room.is_live && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                display: 'inline-block',
                boxShadow: '0 0 6px #4ade80, 0 0 12px #4ade8060',
                animation: 'livePulse 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#4ade80',
              }}
            >
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '18px',
          fontWeight: 600,
          color: '#f5f0e8',
          marginBottom: '6px',
          lineHeight: '1.3',
        }}
      >
        {room.title || room.name}
      </h3>

      {/* Description */}
      {room.description && (
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '13px',
            color: 'rgba(245, 240, 232, 0.55)',
            marginBottom: '12px',
            lineHeight: '1.4',
          }}
        >
          {room.description}
        </p>
      )}

      {/* Bottom row: Participants + Verse */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* People icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              color: 'rgba(245, 240, 232, 0.5)',
            }}
          >
            {room.participant_count} {room.participant_count === 1 ? 'seeker' : 'seekers'}
          </span>
        </div>

        {room.current_verse && (
          <span
            style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: '12px',
              fontStyle: 'italic',
              color: `${themeColor}90`,
              background: `${themeColor}10`,
              padding: '2px 8px',
              borderRadius: '8px',
            }}
          >
            {room.current_verse}
          </span>
        )}
      </div>
    </motion.button>
  )
}

/* ---------------------------------------------------------------------------
 * SacredCircleCard Component
 * --------------------------------------------------------------------------- */

function SacredCircleCard({
  circle,
  onJoinToggle,
  isLoading,
}: {
  circle: SacredCircle
  onJoinToggle: (circleId: string | number, isJoined: boolean) => void
  isLoading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(212, 160, 23, 0.12)',
        background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.04), rgba(212, 160, 23, 0.02))',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header with name and joined badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '17px',
                fontWeight: 600,
                color: '#f5f0e8',
                lineHeight: '1.3',
              }}
            >
              {circle.name}
            </h3>
            {circle.is_joined && (
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#6EE7B7',
                  background: 'rgba(110, 231, 183, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                Joined
              </span>
            )}
          </div>

          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '13px',
              color: 'rgba(245, 240, 232, 0.55)',
              lineHeight: '1.4',
            }}
          >
            {circle.description}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              color: 'rgba(245, 240, 232, 0.5)',
            }}
          >
            {circle.member_count} members
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              color: 'rgba(245, 240, 232, 0.5)',
            }}
          >
            {circle.posts_today} posts today
          </span>
        </div>
      </div>

      {/* Join/Leave button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onJoinToggle(circle.id, circle.is_joined)}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: '12px',
          border: circle.is_joined
            ? '1px solid rgba(245, 240, 232, 0.12)'
            : '1px solid rgba(212, 160, 23, 0.3)',
          background: circle.is_joined
            ? 'rgba(245, 240, 232, 0.04)'
            : 'linear-gradient(135deg, rgba(212, 160, 23, 0.15), rgba(212, 160, 23, 0.08))',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: circle.is_joined ? 'rgba(245, 240, 232, 0.6)' : '#D4A017',
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          letterSpacing: '0.3px',
        }}
      >
        {isLoading ? 'Please wait...' : circle.is_joined ? 'Leave Circle' : 'Join Circle'}
      </motion.button>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------------
 * Main Community Page
 * --------------------------------------------------------------------------- */

export default function MobileCommunityPage() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  const [activeTab, setActiveTab] = useState<TabId>('rooms')
  const [tabDirection, setTabDirection] = useState(0)
  const [rooms, setRooms] = useState<WisdomRoom[]>([])
  const [circles, setCircles] = useState<SacredCircle[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isLoadingCircles, setIsLoadingCircles] = useState(true)
  const [joiningCircleId, setJoiningCircleId] = useState<string | number | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* ---- Fetch Rooms ---- */
  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true)
    setError(null)
    try {
      const response = await apiFetch('/api/community/circles?type=room')
      if (response.ok) {
        const data = await response.json()
        const roomsArray = Array.isArray(data) ? data : data.rooms || data.results || []
        setRooms(roomsArray.length > 0 ? roomsArray : FALLBACK_ROOMS)
      } else {
        setRooms(FALLBACK_ROOMS)
      }
    } catch {
      setRooms(FALLBACK_ROOMS)
    } finally {
      setIsLoadingRooms(false)
    }
  }, [])

  /* ---- Fetch Circles ---- */
  const fetchCircles = useCallback(async () => {
    setIsLoadingCircles(true)
    try {
      const response = await apiFetch('/api/community/circles?type=circle')
      if (response.ok) {
        const data = await response.json()
        const circlesArray = Array.isArray(data) ? data : data.circles || data.results || []
        setCircles(circlesArray.length > 0 ? circlesArray : FALLBACK_CIRCLES)
      } else {
        setCircles(FALLBACK_CIRCLES)
      }
    } catch {
      setCircles(FALLBACK_CIRCLES)
    } finally {
      setIsLoadingCircles(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
    fetchCircles()
  }, [fetchRooms, fetchCircles])

  /* ---- Tab switching ---- */
  const switchTab = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return
      setTabDirection(tab === 'circles' ? 1 : -1)
      setActiveTab(tab)
      triggerHaptic('selection')
    },
    [activeTab, triggerHaptic]
  )

  /* ---- Navigate to room detail ---- */
  const handleRoomTap = useCallback(
    (roomId: string | number) => {
      triggerHaptic('light')
      router.push(`/m/community/room/${roomId}`)
    },
    [router, triggerHaptic]
  )

  /* ---- Join / Leave circle ---- */
  const handleCircleToggle = useCallback(
    async (circleId: string | number, isJoined: boolean) => {
      setJoiningCircleId(circleId)
      triggerHaptic('medium')

      try {
        if (isJoined) {
          await apiFetch('/api/community/circles', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ circle_id: circleId }),
          })
        } else {
          await apiFetch('/api/community/circles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ circle_id: circleId }),
          })
        }

        // Optimistic update
        setCircles((prev) =>
          prev.map((c) =>
            c.id === circleId
              ? {
                  ...c,
                  is_joined: !isJoined,
                  member_count: isJoined
                    ? Math.max(0, c.member_count - 1)
                    : c.member_count + 1,
                }
              : c
          )
        )
        triggerHaptic('success')
      } catch {
        // Silently handle — user can retry
        triggerHaptic('error')
      } finally {
        setJoiningCircleId(null)
      }
    },
    [triggerHaptic]
  )

  /* ---- Compute derived state ---- */
  const liveRoomCount = rooms.filter((r) => r.is_live).length

  return (
    <MobileAppShell title="" showHeader={false} showTabBar={true}>
      {/* Global keyframes for pulse animation */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      <div
        style={{
          minHeight: '100dvh',
          background: '#050714',
          paddingBottom: '100px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px 0',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#f5f0e8',
              marginBottom: '4px',
            }}
          >
            Community
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14px',
              color: 'rgba(245, 240, 232, 0.5)',
              marginBottom: '20px',
            }}
          >
            Connect with fellow seekers on the path
          </p>

          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {([
              { id: 'rooms' as TabId, label: 'Live Rooms', badge: liveRoomCount > 0 ? liveRoomCount : null },
              { id: 'circles' as TabId, label: 'Sacred Circles', badge: null },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '10px',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? '#D4A017' : 'rgba(245, 240, 232, 0.5)',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(212, 160, 23, 0.12), rgba(212, 160, 23, 0.06))'
                    : 'transparent',
                  border: activeTab === tab.id
                    ? '1px solid rgba(212, 160, 23, 0.2)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {tab.label}
                {tab.badge !== null && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(74, 222, 128, 0.15)',
                      color: '#4ade80',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={tabDirection}>
            {activeTab === 'rooms' ? (
              <motion.div
                key="rooms-tab"
                custom={tabDirection}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Loading state */}
                {isLoadingRooms && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid rgba(212, 160, 23, 0.2)',
                        borderTopColor: '#D4A017',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {/* Error state */}
                {error && !isLoadingRooms && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '14px',
                        color: '#FCA5A5',
                        marginBottom: '12px',
                      }}
                    >
                      {error}
                    </p>
                    <button
                      onClick={fetchRooms}
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#D4A017',
                        background: 'rgba(212, 160, 23, 0.1)',
                        border: '1px solid rgba(212, 160, 23, 0.2)',
                        borderRadius: '10px',
                        padding: '8px 20px',
                        cursor: 'pointer',
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {!isLoadingRooms && rooms.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <SacredOmIcon size={56} />
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'rgba(245, 240, 232, 0.7)',
                        marginTop: '16px',
                        marginBottom: '8px',
                      }}
                    >
                      No rooms open right now
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '13px',
                        color: 'rgba(245, 240, 232, 0.4)',
                        maxWidth: '260px',
                        margin: '0 auto',
                        lineHeight: '1.5',
                      }}
                    >
                      Wisdom rooms open throughout the day. Check back soon or explore Sacred Circles.
                    </p>
                  </div>
                )}

                {/* Rooms list */}
                {!isLoadingRooms && rooms.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Live rooms indicator */}
                    {liveRoomCount > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#4ade80',
                            animation: 'livePulse 2s ease-in-out infinite',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '12px',
                            color: 'rgba(245, 240, 232, 0.4)',
                          }}
                        >
                          {liveRoomCount} room{liveRoomCount !== 1 ? 's' : ''} live now
                        </span>
                      </div>
                    )}

                    {rooms.map((room, index) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.3 }}
                      >
                        <WisdomRoomCard room={room} onTap={handleRoomTap} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="circles-tab"
                custom={tabDirection}
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Loading state */}
                {isLoadingCircles && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid rgba(212, 160, 23, 0.2)',
                        borderTopColor: '#D4A017',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {/* Empty state */}
                {!isLoadingCircles && circles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <SacredOmIcon size={56} />
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'rgba(245, 240, 232, 0.7)',
                        marginTop: '16px',
                        marginBottom: '8px',
                      }}
                    >
                      No circles yet
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '13px',
                        color: 'rgba(245, 240, 232, 0.4)',
                        maxWidth: '260px',
                        margin: '0 auto',
                        lineHeight: '1.5',
                      }}
                    >
                      Sacred Circles are forming. Be among the first to create a supportive community.
                    </p>
                  </div>
                )}

                {/* Circles list */}
                {!isLoadingCircles && circles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {circles.map((circle, index) => (
                      <motion.div
                        key={circle.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.3 }}
                      >
                        <SacredCircleCard
                          circle={circle}
                          onJoinToggle={handleCircleToggle}
                          isLoading={joiningCircleId === circle.id}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileAppShell>
  )
}
