/**
 * DailyVerseBanner — compact "Today's Sacred Sound" banner atop the library.
 *
 * Renders a pressable SacredCard-like panel with:
 *   - A small gold label: "TODAY'S SACRED SOUND".
 *   - The verse in Devanagari (truncated to one line) in DIVINE_GOLD.
 *   - A thin meaning line in SACRED_WHITE.
 *   - A chevron indicating that tapping opens the verse → associated track.
 *
 * If the verse has no bound track, the banner still opens the verse detail
 * screen; the parent decides the navigation target via `onPress`.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.65)';
const DIVINE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export interface DailyVerseBannerProps {
  /** Devanagari snippet (1 line max — truncated). */
  readonly sanskrit: string;
  /** Short English meaning. */
  readonly meaning: string;
  /** Citation, e.g. "Bhagavad Gita 2.47". */
  readonly reference?: string;
  /** Tap handler — usually navigates to the verse / associated track. */
  readonly onPress: () => void;
  /** Optional outer style override. */
  readonly style?: ViewStyle;
}

function DailyVerseBannerInner({
  sanskrit,
  meaning,
  reference,
  onPress,
  style,
}: DailyVerseBannerProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.985, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.outer, animatedStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Today's sacred sound. ${meaning}${
          reference ? `. ${reference}` : ''
        }`}
        style={styles.press}
      >
        <View style={styles.card}>
          {/* Top gold shimmer strip (matches SacredCard). */}
          <LinearGradient
            colors={[
              'rgba(212,160,23,0)',
              'rgba(240,192,64,0.9)',
              'rgba(212,160,23,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topShimmer}
            pointerEvents="none"
          />

          <View style={styles.row}>
            <View style={styles.textCol}>
              <View style={styles.labelRow}>
                <View style={styles.labelBar} />
                <Text style={styles.label}>TODAY’S SACRED SOUND</Text>
              </View>
              <Text style={styles.sanskrit} numberOfLines={1}>
                {sanskrit}
              </Text>
              <Text style={styles.meaning} numberOfLines={2}>
                {meaning}
              </Text>
              {reference ? (
                <Text style={styles.reference} numberOfLines={1}>
                  {reference}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** "Today's Sacred Sound" compact verse banner. */
export const DailyVerseBanner = React.memo(DailyVerseBannerInner);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  press: {
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    backgroundColor: 'rgba(17,20,53,0.85)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  topShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelBar: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: GOLD,
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 1.6,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 16,
    lineHeight: 26,
    color: GOLD,
    marginTop: 2,
  },
  meaning: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: SACRED_WHITE,
    lineHeight: 19,
  },
  reference: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  chevron: {
    fontFamily: 'Outfit-Regular',
    fontSize: 20,
    color: 'rgba(212,160,23,0.55)',
    marginTop: -2,
  },
});
