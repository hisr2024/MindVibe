'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, CardContent } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import useAuth from '@/hooks/useAuth'

interface Session {
  session_id: string
  active: boolean
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  current: boolean
}

export default function SessionsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/auth/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
      } else if (res.status === 401) {
        setError('Please log in to view sessions')
      } else {
        setError('Failed to load sessions')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setError('Please log in to view sessions')
        setLoading(false)
        return
      }
      fetchSessions()
    }
  }, [fetchSessions, authLoading, isAuthenticated])

  const revokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId)
      setError(null)

      const res = await apiFetch(`/api/auth/sessions/${sessionId}/revoke`, {
        method: 'POST',
      })

      if (res.ok) {
        fetchSessions()
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Failed to revoke session')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setRevokingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-orange-500/20 rounded w-48 mb-4"></div>
          <div className="h-4 bg-orange-500/10 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-orange-500/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const activeSessions = sessions.filter((s) => s.active && !s.revoked_at)
  const inactiveSessions = sessions.filter((s) => !s.active || s.revoked_at)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link href="/settings/security" className="text-orange-400 hover:text-orange-300 text-sm mb-4 inline-block">
          &larr; Back to Security
        </Link>
        <h1 className="text-3xl font-bold text-orange-50 mb-2">Active Sessions</h1>
        <p className="text-orange-100/70">
          Manage devices and sessions logged into your account
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Sessions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-orange-50 mb-4">
          Active Sessions ({activeSessions.length})
        </h2>
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <motion.div
              key={session.session_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                variant="bordered"
                className={session.current ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
              >
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.current ? 'bg-emerald-500/20' : 'bg-orange-500/20'
                    }`}>
                      <svg
                        className={`w-5 h-5 ${session.current ? 'text-emerald-400' : 'text-orange-400'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-orange-50">
                          {session.current ? 'This Device' : 'Session'}
                        </p>
                        {session.current && (
                          <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-orange-100/50">
                        Last active: {getRelativeTime(session.last_used_at)}
                      </p>
                      <p className="text-xs text-orange-100/30 mt-1">
                        Created: {formatDate(session.created_at)}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => revokeSession(session.session_id)}
                      disabled={revokingId === session.session_id}
                    >
                      {revokingId === session.session_id ? 'Revoking...' : 'Revoke'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {activeSessions.length === 0 && (
            <div className="text-center py-8 text-orange-100/50">
              No active sessions found
            </div>
          )}
        </div>
      </div>

      {/* Inactive Sessions */}
      {inactiveSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-orange-50/70 mb-4">
            Inactive Sessions ({inactiveSessions.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {inactiveSessions.slice(0, 5).map((session) => (
              <Card key={session.session_id} variant="bordered">
                <CardContent className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-orange-100/70">Expired Session</p>
                    <p className="text-xs text-orange-100/40">
                      {session.revoked_at
                        ? `Revoked: ${formatDate(session.revoked_at)}`
                        : `Expired: ${formatDate(session.expires_at)}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-200">Security Tip</p>
            <p className="text-xs text-blue-200/70 mt-1">
              If you see any sessions you don&apos;t recognize, revoke them immediately and consider changing your password. Enable 2FA for additional protection.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
