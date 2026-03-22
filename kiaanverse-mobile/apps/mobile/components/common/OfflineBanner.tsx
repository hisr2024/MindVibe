/**
 * OfflineBanner — slides down from below the status bar when the device is offline.
 *
 * Uses react-native-reanimated layout animations for smooth show/hide.
 * Amber warning color with a Wifi-off icon and informative message.
 * Renders nothing when online — zero layout impact.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { Text, colors, spacing } from '@kiaanverse/ui';

interface OfflineBannerProps {
  isOffline: boolean;
  pendingCount?: number;
}

export function OfflineBanner({ isOffline, pendingCount = 0 }: OfflineBannerProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  const message = pendingCount > 0
    ? `You're offline. ${pendingCount} change${pendingCount === 1 ? '' : 's'} will sync when reconnected.`
    : "You're offline. Showing cached content.";

  return (
    <Animated.View
      entering={SlideInUp.duration(300).withInitialValues({ transform: [{ translateY: -60 }] })}
      exiting={SlideOutUp.duration(200)}
      style={[styles.container, { paddingTop: insets.top + 4 }]}
    >
      <Animated.View entering={FadeIn.delay(100)} exiting={FadeOut}>
        <Text style={styles.icon}>⚡</Text>
      </Animated.View>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: colors.semantic.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: spacing.md,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
