'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/utils/clipboard'

interface CopyButtonProps {
  text: string
  className?: string
  onCopy?: () => void
}

export function CopyButton({ text, className = '', onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text, {
      onSuccess: () => {
        setCopied(true)
        onCopy?.()
        // Reset after 2 seconds
        setTimeout(() => setCopied(false), 2000)
      },
      onError: () => {
        setError(true)
        setTimeout(() => setError(false), 2000)
      },
    })

    if (!success) {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`group relative flex items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-200 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={copied || error}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {/* Copy Icon */}
      {!copied && !error && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-orange-400"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}

      {/* Success Checkmark */}
      {copied && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-400"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}

      {/* Error Icon */}
      {error && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      )}

      <span>{copied ? 'Copied!' : error ? 'Failed' : 'Copy'}</span>

      {/* Tooltip */}
      {copied && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-green-500/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg animate-fadeIn">
          Copied to clipboard!
        </div>
      )}
    </button>
  )
}
