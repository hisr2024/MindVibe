/**
 * Utility for persisting KIAAN chat state to localStorage
 * Handles saving and loading chat messages across page navigations
 */

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
}

const CHAT_STORAGE_KEY = 'kiaan-chat-messages'
const MAX_MESSAGES = 100 // Limit stored messages to prevent localStorage overflow

/**
 * Load chat messages from localStorage
 */
export function loadChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!stored) return []
    
    const messages = JSON.parse(stored) as ChatMessage[]
    return Array.isArray(messages) ? messages : []
  } catch (error) {
    console.error('Failed to load chat messages:', error)
    return []
  }
}

/**
 * Save chat messages to localStorage
 */
export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  
  try {
    // Keep only the most recent messages to avoid storage limits
    const messagesToSave = messages.slice(-MAX_MESSAGES)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToSave))
  } catch (error) {
    console.error('Failed to save chat messages:', error)
    // If storage is full, try clearing old messages and retry
    try {
      const recentMessages = messages.slice(-50)
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(recentMessages))
    } catch (retryError) {
      console.error('Failed to save chat messages after retry:', retryError)
    }
  }
}

/**
 * Clear all chat messages from localStorage
 */
export function clearChatMessages(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear chat messages:', error)
  }
}

/**
 * Add a new message to the stored chat history
 */
export function addChatMessage(message: ChatMessage): ChatMessage[] {
  const messages = loadChatMessages()
  messages.push(message)
  saveChatMessages(messages)
  return messages
}
