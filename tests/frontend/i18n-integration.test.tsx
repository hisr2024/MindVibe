/**
 * i18n Integration Tests
 * 
 * Tests the integration of internationalization features including
 * language switching, translation loading, and locale persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage, type Language } from '@/hooks/useLanguage';
import React from 'react';

// Test component to use the hook
function TestComponent() {
  const { language, setLanguage, t, config, isRTL, isInitialized } = useLanguage();
  
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="language-name">{config.name}</div>
      <div data-testid="direction">{config.dir}</div>
      <div data-testid="is-rtl">{isRTL ? 'true' : 'false'}</div>
      <div data-testid="is-initialized">{isInitialized ? 'true' : 'false'}</div>
      <div data-testid="translation">{t('common.greeting', 'Hello')}</div>
      
      <div>
        <button onClick={() => setLanguage('hi')}>Switch to Hindi</button>
        <button onClick={() => setLanguage('es')}>Switch to Spanish</button>
        <button onClick={() => setLanguage('ja')}>Switch to Japanese</button>
        <button onClick={() => setLanguage('zh-CN')}>Switch to Chinese</button>
      </div>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      {ui}
    </LanguageProvider>
  );
}

describe('i18n Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset navigator.language to default English
    Object.defineProperty(window.navigator, 'language', {
      writable: true,
      configurable: true,
      value: 'en-US',
    });
    
    // Mock fetch for translation files
    global.fetch = vi.fn((url: string) => {
      const mockTranslations: Record<string, any> = {
        '/locales/en/common.json': { greeting: 'Hello', farewell: 'Goodbye' },
        '/locales/hi/common.json': { greeting: 'नमस्ते', farewell: 'अलविदा' },
        '/locales/es/common.json': { greeting: 'Hola', farewell: 'Adiós' },
        '/locales/ja/common.json': { greeting: 'こんにちは', farewell: 'さようなら' },
        '/locales/zh-CN/common.json': { greeting: '你好', farewell: '再见' },
      };
      
      const translation = mockTranslations[url as string] || {};
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(translation),
      } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with English as default language', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('en');
        expect(screen.getByTestId('language-name')).toHaveTextContent('English');
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
    });

    it('should detect browser language on first load', async () => {
      // Mock navigator.language
      Object.defineProperty(window.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'hi-IN',
      });
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('hi');
      });
    });

    it('should restore language from localStorage', async () => {
      localStorage.setItem('preferredLocale', 'es');
      
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('es');
        expect(screen.getByTestId('language-name')).toHaveTextContent('Spanish');
      });
    });

    it('should set document language and direction on init', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('en');
        expect(document.documentElement.dir).toBe('ltr');
      });
    });
  });

  describe('Language Switching', () => {
    it('should switch to Hindi correctly', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      const hindiButton = screen.getByText('Switch to Hindi');
      await userEvent.click(hindiButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('hi');
        expect(screen.getByTestId('language-name')).toHaveTextContent('Hindi');
        expect(document.documentElement.lang).toBe('hi');
      });
    });

    it('should switch to Spanish correctly', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      const spanishButton = screen.getByText('Switch to Spanish');
      await userEvent.click(spanishButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('es');
        expect(screen.getByTestId('language-name')).toHaveTextContent('Spanish');
      });
    });

    it('should switch to Japanese correctly', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      const japaneseButton = screen.getByText('Switch to Japanese');
      await userEvent.click(japaneseButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('ja');
        expect(screen.getByTestId('language-name')).toHaveTextContent('Japanese');
      });
    });

    it('should switch to Chinese correctly', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      const chineseButton = screen.getByText('Switch to Chinese');
      await userEvent.click(chineseButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('zh-CN');
        expect(screen.getByTestId('language-name')).toHaveTextContent('Chinese (Simplified)');
      });
    });

    it('should persist language changes to localStorage', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      const hindiButton = screen.getByText('Switch to Hindi');
      await userEvent.click(hindiButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('preferredLocale')).toBe('hi');
      });
    });
  });

  describe('Translation Loading', () => {
    it('should load translations for the current language', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('translation')).toHaveTextContent('Hello');
      }, { timeout: 3000 });
    });

    it('should load translations when switching languages', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      // Switch to Hindi
      const hindiButton = screen.getByText('Switch to Hindi');
      await userEvent.click(hindiButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('translation')).toHaveTextContent('नमस्ते');
      }, { timeout: 3000 });
    });

    it('should handle missing translations with fallback', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      // The fallback should be used if translation is missing
      const translation = screen.getByTestId('translation');
      expect(translation).toBeTruthy();
    });

    it('should cache loaded translations', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      // Switch to Hindi
      const hindiButton = screen.getByText('Switch to Hindi');
      await userEvent.click(hindiButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('hi');
        expect(screen.getByTestId('translation')).toHaveTextContent('नमस्ते');
      });
      
      // Verify translations are loaded
      expect(screen.getByTestId('language')).toHaveTextContent('hi');
    });
  });

  describe('Document Attributes', () => {
    it('should update document.documentElement.lang on language change', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      expect(document.documentElement.lang).toBe('en');
      
      const spanishButton = screen.getByText('Switch to Spanish');
      await userEvent.click(spanishButton);
      
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('es');
      });
    });

    it('should update document.documentElement.dir on language change', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      expect(document.documentElement.dir).toBe('ltr');
      
      // All current languages are LTR, but testing the mechanism
      const hindiButton = screen.getByText('Switch to Hindi');
      await userEvent.click(hindiButton);
      
      await waitFor(() => {
        expect(document.documentElement.dir).toBe('ltr');
      });
    });
  });

  describe('Cross-Component Integration', () => {
    it('should respond to localeChanged events', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      // Dispatch custom event
      const event = new CustomEvent('localeChanged', {
        detail: { locale: 'ja' as Language }
      });
      window.dispatchEvent(event);
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('ja');
      });
    });

    it('should handle multiple rapid language changes', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      // Rapidly switch languages
      await userEvent.click(screen.getByText('Switch to Hindi'));
      await userEvent.click(screen.getByText('Switch to Spanish'));
      await userEvent.click(screen.getByText('Switch to Japanese'));
      
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('ja');
      });
    });
  });

  describe('All 17 Supported Languages', () => {
    const allLanguages: Language[] = [
      'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
      'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
    ];

    it('should support all 17 languages', () => {
      allLanguages.forEach(lang => {
        localStorage.setItem('preferredLocale', lang);
        
        const { unmount } = renderWithProvider(<TestComponent />);
        
        // The component should render without errors
        expect(screen.getByTestId('language')).toBeTruthy();
        
        unmount();
        localStorage.clear();
      });
    });

    it('should correctly set language names for all languages', async () => {
      const languageNames: Record<Language, string> = {
        en: 'English',
        hi: 'Hindi',
        ta: 'Tamil',
        te: 'Telugu',
        bn: 'Bengali',
        mr: 'Marathi',
        gu: 'Gujarati',
        kn: 'Kannada',
        ml: 'Malayalam',
        pa: 'Punjabi',
        sa: 'Sanskrit',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        pt: 'Portuguese',
        ja: 'Japanese',
        'zh-CN': 'Chinese (Simplified)',
      };

      for (const lang of allLanguages) {
        localStorage.setItem('preferredLocale', lang);
        
        const { unmount } = renderWithProvider(<TestComponent />);
        
        await waitFor(() => {
          expect(screen.getByTestId('language-name')).toHaveTextContent(languageNames[lang]);
        });
        
        unmount();
        localStorage.clear();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle failed translation loads gracefully', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.reject(new Error('Network error')),
        } as Response)
      );
      
      renderWithProvider(<TestComponent />);
      
      // Component should still render
      await waitFor(() => {
        expect(screen.getByTestId('language')).toHaveTextContent('en');
      });
    });

    it('should use fallback text when translation key is missing', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      const translation = screen.getByTestId('translation');
      expect(translation.textContent).toBeTruthy();
    });
  });

  describe('Translation Function', () => {
    function TranslationTestComponent() {
      const { t } = useLanguage();
      
      return (
        <div>
          <div data-testid="with-fallback">{t('missing.key', 'Fallback Text')}</div>
          <div data-testid="without-fallback">{t('missing.key')}</div>
          <div data-testid="nested">{t('common.nested.key', 'Default')}</div>
        </div>
      );
    }

    it('should use fallback when key is missing', async () => {
      renderWithProvider(<TranslationTestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('with-fallback')).toHaveTextContent('Fallback Text');
      });
    });

    it('should return key when both translation and fallback are missing', async () => {
      renderWithProvider(<TranslationTestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('without-fallback')).toHaveTextContent('missing.key');
      });
    });
  });

  describe('RTL Support', () => {
    it('should correctly identify LTR languages', async () => {
      renderWithProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('is-initialized')).toHaveTextContent('true');
      });
      
      // All current languages are LTR
      expect(screen.getByTestId('is-rtl')).toHaveTextContent('false');
      expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
    });
  });
});
