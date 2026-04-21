/**
 * ToolCard — a single sacred-instrument row on the Tools Dashboard.
 *
 * Anatomy (96 px tall, full width):
 *   ┌─┬──────────────────────────────────────────────────────────────┐
 *   │▓│  [44px icon circle]  Tool Name                           ›  │
 *   │▓│                       संस्कृत  ·  One-line description          │
 *   └─┴──────────────────────────────────────────────────────────────┘
 *    ↑
 *    3 px full-height stripe painted in the tool's semantic color.
 *
 * Interactions:
 *   - Press: scale 0.97 → 1.0 (DIVINE_OUT, 150 ms) + Light haptic.
 *   - Ripple: a 0 → 80 px disc the color of the tool blooms from the
 *     press point, opacity 0.15 → 0 over 600 ms. The press origin is
 *     captured from `onPressIn` so the ripple feels physically grounded,
 *     rather than centered mechanically.
 *
 * The card body uses SacredCard for the gold-top shimmer + indigo body
 * surface so every instrument shares the temple-grade finish that runs
 * through the rest of the app.
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
import { SacredCard } from '@kiaanverse/ui';

/** Divine-out easing (matches web cubic-bezier 0.16, 1, 0.3, 1). */
const DIVINE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';
const DIVINE_GOLD = '#D4A017';
const CARD_HEIGHT = 96;
const ICON_CIRCLE = 44;
const LEFT_STRIPE_WIDTH = 3;
const RIPPLE_SIZE = 160; // 80 px radius × 2.

export interface ToolCardProps {
  /** Display name — Outfit-SemiBold 15 px. */
  readonly name: string;
  /** Sanskrit (Devanagari) label — rendered in the tool's semantic color. */
  readonly sanskrit: string;
  /** One-line description — truncated with ellipsis. */
  readonly description: string;
  /** Icon glyph (emoji or short string). */
  readonly icon: string;
  /** Semantic color (stripe + circle tint + sanskrit color). */
  readonly color: string;
  /** Tap handler — navigation lives in the parent. */
  readonly onPress: () => void;
  /** Optional style override for the outer animated wrapper. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

/**
 * Hex → `rgba(r, g, b, a)`. Supports `#RGB` and `#RRGGBB` inputs.
 * Used to derive the 12 % icon-circle background + 30 % border from a
 * single semantic color token.
 */
function hexToRgba(hex: string, alpha: number): string {
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

function ToolCardInner({
  name,
  sanskrit,
  description,
  icon,
  color,
  onPress,
  style,
  testID,
}: ToolCardProps): React.JSX.Element {
  // Card-level scale: 1.0 → 0.97 → 1.0 on press, DIVINE_OUT easing.
  const scale = useSharedValue(1);

  // Ripple — tracks origin (x, y) and progress (0 → 1).
  const rippleProgress = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);

  // We need the card's measured size so we can clamp the ripple origin
  // when a press lands near the edges (ripple still blooms within bounds).
  const cardSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: CARD_HEIGHT,
  });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    cardSizeRef.current = { width, height };
  }, []);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withTiming(0.97, {
        duration: 150,
        easing: DIVINE_OUT,
      });
      // Origin captured at press-in so the ripple tracks the finger, not
      // the release position (which might drift after a slow tap).
      const { locationX, locationY } = e.nativeEvent;
      rippleX.value = locationX;
      rippleY.value = locationY;
      rippleProgress.value = 0;
      rippleProgress.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
    },
    [scale, rippleProgress, rippleX, rippleY],
  );

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: 150,
      easing: DIVINE_OUT,
    });
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
    // Scale from 0 → 1 relative to RIPPLE_SIZE so radius climbs 0 → 80 px.
    const size = RIPPLE_SIZE;
    return {
      opacity: (1 - p) * 0.15,
      transform: [
        { translateX: rippleX.value - size / 2 },
        { translateY: rippleY.value - size / 2 },
        { scale: p },
      ],
    };
  });

  const iconBg = hexToRgba(color, 0.12);
  const iconBorder = hexToRgba(color, 0.3);

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[styles.outer, cardAnimatedStyle, style]}
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
          accessibilityLabel={`${name}. ${description}`}
          style={styles.pressArea}
        >
          {/* Color ripple — bloom from press origin, clipped to card. */}
          <View style={styles.rippleClip} pointerEvents="none">
            <Animated.View
              style={[
                styles.ripple,
                { backgroundColor: color, width: RIPPLE_SIZE, height: RIPPLE_SIZE },
                rippleStyle,
              ]}
            />
          </View>

          {/* Icon circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: iconBg, borderColor: iconBorder },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.iconGlyph} allowFontScaling={false}>
              {icon}
            </Text>
          </View>

          {/* Text column */}
          <View style={styles.textCol} pointerEvents="none">
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={[styles.sanskrit, { color }]}
              numberOfLines={1}
            >
              {sanskrit}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          </View>

          {/* Chevron */}
          <Text style={styles.chevron} pointerEvents="none">
            ›
          </Text>
        </Pressable>

        {/* Left semantic-color stripe (3 px × full height). Rendered LAST
            so it paints above the ripple and pressable surface; marked
            pointerEvents="none" so touches pass through unimpeded. */}
        <View
          style={[styles.stripe, { backgroundColor: color }]}
          pointerEvents="none"
        />
      </SacredCard>
    </Animated.View>
  );
}

/** Tappable 96 px sacred-instrument row. */
export const ToolCard = React.memo(ToolCardInner);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  card: {
    width: '100%',
    minHeight: CARD_HEIGHT,
  },
  cardContent: {
    // Body gets no padding — our pressable handles inner spacing so the
    // ripple + stripe can span edge-to-edge.
    padding: 0,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: LEFT_STRIPE_WIDTH,
    zIndex: 3,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CARD_HEIGHT,
    paddingVertical: 14,
    paddingLeft: 14 + LEFT_STRIPE_WIDTH, // leaves room for the stripe
    paddingRight: 14,
    gap: 14,
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
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: ICON_CIRCLE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 26,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  name: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: SACRED_WHITE,
    letterSpacing: 0.2,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 11,
    // 1.8 × 11 ≈ 20
    lineHeight: 20,
  },
  description: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  chevron: {
    fontFamily: 'Outfit-Regular',
    fontSize: 20,
    // 50% opacity of DIVINE_GOLD.
    color: 'rgba(212,160,23,0.5)',
    marginLeft: 4,
    // Slight vertical nudge — the ›  glyph sits a touch high otherwise.
    marginTop: -2,
    includeFontPadding: false,
  },
});
