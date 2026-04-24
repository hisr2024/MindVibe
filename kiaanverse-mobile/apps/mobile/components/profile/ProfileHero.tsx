/**
 * ProfileHero — the top 150 px of the profile screen.
 *
 * Composition (layered top → bottom):
 *   1. Full-width Krishna-indigo → cosmic-fade gradient (150 px tall).
 *   2. Centered 80 px avatar — either a photo or initials rendered in
 *      CormorantGaramond-BoldItalic 32 px on a Krishna-aura gradient.
 *      A gold ring surrounds the avatar and breathes gently (divine-
 *      breath scale 1.0 → 1.04 over 4s + opacity 0.5 → 0.9).
 *   3. Name in CormorantGaramond-BoldItalic 22 px SACRED_WHITE.
 *   4. Email in Outfit 13 px TEXT_MUTED.
 *   5. TierBadge — prominent, animated per-tier.
 */

import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
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

import { TierBadge } from './TierBadge';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.55)';
const GOLD = '#D4A017';
const AVATAR = 80;

const HERO_GRADIENT = ['rgba(27,79,187,0.30)', 'rgba(5,7,20,0)'] as const;

const AVATAR_GRADIENT = ['#1B4FBB', '#0E7490'] as const;

export interface ProfileHeroProps {
  /** Display name (or "Sacred Seeker" fallback). */
  readonly name: string;
  /** Email address. */
  readonly email?: string | undefined;
  /** Optional profile photo URL — if null/undefined, initials render instead. */
  readonly photoUrl?: string | null | undefined;
  /** Subscription tier — drives the badge. */
  readonly tier: SubscriptionTier;
  /** Top padding consumed by the safe-area inset. */
  readonly topInset: number;
  /** Optional outer style. */
  readonly style?: ViewStyle;
}

function ProfileHeroInner({
  name,
  email,
  photoUrl,
  tier,
  topInset,
  style,
}: ProfileHeroProps): React.JSX.Element {
  // Breathing gold ring around the avatar — scale + opacity oscillate.
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [ringPulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + ringPulse.value * 0.4,
    transform: [{ scale: 1 + ringPulse.value * 0.04 }],
  }));

  const initial = (
    name && name.trim().length > 0 ? name.trim().charAt(0) : 'S'
  ).toUpperCase();

  return (
    <View
      style={[styles.wrap, { paddingTop: topInset + 16 }, style]}
      accessibilityRole="header"
      accessibilityLabel={`${name}, ${tier} tier`}
    >
      <LinearGradient
        colors={HERO_GRADIENT as unknown as string[]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.avatarCol}>
        <View style={styles.avatarFrame}>
          {/* Breathing gold ring. */}
          <Animated.View
            style={[styles.ring, ringStyle]}
            pointerEvents="none"
          />
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.avatar}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={styles.avatar}>
              <LinearGradient
                colors={AVATAR_GRADIENT as unknown as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text
                style={styles.initial}
                allowFontScaling={false}
                accessibilityLabel={`Avatar for ${name}`}
              >
                {initial}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1} accessibilityRole="text">
          {name}
        </Text>
        {email ? (
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        ) : null}

        <View style={styles.badgeRow}>
          <TierBadge tier={tier} />
        </View>
      </View>
    </View>
  );
}

/** Gradient hero with avatar, name, email, and tier badge. */
export const ProfileHero = React.memo(ProfileHeroInner);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    minHeight: 150,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  avatarCol: {
    alignItems: 'center',
    gap: 6,
  },
  avatarFrame: {
    width: AVATAR + 12,
    height: AVATAR + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ring: {
    position: 'absolute',
    width: AVATAR + 10,
    height: AVATAR + 10,
    borderRadius: (AVATAR + 10) / 2,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 32,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  name: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 22,
    color: SACRED_WHITE,
    letterSpacing: 0.3,
  },
  email: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  badgeRow: {
    marginTop: 6,
  },
});
