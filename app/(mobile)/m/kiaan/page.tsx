'use client'

/**
 * Mobile KIAAN Chat Page
 *
 * Full-screen immersive chat experience with KIAAN AI companion.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mic } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { MobileKiaanChat, ChatMessage } from '@/components/mobile/MobileKiaanChat'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'
import { queueOfflineOperation } from '@/lib/offline/syncService'

export default function MobileKiaanPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState(false)

  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      if (!isAuthenticated) return

      try {
        const response = await apiFetch('/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          setSessionId(data.session_id)

          // Load existing messages if any
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg: { id: string; role: string; content: string; created_at: string }) => ({
              id: msg.id,
              sender: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              text: msg.content,
              timestamp: msg.created_at,
              status: 'sent' as const,
            })))
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat session:', error)
        setConnectionError(true)
      }
    }

    initSession()
  }, [isAuthenticated])

  // Send message to KIAAN
  const handleSendMessage = useCallback(async (text: string) => {
    const messageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: messageId,
      sender: 'user',
      text,
      timestamp,
      status: 'sending',
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Queue for offline sync
      queueOfflineOperation('chat_message', 'create', messageId, {
        session_id: sessionId,
        content: text,
        timestamp,
      })

      const response = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update user message status
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: 'sent' } : msg
          )
        )

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: data.message_id || crypto.randomUUID(),
          sender: 'assistant',
          text: data.response || 'I am here with you. Could you share more about what you are feeling?',
          timestamp: new Date().toISOString(),
          status: 'sent',
          summary: data.summary,
        }

        setMessages((prev) => [...prev, assistantMessage])
        triggerHaptic('success')
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Failed to send message:', error)

      // Mark message as error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: 'error' } : msg
        )
      )

      triggerHaptic('error')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, triggerHaptic])

  // Save to journal
  const handleSaveToJournal = useCallback((text: string) => {
    // Store for journal prefill
    if (typeof window !== 'undefined') {
      localStorage.setItem('journal_prefill', JSON.stringify({ body: text }))
    }
    router.push('/m/journal?prefill=true')
  }, [router])

  return (
    <MobileAppShell
      title="KIAAN"
      subtitle="Your wisdom companion"
      showHeader={false}
      showTabBar={true}
    >
      {/* Voice companion shortcut */}
      <div className="flex justify-end px-4 pt-2 pb-1">
        <button
          onClick={() => { triggerHaptic('selection'); router.push('/m/companion') }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#d4a44c]/10 border border-[#d4a44c]/20 text-xs text-[#d4a44c] font-medium"
        >
          <Mic className="w-3.5 h-3.5" />
          Voice Mode
        </button>
      </div>
      <MobileKiaanChat
        messages={messages}
        onSendMessage={handleSendMessage}
        onSaveToJournal={handleSaveToJournal}
        isLoading={isLoading}
        placeholder={connectionError ? 'Reconnecting to KIAAN...' : "Share what's on your mind..."}
        className="flex-1 min-h-0"
      />
    </MobileAppShell>
  )
}
