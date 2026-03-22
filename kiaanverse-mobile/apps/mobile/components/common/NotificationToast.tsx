/**
 * NotificationToast — In-app toast for foreground notifications
 *
 * Listens for notifications received while the app is in the foreground.
 * Shows an animated slide-in card from the top with title and body.
 * Tapping the toast navigates to the relevant screen.
 * Auto-dismisses after 4 seconds.
 *
 * Uses the same animation patterns as OfflineBanner for consistency.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { NotificationData } from '../../services/notificationService';

const AUTO_DISMISS_MS = 4_000;

interface ToastState {
  id: string;
  title: string;
  body: string;
  data: NotificationData | undefined;
}

/**
 * Notification toast overlay — render once in the root layout.
 * Listens for foreground notifications and displays them as a card.
 */
export function NotificationToast(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  // Listen for foreground notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;

      // Only show toast if we have meaningful content
      if (!title && !body) return;

      const toastId = notification.request.identifier + Date.now();

      setToast({
        id: toastId,
        title: title ?? '',
        body: body ?? '',
        data: data as NotificationData | undefined,
      });

      // Auto-dismiss after 4 seconds
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setToast((current) => (current?.id === toastId ? null : current));
      }, AUTO_DISMISS_MS);
    });

    return () => subscription.remove();
  }, []);

  const handlePress = useCallback(() => {
    if (!toast?.data?.type) {
      setToast(null);
      return;
    }

    // Clear dismiss timer
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setToast(null);

    // Navigate based on notification type
    const data = toast.data;
    try {
      switch (data.type) {
        case 'daily-verse':
          router.push('/(tabs)/gita');
          break;
        case 'journey-reminder':
          if (data.journeyId) {
            router.push(`/(tabs)/journey/${data.journeyId}` as `/(tabs)/journey/${string}`);
          }
          break;
        case 'streak-alert':
          router.push('/(tabs)/home');
          break;
        case 'sakha-message':
          router.push('/(tabs)/sakha');
          break;
        case 'milestone':
          if (data.journeyId) {
            router.push(`/(tabs)/journey/${data.journeyId}` as `/(tabs)/journey/${string}`);
          } else {
            router.push('/wellness/karma');
          }
          break;
      }
    } catch {
      // Navigation error — toast already dismissed
    }
  }, [toast, router]);

  const handleDismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setToast(null);
  }, []);

  if (!toast) return null;

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(200)}
      style={[styles.container, { top: insets.top + 8 }]}
    >
      <Pressable
        onPress={handlePress}
        style={styles.card}
        accessibilityRole="alert"
        accessibilityLabel={`Notification: ${toast.title}. ${toast.body}`}
      >
        <Animated.View entering={FadeIn.delay(100)} exiting={FadeOut} style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {toast.body}
          </Text>
        </Animated.View>
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={8}
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 10000,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  body: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  dismissText: {
    color: colors.text.muted,
    fontSize: 16,
    fontWeight: '600',
  },
});
