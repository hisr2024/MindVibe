/**
 * ConversationStarters — empty-state entry points for the Sakha chat.
 *
 * A centered column of four SacredChip prompts (matches web copy exactly).
 * Each chip enters with a 200 ms stagger using a "lotus-bloom" ease curve
 * (ease-out cubic with a soft overshoot). Tapping a chip fires a Light
 * haptic, then hands the prompt text to `onSelect` which the parent uses
 * to fill the input and immediately submit.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const TEXT_PRIMARY = '#F5F0E8';

/** Exact web copy — do not localize without the matching i18n keys. */
const STARTERS: readonly string[] = [
  'What is my dharma in this moment?',
  'I am afraid. What does Krishna say?',
  'Explain the nature of the Atman',
  'How do I find peace amidst chaos?',
];

/** Stagger between chips on entrance. */
const STAGGER_MS = 200;

export interface ConversationStartersProps {
  /** Called with the chip text when the user taps a starter. */
  readonly onSelect: (prompt: string) => void;
}

interface ChipProps {
  readonly text: string;
  readonly delay: number;
  readonly onPress: () => void;
}

function SacredChip({ text, delay, onPress }: ChipProps): React.JSX.Element {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    // lotus-bloom: ease-out cubic with a mild overshoot via delayed scale.
    opacity.value = withDelay(delay, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [delay, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePress = React.useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[styles.chipWrap, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={text}
        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      >
        <LinearGradient
          colors={[
            'rgba(19,26,61,0.9)',
            'rgba(27,79,187,0.35)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.Text style={styles.chipText}>{text}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

function ConversationStartersInner({
  onSelect,
}: ConversationStartersProps): React.JSX.Element {
  return (
    <View
      style={styles.container}
      accessibilityRole="menu"
      accessibilityLabel="Conversation starters"
    >
      {STARTERS.map((prompt, i) => (
        <SacredChip
          key={prompt}
          text={prompt}
          delay={i * STAGGER_MS}
          onPress={() => onSelect(prompt)}
        />
      ))}
    </View>
  );
}

/** Empty-state column of 4 SacredChip conversation starters. */
export const ConversationStarters = React.memo(ConversationStartersInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  chipWrap: {
    width: '100%',
    maxWidth: 340,
  },
  chip: {
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
});
