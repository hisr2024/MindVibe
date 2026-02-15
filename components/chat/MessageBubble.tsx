'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CopyButton } from './CopyButton'
import { ShareButton } from './ShareButton'
import { VoiceOutputButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import { useMessageTranslation } from '@/hooks/useMessageTranslation'

interface MessageBubbleProps {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  onSaveToJournal?: (text: string) => void
  summary?: string
  aiPowered?: boolean  // Prop to indicate AI-powered response
  _verseReference?: string  // Optional reference tag (reserved for future use)
  viewMode?: 'detailed' | 'summary'
  messageId?: string  // Unique message ID for translation tracking
  autoTranslate?: boolean  // Whether to auto-translate this message
}

/**
 * Build a fallback summary when AI-generated summary is not available.
 * Extracts key sentences containing wisdom markers for a meaningful summary.
 */
function buildSummary(text: string) {
  const normalized = text.replace(/\s+/g, ' ').replace(/\*[^*]*\*/g, '').trim()
  if (!normalized) return ''

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(s => s.length > 20)

  // Look for sentences with psychology or action markers for better summaries
  const wisdomMarkers = ['pattern', 'regulation', 'nervous system', 'attachment', 'mechanism', 'cognitive', 'habit', 'values', 'conditioning', 'awareness']
  const actionMarkers = ['step', 'practice', 'try', 'begin', 'start', 'notice', 'focus', 'take', 'action', 'choose']

  const wisdomSentence = sentences.find(s => wisdomMarkers.some(m => s.toLowerCase().includes(m)))
  const actionSentence = sentences.find(s => actionMarkers.some(m => s.toLowerCase().includes(m)))

  // Build a meaningful summary from wisdom + action sentences
  let summary = ''
  if (wisdomSentence) summary = wisdomSentence
  if (actionSentence && actionSentence !== wisdomSentence) {
    summary = summary ? `${summary} ${actionSentence}` : actionSentence
  }

  // Fallback to first substantive sentences if no markers found
  if (!summary) {
    const selected = sentences.slice(0, 2).join(' ')
    summary = selected
  }

  // Truncate if too long
  if (summary.length > 350) {
    summary = summary.slice(0, 340) + '...'
  }

  // Ensure clean ending
  if (summary && !summary.endsWith('.') && !summary.endsWith('...')) {
    summary = summary.replace(/[!?]?$/, '.')
  }

  return summary
}

export function MessageBubble({ sender, text, timestamp, status, onSaveToJournal, summary, aiPowered = true, _verseReference, viewMode = 'detailed', messageId, autoTranslate = false }: MessageBubbleProps) {
  const router = useRouter()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [showSummary, setShowSummary] = useState(false)
  const [showVerseHover, setShowVerseHover] = useState(false)

  // Get current language for voice features
  const { language } = useLanguage()

  // Use translation hook for assistant messages
  const {
    translatedText,
    isTranslating: _isTranslating,
    error: translationError,
    isTranslated,
    toggleTranslation: _toggleTranslation
  } = useMessageTranslation({
    messageId: messageId || `msg-${timestamp}`,
    originalText: text,
    sourceLang: 'en',
    autoTranslate: sender === 'assistant' && autoTranslate
  })
  
  // Determine which text to display
  const displayText = translatedText || text

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
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

  // Use AI-generated summary if available, fallback to built summary
  const condensedSummary = summary || buildSummary(text)
  const isAISummary = Boolean(summary)
  const showSummaryToggle = sender === 'assistant' && condensedSummary && condensedSummary !== text

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-3 group"
    >
      <div className="flex items-center gap-2 text-xs text-orange-100/60">
        <span className="font-semibold text-orange-50">{sender === 'user' ? 'You' : 'KIAAN'}</span>
        <span suppressHydrationWarning>
          {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
        </span>
        
        {/* AI-Powered Badge for assistant messages */}
        {sender === 'assistant' && aiPowered && !status && (
          <div className="relative">
            <div
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300 border border-orange-400/30 cursor-help"
              onMouseEnter={() => setShowVerseHover(true)}
              onMouseLeave={() => setShowVerseHover(false)}
              role="tooltip"
              aria-label="AI-powered wellness guidance"
            >
              <span className="text-xs">✨</span>
              <span>AI Guided</span>
            </div>

            {/* Hover tooltip */}
            {showVerseHover && (
              <div className="absolute left-0 top-full mt-1 z-10 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-orange-50 shadow-lg border border-orange-500/30">
                <div className="font-semibold text-orange-300 mb-0.5">AI-Powered Wellness Guidance</div>
                <div className="text-orange-100/70">
                  Thoughtful, personalized support
                </div>
                <div className="mt-1 pt-1 border-t border-orange-500/20 text-orange-200/60 text-[10px]">
                  Every KIAAN response is crafted with care
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div
        className={`whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-sm leading-[1.85] ${
          sender === 'user'
            ? 'bg-orange-500/10 text-orange-50'
            : status === 'error'
              ? 'border border-red-500/40 bg-red-500/10 text-red-50'
              : 'bg-white/5 text-orange-50 border border-orange-500/15'
        } ${isTranslated ? 'border-l-2 border-l-blue-400/50' : ''}`}
      >
        <div className={sender === 'assistant' ? 'max-w-[65ch] font-sacred' : ''}>
          {displayText || ''}
        </div>
        
        {/* Translation indicator */}
        {isTranslated && translatedText && (
          <div className="mt-2 pt-2 border-t border-orange-500/20">
            <span className="text-xs text-blue-300/80 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20"></path>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Translated
            </span>
          </div>
        )}
        
        {/* Translation error */}
        {translationError && (
          <div className="mt-2 pt-2 border-t border-red-500/20">
            <span className="text-xs text-red-300/80">
              Translation unavailable
            </span>
          </div>
        )}
      </div>

      {showSummaryToggle && (
        <div className={`rounded-2xl border ${isAISummary ? 'border-teal-500/30 bg-gradient-to-br from-teal-950/40 to-black/40' : 'border-orange-500/20 bg-black/40'} p-3 space-y-2 text-[13px] text-orange-50/85`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isAISummary && (
                <span className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-400/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  AI Summary
                </span>
              )}
              <div className="text-[11px] uppercase tracking-[0.14em] text-orange-100/70">
                {viewMode === 'summary'
                  ? (isAISummary ? 'Key Insights' : 'Quick Summary')
                  : 'Full View - In Depth Response'
                }
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className={`rounded-full border ${isAISummary ? 'border-teal-500/40 hover:border-teal-400/60' : 'border-orange-500/30 hover:border-orange-300/60'} px-3 py-1 text-[11px] font-semibold text-orange-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400`}
            >
              {showSummary ? 'Hide' : 'Show'}
            </button>
          </div>
          {showSummary && (
            <div className={`rounded-xl ${isAISummary ? 'bg-teal-900/20 border border-teal-500/10' : 'bg-white/5'} p-3 text-sm leading-relaxed text-orange-50/90`}>
              {condensedSummary}
              {isAISummary && (
                <div className="mt-2 pt-2 border-t border-teal-500/10 text-[10px] text-teal-300/60 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {viewMode === 'summary'
                    ? 'Intelligently summarized for quick reading'
                    : 'Full in-depth response'
                  }
                </div>
              )}
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

          {/* Voice Output Button */}
          <VoiceOutputButton text={text} language={language} />

          {/* Save to Journal button */}
          {onSaveToJournal && (
            <button
              onClick={handleSaveToJournal}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 rounded-xl animate-fadeIn focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(255,115,39,0.2)]'
              }`}
              aria-label="Save this response to Journal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save to Journal
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default MessageBubble
