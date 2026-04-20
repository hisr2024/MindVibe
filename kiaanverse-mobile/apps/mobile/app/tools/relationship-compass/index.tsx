/**
 * Relationship Compass — Dharma-guided relationship clarity
 *
 * Users describe a relationship challenge and receive AI-powered guidance
 * grounded in Bhagavad Gita wisdom, dharma principles, and reflection prompts.
 * Session history (last 5) is displayed below the results.
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
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
  Divider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useRelationshipGuide } from '@kiaanverse/api';
import { useRelationshipStore } from '@kiaanverse/store';
import type { RelationshipGuidance } from '@kiaanverse/api';

export default function RelationshipCompassScreen(): React.JSX.Element {
  const router = useRouter();
  const guideMutation = useRelationshipGuide();
  const { sessions, addSession } = useRelationshipStore();

  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<RelationshipGuidance | null>(null);

  const handleSeekGuidance = useCallback(() => {
    if (!question.trim()) return;

    const payload: { question: string; context?: string } = { question: question.trim() };
    const trimmedContext = context.trim();
    if (trimmedContext) payload.context = trimmedContext;
    guideMutation.mutate(
      payload,
      {
        onSuccess: (data) => {
          setResult(data);
          addSession({
            id: `session-${Date.now()}`,
            question: question.trim(),
            guidance: data.guidance,
            verseRef: data.verse ? `${data.verse.chapter}.${data.verse.verse}` : null,
            createdAt: new Date().toISOString(),
          });
        },
      },
    );
  }, [question, context, guideMutation, addSession]);

  const handleReset = useCallback(() => {
    setQuestion('');
    setContext('');
    setResult(null);
  }, []);

  const recentSessions = sessions.slice(0, 5);

  return (
    <Screen>
      <GoldenHeader title="Relationship Compass" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text variant="body" color={colors.text.secondary} align="center">
            Dharma-guided clarity for your relationships
          </Text>
          <Text variant="caption" color={colors.primary[300]} align="center" style={styles.verseRef}>
            BG 6.29 — "One who sees the same Lord dwelling equally everywhere..."
          </Text>
        </Animated.View>

        {!result ? (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.formSection}>
            <Input
              label="What relationship challenge are you facing?"
              placeholder="Describe your situation..."
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Tell me more about the situation (optional)"
              placeholder="Any additional context..."
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={2}
            />

            <GoldenButton
              title="Seek Guidance"
              onPress={handleSeekGuidance}
              disabled={!question.trim() || guideMutation.isPending}
              loading={guideMutation.isPending}
              style={styles.button}
            />
          </Animated.View>
        ) : null}

        {guideMutation.isPending && !result ? (
          <View style={styles.loadingContainer}>
            <LoadingMandala size={80} />
            <Text variant="body" color={colors.primary[300]} align="center">
              Seeking wisdom...
            </Text>
          </View>
        ) : null}

        {result ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.resultsSection}>
            <Card style={styles.guidanceCard}>
              <Text variant="label" color={colors.primary[300]}>
                Guidance
              </Text>
              <Text variant="body" color={colors.text.primary} style={styles.guidanceText}>
                {result.guidance}
              </Text>
            </Card>

            {result.verse ? (
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
            ) : null}

            {result.dharma_principles?.length > 0 ? (
              <Card>
                <Text variant="label" color={colors.primary[300]} style={styles.sectionLabel}>
                  Dharma Principles
                </Text>
                {result.dharma_principles.map((principle, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text variant="body" color={colors.divine.aura}>{'\u2022'}</Text>
                    <Text variant="body" color={colors.text.secondary} style={styles.bulletText}>
                      {principle}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {result.reflection_prompts?.length > 0 ? (
              <Card>
                <Text variant="label" color={colors.primary[300]} style={styles.sectionLabel}>
                  Reflection Prompts
                </Text>
                {result.reflection_prompts.map((prompt, i) => (
                  <Text key={i} variant="body" color={colors.text.secondary} style={styles.promptText}>
                    {i + 1}. {prompt}
                  </Text>
                ))}
              </Card>
            ) : null}

            <GoldenButton title="Ask Another Question" onPress={handleReset} variant="divine" />
          </Animated.View>
        ) : null}

        {recentSessions.length > 0 && !result ? (
          <View style={styles.historySection}>
            <Divider />
            <Text variant="label" color={colors.text.muted} style={styles.historyTitle}>
              Recent Sessions
            </Text>
            {recentSessions.map((session) => (
              <Card key={session.id} style={styles.historyCard}>
                <Text variant="bodySmall" color={colors.text.primary} numberOfLines={2}>
                  {session.question}
                </Text>
                <Text variant="caption" color={colors.text.muted}>
                  {new Date(session.createdAt).toLocaleDateString()}
                  {session.verseRef ? ` \u2022 BG ${session.verseRef}` : ''}
                </Text>
              </Card>
            ))}
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
  guidanceCard: {
    gap: spacing.sm,
  },
  guidanceText: {
    lineHeight: 24,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  bulletText: {
    flex: 1,
  },
  promptText: {
    paddingVertical: spacing.xxs,
  },
  historySection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  historyTitle: {
    marginTop: spacing.sm,
  },
  historyCard: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
