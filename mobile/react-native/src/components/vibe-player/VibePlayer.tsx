/**
 * KIAAN Vibe Player — Core Media Playback Integration
 *
 * Provides persistent audio playback for Bhagavad Gita verses, guided meditations,
 * and KIAAN voice insights. Renders as either a mini player (collapsed) docked above
 * the tab bar, or a full-screen player with waveform, verse text, and controls.
 *
 * Architecture:
 * - react-native-track-player handles native audio (background, lock screen, notification)
 * - Zustand store (vibePlayerStore) manages UI state
 * - Offline tracks served from WatermelonDB + file system cache
 * - Gesture Handler enables swipe-up/down transitions
 *
 * IMPORTANT: This component reads from but never mutates the KIAAN AI Ecosystem.
 * All audio content is fetched via API or served from local cache.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
  Event,
  State,
  RepeatMode,
  Capability,
} from 'react-native-track-player';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, darkTheme, spacing, typography, radii, shadows, motion } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VibeTrack {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  /** Sanskrit / original language text */
  sacredText?: string;
  /** Translated text */
  translationText?: string;
  /** Bhagavad Gita chapter.verse reference (e.g., "2.47") */
  verseRef?: string;
  artworkUrl?: string;
  duration?: number;
  /** Whether this track is available offline */
  isOffline?: boolean;
}

export interface VibePlayerProps {
  /** Whether the full player is expanded */
  isExpanded: boolean;
  /** Callback when expansion state changes */
  onToggleExpand: (expanded: boolean) => void;
  /** Current theme colors */
  theme?: typeof darkTheme;
}

// ---------------------------------------------------------------------------
// Track Player Service (registered once at app startup)
// ---------------------------------------------------------------------------

/**
 * Registers the Track Player service and configures capabilities.
 * Call this once in the app entry point (index.js or App.tsx).
 */
export async function setupVibePlayer(): Promise<void> {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 100, // 100MB offline cache
    });

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      // Lock screen and notification metadata
      android: {
        appKilledPlaybackBehavior: 'StopPlaybackAndRemoveNotification' as never,
      },
    });

    // Default repeat mode: repeat queue
    await TrackPlayer.setRepeatMode(RepeatMode.Queue);
  } catch (error) {
    // Player may already be set up (hot reload). Safe to ignore.
    if (
      error instanceof Error &&
      !error.message.includes('already been initialized')
    ) {
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// Queue Management Helpers
// ---------------------------------------------------------------------------

export async function addTrackToQueue(track: VibeTrack): Promise<void> {
  await TrackPlayer.add({
    id: track.id,
    url: track.url,
    title: track.title,
    artist: track.subtitle ?? 'Bhagavad Gita',
    artwork: track.artworkUrl,
    duration: track.duration,
    // Store verse metadata for display
    description: JSON.stringify({
      sacredText: track.sacredText,
      translationText: track.translationText,
      verseRef: track.verseRef,
    }),
  });
}

export async function playTrack(track: VibeTrack): Promise<void> {
  const queue = await TrackPlayer.getQueue();
  const existingIndex = queue.findIndex((t) => t.id === track.id);

  if (existingIndex >= 0) {
    // Track already in queue — skip to it
    await TrackPlayer.skip(existingIndex);
  } else {
    // Add and skip to new track
    await addTrackToQueue(track);
    const newQueue = await TrackPlayer.getQueue();
    await TrackPlayer.skip(newQueue.length - 1);
  }

  await TrackPlayer.play();
}

export async function loadPlaylist(tracks: VibeTrack[]): Promise<void> {
  await TrackPlayer.reset();
  const mapped = tracks.map((track) => ({
    id: track.id,
    url: track.url,
    title: track.title,
    artist: track.subtitle ?? 'Bhagavad Gita',
    artwork: track.artworkUrl,
    duration: track.duration,
    description: JSON.stringify({
      sacredText: track.sacredText,
      translationText: track.translationText,
      verseRef: track.verseRef,
    }),
  }));
  await TrackPlayer.add(mapped);
}

// ---------------------------------------------------------------------------
// Waveform Visualization Component
// ---------------------------------------------------------------------------

interface WaveformProps {
  /** Number of bars to render */
  barCount?: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current progress (0-1) */
  progress: number;
}

function Waveform({ barCount = 40, isPlaying, progress }: WaveformProps) {
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      // Generate a pseudo-random but deterministic height for each bar
      const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      return (seed - Math.floor(seed)) * 0.7 + 0.3;
    });
  }, [barCount]);

  return (
    <View
      style={styles.waveformContainer}
      accessibilityLabel="Audio waveform visualization"
      accessibilityRole="image"
    >
      {bars.map((height, index) => {
        const isPlayed = index / barCount <= progress;
        return (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: `${height * 100}%`,
                backgroundColor: isPlayed
                  ? colors.gold[400]
                  : 'rgba(212, 164, 76, 0.2)',
                opacity: isPlaying ? 1 : 0.6,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mini Player Component (collapsed — docked above tab bar)
// ---------------------------------------------------------------------------

interface MiniPlayerProps {
  onExpand: () => void;
  theme: typeof darkTheme;
}

function MiniPlayer({ onExpand, theme }: MiniPlayerProps) {
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();
  const isPlaying = playbackState.state === State.Playing;

  const [currentTrack, setCurrentTrack] = React.useState<{
    title: string;
    artist?: string;
    verseRef?: string;
  } | null>(null);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.track) {
      let verseRef: string | undefined;
      try {
        const meta = JSON.parse(event.track.description ?? '{}');
        verseRef = meta.verseRef;
      } catch {
        // No verse metadata — that's fine
      }
      setCurrentTrack({
        title: event.track.title ?? 'Unknown',
        artist: event.track.artist,
        verseRef,
      });
    }
  });

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Pressable
      onPress={onExpand}
      style={[styles.miniPlayer, { backgroundColor: theme.miniPlayerBackground }]}
      accessibilityRole="button"
      accessibilityLabel={`Now playing: ${currentTrack.title}. ${isPlaying ? 'Playing' : 'Paused'}. Tap to expand.`}
      accessibilityHint="Opens the full vibe player"
    >
      {/* Progress bar (top edge) */}
      <View style={styles.miniProgressTrack}>
        <View
          style={[
            styles.miniProgressFill,
            { width: `${progressPercent}%` },
          ]}
        />
      </View>

      <View style={styles.miniContent}>
        {/* Track info */}
        <View style={styles.miniTrackInfo}>
          <Text
            style={[styles.miniTitle, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {currentTrack.verseRef
              ? `BG ${currentTrack.verseRef} — ${currentTrack.title}`
              : currentTrack.title}
          </Text>
          {currentTrack.artist && (
            <Text
              style={[styles.miniSubtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {currentTrack.artist}
            </Text>
          )}
        </View>

        {/* Play/Pause button */}
        <Pressable
          onPress={handlePlayPause}
          hitSlop={12}
          style={styles.miniPlayButton}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Text style={styles.miniPlayIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>

        {/* Skip button */}
        <Pressable
          onPress={() => TrackPlayer.skipToNext()}
          hitSlop={12}
          style={styles.miniSkipButton}
          accessibilityRole="button"
          accessibilityLabel="Next track"
        >
          <Text style={styles.miniSkipIcon}>⏭</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Full Player Component (expanded — full screen)
// ---------------------------------------------------------------------------

interface FullPlayerProps {
  onCollapse: () => void;
  theme: typeof darkTheme;
}

function FullPlayer({ onCollapse, theme }: FullPlayerProps) {
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress(200);
  const isPlaying = playbackState.state === State.Playing;
  const isBuffering = playbackState.state === State.Buffering;

  const [currentTrack, setCurrentTrack] = React.useState<{
    title: string;
    artist?: string;
    sacredText?: string;
    translationText?: string;
    verseRef?: string;
  } | null>(null);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.track) {
      let meta = { sacredText: '', translationText: '', verseRef: '' };
      try {
        meta = JSON.parse(event.track.description ?? '{}');
      } catch {
        // No metadata
      }
      setCurrentTrack({
        title: event.track.title ?? 'Unknown',
        artist: event.track.artist,
        ...meta,
      });
    }
  });

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback(async (percent: number) => {
    const seekPosition = percent * duration;
    await TrackPlayer.seekTo(seekPosition);
  }, [duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? position / duration : 0;

  return (
    <View
      style={[styles.fullPlayer, { backgroundColor: theme.background }]}
      accessibilityRole="none"
      accessibilityLabel="Full vibe player"
    >
      {/* Header */}
      <View style={styles.fullHeader}>
        <Pressable
          onPress={onCollapse}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Collapse player"
        >
          <Text style={[styles.collapseIcon, { color: theme.textSecondary }]}>
            ▼
          </Text>
        </Pressable>
        <Text style={[styles.fullHeaderTitle, { color: theme.textSecondary }]}>
          KIAAN Vibe Player
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Artwork / Mandala placeholder */}
      <View style={styles.artworkContainer}>
        <View style={[styles.artworkPlaceholder, { borderColor: theme.cardBorder }]}>
          <Text style={styles.artworkEmoji}>🕉️</Text>
        </View>
      </View>

      {/* Waveform */}
      <Waveform
        barCount={50}
        isPlaying={isPlaying}
        progress={progressPercent}
      />

      {/* Track info */}
      <View style={styles.fullTrackInfo}>
        {currentTrack?.verseRef && (
          <Text
            style={[styles.verseRef, { color: colors.gold[400] }]}
            accessibilityRole="text"
          >
            Bhagavad Gita {currentTrack.verseRef}
          </Text>
        )}
        <Text
          style={[styles.fullTitle, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {currentTrack?.title ?? 'No track selected'}
        </Text>
        {currentTrack?.artist && (
          <Text style={[styles.fullSubtitle, { color: theme.textSecondary }]}>
            {currentTrack.artist}
          </Text>
        )}
      </View>

      {/* Progress scrubber */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent * 100}%` },
            ]}
          />
          <View
            style={[
              styles.progressThumb,
              { left: `${progressPercent * 100}%` },
            ]}
          />
        </View>
        <View style={styles.timeLabels}>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Playback controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={() => TrackPlayer.skipToPrevious()}
          hitSlop={12}
          style={styles.controlButton}
          accessibilityRole="button"
          accessibilityLabel="Previous track"
        >
          <Text style={styles.controlIcon}>⏮</Text>
        </Pressable>

        <Pressable
          onPress={handlePlayPause}
          style={[styles.playButton, shadows.glow]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          {isBuffering ? (
            <ActivityIndicator color={colors.divine.void} size="small" />
          ) : (
            <Text style={styles.playButtonIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => TrackPlayer.skipToNext()}
          hitSlop={12}
          style={styles.controlButton}
          accessibilityRole="button"
          accessibilityLabel="Next track"
        >
          <Text style={styles.controlIcon}>⏭</Text>
        </Pressable>
      </View>

      {/* Sacred text (verse display) */}
      {currentTrack?.sacredText && (
        <View style={styles.sacredTextContainer}>
          <Text
            style={[styles.sacredText, { color: colors.gold[300] }]}
            accessibilityRole="text"
            accessibilityLabel={`Sanskrit verse: ${currentTrack.sacredText}`}
          >
            {currentTrack.sacredText}
          </Text>
          {currentTrack.translationText && (
            <Text
              style={[styles.translationText, { color: theme.textSecondary }]}
            >
              {currentTrack.translationText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Vibe Player Container (orchestrates mini ↔ full transition)
// ---------------------------------------------------------------------------

export function VibePlayer({
  isExpanded,
  onToggleExpand,
  theme = darkTheme,
}: VibePlayerProps) {
  const expandProgress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    expandProgress.value = withSpring(isExpanded ? 1 : 0, motion.sheetSpring);
  }, [isExpanded, expandProgress]);

  // Swipe gesture: up to expand, down to collapse
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.velocityY < -500 && !isExpanded) {
        onToggleExpand(true);
        AccessibilityInfo.announceForAccessibility('Vibe player expanded');
      } else if (event.velocityY > 500 && isExpanded) {
        onToggleExpand(false);
        AccessibilityInfo.announceForAccessibility('Vibe player collapsed');
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [0, -500],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  if (isExpanded) {
    return (
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.fullPlayerWrapper, animatedStyle]}>
          <FullPlayer
            onCollapse={() => onToggleExpand(false)}
            theme={theme}
          />
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View>
        <MiniPlayer onExpand={() => onToggleExpand(true)} theme={theme} />
      </Animated.View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Mini Player
  miniPlayer: {
    height: spacing.miniPlayerHeight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 164, 76, 0.06)',
    paddingHorizontal: spacing.lg,
  },
  miniProgressTrack: {
    height: 2,
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    marginHorizontal: -spacing.lg,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.gold[400],
  },
  miniContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  miniTrackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  miniTitle: {
    ...typography.label,
  },
  miniSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  miniPlayButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayIcon: {
    fontSize: 20,
  },
  miniSkipButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSkipIcon: {
    fontSize: 16,
  },

  // Full Player
  fullPlayerWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  fullPlayer: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['4xl'],
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  collapseIcon: {
    fontSize: 24,
    width: 44,
    textAlign: 'center',
  },
  fullHeaderTitle: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Artwork
  artworkContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  artworkPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: radii.xl,
    borderWidth: 1,
    backgroundColor: 'rgba(212, 164, 76, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkEmoji: {
    fontSize: 64,
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: 2,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 1,
    minWidth: 2,
  },

  // Track info
  fullTrackInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  verseRef: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  fullTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  fullSubtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },

  // Progress
  progressContainer: {
    marginBottom: spacing['2xl'],
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(212, 164, 76, 0.15)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold[400],
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gold[400],
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    ...typography.caption,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing['4xl'],
    marginBottom: spacing['3xl'],
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 28,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonIcon: {
    fontSize: 28,
    color: colors.divine.void,
  },

  // Sacred text
  sacredTextContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sacredText: {
    ...typography.sacred,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  translationText: {
    ...typography.body,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VibePlayer;
