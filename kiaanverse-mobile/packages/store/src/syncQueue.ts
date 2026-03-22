/**
 * Sync Queue — offline mutation buffer with AsyncStorage persistence.
 *
 * Queues mutations (mood logs, journey completions, chat messages) when offline.
 * Processes the queue automatically when:
 *   - App returns to foreground (AppState change)
 *   - Connectivity is restored (called by the app's network listener)
 *
 * Conflict resolution:
 *   - Server wins for shared data (journey templates, verse content)
 *   - Local wins for user data (mood entries, journal reflections)
 *
 * The queue is persisted to AsyncStorage so pending mutations survive app restarts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import type { SyncQueueItem, SyncStatus } from '@kiaanverse/api';

// React Native/Expo global
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MutationType = SyncQueueItem['type'];

interface SyncQueueState {
  /** Ordered list of pending mutations */
  queue: SyncQueueItem[];
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Timestamp of last successful sync */
  lastSyncAt: string | null;
  /** Whether the queue processor is currently running */
  isProcessing: boolean;
}

type MutationExecutor = (item: SyncQueueItem) => Promise<void>;

interface SyncQueueActions {
  /** Add a mutation to the offline queue */
  enqueue: (type: MutationType, payload: Record<string, unknown>) => string;
  /** Remove a successfully synced item */
  dequeue: (id: string) => void;
  /** Process all queued mutations — call on reconnect and app foreground */
  processQueue: (executor: MutationExecutor) => Promise<void>;
  /** Mark an item as failed with error message */
  markFailed: (id: string, error: string) => void;
  /** Clear the entire queue (e.g. on logout) */
  clearQueue: () => void;
  /** Get count of pending items */
  pendingCount: () => number;
}

// ---------------------------------------------------------------------------
// ID Generator
// ---------------------------------------------------------------------------

let counter = 0;

function generateId(): string {
  counter += 1;
  return `sync_${Date.now()}_${counter}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;

export const useSyncQueueStore = create<SyncQueueState & SyncQueueActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        queue: [],
        syncStatus: 'synced' as SyncStatus,
        lastSyncAt: null,
        isProcessing: false,

        enqueue: (type, payload) => {
          const id = generateId();
          const item: SyncQueueItem = {
            id,
            type,
            payload,
            createdAt: new Date().toISOString(),
            retryCount: 0,
          };

          set((state) => {
            state.queue.push(item);
            state.syncStatus = 'pending';
          });

          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // eslint-disable-next-line no-console
            console.log(`[SyncQueue] Enqueued ${type}: ${id}`);
          }

          return id;
        },

        dequeue: (id) => {
          set((state) => {
            state.queue = state.queue.filter((item) => item.id !== id);
            if (state.queue.length === 0) {
              state.syncStatus = 'synced';
            }
          });
        },

        processQueue: async (executor) => {
          const { queue, isProcessing } = get();

          if (isProcessing || queue.length === 0) return;

          set((state) => {
            state.isProcessing = true;
            state.syncStatus = 'syncing';
          });

          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // eslint-disable-next-line no-console
            console.log(`[SyncQueue] Processing ${queue.length} items`);
          }

          // Process in order (FIFO) — oldest first
          const itemsToProcess = [...queue];
          let successCount = 0;

          for (const item of itemsToProcess) {
            try {
              await executor(item);
              get().dequeue(item.id);
              successCount += 1;
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              const newRetryCount = item.retryCount + 1;

              if (newRetryCount >= MAX_RETRIES) {
                // Drop permanently failed items
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                   
                  console.warn(`[SyncQueue] Dropping ${item.id} after ${MAX_RETRIES} retries: ${errorMessage}`);
                }
                get().dequeue(item.id);
              } else {
                get().markFailed(item.id, errorMessage);
              }
            }
          }

          const remaining = get().queue;
          set((state) => {
            state.isProcessing = false;
            state.syncStatus = remaining.length === 0 ? 'synced' : 'error';
            if (successCount > 0) {
              state.lastSyncAt = new Date().toISOString();
            }
          });

          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // eslint-disable-next-line no-console
            console.log(`[SyncQueue] Done: ${successCount} synced, ${remaining.length} remaining`);
          }
        },

        markFailed: (id, error) => {
          set((state) => {
            const item = state.queue.find((i) => i.id === id);
            if (item) {
              item.retryCount += 1;
              item.lastError = error;
            }
            state.syncStatus = 'error';
          });
        },

        clearQueue: () => {
          set((state) => {
            state.queue = [];
            state.syncStatus = 'synced';
            state.isProcessing = false;
          });
        },

        pendingCount: () => get().queue.length,
      })),
      {
        name: 'kiaanverse-sync-queue',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist the queue and lastSyncAt — not transient processing state
        partialize: (state) => ({
          queue: state.queue,
          lastSyncAt: state.lastSyncAt,
        }),
      },
    ),
    {
      name: 'SyncQueueStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);

// ---------------------------------------------------------------------------
// App Foreground Listener
// ---------------------------------------------------------------------------

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

/**
 * Start listening for app foreground events to trigger queue processing.
 * Call once from the root layout. Returns a cleanup function.
 */
export function startSyncOnForeground(executor: MutationExecutor): () => void {
  // Clean up any existing subscription
  appStateSubscription?.remove();

  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      void useSyncQueueStore.getState().processQueue(executor);
    }
  };

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}
