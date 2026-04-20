/**
 * Ardha — Perspective Reframing Tool
 *
 * Users describe a troubling situation and KIAAN provides a reframed
 * perspective grounded in Bhagavad Gita wisdom. Results reveal with
 * staggered animation: original situation, transformation arrow,
 * new perspective, verse card, and affirmation.
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  Input,
  GoldenButton,
  GoldenHeader,
  LoadingMandala,
  VerseCard,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useArdhaReframe } from '@kiaanverse/api';
import type { ArdhaReframeResponse } from '@kiaanverse/api';

export default function ArdhaScreen(): React.JSX.Element {
  const router = useRouter();
  const reframeMutation = useArdhaReframe();

  const [situation, setSituation] = useState('');
  const [result, setResult] = useState<ArdhaReframeResponse | null>(null);

  const handleReframe = useCallback(() => {
    if (!situation.trim()) return;

    reframeMutation.mutate(
      { situation: situation.trim() },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      },
    );
  }, [situation, reframeMutation]);

  const handleReset = useCallback(() => {
    setSituation('');
    setResult(null);
  }, []);

  return (
    <Screen>
      <GoldenHeader title="Ardha" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text variant="body" color={colors.text.secondary} align="center">
            See with New Eyes
          </Text>
          <Text variant="caption" color={colors.primary[300]} align="center" style={styles.verseRef}>
            BG 2.16 — "The unreal has no being; the real never ceases to be."
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center" style={styles.introText}>
            Ardha invites you to hold two perspectives at once — finding wisdom
            in what troubles you and discovering light in every shadow.
          </Text>
        </Animated.View>

        {!result ? (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.formSection}>
            <Input
              label="Describe a situation that troubles you"
              placeholder="What is weighing on your heart..."
              value={situation}
              onChangeText={setSituation}
              multiline
              numberOfLines={4}
            />

            <GoldenButton
              title="Reframe My Perspective"
              onPress={handleReframe}
              disabled={!situation.trim() || reframeMutation.isPending}
              loading={reframeMutation.isPending}
              style={styles.button}
            />
          </Animated.View>
        ) : null}

        {reframeMutation.isPending && !result ? (
          <View style={styles.loadingContainer}>
            <LoadingMandala size={80} />
            <Text variant="body" color={colors.primary[300]} align="center">
              Shifting perspective...
            </Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.resultsSection}>
            {/* Original situation */}
            <Animated.View entering={FadeInUp.delay(0).duration(500)}>
              <Card style={styles.originalCard}>
                <Text variant="caption" color={colors.text.muted}>
                  Your Situation
                </Text>
                <Text variant="body" color={colors.text.secondary} style={styles.fadedText}>
                  {result.original_situation}
                </Text>
              </Card>
            </Animated.View>

            {/* Transformation arrow */}
            <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.arrowContainer}>
              <Text variant="h2" color={colors.primary[300]} align="center">
                {'\u2193'}
              </Text>
              <Text variant="caption" color={colors.primary[300]} align="center">
                Transformed through wisdom
              </Text>
            </Animated.View>

            {/* Reframed perspective */}
            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
              <Card style={styles.reframedCard}>
                <Text variant="label" color={colors.primary[300]}>
                  A New Perspective
                </Text>
                <Text variant="body" color={colors.text.primary} style={styles.reframedText}>
                  {result.reframed_perspective}
                </Text>
              </Card>
            </Animated.View>

            {/* Verse card */}
            {result.verse ? (
              <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                <VerseCard
                  verse={{
                    chapter: result.verse.chapter,
                    verse: result.verse.verse,
                    sanskrit: result.verse.text,
                    transliteration: '',
                    translation: result.verse.translation,
                    speaker: '',
                  }}
                />
              </Animated.View>
            ) : null}

            {/* Affirmation */}
            <Animated.View entering={FadeInUp.delay(800).duration(500)}>
              <Card style={styles.affirmationCard}>
                <Text variant="caption" color={colors.primary[300]}>
                  Affirmation
                </Text>
                <Text
                  variant="body"
                  color={colors.divine.aura}
                  align="center"
                  style={styles.affirmationText}
                >
                  "{result.affirmation}"
                </Text>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(1000).duration(500)}>
              <GoldenButton title="Try Another" onPress={handleReset} variant="divine" />
            </Animated.View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  verseRef: {
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  introText: {
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  formSection: {
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  resultsSection: {
    gap: spacing.md,
  },
  originalCard: {
    gap: spacing.xs,
    opacity: 0.7,
  },
  fadedText: {
    lineHeight: 22,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xxs,
  },
  reframedCard: {
    gap: spacing.sm,
    borderColor: colors.alpha.goldMedium,
    borderWidth: 1,
  },
  reframedText: {
    lineHeight: 24,
  },
  affirmationCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  affirmationText: {
    fontStyle: 'italic',
    lineHeight: 24,
  },
});
