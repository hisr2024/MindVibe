/**
 * NowPlayingSection — the "Playing" tab of the Vibe Player library.
 *
 * Shows a summary of the current track when one is loaded; otherwise a
 * brief empty state pointing back to Library. Tapping the card pushes the
 * full-screen player (`/vibe-player/player`) which owns the real transport
 * controls + sacred geometry artwork.
 *
 * Kept intentionally small — this tab is a dashboard / gateway, not a
 * replacement for the full player.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useVibePlayerStore } from '@kiaanverse/store';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212,160,23,0.25)';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.65)';
const CARD_BG = 'rgba(17,20,53,0.65)';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—:—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface NowPlayingSectionProps {
  readonly onSwitchToLibrary: () => void;
}

export function NowPlayingSection({
  onSwitchToLibrary,
}: NowPlayingSectionProps): React.JSX.Element {
  const router = useRouter();
  const currentTrack = useVibePlayerStore((s) => s.currentTrack);
  const isPlaying = useVibePlayerStore((s) => s.isPlaying);

  const handleOpenPlayer = useCallback(() => {
    router.push('/vibe-player/player');
  }, [router]);

  if (!currentTrack) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Nothing playing</Text>
        <Text style={styles.emptyBody}>
          Pick a track from the Library tab to begin.
        </Text>
        <Pressable
          onPress={onSwitchToLibrary}
          accessibilityRole="button"
          accessibilityLabel="Open Library"
          style={styles.emptyCta}
        >
          <Text style={styles.emptyCtaText}>Open Library →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handleOpenPlayer}
        accessibilityRole="button"
        accessibilityLabel={`Open full player for ${currentTrack.title}`}
        style={styles.card}
      >
        <Text style={styles.statusLabel}>
          {isPlaying ? 'PLAYING NOW' : 'LOADED — PAUSED'}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {currentTrack.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
        <Text style={styles.duration}>
          Total duration · {formatDuration(currentTrack.duration)}
        </Text>
        <Text style={styles.openFull}>Open full player →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: CARD_BG,
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 6,
  },
  statusLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: GOLD,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: SACRED_WHITE,
    lineHeight: 30,
  },
  artist: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  duration: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 6,
  },
  openFull: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: GOLD,
    marginTop: 12,
  },
  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: SACRED_WHITE,
  },
  emptyBody: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: 'rgba(212,160,23,0.12)',
  },
  emptyCtaText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: GOLD,
  },
});
