/**
 * KIAAN Vibe — Full-Screen Player (Sacred Sound Sanctuary)
 *
 * The player is the app's most immersive audio moment. Nothing is a
 * photograph: the album art is sacred geometry; the progress bar is a
 * gold-shimmer pill; the transport uses a Krishna-aura play button.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────┐
 *   │  ← Back                                        │
 *   ├────────────────────────────────────────────────┤
 *   │                                                │
 *   │          SacredGeometryArt (≈50 % of screen)   │
 *   │                                                │
 *   ├────────────────────────────────────────────────┤
 *   │  Track title (CormorantGaramond)                │
 *   │  Sanskrit (NotoSansDevanagari DIVINE_GOLD)      │
 *   │  Category (Outfit TEXT_MUTED)                   │
 *   ├────────────────────────────────────────────────┤
 *   │  PlayerProgressBar (drag = TrackPlayer.seekTo)  │
 *   ├────────────────────────────────────────────────┤
 *   │  PlaybackControls (5 icons, 56 px play)         │
 *   ├────────────────────────────────────────────────┤
 *   │  ShlokaCompanion (collapsible while paused)     │
 *   └────────────────────────────────────────────────┘
 *
 * Audio integration:
 *   - useProgress() from react-native-track-player drives the progress
 *     bar when RNTP is the playback source.
 *   - On pause/play and seek, we call into the store AND TrackPlayer so
 *     lock-screen + AirPods state stays in sync with the UI.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DivineBackground } from '@kiaanverse/ui';
import { useVibePlayerStore, type RepeatMode } from '@kiaanverse/store';
import { useProgress } from 'react-native-track-player';

import {
  PlaybackControls,
  PlayerProgressBar,
  SacredGeometryArt,
  ShlokaCompanion,
  type SacredCategory,
} from '../../components/vibe-player';
import {
  pause as bridgePause,
  resume as bridgeResume,
  seekTo as bridgeSeekTo,
  playNextInQueue,
  playPreviousInQueue,
} from '../../components/vibe-player/trackPlayerBridge';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';
const GOLD = '#D4A017';

/** Ensure the `MeditationTrack.category` strings map onto the art's
 *  closed SacredCategory union. Anything unknown falls back to 'mantra'. */
function toSacredCategory(raw?: string): SacredCategory {
  switch (raw) {
    case 'mantra':
    case 'meditation':
    case 'chanting':
    case 'ambient':
    case 'binaural':
      return raw;
    default:
      return 'mantra';
  }
}

/** Best-effort mapping from arbitrary category → human-readable label. */
function categoryLabel(raw: string): string {
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function VibePlayerScreen(): React.JSX.Element {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const currentTrack = useVibePlayerStore((s) => s.currentTrack);
  const isPlaying = useVibePlayerStore((s) => s.isPlaying);
  const repeatMode = useVibePlayerStore((s) => s.repeatMode);
  const togglePlay = useVibePlayerStore((s) => s.togglePlay);
  const setRepeatMode = useVibePlayerStore((s) => s.setRepeatMode);

  // Live playback position from RNTP. While RNTP isn't loaded (e.g. the
  // user navigated to the player with no track), these stay at 0 and
  // the progress bar reflects that.
  const { position, duration } = useProgress();

  // Bookmark is component-local for now — see library screen rationale.
  const [isBookmarked, setBookmarked] = React.useState(false);

  const handleTogglePlay = useCallback(() => {
    togglePlay();
    if (isPlaying) void bridgePause();
    else void bridgeResume();
  }, [isPlaying, togglePlay]);

  // `playNextInQueue` / `playPreviousInQueue` advance the store's queue
  // AND replay the new track on RNTP through the same `playTrack()` path
  // tapping a tile uses. The previous implementation called the store's
  // mutators (which only updated Zustand) and then `TrackPlayer.skipToNext()`
  // (which silently no-op'd because RNTP's queue is always size-1 — every
  // playTrack starts with reset()). Both halves were broken; one consolidated
  // call replaces them.
  const handleNext = useCallback(() => {
    void playNextInQueue();
  }, []);

  const handlePrev = useCallback(() => {
    void playPreviousInQueue();
  }, []);

  const handleRepeatCycle = useCallback(() => {
    const next = nextRepeatMode(repeatMode);
    setRepeatMode(next);
  }, [repeatMode, setRepeatMode]);

  const handleSeek = useCallback((seconds: number) => {
    void bridgeSeekTo(seconds);
  }, []);

  const handleToggleBookmark = useCallback(() => {
    setBookmarked((b) => !b);
  }, []);

  const displayDuration =
    duration > 0 ? duration : (currentTrack?.duration ?? 0);

  // Album art occupies ~50 % of the screen height, clamped to a circle
  // whose diameter never exceeds the screen width so the mandala never
  // crops its outer ring.
  const artSize = useMemo(() => {
    const targetSize = Math.min(height * 0.5, 360);
    return Math.max(220, targetSize);
  }, [height]);

  const category = currentTrack
    ? toSacredCategory((currentTrack as { category?: string }).category)
    : 'mantra';

  const categoryDisplay = currentTrack
    ? categoryLabel(
        (currentTrack as { category?: string }).category ?? 'Meditation'
      )
    : '';

  if (!currentTrack) {
    return (
      <DivineBackground variant="sacred" style={styles.root}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            No track loaded. Choose one from the library to begin.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.backLink}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
          >
            <Text style={styles.backLinkText}>← Go to library</Text>
          </Pressable>
        </View>
      </DivineBackground>
    );
  }

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={styles.container}>
        {/* Back button */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
        </View>

        {/* Sacred-geometry album art */}
        <View style={[styles.artSection, { height: artSize + 24 }]}>
          <SacredGeometryArt
            category={category}
            isPlaying={isPlaying}
            size={artSize}
          />
        </View>

        {/* Track info */}
        <View style={styles.infoBlock}>
          <Text style={styles.trackTitle} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          {/* The artist field often holds the Sanskrit name in the seed
              content. Render it in Devanagari typography regardless so
              the track header always reads as a sacred invocation. */}
          {currentTrack.artist ? (
            <Text style={styles.trackSanskrit} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          ) : null}
          {categoryDisplay ? (
            <Text style={styles.trackCategory}>{categoryDisplay}</Text>
          ) : null}
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <PlayerProgressBar
            position={position}
            duration={displayDuration}
            onSeek={handleSeek}
          />
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <PlaybackControls
            isPlaying={isPlaying}
            repeatMode={repeatMode}
            isBookmarked={isBookmarked}
            onPrev={handlePrev}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onCycleRepeat={handleRepeatCycle}
            onToggleBookmark={handleToggleBookmark}
          />
        </View>

        {/* Shloka companion — expands while playing, collapses while paused */}
        <View style={styles.companionWrap}>
          <ShlokaCompanion
            expanded={isPlaying}
            sanskrit="ॐ नमो भगवते वासुदेवाय"
            transliteration="oṁ namo bhagavate vāsudevāya"
            meaning="Salutations to the Supreme Lord Vāsudeva — the one who dwells in all beings."
            reference="Śrīmad-Bhāgavatam 1.1.1"
          />
        </View>
      </View>
    </DivineBackground>
  );
}

function nextRepeatMode(current: RepeatMode): RepeatMode {
  switch (current) {
    case 'off':
      return 'all';
    case 'all':
      return 'one';
    case 'one':
      return 'off';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 28,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    backgroundColor: 'rgba(212,160,23,0.06)',
  },
  backBtnText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 20,
    color: GOLD,
    // Optical centering.
    marginTop: -2,
  },
  artSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    alignItems: 'center',
    gap: 2,
  },
  trackTitle: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 22,
    color: SACRED_WHITE,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  trackSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 14,
    // 14 × 2.0 = 28
    lineHeight: 28,
    color: GOLD,
    textAlign: 'center',
    marginTop: 2,
  },
  trackCategory: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  progressSection: {
    marginTop: 6,
  },
  controlsSection: {
    marginTop: 4,
  },
  companionWrap: {
    marginTop: 6,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: GOLD,
    letterSpacing: 0.3,
  },
});
