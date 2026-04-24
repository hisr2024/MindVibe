/**
 * useNotifications — React hook for notification lifecycle management
 *
 * Integrates with the root layout to:
 * 1. Initialize notification system when user becomes authenticated
 * 2. Reschedule notifications when user preferences change
 * 3. Clean up listeners on unmount
 *
 * Usage in _layout.tsx:
 *   function AppContent() {
 *     useNotifications();
 *     // ... rest of app
 *   }
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore, useUserPreferencesStore } from '@kiaanverse/store';
import {
  initializeNotifications,
  rescheduleAll,
} from '../services/notificationService';

type NotificationPreferences = ReturnType<
  typeof useUserPreferencesStore.getState
>['notifications'];

/**
 * Hook that manages the notification system lifecycle.
 * Call once inside the authenticated app content component.
 */
export function useNotifications(): void {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const notifications = useUserPreferencesStore((s) => s.notifications);

  // Track previous preferences to detect changes (skip initial render)
  const prevPrefsRef = useRef<NotificationPreferences | null>(null);
  const initializedRef = useRef(false);

  // Initialize notifications when user becomes authenticated
  useEffect(() => {
    if (status !== 'authenticated') {
      initializedRef.current = false;
      return;
    }

    // Avoid double-initialization
    if (initializedRef.current) return;
    initializedRef.current = true;

    const cleanup = initializeNotifications(router);

    // Store current prefs as baseline for change detection
    prevPrefsRef.current = notifications;

    return () => {
      cleanup();
      initializedRef.current = false;
    };
    // Router is a stable ref; status drives re-init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Reschedule when preferences change (not on initial mount)
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!initializedRef.current) return;

    // Skip the initial effect — only react to actual changes
    if (prevPrefsRef.current === null) {
      prevPrefsRef.current = notifications;
      return;
    }

    // Shallow reference equality check — Zustand creates new refs on update
    if (prevPrefsRef.current === notifications) return;

    prevPrefsRef.current = notifications;
    void rescheduleAll();
  }, [notifications, status]);
}
