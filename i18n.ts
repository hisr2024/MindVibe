export const locales = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa',
  'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'ru',
  'ja', 'zh-CN', 'ko', 'th', 'vi', 'id',
  'ar', 'tr',
  'sw',
] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  bn: 'বাংলা',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  sa: 'संस्कृत',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  sv: 'Svenska',
  ru: 'Русский',
  ja: '日本語',
  'zh-CN': '简体中文',
  ko: '한국어',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ar: 'العربية',
  tr: 'Türkçe',
  sw: 'Kiswahili',
};

export async function getMessages(locale: Locale) {
  try {
    const [common, home, kiaan, dashboard, features, navigation, errors, divine, journeys, kiaan_divine] = await Promise.all([
      import(`./locales/${locale}/common.json`),
      import(`./locales/${locale}/home.json`),
      import(`./locales/${locale}/kiaan.json`),
      import(`./locales/${locale}/dashboard.json`),
      import(`./locales/${locale}/features.json`),
      import(`./locales/${locale}/navigation.json`),
      import(`./locales/${locale}/errors.json`),
      import(`./locales/${locale}/divine.json`),
      import(`./locales/${locale}/journeys.json`),
      import(`./locales/${locale}/kiaan_divine.json`),
    ]);

    return {
      common: common.default,
      home: home.default,
      kiaan: kiaan.default,
      dashboard: dashboard.default,
      features: features.default,
      navigation: navigation.default,
      errors: errors.default,
      divine: divine.default,
      journeys: journeys.default,
      kiaan_divine: kiaan_divine.default,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to English
    if (locale !== 'en') {
      return getMessages('en');
    }
    throw error;
  }
}

