'use client'

/**
 * Privacy Settings — user-facing GDPR rights dashboard.
 *
 * Two actions, one screen:
 *   • Download My Data (Art. 20) — queues a backend export job,
 *     polls every 15 s while pending/processing, shows a signed
 *     download link when ready.
 *   • Delete My Account (Art. 17) — opens a confirmation modal,
 *     initiates a 30-day grace-period deletion, and exposes a
 *     single-click "cancel deletion" affordance until the grace
 *     period ends.
 *
 * All network calls go through ``apiFetch`` so that:
 *   • the CSRF token header is attached on mutating verbs
 *     (without it, the backend rejects POST/DELETE with 403),
 *   • session cookies are forwarded,
 *   • a 401 transparently refreshes the access token.
 *
 * Polling uses a ``useRef`` holding the interval handle — using
 * ``useState`` there causes a stale-closure bug where the terminal
 * "stop polling" branch can never see the handle the setup effect
 * installed.
 */

import { AlertTriangle, CheckCircle, Clock, Download, Loader2, Trash2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { apiFetch } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type ExportStatus = 'none' | 'pending' | 'processing' | 'ready' | 'failed'
type DeleteStatus = 'active' | 'pending_deletion' | null

interface ExportState {
  status: ExportStatus
  message: string
  downloadUrl?: string
  expiresAt?: string
  requestId?: string
}

interface DeleteState {
  status: DeleteStatus
  scheduledDeletionAt?: string
  message?: string
}

const POLL_INTERVAL_MS = 15_000

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ExportStatus }) {
  if (status === 'none') return null

  const config = {
    pending: {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Pending',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    processing: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Processing',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    ready: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: 'Ready',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    failed: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Failed',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{
          background: '#0A0A14',
          borderColor: 'rgba(239,68,68,0.3)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#E8DCC8]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Delete Your Account
            </h2>
            <p className="text-xs text-[rgba(232,220,200,0.45)]">This begins a 30-day grace period</p>
          </div>
        </div>

        <p className="text-sm text-[rgba(232,220,200,0.7)] mb-2 leading-relaxed">
          Your account will be scheduled for permanent deletion in{' '}
          <strong className="text-[#E8DCC8]">30 days</strong>. During this time you can cancel at any time.
        </p>

        <ul className="text-xs text-[rgba(232,220,200,0.5)] space-y-1.5 mb-6 list-none">
          {[
            'All your data will be permanently erased',
            'Your Stripe subscription will be cancelled',
            'Encrypted journal entries will be deleted',
            'This action cannot be undone after 30 days',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">·</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#E8DCC8] border transition-colors"
            style={{ borderColor: 'rgba(232,220,200,0.15)', background: 'transparent' }}
          >
            Keep My Account
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Scheduling…' : 'Delete in 30 Days'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PrivacySettingsPage() {
  const [exportState, setExportState] = useState<ExportState>({ status: 'none', message: '' })
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: null })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Ref (not state) so callbacks can always see the current interval.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPoll = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const fetchPrivacyStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/privacy/status', { method: 'GET' })
      if (!res.ok) return
      const data = await res.json()

      // Export status
      const exp = data.export
      if (exp) {
        const status: ExportStatus = exp.status === 'completed' ? 'ready' : (exp.status || 'none')
        const downloadUrl = exp.download_token
          ? `/api/privacy/export?token=${encodeURIComponent(exp.download_token)}`
          : undefined
        setExportState({
          status,
          message: '',
          downloadUrl,
          expiresAt: exp.expires_at,
          requestId: String(exp.id),
        })
        if (['ready', 'failed', 'none'].includes(status)) {
          clearPoll()
        }
      } else {
        setExportState({ status: 'none', message: '' })
      }

      // Deletion status
      const del_ = data.deletion
      if (del_ && del_.status === 'grace_period') {
        setDeleteState({
          status: 'pending_deletion',
          scheduledDeletionAt: del_.grace_period_ends_at,
        })
      } else if (!del_ || del_.status === 'canceled') {
        setDeleteState({ status: null })
      }
    } catch {
      /* transient — the poll loop will try again */
    }
  }, [clearPoll])

  // Initial load.
  useEffect(() => {
    void fetchPrivacyStatus()
    return clearPoll
  }, [fetchPrivacyStatus, clearPoll])

  // Start / stop polling based on status.
  useEffect(() => {
    const shouldPoll = ['pending', 'processing'].includes(exportState.status)
    if (shouldPoll && pollIntervalRef.current === null) {
      pollIntervalRef.current = setInterval(() => {
        void fetchPrivacyStatus()
      }, POLL_INTERVAL_MS)
    } else if (!shouldPoll) {
      clearPoll()
    }
  }, [exportState.status, fetchPrivacyStatus, clearPoll])

  const handleRequestExport = async () => {
    setExportLoading(true)
    try {
      const res = await apiFetch('/api/privacy/export', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.status === 429) {
        setExportState({
          status: 'none',
          message: data.detail || 'Rate limit reached. Try again in 24 hours.',
        })
        return
      }
      setExportState({
        status: data.status || 'pending',
        message: data.message || '',
        requestId: data.request_id,
      })
    } catch {
      setExportState({ status: 'failed', message: 'Failed to request export. Please try again.' })
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      const res = await apiFetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = await res.json().catch(() => ({}))
      setDeleteState({
        status: 'pending_deletion',
        scheduledDeletionAt: data.grace_period_ends_at,
        message: data.message,
      })
      setShowDeleteModal(false)
    } catch {
      setShowDeleteModal(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    setCancelLoading(true)
    try {
      await apiFetch('/api/privacy/delete', { method: 'PATCH' })
      setDeleteState({ status: 'active' })
    } catch {
      /* best-effort — user can retry */
    } finally {
      setCancelLoading(false)
    }
  }

  const scheduledDate = deleteState.scheduledDeletionAt
    ? new Date(deleteState.scheduledDeletionAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const expiresDate = exportState.expiresAt
    ? new Date(exportState.expiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-semibold text-[#E8DCC8]"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Your Privacy
          </h1>
          <p className="text-sm text-[rgba(232,220,200,0.5)] mt-1">
            Your data. Your rights. GDPR Articles 15–22.
          </p>
        </div>

        {/* Deletion Warning Banner */}
        {deleteState.status === 'pending_deletion' && scheduledDate && (
          <div
            className="rounded-xl border p-4 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-300">Account Deletion Scheduled</p>
              <p className="text-xs text-[rgba(232,220,200,0.5)] mt-1">
                Your account will be permanently deleted on{' '}
                <strong className="text-[#E8DCC8]">{scheduledDate}</strong>.
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={cancelLoading}
                className="mt-3 text-xs font-medium text-[#C8A84B] underline underline-offset-2 disabled:opacity-50 flex items-center gap-1"
              >
                {cancelLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Cancel deletion request
              </button>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(200,168,75,0.15)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#C8A84B]" />
                <h2 className="text-base font-medium text-[#E8DCC8]">Download My Data</h2>
              </div>
              <p className="text-xs text-[rgba(232,220,200,0.45)] mt-1">
                Art. 20 — Right to data portability. Includes all your conversations, practice data,
                and account info in JSON format.
              </p>
            </div>
            {exportState.status !== 'none' && <StatusBadge status={exportState.status} />}
          </div>

          {/* Status Message */}
          {exportState.message && exportState.status !== 'none' && (
            <p className="text-xs text-[rgba(232,220,200,0.55)] bg-white/5 rounded-lg px-3 py-2">
              {exportState.message}
            </p>
          )}

          {/* Download Button (when ready) */}
          {exportState.status === 'ready' && exportState.downloadUrl && (
            <div className="space-y-2">
              <a
                href={exportState.downloadUrl}
                download
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-[#0A0A14] bg-[#C8A84B] hover:bg-[#d4b55a] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download ZIP
              </a>
              {expiresDate && (
                <p className="text-xs text-center text-[rgba(232,220,200,0.35)]">
                  Link expires {expiresDate}
                </p>
              )}
            </div>
          )}

          {/* Request Export Button */}
          {['none', 'failed'].includes(exportState.status) && (
            <button
              onClick={handleRequestExport}
              disabled={exportLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50"
              style={{
                borderColor: 'rgba(200,168,75,0.3)',
                color: '#C8A84B',
                background: 'rgba(200,168,75,0.05)',
              }}
            >
              {exportLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {exportLoading ? 'Requesting…' : 'Request Export'}
            </button>
          )}
        </div>

        {/* Delete Section */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(239,68,68,0.15)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              <h2 className="text-base font-medium text-[#E8DCC8]">Delete My Account</h2>
            </div>
            <p className="text-xs text-[rgba(232,220,200,0.45)] mt-1">
              Art. 17 — Right to erasure. All your data will be permanently deleted after a 30-day
              grace period. Your Stripe subscription will be cancelled.
            </p>
          </div>

          {deleteState.status !== 'pending_deletion' && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Request Account Deletion
            </button>
          )}
        </div>

        {/* Info Footer */}
        <p className="text-xs text-center text-[rgba(232,220,200,0.3)]">
          Questions?{' '}
          <a href="mailto:privacy@kiaanverse.com" className="text-[#C8A84B] underline underline-offset-2">
            privacy@kiaanverse.com
          </a>
          {' · '}
          <a href="/privacy" className="text-[#C8A84B] underline underline-offset-2">
            Privacy Policy
          </a>
        </p>
      </div>
    </>
  )
}
