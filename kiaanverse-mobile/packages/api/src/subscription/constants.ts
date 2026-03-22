/**
 * KIAAN Vibe Player Subscription Constants
 *
 * Defines the 3-tier subscription model for Kiaanverse mobile:
 * - Free: 5 Sakha messages/day, 2 journeys, basic Gita
 * - Sacred (₹299/mo | $4.99/mo): Unlimited Sakha, all journeys, voice mode
 * - Divine (₹999/mo | $14.99/mo): Everything + early access + personalized wisdom
 *
 * Product IDs must match App Store Connect and Google Play Console entries.
 */

export type VibePlayerTier = 'free' | 'sacred' | 'divine';

export interface TierConfig {
  id: VibePlayerTier;
  name: string;
  description: string;
  priceUSD: number;
  priceINR: number;
  priceDisplay: { usd: string; inr: string };
  /** App Store / Play Store product IDs */
  productIds: {
    ios: string;
    android: string;
  };
  sakhaMessagesPerDay: number; // -1 = unlimited
  journeyLimit: number; // -1 = unlimited
  features: {
    basicGita: boolean;
    fullGita: boolean;
    voiceMode: boolean;
    allJourneys: boolean;
    unlimitedSakha: boolean;
    earlyAccess: boolean;
    personalizedWisdom: boolean;
    offlineAccess: boolean;
    prioritySupport: boolean;
  };
}

/**
 * IAP product IDs for App Store Connect and Google Play Console.
 * These must be registered in the respective store dashboards.
 */
export const IAP_PRODUCT_IDS = {
  SACRED_MONTHLY: {
    ios: 'com.kiaanverse.sacred.monthly',
    android: 'com.kiaanverse.sacred.monthly',
  },
  DIVINE_MONTHLY: {
    ios: 'com.kiaanverse.divine.monthly',
    android: 'com.kiaanverse.divine.monthly',
  },
} as const;

/** All product IDs for initialization */
export const ALL_PRODUCT_IDS = [
  IAP_PRODUCT_IDS.SACRED_MONTHLY.ios,
  IAP_PRODUCT_IDS.SACRED_MONTHLY.android,
  IAP_PRODUCT_IDS.DIVINE_MONTHLY.ios,
  IAP_PRODUCT_IDS.DIVINE_MONTHLY.android,
];

export const TIER_CONFIGS: Record<VibePlayerTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Begin your spiritual journey with essential tools',
    priceUSD: 0,
    priceINR: 0,
    priceDisplay: { usd: 'Free', inr: 'Free' },
    productIds: { ios: '', android: '' },
    sakhaMessagesPerDay: 5,
    journeyLimit: 2,
    features: {
      basicGita: true,
      fullGita: false,
      voiceMode: false,
      allJourneys: false,
      unlimitedSakha: false,
      earlyAccess: false,
      personalizedWisdom: false,
      offlineAccess: false,
      prioritySupport: false,
    },
  },
  sacred: {
    id: 'sacred',
    name: 'Sacred',
    description: 'Deepen your practice with unlimited guidance',
    priceUSD: 4.99,
    priceINR: 299,
    priceDisplay: { usd: '$4.99/mo', inr: '₹299/mo' },
    productIds: IAP_PRODUCT_IDS.SACRED_MONTHLY,
    sakhaMessagesPerDay: -1,
    journeyLimit: -1,
    features: {
      basicGita: true,
      fullGita: true,
      voiceMode: true,
      allJourneys: true,
      unlimitedSakha: true,
      earlyAccess: false,
      personalizedWisdom: false,
      offlineAccess: true,
      prioritySupport: false,
    },
  },
  divine: {
    id: 'divine',
    name: 'Divine',
    description: 'The complete spiritual experience with personalized wisdom',
    priceUSD: 14.99,
    priceINR: 999,
    priceDisplay: { usd: '$14.99/mo', inr: '₹999/mo' },
    productIds: IAP_PRODUCT_IDS.DIVINE_MONTHLY,
    sakhaMessagesPerDay: -1,
    journeyLimit: -1,
    features: {
      basicGita: true,
      fullGita: true,
      voiceMode: true,
      allJourneys: true,
      unlimitedSakha: true,
      earlyAccess: true,
      personalizedWisdom: true,
      offlineAccess: true,
      prioritySupport: true,
    },
  },
};

/**
 * Map backend tier names to Vibe Player tiers.
 * The backend uses a 4-tier model (free/bhakta/sadhak/siddha);
 * the mobile app presents a simplified 3-tier model.
 */
export const BACKEND_TIER_MAP: Record<string, VibePlayerTier> = {
  free: 'free',
  bhakta: 'sacred',
  sadhak: 'sacred',
  siddha: 'divine',
};

/** Reverse map: Vibe Player tier → backend tier for checkout */
export const VIBE_TO_BACKEND_TIER: Record<VibePlayerTier, string> = {
  free: 'free',
  sacred: 'sadhak',
  divine: 'siddha',
};

/** Tier rank for comparison (higher = more features) */
export const TIER_RANK: Record<VibePlayerTier, number> = {
  free: 0,
  sacred: 1,
  divine: 2,
};

/** Daily Sakha message quotas by tier */
export const DAILY_SAKHA_QUOTA: Record<VibePlayerTier, number> = {
  free: 5,
  sacred: -1,
  divine: -1,
};
