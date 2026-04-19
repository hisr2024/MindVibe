/**
 * i18n type definitions for Kiaanverse.
 *
 * Locale codes match the 29 supported languages from the MindVibe platform.
 */

export type Locale =
  | 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'sa'
  | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'pl' | 'sv' | 'ru'
  | 'ja' | 'zh-CN' | 'ko' | 'th' | 'vi' | 'id' | 'ar' | 'tr' | 'sw';

export type TranslationNamespace =
  | 'common'
  | 'home'
  | 'kiaan'
  | 'dashboard'
  | 'features'
  | 'navigation'
  | 'errors'
  | 'divine'
  | 'journeys'
  | 'auth'
  | 'tools'
  | 'emotional-reset'
  | 'karma-reset'
  | 'journal'
  | 'sadhana'
  | 'community'
  | 'vibe-player'
  | 'analytics'
  | 'settings';

/** Nested translation messages — supports one level of nesting */
export type TranslationMessages = Record<string, string | Record<string, string>>;

export interface LocaleMetadata {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}
