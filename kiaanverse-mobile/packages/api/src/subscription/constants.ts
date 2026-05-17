/**
 * KIAAN Subscription Constants — 4-Tier Model (March 2026)
 *
 * Aligned with the backend SubscriptionTier enum and web pricing page.
 *
 * Tier structure:
 * - Seeker (FREE): 5 KIAAN questions/month, 1 Wisdom Journey
 * - Bhakta ($6.99/mo | $47.99/yr): 50 questions, encrypted journal, 3 journeys
 * - Sadhak ($12.99/mo | $89.99/yr): 300 questions, all features, 10 journeys
 * - Siddha ($22.99/mo | $169.99/yr): Unlimited everything, dedicated support
 *
 * Product IDs must match App Store Connect and Google Play Console entries.
 */

export type SubscriptionTier = 'free' | 'bhakta' | 'sadhak' | 'siddha';

export type BillingPeriod = 'monthly' | 'yearly';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  prices: {
    monthly: { usd: number; eur: number; inr: number };
    yearly: { usd: number; eur: number; inr: number };
  };
  priceDisplay: {
    monthly: { usd: string; eur: string; inr: string };
    yearly: { usd: string; eur: string; inr: string };
  };
  /** App Store / Play Store product IDs */
  productIds: {
    monthly: { ios: string; android: string };
    yearly: { ios: string; android: string };
  };
  /** KIAAN questions per month (-1 = unlimited) */
  kiaanQuestionsMonthly: number;
  /** Max active wisdom journeys (-1 = unlimited) */
  wisdomJourneysLimit: number;
  features: {
    kiaanDivineChat: boolean;
    kiaanFriendMode: boolean;
    kiaanVoiceCompanion: boolean;
    kiaanVoiceSynthesis: boolean;
    kiaanSoulReading: boolean;
    kiaanQuantumDive: boolean;
    kiaanAgent: boolean;
    encryptedJournal: boolean;
    moodTracking: boolean;
    dailyWisdom: boolean;
    advancedAnalytics: boolean;
    offlineAccess: boolean;
    prioritySupport: boolean;
    dedicatedSupport: boolean;
    arthaReframing: boolean;
    viyogaDetachment: boolean;
    relationshipCompass: boolean;
    emotionalResetGuide: boolean;
    teamFeatures: boolean;
    priorityVoiceProcessing: boolean;
  };
  /** Data retention in days (-1 = unlimited) */
  dataRetentionDays: number;
}

/**
 * IAP product IDs for App Store Connect and Google Play Console.
 * These must be registered in the respective store dashboards.
 */
export const IAP_PRODUCT_IDS = {
  BHAKTA_MONTHLY: {
    ios: 'com.kiaanverse.bhakta.monthly',
    android: 'com.kiaanverse.bhakta.monthly',
  },
  BHAKTA_YEARLY: {
    ios: 'com.kiaanverse.bhakta.yearly',
    android: 'com.kiaanverse.bhakta.yearly',
  },
  SADHAK_MONTHLY: {
    ios: 'com.kiaanverse.sadhak.monthly',
    android: 'com.kiaanverse.sadhak.monthly',
  },
  SADHAK_YEARLY: {
    ios: 'com.kiaanverse.sadhak.yearly',
    android: 'com.kiaanverse.sadhak.yearly',
  },
  SIDDHA_MONTHLY: {
    ios: 'com.kiaanverse.siddha.monthly',
    android: 'com.kiaanverse.siddha.monthly',
  },
  SIDDHA_YEARLY: {
    ios: 'com.kiaanverse.siddha.yearly',
    android: 'com.kiaanverse.siddha.yearly',
  },
} as const;

/** All product IDs for IAP initialization */
export const ALL_PRODUCT_IDS = [
  IAP_PRODUCT_IDS.BHAKTA_MONTHLY.ios,
  IAP_PRODUCT_IDS.BHAKTA_MONTHLY.android,
  IAP_PRODUCT_IDS.BHAKTA_YEARLY.ios,
  IAP_PRODUCT_IDS.BHAKTA_YEARLY.android,
  IAP_PRODUCT_IDS.SADHAK_MONTHLY.ios,
  IAP_PRODUCT_IDS.SADHAK_MONTHLY.android,
  IAP_PRODUCT_IDS.SADHAK_YEARLY.ios,
  IAP_PRODUCT_IDS.SADHAK_YEARLY.android,
  IAP_PRODUCT_IDS.SIDDHA_MONTHLY.ios,
  IAP_PRODUCT_IDS.SIDDHA_MONTHLY.android,
  IAP_PRODUCT_IDS.SIDDHA_YEARLY.ios,
  IAP_PRODUCT_IDS.SIDDHA_YEARLY.android,
];

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Seeker',
    description: 'Begin your spiritual journey with KIAAN',
    prices: {
      monthly: { usd: 0, eur: 0, inr: 0 },
      yearly: { usd: 0, eur: 0, inr: 0 },
    },
    priceDisplay: {
      monthly: { usd: 'Free', eur: 'Free', inr: 'Free' },
      yearly: { usd: 'Free', eur: 'Free', inr: 'Free' },
    },
    productIds: {
      monthly: { ios: '', android: '' },
      yearly: { ios: '', android: '' },
    },
    kiaanQuestionsMonthly: 5,
    wisdomJourneysLimit: 1,
    features: {
      kiaanDivineChat: true,
      kiaanFriendMode: true,
      kiaanVoiceCompanion: false,
      kiaanVoiceSynthesis: false,
      kiaanSoulReading: false,
      kiaanQuantumDive: false,
      kiaanAgent: false,
      encryptedJournal: false,
      moodTracking: true,
      dailyWisdom: true,
      advancedAnalytics: false,
      offlineAccess: false,
      prioritySupport: false,
      dedicatedSupport: false,
      arthaReframing: false,
      viyogaDetachment: false,
      relationshipCompass: false,
      emotionalResetGuide: false,
      teamFeatures: false,
      priorityVoiceProcessing: false,
    },
    dataRetentionDays: 30,
  },
  bhakta: {
    id: 'bhakta',
    name: 'Bhakta',
    description: 'More questions and encrypted journal for devoted seekers',
    prices: {
      monthly: { usd: 6.99, eur: 6.43, inr: 440 },
      yearly: { usd: 47.99, eur: 44.15, inr: 2990 },
    },
    priceDisplay: {
      monthly: { usd: '$6.99/mo', eur: '€6.43/mo', inr: '₹440/mo' },
      yearly: { usd: '$47.99/yr', eur: '€44.15/yr', inr: '₹2,990/yr' },
    },
    productIds: {
      monthly: IAP_PRODUCT_IDS.BHAKTA_MONTHLY,
      yearly: IAP_PRODUCT_IDS.BHAKTA_YEARLY,
    },
    kiaanQuestionsMonthly: 50,
    wisdomJourneysLimit: 3,
    features: {
      kiaanDivineChat: true,
      kiaanFriendMode: true,
      kiaanVoiceCompanion: false,
      kiaanVoiceSynthesis: false,
      kiaanSoulReading: false,
      kiaanQuantumDive: false,
      kiaanAgent: false,
      encryptedJournal: true,
      moodTracking: true,
      dailyWisdom: true,
      advancedAnalytics: false,
      offlineAccess: false,
      prioritySupport: false,
      dedicatedSupport: false,
      arthaReframing: false,
      viyogaDetachment: false,
      relationshipCompass: false,
      emotionalResetGuide: false,
      teamFeatures: false,
      priorityVoiceProcessing: false,
    },
    dataRetentionDays: 90,
  },
  sadhak: {
    id: 'sadhak',
    name: 'Sadhak',
    description: 'Full access to all features with 300 KIAAN questions',
    prices: {
      monthly: { usd: 12.99, eur: 11.95, inr: 810 },
      yearly: { usd: 89.99, eur: 82.79, inr: 5600 },
    },
    priceDisplay: {
      monthly: { usd: '$12.99/mo', eur: '€11.95/mo', inr: '₹810/mo' },
      yearly: { usd: '$89.99/yr', eur: '€82.79/yr', inr: '₹5,600/yr' },
    },
    productIds: {
      monthly: IAP_PRODUCT_IDS.SADHAK_MONTHLY,
      yearly: IAP_PRODUCT_IDS.SADHAK_YEARLY,
    },
    kiaanQuestionsMonthly: 300,
    wisdomJourneysLimit: 10,
    features: {
      kiaanDivineChat: true,
      kiaanFriendMode: true,
      kiaanVoiceCompanion: true,
      kiaanVoiceSynthesis: true,
      kiaanSoulReading: true,
      kiaanQuantumDive: true,
      kiaanAgent: true,
      encryptedJournal: true,
      moodTracking: true,
      dailyWisdom: true,
      advancedAnalytics: true,
      offlineAccess: true,
      prioritySupport: true,
      dedicatedSupport: false,
      arthaReframing: true,
      viyogaDetachment: true,
      relationshipCompass: true,
      emotionalResetGuide: true,
      teamFeatures: false,
      priorityVoiceProcessing: false,
    },
    dataRetentionDays: -1,
  },
  siddha: {
    id: 'siddha',
    name: 'Siddha',
    description: 'Unlimited KIAAN with unlimited everything',
    prices: {
      monthly: { usd: 22.99, eur: 21.15, inr: 1430 },
      yearly: { usd: 169.99, eur: 156.39, inr: 10580 },
    },
    priceDisplay: {
      monthly: { usd: '$22.99/mo', eur: '€21.15/mo', inr: '₹1,430/mo' },
      yearly: { usd: '$169.99/yr', eur: '€156.39/yr', inr: '₹10,580/yr' },
    },
    productIds: {
      monthly: IAP_PRODUCT_IDS.SIDDHA_MONTHLY,
      yearly: IAP_PRODUCT_IDS.SIDDHA_YEARLY,
    },
    kiaanQuestionsMonthly: -1,
    wisdomJourneysLimit: -1,
    features: {
      kiaanDivineChat: true,
      kiaanFriendMode: true,
      kiaanVoiceCompanion: true,
      kiaanVoiceSynthesis: true,
      kiaanSoulReading: true,
      kiaanQuantumDive: true,
      kiaanAgent: true,
      encryptedJournal: true,
      moodTracking: true,
      dailyWisdom: true,
      advancedAnalytics: true,
      offlineAccess: true,
      prioritySupport: true,
      dedicatedSupport: true,
      arthaReframing: true,
      viyogaDetachment: true,
      relationshipCompass: true,
      emotionalResetGuide: true,
      teamFeatures: true,
      priorityVoiceProcessing: true,
    },
    dataRetentionDays: -1,
  },
};

/** Tier rank for comparison (higher = more features) */
export const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  bhakta: 1,
  sadhak: 2,
  siddha: 3,
};

/** Monthly KIAAN question quotas by tier (-1 = unlimited) */
export const KIAAN_MONTHLY_QUOTA: Record<SubscriptionTier, number> = {
  free: 5,
  bhakta: 50,
  sadhak: 300,
  siddha: -1,
};

/** Wisdom journey limits by tier (-1 = unlimited) */
export const WISDOM_JOURNEY_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  bhakta: 3,
  sadhak: 10,
  siddha: -1,
};

// ===========================================================================
// CURRENCY RESOLUTION
// ===========================================================================
//
// The Play Store and App Store auto-localize prices on the purchase screen
// (via `iap.localizedPrice` / `phase.formattedPrice`) — so a user in India
// sees ₹ on the Google Play sheet without us doing anything. These helpers
// are for our FALLBACK pricing displays (catalog skeletons, paywalls before
// IAP fetch resolves, error paths) so an Indian user sees ₹ and a European
// user sees € instead of $ in those moments.

export type CurrencyCode = 'usd' | 'eur' | 'inr';

/** Eurozone + EU member countries (ISO-3166 alpha-2) that bill in Euro. */
const EUROZONE_REGIONS: ReadonlySet<string> = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
  // Non-Euro EU members that still display in EUR in our catalog
  'BG', 'CZ', 'DK', 'HU', 'PL', 'RO', 'SE',
]);

/** India regions — Bharat + diaspora that prefer INR display. */
const INR_REGIONS: ReadonlySet<string> = new Set(['IN']);

/** Indic language codes — Indian users may have their OS set to English
 *  but prefer INR pricing. Used as a soft fallback when no region tag
 *  is available (e.g., `i18n` returned a language-only locale). */
const INDIC_LANGUAGES: ReadonlySet<string> = new Set([
  'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml', 'or', 'as', 'ur', 'sa',
]);

/** European language codes for the same soft-fallback path. */
const EUROPEAN_LANGUAGES: ReadonlySet<string> = new Set([
  'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'cs', 'sv', 'da', 'fi', 'el',
  'ro', 'hu', 'bg', 'hr', 'sk', 'sl', 'lt', 'lv', 'et', 'mt',
]);

/**
 * Resolve a currency code from a region + locale tag pair.
 *
 * Priority:
 *  1. Region tag (ISO-3166 country code) — most reliable. Comes from
 *     ``expo-localization``'s ``Localization.getLocales()[0].regionCode``
 *     on iOS/Android, or from the user's explicit setting.
 *  2. Locale language fallback — when region is unknown, infer from
 *     Indic / European language codes.
 *  3. USD default.
 *
 * Returns the lowercased catalog key (`'usd' | 'eur' | 'inr'`) used by
 * ``TierConfig.priceDisplay`` and ``TierConfig.prices``.
 */
export function resolveCurrencyFromLocale(
  regionCode?: string | null,
  localeTag?: string | null,
): CurrencyCode {
  // 1. Region wins — it tells us the actual country.
  if (regionCode) {
    const region = regionCode.toUpperCase();
    if (INR_REGIONS.has(region)) return 'inr';
    if (EUROZONE_REGIONS.has(region)) return 'eur';
  }

  // 2. Locale-language fallback — useful when only "hi" or "de" is set.
  if (localeTag) {
    const tag = localeTag.toLowerCase();
    // BCP-47 may be "hi-IN" — split off the region segment first.
    const language = tag.split('-')[0];
    const region = tag.split('-')[1]?.toUpperCase();

    if (region) {
      if (INR_REGIONS.has(region)) return 'inr';
      if (EUROZONE_REGIONS.has(region)) return 'eur';
    }
    if (language) {
      if (INDIC_LANGUAGES.has(language)) return 'inr';
      if (EUROPEAN_LANGUAGES.has(language)) return 'eur';
    }
  }

  // 3. Default — USD covers en-US, en-GB-as-USD-fallback, and unknowns.
  return 'usd';
}

/** ISO-4217 currency-code mapping for analytics / receipts. */
export const CURRENCY_ISO_4217: Record<CurrencyCode, string> = {
  usd: 'USD',
  eur: 'EUR',
  inr: 'INR',
};

/**
 * Pick the right ``priceDisplay`` string for a tier + period + currency.
 * Falls back to USD when the currency is missing from the tier config
 * (defensive: TIER_CONFIGS always has all three today, but a future tier
 * could omit one).
 */
export function getTierPriceDisplay(
  tier: SubscriptionTier,
  period: BillingPeriod,
  currency: CurrencyCode,
): string {
  const display = TIER_CONFIGS[tier].priceDisplay[period];
  return display[currency] || display.usd;
}

/**
 * Pick the numeric price for a tier + period + currency. Used by IAP
 * priceAmountMicros fallback when the store hasn't returned a real
 * localized amount yet.
 */
export function getTierPriceAmount(
  tier: SubscriptionTier,
  period: BillingPeriod,
  currency: CurrencyCode,
): number {
  const prices = TIER_CONFIGS[tier].prices[period];
  return prices[currency] ?? prices.usd;
}
