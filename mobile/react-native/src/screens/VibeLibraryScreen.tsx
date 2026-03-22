/**
 * Vibe Library Screen
 *
 * Audio content library for sacred sounds, meditations, and Gita recitations.
 * Features:
 * - Curated playlists by mood/theme
 * - Browse by chapter
 * - Downloaded tracks for offline
 * - Search audio content
 * - Integration with Vibe Player
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { OptimizedList } from '@components/common/OptimizedList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVibePlayerStore } from '@state/stores/vibePlayerStore';
import { darkTheme, typography, spacing, radii, colors, shadows } from '@theme/tokens';
import type { VibeTrack } from '@components/vibe-player/VibePlayer';

// ---------------------------------------------------------------------------
// Curated Playlists (static content)
// ---------------------------------------------------------------------------

interface Playlist {
  id: string;
  title: string;
  description: string;
  emoji: string;
  trackCount: number;
  tracks: VibeTrack[];
}

const PLAYLISTS: Playlist[] = [
  {
    id: 'morning-sadhana',
    title: 'Morning Sadhana',
    description: 'Begin your day with sacred wisdom',
    emoji: '🌅',
    trackCount: 5,
    tracks: [
      { id: 'ms-1', title: 'Chapter 2 Opening', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.1' },
      { id: 'ms-2', title: 'Yoga of Knowledge', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.11' },
      { id: 'ms-3', title: 'The Eternal Soul', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.20' },
      { id: 'ms-4', title: 'Karma Yoga', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 3.19' },
      { id: 'ms-5', title: 'Equanimity', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.48' },
    ],
  },
  {
    id: 'inner-peace',
    title: 'Inner Peace',
    description: 'Verses for calm and tranquility',
    emoji: '🕊️',
    trackCount: 5,
    tracks: [
      { id: 'ip-1', title: 'The Steady Mind', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.54' },
      { id: 'ip-2', title: 'Meditation', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 6.10' },
      { id: 'ip-3', title: 'Peace Formula', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 5.29' },
      { id: 'ip-4', title: 'Self Mastery', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 6.5' },
      { id: 'ip-5', title: 'Divine Qualities', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 16.1' },
    ],
  },
  {
    id: 'conquering-anger',
    title: 'Conquering Anger',
    description: 'Transform krodha into clarity',
    emoji: '⚡',
    trackCount: 4,
    tracks: [
      { id: 'ca-1', title: 'The Chain of Anger', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.62' },
      { id: 'ca-2', title: 'Anger to Delusion', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.63' },
      { id: 'ca-3', title: 'Rise Above', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 3.37' },
      { id: 'ca-4', title: 'Compassion', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 12.13' },
    ],
  },
  {
    id: 'devotion',
    title: 'Bhakti Yoga',
    description: 'The path of devotion and love',
    emoji: '🙏',
    trackCount: 4,
    tracks: [
      { id: 'bk-1', title: 'Supreme Devotion', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 11.55' },
      { id: 'bk-2', title: 'Devotee Qualities', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 12.13' },
      { id: 'bk-3', title: 'Surrender', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 18.66' },
      { id: 'bk-4', title: 'Love Supreme', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 9.34' },
    ],
  },
  {
    id: 'evening-reflection',
    title: 'Evening Reflection',
    description: 'Wind down with sacred contemplation',
    emoji: '🌙',
    trackCount: 4,
    tracks: [
      { id: 'er-1', title: 'Night of Creation', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 8.17' },
      { id: 'er-2', title: 'Detachment', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.47' },
      { id: 'er-3', title: 'The Wise Sleep', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 2.69' },
      { id: 'er-4', title: 'Final Promise', subtitle: 'Bhagavad Gita', url: '', verseRef: 'BG 18.78' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VibeLibraryScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const { setCurrentTrack, setPlaylist, setPlayerVisible } = useVibePlayerStore();

  const handlePlayTrack = useCallback(
    (track: VibeTrack) => {
      setCurrentTrack(track);
      setPlayerVisible(true);
    },
    [setCurrentTrack, setPlayerVisible],
  );

  const handlePlayPlaylist = useCallback(
    (playlist: Playlist) => {
      if (playlist.tracks.length > 0) {
        setPlaylist(playlist.tracks);
        setCurrentTrack(playlist.tracks[0]);
        setPlayerVisible(true);
      }
    },
    [setPlaylist, setCurrentTrack, setPlayerVisible],
  );

  // Playlist detail view
  if (selectedPlaylist) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.bottomInset,
            paddingHorizontal: spacing.lg,
          }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedPlaylist(null)}
            accessibilityRole="button"
          >
            <Text style={{ color: theme.accent, fontSize: 18 }}>← Back</Text>
          </TouchableOpacity>

          {/* Playlist Header */}
          <View style={styles.playlistHeader}>
            <Text style={styles.playlistEmoji}>{selectedPlaylist.emoji}</Text>
            <Text style={[styles.playlistTitle, { color: theme.textPrimary }]}>
              {selectedPlaylist.title}
            </Text>
            <Text style={[styles.playlistDesc, { color: theme.textSecondary }]}>
              {selectedPlaylist.description}
            </Text>
            <TouchableOpacity
              style={[styles.playAllButton, { backgroundColor: theme.accent }]}
              onPress={() => handlePlayPlaylist(selectedPlaylist)}
              accessibilityRole="button"
              accessibilityLabel="Play all tracks"
            >
              <Text style={styles.playAllText}>▶ Play All</Text>
            </TouchableOpacity>
          </View>

          {/* Track List */}
          {selectedPlaylist.tracks.map((track, index) => (
            <TouchableOpacity
              key={track.id}
              style={[styles.trackRow, { borderColor: theme.divider }]}
              onPress={() => handlePlayTrack(track)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${track.title}`}
            >
              <Text style={[styles.trackIndex, { color: theme.textTertiary }]}>
                {index + 1}
              </Text>
              <View style={styles.trackMeta}>
                <Text style={[styles.trackTitle, { color: theme.textPrimary }]}>
                  {track.title}
                </Text>
                {track.verseRef && (
                  <Text style={[styles.trackVerse, { color: theme.textTertiary }]}>
                    {track.verseRef}
                  </Text>
                )}
              </View>
              <Text style={{ color: theme.accent, fontSize: 18 }}>▶</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Library home
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <OptimizedList<Playlist>
        data={PLAYLISTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.bottomInset,
          paddingHorizontal: spacing.lg,
        }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
              Vibe Library
            </Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Sacred sounds for your spiritual journey
            </Text>

            {/* Search */}
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search audio..."
              placeholderTextColor={theme.textTertiary}
              accessibilityLabel="Search audio content"
            />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.playlistCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setSelectedPlaylist(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.trackCount} tracks`}
          >
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <View style={styles.cardMeta}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardCount, { color: theme.textTertiary }]}>
                {item.trackCount}
              </Text>
              <Text style={{ color: theme.textSecondary }}>▶</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default VibeLibraryScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  screenSubtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  searchInput: {
    ...typography.body,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  // Playlist card
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardEmoji: { fontSize: 36 },
  cardMeta: { flex: 1 },
  cardTitle: { ...typography.h3, marginBottom: 2 },
  cardDesc: { ...typography.bodySmall },
  cardRight: { alignItems: 'center', gap: 2 },
  cardCount: { ...typography.caption, fontWeight: '600' },
  // Playlist detail
  backButton: { marginBottom: spacing.lg, alignSelf: 'flex-start' },
  playlistHeader: { alignItems: 'center', marginBottom: spacing['2xl'] },
  playlistEmoji: { fontSize: 64, marginBottom: spacing.md },
  playlistTitle: { ...typography.h1, marginBottom: spacing.xs },
  playlistDesc: { ...typography.body, marginBottom: spacing.lg },
  playAllButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  playAllText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 16,
    fontWeight: '600',
  },
  // Track row
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  trackIndex: { ...typography.label, width: 28, textAlign: 'center' },
  trackMeta: { flex: 1 },
  trackTitle: { ...typography.label },
  trackVerse: { ...typography.caption, marginTop: 2 },
});
