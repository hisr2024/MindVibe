'use client'

import { LANGUAGES } from '@/lib/i18n/languages'
import { useLanguage, type Language as ContextLanguage } from '@/hooks/useLanguage'

export function LanguageShowcase() {
  // Use the global language context - single source of truth
  const { language, setLanguage } = useLanguage()

  // The current locale comes from the context
  const currentLocale = language
  const selectedLang = language

  const handleLanguageSelect = (langCode: string) => {
    // Use the context's setLanguage which handles:
    // - State update
    // - localStorage persistence
    // - Document lang/dir update
    // - Translation loading
    // No page reload needed - React handles re-render
    setLanguage(langCode as ContextLanguage)
  }

  // Translations object - temporary inline translations for showcase section
  // TODO: Replace with proper i18n hook once next-intl is fully integrated
  const translations: Record<string, { title: string; subtitle: string }> = {
    en: {
      title: 'Available in Your Language',
      subtitle: 'KIAAN speaks your language. Choose from 8+ languages for a personalized experience.'
    },
    hi: {
      title: 'आपकी भाषा में उपलब्ध',
      subtitle: 'KIAAN आपकी भाषा बोलता है। व्यक्तिगत अनुभव के लिए 8+ भाषाओं में से चुनें।'
    },
    es: {
      title: 'Disponible en Tu Idioma',
      subtitle: 'KIAAN habla tu idioma. Elige entre más de 8 idiomas para una experiencia personalizada.'
    },
    fr: {
      title: 'Disponible dans Votre Langue',
      subtitle: 'KIAAN parle votre langue. Choisissez parmi plus de 8 langues pour une expérience personnalisée.'
    },
    de: {
      title: 'In Ihrer Sprache Verfügbar',
      subtitle: 'KIAAN spricht Ihre Sprache. Wählen Sie aus über 8 Sprachen für eine personalisierte Erfahrung.'
    },
    pt: {
      title: 'Disponível no Seu Idioma',
      subtitle: 'KIAAN fala sua língua. Escolha entre mais de 8 idiomas para uma experiência personalizada.'
    },
    ja: {
      title: 'あなたの言語で利用可能',
      subtitle: 'KIAANはあなたの言語を話します。パーソナライズされた体験のために8以上の言語から選択してください。'
    },
    zh: {
      title: '支持您的语言',
      subtitle: 'KIAAN会说您的语言。从8种以上语言中选择以获得个性化体验。'
    },
    ar: {
      title: 'متوفر بلغتك',
      subtitle: 'يتحدث KIAAN لغتك. اختر من بين أكثر من 8 لغات للحصول على تجربة مخصصة.'
    }
  }

  const currentTranslation = translations[currentLocale] || translations.en

  // Helper function to get translated stat labels
  const getStatLabel = (key: 'languages' | 'verses' | 'support'): string => {
    const labels: Record<string, Record<string, string>> = {
      languages: {
        en: 'Languages',
        hi: 'भाषाएँ',
        es: 'Idiomas',
        fr: 'Langues',
        de: 'Sprachen',
        pt: 'Idiomas',
        ja: '言語',
        zh: '语言',
      },
      verses: {
        en: 'Translated Verses',
        hi: 'अनुवादित श्लोक',
        es: 'Versos Traducidos',
        fr: 'Versets Traduits',
        de: 'Übersetzte Verse',
        pt: 'Versos Traduzidos',
        ja: '翻訳された詩',
        zh: '已翻译经文',
      },
      support: {
        en: 'Global Support',
        hi: 'वैश्विक सहायता',
        es: 'Soporte Global',
        fr: 'Support Mondial',
        de: 'Globaler Support',
        pt: 'Suporte Global',
        ja: 'グローバルサポート',
        zh: '全球支持',
      },
    }
    return labels[key][currentLocale] || labels[key].en
  }

  const getInfoText = (): string => {
    const texts: Record<string, string> = {
      en: 'Language selection is saved locally and applied automatically on your next visit.',
      hi: 'भाषा चयन स्थानीय रूप से सहेजा जाता है और आपके अगले दौरे पर स्वचालित रूप से लागू होता है।',
      es: 'La selección de idioma se guarda localmente y se aplica automáticamente en tu próxima visita.',
      fr: 'La sélection de langue est enregistrée localement et appliquée automatiquement lors de votre prochaine visite.',
      de: 'Die Sprachauswahl wird lokal gespeichert und bei Ihrem nächsten Besuch automatisch angewendet.',
      pt: 'A seleção de idioma é salva localmente e aplicada automaticamente na sua próxima visita.',
      ja: '言語選択はローカルに保存され、次回の訪問時に自動的に適用されます。',
      zh: '语言选择保存在本地，下次访问时自动应用。',
    }
    return texts[currentLocale] || texts.en
  }

  return (
    <section className="py-16 px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/15 via-[#ff9933]/10 to-transparent blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-gradient-to-tr from-[#ff9933]/12 via-orange-400/8 to-transparent blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent mb-4">
            {currentTranslation.title}
          </h2>
          <p className="text-orange-100/70 text-base md:text-lg max-w-2xl mx-auto">
            {currentTranslation.subtitle}
          </p>
        </div>

        {/* Language Grid - Excluding Arabic for now as RTL layout requires additional UI adjustments */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
          {LANGUAGES.filter(lang => lang.code !== 'ar').map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`group relative overflow-hidden p-5 md:p-6 rounded-2xl border text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                selectedLang === lang.code
                  ? 'border-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/25'
                  : 'border-orange-500/20 bg-white/5 hover:bg-white/10 hover:border-orange-500/40'
              }`}
              aria-label={`Switch to ${lang.name}`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/20 via-[#ff9933]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${selectedLang === lang.code ? 'opacity-100' : ''}`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {lang.flag}
                </div>
                <div className="font-semibold text-orange-50 text-sm md:text-base mb-1">
                  {lang.nativeName}
                </div>
                <div className="text-xs text-orange-100/60">
                  {lang.name}
                </div>
              </div>

              {/* Selected indicator */}
              {selectedLang === lang.code && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
          <div className="text-center p-4 rounded-2xl bg-white/5 border border-orange-500/20 backdrop-blur">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-[#ffb347] bg-clip-text text-transparent">
              8+
            </div>
            <div className="text-xs md:text-sm text-orange-100/60 mt-1">
              {getStatLabel('languages')}
            </div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white/5 border border-orange-500/20 backdrop-blur">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-[#ffb347] bg-clip-text text-transparent">
              700+
            </div>
            <div className="text-xs md:text-sm text-orange-100/60 mt-1">
              {getStatLabel('verses')}
            </div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white/5 border border-orange-500/20 backdrop-blur">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-[#ffb347] bg-clip-text text-transparent">
              24/7
            </div>
            <div className="text-xs md:text-sm text-orange-100/60 mt-1">
              {getStatLabel('support')}
            </div>
          </div>
        </div>

        {/* Informational note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-orange-100/50 max-w-2xl mx-auto">
            {getInfoText()}
          </p>
        </div>
      </div>
    </section>
  )
}
