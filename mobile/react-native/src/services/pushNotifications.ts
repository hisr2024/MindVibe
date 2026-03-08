/**
 * Push Notification Service
 *
 * Firebase Cloud Messaging (FCM) integration for:
 * - Daily journey reminders
 * - KIAAN insights
 * - Weekly wellness summaries
 * - Community activity alerts
 *
 * Handles:
 * - Permission requests
 * - Token registration with backend
 * - Foreground/background message handling
 * - Notification channel setup (Android)
 */

import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { apiClient } from './apiClient';

// ---------------------------------------------------------------------------
// Permission Request
// ---------------------------------------------------------------------------

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.info('[Push] Notification permission granted');
  } else {
    console.warn('[Push] Notification permission denied');
  }

  return enabled;
}

// ---------------------------------------------------------------------------
// Token Registration
// ---------------------------------------------------------------------------

export async function registerPushToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();

    // Register token with backend for targeted notifications
    await apiClient.post('/api/notifications/subscribe', {
      token,
      platform: Platform.OS,
      device_type: 'mobile',
    });

    console.info('[Push] Token registered with backend');
    return token;
  } catch (error) {
    console.error('[Push] Token registration failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Message Handlers
// ---------------------------------------------------------------------------

/**
 * Handle foreground messages (app is open).
 * Shows an in-app alert rather than a system notification.
 */
export function setupForegroundHandler(): () => void {
  const unsubscribe = messaging().onMessage(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const { title, body } = remoteMessage.notification ?? {};

      if (title || body) {
        Alert.alert(title ?? 'MindVibe', body ?? '');
      }
    },
  );

  return unsubscribe;
}

/**
 * Handle notification open (user tapped notification).
 * Returns unsubscribe function.
 */
export function setupNotificationOpenHandler(
  onNavigate: (data: Record<string, string>) => void,
): () => void {
  const unsubscribe = messaging().onNotificationOpenedApp(
    (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const data = remoteMessage.data as Record<string, string> | undefined;
      if (data) {
        onNavigate(data);
      }
    },
  );

  return unsubscribe;
}

/**
 * Check if app was opened from a notification (cold start).
 */
export async function checkInitialNotification(
  onNavigate: (data: Record<string, string>) => void,
): Promise<void> {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage?.data) {
    onNavigate(remoteMessage.data as Record<string, string>);
  }
}

/**
 * Handle token refresh (FCM may rotate tokens).
 */
export function setupTokenRefreshHandler(): () => void {
  const unsubscribe = messaging().onTokenRefresh(async (token: string) => {
    try {
      await apiClient.post('/api/notifications/subscribe', {
        token,
        platform: Platform.OS,
        device_type: 'mobile',
      });
      console.info('[Push] Refreshed token registered');
    } catch (error) {
      console.error('[Push] Token refresh registration failed:', error);
    }
  });

  return unsubscribe;
}

// ---------------------------------------------------------------------------
// Background Handler (must be registered in index.js)
// ---------------------------------------------------------------------------

/**
 * Register background message handler.
 * Call this in your app's index.js before AppRegistry.registerComponent.
 *
 * Example:
 *   import { registerBackgroundHandler } from '@services/pushNotifications';
 *   registerBackgroundHandler();
 */
export function registerBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      // Process background messages (e.g., sync data, update badges)
      console.info('[Push] Background message:', remoteMessage.messageId);
    },
  );
}

// ---------------------------------------------------------------------------
// Initialize All Handlers
// ---------------------------------------------------------------------------

/**
 * One-call setup for push notifications.
 * Call after user is authenticated.
 */
export async function initializePushNotifications(
  onNavigate: (data: Record<string, string>) => void,
): Promise<() => void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return () => {};
  }

  await registerPushToken();

  const unsubForeground = setupForegroundHandler();
  const unsubOpen = setupNotificationOpenHandler(onNavigate);
  const unsubRefresh = setupTokenRefreshHandler();
  await checkInitialNotification(onNavigate);

  // Return cleanup function
  return () => {
    unsubForeground();
    unsubOpen();
    unsubRefresh();
  };
}
