/**
 * KIAAN Vibe — Sacred Sound Library
 *
 * Layout (top → bottom):
 *   1. Header — "KIAAN Vibe" + sub-labels.
 *   2. DailyVerseBanner — today's shloka + "Sacred Sound" pointer.
 *   3. CategoryPills — All · Mantras · Meditation · Gita Shlokas · Bhajans · Binaural.
 *   4. FlatList of PlayerTrackCard rows.
 *
 * Selecting a row:
 *   - Updates the zustand `vibePlayerStore` (current track, queue).
 *   - Pushes the tracks into react-native-track-player and starts audio
 *     so the OS-level background service can take over once the user
 *     navigates to the full player (or leaves the app).
 *   - Navigates to `/vibe-player/player`.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DivineBackground, LoadingMandala } from '@kiaanverse/ui';
import { useMeditationTracks } from '@kiaanverse/api';
import type { MeditationTrack } from '@kiaanverse/api';
import { useVibePlayerStore, type VibeTrack } from '@kiaanverse/store';

import {
  CategoryPills,
  DailyVerseBanner,
  PlayerTrackCard,
  resolveApiCategory,
  type FilterKey,
} from '../../components/vibe-player';
import { playTrack } from '../../components/vibe-player/trackPlayerBridge';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';

/**
 * Today's verse is a hard-coded seed until the API exposes a daily-verse
 * endpoint. The content is wisdom-appropriate and accurate to BG 2.47.
 */
const TODAY_VERSE = {
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
  meaning:
    'You have a right to perform your duty, but not to the fruits of your action.',
  reference: 'Bhagavad Gita 2.47',
} as const;

export default function VibePlayerLibraryScreen(): React.JSX.Element {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');

  const apiCategory = resolveApiCategory(filter);
  const { data: tracks, isLoading } = useMeditationTracks(apiCategory);

  const currentTrack = useVibePlayerStore((s) => s.currentTrack);
  const isPlaying = useVibePlayerStore((s) => s.isPlaying);
  const setTrack = useVibePlayerStore((s) => s.setTrack);
  const play = useVibePlayerStore((s) => s.play);
  const addToQueue = useVibePlayerStore((s) => s.addToQueue);
  const clearQueue = useVibePlayerStore((s) => s.clearQueue);
  const showMiniPlayer = useVibePlayerStore((s) => s.showMiniPlayer);

  // Bookmarks live in component state for now — a real implementation
  // would persist via a user-preferences slice. Until then we keep a
  // session-scoped `Set` so the UX works end-to-end.
  const [bookmarks, setBookmarks] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const handleToggleBookmark = useCallback((trackId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const hydrateQueue = useCallback(
    (all: readonly MeditationTrack[]) => {
      clearQueue();
      for (const t of all) {
        const entry: VibeTrack = {
          id: t.id,
          title: t.title,
          artist: t.artist,
          artworkUrl: t.artworkUrl ?? null,
          audioUrl: t.audioUrl,
          duration: t.duration,
        };
        addToQueue(entry);
      }
    },
    [addToQueue, clearQueue],
  );

  const handleTrackPress = useCallback(
    (track: MeditationTrack) => {
      const vibeTrack: VibeTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl ?? null,
        audioUrl: track.audioUrl,
        duration: track.duration,
      };
      setTrack(vibeTrack);
      play();
      showMiniPlayer();
      if (tracks) hydrateQueue(tracks);
      void playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioUrl: track.audioUrl,
        duration: track.duration,
        artworkUrl: track.artworkUrl ?? null,
      });
      router.push('/vibe-player/player');
    },
    [setTrack, play, showMiniPlayer, tracks, hydrateQueue, router],
  );

  const handleDailyVersePress = useCallback(() => {
    // Until the API ships a verse→track binding, open the shlokas tab —
    // the user can navigate from there to the full verse detail.
    router.push('/(tabs)/shlokas' as never);
  }, [router]);

  const renderTrack = useCallback(
    ({ item }: ListRenderItemInfo<MeditationTrack>) => {
      const isCurrent = currentTrack?.id === item.id;
      return (
        <PlayerTrackCard
          track={{
            id: item.id,
            title: item.title,
            artist: item.artist,
            duration: item.duration,
            category: item.category,
          }}
          isCurrent={isCurrent}
          isPlaying={isCurrent && isPlaying}
          isBookmarked={bookmarks.has(item.id)}
          onPress={() => handleTrackPress(item)}
          onToggleBookmark={() => handleToggleBookmark(item.id)}
        />
      );
    },
    [bookmarks, currentTrack?.id, handleToggleBookmark, handleTrackPress, isPlaying],
  );

  const keyExtractor = useCallback((item: MeditationTrack) => item.id, []);

  const headerBlock = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={styles.title}>KIAAN Vibe</Text>
        <Text style={styles.subtitle}>Sacred Sound Library</Text>
        <Text style={styles.muted}>
          Mantras · Meditation · Bhagavad Gita · Bhajans · Binaural
        </Text>
      </View>
    ),
    [],
  );

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      <View style={styles.safeTop}>
        <FlatList
          data={tracks ?? []}
          renderItem={renderTrack}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerStack}>
              {headerBlock}
              <DailyVerseBanner
                sanskrit={TODAY_VERSE.sanskrit}
                meaning={TODAY_VERSE.meaning}
                reference={TODAY_VERSE.reference}
                onPress={handleDailyVersePress}
              />
              <CategoryPills value={filter} onChange={setFilter} />
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.stateContainer}>
                <LoadingMandala size={56} />
              </View>
            ) : (
              <View style={styles.stateContainer}>
                <Text style={styles.emptyText}>
                  No tracks available in this category yet.
                </Text>
              </View>
            )
          }
          ItemSeparatorComponent={ItemSeparator}
        />
      </View>
    </DivineBackground>
  );
}

function ItemSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeTop: {
    flex: 1,
    paddingTop: 52,
  },
  headerStack: {
    gap: 14,
    paddingBottom: 12,
  },
  headerBlock: {
    paddingHorizontal: 16,
    gap: 4,
  },
  title: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 26,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  muted: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: 'rgba(200,191,168,0.5)',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  stateContainer: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  separator: {
    height: 10,
  },
});
