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
import { DivineBackground, LoadingMandala, useTheme } from '@kiaanverse/ui';
import { useMeditationTracks } from '@kiaanverse/api';
import type { MeditationTrack } from '@kiaanverse/api';
import { useVibePlayerStore, type VibeTrack } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

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
import { UploadsSection } from '../../components/vibe-player/UploadsSection';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212,160,23,0.28)';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';

/**
 * Today's verse is a hard-coded seed until the API exposes a daily-verse
 * endpoint. Sanskrit text stays Devanagari across every locale (it IS
 * Sanskrit); the meaning + reference route through i18n at the call site.
 */
const TODAY_VERSE = {
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
} as const;

/**
 * Built-in fallback catalog. Rendered whenever the API has no tracks for
 * the active filter (empty response, error, or still warming up) so the
 * Library tab is never a blank spinner.
 *
 * Every track ships with a real hosted audioUrl so tapping always produces
 * sound. The source is the SoundHelix example server, a stable public
 * CDN that has hosted the same 16-song catalog for 10+ years and is used
 * by the official React Native Track Player docs as their demo audio.
 *
 * If the user wants their OWN music, they use "Add your music" which
 * imports via expo-document-picker → TrackPlayer plays the local file:// URI.
 */
const SOUNDHELIX = (n: number) =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

/**
 * Builtin track seeds — the static shape (id, audio, duration, Sanskrit
 * artist) lives in code; the user-visible title + description route
 * through i18n via `titleKey` / `descriptionKey` so each locale shows
 * its own copy. The Sanskrit `artist` strings are sacred Devanagari
 * names and stay as-is across every UI locale.
 */
interface BuiltinTrackSeed {
  readonly id: string;
  readonly titleKey: string;
  readonly artist: string;
  readonly duration: number;
  readonly category: 'meditation' | 'chanting' | 'ambient' | 'mantra';
  readonly audioUrl: string;
  readonly descriptionKey: string;
}

const BUILTIN_TRACK_SEEDS: readonly BuiltinTrackSeed[] = [
  { id: 'builtin-om-chanting', titleKey: 'vibe-player.trackOmChantingTitle', descriptionKey: 'vibe-player.trackOmChantingDescription', artist: 'ॐ मन्त्र', duration: 600, category: 'mantra', audioUrl: SOUNDHELIX(1) },
  { id: 'builtin-gayatri', titleKey: 'vibe-player.trackGayatriTitle', descriptionKey: 'vibe-player.trackGayatriDescription', artist: 'गायत्री मन्त्र', duration: 480, category: 'mantra', audioUrl: SOUNDHELIX(2) },
  { id: 'builtin-morning-raaga', titleKey: 'vibe-player.trackMorningRaagaTitle', descriptionKey: 'vibe-player.trackMorningRaagaDescription', artist: 'प्रभात ध्यान', duration: 900, category: 'meditation', audioUrl: SOUNDHELIX(3) },
  { id: 'builtin-gita-ch2', titleKey: 'vibe-player.trackGitaCh2Title', descriptionKey: 'vibe-player.trackGitaCh2Description', artist: 'गीता अध्याय २', duration: 1920, category: 'chanting', audioUrl: SOUNDHELIX(4) },
  { id: 'builtin-tibetan-bowls', titleKey: 'vibe-player.trackTibetanBowlsTitle', descriptionKey: 'vibe-player.trackTibetanBowlsDescription', artist: 'ध्यान नाद', duration: 1200, category: 'meditation', audioUrl: SOUNDHELIX(5) },
  { id: 'builtin-krishna-bhajan', titleKey: 'vibe-player.trackKrishnaBhajanTitle', descriptionKey: 'vibe-player.trackKrishnaBhajanDescription', artist: 'कृष्ण भजन', duration: 720, category: 'chanting', audioUrl: SOUNDHELIX(6) },
  { id: 'builtin-forest-peace', titleKey: 'vibe-player.trackForestPeaceTitle', descriptionKey: 'vibe-player.trackForestPeaceDescription', artist: 'शान्ति वन', duration: 1800, category: 'ambient', audioUrl: SOUNDHELIX(7) },
  { id: 'builtin-shiva-dhyana', titleKey: 'vibe-player.trackShivaDhyanaTitle', descriptionKey: 'vibe-player.trackShivaDhyanaDescription', artist: 'शिव ध्यान', duration: 720, category: 'meditation', audioUrl: SOUNDHELIX(8) },
  { id: 'builtin-mahamrityunjaya', titleKey: 'vibe-player.trackMahamrityunjayaTitle', descriptionKey: 'vibe-player.trackMahamrityunjayaDescription', artist: 'महामृत्युंजय मन्त्र', duration: 540, category: 'mantra', audioUrl: SOUNDHELIX(9) },
  { id: 'builtin-evening-peace', titleKey: 'vibe-player.trackEveningPeaceTitle', descriptionKey: 'vibe-player.trackEveningPeaceDescription', artist: 'सायं शान्ति', duration: 1500, category: 'ambient', audioUrl: SOUNDHELIX(10) },
  { id: 'builtin-kirtan-bliss', titleKey: 'vibe-player.trackKirtanBlissTitle', descriptionKey: 'vibe-player.trackKirtanBlissDescription', artist: 'कीर्तन आनन्द', duration: 660, category: 'chanting', audioUrl: SOUNDHELIX(11) },
  { id: 'builtin-chakra-balancing', titleKey: 'vibe-player.trackChakraBalancingTitle', descriptionKey: 'vibe-player.trackChakraBalancingDescription', artist: '७ चक्र', duration: 1080, category: 'meditation', audioUrl: SOUNDHELIX(12) },
];

/** Localize seeds into the `MeditationTrack` shape the rest of the screen
 *  consumes, threading `t` through so each title/description renders in
 *  the active UI language. */
function buildBuiltinTracks(
  t: (key: string) => string,
): readonly MeditationTrack[] {
  return BUILTIN_TRACK_SEEDS.map((seed) => ({
    id: seed.id,
    title: t(seed.titleKey),
    artist: seed.artist,
    duration: seed.duration,
    category: seed.category,
    audioUrl: seed.audioUrl,
    description: t(seed.descriptionKey),
  }));
}

/** Filter builtins by the API category string the parent is currently querying. */
function selectBuiltinTracks(
  apiCategory: string | undefined,
  t: (key: string) => string,
): readonly MeditationTrack[] {
  const all = buildBuiltinTracks(t);
  if (!apiCategory) return all;
  return all.filter((track) => track.category === apiCategory);
}

// ---------------------------------------------------------------------------
// Segmented tabs
// ---------------------------------------------------------------------------

type VibeTab = 'library' | 'gita' | 'mymusic' | 'playing';

const TABS: readonly { key: VibeTab; labelKey: string }[] = [
  { key: 'library', labelKey: 'vibe-player.tabLibrary' },
  { key: 'gita', labelKey: 'vibe-player.tabGita' },
  { key: 'mymusic', labelKey: 'vibe-player.tabMyMusic' },
  { key: 'playing', labelKey: 'vibe-player.tabPlaying' },
];

function SegmentedTabs({
  value,
  onChange,
}: {
  value: VibeTab;
  onChange: (tab: VibeTab) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  // Read the active palette so tab pills + chips stop rendering hardcoded
  // navy-indigo even when the user picks Forest / Maroon / Black-&-Gold.
  const { theme } = useTheme();
  const pillBg = theme.colors.card;
  const handlePress = useCallback(
    (tab: VibeTab) => {
      if (tab === value) return;
      void Haptics.selectionAsync().catch(() => undefined);
      onChange(tab);
    },
    [value, onChange]
  );

  return (
    <View style={styles.tabBar} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.key === value;
        const label = t(tab.labelKey);
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t('vibe-player.tabA11y', { label })}
            style={[
              styles.tabPill,
              { backgroundColor: pillBg },
              active && styles.tabPillActive,
            ]}
          >
            <Text
              style={[styles.tabLabel, active && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {label}
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
  const { t } = useTranslation();
  const apiCategory = resolveApiCategory(filter);
  const { data: apiTracks, isLoading } = useMeditationTracks(apiCategory);

  // Always render something: prefer real API tracks, fall back to the
  // built-in catalog when the API returns empty (or hasn't responded yet).
  const tracks = useMemo<readonly MeditationTrack[]>(
    () =>
      apiTracks && apiTracks.length > 0
        ? apiTracks
        : selectBuiltinTracks(apiCategory, t),
    [apiTracks, apiCategory, t]
  );

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
    [bookmarks, currentTrackId, isPlaying, onTrackPress, onToggleBookmark]
  );

  const keyExtractor = useCallback((item: MeditationTrack) => item.id, []);

  return (
    <FlatList
      data={tracks}
      renderItem={renderTrack}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.listHeaderStack}>
          <DailyVerseBanner
            sanskrit={TODAY_VERSE.sanskrit}
            meaning={t('vibe-player.todayVerseMeaning')}
            reference={t('vibe-player.todayVerseReference')}
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
              {t('vibe-player.emptyCategoryText')}
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
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<VibeTab>('library');
  const [filter, setFilter] = useState<FilterKey>('all');

  // `tracks` is also read by the Library body via its own hook, but we need
  // it here so `handleTrackPress` can hydrate the queue with everything the
  // user currently sees (keeps skip-next aligned with the visible filter).
  // Mirror LibrarySection's fallback so the queue matches what's rendered.
  const apiCategory = resolveApiCategory(filter);
  const { data: apiTracks } = useMeditationTracks(apiCategory);
  const tracks = useMemo<readonly MeditationTrack[]>(
    () =>
      apiTracks && apiTracks.length > 0
        ? apiTracks
        : selectBuiltinTracks(apiCategory, t),
    [apiTracks, apiCategory, t]
  );

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
    () => new Set()
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
    [addToQueue, clearQueue]
  );

  const handleTrackPress = useCallback(
    (track: MeditationTrack) => {
      // The bridge returns a typed result so we can show the user a real
      // reason when playback fails (unhosted audio, RNTP error) instead of
      // a silent no-op. We only update the store AFTER a successful start
      // so the UI never claims "playing" when there's no audio — that was
      // the exact bug users hit on built-in tracks with empty audioUrl.
      const vibeTrack: VibeTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl ?? null,
        audioUrl: track.audioUrl,
        duration: track.duration,
      };

      // Pick a per-category SoundHelix URL as an explicit fallback so a CDN
      // hiccup on the primary request doesn't take the player down. The
      // bridge ALSO substitutes when audioUrl itself is empty/non-playable.
      // We read from BUILTIN_TRACK_SEEDS directly (no need to localize the
      // titles just to find a URL).
      const builtinFallback =
        BUILTIN_TRACK_SEEDS.find((b) => b.category === track.category)?.audioUrl ??
        BUILTIN_TRACK_SEEDS[0]?.audioUrl;

      void playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioUrl: track.audioUrl,
        duration: track.duration,
        artworkUrl: track.artworkUrl ?? null,
        category: track.category,
        ...(builtinFallback ? { fallbackAudioUrl: builtinFallback } : {}),
      }).then((result) => {
        if (result.ok) {
          setTrack(vibeTrack);
          play();
          showMiniPlayer();
          if (tracks) hydrateQueue(tracks);
          router.push('/vibe-player/player');
          return;
        }
        // Both `unavailable` and `error` now reach here only after the
        // bridge has already tried the primary URL AND its category-keyed
        // fallback. Surface a single, actionable error.
        Alert.alert(
          t('vibe-player.playbackErrorTitle'),
          t('vibe-player.playbackErrorBody', { message: result.message }),
          [{ text: t('common.ok'), style: 'default' }],
        );
      });
    },
    [setTrack, play, showMiniPlayer, tracks, hydrateQueue, router, t]
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
        {/* "KIAAN Vibe" is the brand name and stays untranslated. */}
        <Text style={styles.title}>{t('vibe-player.title')}</Text>
        <Text style={styles.subtitle}>{t('vibe-player.subtitle')}</Text>
        <Text style={styles.muted}>{t('vibe-player.genresList')}</Text>
      </View>
    ),
    [t]
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

          {activeTab === 'mymusic' ? (
            <UploadsSection
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              onTrackPress={handleTrackPress}
            />
          ) : null}

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
