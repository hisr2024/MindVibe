/**
 * SacredChip — Conversation starter / suggestion chip.
 *
 * Web parity:
 * - Compact SacredCard variant: paddingH 16, paddingV 10, radius 20.
 * - Text: Outfit italic 13px, TEXT_PRIMARY.
 * - Border: 1px rgba(212,160,23,0.25).
 * - Press: scale 0.95 → 1.0 (180ms, divine-out) + Haptics.Light.
 */

import React, { useCallback } from 'react';
import {
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
import * as Haptics from 'expo-haptics';

const BORDER = 'rgba(212, 160, 23, 0.25)';
const BG = 'rgba(22, 26, 66, 0.5)';
const TEXT_PRIMARY = '#F5F0E8';
const RADIUS = 20;
const easeDivineOut = Easing.bezier(0.16, 1, 0.3, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface SacredChipProps {
  /** Chip label text. */
  readonly label: string;
  /** Press handler. */
  readonly onPress: (event: GestureResponderEvent) => void;
  /** Selected visual state — slight gold fill. @default false */
  readonly selected?: boolean;
  /** Disable interaction. @default false */
  readonly disabled?: boolean;
  /** Leading icon node. */
  readonly icon?: React.ReactNode;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function SacredChipInner({
  label,
  onPress,
  selected = false,
  disabled = false,
  icon,
  style,
  testID,
}: SacredChipProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 180, easing: easeDivineOut });
    if (!disabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Haptics unavailable in tests — ignore.
      });
    }
  }, [scale, disabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 180, easing: easeDivineOut });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      testID={testID}
      style={[
        styles.base,
        selected ? styles.selected : null,
        disabled ? styles.disabled : null,
        animatedStyle,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

/** Compact pressable chip for SAKHA conversation suggestions. */
export const SacredChip = React.memo(SacredChipInner);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
    alignSelf: 'flex-start',
  },
  selected: {
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    borderColor: 'rgba(212, 160, 23, 0.5)',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontFamily: 'Outfit-Regular',
    fontStyle: 'italic',
    fontSize: 13,
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
});
