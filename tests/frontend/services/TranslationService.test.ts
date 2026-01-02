/**
 * Tests for TranslationService
 */

import { TranslationService, getTranslationService } from '@/services/TranslationService';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    service = new TranslationService();
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Language Support', () => {
    it('should identify supported languages correctly', () => {
      expect(service.isSupportedLanguage('en')).toBe(true);
      expect(service.isSupportedLanguage('es')).toBe(true);
      expect(service.isSupportedLanguage('hi')).toBe(true);
      expect(service.isSupportedLanguage('invalid')).toBe(false);
    });

    it('should return list of supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toBeInstanceOf(Array);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
    });
  });

  describe('Translation', () => {
    it('should return error for empty text', async () => {
      const result = await service.translate({
        text: '',
        targetLang: 'es'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty text provided');
    });

    it('should return original text when source and target are same', async () => {
      const text = 'Hello world';
      const result = await service.translate({
        text,
        targetLang: 'en',
        sourceLang: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.translatedText).toBe(text);
      expect(result.provider).toBe('none');
    });

    it('should return error for unsupported language', async () => {
      const result = await service.translate({
        text: 'Hello',
        targetLang: 'invalid'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported target language');
    });

    it('should handle disabled service', async () => {
      service.setEnabled(false);
      
      const result = await service.translate({
        text: 'Hello',
        targetLang: 'es'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Translation service is disabled');
    });
  });

  describe('Cache Management', () => {
    it('should initialize with empty cache', () => {
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache successfully', () => {
      // Manually add something to cache
      service['cache'].set('test', {
        translatedText: 'test',
        timestamp: Date.now(),
        provider: 'test'
      });

      expect(service.getCacheStats().size).toBe(1);
      
      service.clearCache();
      
      expect(service.getCacheStats().size).toBe(0);
    });

    it('should return cache stats', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });
  });

  describe('Enable/Disable', () => {
    it('should be enabled by default', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should allow disabling service', () => {
      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);
    });

    it('should allow enabling service', () => {
      service.setEnabled(false);
      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('Singleton Instance', () => {
    it('should return same instance', () => {
      const instance1 = getTranslationService();
      const instance2 = getTranslationService();
      expect(instance1).toBe(instance2);
    });
  });
});
