/**
 * SakhaAvatar — Circular avatar with a golden breathing aura ring.
 *
 * The aura ring communicates KIAAN's state to the user:
 * - idle: Gentle pulse (opacity 0.3 → 0.7, slow cycle)
 * - speaking: Faster glow cycle with wider ring
 * - thinking: Slow ring rotation + gentle pulse
 *
 * NOT lip sync — this is a presence/status indicator.
 */

import React, { useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

/** KIAAN companion state reflected in the aura ring. */
export type SakhaState = 'idle' | 'speaking' | 'thinking';

/** Props for the SakhaAvatar component. */
export interface SakhaAvatarProps {
  /** Diameter of the inner avatar circle in points. @default 64 */
  readonly size?: number;
  /** Current state of the KIAAN companion. @default 'idle' */
  readonly state?: SakhaState;
  /** Image source for the avatar. Falls back to initials if omitted. */
  readonly imageSource?: ImageSourcePropType;
  /** Display name for fallback initials and accessibility label. */
  readonly name?: string;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Ring width relative to avatar size. */
const RING_PADDING = 4;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? '').toUpperCase();
}

function SakhaAvatarInner({
  size = 64,
  state = 'idle',
  imageSource,
  name = '',
  testID,
}: SakhaAvatarProps): React.JSX.Element {
  const { theme } = useTheme();
  const auraColor = theme.palette.divine.aura;

  const ringOpacity = useSharedValue(0.3);
  const ringRotation = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    // Reset
    ringRotation.value = 0;
    ringScale.value = 1;

    switch (state) {
      case 'idle': {
        ringOpacity.value = withRepeat(
          withSequence(
            withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        break;
      }
      case 'speaking': {
        ringScale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        ringOpacity.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        break;
      }
      case 'thinking': {
        ringRotation.value = withRepeat(
          withTiming(360, { duration: 4000, easing: Easing.linear }),
          -1,
          false,
        );
        ringOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        break;
      }
    }
  }, [state, ringOpacity, ringRotation, ringScale]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [
      { rotate: `${ringRotation.value}deg` },
      { scale: ringScale.value },
    ],
  }));

  const outerSize = size + RING_PADDING * 2 + 6;

  return (
    <View
      style={[styles.container, { width: outerSize, height: outerSize }]}
      testID={testID}
      accessibilityLabel={name ? `${name}'s avatar` : 'Sakha avatar'}
      accessibilityRole="image"
    >
      {/* Aura ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderColor: auraColor,
            borderWidth: 2,
          },
          ringStyle,
        ]}
      />

      {/* Inner avatar */}
      {imageSource ? (
        <Image
          source={imageSource}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.palette.alpha.goldMedium,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.38,
                color: theme.colors.accent,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Circular avatar with animated golden aura ring reflecting KIAAN companion state. */
export const SakhaAvatar = React.memo(SakhaAvatarInner);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
