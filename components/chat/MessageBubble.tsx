'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageBubbleProps {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  onSaveToJournal?: (text: string) => void
}

export function MessageBubble({ sender, text, timestamp, status, onSaveToJournal }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [saved, setSaved] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  const handleSaveToJournal = () => {
    if (onSaveToJournal) {
      onSaveToJournal(text)
      setSaved(true)
      setShowMenu(false)
      // Reset saved indicator after 2 seconds
      setTimeout(() => setSaved(false), 2000)
    }
  }
  
  const handleContextMenu = (e: React.MouseEvent) => {
    if (sender === 'assistant' && onSaveToJournal) {
      e.preventDefault()
      setShowMenu(true)
    }
  }
  
  const handleLongPress = () => {
    if (sender === 'assistant' && onSaveToJournal) {
      setShowMenu(true)
    }
  }
  
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(handleLongPress, 500)
  }
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  
  return (
    <div 
      className="space-y-1 group relative"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
      
      <div className="relative">
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
        
        {/* Hover save icon for assistant messages */}
        {sender === 'assistant' && onSaveToJournal && !status && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30"
            aria-label="Save to journal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
        )}
        
        {/* Context menu */}
        <AnimatePresence>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 z-50"
              >
                <div className="rounded-xl bg-[#1a1a1a] border border-orange-500/30 shadow-lg overflow-hidden">
                  <button
                    onClick={handleSaveToJournal}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-orange-50 hover:bg-orange-500/20 transition-colors w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save to Journal
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MessageBubble
