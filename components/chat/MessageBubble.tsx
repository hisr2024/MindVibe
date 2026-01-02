'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CopyButton } from './CopyButton'
import { ShareButton } from './ShareButton'
import { TranslateButton } from './TranslateButton'
import { VoiceOutputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'

interface MessageBubbleProps {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  onSaveToJournal?: (text: string) => void
  summary?: string
  gitaPowered?: boolean  // New prop to indicate wisdom-powered response
  verseReference?: string  // New prop for verse chapter reference (e.g., "Ch. 2-6")
  viewMode?: 'detailed' | 'summary'
}

function buildSummary(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const sentences = normalized.split(/(?<=[.!?])\s+/)
  const selected = sentences.slice(0, 3).join(' ')
  return selected.length > 280 ? `${selected.slice(0, 277)}...` : selected
}

export function MessageBubble({ sender, text, timestamp, status, onSaveToJournal, summary, gitaPowered = true, verseReference, viewMode = 'detailed' }: MessageBubbleProps) {
  const router = useRouter()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showVerseHover, setShowVerseHover] = useState(false)
  
  // Get current language for voice features
  const { language } = useLanguage()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])
  
  // Respect viewMode prop - if summary mode, use summary; if detailed mode, use full text
  useEffect(() => {
    setShowSummary(viewMode === 'summary')
  }, [viewMode])
  
  const handleSaveToJournal = () => {
    if (onSaveToJournal) {
      // Save to localStorage for journal prefill
      if (typeof window !== 'undefined') {
        localStorage.setItem('journal_prefill', JSON.stringify({ body: text }))
      }
      onSaveToJournal(text)
      // Navigate to journal page with prefill parameter
      router.push('/sacred-reflections?prefill=true')
    }
  }

  const condensedSummary = summary || buildSummary(text)
  const showSummaryToggle = sender === 'assistant' && condensedSummary && condensedSummary !== text

  return (
    <div className="space-y-2 group">
      <div className="flex items-center gap-2 text-xs text-orange-100/60">
        <span className="font-semibold text-orange-50">{sender === 'user' ? 'You' : 'KIAAN'}</span>
        <span suppressHydrationWarning>
          {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
        </span>
        
        {/* Ancient Wisdom Badge for assistant messages */}
        {sender === 'assistant' && gitaPowered && !status && (
          <div className="relative">
            <div
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300 border border-orange-400/30 cursor-help"
              onMouseEnter={() => setShowVerseHover(true)}
              onMouseLeave={() => setShowVerseHover(false)}
              role="tooltip"
              aria-label="This response is rooted in Ancient Wisdom"
            >
              <span className="text-xs">🕉️</span>
              <span>Ancient Wisdom</span>
            </div>
            
            {/* Hover tooltip for verse reference */}
            {showVerseHover && (
              <div className="absolute left-0 top-full mt-1 z-10 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-orange-50 shadow-lg border border-orange-500/30">
                <div className="font-semibold text-orange-300 mb-0.5">Rooted in Ancient Wisdom</div>
                <div className="text-orange-100/70">
                  {verseReference 
                    ? `Drawing from verse ${verseReference}` 
                    : 'Based on timeless teachings'}
                </div>
                <div className="mt-1 pt-1 border-t border-orange-500/20 text-orange-200/60 text-[10px]">
                  Every KIAAN response is validated for authenticity
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div
        className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          sender === 'user'
            ? 'bg-orange-500/10 text-orange-50'
            : status === 'error'
              ? 'border border-red-500/40 bg-red-500/10 text-red-50'
              : 'bg-white/5 text-orange-50 border border-orange-500/15'
        }`}
      >
        {text || ''}
      </div>

      {showSummaryToggle && (
        <div className="rounded-2xl border border-orange-500/20 bg-black/40 p-3 space-y-2 text-[13px] text-orange-50/85">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-orange-100/70">Summary view</div>
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="rounded-full border border-orange-500/30 px-3 py-1 text-[11px] font-semibold text-orange-50 transition hover:border-orange-300/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
            >
              {showSummary ? 'Hide' : 'Show'}
            </button>
          </div>
          {showSummary && (
            <div className="rounded-xl bg-white/5 p-3 text-sm leading-relaxed text-orange-50/90">
              {condensedSummary}
            </div>
          )}
        </div>
      )}

      {/* Action buttons row - Copy, Share, Translate, Voice Output, and Save to Journal */}
      {sender === 'assistant' && !status && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Copy Button */}
          <CopyButton text={text} />

          {/* Share Button */}
          <ShareButton text={text} />

          {/* Translate Button */}
          <TranslateButton text={text} />

          {/* Voice Output Button */}
          <VoiceOutputButton text={text} language={language} />

          {/* Send to Sacred Reflections button */}
          {onSaveToJournal && (
            <button
              onClick={handleSaveToJournal}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 rounded-xl animate-fadeIn focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(255,115,39,0.2)]'
              }`}
              aria-label="Send this response to Sacred Reflections"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Send to Sacred Reflections
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default MessageBubble
