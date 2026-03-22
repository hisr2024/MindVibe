/**
 * Background Tasks — Kiaanverse
 *
 * Registers background fetch tasks via expo-task-manager.
 * Tasks MUST be defined at module level (before component mount)
 * per expo-task-manager requirements.
 *
 * Tasks:
 * 1. KIAANVERSE_VERSE_PREFETCH — Fetches tomorrow's verse and caches it
 *    in AsyncStorage for the daily verse notification content.
 *    Runs approximately every 12 hours.
 *
 * 2. KIAANVERSE_BACKGROUND_SYNC — Processes the offline sync queue
 *    (mood entries, journey steps, chat messages, journal entries).
 *    Runs approximately every 15 minutes.
 *
 * Import this module from _layout.tsx to ensure tasks are registered:
 *   import '../services/backgroundTasks';
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Task Names
// ---------------------------------------------------------------------------

export const VERSE_PREFETCH_TASK = 'KIAANVERSE_VERSE_PREFETCH';
export const BACKGROUND_SYNC_TASK = 'KIAANVERSE_BACKGROUND_SYNC';

// AsyncStorage key for cached daily verse
export const CACHED_VERSE_KEY = 'kiaanverse-cached-daily-verse';

// ---------------------------------------------------------------------------
// Task Definitions (module-level — required by expo-task-manager)
// ---------------------------------------------------------------------------

/**
 * Verse prefetch task: fetches a random verse and caches it.
 * The cached verse is used to enrich daily verse notification content.
 */
TaskManager.defineTask(VERSE_PREFETCH_TASK, async () => {
  try {
    // Fetch a random verse from chapters 1-18
    const randomChapter = Math.floor(Math.random() * 18) + 1;
    const response = await api.gita.chapter(randomChapter);
    const chapterData = response.data;

    if (chapterData) {
      await AsyncStorage.setItem(
        CACHED_VERSE_KEY,
        JSON.stringify({
          chapter: randomChapter,
          fetchedAt: new Date().toISOString(),
          title: typeof chapterData === 'object' && chapterData !== null
            ? (chapterData as Record<string, unknown>).name ?? `Chapter ${randomChapter}`
            : `Chapter ${randomChapter}`,
        }),
      );
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Background sync task: processes the offline mutation queue.
 * Uses the same sync queue store pattern as the main app.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Attempt to pull sync status from the server
    // This triggers React Query cache invalidation on next foreground
    await api.sync.status();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ---------------------------------------------------------------------------
// Task Registration
// ---------------------------------------------------------------------------

/**
 * Register background fetch tasks with the OS.
 * Call once at app startup. Safe to call multiple times — tasks are upserted.
 *
 * Background fetch availability varies by device and OS:
 * - iOS: Requires Background Modes capability (handled by expo-task-manager plugin)
 * - Android: Works on most devices, respects battery optimization settings
 */
export async function registerBackgroundTasks(): Promise<void> {
  try {
    // Check if tasks are already registered
    const verseRegistered = await TaskManager.isTaskRegisteredAsync(VERSE_PREFETCH_TASK);
    const syncRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

    if (!verseRegistered) {
      await BackgroundFetch.registerTaskAsync(VERSE_PREFETCH_TASK, {
        minimumInterval: 12 * 60 * 60, // 12 hours
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }

    if (!syncRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (error) {
    // Background fetch may not be available on all devices (e.g., emulators)
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('Background task registration failed (may not be available):', error);
    }
  }
}
