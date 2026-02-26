'use client'

/**
 * Mobile KIAAN Chat Interface
 *
 * A touch-optimized chat interface for KIAAN on mobile devices.
 *
 * Features:
 * - Full-screen immersive chat experience
 * - Swipe to reply, long-press for actions
 * - Voice input with visual feedback
 * - Haptic feedback on interactions
 * - Offline message queuing
 * - Auto-growing input field
 * - Keyboard-aware layout
 * - Smooth scroll with momentum
 *
 * @example
 * <MobileKiaanChat
 *   onSendMessage={(text) => handleSend(text)}
 *   messages={chatMessages}
 * />
 */

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Copy,
  Share2,
  BookOpen,
  ChevronDown,
  Volume2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useKeyboardVisibility } from '@/hooks/useKeyboardVisibility'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useLanguage } from '@/hooks/useLanguage'

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error' | 'queued'
  summary?: string
}

export interface MobileKiaanChatProps {
  /** Chat messages */
  messages: ChatMessage[]
  /** Send message handler */
  onSendMessage: (text: string) => void
  /** Save to journal handler */
  onSaveToJournal?: (text: string) => void
  /** Whether KIAAN is currently responding */
  isLoading?: boolean
  /** Placeholder text for input */
  placeholder?: string
  /** Custom className */
  className?: string
}

export const MobileKiaanChat = forwardRef<HTMLDivElement, MobileKiaanChatProps>(
  function MobileKiaanChat(
    {
      messages,
      onSendMessage,
      onSaveToJournal,
      isLoading = false,
      placeholder = "Share what's on your mind...",
      className = '',
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()
    const { isVisible: isKeyboardVisible, height: keyboardHeight } = useKeyboardVisibility()
    const { isOnline } = useNetworkStatus()
    const { language } = useLanguage()

    const [inputText, setInputText] = useState('')
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Voice input hook
    const {
      isListening,
      isSupported: voiceSupported,
      transcript,
      startListening,
      stopListening,
      error: _voiceError,
    } = useVoiceInput({
      language,
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setInputText((prev) => prev + ' ' + text)
        }
      },
    })

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, [messages.length])

    // Track scroll position for "scroll to bottom" button
    const handleScroll = useCallback(() => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShowScrollButton(!isNearBottom)
      }
    }, [])

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
      triggerHaptic('light')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [triggerHaptic])

    // Send message
    const handleSend = useCallback(() => {
      const text = inputText.trim()
      if (!text) return

      triggerHaptic('medium')
      onSendMessage(text)
      setInputText('')

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    }, [inputText, onSendMessage, triggerHaptic])

    // Handle voice input toggle
    const handleVoiceToggle = useCallback(() => {
      triggerHaptic('selection')
      if (isListening) {
        stopListening()
      } else {
        startListening()
      }
    }, [isListening, startListening, stopListening, triggerHaptic])

    // Auto-grow textarea
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value)

      // Auto-grow
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }, [])

    // Handle key press (enter to send)
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }, [handleSend])

    // Copy message to clipboard
    const handleCopy = useCallback(async (messageId: string, text: string) => {
      if (typeof window === 'undefined') return
      triggerHaptic('success')
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // Clipboard API not available in this context
      }
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    }, [triggerHaptic])

    // Share message
    const handleShare = useCallback(async (text: string) => {
      if (typeof window === 'undefined') return
      triggerHaptic('selection')
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Wisdom from KIAAN',
            text: text,
          })
        }
      } catch {
        // Share cancelled or not supported
      }
    }, [triggerHaptic])

    // Save to journal
    const handleSaveToJournal = useCallback((text: string) => {
      triggerHaptic('success')
      onSaveToJournal?.(text)
    }, [onSaveToJournal, triggerHaptic])

    // Long press handler for message actions
    const handleLongPress = useCallback((messageId: string) => {
      triggerHaptic('heavy')
      setSelectedMessageId(messageId === selectedMessageId ? null : messageId)
    }, [selectedMessageId, triggerHaptic])

    // Format timestamp for display
    const formatTime = useCallback((timestamp: string) => {
      try {
        return new Date(timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return ''
      }
    }, [])

    return (
      <div
        ref={ref}
        className={`
          flex flex-col h-full
          bg-[#050507] relative
          ${className}
        `}
        style={{
          paddingBottom: isKeyboardVisible ? keyboardHeight : 0,
        }}
      >
        {/* Divine ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(212,164,76,0.04)_0%,transparent_70%)]" />
          <div className="absolute bottom-1/3 right-0 w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)]" />
        </div>

        {/* Divine KIAAN header */}
        <div className="relative z-10 px-4 py-3 bg-gradient-to-b from-[#0a0a10] to-transparent">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-10 h-10 rounded-full border border-[#d4a44c]/20"
                style={{ borderStyle: 'dashed' }}
              />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a44c] via-amber-400 to-[#d4a44c] flex items-center justify-center shadow-lg shadow-[#d4a44c]/20">
                <span className="text-lg font-bold text-[#0a0a10]" aria-hidden="true">&#x0950;</span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-base font-bold text-white tracking-wide">KIAAN</h1>
              <p className="text-[10px] text-[#d4a44c]/70 tracking-[0.2em] uppercase">Divine Wisdom Guide</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain relative z-10"
          onScroll={handleScroll}
        >
          <div className="px-4 py-4 space-y-4">
            {/* Divine welcome when empty */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                {/* Sacred lotus orb */}
                <div className="relative mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 w-24 h-24 rounded-full bg-[#d4a44c]/10 blur-xl"
                  />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#d4a44c]/20 via-amber-500/10 to-purple-500/10 border border-[#d4a44c]/20 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-[#d4a44c]" />
                  </div>
                </div>

                <p className="text-[#d4a44c]/60 text-xs tracking-[0.3em] uppercase mb-2">Namaste</p>
                <h2 className="text-xl font-bold text-white mb-2">
                  Welcome, Seeker
                </h2>
                <p className="text-sm text-white/50 max-w-[280px] leading-relaxed">
                  I am KIAAN, your wisdom companion rooted in the eternal teachings of the Bhagavad Gita.
                  Share what weighs on your heart.
                </p>

                {/* Divine separator */}
                <div className="flex items-center gap-3 my-5 w-full max-w-xs">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#d4a44c]/20" />
                  <span className="text-[#d4a44c]/40 text-xs">&#x2022; &#x0950; &#x2022;</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#d4a44c]/20" />
                </div>

                {/* Suggested prompts */}
                <div className="space-y-2.5 w-full max-w-xs">
                  {[
                    { text: "I'm feeling anxious about...", icon: "&#x1F9D8;" },
                    { text: "Help me find inner peace...", icon: "&#x1F54A;" },
                    { text: "Guide me with Gita wisdom...", icon: "&#x1F4D6;" },
                  ].map((prompt, index) => (
                    <motion.button
                      key={`prompt-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + 0.1 * index }}
                      onClick={() => {
                        triggerHaptic('selection')
                        setInputText(prompt.text)
                        inputRef.current?.focus()
                      }}
                      className="w-full px-4 py-3.5 bg-gradient-to-r from-white/[0.03] to-[#d4a44c]/[0.03] border border-[#d4a44c]/10 rounded-2xl text-left text-sm text-white/70 active:scale-[0.98] transition-transform hover:border-[#d4a44c]/25"
                    >
                      <span dangerouslySetInnerHTML={{ __html: prompt.icon }} className="mr-2" />
                      {prompt.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Divine message bubble */}
                  <motion.div
                    onTouchStart={() => {
                      const timer = setTimeout(() => handleLongPress(message.id), 500)
                      return () => clearTimeout(timer)
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-3 relative overflow-hidden
                      ${message.sender === 'user'
                        ? 'bg-gradient-to-br from-[#d4a44c]/20 to-amber-600/10 border border-[#d4a44c]/25 rounded-br-md shadow-sm shadow-[#d4a44c]/10'
                        : 'bg-gradient-to-br from-white/[0.05] to-purple-500/[0.03] border border-white/[0.08] rounded-bl-md shadow-sm shadow-purple-500/5'
                      }
                      ${message.status === 'error' ? 'border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-900/5' : ''}
                      ${message.status === 'queued' ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Subtle glow for assistant messages */}
                    {message.sender === 'assistant' && (
                      <div className="absolute top-0 left-0 w-20 h-20 bg-[radial-gradient(ellipse_at_top_left,rgba(212,164,76,0.06)_0%,transparent_70%)] pointer-events-none" />
                    )}

                    {/* Sacred sender label for KIAAN */}
                    {message.sender === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 relative">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4a44c] via-amber-400 to-[#d4a44c] flex items-center justify-center shadow-sm shadow-[#d4a44c]/30">
                          <span className="text-[9px] font-bold text-[#0a0a10]" aria-hidden="true">&#x0950;</span>
                        </div>
                        <span className="text-xs font-semibold text-[#e8b54a] tracking-wide">KIAAN</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#d4a44c]/15 to-purple-500/10 text-[#e8b54a]/80 border border-[#d4a44c]/20">
                          &#x2728; Divine Wisdom
                        </span>
                      </div>
                    )}

                    {/* Message text */}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap relative ${
                      message.sender === 'assistant' ? 'text-white/90' : 'text-white'
                    }`}>
                      {message.text}
                    </p>

                    {/* Message metadata */}
                    <div className="flex items-center justify-end gap-2 mt-2 relative">
                      <span className={`text-[10px] ${message.sender === 'assistant' ? 'text-[#d4a44c]/40' : 'text-white/30'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.status === 'sending' && (
                        <Loader2 className="w-3 h-3 text-[#d4a44c]/50 animate-spin" />
                      )}
                      {message.status === 'sent' && (
                        <Check className="w-3 h-3 text-emerald-400/70" />
                      )}
                      {message.status === 'error' && (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      )}
                      {message.status === 'queued' && (
                        <span className="text-[9px] text-[#d4a44c]/40">Queued</span>
                      )}
                    </div>
                  </motion.div>

                  {/* Sacred action buttons */}
                  <AnimatePresence>
                    {(selectedMessageId === message.id || message.sender === 'assistant') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-1.5 mt-1.5 ${message.sender === 'user' ? 'mr-2' : 'ml-2'}`}
                      >
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(message.id, message.text)}
                          className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center active:bg-white/[0.08]"
                          aria-label="Copy message"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-white/30" />
                          )}
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleShare(message.text)}
                          className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center active:bg-white/[0.08]"
                          aria-label="Share message"
                        >
                          <Share2 className="w-3.5 h-3.5 text-white/30" />
                        </motion.button>

                        {message.sender === 'assistant' && onSaveToJournal && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSaveToJournal(message.text)}
                            className="px-2.5 h-7 rounded-full bg-[#d4a44c]/8 border border-[#d4a44c]/15 flex items-center justify-center gap-1 active:bg-[#d4a44c]/15"
                            aria-label="Save to journal"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[#d4a44c]/70" />
                            <span className="text-[10px] text-[#e8b54a]/70">Journal</span>
                          </motion.button>
                        )}

                        {message.sender === 'assistant' && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center active:bg-white/[0.08]"
                            aria-label="Listen to message"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-white/30" />
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Divine loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-8 h-8 rounded-full bg-[#d4a44c]/20 blur-md"
                  />
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a44c] via-amber-400 to-[#d4a44c] flex items-center justify-center shadow-md shadow-[#d4a44c]/20">
                    <span className="text-[10px] font-bold text-[#0a0a10]" aria-hidden="true">&#x0950;</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                        className="w-1.5 h-1.5 rounded-full bg-[#d4a44c]"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#d4a44c]/40 italic ml-1">contemplating...</span>
                </div>
              </motion.div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sacred scroll-to-bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-4 z-20 w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a44c] to-amber-500 shadow-lg shadow-[#d4a44c]/30 flex items-center justify-center active:scale-95 border border-[#d4a44c]/40"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Offline indicator with divine styling */}
        {!isOnline && (
          <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-t border-[#d4a44c]/15 relative z-10">
            <p className="text-xs text-[#d4a44c]/80 text-center">
              &#x1F54A; You&apos;re offline &mdash; Messages will be queued and sent when reconnected
            </p>
          </div>
        )}

        {/* Divine Input area */}
        <div className="relative z-10 px-4 py-3 bg-gradient-to-t from-[#050507] via-[#050507]/98 to-[#050507]/90 backdrop-blur-xl border-t border-[#d4a44c]/8">
          {/* Voice input indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex items-center justify-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-[#d4a44c]"
                />
                <span className="text-xs text-[#d4a44c]/70 tracking-wider uppercase">Listening...</span>
                {transcript && (
                  <span className="text-sm text-white/80 italic">{transcript}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div className="flex items-end gap-2.5">
            {/* Text input with sacred border */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-[#d4a44c]/10 rounded-2xl text-white text-base placeholder:text-white/25 resize-none focus:outline-none focus:border-[#d4a44c]/30 focus:bg-white/[0.06] focus:shadow-sm focus:shadow-[#d4a44c]/5 disabled:opacity-50 transition-all duration-200"
                style={{
                  maxHeight: 120,
                  fontSize: '16px',
                }}
              />

              {/* Voice input button */}
              {voiceSupported && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVoiceToggle}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isListening
                      ? 'bg-[#d4a44c] text-[#0a0a10] shadow-md shadow-[#d4a44c]/30'
                      : 'bg-white/[0.06] text-white/30 hover:text-white/50'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </div>

            {/* Divine send button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                inputText.trim()
                  ? 'bg-gradient-to-br from-[#d4a44c] via-amber-400 to-[#d4a44c] shadow-lg shadow-[#d4a44c]/30 border border-[#d4a44c]/40'
                  : 'bg-white/[0.04] border border-white/[0.06]'
              } disabled:opacity-40`}
              aria-label="Send message"
            >
              <Send
                className={`w-5 h-5 ${inputText.trim() ? 'text-[#0a0a10]' : 'text-white/20'}`}
              />
            </motion.button>
          </div>

          {/* Safe area spacer */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
      </div>
    )
  }
)

export default MobileKiaanChat
