'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KiaanChatModal } from '@/components/chat/KiaanChatModal'
import { useChat } from '@/lib/ChatContext'

export function ChatFooter() {
  const { isOpen, setIsOpen } = useChat()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Fixed Footer Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-lg shadow-orange-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-950 md:h-16 md:w-16"
              aria-label="Open KIAAN chat"
              title="Chat with KIAAN"
            >
              {/* Pulsing background effect */}
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-30" />
              
              {/* Chat bubble icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="relative h-7 w-7 text-white md:h-8 md:w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>

              {/* Hover label */}
              <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-orange-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                Chat with KIAAN
                <span className="absolute left-auto right-4 top-full -mt-1 h-2 w-2 rotate-45 bg-slate-900" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <KiaanChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default ChatFooter
