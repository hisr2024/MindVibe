/**
 * Shared types for chat functionality
 */

/**
 * Translation metadata for a chat message
 */
export interface TranslationInfo {
  original_text: string
  translated_text: string
  target_language: string
  success: boolean
  cached?: boolean
  error?: string
}

/**
 * Chat message with optional translation support
 */
export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status?: 'error'
  summary?: string
  isStreaming?: boolean
  translation?: TranslationInfo
  language?: string
}

/**
 * Response from chat API
 */
export interface ChatAPIResponse {
  status: 'success' | 'error'
  response: string
  bot?: string
  version?: string
  model?: string
  ai_powered?: boolean
  verses_used?: string[]
  validation?: {
    valid: boolean
    errors?: string[]
  }
  language?: string
  translation?: TranslationInfo
  quota?: {
    usage_count: number
    usage_limit: number
    is_unlimited: boolean
  }
  error_code?: string
}

/**
 * Props for translation toggle component
 */
export interface TranslationToggleProps {
  showOriginal: boolean
  onToggle: (showOriginal: boolean) => void
  hasTranslation?: boolean
  className?: string
}
