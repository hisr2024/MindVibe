/**
 * Emotional Reset Entry Screen
 *
 * Full-screen immersive entry point where the user selects an emotion and
 * intensity before beginning the 6-step sacred healing flow. The layout fills
 * the entire viewport with no ScrollView -- content is vertically distributed
 * using flex. A CrisisDetector overlay appears when intensity >= 9.
 *
 * Layout hierarchy (flat, no unnecessary nesting):
 *   DivineBackground (fills screen) > paddedContent > header / orb / grid / slider / spacer / CTA
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Text,
  GoldenButton,
  DivineBackground,
  EmotionOrb,
  SacredStepIndicator,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';
import { useStartEmotionalReset } from '@kiaanverse/api';
import { useEmotionalResetStore } from '@kiaanverse/store';
import { EmotionSelector } from '../../../components/emotional-reset/EmotionSelector';
import { IntensitySlider } from '../../../components/emotional-reset/IntensitySlider';
import { CrisisDetector } from '../../../components/emotional-reset/CrisisDetector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Orb size is 30% of screen width, clamped between 100-160px for usability.
 * This keeps it prominent on small phones while not dominating tablets.
 */
const ORB_SIZE = Math.max(100, Math.min(160, SCREEN_WIDTH * 0.3));

export default function EmotionalResetEntryScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const startReset = useStartEmotionalReset();
  const setSession = useEmotionalResetStore((s) => s.setSession);

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [showCrisis, setShowCrisis] = useState(false);

  /** Select an emotion with medium haptic feedback. */
  const handleEmotionSelect = useCallback((emotion: string) => {
    setSelectedEmotion(emotion);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  /** Update intensity with light haptic; trigger crisis overlay at >= 9. */
  const handleIntensityChange = useCallback((value: number) => {
    setIntensity(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value >= 9) {
      setShowCrisis(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  /** Start the reset session via API, then navigate to step 1. */
  const handleBeginReset = useCallback(() => {
    if (!selectedEmotion) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    startReset.mutate(
      { emotion: selectedEmotion, intensity },
      {
        onSuccess: (data) => {
          setSession({
            id: data.session_id,
            emotion: selectedEmotion,
            intensity,
            startedAt: Date.now(),
            steps: [
              'breathing',
              'visualization',
              'wisdom',
              'affirmation',
              'reflection',
              'summary',
            ],
          });
          router.push('/tools/emotional-reset/1');
        },
      },
    );
  }, [selectedEmotion, intensity, startReset, setSession, router]);

  const intensityLabel = getIntensityLabel(intensity);

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Header - compact title and subtitle */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text variant="h1" color={colors.divine.aura} align="center">
            {t('emotionalReset.title', 'Sacred Emotional Reset')}
          </Text>
          <Text
            variant="body"
            color={c.textSecondary}
            align="center"
            style={styles.subtitle}
          >
            {t('emotionalReset.subtitle', 'What are you feeling right now?')}
          </Text>
        </Animated.View>

        {/* Large EmotionOrb - prominent visual anchor */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.orbCenter}>
          <EmotionOrb
            mood={mapEmotionToMood(selectedEmotion)}
            size={ORB_SIZE}
            isAnimating={!!selectedEmotion}
          />
        </Animated.View>

        {/* Step indicator - shows position in overall flow */}
        <SacredStepIndicator totalSteps={7} currentStep={0} completedSteps={[]} />

        {/* Emotion grid - compact 3-column tappable grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emotionGrid}>
          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onSelect={handleEmotionSelect}
          />
        </Animated.View>

        {/* Intensity slider - animated slide-in only after an emotion is selected */}
        {selectedEmotion ? (
          <Animated.View entering={SlideInDown.duration(400).springify()}>
            <Text
              variant="label"
              color={c.textSecondary}
              style={styles.sectionLabel}
            >
              {t('emotionalReset.intensityLabel', 'How intense is it?')}
            </Text>
            <IntensitySlider value={intensity} onChange={handleIntensityChange} />
            <Text
              variant="bodySmall"
              color={colors.primary[300]}
              align="center"
              style={styles.intensityLabel}
            >
              {intensityLabel}
            </Text>
          </Animated.View>
        ) : null}

        {/* Flexible spacer pushes CTA to bottom edge */}
        <View style={styles.spacer} />

        {/* Bottom-anchored CTA -- safe area padding applied to parent */}
        {selectedEmotion ? (
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <GoldenButton
              title={t('emotionalReset.begin', 'Begin Sacred Reset')}
              onPress={handleBeginReset}
              variant="divine"
              loading={startReset.isPending}
              disabled={!selectedEmotion}
              testID="begin-reset-btn"
            />
          </Animated.View>
        ) : null}
      </View>

      {/* Crisis Overlay - fullscreen modal */}
      {showCrisis ? (
        <CrisisDetector onDismiss={() => setShowCrisis(false)} />
      ) : null}
    </DivineBackground>
  );
}

/**
 * Maps an emotion string to one of the 8 EmotionOrb mood values.
 * Falls back to 'peaceful' when no emotion is selected.
 */
function mapEmotionToMood(
  emotion: string | null,
): 'peaceful' | 'joyful' | 'confused' | 'anxious' | 'sad' | 'grateful' | 'angry' | 'hopeful' {
  if (!emotion) return 'peaceful';

  const moodMap: Record<
    string,
    'peaceful' | 'joyful' | 'confused' | 'anxious' | 'sad' | 'grateful' | 'angry' | 'hopeful'
  > = {
    anger: 'angry',
    anxiety: 'anxious',
    sadness: 'sad',
    grief: 'sad',
    fear: 'anxious',
    confusion: 'confused',
    loneliness: 'sad',
    shame: 'anxious',
    frustration: 'angry',
    jealousy: 'angry',
    overwhelm: 'anxious',
    restlessness: 'confused',
  };

  return moodMap[emotion] ?? 'peaceful';
}

/**
 * Returns a poetic label describing the emotional intensity level.
 * Ranges map to spiritual metaphors for water/storm imagery.
 */
function getIntensityLabel(value: number): string {
  if (value <= 3) return 'Gentle Ripple';
  if (value <= 6) return 'Strong Current';
  if (value <= 9) return 'Tidal Wave';
  return 'Sacred Storm';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  orbCenter: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  emotionGrid: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  intensityLabel: {
    marginTop: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
});
