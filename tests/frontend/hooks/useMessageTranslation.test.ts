/**
 * Tests for useMessageTranslation Hook
 */

import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useMessageTranslation } from '@/hooks/useMessageTranslation';

// Mock useLanguage hook
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
    isLoading: false,
    error: null,
    supportedLanguages: ['en', 'hi', 'es'],
    isRTL: false,
  }),
}));

// Mock TranslationService
vi.mock('@/services/TranslationService', () => ({
  getTranslationService: () => ({
    translate: vi.fn().mockResolvedValue({
      success: true,
      translatedText: 'Translated text',
      error: null,
    }),
  }),
}));

describe('useMessageTranslation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMessageTranslation({
      messageId: 'test-1',
      originalText: 'Hello world',
      sourceLang: 'en'
    }));

    expect(result.current.translatedText).toBeNull();
    expect(result.current.isTranslating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isTranslated).toBe(false);
  });
});
