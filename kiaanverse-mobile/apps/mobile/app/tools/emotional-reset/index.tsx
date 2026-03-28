/**
 * Emotional Reset Entry Screen
 *
 * User selects the emotion they are experiencing and its intensity,
 * then begins the sacred 7-step healing flow. A CrisisDetector overlay
 * appears when intensity is dangerously high (>= 9) to offer support.
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  GoldenButton,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';
import { useStartEmotionalReset } from '@kiaanverse/api';
import { useEmotionalResetStore } from '@kiaanverse/store';
import { EmotionSelector } from '../../../components/emotional-reset/EmotionSelector';
import { IntensitySlider } from '../../../components/emotional-reset/IntensitySlider';
import { CrisisDetector } from '../../../components/emotional-reset/CrisisDetector';

export default function EmotionalResetEntryScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { t } = useTranslation();
  const startReset = useStartEmotionalReset();
  const setSession = useEmotionalResetStore((s) => s.setSession);

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [showCrisis, setShowCrisis] = useState(false);

  const handleIntensityChange = useCallback((value: number) => {
    setIntensity(value);
    if (value >= 9) {
      setShowCrisis(true);
    }
  }, []);

  const handleBeginReset = useCallback(() => {
    if (!selectedEmotion) return;

    startReset.mutate(
      { emotion: selectedEmotion, intensity },
      {
        onSuccess: (data) => {
          setSession({
            id: data.sessionId,
            emotion: selectedEmotion,
            intensity,
            startedAt: Date.now(),
            steps: data.steps,
          });
          router.push('/tools/emotional-reset/1');
        },
      },
    );
  }, [selectedEmotion, intensity, startReset, setSession, router]);

  const intensityLabel = getIntensityLabel(intensity);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
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

        {/* Emotion Grid */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onSelect={setSelectedEmotion}
          />
        </Animated.View>

        {/* Intensity Slider */}
        {selectedEmotion ? (
          <Animated.View entering={FadeInDown.duration(400)}>
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

        {/* Begin Button */}
        {selectedEmotion ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <GoldenButton
              title={t('emotionalReset.begin', 'Begin Sacred Reset')}
              onPress={handleBeginReset}
              variant="divine"
              loading={startReset.isPending}
              disabled={!selectedEmotion}
              style={styles.beginButton}
              testID="begin-reset-btn"
            />
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Crisis Overlay */}
      {showCrisis ? (
        <CrisisDetector onDismiss={() => setShowCrisis(false)} />
      ) : null}
    </Screen>
  );
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  intensityLabel: {
    marginTop: spacing.sm,
  },
  beginButton: {
    marginTop: spacing.md,
  },
});
