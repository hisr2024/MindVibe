/**
 * DivineButton — Sacred CTA with Krishna Aura gradient, ripple press, haptics.
 *
 * Web parity:
 * - Primary:   Krishna Aura linear gradient background, white Outfit-SemiBold 15px.
 * - Secondary: Transparent with 1px gold border, gold text.
 * - Ghost:     No border, TEXT_MUTED text color.
 * - Height: 52, BorderRadius: 26 (pill).
 * - Press: scale 0.95 → 1.0 over 180ms with divine-out easing.
 * - Haptic: ImpactFeedbackStyle.Light on pressIn.
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export type DivineButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface DivineButtonProps {
  readonly title: string;
  readonly onPress: (event: GestureResponderEvent) => void;
  readonly variant?: DivineButtonVariant;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly style?: ViewStyle;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
  /** Icon rendered to the left of the title. */
  readonly leftAccessory?: React.ReactNode;
  /** Icon rendered to the right of the title. */
  readonly rightAccessory?: React.ReactNode;
}

const KRISHNA_AURA_GRADIENT = [
  '#1B4FBB',
  '#6B3FC4',
  '#D4A017',
] as const;

const GOLD = '#D4A017';
const WHITE = '#FFFFFF';
const TEXT_MUTED = '#7A7060';
const PILL_HEIGHT = 52;
const PILL_RADIUS = 26;
const PRESS_SCALE = 0.95;
const PRESS_DURATION_MS = 180;

const easeDivineOut = Easing.bezier(0.16, 1, 0.3, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function DivineButtonInner({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
  leftAccessory,
  rightAccessory,
}: DivineButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(PRESS_SCALE, {
      duration: PRESS_DURATION_MS,
      easing: easeDivineOut,
    });
    if (!isDisabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Haptics unavailable in test env — swallow.
      });
    }
  }, [scale, isDisabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: PRESS_DURATION_MS,
      easing: easeDivineOut,
    });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelColor =
    variant === 'primary' ? WHITE : variant === 'secondary' ? GOLD : TEXT_MUTED;

  const labelNode = (
    <View style={styles.row}>
      {leftAccessory ? <View style={styles.accessoryLeft}>{leftAccessory}</View> : null}
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <Text
          style={[styles.label, { color: labelColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      {rightAccessory ? <View style={styles.accessoryRight}>{rightAccessory}</View> : null}
    </View>
  );

  const containerStyle: ViewStyle = {
    opacity: isDisabled ? 0.5 : 1,
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={[styles.base, containerStyle, animatedStyle, style]}
      android_ripple={{
        color: 'rgba(255, 255, 255, 0.18)',
        borderless: false,
      }}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={KRISHNA_AURA_GRADIENT as unknown as string[]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        >
          {labelNode}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.fill,
            variant === 'secondary' ? styles.secondary : styles.ghost,
          ]}
        >
          {labelNode}
        </View>
      )}
    </AnimatedPressable>
  );
}

/** Primary CTA with Krishna Aura gradient, secondary and ghost variants. */
export const DivineButton = React.memo(DivineButtonInner);

const styles = StyleSheet.create({
  base: {
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  fill: {
    flex: 1,
    borderRadius: PILL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GOLD,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  accessoryLeft: {
    marginRight: 10,
  },
  accessoryRight: {
    marginLeft: 10,
  },
});
