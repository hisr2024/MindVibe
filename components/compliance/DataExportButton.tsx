'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/api'

interface DataExportButtonProps {
  format?: 'json' | 'csv'
  className?: string
}

export default function DataExportButton({ 
  format = 'json',
  className = '' 
}: DataExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'requested' | 'downloading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [downloadToken, setDownloadToken] = useState<string | null>(null)

  const requestExport = async () => {
    setIsLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const response = await apiFetch(`/api/gdpr/data-export?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to request data export')
      }

      const data = await response.json()
      setDownloadToken(data.download_token)
      setStatus('requested')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadExport = async () => {
    if (!downloadToken) return

    setIsLoading(true)
    setStatus('downloading')

    try {
      const response = await apiFetch(`/api/gdpr/data-export/${downloadToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to download data')
      }

      const data = await response.json()
      
      // Create a downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mindvibe-data-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('idle')
      setDownloadToken(null)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400"
        >
          {errorMessage}
        </motion.div>
      )}

      {status === 'requested' && downloadToken && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
        >
          <p className="text-sm text-emerald-400 mb-2">
            ✓ Your data export is ready!
          </p>
          <p className="text-xs text-orange-100/50 mb-3">
            Click the button below to download your data. The link will expire in 7 days.
          </p>
          <button
            onClick={downloadExport}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Preparing Download...' : 'Download My Data'}
          </button>
        </motion.div>
      )}

      {(status === 'idle' || status === 'error') && (
        <button
          onClick={requestExport}
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="none" 
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export My Data ({format.toUpperCase()})
            </>
          )}
        </button>
      )}

      <p className="mt-2 text-xs text-orange-100/40">
        GDPR Article 20: You have the right to receive your personal data in a portable format.
      </p>
    </div>
  )
}
