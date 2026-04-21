/**
 * BillingToggle — "Monthly" | "Annual (save 40%)" segmented control.
 *
 * The active pill slides with a spring under the selected label rather
 * than blinking; the inactive label stays muted but legible so both
 * options read as genuine choices rather than defaults.
 */

import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BillingPeriod } from '@kiaanverse/api';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.55)';

export interface BillingToggleProps {
  readonly value: BillingPeriod;
  readonly onChange: (next: BillingPeriod) => void;
  /** Savings label (e.g., "save 40%") shown beside the annual option. */
  readonly annualSavingsLabel?: string;
  readonly style?: ViewStyle;
}

function BillingToggleInner({
  value,
  onChange,
  annualSavingsLabel = 'save 40%',
  style,
}: BillingToggleProps): React.JSX.Element {
  const [containerWidth, setContainerWidth] = useState(0);
  const pillX = useSharedValue(value === 'monthly' ? 0 : 1);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const handlePress = useCallback(
    (next: BillingPeriod) => {
      if (next === value) return;
      void Haptics.selectionAsync();
      pillX.value = withSpring(next === 'monthly' ? 0 : 1, {
        damping: 18,
        stiffness: 220,
        mass: 0.6,
      });
      onChange(next);
    },
    [onChange, pillX, value],
  );

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const halfWidth = containerWidth / 2;
    return {
      transform: [{ translateX: pillX.value * halfWidth }],
      width: halfWidth,
    };
  });

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <Animated.View style={[styles.pill, pillAnimatedStyle]} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(212,160,23,0.25)',
            'rgba(212,160,23,0.12)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Option
        label="Monthly"
        active={value === 'monthly'}
        onPress={() => handlePress('monthly')}
      />
      <Option
        label="Annual"
        sub={annualSavingsLabel}
        active={value === 'yearly'}
        onPress={() => handlePress('yearly')}
      />
    </View>
  );
}

function Option({
  label,
  sub,
  active,
  onPress,
}: {
  readonly label: string;
  readonly sub?: string;
  readonly active: boolean;
  readonly onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}${sub ? ` ${sub}` : ''}`}
      style={styles.option}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {sub ? (
        <Text style={[styles.sub, active && styles.subActive]}>{sub}</Text>
      ) : null}
    </Pressable>
  );
}

/** Monthly / Annual segmented control with a spring-sliding gold pill. */
export const BillingToggle = React.memo(BillingToggleInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    backgroundColor: 'rgba(17,20,53,0.85)',
    padding: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
  },
  labelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: SACRED_WHITE,
  },
  sub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: 'rgba(212,160,23,0.55)',
    letterSpacing: 0.8,
  },
  subActive: {
    color: GOLD,
  },
});
