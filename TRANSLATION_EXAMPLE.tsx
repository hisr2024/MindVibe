// Example Component Using Translations
// This file demonstrates how to add translation support to any component

'use client';

import { useLanguage } from '@/hooks/useLanguage';

/**
 * Example component showing proper translation integration
 */
export function ExampleTranslatedComponent() {
  // 1. Import and use the useLanguage hook
  const { t, isInitialized, language } = useLanguage();

  // 2. Show loading state while translations load (optional but recommended)
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-orange-100">Loading...</div>
      </div>
    );
  }

  // 3. Use the t() function to get translated text
  // Format: t('namespace.section.key', 'Fallback English Text')
  return (
    <div className="space-y-4 p-6">
      {/* Basic translation */}
      <h1 className="text-2xl font-bold">
        {t('example.title', 'Welcome to the Example')}
      </h1>

      {/* Translation with nested keys */}
      <p className="text-base">
        {t('example.content.description', 'This is an example description that will be translated.')}
      </p>

      {/* Button text translation */}
      <button className="rounded-lg bg-orange-500 px-4 py-2 text-white">
        {t('common.buttons.getStarted', 'Get Started')}
      </button>

      {/* Multiple translations in one component */}
      <div className="rounded-lg border border-orange-500/20 bg-white/5 p-4">
        <h2 className="text-lg font-semibold">
          {t('example.features.title', 'Features')}
        </h2>
        <ul className="mt-2 space-y-2">
          <li>{t('example.features.item1', 'Easy to use')}</li>
          <li>{t('example.features.item2', 'Fast and reliable')}</li>
          <li>{t('example.features.item3', 'Privacy-focused')}</li>
        </ul>
      </div>

      {/* Display current language (for debugging) */}
      <div className="text-sm text-orange-100/60">
        Current language: {language}
      </div>
    </div>
  );
}

/**
 * Corresponding translation JSON structure:
 * 
 * // locales/en/example.json
 * {
 *   "title": "Welcome to the Example",
 *   "content": {
 *     "description": "This is an example description that will be translated."
 *   },
 *   "features": {
 *     "title": "Features",
 *     "item1": "Easy to use",
 *     "item2": "Fast and reliable",
 *     "item3": "Privacy-focused"
 *   }
 * }
 * 
 * // locales/hi/example.json
 * {
 *   "title": "उदाहरण में आपका स्वागत है",
 *   "content": {
 *     "description": "यह एक उदाहरण विवरण है जिसका अनुवाद किया जाएगा।"
 *   },
 *   "features": {
 *     "title": "विशेषताएं",
 *     "item1": "उपयोग में आसान",
 *     "item2": "तेज़ और विश्वसनीय",
 *     "item3": "गोपनीयता-केंद्रित"
 *   }
 * }
 */

// Best Practices:
// 1. Always provide fallback text in English
// 2. Use descriptive translation keys (namespace.section.key format)
// 3. Handle loading state with isInitialized
// 4. Group related translations in the same namespace
// 5. Keep translation keys consistent across all language files
// 6. Test with multiple languages to ensure proper display
