'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Button } from '@/components/ui'
import { VoiceInputButton } from '@/components/voice/VoiceInputButton'
import type { Message } from './KiaanChat'
import { CORE_TOOLS } from '@/lib/constants/tools'
import { canUseVoiceInput } from '@/utils/browserSupport'
import { useChat } from '@/lib/ChatContext'
import { apiFetch } from '@/lib/api'

interface KiaanChatModalProps {
  isOpen: boolean
  onClose: () => void
}

// Get KIAAN tool configuration for consistent routing
const kiaanTool = CORE_TOOLS.find(tool => tool.id === 'kiaan')
const KIAAN_PAGE_URL = kiaanTool?.href || '/kiaan'

export function KiaanChatModal({ isOpen, onClose }: KiaanChatModalProps) {
  const { messages: globalMessages, addMessage } = useChat()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const voiceErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check if voice input is available
  const voiceAvailability = canUseVoiceInput()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [globalMessages])

  // Cleanup voice error timeout on unmount
  useEffect(() => {
    return () => {
      if (voiceErrorTimeoutRef.current) {
        clearTimeout(voiceErrorTimeoutRef.current)
      }
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    }
    addMessage(userMessage)
    const messageText = input
    setInput('')
    setIsLoading(true)

    // Create placeholder for streaming response
    const responseId = crypto.randomUUID()
    let streamedText = ''

    try {
      // Use streaming endpoint for instant responses
      const response = await apiFetch('/api/chat/message/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText
        }),
      })

      if (!response.ok) {
        throw new Error('Streaming request failed')
      }

      // Add placeholder message for streaming
      const placeholderMessage: Message = {
        id: responseId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString()
      }
      addMessage(placeholderMessage)
      setIsLoading(false) // Stop loading animation, show streaming text

      // Process Server-Sent Events stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break

              // Unescape newlines from SSE format
              const text = data.replace(/\\n/g, '\n')
              streamedText += text

              // Update the message in place for live streaming effect
              addMessage({
                id: responseId,
                sender: 'assistant',
                text: streamedText,
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      }

      // Final update if text is empty
      if (!streamedText.trim()) {
        addMessage({
          id: responseId,
          sender: 'assistant',
          text: 'I\'m here for you. Let\'s try again. 💙',
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('Chat error:', error)

      // Fallback to non-streaming endpoint
      try {
        const fallbackResponse = await apiFetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText }),
        })

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json()
          addMessage({
            id: responseId || crypto.randomUUID(),
            sender: 'assistant',
            text: data.response || data.message || 'I\'m here for you. Let\'s try again. 💙',
            timestamp: new Date().toISOString()
          })
        } else {
          throw new Error('Fallback failed')
        }
      } catch {
        addMessage({
          id: crypto.randomUUID(),
          sender: 'assistant',
          text: `Unable to connect to KIAAN. Please try again or use the main chat page at ${KIAAN_PAGE_URL}.`,
          timestamp: new Date().toISOString()
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

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    // Append to existing input
    setInput((prev) => {
      const separator = prev.trim() ? ' ' : ''
      return prev + separator + transcript
    })
    setVoiceError(null)
  }

  // Handle voice errors
  const handleVoiceError = (error: string) => {
    setVoiceError(error)
    // Clear any existing timeout
    if (voiceErrorTimeoutRef.current) {
      clearTimeout(voiceErrorTimeoutRef.current)
    }
    // Set new timeout
    voiceErrorTimeoutRef.current = setTimeout(() => {
      setVoiceError(null)
      voiceErrorTimeoutRef.current = null
    }, 5000)
  }

  return (
    <Modal open={isOpen} onClose={onClose} size="2xl" title="KIAAN — Your Divine Companion">
      <div className="flex flex-col h-[min(600px,70vh)]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {globalMessages.length === 0 && (
            <div className="divine-companion-welcome text-center py-12 px-4">
              <div className="divine-companion-avatar h-16 w-16 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-[#0a0a12]">K</span>
              </div>
              <h3 className="text-lg font-semibold text-[#f5f0e8] mb-1">KIAAN</h3>
              <p className="text-[10px] text-[#d4a44c]/55 tracking-[0.12em] uppercase mb-3">Your Divine Friend</p>
              <div className="divine-sacred-thread w-16 mx-auto mb-3" />
              <p className="text-sm text-[#f5f0e8]/60 max-w-xs mx-auto font-sacred leading-relaxed">Share what&apos;s on your heart. I am here to listen, support, and walk beside you with wisdom.</p>
            </div>
          )}

          {globalMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} divine-companion-message`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender === 'user'
                  ? 'divine-devotee-bubble text-[#f5f0e8]'
                  : 'divine-wisdom-bubble text-[#f5f0e8]/95'
              }`}>
                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.sender === 'assistant' ? 'font-sacred' : ''}`}>{msg.text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="divine-wisdom-bubble rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-[#d4a44c]/60 text-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#e8b54a]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#d4a44c]/50 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#c8943a]/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-[11px]">KIAAN is reflecting...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area — Sacred Space */}
        <div className="border-t border-[#d4a44c]/12 px-4 py-4">
          {/* Voice error notification */}
          {voiceError && (
            <div className="mb-3 rounded-lg bg-red-900/30 border border-red-500/50 px-3 py-2 text-xs text-red-200">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{voiceError}</span>
              </div>
            </div>
          )}

          {/* Voice not available warning */}
          {!voiceAvailability.available && (
            <div className="mb-3 rounded-lg bg-amber-900/30 border border-[#d4a44c]/50 px-3 py-2 text-xs text-[#f0c96d]">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{voiceAvailability.reason}</span>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Speak from your heart..."
              className="flex-1 bg-[#0a0a12]/80 text-[#f5f0e8] placeholder-[#f5f0e8]/30 border border-[#d4a44c]/15 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/40 focus:border-[#d4a44c]/25 min-h-[60px] max-h-[120px] transition-all"
              disabled={isLoading}
            />

            {/* Voice Input Button */}
            {voiceAvailability.available && (
              <VoiceInputButton
                onTranscript={handleVoiceTranscript}
                onError={handleVoiceError}
                disabled={isLoading}
                className="flex-shrink-0"
              />
            )}

            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="kiaan-btn-golden px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-[#f5f0e8]/35 mt-2">
            Press Enter to send, Shift+Enter for new line
            {voiceAvailability.available && ' \u2022 Click mic to speak'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
