/**
 * KIAAN Vibe — Sacred Sound Library
 *
 * Top-level composition:
 *   1. Header ("KIAAN Vibe" + sub-labels).
 *   2. Segmented tabs: Library · Gita · Playing.
 *   3. Active-tab body fills the rest of the screen.
 *
 * Tabs:
 *   - Library — track catalogue. Today's verse banner, category pills,
 *     scrollable `PlayerTrackCard` list. Tapping a track loads it into
 *     RNTP and pushes the full-screen player on success.
 *   - Gita — 18-chapter Bhagavad Gita grid. Tapping a chapter deep-links
 *     into the existing `/(tabs)/shlokas/{chapter}` stack (still routable
 *     even though Shlokas is no longer a bottom tab).
 *   - Playing — current-track summary + "Open full player" CTA, or an
 *     empty state pointing back to Library when nothing is loaded.
 *
 * Selecting a track from Library:
 *   - Updates the zustand `vibePlayerStore` (current track, queue).
 *   - Pushes the tracks into react-native-track-player and starts audio
 *     so the OS-level background service can take over once the user
 *     navigates to the full player (or leaves the app).
 *   - On success, navigates to `/vibe-player/player`; on failure, shows
 *     an Alert that explains "coming soon" vs a real playback error.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DivineBackground, LoadingMandala } from '@kiaanverse/ui';
import { useMeditationTracks } from '@kiaanverse/api';
import type { MeditationTrack } from '@kiaanverse/api';
import { useVibePlayerStore, type VibeTrack } from '@kiaanverse/store';

import {
  CategoryPills,
  DailyVerseBanner,
  GitaBrowser,
  NowPlayingSection,
  PlayerTrackCard,
  resolveApiCategory,
  type FilterKey,
} from '../../components/vibe-player';
import { playTrack } from '../../components/vibe-player/trackPlayerBridge';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212,160,23,0.28)';
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

// ---------------------------------------------------------------------------
// Segmented tabs
// ---------------------------------------------------------------------------

type VibeTab = 'library' | 'gita' | 'playing';

const TABS: ReadonlyArray<{ key: VibeTab; label: string }> = [
  { key: 'library', label: 'Library' },
  { key: 'gita', label: 'Gita' },
  { key: 'playing', label: 'Playing' },
];

function SegmentedTabs({
  value,
  onChange,
}: {
  value: VibeTab;
  onChange: (tab: VibeTab) => void;
}): React.JSX.Element {
  const handlePress = useCallback(
    (tab: VibeTab) => {
      if (tab === value) return;
      void Haptics.selectionAsync().catch(() => undefined);
      onChange(tab);
    },
    [value, onChange],
  );

  return (
    <View style={styles.tabBar} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${tab.label} tab`}
            style={[styles.tabPill, active && styles.tabPillActive]}
          >
            <Text
              style={[styles.tabLabel, active && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Library — track catalog (extracted so each tab body stays focused)
// ---------------------------------------------------------------------------

interface LibrarySectionProps {
  readonly filter: FilterKey;
  readonly onFilterChange: (key: FilterKey) => void;
  readonly onTrackPress: (track: MeditationTrack) => void;
  readonly onDailyVersePress: () => void;
  readonly currentTrackId: string | undefined;
  readonly isPlaying: boolean;
  readonly bookmarks: ReadonlySet<string>;
  readonly onToggleBookmark: (trackId: string) => void;
}

function LibrarySection({
  filter,
  onFilterChange,
  onTrackPress,
  onDailyVersePress,
  currentTrackId,
  isPlaying,
  bookmarks,
  onToggleBookmark,
}: LibrarySectionProps): React.JSX.Element {
  const apiCategory = resolveApiCategory(filter);
  const { data: tracks, isLoading } = useMeditationTracks(apiCategory);

  const renderTrack = useCallback(
    ({ item }: ListRenderItemInfo<MeditationTrack>) => {
      const isCurrent = currentTrackId === item.id;
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
          onPress={() => onTrackPress(item)}
          onToggleBookmark={() => onToggleBookmark(item.id)}
        />
      );
    },
    [bookmarks, currentTrackId, isPlaying, onTrackPress, onToggleBookmark],
  );

  const keyExtractor = useCallback((item: MeditationTrack) => item.id, []);

  return (
    <FlatList
      data={tracks ?? []}
      renderItem={renderTrack}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.listHeaderStack}>
          <DailyVerseBanner
            sanskrit={TODAY_VERSE.sanskrit}
            meaning={TODAY_VERSE.meaning}
            reference={TODAY_VERSE.reference}
            onPress={onDailyVersePress}
          />
          <CategoryPills value={filter} onChange={onFilterChange} />
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
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VibePlayerLibraryScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<VibeTab>('library');
  const [filter, setFilter] = useState<FilterKey>('all');

  // `tracks` is also read by the Library body via its own hook, but we need
  // it here so `handleTrackPress` can hydrate the queue with everything the
  // user currently sees (keeps skip-next aligned with the visible filter).
  const apiCategory = resolveApiCategory(filter);
  const { data: tracks } = useMeditationTracks(apiCategory);

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
      // The bridge returns a typed result so we can show the user a real
      // reason when playback fails (unhosted audio, RNTP error) instead of
      // a silent no-op. We still optimistically update the store + navigate
      // for the happy path so the UI feels instant; on failure we stay on
      // this screen and surface the reason.
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
      }).then((result) => {
        if (result.ok) {
          router.push('/vibe-player/player');
          return;
        }
        if (result.reason === 'unavailable') {
          Alert.alert('Coming soon', result.message, [
            { text: 'OK', style: 'default' },
          ]);
        } else {
          Alert.alert('Playback error', result.message, [
            { text: 'OK', style: 'default' },
          ]);
        }
      });
    },
    [setTrack, play, showMiniPlayer, tracks, hydrateQueue, router],
  );

  const handleDailyVersePress = useCallback(() => {
    // The Daily Verse banner is the canonical shortcut from Vibe into the
    // Gita reader — flip to the in-screen Gita tab rather than pushing the
    // standalone shlokas stack so the user stays inside Vibe.
    void Haptics.selectionAsync().catch(() => undefined);
    setActiveTab('gita');
  }, []);

  const handleSwitchToLibrary = useCallback(() => {
    setActiveTab('library');
  }, []);

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
        {headerBlock}
        <SegmentedTabs value={activeTab} onChange={setActiveTab} />

        <View style={styles.tabBody}>
          {activeTab === 'library' ? (
            <LibrarySection
              filter={filter}
              onFilterChange={setFilter}
              onTrackPress={handleTrackPress}
              onDailyVersePress={handleDailyVersePress}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
            />
          ) : null}

          {activeTab === 'gita' ? <GitaBrowser /> : null}

          {activeTab === 'playing' ? (
            <NowPlayingSection onSwitchToLibrary={handleSwitchToLibrary} />
          ) : null}
        </View>
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
  headerBlock: {
    paddingHorizontal: 16,
    gap: 4,
    paddingBottom: 10,
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
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: 'rgba(17,20,53,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: 'rgba(212,160,23,0.16)',
    borderColor: GOLD,
  },
  tabLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  tabLabelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: GOLD,
    letterSpacing: 0.3,
  },
  tabBody: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  listHeaderStack: {
    gap: 14,
    paddingBottom: 12,
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
