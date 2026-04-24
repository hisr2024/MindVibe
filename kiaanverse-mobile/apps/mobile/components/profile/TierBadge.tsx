/**
 * TierBadge — the seeker's rank, prominent and animated.
 *
 *   Free Seeker : muted text, faint border, no motion.
 *   Bhakta ✦    : amber/saffron border + icon glow, subtle amber sheen.
 *   Sadhak ✦✦   : DIVINE_GOLD, periodic shimmer sweep across the badge.
 *   Siddha ✦✦✦  : gold→white gradient fill, divine-breath pulse over the
 *                 whole badge (scale 1.0 ↔ 1.03 @ ~4s cycle).
 *
 * The component consumes `SubscriptionTier` from the store so it stays
 * in lockstep with the rest of the app's tier resolution.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { SubscriptionTier } from '@kiaanverse/store';

import {
  tierAlpha,
  tierIdentity,
  type TierIdentity,
} from '../subscription/tierIdentity';

export interface TierBadgeProps {
  readonly tier: SubscriptionTier;
  /** Optional style override for the outer wrapper. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function TierBadgeInner({
  tier,
  style,
  testID,
}: TierBadgeProps): React.JSX.Element {
  const identity = tierIdentity(tier);

  // Shimmer sweep (Sadhak) — a gold ribbon translates left → right.
  const shimmerX = useSharedValue(-1);
  // Divine-breath (Siddha) — entire badge scale pulse.
  const breath = useSharedValue(0);

  useEffect(() => {
    if (identity.motion === 'shimmer') {
      shimmerX.value = withRepeat(
        withTiming(1.5, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    } else {
      shimmerX.value = -1;
    }
  }, [identity.motion, shimmerX]);

  useEffect(() => {
    if (identity.motion === 'pulse') {
      breath.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      breath.value = 0;
    }
  }, [identity.motion, breath]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.03 }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 160 }],
    opacity: identity.motion === 'shimmer' ? 0.65 : 0,
  }));

  return (
    <Animated.View
      style={[styles.wrap, breathStyle, style]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`${identity.name} tier`}
    >
      <BadgeBody identity={identity} />

      {/* Sadhak shimmer — a translucent gold ribbon sweeping the badge. */}
      {identity.motion === 'shimmer' ? (
        <Animated.View
          style={[styles.shimmerWrap, shimmerStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(240,192,64,0)',
              'rgba(240,192,64,0.9)',
              'rgba(240,192,64,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function BadgeBody({
  identity,
}: {
  readonly identity: TierIdentity;
}): React.JSX.Element {
  if (identity.key === 'free') {
    return (
      <View style={[styles.body, styles.bodyFree]}>
        <Text style={[styles.label, styles.labelFree]}>{identity.name}</Text>
      </View>
    );
  }
  if (identity.key === 'siddha') {
    return (
      <View
        style={[styles.body, { borderColor: tierAlpha(identity.accent, 0.9) }]}
      >
        <LinearGradient
          colors={identity.gradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.label, styles.labelOnGold]}>
          {identity.stars} {identity.name}
        </Text>
      </View>
    );
  }
  // Bhakta + Sadhak — tinted fill, tier-colored text, starred label.
  return (
    <View
      style={[
        styles.body,
        {
          backgroundColor: tierAlpha(identity.accent, 0.14),
          borderColor: tierAlpha(identity.accent, 0.55),
        },
      ]}
    >
      <Text style={[styles.label, { color: identity.accent }]}>
        {identity.stars} {identity.name}
      </Text>
    </View>
  );
}

/** Tier rank badge — animated according to the tier's motion variant. */
export const TierBadge = React.memo(TierBadgeInner);

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 999,
  },
  body: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bodyFree: {
    backgroundColor: 'rgba(240,235,225,0.06)',
    borderColor: 'rgba(240,235,225,0.25)',
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  labelFree: {
    color: 'rgba(240,235,225,0.6)',
  },
  labelOnGold: {
    color: '#050714',
    fontFamily: 'Outfit-SemiBold',
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 80,
  },
});
