export const locales = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN'] as const;
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
  ja: '日本語',
  'zh-CN': '简体中文',
};

export async function getMessages(locale: Locale) {
  try {
    const [common, kiaan, dashboard, features, navigation, errors] = await Promise.all([
      import(`./locales/${locale}/common.json`),
      import(`./locales/${locale}/kiaan.json`),
      import(`./locales/${locale}/dashboard.json`),
      import(`./locales/${locale}/features.json`),
      import(`./locales/${locale}/navigation.json`),
      import(`./locales/${locale}/errors.json`),
    ]);

    return {
      common: common.default,
      kiaan: kiaan.default,
      dashboard: dashboard.default,
      features: features.default,
      navigation: navigation.default,
      errors: errors.default,
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

