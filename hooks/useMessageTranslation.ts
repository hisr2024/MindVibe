/**
 * useMessageTranslation - React Hook for Message Translation
 * 
 * Handles translation of chat messages with loading states, error handling,
 * and caching. Integrates with TranslationService.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getTranslationService, TranslationResult } from '@/services/TranslationService';
import { useLanguage } from '@/hooks/useLanguage';

export interface UseMessageTranslationOptions {
  messageId: string;
  originalText: string;
  sourceLang?: string;
  autoTranslate?: boolean;
}

export interface UseMessageTranslationReturn {
  translatedText: string | null;
  isTranslating: boolean;
  error: string | null;
  isTranslated: boolean;
  translate: () => Promise<void>;
  toggleTranslation: () => void;
  reset: () => void;
}

/**
 * Hook for handling message translation
 */
export function useMessageTranslation(options: UseMessageTranslationOptions): UseMessageTranslationReturn {
  const { messageId: _messageId, originalText, sourceLang = 'en', autoTranslate = false } = options;
  const { language: targetLang } = useLanguage();
  
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const translationService = getTranslationService();

  /**
   * Perform translation
   */
  const translate = useCallback(async () => {
    // Don't translate if already in target language
    if (sourceLang === targetLang) {
      setError('Already in target language');
      return;
    }

    // Don't translate if empty
    if (!originalText || originalText.trim().length === 0) {
      setError('No text to translate');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result: TranslationResult = await translationService.translate({
        text: originalText,
        targetLang,
        sourceLang
      });

      if (result.success) {
        setTranslatedText(result.translatedText);
        setIsTranslated(true);
        setShowTranslation(true);
      } else {
        setError(result.error || 'Translation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown translation error';
      setError(errorMessage);
    } finally {
      setIsTranslating(false);
    }
  }, [originalText, sourceLang, targetLang, translationService]);

  /**
   * Toggle between original and translated text
   */
  const toggleTranslation = useCallback(() => {
    if (!isTranslated) {
      // If not translated yet, perform translation
      translate();
    } else {
      // Toggle display between original and translated
      setShowTranslation(prev => !prev);
    }
  }, [isTranslated, translate]);

  /**
   * Reset translation state
   */
  const reset = useCallback(() => {
    setTranslatedText(null);
    setIsTranslated(false);
    setShowTranslation(false);
    setError(null);
    setIsTranslating(false);
  }, []);

  /**
   * Auto-translate on mount if enabled
   */
  useEffect(() => {
    if (autoTranslate && targetLang !== sourceLang && originalText) {
      translate();
    }
  }, [autoTranslate, targetLang, sourceLang, originalText, translate]);

  // Return the display text based on showTranslation state
  const displayText = showTranslation && translatedText ? translatedText : null;

  return {
    translatedText: displayText,
    isTranslating,
    error,
    isTranslated,
    translate,
    toggleTranslation,
    reset
  };
}

export default useMessageTranslation;
