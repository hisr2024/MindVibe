/**
 * CenterKiaanTab — Elevated center button of the DivineTabBar.
 *
 * A 64 px circular, golden-auraed button that sits above the tab bar
 * baseline (marginTop: -20) and continuously "breathes" (scale 1.0 →
 * 1.04 → 1.0, 3 s). The border slowly shifts hue between gold and
 * peacock blue (4 s cycle). When pressed it dips to scale 0.92 and
 * returns with ImpactFeedbackStyle.Medium haptic feedback.
 *
 * The inside houses the SakhaMandala (rendered via MandalaSpin, 40 px),
 * which spins faster when the KIAAN tab is the active route.
 *
 * A soft radial-style aura (gold → blue → transparent) sits 80 px wide
 * BEHIND the button so the elevation doesn't look clipped.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Try to reuse the mobile mandala component from the UI package so we
// match the rest of the sacred visual system. If consumers haven't yet
// migrated, the fallback glyph keeps the center tab renderable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MandalaSpin: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  MandalaSpin = require('@kiaanverse/ui').MandalaSpin ?? null;
} catch {
  MandalaSpin = null;
}

/** Gold accent for border, label, and aura highlights. */
const GOLD = '#D4A017';
/** Krishna-blue / peacock accent for aura and border cross-fade. */
const KRISHNA_BLUE = '#1B4FBB';
/** Outer button diameter. */
const BUTTON_SIZE = 64;
/** Border thickness (prompt spec: 2 px). */
const BORDER_WIDTH = 2;
/** Mandala size inside the button (prompt spec). */
const MANDALA_SIZE = 40;
/** Radial-style aura diameter (prompt spec: 80 px). */
const AURA_SIZE = 80;
/** Vertical elevation above the tab bar baseline (prompt spec). */
const ELEVATION_OFFSET = 20;

export interface CenterKiaanTabProps {
  /** Whether KIAAN is the currently focused route. */
  readonly isFocused: boolean;
  /** Translated label (rendered below, visible only when active). */
  readonly label: string;
  /** Tap handler — navigates to the KIAAN chat screen. */
  readonly onPress: () => void;
  /** Long-press handler (tab lifecycle emit). */
  readonly onLongPress?: () => void;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

function CenterKiaanTabInner({
  isFocused,
  label,
  onPress,
  onLongPress,
  testID,
}: CenterKiaanTabProps): React.JSX.Element {
  /** Ambient breathing scale — runs forever, even when inactive. */
  const breathing = useSharedValue(1);
  /** Ephemeral press scale — 0.92 on press, 1.0 released. */
  const pressScale = useSharedValue(1);
  /** 0 → 1 → 0 cycle (4 s) driving the border color cross-fade. */
  const borderPhase = useSharedValue(0);
  /** Focus state — 0 inactive, 1 active. */
  const focus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    // Always-on breathing cycle: 1.0 → 1.04 → 1.0 over 3000 ms.
    breathing.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Slow border cross-fade: 0 → 1 over 2 s, 1 → 0 over 2 s = 4 s total.
    borderPhase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [breathing, borderPhase]);

  useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
  }, [isFocused, focus]);

  const handlePressIn = React.useCallback(() => {
    pressScale.value = withTiming(0.92, { duration: 80 });
  }, [pressScale]);

  const handlePressOut = React.useCallback(() => {
    pressScale.value = withSpring(1.0, {
      damping: 14,
      stiffness: 260,
      mass: 0.7,
    });
  }, [pressScale]);

  const handlePress = React.useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathing.value * pressScale.value },
    ],
  }));

  // Border cross-fades between gold and peacock by swapping two stacked
  // gradient borders' opacities. `opacity` interpolates cleanly on the
  // UI thread whereas borderColor between arbitrary named colors does not.
  const goldBorderStyle = useAnimatedStyle(() => ({
    opacity: 1 - borderPhase.value,
  }));

  const blueBorderStyle = useAnimatedStyle(() => ({
    opacity: borderPhase.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Radial-style aura behind button — gold → blue → transparent. */}
      <View style={styles.auraWrap} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(212,160,23,0.3)',
            'rgba(27,79,187,0.2)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.aura}
        />
      </View>

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        testID={testID ?? 'tab-sakha'}
        hitSlop={8}
      >
        <Animated.View style={[styles.button, buttonAnimatedStyle]}>
          {/* Fill — Krishna aura diagonal gradient (135°). */}
          <LinearGradient
            colors={[
              'rgba(27,79,187,0.95)',
              'rgba(66,41,155,0.90)',
              'rgba(212,160,23,0.70)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Border ring — gold layer. */}
          <Animated.View
            pointerEvents="none"
            style={[styles.borderRing, { borderColor: GOLD }, goldBorderStyle]}
          />
          {/* Border ring — peacock blue layer (cross-fades with gold). */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.borderRing,
              { borderColor: KRISHNA_BLUE },
              blueBorderStyle,
            ]}
          />

          {/* Mandala — active=true when on KIAAN screen. */}
          <View style={styles.mandalaWrap}>
            {MandalaSpin ? (
              <MandalaSpin
                size={MANDALA_SIZE}
                speed={isFocused ? 'fast' : 'slow'}
                opacity={0.95}
                color={GOLD}
              />
            ) : (
              <Text style={styles.fallbackGlyph}>✦</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>

      {/* Gold label below the elevated button — only visible when active. */}
      <View style={styles.labelSlot} pointerEvents="none">
        <Animated.Text
          numberOfLines={1}
          style={[styles.label, labelAnimatedStyle]}
        >
          {label}
        </Animated.Text>
      </View>
    </View>
  );
}

/** Elevated center tab containing the Sakha mandala and golden aura. */
export const CenterKiaanTab = React.memo(CenterKiaanTabInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -ELEVATION_OFFSET,
    // No overflow: hidden — the button elevates above the bar and must
    // be free to render beyond the container bounds.
  },
  auraWrap: {
    position: 'absolute',
    top: -((AURA_SIZE - BUTTON_SIZE) / 2),
    width: AURA_SIZE,
    height: AURA_SIZE,
    borderRadius: AURA_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    width: AURA_SIZE,
    height: AURA_SIZE,
    borderRadius: AURA_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow so the elevation reads on light backgrounds.
    ...Platform.select({
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  borderRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: BORDER_WIDTH,
  },
  mandalaWrap: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlyph: {
    fontSize: 26,
    color: GOLD,
    fontWeight: '700',
  },
  labelSlot: {
    height: 14,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: 'Outfit-Medium',
      android: 'Outfit-Medium',
      default: 'Outfit-Medium',
    }),
    fontWeight: '500',
    color: GOLD,
    letterSpacing: 0.3,
  },
});
