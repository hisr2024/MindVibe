/**
 * SubscriptionPlanCard — full-width pressable tier card.
 *
 * Shared anatomy:
 *   ┌─┬──────────────────────────────────────────────┐
 *   │▓│  [ Sanskrit + English badge ]   [ Price ]    │
 *   │▓│  Subtitle poetic line                        │
 *   │▓│  ───────────────────────────                 │
 *   │▓│  ✦ Feature 1                                 │
 *   │▓│  ✦ Feature 2                                 │
 *   │▓│  …                                           │
 *   │▓│  [ RECOMMENDED chip floats on top-right ]    │
 *   └─┴──────────────────────────────────────────────┘
 *    ↑
 *    Tier-specific left stripe (solid, gradient, or animated).
 *
 * Per-tier motion:
 *   - Free    : no bar, no motion.
 *   - Bhakta  : static amber/saffron gradient bar.
 *   - Sadhak  : DIVINE_GOLD gradient bar with shimmer sweep; outer glow.
 *   - Siddha  : gold → white → gold animated bar; divine-breath scale
 *               pulse over the entire card.
 */

import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GoldenDivider, SacredCard } from '@kiaanverse/ui';
import type { SubscriptionTier } from '@kiaanverse/store';

import { tierIdentity, type TierIdentity } from './tierIdentity';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.55)';
const GOLD = '#D4A017';
const STRIPE_WIDTH = 5;

export interface SubscriptionPlanCardProps {
  /** Tier to render. */
  readonly tier: SubscriptionTier;
  /** Display price string (e.g., "$12.99"). */
  readonly price: string;
  /** Period suffix (e.g., "/month" or "/year"). */
  readonly pricePeriod: string;
  /** Optional strikethrough price — shown when annual saves vs monthly. */
  readonly originalPrice?: string | undefined;
  /** Optional per-month equivalent for annual plans ("~$7.50/mo avg"). */
  readonly perMonthEquivalent?: string | undefined;
  /** Feature bullet lines. */
  readonly features: readonly string[];
  /** Whether this card is currently selected. */
  readonly selected: boolean;
  /** Tap handler (card as a whole). */
  readonly onPress: () => void;
  /** Optional outer style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function SubscriptionPlanCardInner({
  tier,
  price,
  pricePeriod,
  originalPrice,
  perMonthEquivalent,
  features,
  selected,
  onPress,
  style,
  testID,
}: SubscriptionPlanCardProps): React.JSX.Element {
  const identity = tierIdentity(tier);

  // Shimmer sweep across the left stripe (Sadhak + Siddha).
  const shimmer = useSharedValue(-1);
  // Divine-breath pulse over the entire card (Siddha).
  const breath = useSharedValue(0);

  useEffect(() => {
    if (identity.motion === 'shimmer' || identity.motion === 'pulse') {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      shimmer.value = -1;
    }
  }, [identity.motion, shimmer]);

  useEffect(() => {
    if (identity.motion === 'pulse') {
      breath.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      breath.value = 0;
    }
  }, [identity.motion, breath]);

  const cardPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.015 }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    // Sweep from the bottom of the stripe through the top and out.
    transform: [{ translateY: (1 - shimmer.value) * -160 }],
    opacity:
      identity.motion === 'shimmer' || identity.motion === 'pulse' ? 0.85 : 0,
  }));

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const showOuterGlow =
    identity.motion === 'shimmer' || identity.motion === 'pulse';

  const cardBorder = selected
    ? { borderColor: identity.accent, borderWidth: 1.5 }
    : {};

  return (
    <Animated.View
      style={[styles.outer, cardPulseStyle, style]}
      testID={testID}
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${identity.name} plan, ${price} ${pricePeriod}`}
      >
        <SacredCard
          style={
            [
              styles.card,
              showOuterGlow && {
                shadowColor: identity.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 10,
              },
              cardBorder,
            ] as unknown as ViewStyle
          }
          contentStyle={styles.cardContent}
        >
          {/* RECOMMENDED chip — floats top-right. */}
          {identity.recommended ? (
            <View style={styles.recommendedChip}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          ) : null}

          <View style={styles.inner}>
            {/* Top row: tier badge block + price */}
            <View style={styles.topRow}>
              <TierHeader identity={identity} />
              <View style={styles.priceBlock}>
                {originalPrice ? (
                  <Text style={styles.originalPrice} numberOfLines={1}>
                    {originalPrice}
                  </Text>
                ) : null}
                <Text style={styles.price} numberOfLines={1}>
                  {price}
                </Text>
                <Text style={styles.pricePeriod}>{pricePeriod}</Text>
                {perMonthEquivalent ? (
                  <Text style={styles.perMonth} numberOfLines={1}>
                    {perMonthEquivalent}
                  </Text>
                ) : null}
              </View>
            </View>

            <GoldenDivider style={styles.divider} />

            {/* Feature list */}
            <View style={styles.features}>
              {features.map((f) => (
                <FeatureRow key={f} text={f} accent={identity.accent} />
              ))}
            </View>

            {selected ? (
              <Text style={[styles.selectedText, { color: identity.accent }]}>
                ✓ Selected
              </Text>
            ) : null}
          </View>

          {/* Left stripe — static gradient for Bhakta/Sadhak/Siddha,
              animated sweep for Sadhak/Siddha. None for Free. */}
          {identity.motion !== 'none' || tier !== 'free' ? (
            <View style={styles.stripeWrap} pointerEvents="none">
              <LinearGradient
                colors={identity.gradient as unknown as string[]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {identity.motion === 'shimmer' || identity.motion === 'pulse' ? (
                <Animated.View style={[styles.stripeShimmer, shimmerStyle]}>
                  <LinearGradient
                    colors={[
                      'rgba(255,255,255,0)',
                      'rgba(255,255,255,0.85)',
                      'rgba(255,255,255,0)',
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              ) : null}
            </View>
          ) : null}
        </SacredCard>
      </Pressable>
    </Animated.View>
  );
}

function TierHeader({
  identity,
}: {
  readonly identity: TierIdentity;
}): React.JSX.Element {
  if (identity.key === 'free') {
    return (
      <View style={styles.tierHeader}>
        <Text style={[styles.tierName, { color: SACRED_WHITE }]}>
          {identity.name}
        </Text>
        <Text style={styles.tierSubtitle}>{identity.subtitle}</Text>
      </View>
    );
  }
  return (
    <View style={styles.tierHeader}>
      <View style={styles.badgeInline}>
        <Text
          style={[styles.badgeSanskrit, { color: identity.accent }]}
          numberOfLines={1}
        >
          {identity.sanskrit}
        </Text>
        <Text style={[styles.badgeStars, { color: identity.accent }]}>
          {identity.stars}
        </Text>
      </View>
      <Text style={[styles.tierName, { color: SACRED_WHITE }]}>
        {identity.name}
      </Text>
      <Text style={styles.tierSubtitle}>{identity.subtitle}</Text>
    </View>
  );
}

function FeatureRow({
  text,
  accent,
}: {
  readonly text: string;
  readonly accent: string;
}): React.JSX.Element {
  return (
    <View style={styles.featureRow}>
      <Text
        style={[styles.featureStar, { color: accent }]}
        allowFontScaling={false}
      >
        ✦
      </Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

/** Full-width tier card — left stripe + features + price + CTA meta. */
export const SubscriptionPlanCard = React.memo(SubscriptionPlanCardInner);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  card: {
    width: '100%',
  },
  cardContent: {
    padding: 0,
    overflow: 'hidden',
  },
  inner: {
    paddingVertical: 18,
    paddingLeft: 18 + STRIPE_WIDTH,
    paddingRight: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  tierHeader: {
    flexShrink: 1,
    gap: 2,
  },
  badgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  badgeSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  badgeStars: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 1,
  },
  tierName: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 22,
    letterSpacing: 0.4,
  },
  tierSubtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 1,
  },
  originalPrice: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    textDecorationLine: 'line-through',
  },
  price: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 24,
    color: GOLD,
    letterSpacing: 0.3,
  },
  pricePeriod: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  perMonth: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: TEXT_MUTED,
  },
  divider: {
    marginVertical: 2,
  },
  features: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureStar: {
    fontSize: 12,
  },
  featureText: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: SACRED_WHITE,
    lineHeight: 20,
  },
  selectedText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 2,
  },
  recommendedChip: {
    position: 'absolute',
    top: 8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: GOLD,
    zIndex: 4,
  },
  recommendedText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#050714',
  },
  stripeWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: STRIPE_WIDTH,
    overflow: 'hidden',
    zIndex: 3,
  },
  stripeShimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 80,
  },
});
