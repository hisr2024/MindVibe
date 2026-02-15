'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'

// Align with all 17 languages from i18n.ts
export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'sa' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh-CN'

export interface LanguageConfig {
  code: Language
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr' },
  sa: { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृत', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
}

// Use same storage key as MinimalLanguageSelector for consistency
const STORAGE_KEY = 'preferredLocale'

// Simple translation type - using interface for recursive type
interface TranslationObject {
  [key: string]: string | TranslationObject
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
  config: LanguageConfig
  isRTL: boolean
  isInitialized: boolean
}

const DEFAULT_LANGUAGE: Language = 'en'

const defaultLanguageContext: LanguageContextType = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => undefined,
  t: (key: string, fallback?: string) => fallback ?? key,
  config: LANGUAGES[DEFAULT_LANGUAGE],
  isRTL: false,
  isInitialized: false,
}

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext)

// Cache for loaded translations
const translationCache: Map<Language, TranslationObject> = new Map()

function detectLanguageFromLocale(): Language {
  if (typeof window === 'undefined') return 'en'
  
  const locale = navigator.language || ''
  const langCode = locale.split('-')[0]
  
  // Direct matches
  if (locale === 'zh-CN' || locale === 'zh-Hans') return 'zh-CN'
  if (langCode === 'hi') return 'hi'
  if (langCode === 'ta') return 'ta'
  if (langCode === 'te') return 'te'
  if (langCode === 'bn') return 'bn'
  if (langCode === 'mr') return 'mr'
  if (langCode === 'gu') return 'gu'
  if (langCode === 'kn') return 'kn'
  if (langCode === 'ml') return 'ml'
  if (langCode === 'pa') return 'pa'
  if (langCode === 'sa') return 'sa'
  if (langCode === 'es') return 'es'
  if (langCode === 'fr') return 'fr'
  if (langCode === 'de') return 'de'
  if (langCode === 'pt') return 'pt'
  if (langCode === 'ja') return 'ja'
  
  return 'en'
}

// Get nested value from object by dot-separated key
function getNestedValue(obj: TranslationObject, key: string): string | undefined {
  const keys = key.split('.')
  let current: unknown = obj
  
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[k]
  }
  
  return typeof current === 'string' ? current : undefined
}

const LANGUAGE_SOURCE_ATTR = 'languageSource'
const CLIENT_LANGUAGE_SOURCE = 'client'

// Get initial language synchronously - runs during component initialization
function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  try {
    // First check localStorage for persisted preference
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    if (stored && LANGUAGES[stored]) {
      return stored
    }

    // Then check if the inline script already set a language on the document
    const docLang = document.documentElement.lang as Language
    const langSource = document.documentElement.dataset[LANGUAGE_SOURCE_ATTR]
    if (langSource !== CLIENT_LANGUAGE_SOURCE && docLang && LANGUAGES[docLang]) {
      return docLang
    }

    // Fall back to browser detection
    return detectLanguageFromLocale()
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with the correct language synchronously to avoid flash
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)
  const [translations, setTranslations] = useState<TranslationObject>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Use a ref for recursive calls to avoid self-reference before declaration
  const loadTranslationsRef = useRef<((lang: Language) => Promise<void>) | null>(null)

  // Load translations for a language
  const loadTranslations = useCallback(async (lang: Language) => {
    // Check cache first
    if (translationCache.has(lang)) {
      setTranslations(translationCache.get(lang)!)
      return
    }

    try {
      // Load all translation files and merge them
      const files = ['common', 'home', 'kiaan', 'navigation', 'dashboard', 'features', 'errors']
      const results = await Promise.allSettled(
        files.map(file => fetch(`/locales/${lang}/${file}.json`).then(r => {
          if (!r.ok) {
            return {}
          }
          return r.json()
        }))
      )

      // Merge all translation files into one object
      const merged: TranslationObject = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const fileName = files[index]
          merged[fileName] = result.value
        }
      })

      translationCache.set(lang, merged)
      setTranslations(merged)
    } catch (error) {
      console.error(`[useLanguage] Error loading translations for ${lang}:`, error)
      // Fallback to English
      if (lang !== 'en') {
        await loadTranslationsRef.current?.('en')
      }
    }
  }, [])

  // Keep the ref in sync with the latest loadTranslations callback
  loadTranslationsRef.current = loadTranslations

  // Initialize on mount - sync document attributes and load translations
  useEffect(() => {
    // Ensure localStorage is synced with the initial language
    localStorage.setItem(STORAGE_KEY, language)

    // Apply RTL direction if needed
    const dir = LANGUAGES[language].dir
    document.documentElement.dir = dir
    document.documentElement.lang = language
    document.documentElement.dataset[LANGUAGE_SOURCE_ATTR] = CLIENT_LANGUAGE_SOURCE

    loadTranslations(language).then(() => {
      setIsInitialized(true)
    })
  }, []) // Only run once on mount - language is already set correctly

  const setLanguage = useCallback(async (newLang: Language) => {
    setLanguageState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
    
    // Apply RTL direction
    const dir = LANGUAGES[newLang].dir
    document.documentElement.dir = dir
    document.documentElement.lang = newLang
    document.documentElement.dataset[LANGUAGE_SOURCE_ATTR] = CLIENT_LANGUAGE_SOURCE
    
    await loadTranslations(newLang)
    
    // Announce language change for screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = `Language changed to ${LANGUAGES[newLang].name}`
    document.body.appendChild(announcement)
    setTimeout(() => announcement.remove(), 1000)
  }, [loadTranslations])

  // Listen for locale changes from MinimalLanguageSelector
  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ locale: Language }>
      const newLocale = customEvent.detail.locale
      if (newLocale && LANGUAGES[newLocale]) {
        setLanguage(newLocale)
      }
    }
    
    window.addEventListener('localeChanged', handleLocaleChange)
    return () => window.removeEventListener('localeChanged', handleLocaleChange)
  }, [setLanguage])

  // Translation function
  const t = useCallback((key: string, fallback?: string): string => {
    const value = getNestedValue(translations, key)
    return value ?? fallback ?? key
  }, [translations])

  const config = LANGUAGES[language]
  const isRTL = config.dir === 'rtl'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, config, isRTL, isInitialized }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export default useLanguage
