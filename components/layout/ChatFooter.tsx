'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/lib/ChatContext'
import type { ChatMessage } from '@/lib/chatStorage'

// Generate unique ID with fallback for environments without crypto.randomUUID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + random string
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function ChatFooter() {
  const { messages: globalMessages, addMessage } = useChat()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
    // Load saved open state from localStorage (with SSR safety check)
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('kiaan-footer-open')
        if (savedState === 'true') {
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Failed to load footer state from localStorage:', error)
      }
    }
  }, [])

  // Save open state to localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('kiaan-footer-open', isOpen.toString())
      } catch (error) {
        console.error('Failed to save footer state to localStorage:', error)
      }
    }
  }, [isOpen, mounted])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [globalMessages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Track unread messages when minimized
  useEffect(() => {
    if (!isOpen && globalMessages.length > 0) {
      const lastMessage = globalMessages[globalMessages.length - 1]
      if (lastMessage.sender === 'assistant') {
        setUnreadCount(prev => prev + 1)
      }
    } else if (isOpen) {
      setUnreadCount(0)
    }
  }, [globalMessages, isOpen])

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const MAX_RETRIES = 2

  const sendMessage = async (attemptCount = 0) => {
    if (!input.trim() || isLoading) return

    const messageText = input
    const userMessage: ChatMessage = {
      id: generateId(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    }
    addMessage(userMessage)
    setInput('')
    setIsLoading(true)
    setConnectionStatus('connecting')

    try {
      // Use KIAAN's existing chat endpoint
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.response || 'Chat request failed')
      }

      const data = await response.json()

      // Handle KIAAN response format
      const aiMessage: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        text: data.response || data.message || 'I apologize, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      addMessage(aiMessage)
      setConnectionStatus('connected')
      setRetryAttempt(0)
    } catch (error) {
      console.error('Chat error:', error)
      
      // Retry logic
      if (attemptCount < MAX_RETRIES) {
        setRetryAttempt(attemptCount + 1)
        addMessage({
          id: generateId(),
          sender: 'assistant',
          text: `Connection interrupted. Retrying... (${attemptCount + 1}/${MAX_RETRIES})`,
          timestamp: new Date().toISOString(),
          status: 'error',
        })
        
        // Retry after a short delay
        setTimeout(() => {
          // Re-add the user message and retry
          sendMessage(attemptCount + 1)
        }, 2000)
      } else {
        // Final failure
        setConnectionStatus('error')
        addMessage({
          id: generateId(),
          sender: 'assistant',
          text: 'Unable to connect to KIAAN. Please try again or visit the main chat page for a better experience.',
          timestamp: new Date().toISOString(),
          status: 'error',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* Minimized Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-[9999] md:bottom-8 md:right-8"
          >
            <button
              onClick={toggleOpen}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-lg shadow-orange-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-950 md:h-16 md:w-16"
              aria-label="Open KIAAN chat"
              title="Chat with KIAAN"
            >
              {/* Pulsing background effect */}
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-30" />

              {/* Notification badge for unread messages */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

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

      {/* Expanded Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999] w-[calc(100vw-48px)] md:w-[380px] md:bottom-8 md:right-8"
          >
            <div className="flex flex-col h-[80vh] md:h-[600px] rounded-2xl border border-orange-500/20 bg-slate-950/95 backdrop-blur-lg shadow-2xl shadow-orange-500/20 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold text-slate-900">
                    K
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-orange-50">Chat with KIAAN</h3>
                      {connectionStatus === 'connected' && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      {connectionStatus === 'connecting' && (
                        <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      )}
                      {connectionStatus === 'error' && (
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      )}
                    </div>
                    <p className="text-[10px] text-orange-100/60">
                      {connectionStatus === 'connected' && 'Online'}
                      {connectionStatus === 'connecting' && 'Connecting...'}
                      {connectionStatus === 'error' && 'Connection issues'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'error' && (
                    <a
                      href="/kiaan/chat"
                      className="text-xs text-orange-300 hover:text-orange-100 underline"
                      title="Open main chat page"
                    >
                      Full Chat
                    </a>
                  )}
                  <button
                    onClick={toggleOpen}
                    className="rounded-lg p-1.5 text-orange-100/60 hover:bg-orange-500/10 hover:text-orange-50 transition-colors"
                    aria-label="Minimize chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
                {globalMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-300/20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">💬</span>
                    </div>
                    <h4 className="text-sm font-semibold text-orange-50 mb-2">Welcome to KIAAN</h4>
                    <p className="text-xs text-orange-100/70 max-w-[260px] mx-auto">
                      Share what's on your mind. I'm here to offer warm, grounded guidance rooted in timeless wisdom.
                    </p>
                  </div>
                )}

                {globalMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                          : msg.status === 'error'
                          ? 'bg-red-500/10 border border-red-500/30 text-red-200'
                          : 'bg-slate-800/80 text-slate-100 border border-orange-500/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className="text-[10px] opacity-60 mt-1" suppressHydrationWarning>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/80 rounded-2xl px-4 py-3 border border-orange-500/10">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs">KIAAN is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-orange-500/20 bg-slate-900/50 px-4 py-3">
                <div className="flex items-end gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what's on your mind..."
                    className="flex-1 bg-slate-800/80 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm border border-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                    disabled={isLoading}
                    maxLength={2000}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    aria-label="Send message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Press Enter to send • Powered by KIAAN AI 💙
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatFooter
