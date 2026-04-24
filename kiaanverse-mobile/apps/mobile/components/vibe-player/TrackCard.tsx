/**
 * TrackCard — list item for a meditation track
 *
 * Horizontal layout: artwork thumbnail | title + artist | duration.
 * Currently-playing track gets golden text and a small animated
 * equalizer icon (three oscillating bars).
 *
 * Props:
 *   track      — MeditationTrack data
 *   isPlaying  — whether this track is the active one
 *   onPress    — callback when the card is tapped
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { MeditationTrack } from '@kiaanverse/api';

interface TrackCardProps {
  track: MeditationTrack;
  isPlaying: boolean;
  onPress: () => void;
}

/** Format seconds to M:SS */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Small 3-bar equalizer animation shown on the playing track */
function MiniEqualizer() {
  const bar1 = useSharedValue(6);
  const bar2 = useSharedValue(10);
  const bar3 = useSharedValue(4);

  useEffect(() => {
    bar1.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 300 }),
        withTiming(4, { duration: 400 })
      ),
      -1,
      true
    );
    bar2.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 250 }),
        withTiming(6, { duration: 350 })
      ),
      -1,
      true
    );
    bar3.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 350 }),
        withTiming(3, { duration: 300 })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(bar1);
      cancelAnimation(bar2);
      cancelAnimation(bar3);
    };
  }, [bar1, bar2, bar3]);

  const style1 = useAnimatedStyle(() => ({ height: bar1.value }));
  const style2 = useAnimatedStyle(() => ({ height: bar2.value }));
  const style3 = useAnimatedStyle(() => ({ height: bar3.value }));

  return (
    <View style={eqStyles.container}>
      <Animated.View style={[eqStyles.bar, style1]} />
      <Animated.View style={[eqStyles.bar, style2]} />
      <Animated.View style={[eqStyles.bar, style3]} />
    </View>
  );
}

const eqStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: colors.primary[500],
    borderRadius: 1,
  },
});

export function TrackCard({
  track,
  isPlaying,
  onPress,
}: TrackCardProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${track.artist}, ${formatDuration(track.duration)}`}
    >
      {/* Artwork thumbnail */}
      <View style={[styles.thumbnail, isPlaying && styles.thumbnailPlaying]}>
        {isPlaying ? (
          <MiniEqualizer />
        ) : (
          <Text style={styles.musicIcon}>{'\u266B'}</Text>
        )}
      </View>

      {/* Track info */}
      <View style={styles.info}>
        <Text
          variant="body"
          color={isPlaying ? colors.primary[300] : colors.text.primary}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text variant="caption" color={colors.text.muted} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>

      {/* Duration */}
      <Text variant="caption" color={colors.text.muted}>
        {formatDuration(track.duration)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background.card,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaying: {
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  musicIcon: {
    fontSize: 18,
    color: colors.text.muted,
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
