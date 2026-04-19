/**
 * KIAAN Vibe Player — Full-Screen Player
 *
 * Dark background with mandala decoration, track artwork, animated
 * waveform visualizer, playback controls (prev/play/next), progress
 * bar, volume slider, repeat and shuffle toggles, and queue indicator.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useVibePlayerStore } from '@kiaanverse/store';

/** Format seconds to M:SS string */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Number of waveform bars in the visualizer */
const BAR_COUNT = 20;

function WaveformBar({ index, isPlaying }: { index: number; isPlaying: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (isPlaying) {
      const baseDelay = index * 50;
      height.value = withRepeat(
        withSequence(
          withTiming(8 + Math.random() * 32, { duration: 300 + baseDelay }),
          withTiming(4 + Math.random() * 12, { duration: 200 + baseDelay }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(8, { duration: 300 });
    }
  }, [isPlaying, height, index]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.waveBar, barStyle]} />;
}

export default function VibePlayerScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    repeatMode,
    isShuffled,
    queue,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    setRepeatMode,
    toggleShuffle,
  } = useVibePlayerStore();

  const currentTime = useMemo(
    () => (currentTrack ? progress * currentTrack.duration : 0),
    [progress, currentTrack],
  );

  const totalTime = currentTrack?.duration ?? 0;

  const handleTogglePlay = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePlay();
  }, [togglePlay]);

  const handleNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextTrack();
  }, [nextTrack]);

  const handlePrev = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    prevTrack();
  }, [prevTrack]);

  const handleRepeatCycle = useCallback(() => {
    void Haptics.selectionAsync();
    const modes = ['off', 'all', 'one'] as const;
    const currentIdx = modes.indexOf(repeatMode);
    // `modes[index]` is `T | undefined` under noUncheckedIndexedAccess;
    // the modulo guarantees a valid index, but TS can't infer that.
    const nextMode = modes[(currentIdx + 1) % modes.length] ?? 'off';
    setRepeatMode(nextMode);
  }, [repeatMode, setRepeatMode]);

  const handleShuffle = useCallback(() => {
    void Haptics.selectionAsync();
    toggleShuffle();
  }, [toggleShuffle]);

  const repeatLabel = repeatMode === 'one' ? '1' : repeatMode === 'all' ? 'A' : '-';

  if (!currentTrack) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <Text variant="body" color={colors.text.muted} align="center">
            No track loaded. Select a track from the library.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text variant="label" color={colors.primary[300]}>
              Go to Library
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text variant="label" color={colors.text.secondary}>
            {'\u2190'} Back
          </Text>
        </Pressable>

        {/* Artwork placeholder */}
        <View style={styles.artworkContainer}>
          <View style={styles.artwork}>
            <Text style={styles.mandalaIcon}>{'\u2638'}</Text>
          </View>
        </View>

        {/* Track info */}
        <Text variant="h3" color={colors.text.primary} align="center">
          {currentTrack.title}
        </Text>
        <Text variant="body" color={colors.text.secondary} align="center">
          {currentTrack.artist}
        </Text>

        {/* Waveform visualizer */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <WaveformBar key={i} index={i} isPlaying={isPlaying} />
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text variant="caption" color={colors.text.muted}>
              {formatTime(currentTime)}
            </Text>
            <Text variant="caption" color={colors.text.muted}>
              {formatTime(totalTime)}
            </Text>
          </View>
        </View>

        {/* Main controls */}
        <View style={styles.controlsRow}>
          <Pressable onPress={handlePrev} style={styles.controlButton} accessibilityLabel="Previous">
            <Text style={styles.controlIcon}>{'\u23EE'}</Text>
          </Pressable>
          <Pressable onPress={handleTogglePlay} style={styles.playButton} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
            <Text style={styles.playIcon}>{isPlaying ? '\u23F8' : '\u25B6'}</Text>
          </Pressable>
          <Pressable onPress={handleNext} style={styles.controlButton} accessibilityLabel="Next">
            <Text style={styles.controlIcon}>{'\u23ED'}</Text>
          </Pressable>
        </View>

        {/* Secondary controls */}
        <View style={styles.secondaryRow}>
          <Pressable onPress={handleRepeatCycle} style={styles.secondaryButton}>
            <Text
              variant="caption"
              color={repeatMode !== 'off' ? colors.primary[500] : colors.text.muted}
            >
              Repeat {repeatLabel}
            </Text>
          </Pressable>

          <Pressable onPress={handleShuffle} style={styles.secondaryButton}>
            <Text
              variant="caption"
              color={isShuffled ? colors.primary[500] : colors.text.muted}
            >
              Shuffle
            </Text>
          </Pressable>

          <View style={styles.secondaryButton}>
            <Text variant="caption" color={colors.text.muted}>
              Queue ({queue.length})
            </Text>
          </View>
        </View>

        {/* Volume */}
        <View style={styles.volumeRow}>
          <Text variant="caption" color={colors.text.muted}>
            Vol
          </Text>
          <View style={styles.volumeTrack}>
            <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
          </View>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background.dark,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backLink: {
    paddingVertical: spacing.sm,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  artwork: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.background.surface,
    borderWidth: 2,
    borderColor: colors.alpha.goldMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandalaIcon: {
    fontSize: 64,
    color: colors.primary[500],
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 48,
    gap: 3,
  },
  waveBar: {
    width: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  progressSection: {
    gap: spacing.xxs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 28,
    color: colors.text.primary,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: colors.background.dark,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  volumeTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: colors.primary[300],
    borderRadius: 2,
  },
});
