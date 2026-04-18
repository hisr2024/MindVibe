'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportStatus {
  id: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  download_token?: string | null
  expires_at?: string | null
  file_size_bytes?: number | null
  created_at: string
}

interface DeletionStatus {
  id: number
  status: 'pending' | 'grace_period' | 'processing' | 'completed' | 'canceled'
  grace_period_days: number
  grace_period_ends_at?: string | null
  created_at: string
}

interface PrivacyStatus {
  export: ExportStatus | null
  deletion: DeletionStatus | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data.detail || `Error ${res.status}`, status: res.status }
    return { data: data as T, status: res.status }
  } catch {
    return { error: 'Network error — please try again.', status: 0 }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STEP_LABELS = ['Requested', 'Processing', 'Ready', 'Downloaded'] as const

function stepIndex(status: string): number {
  switch (status) {
    case 'pending': return 0
    case 'processing': return 1
    case 'completed': return 3
    default: return 2
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusTracker({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 my-4" role="progressbar" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={3}>
      {STEP_LABELS.map((label, i) => {
        const done = i <= currentStep
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  done ? 'bg-[#C8A84B] text-[#0A0A14]' : 'bg-[#1a1a2e] text-[#6B6355]',
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={[
                'text-[10px] sm:text-xs',
                done ? 'text-[#E8DCC8]' : 'text-[#6B6355]',
              ].join(' ')}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={[
                'w-6 sm:w-10 h-0.5 mb-4',
                i < currentStep ? 'bg-[#C8A84B]' : 'bg-[#1a1a2e]',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DeleteConfirmModal({
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  loading: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  const [typed, setTyped] = useState('')

  if (!open) return null

  const confirmed = typed === 'DELETE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Confirm account deletion">
      <div className="w-full max-w-md rounded-2xl bg-[#0f0f1e] border border-red-500/30 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Delete your account?</h2>
        <p className="text-sm text-[#E8DCC8]/80 mb-4 leading-relaxed">
          This starts a <strong>30-day grace period</strong>. After that, all your data —
          conversations, journal entries, mood logs, journeys, and subscription —
          will be permanently erased. You can cancel anytime during the grace period.
        </p>

        <label className="block text-xs text-[#6B6355] mb-1">Reason (optional)</label>
        <textarea
          className="w-full rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-[#E8DCC8] text-sm p-2 mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-[#C8A84B]"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Help us understand why you're leaving..."
        />

        <label className="block text-xs text-[#6B6355] mb-1">
          Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
        </label>
        <input
          type="text"
          className="w-full rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] text-[#E8DCC8] text-sm p-2 mb-6 focus:outline-none focus:ring-1 focus:ring-red-500"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] text-[#E8DCC8] py-2.5 text-sm font-medium hover:bg-[#242440] transition-colors disabled:opacity-50"
          >
            Go back
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!confirmed || loading}
            className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PrivacySettingsPage() {
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const fetchStatus = useCallback(async () => {
    const { data } = await apiFetch<PrivacyStatus>('/api/v1/privacy/status')
    setPrivacyStatus(data || null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // -- Export handler
  const handleExport = async () => {
    setExportLoading(true)
    const { data, error } = await apiFetch<ExportStatus>('/api/privacy/export', { method: 'POST' })
    setExportLoading(false)

    if (error) {
      showToast(error, 'error')
      return
    }

    if (data) {
      showToast('Export started! You\'ll receive an email when your data is ready.', 'success')
      await fetchStatus()

      // If completed immediately, auto-download
      if (data.download_token) {
        window.location.href = `/api/privacy/export?token=${encodeURIComponent(data.download_token)}`
      }
    }
  }

  // -- Delete handler
  const handleDelete = async (reason: string) => {
    setDeleteLoading(true)
    const { error } = await apiFetch('/api/privacy/delete', {
      method: 'POST',
      body: JSON.stringify({ confirm: true, reason: reason || null }),
    })
    setDeleteLoading(false)
    setShowDeleteModal(false)

    if (error) {
      showToast(error, 'error')
      return
    }

    showToast('Account deletion initiated. You have 30 days to cancel.', 'success')
    await fetchStatus()
  }

  // -- Cancel deletion handler
  const handleCancelDeletion = async () => {
    setCancelLoading(true)
    const { error } = await apiFetch('/api/privacy/delete', { method: 'PATCH' })
    setCancelLoading(false)

    if (error) {
      showToast(error, 'error')
      return
    }

    showToast('Account deletion canceled. Your account is restored.', 'success')
    await fetchStatus()
  }

  const exportStatus = privacyStatus?.export
  const deletionStatus = privacyStatus?.deletion
  const isDeletionActive = deletionStatus?.status === 'grace_period' || deletionStatus?.status === 'pending'

  return (
    <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
      {/* Toast */}
      {toast && (
        <div className={[
          'fixed top-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg transition-all',
          toast.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
            : 'bg-red-500/10 border border-red-500/30 text-red-200',
        ].join(' ')}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link href="/settings" className="text-sm text-[#C8A84B] hover:underline mb-2 inline-block">
          ← Settings
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Privacy & Data</h1>
        <p className="text-sm text-[var(--mv-text-secondary)]">
          Exercise your GDPR rights — download your data or delete your account.
        </p>
      </div>

      {/* ─── Data Export (Art. 15 + 20) ──────────────────────────────── */}
      <section className="mb-8 rounded-2xl border border-[rgba(200,168,75,0.2)] bg-[rgba(200,168,75,0.03)] p-5 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#E8DCC8]">Download my data</h2>
            <p className="text-sm text-[#B8AE98] mt-1">
              Get a machine-readable copy of all your personal data (GDPR Art. 15 &amp; 20).
              Includes account info, conversations, mood logs, journeys, and subscription details.
              Journal entries are included in encrypted form.
            </p>
          </div>
          <span className="text-xs bg-[#C8A84B]/10 text-[#C8A84B] px-2 py-1 rounded-full whitespace-nowrap ml-3">
            1× per 24h
          </span>
        </div>

        {/* Status tracker */}
        {exportStatus && exportStatus.status !== 'expired' && exportStatus.status !== 'failed' && (
          <StatusTracker currentStep={stepIndex(exportStatus.status)} />
        )}

        {/* Last export info */}
        {exportStatus && (
          <div className="text-xs text-[#6B6355] mb-4 space-y-1">
            <p>Last export: {formatDate(exportStatus.created_at)} · Status: {exportStatus.status}</p>
            {exportStatus.file_size_bytes && <p>Size: {formatBytes(exportStatus.file_size_bytes)}</p>}
            {exportStatus.expires_at && exportStatus.status === 'completed' && (
              <p>Download expires: {formatDate(exportStatus.expires_at)}</p>
            )}
            {exportStatus.download_token && exportStatus.status === 'completed' && (
              <a
                href={`/api/privacy/export?token=${encodeURIComponent(exportStatus.download_token)}`}
                className="inline-block mt-2 text-sm text-[#C8A84B] underline underline-offset-4 hover:text-[#d8b858]"
              >
                Re-download ZIP
              </a>
            )}
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={exportLoading}
          className={[
            'rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
            'bg-[#C8A84B] text-[#0A0A14] hover:bg-[#d8b858]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {exportLoading ? 'Preparing export…' : 'Download my data'}
        </button>
      </section>

      {/* ─── Account Deletion (Art. 17) ──────────────────────────────── */}
      <section className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-1">Delete my account</h2>
        <p className="text-sm text-[#B8AE98] mb-4">
          Permanently erase all your data (GDPR Art. 17 — Right to Erasure).
          A 30-day grace period allows you to change your mind.
        </p>

        {/* Active deletion banner */}
        {isDeletionActive && deletionStatus && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 mb-4">
            <p className="text-sm text-red-200 font-medium mb-1">
              Account deletion in progress
            </p>
            <p className="text-xs text-red-200/70">
              Your account will be permanently deleted on{' '}
              <strong>{deletionStatus.grace_period_ends_at ? formatDate(deletionStatus.grace_period_ends_at) : 'N/A'}</strong>.
              You can cancel before that date.
            </p>
            <button
              onClick={handleCancelDeletion}
              disabled={cancelLoading}
              className="mt-3 rounded-xl bg-[#1a1a2e] border border-[#C8A84B]/40 text-[#C8A84B] px-4 py-2 text-sm font-medium hover:bg-[#242440] transition-colors disabled:opacity-50"
            >
              {cancelLoading ? 'Restoring…' : 'Cancel deletion — keep my account'}
            </button>
          </div>
        )}

        {/* Show canceled status */}
        {deletionStatus?.status === 'canceled' && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 mb-4 text-xs text-emerald-200">
            Previous deletion request was canceled on {formatDate(deletionStatus.created_at)}.
          </div>
        )}

        {!isDeletionActive && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-xl bg-red-600/80 text-white px-5 py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Delete my account
          </button>
        )}
      </section>

      {/* ─── Info footer ─────────────────────────────────────────────── */}
      <div className="text-xs text-[#6B6355] space-y-2">
        <p>
          Your data export includes: account info, sessions, KIAAN conversations, journal entries
          (encrypted), mood logs, journey progress, subscription info (no card data), and notification tokens.
        </p>
        <p>
          Need help? Contact{' '}
          <a href="mailto:privacy@kiaanverse.com" className="text-[#C8A84B] underline underline-offset-2">
            privacy@kiaanverse.com
          </a>
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/privacy" className="text-[#C8A84B] hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-[#C8A84B] hover:underline">Terms of Service</Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </main>
  )
}
