'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh-CN'

export interface LanguageConfig {
  code: Language
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
}

const STORAGE_KEY = 'mindvibe_language'

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

const LanguageContext = createContext<LanguageContextType | null>(null)

// Cache for loaded translations
const translationCache: Map<Language, TranslationObject> = new Map()

function detectLanguageFromLocale(): Language {
  if (typeof window === 'undefined') return 'en'
  
  const locale = navigator.language || ''
  const langCode = locale.split('-')[0]
  
  // Direct matches
  if (locale === 'zh-CN' || locale === 'zh-Hans') return 'zh-CN'
  if (langCode === 'hi') return 'hi'
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [translations, setTranslations] = useState<TranslationObject>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Load translations for a language
  const loadTranslations = useCallback(async (lang: Language) => {
    // Check cache first
    if (translationCache.has(lang)) {
      setTranslations(translationCache.get(lang)!)
      return
    }

    try {
      const response = await fetch(`/locales/${lang}/common.json`)
      if (response.ok) {
        const data = await response.json() as TranslationObject
        translationCache.set(lang, data)
        setTranslations(data)
      }
    } catch {
      console.warn(`Failed to load translations for ${lang}, using fallback`)
      // Fallback to English
      if (lang !== 'en') {
        await loadTranslations('en')
      }
    }
  }, [])

  // Initialize language from localStorage or auto-detect
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    const initialLang = stored && LANGUAGES[stored] ? stored : detectLanguageFromLocale()
    
    setLanguageState(initialLang)
    localStorage.setItem(STORAGE_KEY, initialLang)
    
    // Apply RTL direction if needed
    const dir = LANGUAGES[initialLang].dir
    document.documentElement.dir = dir
    document.documentElement.lang = initialLang
    
    loadTranslations(initialLang).then(() => {
      setIsInitialized(true)
    })
  }, [loadTranslations])

  const setLanguage = useCallback(async (newLang: Language) => {
    setLanguageState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
    
    // Apply RTL direction
    const dir = LANGUAGES[newLang].dir
    document.documentElement.dir = dir
    document.documentElement.lang = newLang
    
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
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default useLanguage
