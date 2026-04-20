/**
 * KIAAN Vibe Player — Track Library
 *
 * Displays meditation tracks by category with filter chips.
 * Tapping a track sets it as current and navigates to the full player.
 * Uses useMeditationTracks() for data and vibePlayerStore for state.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  GoldenHeader,
  LoadingMandala,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useMeditationTracks } from '@kiaanverse/api';
import { useVibePlayerStore } from '@kiaanverse/store';
import type { MeditationTrack } from '@kiaanverse/api';
import { TrackCard } from '../../components/vibe-player/TrackCard';

type Category = 'all' | 'meditation' | 'chanting' | 'ambient' | 'mantra';

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'All', value: 'all' },
  { label: 'Meditation', value: 'meditation' },
  { label: 'Chanting', value: 'chanting' },
  { label: 'Ambient', value: 'ambient' },
  { label: 'Sacred', value: 'mantra' },
];

export default function VibePlayerLibraryScreen(): React.JSX.Element {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('all');
  const queryCategory = category === 'all' ? undefined : category;
  const { data: tracks, isLoading } = useMeditationTracks(queryCategory);
  const { currentTrack, setTrack, play, addToQueue, clearQueue, showMiniPlayer } = useVibePlayerStore();

  const handleCategoryPress = useCallback((cat: Category) => {
    void Haptics.selectionAsync();
    setCategory(cat);
  }, []);

  const handleTrackPress = useCallback(
    (track: MeditationTrack) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl ?? null,
        audioUrl: track.audioUrl,
        duration: track.duration,
      });
      play();
      showMiniPlayer();

      // Populate queue with all visible tracks (clear first to prevent duplicates)
      if (tracks) {
        clearQueue();
        tracks.forEach((t) => {
          addToQueue({
            id: t.id,
            title: t.title,
            artist: t.artist,
            artworkUrl: t.artworkUrl ?? null,
            audioUrl: t.audioUrl,
            duration: t.duration,
          });
        });
      }

      router.push('/vibe-player/player');
    },
    [setTrack, play, showMiniPlayer, addToQueue, clearQueue, tracks, router],
  );

  const renderTrack = useCallback(
    ({ item }: { item: MeditationTrack }) => (
      <TrackCard
        track={item}
        isPlaying={currentTrack?.id === item.id}
        onPress={() => handleTrackPress(item)}
      />
    ),
    [currentTrack?.id, handleTrackPress],
  );

  const keyExtractor = useCallback((item: MeditationTrack) => item.id, []);

  return (
    <Screen>
      <GoldenHeader title="KIAAN Vibe" onBack={() => router.back()} />

      <Text variant="body" color={colors.text.secondary} align="center" style={styles.subtitle}>
        Sacred Sound for Your Soul
      </Text>

      {/* Category chips */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => handleCategoryPress(cat.value)}
            style={[
              styles.chip,
              category === cat.value && styles.chipActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: category === cat.value }}
          >
            <Text
              variant="caption"
              color={category === cat.value ? colors.background.dark : colors.text.secondary}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingMandala size={60} />
        </View>
      ) : (
        <FlatList
          data={tracks ?? []}
          renderItem={renderTrack}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="body" color={colors.text.muted} align="center">
                No tracks available in this category.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.xs,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
  },
});
