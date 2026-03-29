/**
 * Mini Player Overlay — persistent playback indicator
 *
 * Floats above the tab bar showing the current track title, a
 * play/pause button, and a thin golden progress line at the top.
 * Tapping navigates to the full player screen.
 *
 * Props:
 *   isVisible — whether the mini player should render
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import { useVibePlayerStore } from '@kiaanverse/store';

interface MiniPlayerProps {
  isVisible: boolean;
}

export function MiniPlayer({ isVisible }: MiniPlayerProps): React.JSX.Element | null {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, progress, togglePlay } = useVibePlayerStore();

  const handleTogglePlay = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePlay();
  }, [togglePlay]);

  const handlePress = useCallback(() => {
    router.push('/vibe-player/player');
  }, [router]);

  /** Compute bottom offset dynamically based on safe area + tab bar height */
  const containerStyle = useMemo(
    () => [styles.container, { bottom: insets.bottom + spacing.navHeight + spacing.xs }],
    [insets.bottom],
  );

  if (!isVisible || !currentTrack) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
      style={containerStyle}
    >
      {/* Golden accent progress line */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Pressable onPress={handlePress} style={styles.content} accessibilityRole="button" accessibilityLabel="Open full player">
        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text variant="bodySmall" color={colors.text.primary} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text variant="caption" color={colors.text.muted} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Play/Pause button */}
        <Pressable
          onPress={handleTogglePlay}
          style={styles.playButton}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          accessibilityRole="button"
        >
          <Text style={styles.playIcon}>
            {isPlaying ? '\u23F8' : '\u25B6'}
          </Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const MINI_PLAYER_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.raw.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.alpha.goldLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  trackInfo: {
    flex: 1,
    gap: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.alpha.goldMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: colors.primary[300],
  },
});
