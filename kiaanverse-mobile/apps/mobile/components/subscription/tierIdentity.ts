/**
 * Tier visual identity — consumed by both the Profile tier badge and the
 * Subscription plan cards so the user's tier looks identical everywhere.
 *
 * Siddha shares a gold→white→gold gradient animation; Sadhak glows with
 * DIVINE_GOLD shimmer; Bhakta takes a subtle amber/saffron accent; the
 * Free Seeker is intentionally muted. The four tiers map onto the
 * `SubscriptionTier` union from `@kiaanverse/api`.
 */

import type { SubscriptionTier } from '@kiaanverse/store';

export interface TierIdentity {
  /** Tier key (matches the store + API). */
  readonly key: SubscriptionTier;
  /** English display name (e.g., "Sadhak"). */
  readonly name: string;
  /** Tier's Sanskrit (Devanagari) label — empty for Free. */
  readonly sanskrit: string;
  /** English poetic subtitle (e.g., "The Sacred Path"). */
  readonly subtitle: string;
  /** Bullet star prefix — one, two, or three ✦ symbols. */
  readonly stars: string;
  /** Primary accent color used for borders, text, Sanskrit. */
  readonly accent: string;
  /** Secondary accent used in gradients. */
  readonly accentAlt: string;
  /** Three-stop gradient used for the plan card left-stripe + badges. */
  readonly gradient: readonly [string, string, string];
  /** Whether this tier is marketed as "Most Popular". */
  readonly recommended?: boolean;
  /**
   * Motion variant driving the card's animated treatment:
   *   - 'none'    — static (Free).
   *   - 'shimmer' — gold shimmer sweep across the left stripe.
   *   - 'pulse'   — divine-breath pulse over the entire card.
   */
  readonly motion: 'none' | 'shimmer' | 'pulse';
}

/**
 * Type-safe accessor for TIER_IDENTITIES that returns a non-optional
 * value even under `noUncheckedIndexedAccess`. The record is exhaustive
 * over `SubscriptionTier`, so this is safe; the assertion merely calms
 * the compiler without sacrificing the runtime invariant.
 */
export function tierIdentity(tier: SubscriptionTier): TierIdentity {
  // `TIER_IDENTITIES` is declared below; the record is exhaustive over
  // `SubscriptionTier`, so the lookup is guaranteed non-null at runtime.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return TIER_IDENTITIES[tier]!;
}

export const TIER_IDENTITIES: Record<SubscriptionTier, TierIdentity> = {
  free: {
    key: 'free',
    name: 'Free Seeker',
    sanskrit: '',
    subtitle: 'The Wanderer at the Gate',
    stars: '',
    accent: 'rgba(240,235,225,0.5)',
    accentAlt: 'rgba(240,235,225,0.25)',
    gradient: [
      'rgba(240,235,225,0.0)',
      'rgba(240,235,225,0.0)',
      'rgba(240,235,225,0.0)',
    ],
    motion: 'none',
  },
  bhakta: {
    key: 'bhakta',
    name: 'Bhakta',
    sanskrit: 'भक्त',
    subtitle: 'The Devotee',
    stars: '✦',
    accent: '#F59E0B',
    accentAlt: '#FF6600',
    gradient: ['#F59E0B', '#FF8C00', '#FF6600'],
    motion: 'none',
  },
  sadhak: {
    key: 'sadhak',
    name: 'Sadhak',
    sanskrit: 'साधक',
    subtitle: 'The Sacred Path',
    stars: '✦✦',
    accent: '#D4A017',
    accentAlt: '#F0C040',
    gradient: ['#D4A017', '#F0C040', '#D4A017'],
    recommended: true,
    motion: 'shimmer',
  },
  siddha: {
    key: 'siddha',
    name: 'Siddha',
    sanskrit: 'सिद्ध',
    subtitle: 'The Realized One',
    stars: '✦✦✦',
    accent: '#F5E27A',
    accentAlt: '#FFFFFF',
    gradient: ['#D4A017', '#FFFFFF', '#D4A017'],
    motion: 'pulse',
  },
};

/**
 * Hex → rgba utility — shared between the profile badge and the plan
 * cards so alpha variants track the core accent in lock-step.
 */
export function tierAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 0xff;
  const g = (bigint >> 8) & 0xff;
  const b = bigint & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
