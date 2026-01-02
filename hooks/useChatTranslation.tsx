/**
 * Hook for managing translation state in chat messages
 */

import { useState, useCallback } from 'react'
import { ChatMessage, TranslationInfo } from '@/types/chat'
import { useLanguage } from './useLanguage'
import { DEFAULT_LANGUAGE } from '@/lib/constants/languages'

interface UseChatTranslationOptions {
  /**
   * Default preference for showing original vs translated text
   */
  defaultShowOriginal?: boolean
}

export function useChatTranslation(options: UseChatTranslationOptions = {}) {
  const { defaultShowOriginal = false } = options
  const { language } = useLanguage()
  
  // State to track if user wants to see original text
  const [showOriginal, setShowOriginal] = useState(defaultShowOriginal)
  
  /**
   * Toggle between original and translated text
   */
  const toggleOriginal = useCallback(() => {
    setShowOriginal(prev => !prev)
  }, [])
  
  /**
   * Get the display text for a message based on translation preference
   */
  const getDisplayText = useCallback((message: ChatMessage): string => {
    // If no translation or showing original, return original text
    if (!message.translation || showOriginal || !message.translation.success) {
      return message.text
    }
    
    // Return translated text if available
    return message.translation.translated_text || message.text
  }, [showOriginal])
  
  /**
   * Check if a message has a valid translation
   */
  const hasTranslation = useCallback((message: ChatMessage): boolean => {
    return !!(
      message.translation &&
      message.translation.success &&
      message.translation.translated_text &&
      message.translation.target_language !== DEFAULT_LANGUAGE
    )
  }, [])
  
  /**
   * Get translation info for display
   */
  const getTranslationInfo = useCallback((message: ChatMessage): TranslationInfo | null => {
    if (!hasTranslation(message)) {
      return null
    }
    return message.translation || null
  }, [hasTranslation])
  
  /**
   * Check if translation toggle should be shown
   */
  const shouldShowToggle = useCallback((message: ChatMessage): boolean => {
    return language !== DEFAULT_LANGUAGE && hasTranslation(message)
  }, [language, hasTranslation])
  
  return {
    showOriginal,
    setShowOriginal,
    toggleOriginal,
    getDisplayText,
    hasTranslation,
    getTranslationInfo,
    shouldShowToggle,
    currentLanguage: language
  }
}
