'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ResetPreview {
  will_reset: {
    achievements: number
    unlockables: number
    xp: number
    level: number
    activity_counts: {
      moods: number
      journals: number
      chats: number
    }
  }
  will_preserve: {
    user_account: boolean
    chat_history: boolean
    journal_entries: boolean
    mood_logs: boolean
    user_preferences: boolean
  }
  warning: string
}

interface ResetResponse {
  success: boolean
  message: string
  details: {
    achievements_reset: number
    unlockables_reset: number
    progress_reset: boolean
  }
  timestamp: string
}

export function ProgressResetTool() {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<ResetPreview | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [resetResponse, setResetResponse] = useState<ResetResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPreview = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/progress/reset/preview', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to load reset preview')
      }

      const data = await response.json()
      setPreview(data)
    } catch (err) {
      console.error('Preview error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetClick = () => {
    if (!preview) {
      loadPreview()
    }
    setShowConfirmDialog(true)
    setConfirmText('')
    setResetResponse(null)
    setError(null)
  }

  const handleConfirmReset = async () => {
    if (confirmText.toLowerCase() !== 'reset my progress') {
      setError('Please type the confirmation text exactly as shown')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/progress/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          confirm: true,
          reason: 'User requested reset from dashboard',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Reset failed')
      }

      const data = await response.json()
      setResetResponse(data)
      setShowConfirmDialog(false)
      
      // Reload page after 3 seconds to show updated state
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (err) {
      console.error('Reset error:', err)
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-[#d4a44c]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset Progress
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Reset your Karmic Tree progress while preserving your journals, moods, and chat history.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-500/50 px-4 py-3 text-sm text-red-200">
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {resetResponse && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg bg-green-900/30 border border-green-500/50 px-4 py-3"
        >
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-200">{resetResponse.message}</p>
              <p className="mt-1 text-xs text-green-300">
                Reset {resetResponse.details.achievements_reset} achievements and{' '}
                {resetResponse.details.unlockables_reset} unlockables
              </p>
              <p className="mt-1 text-xs text-green-400">Page will reload in 3 seconds...</p>
            </div>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleResetClick}
        disabled={isLoading || !!resetResponse}
        className="w-full rounded-lg bg-gradient-to-r from-[#c8943a] to-red-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-[#c8943a] hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#d4a44c] focus:ring-offset-2 focus:ring-offset-slate-800"
      >
        {isLoading ? 'Loading...' : 'Reset My Progress'}
      </button>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#d4a44c]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Confirm Progress Reset
              </h3>

              {preview && (
                <div className="mb-6 space-y-4">
                  {/* What Will Be Reset */}
                  <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4">
                    <h4 className="text-sm font-semibold text-red-300 mb-2">⚠️ Will Be Reset:</h4>
                    <ul className="text-xs text-red-200 space-y-1">
                      <li>• {preview.will_reset.achievements} achievements</li>
                      <li>• {preview.will_reset.unlockables} unlockables</li>
                      <li>• {preview.will_reset.xp} XP (Level {preview.will_reset.level})</li>
                      <li>
                        • Activity counts ({preview.will_reset.activity_counts.moods} moods,{' '}
                        {preview.will_reset.activity_counts.journals} journals,{' '}
                        {preview.will_reset.activity_counts.chats} chats)
                      </li>
                    </ul>
                  </div>

                  {/* What Will Be Preserved */}
                  <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-4">
                    <h4 className="text-sm font-semibold text-green-300 mb-2">✅ Will Be Preserved:</h4>
                    <ul className="text-xs text-green-200 space-y-1">
                      <li>• Your account and preferences</li>
                      <li>• All chat history with KIAAN</li>
                      <li>• All journal entries</li>
                      <li>• All mood logs</li>
                    </ul>
                  </div>

                  <p className="text-xs text-[#e8b54a] font-medium">{preview.warning}</p>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="confirmText" className="block text-sm font-medium text-slate-300 mb-2">
                  Type <span className="font-mono text-[#d4a44c]">reset my progress</span> to confirm:
                </label>
                <input
                  id="confirmText"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="reset my progress"
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#d4a44c]"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isLoading}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  disabled={isLoading || confirmText.toLowerCase() !== 'reset my progress'}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-medium text-white transition-all hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
