/**
 * SacredInput — Text input with gold focus border and outer glow.
 *
 * Web parity:
 * - Background rgba(22, 26, 66, 0.6).
 * - Border 1px rgba(212, 160, 23, 0.2), radius 14.
 * - Focused border rgba(212, 160, 23, 0.6) with soft gold shadow.
 * - Placeholder in TEXT_MUTED italic.
 * - 320ms Reanimated transition on focus using divine-out easing.
 */

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const BG = 'rgba(22, 26, 66, 0.6)';
const BORDER_IDLE = 'rgba(212, 160, 23, 0.2)';
const BORDER_FOCUS = 'rgba(212, 160, 23, 0.6)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_MUTED = '#7A7060';
const RADIUS = 14;
const FOCUS_DURATION_MS = 320;
const easeDivineOut = Easing.bezier(0.16, 1, 0.3, 1);

export interface SacredInputProps extends Omit<TextInputProps, 'style'> {
  /** Optional label displayed above the input. */
  readonly label?: string;
  /** Validation error message displayed below the input. */
  readonly error?: string;
  /** Optional style override for the wrapping container. */
  readonly containerStyle?: ViewStyle;
  /** Optional accessory rendered inside the input (right side). */
  readonly rightAccessory?: React.ReactNode;
}

function SacredInputInner({
  label,
  error,
  containerStyle,
  rightAccessory,
  onFocus,
  onBlur,
  editable = true,
  placeholder,
  ...props
}: SacredInputProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(true);
      focusProgress.value = withTiming(1, {
        duration: FOCUS_DURATION_MS,
        easing: easeDivineOut,
      });
      onFocus?.(e);
    },
    [focusProgress, onFocus],
  );

  const handleBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(false);
      focusProgress.value = withTiming(0, {
        duration: FOCUS_DURATION_MS,
        easing: easeDivineOut,
      });
      onBlur?.(e);
    },
    [focusProgress, onBlur],
  );

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [BORDER_IDLE, BORDER_FOCUS],
    ),
    shadowOpacity: 0.12 * focusProgress.value,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Animated.View
        style={[
          styles.inputWrapper,
          animatedBorder,
          !editable ? styles.disabled : null,
        ]}
      >
        <TextInput
          {...props}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUTED}
          selectionColor="#D4A017"
          style={[styles.input, focused ? styles.inputFocused : null]}
          accessibilityLabel={props.accessibilityLabel ?? label}
        />
        {rightAccessory ? (
          <View style={styles.accessory}>{rightAccessory}</View>
        ) : null}
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Text input with gold focus border, outer glow, and italic placeholder. */
export const SacredInput = React.memo(SacredInputInner);

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: '#C8BFA8',
    letterSpacing: 0.4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
    // Shadow (iOS) / elevation (Android) keyed to focus progress.
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    color: TEXT_PRIMARY,
    paddingVertical: 12,
  },
  inputFocused: {
    color: TEXT_PRIMARY,
  },
  accessory: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#C0392B',
    marginTop: 2,
  },
});
