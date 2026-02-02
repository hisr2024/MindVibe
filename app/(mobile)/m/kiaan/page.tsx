'use client'

/**
 * Mobile KIAAN Chat Page
 *
 * Full-screen immersive chat experience with KIAAN AI companion.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { MobileKiaanChat, ChatMessage } from '@/components/mobile/MobileKiaanChat'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'
import { queueOfflineOperation } from '@/lib/offline/syncService'

export default function MobileKiaanPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

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
            setMessages(data.messages.map((msg: any) => ({
              id: msg.id,
              sender: msg.role === 'user' ? 'user' : 'assistant',
              text: msg.content,
              timestamp: msg.created_at,
              status: 'sent',
            })))
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat session:', error)
      }
    }

    initSession()
  }, [isAuthenticated])

  // Send message to KIAAN
  const handleSendMessage = useCallback(async (text: string) => {
    const messageId = uuidv4()
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
          id: data.message_id || uuidv4(),
          sender: 'assistant',
          text: data.response,
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
      <MobileKiaanChat
        messages={messages}
        onSendMessage={handleSendMessage}
        onSaveToJournal={handleSaveToJournal}
        isLoading={isLoading}
        placeholder="Share what's on your mind..."
        className="h-[calc(100vh-80px)]"
      />
    </MobileAppShell>
  )
}
