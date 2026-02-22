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
      triggerHaptic('success')
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    }, [triggerHaptic])

    // Share message
    const handleShare = useCallback(async (text: string) => {
      triggerHaptic('selection')
      if (navigator.share) {
        await navigator.share({
          title: 'Wisdom from KIAAN',
          text: text,
        })
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
          bg-[#0b0b0f]
          ${className}
        `}
        style={{
          paddingBottom: isKeyboardVisible ? keyboardHeight : 0,
        }}
      >
        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          onScroll={handleScroll}
        >
          <div className="px-4 py-4 space-y-4">
            {/* Welcome message when empty */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-400/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Welcome to KIAAN
                </h2>
                <p className="text-sm text-slate-400 max-w-xs">
                  I&apos;m here to offer warm, grounded guidance rooted in timeless wisdom.
                  Share what&apos;s on your mind.
                </p>

                {/* Suggested prompts */}
                <div className="mt-6 space-y-2 w-full max-w-xs">
                  {[
                    "I'm feeling anxious about...",
                    "Help me find peace with...",
                    "I need guidance on...",
                  ].map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => {
                        triggerHaptic('selection')
                        setInputText(prompt)
                        inputRef.current?.focus()
                      }}
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-left text-sm text-slate-300 active:scale-[0.98] transition-transform"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((message, _index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    flex flex-col
                    ${message.sender === 'user' ? 'items-end' : 'items-start'}
                  `}
                >
                  {/* Message bubble */}
                  <motion.div
                    onTouchStart={() => {
                      const timer = setTimeout(() => handleLongPress(message.id), 500)
                      return () => clearTimeout(timer)
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-3
                      ${message.sender === 'user'
                        ? 'bg-orange-500/20 border border-orange-500/30 rounded-br-md'
                        : 'bg-white/[0.06] border border-white/[0.08] rounded-bl-md'
                      }
                      ${message.status === 'error' ? 'border-red-500/40 bg-red-500/10' : ''}
                      ${message.status === 'queued' ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Sender label for assistant */}
                    {message.sender === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-slate-900" />
                        </div>
                        <span className="text-xs font-medium text-orange-300">KIAAN</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          Ancient Wisdom
                        </span>
                      </div>
                    )}

                    {/* Message text */}
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>

                    {/* Message metadata */}
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <span className="text-[10px] text-slate-500">
                        {formatTime(message.timestamp)}
                      </span>

                      {/* Status indicator */}
                      {message.status === 'sending' && (
                        <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
                      )}
                      {message.status === 'sent' && (
                        <Check className="w-3 h-3 text-green-500" />
                      )}
                      {message.status === 'error' && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      {message.status === 'queued' && (
                        <span className="text-[9px] text-slate-500">Queued</span>
                      )}
                    </div>
                  </motion.div>

                  {/* Action buttons (shown when message is selected or for assistant messages) */}
                  <AnimatePresence>
                    {(selectedMessageId === message.id || message.sender === 'assistant') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`
                          flex items-center gap-2 mt-2
                          ${message.sender === 'user' ? 'mr-2' : 'ml-2'}
                        `}
                      >
                        {/* Copy button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(message.id, message.text)}
                          className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center active:bg-white/[0.1]"
                          aria-label="Copy message"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </motion.button>

                        {/* Share button */}
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleShare(message.text)}
                            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center active:bg-white/[0.1]"
                            aria-label="Share message"
                          >
                            <Share2 className="w-4 h-4 text-slate-400" />
                          </motion.button>
                        )}

                        {/* Save to journal (assistant only) */}
                        {message.sender === 'assistant' && onSaveToJournal && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSaveToJournal(message.text)}
                            className="px-3 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center gap-1.5 active:bg-orange-500/20"
                            aria-label="Save to journal"
                          >
                            <BookOpen className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-orange-300">Journal</span>
                          </motion.button>
                        )}

                        {/* Voice output (assistant only) */}
                        {message.sender === 'assistant' && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center active:bg-white/[0.1]"
                            aria-label="Listen to message"
                          >
                            <Volume2 className="w-4 h-4 text-slate-400" />
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-slate-900" />
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                      className="w-2 h-2 rounded-full bg-orange-400/60"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToBottom}
              className="
                absolute bottom-24 right-4
                w-10 h-10 rounded-full
                bg-orange-500 shadow-lg shadow-orange-500/30
                flex items-center justify-center
                active:scale-95
              "
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20">
            <p className="text-xs text-yellow-300 text-center">
              You&apos;re offline - Messages will be sent when you&apos;re back online
            </p>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 py-3 bg-[#0b0b0f]/95 backdrop-blur-xl border-t border-white/[0.06]">
          {/* Voice input indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex items-center justify-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-red-500"
                />
                <span className="text-sm text-slate-300">Listening...</span>
                {transcript && (
                  <span className="text-sm text-white">{transcript}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div className="flex items-end gap-2">
            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white text-base placeholder:text-slate-500 resize-none focus:outline-none focus:border-orange-500/40 disabled:opacity-50"
                style={{
                  maxHeight: 120,
                  fontSize: '16px', // Prevent zoom on iOS
                }}
              />

              {/* Voice input button (inside input) */}
              {voiceSupported && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVoiceToggle}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-white/[0.08] text-slate-400'}`}
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

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${inputText.trim() ? 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-lg shadow-orange-500/30' : 'bg-white/[0.06] border border-white/[0.08]'} disabled:opacity-50`}
              aria-label="Send message"
            >
              <Send
                className={`w-5 h-5 ${inputText.trim() ? 'text-white' : 'text-slate-500'}`}
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
