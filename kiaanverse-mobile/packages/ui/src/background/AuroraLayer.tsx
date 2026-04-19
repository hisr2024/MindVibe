/**
 * AuroraLayer — three slow-moving radial light forms behind the particle field.
 *
 * Implementation mirrors the web's CSS aurora pass:
 *  · Aurora 1 (Krishna Blue):  drifts left → right over 45s, softly reverses
 *  · Aurora 2 (Peacock):       drifts diagonally over 60s
 *  · Aurora 3 (Gold):          breathes in place (scale 0.9 → 1.1) over 4s
 *
 * All motion runs on the UI thread via Reanimated shared values. Each aurora
 * is an LinearGradient wrapped in an Animated.View so transforms are GPU-
 * accelerated. The `dominantAuroraKey` prop lets the time-of-day atmosphere
 * amplify the matching layer.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AURORA_LAYERS } from './tokens/background';

/** Which aurora should be amplified for the active muhurta. */
export type AuroraKey = keyof typeof AURORA_LAYERS;

export interface AuroraLayerProps {
  /** Aurora key to amplify (x1.8 opacity). */
  readonly dominantAuroraKey?: AuroraKey | null | undefined;
  /** When false, transforms freeze (used when app is backgrounded). */
  readonly animated?: boolean | undefined;
  /** Optional container style override. */
  readonly style?: ViewStyle | undefined;
}

/** Hex color → rgba with alpha (for gradient fade-to-transparent). */
function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace('#', '');
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function AuroraLayerComponent({
  dominantAuroraKey = null,
  animated = true,
  style,
}: AuroraLayerProps): React.JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // One shared driver per layer. Value in [0, 1] drives the transform.
  const drift1 = useSharedValue(0); // Krishna blue — horizontal
  const drift2 = useSharedValue(0); // Peacock — diagonal
  const breathe = useSharedValue(0); // Gold — scale breathe

  useEffect(() => {
    if (!animated) {
      cancelAnimation(drift1);
      cancelAnimation(drift2);
      cancelAnimation(breathe);
      return undefined;
    }

    drift1.value = 0;
    drift1.value = withRepeat(
      withTiming(1, {
        duration: AURORA_LAYERS.krishnaBlue.duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    drift2.value = 0;
    drift2.value = withRepeat(
      withTiming(1, {
        duration: AURORA_LAYERS.peacock.duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, {
        duration: AURORA_LAYERS.gold.duration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(drift1);
      cancelAnimation(drift2);
      cancelAnimation(breathe);
    };
  }, [animated, drift1, drift2, breathe]);

  // Amplify dominant aurora opacity by 1.8x, clamped.
  const opacityFor = (key: AuroraKey): number => {
    const base = AURORA_LAYERS[key].opacity;
    const mult = dominantAuroraKey === key ? 1.8 : 1.0;
    return Math.min(0.2, base * mult);
  };

  // --- Aurora 1: Krishna Blue, horizontal drift ---
  const aurora1Size = useMemo(
    () => ({
      w: AURORA_LAYERS.krishnaBlue.width,
      h: AURORA_LAYERS.krishnaBlue.height,
    }),
    [],
  );
  const aurora1Range = useMemo(
    () => screenWidth + aurora1Size.w * 0.3,
    [screenWidth, aurora1Size.w],
  );
  const aurora1Style = useAnimatedStyle(() => {
    const tx = -aurora1Size.w * 0.3 + drift1.value * aurora1Range;
    return { transform: [{ translateX: tx }] };
  });

  // --- Aurora 2: Peacock, diagonal drift ---
  const aurora2Size = useMemo(
    () => ({
      w: AURORA_LAYERS.peacock.width,
      h: AURORA_LAYERS.peacock.height,
    }),
    [],
  );
  const aurora2RangeX = useMemo(
    () => screenWidth + aurora2Size.w * 0.3,
    [screenWidth, aurora2Size.w],
  );
  const aurora2RangeY = useMemo(
    () => Math.max(120, screenHeight * 0.4),
    [screenHeight],
  );
  const aurora2Style = useAnimatedStyle(() => {
    const tx = -aurora2Size.w * 0.3 + drift2.value * aurora2RangeX;
    const ty = drift2.value * aurora2RangeY;
    return { transform: [{ translateX: tx }, { translateY: ty }] };
  });

  // --- Aurora 3: Gold, scale breathe in place ---
  const aurora3Style = useAnimatedStyle(() => {
    const scale = 0.9 + breathe.value * 0.2;
    return { transform: [{ scale }] };
  });

  const aurora1Colors: [string, string] = [
    hexToRgba(AURORA_LAYERS.krishnaBlue.color, opacityFor('krishnaBlue')),
    'rgba(27, 79, 187, 0)',
  ];
  const aurora2Colors: [string, string] = [
    hexToRgba(AURORA_LAYERS.peacock.color, opacityFor('peacock')),
    'rgba(14, 116, 144, 0)',
  ];
  const aurora3Colors: [string, string] = [
    hexToRgba(AURORA_LAYERS.gold.color, opacityFor('gold')),
    'rgba(212, 160, 23, 0)',
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.auroraWrap,
          {
            width: aurora1Size.w,
            height: aurora1Size.h,
            top: screenHeight * 0.15,
          },
          aurora1Style,
        ]}
      >
        <LinearGradient
          colors={aurora1Colors}
          style={styles.gradient}
          start={{ x: 0.0, y: 0.5 }}
          end={{ x: 1.0, y: 0.5 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.auroraWrap,
          {
            width: aurora2Size.w,
            height: aurora2Size.h,
            top: -aurora2Size.h * 0.3,
          },
          aurora2Style,
        ]}
      >
        <LinearGradient
          colors={aurora2Colors}
          style={styles.gradient}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 1.0 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.auroraWrap,
          {
            width: AURORA_LAYERS.gold.width,
            height: AURORA_LAYERS.gold.height,
            top: screenHeight * 0.55,
            left: (screenWidth - AURORA_LAYERS.gold.width) / 2,
          },
          aurora3Style,
        ]}
      >
        <LinearGradient
          colors={aurora3Colors}
          style={styles.gradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1.0, y: 1.0 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export const AuroraLayer = React.memo(AuroraLayerComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  auroraWrap: {
    position: 'absolute',
    borderRadius: 9999,
  },
  gradient: {
    flex: 1,
    borderRadius: 9999,
  },
});
