/**
 * JourneyCard — row in the Discover catalog.
 *
 * Two visual variants:
 *
 *   1. Template / inactive journey (110 px):
 *      - 3 px ripu-colored stripe on the left.
 *      - Ripu badge (Sanskrit · English) in the card's top-left.
 *      - Title in CormorantGaramond-BoldItalic.
 *      - Sanskrit name in NotoSansDevanagari, colored in the ripu's hue.
 *      - Description (2 lines max) in Outfit muted.
 *      - Bottom row: duration badge + "Begin" DivineButton(secondary).
 *
 *   2. Active journey (130 px):
 *      - Same hero strip + badge + title stack.
 *      - Replaces description with a progress arc: thin gold bar + a
 *        "Day X of Y" line in DIVINE_GOLD.
 *      - CTA becomes a DivineButton(primary) "Continue".
 *
 * Pressing the card fires a Light haptic + a color ripple from the
 * press origin clipped to the card body. The whole card uses SacredCard
 * under the hood so the gold-top shimmer + indigo-glass body stay
 * consistent with the rest of the app.
 */

import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DivineButton, SacredCard } from '@kiaanverse/ui';

import { NEUTRAL_ACCENT, ripuAlpha, type Ripu } from './ripus';

const DIVINE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';
const DIVINE_GOLD = '#D4A017';
const TEMPLATE_HEIGHT = 110;
const ACTIVE_HEIGHT = 130;
const LEFT_STRIPE = 3;
const RIPPLE_SIZE = 220;

interface BaseProps {
  /** English title. */
  readonly title: string;
  /** Duration (days) — shown as a pill. */
  readonly durationDays: number;
  /** Optional ripu metadata — drives stripe, badge, sanskrit tint. */
  readonly ripu?: Ripu | null;
  /** Press handler (card body). */
  readonly onPress: () => void;
  /** Optional style override for the outer wrapper. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

export type JourneyCardProps =
  | (BaseProps & {
      readonly variant: 'template';
      readonly description: string;
      /** Loading state for the CTA while the start mutation is pending. */
      readonly isStarting?: boolean;
    })
  | (BaseProps & {
      readonly variant: 'active';
      /** Completed step count (0 → totalDays). */
      readonly completedSteps: number;
    });

function JourneyCardInner(props: JourneyCardProps): React.JSX.Element {
  const { title, durationDays, ripu, onPress, style, testID } = props;

  const accent = ripu?.color ?? NEUTRAL_ACCENT;

  // Press animation — SacredCard would handle it if we fed it onPress,
  // but we want the entire body (including button) reachable so we wrap
  // the inner Pressable ourselves and drive the scale on this wrapper.
  const scale = useSharedValue(1);

  // Ripple — tinted in the ripu color, blooms from press origin.
  const rippleProgress = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);

  const cardSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: TEMPLATE_HEIGHT,
  });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    cardSizeRef.current = { width, height };
  }, []);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withTiming(0.98, { duration: 150, easing: DIVINE_OUT });
      const { locationX, locationY } = e.nativeEvent;
      rippleX.value = locationX;
      rippleY.value = locationY;
      rippleProgress.value = 0;
      rippleProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
    },
    [scale, rippleX, rippleY, rippleProgress],
  );

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => {
    const p = rippleProgress.value;
    return {
      opacity: (1 - p) * 0.18,
      transform: [
        { translateX: rippleX.value - RIPPLE_SIZE / 2 },
        { translateY: rippleY.value - RIPPLE_SIZE / 2 },
        { scale: p },
      ],
    };
  });

  const height =
    props.variant === 'active' ? ACTIVE_HEIGHT : TEMPLATE_HEIGHT;

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[styles.outer, { minHeight: height }, cardAnimatedStyle, style]}
      testID={testID}
    >
      <SacredCard
        onPress={undefined}
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={
            props.variant === 'active'
              ? `${title}, day ${props.completedSteps} of ${durationDays}. Tap to continue.`
              : `${title}. ${props.description}. Tap to begin.`
          }
          style={[styles.pressArea, { minHeight: height }]}
        >
          {/* Color ripple — clipped to the card body. */}
          <View style={styles.rippleClip} pointerEvents="none">
            <Animated.View
              style={[
                styles.ripple,
                {
                  backgroundColor: accent,
                  width: RIPPLE_SIZE,
                  height: RIPPLE_SIZE,
                },
                rippleStyle,
              ]}
            />
          </View>

          {/* Top row: ripu badge + duration. */}
          <View style={styles.topRow}>
            {ripu ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: ripuAlpha(ripu.color, 0.14),
                    borderColor: ripuAlpha(ripu.color, 0.45),
                  },
                ]}
              >
                <Text style={styles.badgeSymbol} allowFontScaling={false}>
                  {ripu.symbol}
                </Text>
                <Text
                  style={[styles.badgeSanskrit, { color: ripu.color }]}
                  numberOfLines={1}
                >
                  {ripu.sanskrit}
                </Text>
                <Text
                  style={[styles.badgeEnglish, { color: ripu.color }]}
                  numberOfLines={1}
                >
                  · {ripu.name}
                </Text>
              </View>
            ) : (
              <View />
            )}

            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{durationDays} days</Text>
            </View>
          </View>

          {/* Title + sanskrit stack. */}
          <View style={styles.titleBlock}>
            <Text
              style={styles.title}
              numberOfLines={2}
              allowFontScaling={false}
            >
              {title}
            </Text>
            {ripu ? (
              <Text
                style={[styles.titleSanskrit, { color: ripu.color }]}
                numberOfLines={1}
              >
                {ripu.sanskrit}
              </Text>
            ) : null}
          </View>

          {/* Variant body + CTA. */}
          {props.variant === 'template' ? (
            <TemplateBody
              description={props.description}
              onBegin={handlePress}
              isStarting={props.isStarting === true}
            />
          ) : (
            <ActiveBody
              completedSteps={props.completedSteps}
              durationDays={durationDays}
              accent={accent}
              onContinue={handlePress}
            />
          )}
        </Pressable>

        {/* Left ripu stripe (drawn last so it always paints on top of
            the ripple but below interactive regions thanks to pointerEvents:none). */}
        <View
          style={[styles.stripe, { backgroundColor: accent }]}
          pointerEvents="none"
        />
      </SacredCard>
    </Animated.View>
  );
}

function TemplateBody({
  description,
  onBegin,
  isStarting,
}: {
  readonly description: string;
  readonly onBegin: () => void;
  readonly isStarting: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.bodyCol}>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      <View style={styles.ctaRow}>
        <DivineButton
          title={isStarting ? 'Starting…' : 'Begin'}
          variant="secondary"
          onPress={onBegin}
          loading={isStarting}
          style={styles.ctaBtn}
        />
      </View>
    </View>
  );
}

function ActiveBody({
  completedSteps,
  durationDays,
  accent,
  onContinue,
}: {
  readonly completedSteps: number;
  readonly durationDays: number;
  readonly accent: string;
  readonly onContinue: () => void;
}): React.JSX.Element {
  const safeTotal = Math.max(1, durationDays);
  const ratio = Math.max(0, Math.min(1, completedSteps / safeTotal));

  return (
    <View style={styles.bodyCol}>
      <Text style={styles.progressLabel}>
        Day {Math.max(completedSteps, 1)} of {durationDays}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${ratio * 100}%`, backgroundColor: accent },
          ]}
        />
      </View>
      <View style={styles.ctaRow}>
        <DivineButton
          title="Continue"
          variant="primary"
          onPress={onContinue}
          style={styles.ctaBtn}
        />
      </View>
    </View>
  );
}

/** Pressable journey row — template or active, ripu-themed throughout. */
export const JourneyCard = React.memo(JourneyCardInner);

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
  pressArea: {
    paddingVertical: 12,
    paddingLeft: 14 + LEFT_STRIPE,
    paddingRight: 14,
    gap: 8,
  },
  rippleClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: RIPPLE_SIZE / 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
  },
  badgeSymbol: {
    fontSize: 12,
  },
  badgeSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 11,
    lineHeight: 18,
  },
  badgeEnglish: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  durationPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  durationText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: DIVINE_GOLD,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 17,
    color: SACRED_WHITE,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  titleSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 12,
    // 12 × 2.0 = 24
    lineHeight: 24,
  },
  bodyCol: {
    gap: 8,
  },
  description: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  progressLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: DIVINE_GOLD,
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212,160,23,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  ctaBtn: {
    minWidth: 124,
    height: 40,
    borderRadius: 20,
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: LEFT_STRIPE,
    zIndex: 3,
  },
});
