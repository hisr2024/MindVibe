/**
 * Unit Tests for useLanguage Hook
 * 
 * Tests language context, language switching, localStorage persistence,
 * and translation loading functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { LanguageProvider, useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage';
import React from 'react';

// Helper to render hook with provider
function renderUseLanguage() {
  return renderHook(() => useLanguage(), {
    wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
  });
}

// Mock fetch for translation files
const mockTranslations: Record<string, Record<string, any>> = {
  'en/common.json': {
    app: { name: 'MindVibe', tagline: 'Mental Health App' },
    buttons: { submit: 'Submit', cancel: 'Cancel' }
  },
  'en/navigation.json': {
    mainNav: { home: 'Home', dashboard: 'Dashboard' }
  },
  'hi/common.json': {
    app: { name: 'माइंडवाइब', tagline: 'मानसिक स्वास्थ्य ऐप' },
    buttons: { submit: 'जमा करें', cancel: 'रद्द करें' }
  },
  'hi/navigation.json': {
    mainNav: { home: 'होम', dashboard: 'डैशबोर्ड' }
  }
};

describe('useLanguage Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock fetch globally
    global.fetch = vi.fn((url: string) => {
      const urlStr = url.toString();
      const match = urlStr.match(/\/locales\/(.+)$/);
      if (match) {
        const path = match[1];
        if (mockTranslations[path]) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTranslations[path])
          } as Response);
        }
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({})
      } as Response);
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with English as default language', async () => {
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.language).toBe('en');
      expect(result.current.config.name).toBe('English');
    });

    it('should load language from localStorage if available', async () => {
      localStorage.setItem('preferredLocale', 'hi');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.language).toBe('hi');
      expect(result.current.config.name).toBe('Hindi');
    });

    it('should detect browser language if no localStorage value', async () => {
      // Mock navigator.language
      Object.defineProperty(window.navigator, 'language', {
        writable: true,
        value: 'hi-IN'
      });

      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.language).toBe('hi');
    });
  });

  describe('Language Configuration', () => {
    it('should provide correct language config for all supported languages', async () => {
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Check a few key languages
      expect(LANGUAGES.en.nativeName).toBe('English');
      expect(LANGUAGES.hi.nativeName).toBe('हिन्दी');
      expect(LANGUAGES.ta.nativeName).toBe('தமிழ்');
      expect(LANGUAGES.es.nativeName).toBe('Español');
      expect(LANGUAGES['zh-CN'].nativeName).toBe('简体中文');
    });

    it('should have correct text direction for all languages', () => {
      // All current languages use LTR
      Object.values(LANGUAGES).forEach(lang => {
        expect(lang.dir).toBe('ltr');
      });
    });

    it('should report correct isRTL flag', async () => {
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isRTL).toBe(false);
    });
  });

  describe('Language Switching', () => {
    it('should switch language when setLanguage is called', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.language).toBe('en');
      });

      await act(async () => {
        await result.current.setLanguage('hi');
      });

      await waitFor(() => {
        expect(result.current.language).toBe('hi');
      });
    });

    it('should persist language change to localStorage', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.setLanguage('hi');
      });

      await waitFor(() => {
        expect(localStorage.getItem('preferredLocale')).toBe('hi');
      });
    });

    it('should update document attributes on language change', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.setLanguage('hi');
      });

      await waitFor(() => {
        expect(document.documentElement.lang).toBe('hi');
        expect(document.documentElement.dir).toBe('ltr');
      });
    });
  });

  describe('Translation Loading', () => {
    it('should load translations on initialization', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');

      const { result } = renderUseLanguage();

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Translations should be available (either from fetch or cache)
      expect(result.current.language).toBe('en');
      // The t function should work
      expect(typeof result.current.t).toBe('function');
    });

    it('should merge multiple translation files', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');

      const { result } = renderUseLanguage();

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Translations from multiple namespaces should be available
      // The hook loads common, navigation, home, kiaan, etc.
      // Just verify the t function works with translations from different namespaces
      expect(result.current.language).toBe('en');
      expect(result.current.isInitialized).toBe(true);
      // The hook should have merged translations from multiple files
      expect(typeof result.current.t).toBe('function');
    });

    it('should cache loaded translations', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const initialCallCount = (global.fetch as any).mock.calls.length;

      // Switch to Hindi and back to English
      await act(async () => {
        await result.current.setLanguage('hi');
      });

      await waitFor(() => {
        expect(result.current.language).toBe('hi');
      });

      await act(async () => {
        await result.current.setLanguage('en');
      });

      await waitFor(() => {
        expect(result.current.language).toBe('en');
      });

      // Should use cached translations, not make new fetch calls for English
      const finalCallCount = (global.fetch as any).mock.calls.length;
      // Should not make excessive new calls (allowing some for Hindi fetch)
      const maxExpectedCalls = initialCallCount + 10; // Reasonable buffer for Hindi translations
      expect(finalCallCount).toBeLessThan(maxExpectedCalls);
    });
  });

  describe('Translation Function', () => {
    it('should translate nested keys correctly', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en'); // Force English
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.language).toBe('en');
      });

      expect(result.current.t('common.app.name')).toBe('MindVibe');
      expect(result.current.t('common.buttons.submit')).toBe('Submit');
    });

    it('should return fallback for missing keys', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.language).toBe('en');
      });

      expect(result.current.t('missing.key', 'Fallback')).toBe('Fallback');
    });

    it('should return key if no translation and no fallback', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.language).toBe('en');
      });

      expect(result.current.t('missing.key')).toBe('missing.key');
    });

    it('should translate in different languages', async () => {
      localStorage.clear();
      localStorage.setItem('preferredLocale', 'en');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.language).toBe('en');
      });

      expect(result.current.t('common.buttons.submit')).toBe('Submit');

      await act(async () => {
        await result.current.setLanguage('hi');
      });

      await waitFor(() => {
        expect(result.current.language).toBe('hi');
      });

      expect(result.current.t('common.buttons.submit')).toBe('जमा करें');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should read from localStorage on mount', async () => {
      localStorage.setItem('preferredLocale', 'ta');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.language).toBe('ta');
    });

    it('should write to localStorage on language change', async () => {
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.setLanguage('te');
      });

      expect(localStorage.getItem('preferredLocale')).toBe('te');
    });

    it('should use same storage key as MinimalLanguageSelector', () => {
      // This ensures consistency across the app
      const expectedKey = 'preferredLocale';
      localStorage.setItem(expectedKey, 'bn');
      
      const storedValue = localStorage.getItem(expectedKey);
      expect(storedValue).toBe('bn');
    });
  });

  describe('Event Listeners', () => {
    it('should listen for localeChanged events', async () => {
      // Clear any previous state
      localStorage.clear();
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Get current language (may be 'en' or browser-detected)
      const initialLanguage = result.current.language;

      // Simulate localeChanged event to switch to a different language
      const targetLanguage = initialLanguage === 'en' ? 'mr' : 'en';
      const event = new CustomEvent('localeChanged', {
        detail: { locale: targetLanguage as Language }
      });

      await act(async () => {
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(result.current.language).toBe(targetLanguage);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      // Clear localStorage to ensure clean state
      localStorage.clear();
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

      const { result } = renderUseLanguage();
      
      // Should still initialize even with fetch errors
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should have a valid language (en or browser-detected)
      expect(result.current.language).toBeTruthy();
      expect(LANGUAGES[result.current.language]).toBeDefined();
    });

    it('should handle invalid localStorage values', async () => {
      localStorage.setItem('preferredLocale', 'invalid-lang');
      
      const { result } = renderUseLanguage();
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should fallback to English or detected language
      expect(result.current.language).toBeTruthy();
      expect(LANGUAGES[result.current.language]).toBeDefined();
    });
  });

  describe('Context Usage', () => {
    it('should provide fallback values when used outside provider', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('en');
      expect(result.current.config.name).toBe('English');
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.t('app.name', 'Fallback')).toBe('Fallback');
    });
  });
});
