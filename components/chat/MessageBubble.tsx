'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface MessageBubbleProps {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  onSaveToJournal?: (text: string) => void
}

export function MessageBubble({ sender, text, timestamp, status, onSaveToJournal }: MessageBubbleProps) {
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  
  const handleSaveToJournal = () => {
    if (onSaveToJournal) {
      // Save to localStorage for journal prefill
      if (typeof window !== 'undefined') {
        localStorage.setItem('journal_prefill', JSON.stringify({ body: text }))
      }
      onSaveToJournal(text)
      setSaved(true)
      // Navigate to journal page with prefill parameter
      router.push('/sacred-reflections?prefill=true')
    }
  }
  
  return (
    <div className="space-y-2 group">
      <div className="flex items-center gap-2 text-xs text-orange-100/60">
        <span className="font-semibold text-orange-50">{sender === 'user' ? 'You' : 'KIAAN'}</span>
        <span>{new Date(timestamp).toLocaleTimeString()}</span>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-emerald-400 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved
          </motion.span>
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
        {text}
      </div>
      
      {/* Send to Journal button for assistant messages */}
      {sender === 'assistant' && onSaveToJournal && !status && (
        <button
          onClick={handleSaveToJournal}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-orange-200 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 rounded-xl transition-all animate-fadeIn"
          aria-label="Send to Journal"
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
