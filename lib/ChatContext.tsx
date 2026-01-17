'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loadChatMessages, saveChatMessages, clearChatMessages, ChatMessage } from '@/lib/chatStorage'

interface ChatContextValue {
  messages: ChatMessage[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = loadChatMessages()
    setMessages(stored)
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatMessages(messages)
    }
  }, [messages])

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }

  const handleClearMessages = () => {
    setMessages([])
    clearChatMessages()
  }

  return (
    <ChatContext.Provider 
      value={{ 
        messages, 
        isOpen, 
        setIsOpen, 
        addMessage, 
        clearMessages: handleClearMessages 
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
