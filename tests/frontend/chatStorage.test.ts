/**
 * Tests for chatStorage utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadChatMessages,
  saveChatMessages,
  clearChatMessages,
  addChatMessage,
  type ChatMessage,
} from '@/lib/chatStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('chatStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('loadChatMessages', () => {
    it('should return empty array when no messages stored', () => {
      const messages = loadChatMessages()
      expect(messages).toEqual([])
    })

    it('should load stored messages from localStorage', () => {
      const testMessages: ChatMessage[] = [
        { id: '1', sender: 'user', text: 'Hello', timestamp: '2024-01-01' },
        { id: '2', sender: 'assistant', text: 'Hi there', timestamp: '2024-01-01' },
      ]
      localStorageMock.setItem('kiaan-chat-messages', JSON.stringify(testMessages))

      const messages = loadChatMessages()
      expect(messages).toEqual(testMessages)
    })

    it('should return empty array on invalid JSON', () => {
      localStorageMock.setItem('kiaan-chat-messages', 'invalid json')
      const messages = loadChatMessages()
      expect(messages).toEqual([])
    })
  })

  describe('saveChatMessages', () => {
    it('should save messages to localStorage', () => {
      const testMessages: ChatMessage[] = [
        { id: '1', sender: 'user', text: 'Hello', timestamp: '2024-01-01' },
      ]
      saveChatMessages(testMessages)

      const stored = localStorageMock.getItem('kiaan-chat-messages')
      expect(stored).toBeDefined()
      expect(JSON.parse(stored!)).toEqual(testMessages)
    })

    it('should limit stored messages to MAX_MESSAGES', () => {
      const manyMessages: ChatMessage[] = Array.from({ length: 150 }, (_, i) => ({
        id: String(i),
        sender: 'user' as const,
        text: `Message ${i}`,
        timestamp: '2024-01-01',
      }))

      saveChatMessages(manyMessages)

      const stored = JSON.parse(localStorageMock.getItem('kiaan-chat-messages')!)
      expect(stored.length).toBe(100)
      // Should keep the most recent messages
      expect(stored[0].id).toBe('50')
    })
  })

  describe('clearChatMessages', () => {
    it('should remove messages from localStorage', () => {
      const testMessages: ChatMessage[] = [
        { id: '1', sender: 'user', text: 'Hello', timestamp: '2024-01-01' },
      ]
      localStorageMock.setItem('kiaan-chat-messages', JSON.stringify(testMessages))

      clearChatMessages()

      const stored = localStorageMock.getItem('kiaan-chat-messages')
      expect(stored).toBeNull()
    })
  })

  describe('addChatMessage', () => {
    it('should add message and return updated list', () => {
      const newMessage: ChatMessage = {
        id: '1',
        sender: 'user',
        text: 'Hello',
        timestamp: '2024-01-01',
      }

      const messages = addChatMessage(newMessage)

      expect(messages).toEqual([newMessage])
      const stored = JSON.parse(localStorageMock.getItem('kiaan-chat-messages')!)
      expect(stored).toEqual([newMessage])
    })

    it('should append to existing messages', () => {
      const existingMessage: ChatMessage = {
        id: '1',
        sender: 'user',
        text: 'Hello',
        timestamp: '2024-01-01',
      }
      localStorageMock.setItem('kiaan-chat-messages', JSON.stringify([existingMessage]))

      const newMessage: ChatMessage = {
        id: '2',
        sender: 'assistant',
        text: 'Hi',
        timestamp: '2024-01-01',
      }

      const messages = addChatMessage(newMessage)

      expect(messages).toEqual([existingMessage, newMessage])
    })
  })
})
