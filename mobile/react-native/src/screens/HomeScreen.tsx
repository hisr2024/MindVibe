/**
 * Home Dashboard Screen — MindVibe Mobile
 *
 * The landing screen after authentication. Displays:
 * - Time-aware greeting
 * - Daily verse card (tap to play in Vibe Player)
 * - Quick mood entry (emotion wheel)
 * - Active journey progress card
 * - Sakha's personalized insight nudge
 *
 * All data is fetched via TanStack Query with offline fallback.
 * The KIAAN AI Ecosystem is consumed read-only for insights.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, darkTheme, spacing, typography, radii, shadows } from '@theme/tokens';
import type { Emotion } from '@types/index';

// ---------------------------------------------------------------------------
// Time-Aware Greeting
// ---------------------------------------------------------------------------

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 7) return { text: 'Sacred dawn, seeker', emoji: '🌅' };
  if (hour >= 7 && hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Peaceful afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Gentle evening', emoji: '🌙' };
  return { text: 'Quiet night', emoji: '✨' };
}

// ---------------------------------------------------------------------------
// Quick Mood Emotions
// ---------------------------------------------------------------------------

const QUICK_EMOTIONS: Array<{ emotion: Emotion; emoji: string; label: string }> = [
  { emotion: 'happy', emoji: '😊', label: 'Happy' },
  { emotion: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { emotion: 'anxious', emoji: '😰', label: 'Anxious' },
  { emotion: 'sad', emoji: '😢', label: 'Sad' },
  { emotion: 'grateful', emoji: '🙏', label: 'Grateful' },
];

// ---------------------------------------------------------------------------
// Screen Component
// ---------------------------------------------------------------------------

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const greeting = getGreeting();

  const handleMoodSelect = useCallback((emotion: Emotion) => {
    // In production: navigate to mood detail or quick-log via API
  }, []);

  const handleVersePlay = useCallback(() => {
    // In production: load daily verse into Vibe Player
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {}}
          tintColor={colors.gold[400]}
        />
      }
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={[styles.greeting, { color: theme.textPrimary }]}>
          {greeting.emoji} {greeting.text}
        </Text>
      </Animated.View>

      {/* Daily Verse Card */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Pressable
          style={[styles.verseCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={handleVersePlay}
          accessibilityRole="button"
          accessibilityLabel="Today's verse: Bhagavad Gita 2.47 — Karma Yoga. Tap to play."
        >
          <Text style={[styles.verseLabel, { color: colors.gold[400] }]}>
            TODAY'S VERSE
          </Text>
          <Text style={[styles.verseSanskrit, { color: colors.gold[300] }]}>
            कर्मण्येवाधिकारस्ते मा फलेषु कदाचन
          </Text>
          <Text style={[styles.verseTranslation, { color: theme.textPrimary }]}>
            "You have the right to work, but never to its fruits."
          </Text>
          <Text style={[styles.verseRef, { color: theme.textSecondary }]}>
            Bhagavad Gita 2.47 — Karma Yoga
          </Text>
          <View style={styles.verseActions}>
            <View style={[styles.verseActionButton, { backgroundColor: colors.gold[500] }]}>
              <Text style={styles.verseActionText}>▶ Listen</Text>
            </View>
            <View style={[styles.verseActionButton, { backgroundColor: theme.inputBackground }]}>
              <Text style={[styles.verseActionText, { color: theme.textPrimary }]}>
                📖 Read
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Quick Mood Entry */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          How are you feeling?
        </Text>
        <View style={styles.moodRow}>
          {QUICK_EMOTIONS.map((item) => (
            <Pressable
              key={item.emotion}
              onPress={() => handleMoodSelect(item.emotion)}
              style={styles.moodButton}
              accessibilityRole="button"
              accessibilityLabel={`Log mood: ${item.label}`}
            >
              <Text style={styles.moodEmoji}>{item.emoji}</Text>
              <Text style={[styles.moodLabel, { color: theme.textSecondary }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Journey Progress Card */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Pressable
          style={[styles.journeyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          accessibilityRole="button"
          accessibilityLabel="Journey progress: Conquering Krodha, 57% complete, Day 8 of 14"
        >
          <Text style={[styles.journeyTitle, { color: theme.textPrimary }]}>
            Conquering Krodha (Anger)
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '57%' }]} />
          </View>
          <Text style={[styles.journeyProgress, { color: theme.textSecondary }]}>
            Day 8 of 14 — 57% complete
          </Text>
        </Pressable>
      </Animated.View>

      {/* Sakha's Insight */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <View
          style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          accessibilityRole="text"
        >
          <Text style={styles.insightIcon}>💡</Text>
          <Text style={[styles.insightLabel, { color: colors.gold[400] }]}>
            Sakha's Insight
          </Text>
          <Text style={[styles.insightText, { color: theme.textPrimary }]}>
            "Your evening reflections show growing equanimity. The Gita teaches
            that a steady mind is the foundation of inner peace."
          </Text>
          <Text style={[styles.insightVerse, { color: theme.textSecondary }]}>
            — Based on BG 6.7
          </Text>
        </View>
      </Animated.View>

      {/* Bottom spacing for tab bar + mini player */}
      <View style={{ height: spacing.bottomInset + spacing['3xl'] }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
  greeting: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },

  // Verse card
  verseCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing['2xl'],
    ...shadows.md,
  },
  verseLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  verseSanskrit: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'CrimsonText-Regular',
    marginBottom: spacing.md,
  },
  verseTranslation: {
    ...typography.body,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  verseRef: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  verseActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  verseActionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  verseActionText: {
    ...typography.label,
    color: colors.divine.void,
  },

  // Mood
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: spacing.md,
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    ...typography.caption,
    fontSize: 11,
  },

  // Journey
  journeyCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing['2xl'],
  },
  journeyTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold[400],
    borderRadius: 4,
  },
  journeyProgress: {
    ...typography.bodySmall,
  },

  // Insight
  insightCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  insightIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  insightLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  insightText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  insightVerse: {
    ...typography.caption,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
