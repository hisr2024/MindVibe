'use client'

import { useState } from 'react'
import { copyToClipboard } from '@/utils/clipboard'
import { isClipboardSupported } from '@/utils/browserSupport'

interface CopyButtonProps {
  text: string
  className?: string
  onCopy?: () => void
}

export function CopyButton({ text, className = '', onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Check if clipboard is supported
  const clipboardSupported = isClipboardSupported()

  // Helper to show temporary error
  const showTemporaryError = (message: string, duration = 3000) => {
    setErrorMessage(message)
    setError(true)
    setTimeout(() => {
      setError(false)
      setErrorMessage('')
    }, duration)
  }

  const handleCopy = async () => {
    if (!clipboardSupported) {
      showTemporaryError('Clipboard not supported in this browser')
      return
    }

    try {
      const success = await copyToClipboard(text, {
        onSuccess: () => {
          setCopied(true)
          onCopy?.()
          // Reset after 2 seconds
          setTimeout(() => setCopied(false), 2000)
        },
        onError: (err) => {
          const message = err.message || 'Failed to copy'
          showTemporaryError(message)
        },
      })

      if (!success && !error) {
        showTemporaryError('Copy failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Copy failed'
      showTemporaryError(message)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`group relative flex items-center gap-1.5 rounded-lg border border-[#d4a44c]/25 bg-[#d4a44c]/10 px-2.5 py-1.5 text-xs font-medium text-[#e8b54a] transition-all hover:border-[#d4a44c]/40 hover:bg-[#d4a44c]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
          className="text-[#d4a44c]"
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

      {/* Success Tooltip */}
      {copied && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-green-500/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg animate-fadeIn">
          Copied to clipboard!
        </div>
      )}

      {/* Error Tooltip */}
      {error && errorMessage && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg animate-fadeIn max-w-[200px] text-center">
          {errorMessage}
        </div>
      )}
    </button>
  )
}
