'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Button } from '@/components/ui'
import { VoiceInputButton } from '@/components/voice/VoiceInputButton'
import type { Message } from './KiaanChat'
import { CORE_TOOLS } from '@/lib/constants/tools'
import { canUseVoiceInput } from '@/utils/browserSupport'

interface KiaanChatModalProps {
  isOpen: boolean
  onClose: () => void
}

// Get KIAAN tool configuration for consistent routing
const kiaanTool = CORE_TOOLS.find(tool => tool.id === 'kiaan')
const KIAAN_PAGE_URL = kiaanTool?.href || '/kiaan'

export function KiaanChatModal({ isOpen, onClose }: KiaanChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if voice input is available
  const voiceAvailability = canUseVoiceInput()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { 
      id: crypto.randomUUID(), 
      sender: 'user', 
      text: input, 
      timestamp: new Date().toISOString() 
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Use KIAAN's existing chat endpoint
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.response || 'Chat request failed')
      }

      const data = await response.json()
      
      // Handle KIAAN response format
      const aiMessage: Message = { 
        id: crypto.randomUUID(),
        sender: 'assistant', 
        text: data.response || data.message || 'I apologize, I encountered an error. Please try again.', 
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(),
        sender: 'assistant', 
        text: `Unable to connect to KIAAN. Please try again or use the main chat page at ${KIAAN_PAGE_URL}.`,
        timestamp: new Date().toISOString()
      }])
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
    // Clear error after 5 seconds
    setTimeout(() => setVoiceError(null), 5000)
  }

  return (
    <Modal open={isOpen} onClose={onClose} size="2xl" title="KIAAN Chat">
      <div className="flex flex-col h-[min(600px,70vh)]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Welcome to KIAAN</h3>
              <p className="text-sm">Share what's on your mind. I'm here to offer warm, grounded guidance rooted in timeless wisdom.</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' 
                  : 'bg-slate-800 text-slate-100'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>KIAAN is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 px-4 py-4">
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
            <div className="mb-3 rounded-lg bg-amber-900/30 border border-amber-500/50 px-3 py-2 text-xs text-amber-200">
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
              placeholder="Share what's on your mind..."
              className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[60px] max-h-[120px]"
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
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send, Shift+Enter for new line
            {voiceAvailability.available && ' • Click mic to speak'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
