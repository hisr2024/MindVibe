/**
 * Emotional Reset Screen
 *
 * Guided emotional reset tool powered by KIAAN AI + Gita wisdom.
 * Flow:
 * 1. Select current emotion (distress level)
 * 2. Guided breathing exercise
 * 3. Gita verse for the emotion
 * 4. KIAAN personalized guidance
 * 5. Micro-commitment
 *
 * Integrates with: /api/emotional-reset/start and /api/emotional-reset/step
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@services/apiClient';
import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Emotion Options
// ---------------------------------------------------------------------------

const EMOTIONS = [
  { id: 'anger', emoji: '😤', label: 'Anger', color: '#ef4444' },
  { id: 'anxiety', emoji: '😰', label: 'Anxiety', color: '#f59e0b' },
  { id: 'sadness', emoji: '😢', label: 'Sadness', color: '#3b82f6' },
  { id: 'overwhelm', emoji: '😵', label: 'Overwhelm', color: '#8b5cf6' },
  { id: 'jealousy', emoji: '💚', label: 'Jealousy', color: '#22c55e' },
  { id: 'fear', emoji: '😨', label: 'Fear', color: '#6366f1' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ResetPhase = 'select' | 'breathing' | 'wisdom' | 'guidance' | 'commitment';

export function EmotionalResetScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const navigation = useNavigation();

  const [phase, setPhase] = useState<ResetPhase>('select');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  const handleEmotionSelect = useCallback(async (emotionId: string) => {
    setSelectedEmotion(emotionId);
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/api/emotional-reset/start', {
        emotion: emotionId,
        intensity: 7,
      });
      setSessionData(data);
      setPhase('breathing');
    } catch {
      // Fallback to local guidance
      setSessionData({
        verse: 'yoga-sthah kuru karmani sangam tyaktva dhananjaya',
        translation: 'Perform your duty equipoised, abandoning attachment to success or failure.',
        reference: 'BG 2.48',
        guidance: 'Take a moment to breathe deeply. The Gita teaches us that equanimity is the highest yoga.',
      });
      setPhase('breathing');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBreathComplete = useCallback(() => {
    if (breathCount < 3) {
      setBreathCount((prev) => prev + 1);
    } else {
      setPhase('wisdom');
    }
  }, [breathCount]);

  const renderPhase = () => {
    switch (phase) {
      case 'select':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: theme.textPrimary }]}>
              How are you feeling?
            </Text>
            <Text style={[styles.phaseSubtitle, { color: theme.textSecondary }]}>
              Select the emotion you'd like to work through
            </Text>
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((emotion) => (
                <TouchableOpacity
                  key={emotion.id}
                  style={[
                    styles.emotionCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: selectedEmotion === emotion.id ? emotion.color : theme.cardBorder,
                      borderWidth: selectedEmotion === emotion.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleEmotionSelect(emotion.id)}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={emotion.label}
                >
                  <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                  <Text style={[styles.emotionLabel, { color: theme.textPrimary }]}>
                    {emotion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {isLoading && <ActivityIndicator style={{ marginTop: spacing.xl }} color={theme.accent} />}
          </Animated.View>
        );

      case 'breathing':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContainer}>
            <Text style={[styles.breathEmoji]}>🌬️</Text>
            <Text style={[styles.phaseTitle, { color: theme.textPrimary }]}>
              Breathe Deeply
            </Text>
            <Text style={[styles.phaseSubtitle, { color: theme.textSecondary }]}>
              Breath {breathCount + 1} of 4
            </Text>
            <Text style={[styles.breathInstruction, { color: theme.accent }]}>
              Inhale... Hold... Exhale...
            </Text>
            <TouchableOpacity
              style={[styles.breathButton, { backgroundColor: theme.accent }]}
              onPress={handleBreathComplete}
              accessibilityRole="button"
              accessibilityLabel="Complete breath"
            >
              <Text style={styles.breathButtonText}>
                {breathCount < 3 ? 'Next Breath' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'wisdom':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: theme.textPrimary }]}>
              Gita Wisdom
            </Text>
            <View style={[styles.verseCard, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.verseSanskrit, { color: theme.accent }]}>
                {(sessionData?.verse as string) ?? ''}
              </Text>
              <Text style={[styles.verseTranslation, { color: theme.textSecondary }]}>
                {(sessionData?.translation as string) ?? ''}
              </Text>
              <Text style={[styles.verseRef, { color: theme.textTertiary }]}>
                — {(sessionData?.reference as string) ?? ''}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.accent }]}
              onPress={() => setPhase('guidance')}
              accessibilityRole="button"
            >
              <Text style={styles.nextButtonText}>Receive Guidance</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'guidance':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContainer}>
            <Text style={[styles.phaseTitle, { color: theme.textPrimary }]}>
              KIAAN's Guidance
            </Text>
            <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
              {(sessionData?.guidance as string) ?? 'Remember: emotions are temporary waves on the ocean of your consciousness. Like the Gita teaches, you are the observer — unchanging, eternal, at peace.'}
            </Text>
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.accent }]}
              onPress={() => setPhase('commitment')}
              accessibilityRole="button"
            >
              <Text style={styles.nextButtonText}>Set Intention</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'commitment':
        return (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.phaseContainer}>
            <Text style={styles.completeEmoji}>🕉️</Text>
            <Text style={[styles.phaseTitle, { color: theme.textPrimary }]}>
              Reset Complete
            </Text>
            <Text style={[styles.phaseSubtitle, { color: theme.textSecondary }]}>
              You've taken a powerful step toward inner peace. The awareness you showed today is itself the practice.
            </Text>
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.accent }]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.nextButtonText}>Return Home</Text>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing['3xl'],
        paddingHorizontal: spacing.lg,
      }}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={{ color: theme.accent, fontSize: 18 }}>← Back</Text>
      </TouchableOpacity>

      {renderPhase()}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { marginBottom: spacing.xl, alignSelf: 'flex-start' },
  phaseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  phaseTitle: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
  phaseSubtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing['2xl'], lineHeight: 26 },
  // Emotion selection
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emotionCard: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emotionEmoji: { fontSize: 36 },
  emotionLabel: { ...typography.caption, fontWeight: '600' },
  // Breathing
  breathEmoji: { fontSize: 72, marginBottom: spacing.xl },
  breathInstruction: { ...typography.h2, textAlign: 'center', marginBottom: spacing['3xl'] },
  breathButton: {
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
  },
  breathButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 16,
    fontWeight: '600',
  },
  // Verse
  verseCard: {
    borderRadius: radii.md,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    width: '100%',
  },
  verseSanskrit: { ...typography.sacred, textAlign: 'center', marginBottom: spacing.md },
  verseTranslation: { ...typography.body, fontStyle: 'italic', textAlign: 'center', marginBottom: spacing.sm },
  verseRef: { ...typography.caption, textAlign: 'center' },
  // Guidance
  guidanceText: { ...typography.body, lineHeight: 28, textAlign: 'center', marginBottom: spacing.xl },
  // Complete
  completeEmoji: { fontSize: 72, marginBottom: spacing.xl },
  // Buttons
  nextButton: {
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
