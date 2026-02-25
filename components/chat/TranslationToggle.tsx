'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { DEFAULT_LANGUAGE } from '@/lib/constants/languages'

interface TranslationToggleProps {
  showOriginal: boolean
  onToggle: (showOriginal: boolean) => void
  hasTranslation?: boolean
  className?: string
}

/**
 * Translation Toggle Component
 * 
 * Provides a toggle button to switch between original and translated text.
 * Only shown when translation is available and target language is not English.
 */
export function TranslationToggle({
  showOriginal,
  onToggle,
  hasTranslation = false,
  className = ''
}: TranslationToggleProps) {
  const { language } = useLanguage()

  // Don't show toggle if language is default or no translation available
  if (language === DEFAULT_LANGUAGE || !hasTranslation) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(!showOriginal)}
        className={`
          group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs
          font-medium transition-all duration-200
          ${
            showOriginal
              ? 'border-[#d4a44c]/40 bg-[#d4a44c]/10 text-[#e8b54a] hover:border-[#d4a44c]/60'
              : 'border-blue-500/40 bg-blue-500/10 text-blue-200 hover:border-blue-400/60'
          }
        `}
        aria-label={showOriginal ? 'Show translated text' : 'Show original text'}
      >
        {/* Globe icon */}
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>

        {/* Toggle text */}
        <span>
          {showOriginal ? 'Original' : 'Translated'}
        </span>

        {/* Status indicator */}
        <span
          className={`
            h-1.5 w-1.5 rounded-full transition-colors
            ${showOriginal ? 'bg-[#d4a44c]' : 'bg-blue-400'}
          `}
          aria-hidden="true"
        />
      </button>

      {/* Tooltip */}
      <div className="relative group">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Translation info"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Tooltip content */}
        <div
          className="
            invisible absolute bottom-full left-1/2 mb-2 -translate-x-1/2
            whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs
            text-gray-200 opacity-0 shadow-lg transition-all
            group-hover:visible group-hover:opacity-100
          "
        >
          Click to toggle between original and translated text
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-gray-900" />
        </div>
      </div>
    </div>
  )
}

/**
 * Compact Translation Badge
 * 
 * Shows a simple badge indicating translation status
 */
export function TranslationBadge({ isTranslated }: { isTranslated: boolean }) {
  const { language } = useLanguage()

  if (language === DEFAULT_LANGUAGE || !isTranslated) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z"
          clipRule="evenodd"
        />
      </svg>
      Translated
    </span>
  )
}
