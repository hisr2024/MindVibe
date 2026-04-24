/**
 * OmLoader — a softly breathing Om glyph used as the pull-to-refresh indicator.
 *
 * Instead of the default RefreshControl spinner, the Home screen shows ॐ
 * pulsing in the refresh area. When the user releases, the glyph keeps
 * breathing until the refetch resolves.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface OmLoaderProps {
  readonly active?: boolean | undefined;
  readonly size?: number | undefined;
  readonly style?: ViewStyle | undefined;
}

export function OmLoader({
  active = true,
  size = 34,
  style,
}: OmLoaderProps): React.JSX.Element {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0.4, { duration: 200 });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [active, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={animatedStyle}>
        <Text
          style={[styles.glyph, { fontSize: size }]}
          accessibilityLabel="Refreshing"
        >
          ॐ
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  glyph: {
    color: '#D4A017',
    textShadowColor: 'rgba(212, 160, 23, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
