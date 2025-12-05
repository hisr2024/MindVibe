'use client'

import { LANGUAGES, type Language, useLanguage } from '@/hooks/useLanguage'

interface LanguageSelectorProps {
  className?: string
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()

  // Extended languages for the settings page
  const availableLanguages: Array<{
    code: Language
    name: string
    nativeName: string
  }> = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  ]

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              language === lang.code
                ? 'border-orange-400 bg-orange-500/10'
                : 'border-orange-500/15 bg-black/20 hover:bg-orange-500/5'
            }`}
            aria-pressed={language === lang.code}
          >
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg font-semibold ${
                language === lang.code
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-orange-500/10 text-orange-100/60'
              }`}
            >
              {lang.code.toUpperCase().slice(0, 2)}
            </div>
            <div className="text-left">
              <p
                className={`text-sm font-medium ${
                  language === lang.code ? 'text-orange-50' : 'text-orange-100/80'
                }`}
              >
                {lang.name}
              </p>
              <p className="text-xs text-orange-100/50">{lang.nativeName}</p>
            </div>
            {language === lang.code && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto text-orange-400"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-orange-100/50 mt-3">
        Language preference is saved locally and will be applied across all pages.
      </p>
    </div>
  )
}

export default LanguageSelector
