/**
 * Verse Detail Screen
 *
 * Deep link target: kiaanverse://verse/:chapter/:verse
 * Displays a single Bhagavad Gita verse using the VerseCard component.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  Text,
  GoldenHeader,
  VerseCard,
  LoadingMandala,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useGitaSearch } from '@kiaanverse/api';

export default function VerseDetailScreen(): React.JSX.Element {
  const { chapter, verse } = useLocalSearchParams<{ chapter: string; verse: string }>();
  const router = useRouter();

  const chapterNum = Number(chapter);
  const verseNum = Number(verse);

  // Search for the specific verse
  const { data, isLoading, error } = useGitaSearch(`${chapterNum}.${verseNum}`);

  const verseData = (() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    const v = data[0] as {
      chapter_number?: number;
      verse_number?: number;
      sanskrit?: string;
      transliteration?: string;
      translation?: string;
      speaker?: string;
      commentary?: string;
    };
    return {
      chapter: v.chapter_number ?? chapterNum,
      verse: v.verse_number ?? verseNum,
      sanskrit: v.sanskrit ?? '',
      transliteration: v.transliteration ?? '',
      translation: v.translation ?? '',
      speaker: v.speaker ?? 'Lord Krishna',
      commentary: v.commentary,
    };
  })();

  return (
    <Screen scroll>
      <GoldenHeader
        title={`Chapter ${chapter} · Verse ${verse}`}
        onBack={() => router.back()}
        testID="verse-detail-header"
      />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <LoadingMandala size={80} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text variant="body" color={colors.text.muted} align="center">
              Unable to load verse. Please try again later.
            </Text>
          </View>
        ) : verseData ? (
          <VerseCard
            verse={verseData}
            testID="verse-detail-card"
          />
        ) : (
          <View style={styles.center}>
            <Text variant="body" color={colors.text.muted} align="center">
              Verse {chapter}:{verse} not found.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
  },
  center: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
});
