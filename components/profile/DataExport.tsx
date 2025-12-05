'use client'

import { useState } from 'react'
import { FadeIn, Button, Modal } from '@/components/ui'

interface DataExportProps {
  className?: string
}

// Storage keys to export
const STORAGE_KEYS = [
  'mindvibe_profile',
  'mindvibe_settings',
  'mindvibe_subscription',
  'mindvibe_journals',
  'mindvibe_chat_history',
  'mindvibe_moods',
  'mindvibe_activity_log',
  'mindvibe_language',
  'mindvibe_onboarding',
]

export function DataExport({ className = '' }: DataExportProps) {
  const [exporting, setExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleExportData = async () => {
    setExporting(true)

    try {
      // Collect all data from localStorage
      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        data: {},
      }

      STORAGE_KEYS.forEach((key) => {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            (exportData.data as Record<string, unknown>)[key] = JSON.parse(value)
          } catch {
            (exportData.data as Record<string, unknown>)[key] = value
          }
        }
      })

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mindvibe-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setDeleting(true)

    try {
      // Clear all MindVibe data from localStorage
      STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key)
      })

      // Also clear any other mindvibe related keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('mindvibe')) {
          localStorage.removeItem(key)
        }
      })

      // Redirect to home page after deletion - using window.location for full page reload to clear all state
      window.location.replace('/')
    } catch (error) {
      console.error('Delete failed:', error)
      setDeleting(false)
    }
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-4">
        {/* Export Data */}
        <div className="rounded-xl border border-orange-500/15 bg-black/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-50">Export Your Data</p>
              <p className="text-xs text-orange-100/50 mt-1">
                Download all your data as a JSON file (GDPR compliant)
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-400">Delete Account</p>
              <p className="text-xs text-orange-100/50 mt-1">
                Permanently delete all your data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteConfirmText('')
        }}
        title="Delete Account"
        description="This action cannot be undone. All your data will be permanently deleted."
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
            <p className="text-sm text-red-100">
              You are about to permanently delete:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-red-200/80">
              <li>• All journal entries</li>
              <li>• Chat history with KIAAN</li>
              <li>• Mood check-ins and analytics</li>
              <li>• Profile and settings</li>
              <li>• Subscription information</li>
            </ul>
          </div>

          <div>
            <label htmlFor="delete-confirm" className="block text-sm text-orange-100/70 mb-2">
              Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-xl border border-orange-500/30 bg-black/40 px-4 py-2 text-orange-50 placeholder-orange-100/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false)
                setDeleteConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </FadeIn>
  )
}

export default DataExport
