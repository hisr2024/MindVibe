/**
 * KarmaWeightSelector — 4 flame levels laid out horizontally.
 *
 * The user taps the flame that matches the weight they feel. It's not
 * a slider and it's not radio buttons — the flame itself is the metric.
 * Unselected flames dim to 0.3 opacity when a choice has been made so
 * the selected one is the only "lit" option on screen.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/KarmaWeightSelector.tsx`.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DharmaFlameIcon } from './visuals/DharmaFlameIcon';
import type { KarmaWeight, KarmaWeightConfig } from './types';
import { KARMA_WEIGHTS } from './types';

interface KarmaWeightSelectorProps {
  selected: KarmaWeight | null;
  onSelect: (weight: KarmaWeight) => void;
  categoryColor?: string;
}

function WeightFlame({
  weight,
  isSelected,
  otherSelected,
  categoryColor,
  onPress,
}: {
  weight: KarmaWeightConfig;
  isSelected: boolean;
  otherSelected: boolean;
  categoryColor: string;
  onPress: () => void;
}): React.JSX.Element {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 80 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: otherSelected ? 0.3 : 1,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Select weight: ${weight.label}`}
      accessibilityState={{ selected: isSelected }}
      style={styles.pressable}
    >
      <Animated.View style={[styles.flameColumn, animatedStyle]}>
        <DharmaFlameIcon
          size={weight.flameSize}
          intensity={isSelected ? 'bright' : otherSelected ? 'dim' : 'normal'}
          color={isSelected ? categoryColor : '#D4A017'}
          animate={isSelected}
        />
        <Animated.Text
          style={[
            styles.sanskrit,
            { color: isSelected ? categoryColor : '#6B6355' },
          ]}
        >
          {weight.sanskrit}
        </Animated.Text>
        <Animated.Text
          style={[styles.label, { color: isSelected ? '#B8AE98' : '#6B6355' }]}
        >
          {weight.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function KarmaWeightSelector({
  selected,
  onSelect,
  categoryColor = '#D4A017',
}: KarmaWeightSelectorProps): React.JSX.Element {
  const handleSelect = useCallback(
    (weight: KarmaWeightConfig) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(weight.id);
    },
    [onSelect]
  );

  return (
    <View>
      <Animated.Text style={styles.sectionLabel}>
        How heavy does this feel?
      </Animated.Text>
      <View style={styles.row}>
        {KARMA_WEIGHTS.map((w) => {
          const isSelected = selected === w.id;
          const otherSelected = selected !== null && !isSelected;
          return (
            <WeightFlame
              key={w.id}
              weight={w}
              isSelected={isSelected}
              otherSelected={otherSelected}
              categoryColor={categoryColor}
              onPress={() => handleSelect(w)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    color: '#6B6355',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  pressable: {
    alignItems: 'center',
  },
  flameColumn: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 6,
  },
  sanskrit: {
    fontStyle: 'italic',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
  },
});
