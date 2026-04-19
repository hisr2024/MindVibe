/**
 * Notification Service — Kiaanverse
 *
 * Manages all push notification lifecycle:
 * - Android notification channels (per-type importance levels)
 * - iOS notification categories with action buttons
 * - Permission requests and Expo push token management
 * - Local notification scheduling (daily verse, journey reminders, streak alerts)
 * - Foreground notification display
 * - Notification response handling (deep linking to correct screens)
 * - Push token registration with backend
 *
 * Module-level setup:
 *   Notifications.setNotificationHandler() is called at module level to ensure
 *   it's registered before any notification arrives. This prevents the
 *   "No notification handler set" console warning.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { api } from '@kiaanverse/api';
import { useUserPreferencesStore } from '@kiaanverse/store';
import type { useRouter } from 'expo-router';

/** Router type inferred from expo-router's useRouter hook. */
type AppRouter = ReturnType<typeof useRouter>;

// ---------------------------------------------------------------------------
// Notification Data Types (discriminated union)
// ---------------------------------------------------------------------------

/** Typed payload attached to every notification's `data` field. */
export type NotificationData =
  | { type: 'daily-verse'; chapter?: number; verse?: number }
  | { type: 'journey-reminder'; journeyId: string }
  | { type: 'streak-alert' }
  | { type: 'sakha-message'; sessionId?: string }
  | { type: 'milestone'; journeyId?: string; milestoneType?: string };

// ---------------------------------------------------------------------------
// Notification Channel / Category IDs
// ---------------------------------------------------------------------------

export const CHANNELS = {
  DAILY_VERSE: 'daily-verse',
  JOURNEY_REMINDERS: 'journey-reminders',
  SAKHA_INSIGHTS: 'sakha-insights',
  MILESTONES: 'milestones',
  STREAK_ALERTS: 'streak-alerts',
} as const;

export const CATEGORIES = {
  DAILY_VERSE: 'daily-verse',
  JOURNEY_REMINDER: 'journey-reminder',
  STREAK_ALERT: 'streak-alert',
} as const;

// Deterministic notification identifiers for cancellation/rescheduling
export const NOTIFICATION_IDS = {
  DAILY_VERSE: 'daily-verse',
  STREAK_ALERT: 'streak-alert',
  journeyReminder: (journeyId: string) => `journey-reminder-${journeyId}`,
} as const;

const PUSH_TOKEN_KEY = 'expo-push-token';

// ---------------------------------------------------------------------------
// Module-level foreground handler (MUST be called before any notification)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ---------------------------------------------------------------------------
// Android Notification Channels
// ---------------------------------------------------------------------------

/**
 * Set up Android notification channels with appropriate importance levels.
 * No-op on iOS. Safe to call multiple times — channels are upserted.
 */
async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Promise.all([
      Notifications.setNotificationChannelAsync(CHANNELS.DAILY_VERSE, {
        name: 'Daily Verse',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        description: 'Morning verse of the day from Bhagavad Gita',
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.JOURNEY_REMINDERS, {
        name: 'Journey Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        description: 'Reminders for your active spiritual journeys',
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.SAKHA_INSIGHTS, {
        name: 'Sakha Insights',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        description: 'Personalized wisdom from your AI companion Sakha',
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.MILESTONES, {
        name: 'Milestones',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        description: 'Journey completions and karma tree growth',
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.STREAK_ALERTS, {
        name: 'Streak Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        description: 'Reminders to maintain your practice streak',
      }),
    ]);
  } catch (error) {
    // Channel setup failure is non-critical — notifications still work
    // with default channel on older Android versions
    if (__DEV__) {
      console.warn('Failed to set up notification channels:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// iOS Notification Categories (Action Buttons)
// ---------------------------------------------------------------------------

/**
 * Set up iOS notification categories with interactive action buttons.
 * No-op on Android. Safe to call multiple times.
 */
async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    await Promise.all([
      Notifications.setNotificationCategoryAsync(CATEGORIES.DAILY_VERSE, [
        {
          identifier: 'read-now',
          buttonTitle: 'Read Now',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'later',
          buttonTitle: 'Later',
          options: { isDestructive: false },
        },
      ]),
      Notifications.setNotificationCategoryAsync(CATEGORIES.JOURNEY_REMINDER, [
        {
          identifier: 'start-practice',
          buttonTitle: 'Start Practice',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'snooze',
          buttonTitle: 'Snooze',
          options: { isDestructive: false },
        },
      ]),
      Notifications.setNotificationCategoryAsync(CATEGORIES.STREAK_ALERT, [
        {
          identifier: 'practice-now',
          buttonTitle: 'Practice Now',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: { isDestructive: true },
        },
      ]),
    ]);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to set up notification categories:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// Permission & Token Management
// ---------------------------------------------------------------------------

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise. Never throws.
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get the Expo push token for this device.
 * Returns null if token cannot be obtained (no projectId, permission denied, etc.).
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId = Constants.default.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      if (__DEV__) {
        console.warn(
          'Cannot get push token: EAS_PROJECT_ID not configured in app.config.ts extra.eas.projectId',
        );
      }
      return null;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to get Expo push token:', error);
    }
    return null;
  }
}

/**
 * Register the device's Expo push token with the backend.
 * Skips registration if the same token is already stored.
 * Never throws — push token registration is best-effort.
 */
export async function registerPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;

    // Check if we've already registered this token
    const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (storedToken === token) return;

    // Register with backend — matches PushSubscriptionIn schema:
    // { endpoint: string, device_name?: string, platform?: string }
    await api.notifications.subscribe(token, `Kiaanverse ${Platform.OS}`, Platform.OS);

    // Store token to avoid duplicate registrations
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to register push token:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// Local Notification Scheduling
// ---------------------------------------------------------------------------

/**
 * Check if we have permission to schedule notifications.
 * Used as a guard before any schedule call.
 */
async function hasPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Schedule the daily verse notification at the user's preferred time.
 * Cancels any existing daily verse notification before scheduling.
 *
 * @param hour - Hour in 24h format (0-23)
 * @param minute - Minute (0-59)
 * @returns Notification identifier, or null if scheduling failed
 */
export async function scheduleDailyVerse(
  hour: number,
  minute: number,
): Promise<string | null> {
  try {
    if (!(await hasPermission())) return null;

    // Cancel existing before rescheduling
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.DAILY_VERSE).catch(
      () => {},
    );

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.DAILY_VERSE,
      content: {
        title: 'Verse of the Day',
        body: 'Your daily wisdom from the Bhagavad Gita awaits. Begin your day with divine guidance.',
        data: { type: 'daily-verse' } satisfies NotificationData,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNELS.DAILY_VERSE }),
        ...(Platform.OS === 'ios' && { categoryIdentifier: CATEGORIES.DAILY_VERSE }),
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to schedule daily verse:', error);
    }
    return null;
  }
}

/**
 * Schedule a journey reminder notification.
 * Uses a deterministic identifier based on journeyId for easy cancellation.
 *
 * @param journeyId - The journey to remind about
 * @param hour - Hour in 24h format (0-23)
 * @param minute - Minute (0-59)
 * @returns Notification identifier, or null if scheduling failed
 */
export async function scheduleJourneyReminder(
  journeyId: string,
  hour: number,
  minute: number,
): Promise<string | null> {
  try {
    if (!(await hasPermission())) return null;

    const notificationId = NOTIFICATION_IDS.journeyReminder(journeyId);

    // Cancel existing before rescheduling
    await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: 'Journey Awaits',
        body: 'Time for your spiritual practice. Continue your journey toward inner peace.',
        data: { type: 'journey-reminder', journeyId } satisfies NotificationData,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNELS.JOURNEY_REMINDERS }),
        ...(Platform.OS === 'ios' && { categoryIdentifier: CATEGORIES.JOURNEY_REMINDER }),
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to schedule journey reminder:', error);
    }
    return null;
  }
}

/**
 * Schedule the streak alert notification for 8:00 PM daily.
 * Reminds users to complete their daily practice before the day ends.
 *
 * @returns Notification identifier, or null if scheduling failed
 */
export async function scheduleStreakAlert(): Promise<string | null> {
  try {
    if (!(await hasPermission())) return null;

    // Cancel existing before rescheduling
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.STREAK_ALERT).catch(
      () => {},
    );

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_IDS.STREAK_ALERT,
      content: {
        title: "Don't Break Your Streak!",
        body: "You haven't practiced today. A few minutes of reflection can make all the difference.",
        data: { type: 'streak-alert' } satisfies NotificationData,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNELS.STREAK_ALERTS }),
        ...(Platform.OS === 'ios' && { categoryIdentifier: CATEGORIES.STREAK_ALERT }),
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });

    return identifier;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to schedule streak alert:', error);
    }
    return null;
  }
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Silently ignore — notification may already be cancelled
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silently ignore
  }
}

/**
 * Reschedule all notifications based on current user preferences.
 * Cancels all existing scheduled notifications first, then re-creates
 * only the ones that are enabled in the preferences store.
 */
export async function rescheduleAll(): Promise<void> {
  try {
    const prefs = useUserPreferencesStore.getState().notifications;

    // Cancel all existing scheduled notifications
    await cancelAllNotifications();

    // Re-schedule based on preferences
    if (prefs.dailyReminder) {
      const [hourStr, minuteStr] = prefs.reminderTime.split(':');
      const hour = parseInt(hourStr ?? '8', 10);
      const minute = parseInt(minuteStr ?? '0', 10);
      await scheduleDailyVerse(hour, minute);
    }

    if (prefs.streakAlerts) {
      await scheduleStreakAlert();
    }

    // Journey reminders are scheduled individually when a journey is started,
    // using the same reminder time. They're not rescheduled here because
    // we'd need the list of active journey IDs from the server.
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to reschedule notifications:', error);
    }
  }
}

// ---------------------------------------------------------------------------
// Notification Response Handler (Deep Linking)
// ---------------------------------------------------------------------------

/**
 * Navigate to the appropriate screen based on notification data.
 * Used by both the response listener and initial notification handler.
 */
function navigateToNotification(router: AppRouter, data: NotificationData | undefined): void {
  if (!data?.type) return;

  try {
    switch (data.type) {
      case 'daily-verse':
        router.push('/(tabs)/shlokas');
        break;
      case 'journey-reminder':
        if (data.journeyId) {
          router.push(`/journey/${data.journeyId}` as `/journey/${string}`);
        } else {
          router.push('/journey' as '/journey');
        }
        break;
      case 'streak-alert':
        router.push('/(tabs)');
        break;
      case 'sakha-message':
        router.push('/(tabs)/chat');
        break;
      case 'milestone':
        if (data.journeyId) {
          router.push(`/journey/${data.journeyId}` as `/journey/${string}`);
        } else {
          router.push('/wellness/karma');
        }
        break;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Navigation from notification failed:', error);
    }
  }
}

/**
 * Set up the notification response listener for when users tap notifications.
 * Handles both default tap and iOS action button taps.
 *
 * @returns Subscription to remove on cleanup
 */
function setupResponseListener(router: AppRouter): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as NotificationData | undefined;

    // Dismiss-type actions — do nothing
    if (actionId === 'later' || actionId === 'snooze' || actionId === 'dismiss') {
      return;
    }

    // Default tap or foreground action — navigate
    navigateToNotification(router, data);
  });
}

/**
 * Check if the app was opened from a notification (cold start).
 * If so, navigate to the appropriate screen.
 */
async function handleInitialNotification(router: AppRouter): Promise<void> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      const data = response.notification.request.content.data as NotificationData | undefined;
      // Small delay to ensure navigation is ready after cold start
      setTimeout(() => navigateToNotification(router, data), 500);
    }
  } catch {
    // Silently ignore — app opened normally
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the complete notification system.
 * Call once after authentication from the root layout.
 *
 * Sets up:
 * 1. Android notification channels
 * 2. iOS notification categories
 * 3. Response listener (deep linking on notification tap)
 * 4. Initial notification handler (cold start deep link)
 * 5. Push token registration with backend
 * 6. Schedule all enabled notifications from preferences
 *
 * @param router - Expo Router instance for navigation
 * @returns Cleanup function to remove listeners
 */
export function initializeNotifications(router: AppRouter): () => void {
  // Platform-specific setup (async, fire-and-forget)
  void setupNotificationChannels();
  void setupNotificationCategories();

  // Response listener for notification taps
  const responseSub = setupResponseListener(router);

  // Check if app was opened from a notification
  void handleInitialNotification(router);

  // Register push token with backend (async, best-effort)
  void registerPushToken();

  // Schedule all enabled local notifications (async, best-effort)
  void rescheduleAll();

  // Return cleanup function
  return () => {
    responseSub.remove();
  };
}
