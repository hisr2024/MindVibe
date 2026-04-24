/**
 * PlayerProgressBar — draggable audio position indicator.
 *
 * Visual spec:
 *   - Track:  4 px tall, `rgba(212,160,23,0.15)`.
 *   - Fill:   LinearGradient gold-shimmer.
 *   - Thumb:  12 px gold circle with a soft divine shadow.
 *   - Times:  Outfit 11 px TEXT_MUTED ([position left, duration right]).
 *
 * Interaction:
 *   - Drag the thumb (or tap anywhere on the track) to scrub.
 *   - While the finger is down, the UI reports the scrub position — so
 *     the position label tracks the finger, not the last confirmed audio
 *     position. On release `onSeek(seconds)` fires, at which point the
 *     caller is expected to invoke TrackPlayer.seekTo().
 *   - Haptic selection feedback fires whenever the rounded position
 *     crosses a second boundary (one tick per second), mirroring the
 *     Apple Music feel without spamming the vibration motor.
 */

import React, { useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const GOLD = '#D4A017';
const GOLD_SHIMMER = [
  'rgba(212,160,23,0.4)',
  'rgba(240,192,64,1)',
  'rgba(212,160,23,0.6)',
] as const;
const TEXT_MUTED = 'rgba(200,191,168,0.6)';
const TRACK_HEIGHT = 4;
const THUMB_SIZE = 12;
const TOUCH_SLOP = 20;

export interface PlayerProgressBarProps {
  /** Current audio position in seconds (0 ≤ position ≤ duration). */
  readonly position: number;
  /** Track duration in seconds (positive, or zero while metadata loads). */
  readonly duration: number;
  /** Callback fired when the user lets go after dragging — absolute seconds. */
  readonly onSeek: (seconds: number) => void;
  /** Optional outer style. */
  readonly style?: ViewStyle;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayerProgressBarInner({
  position,
  duration,
  onSeek,
  style,
}: PlayerProgressBarProps): React.JSX.Element {
  /** Measured pixel width of the track — set via onLayout. */
  const trackWidth = useSharedValue(0);

  /** True while the finger is down. Shown-position follows the finger. */
  const isScrubbing = useSharedValue(0);

  /** Finger-local scrub position (seconds). */
  const scrubSeconds = useSharedValue(0);

  /** Last second boundary the haptic motor fired at — JS-thread ref. */
  const lastHapticSec = useRef(-1);

  const handleTrackLayout = useCallback(
    (e: LayoutChangeEvent) => {
      trackWidth.value = e.nativeEvent.layout.width;
    },
    [trackWidth]
  );

  const emitHapticOnTick = useCallback((seconds: number) => {
    const rounded = Math.floor(seconds);
    if (rounded !== lastHapticSec.current) {
      lastHapticSec.current = rounded;
      void Haptics.selectionAsync();
    }
  }, []);

  const finishSeek = useCallback(
    (seconds: number) => {
      onSeek(Math.max(0, Math.min(duration, seconds)));
    },
    [duration, onSeek]
  );

  /** Convert an x-offset to seconds. */
  const xToSeconds = (x: number, width: number, total: number): number => {
    'worklet';
    if (width <= 0 || total <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, x / width));
    return ratio * total;
  };

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      isScrubbing.value = 1;
      const sec = xToSeconds(e.x, trackWidth.value, duration);
      scrubSeconds.value = sec;
      runOnJS(emitHapticOnTick)(sec);
    })
    .onUpdate((e) => {
      'worklet';
      const sec = xToSeconds(e.x, trackWidth.value, duration);
      scrubSeconds.value = sec;
      runOnJS(emitHapticOnTick)(sec);
    })
    .onEnd((e) => {
      'worklet';
      const sec = xToSeconds(e.x, trackWidth.value, duration);
      isScrubbing.value = 0;
      runOnJS(finishSeek)(sec);
    })
    .onFinalize(() => {
      'worklet';
      // Defensive — if the pan is cancelled without onEnd, still drop the
      // scrubbing flag so the bar returns to tracking the true position.
      isScrubbing.value = withTiming(0, { duration: 120 });
    });

  const fillStyle = useAnimatedStyle(() => {
    const w = trackWidth.value;
    if (w <= 0) return { width: 0 };
    const total = Math.max(0.001, duration);
    const displaySeconds =
      isScrubbing.value > 0 ? scrubSeconds.value : position;
    const ratio = Math.max(0, Math.min(1, displaySeconds / total));
    return { width: ratio * w };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const w = trackWidth.value;
    if (w <= 0) return { transform: [{ translateX: 0 }] };
    const total = Math.max(0.001, duration);
    const displaySeconds =
      isScrubbing.value > 0 ? scrubSeconds.value : position;
    const ratio = Math.max(0, Math.min(1, displaySeconds / total));
    return { transform: [{ translateX: ratio * w - THUMB_SIZE / 2 }] };
  });

  /** Label position mirrors thumb so the times track the finger. */
  const displaySeconds =
    duration > 0 ? Math.min(duration, Math.max(0, position)) : 0;

  return (
    <View style={[styles.wrap, style]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.trackTouch} hitSlop={TOUCH_SLOP}>
          <View style={styles.track} onLayout={handleTrackLayout}>
            <Animated.View style={[styles.fillWrap, fillStyle]}>
              <LinearGradient
                colors={GOLD_SHIMMER as unknown as string[]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Animated.View style={[styles.thumb, thumbStyle]} />
          </View>
        </View>
      </GestureDetector>

      <View style={styles.timesRow}>
        <Animated.Text style={styles.timeText}>
          {formatTime(displaySeconds)}
        </Animated.Text>
        <Animated.Text style={styles.timeText}>
          {formatTime(duration)}
        </Animated.Text>
      </View>
    </View>
  );
}

/** Gold-shimmer draggable scrub bar with position/duration labels. */
export const PlayerProgressBar = React.memo(PlayerProgressBarInner);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 6,
  },
  trackTouch: {
    width: '100%',
    paddingVertical: 8,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    width: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(212,160,23,0.15)',
  },
  fillWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    // Center thumb vertically on the track.
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
});
