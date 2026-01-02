'use client'

import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

interface TranslateButtonProps {
  text: string
  onTranslate?: (translatedText: string) => void
  className?: string
}

export function TranslateButton({ text, onTranslate, className = '' }: TranslateButtonProps) {
  const { language, config } = useLanguage()
  const [isTranslating, setIsTranslating] = useState(false)
  const [isTranslated, setIsTranslated] = useState(false)
  const [error, setError] = useState(false)

  const handleTranslate = async () => {
    // If already in English, no need to translate
    if (language === 'en') {
      setError(true)
      setTimeout(() => setError(false), 2000)
      return
    }

    setIsTranslating(true)
    try {
      // For now, this is a placeholder for actual translation
      // In production, this would call a translation API
      // The translation would be handled by the backend or a translation service

      // Simulate translation delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setIsTranslated(!isTranslated)
      onTranslate?.(text)
    } catch (err) {
      setError(true)
      setTimeout(() => setError(false), 2000)
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <button
      onClick={handleTranslate}
      disabled={isTranslating}
      className={`group relative flex items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-200 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={isTranslated ? `Show original (English)` : `Translate to ${config.name}`}
      title={isTranslated ? 'Show original' : `Translate to ${config.name}`}
    >
      {/* Translate Icon */}
      {!error && (
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
          className={`text-orange-400 ${isTranslating ? 'animate-spin' : ''}`}
        >
          {isTranslated ? (
            // Globe with check (translated)
            <>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M2 12h20"></path>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2.5"></path>
            </>
          ) : (
            // Language/Globe icon
            <>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M2 12h20"></path>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </>
          )}
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

      <span>
        {isTranslating
          ? 'Translating...'
          : error
            ? 'Already in EN'
            : isTranslated
              ? 'Original'
              : 'Translate'}
      </span>

      {/* Tooltip showing target language */}
      {!isTranslating && !error && language !== 'en' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-orange-500/90 px-2 py-1 text-[10px] font-semibold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {isTranslated ? 'Show English' : `Translate to ${config.nativeName}`}
        </div>
      )}
    </button>
  )
}
