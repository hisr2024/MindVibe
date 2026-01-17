/**
 * TranslationService - Multi-language translation service for KIAAN Chat
 * 
 * This service integrates with Google Translate and LibreTranslate APIs
 * with caching, exponential backoff retry logic, rate limiting, and error handling.
 */

import axios, { AxiosError } from 'axios';

// Types
export interface TranslationResult {
  success: boolean;
  translatedText: string;
  originalText: string;
  sourceLang: string;
  targetLang: string;
  provider?: string;
  error?: string;
  cached?: boolean;
}

export interface TranslationOptions {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

export interface TranslationCacheEntry {
  translatedText: string;
  timestamp: number;
  provider: string;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

// Configuration
const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
  'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'
];

const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_SIZE = 1000;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export class TranslationService {
  private cache: Map<string, TranslationCacheEntry>;
  private rateLimitState: RateLimitState;
  private enabled: boolean;

  constructor() {
    this.cache = new Map();
    this.rateLimitState = {
      count: 0,
      resetTime: Date.now() + RATE_LIMIT_WINDOW_MS
    };
    this.enabled = true;

    // Load cache from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadCacheFromStorage();
    }
  }

  /**
   * Check if a language is supported
   */
  public isSupportedLanguage(lang: string): boolean {
    return SUPPORTED_LANGUAGES.includes(lang);
  }

  /**
   * Get list of supported languages
   */
  public getSupportedLanguages(): string[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Main translation method with retry logic and fallback
   */
  public async translate(options: TranslationOptions): Promise<TranslationResult> {
    const { text, targetLang, sourceLang = 'en' } = options;

    // Validate input
    if (!text || text.trim().length === 0) {
      return this.createErrorResult(text, sourceLang, targetLang, 'Empty text provided');
    }

    // Check if source and target are the same
    if (sourceLang === targetLang) {
      return {
        success: true,
        translatedText: text,
        originalText: text,
        sourceLang,
        targetLang,
        provider: 'none'
      };
    }

    // Validate target language
    if (!this.isSupportedLanguage(targetLang)) {
      return this.createErrorResult(text, sourceLang, targetLang, `Unsupported target language: ${targetLang}`);
    }

    // Check if service is enabled
    if (!this.enabled) {
      return this.createErrorResult(text, sourceLang, targetLang, 'Translation service is disabled');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return {
        success: true,
        translatedText: cachedResult.translatedText,
        originalText: text,
        sourceLang,
        targetLang,
        provider: cachedResult.provider,
        cached: true
      };
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      return this.createErrorResult(text, sourceLang, targetLang, 'Rate limit exceeded. Please try again later.');
    }

    // Try translation with retries
    try {
      const result = await this.translateWithRetry(text, sourceLang, targetLang);
      
      // Cache successful result
      if (result.success && result.translatedText) {
        this.addToCache(cacheKey, {
          translatedText: result.translatedText,
          timestamp: Date.now(),
          provider: result.provider || 'unknown'
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown translation error';
      return this.createErrorResult(text, sourceLang, targetLang, errorMessage);
    }
  }

  /**
   * Translation with exponential backoff retry logic
   */
  private async translateWithRetry(
    text: string,
    sourceLang: string,
    targetLang: string,
    attempt: number = 0
  ): Promise<TranslationResult> {
    try {
      // Try backend API first (which uses Google Translate)
      const result = await this.translateViaBackend(text, sourceLang, targetLang);
      return result;
    } catch (error) {
      // If we haven't exhausted retries, try again with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await this.sleep(delay);
        return this.translateWithRetry(text, sourceLang, targetLang, attempt + 1);
      }

      // All retries exhausted
      throw error;
    }
  }

  /**
   * Translate via backend API
   */
  private async translateViaBackend(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await axios.post(
        `${apiUrl}/translation/translate`,
        {
          text,
          source_lang: sourceLang,
          target_lang: targetLang
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          translatedText: response.data.translated_text || text,
          originalText: text,
          sourceLang,
          targetLang,
          provider: response.data.provider || 'backend'
        };
      }

      throw new Error(response.data?.error || 'Translation failed');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(axiosError.message || 'Network error during translation');
      }
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset if window has passed
    if (now >= this.rateLimitState.resetTime) {
      this.rateLimitState.count = 0;
      this.rateLimitState.resetTime = now + RATE_LIMIT_WINDOW_MS;
    }

    // Check if under limit
    if (this.rateLimitState.count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    // Increment counter
    this.rateLimitState.count++;
    return true;
  }

  /**
   * Cache management
   */
  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    // Use first 100 chars for cache key to handle long texts
    const textKey = text.substring(0, 100);
    return `${sourceLang}:${targetLang}:${textKey}`;
  }

  private getFromCache(key: string): TranslationCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private addToCache(key: string, entry: TranslationCacheEntry): void {
    // Implement LRU: if cache is full, remove oldest entry
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, entry);
    this.saveCacheToStorage();
  }

  /**
   * Persistent storage (localStorage)
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('translation_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const cacheObject = Object.fromEntries(this.cache.entries());
        localStorage.setItem('translation_cache', JSON.stringify(cacheObject));
      }
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }

  /**
   * Cache management methods
   */
  public clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('translation_cache');
    }
  }

  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE
    };
  }

  /**
   * Enable/disable service
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Helper methods
   */
  private createErrorResult(
    text: string,
    sourceLang: string,
    targetLang: string,
    error: string
  ): TranslationResult {
    return {
      success: false,
      translatedText: text,
      originalText: text,
      sourceLang,
      targetLang,
      error
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let translationServiceInstance: TranslationService | null = null;

export function getTranslationService(): TranslationService {
  if (!translationServiceInstance) {
    translationServiceInstance = new TranslationService();
  }
  return translationServiceInstance;
}

export default TranslationService;
