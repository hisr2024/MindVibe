'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface MessageBubbleProps {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  onSaveToJournal?: (text: string) => void
}

export function MessageBubble({ sender, text, timestamp, status, onSaveToJournal }: MessageBubbleProps) {
  const router = useRouter()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])
  
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
  
  return (
    <div className="space-y-2 group">
      <div className="flex items-center gap-2 text-xs text-orange-100/60">
        <span className="font-semibold text-orange-50">{sender === 'user' ? 'You' : 'KIAAN'}</span>
        <span suppressHydrationWarning>
          {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
        </span>
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
      
      {/* Send to Journal button for assistant messages */}
      {sender === 'assistant' && onSaveToJournal && !status && (
        <button
          onClick={handleSaveToJournal}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 rounded-xl animate-fadeIn focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
            prefersReducedMotion 
              ? '' 
              : 'transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(255,115,39,0.2)]'
          }`}
          aria-label="Send this response to Journal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Send to Journal
        </button>
      )}
    </div>
  )
}

export default MessageBubble
