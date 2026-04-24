/**
 * ReflectionStep -- Sacred journaling with guided prompts (Step 5 of Emotional Reset).
 *
 * Full-screen immersive layout with:
 *   - Animated sacred prompt that breathes with gentle opacity pulse
 *   - TextInput with sacred golden border glow that intensifies as user writes
 *   - Live word count with milestone haptics every 50 characters
 *   - Saves reflection to store via setStepResponse for API persistence
 *   - KeyboardAvoidingView ensures CTA stays above keyboard on iOS/Android
 *   - MandalaSpin backdrop at reduced opacity for atmosphere
 *
 * NO ScrollView -- content and input share flex space within the viewport.
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  MandalaSpin,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useEmotionalResetStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReflectionStepProps {
  readonly onNext: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CHARS = 1000;
const HAPTIC_MILESTONE = 50;

/**
 * Rotating sacred prompts to inspire deeper reflection.
 * A random prompt is selected on mount for variety.
 */
const SACRED_PROMPTS = [
  'What has this emotion been trying to teach you?',
  'What truth lies beneath this feeling?',
  'If this emotion could speak, what would it say?',
  'What would your wisest self say to you right now?',
  'What are you ready to release in this moment?',
  'What gentle lesson does this experience carry?',
] as const;

/**
 * Emotion-specific prompts for deeper contextual reflection.
 */
const EMOTION_PROMPTS: Record<string, string> = {
  anger: 'What boundary needs to be honored beneath this anger?',
  anxiety: 'What does your anxious mind need you to know right now?',
  sadness: 'What tender part of you is asking to be held?',
  grief: 'What love lives within this grief that you want to honor?',
  fear: 'What courage is being born from this moment of fear?',
  confusion: 'What clarity is waiting on the other side of this uncertainty?',
  loneliness: 'What connection is your soul seeking in this solitude?',
  shame: 'What compassion would you offer a dear friend feeling this way?',
  frustration: 'What deeper need is not being met beneath this frustration?',
  jealousy: 'What unacknowledged desire does this jealousy reveal?',
  overwhelm: 'What is the one thing that matters most right now?',
  restlessness: 'What is your restless spirit searching for?',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReflectionStep({
  onNext,
}: ReflectionStepProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const emotion = useEmotionalResetStore((s) => s.session?.emotion);
  const setStepResponse = useEmotionalResetStore((s) => s.setStepResponse);

  const [text, setText] = useState('');
  const charMilestoneRef = useRef(0);

  // Select prompt based on emotion or random sacred prompt
  const prompt = useMemo(() => {
    if (emotion && EMOTION_PROMPTS[emotion]) {
      return EMOTION_PROMPTS[emotion];
    }
    return SACRED_PROMPTS[Math.floor(Math.random() * SACRED_PROMPTS.length)];
  }, [emotion]);

  // Animated border glow that intensifies as user writes more
  const borderGlow = useSharedValue(0.3);
  const promptBreath = useSharedValue(0.7);

  useEffect(() => {
    // Gentle breathing animation on the prompt text
    promptBreath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.65, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [promptBreath]);

  // Update border glow based on text length
  useEffect(() => {
    const intensity = Math.min(text.length / 200, 1);
    borderGlow.value = withTiming(0.3 + intensity * 0.7, { duration: 500 });
  }, [text.length, borderGlow]);

  const promptStyle = useAnimatedStyle(() => ({
    opacity: promptBreath.value,
  }));

  const borderStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(
      borderGlow.value,
      [0.3, 1],
      [0.15, 0.6],
      Extrapolation.CLAMP
    );
    return {
      borderColor: `rgba(212, 160, 23, ${borderOpacity})`,
      shadowOpacity: borderGlow.value * 0.3,
    };
  });

  /**
   * Haptic feedback every 50 characters typed.
   * Intensity increases with more writing to reward the user.
   */
  const handleChangeText = useCallback((value: string) => {
    setText(value);
    const currentMilestone = Math.floor(value.length / HAPTIC_MILESTONE);
    if (currentMilestone > charMilestoneRef.current) {
      charMilestoneRef.current = currentMilestone;
      if (currentMilestone >= 4) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    // Track backwards too
    if (currentMilestone < charMilestoneRef.current) {
      charMilestoneRef.current = currentMilestone;
    }
  }, []);

  /** Save reflection to store and advance to next step. */
  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Persist reflection to store for API submission
    setStepResponse(5, {
      reflection: text,
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      completedAt: new Date().toISOString(),
    });

    onNext();
  }, [text, onNext, setStepResponse]);

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text]
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* MandalaSpin backdrop */}
      <View style={styles.mandalaBackdrop}>
        <MandalaSpin
          size={SCREEN_WIDTH * 0.7}
          speed="slow"
          color={colors.alpha.goldLight}
          opacity={0.06}
        />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.header}
        >
          <Text variant="h2" color={colors.divine.aura} align="center">
            Reflect Within
          </Text>
          <Text variant="caption" color={colors.primary[500]} align="center">
            Sacred Journaling
          </Text>
        </Animated.View>

        {/* Animated prompt */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.promptContainer}
        >
          <Animated.View style={promptStyle}>
            <Text
              variant="body"
              color={c.textSecondary}
              align="center"
              style={styles.promptText}
            >
              {prompt}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Sacred TextInput with animated golden border */}
        <Animated.View
          entering={FadeIn.delay(400).duration(500)}
          style={styles.inputContainer}
        >
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background.card,
                shadowColor: colors.divine.aura,
              },
              borderStyle,
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: c.textPrimary,
                },
              ]}
              placeholder="Let your thoughts flow freely..."
              placeholderTextColor={c.textTertiary}
              multiline
              value={text}
              onChangeText={handleChangeText}
              maxLength={MAX_CHARS}
              accessibilityLabel="Reflection journal entry"
              textAlignVertical="top"
              selectionColor={colors.primary[500]}
            />
          </Animated.View>

          {/* Word count and character counter */}
          <View style={styles.counters}>
            <Text variant="caption" color={colors.text.muted}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Text>
            <Text
              variant="caption"
              color={
                text.length > MAX_CHARS * 0.9
                  ? colors.semantic.warning
                  : colors.text.muted
              }
            >
              {text.length}/{MAX_CHARS}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Continue button anchored at bottom, pushed above keyboard */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
      >
        <GoldenButton
          title={text.trim().length > 0 ? 'Continue' : 'Skip Reflection'}
          onPress={handleContinue}
          variant={text.trim().length > 0 ? 'primary' : 'secondary'}
          testID="reflection-next-btn"
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mandalaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
    zIndex: 1,
  },
  header: {
    gap: spacing.xxs,
  },
  promptContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  promptText: {
    lineHeight: 26,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flex: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  counters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  bottomCTA: {
    paddingHorizontal: spacing.sm,
    zIndex: 1,
  },
});
