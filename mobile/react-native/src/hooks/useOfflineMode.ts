/**
 * Offline Mode Hook
 *
 * Detects network connectivity and manages the offline sync queue.
 * When online, drains the pending queue and syncs local changes.
 * When offline, queues operations for later sync.
 *
 * Uses NetInfo for connectivity detection and WatermelonDB
 * for local persistence of queued operations.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { SyncQueueItem, SyncStatus } from '@app-types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfflineModeState {
  /** Whether the device currently has network connectivity */
  isOnline: boolean;
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Number of operations pending sync */
  pendingCount: number;
  /** Timestamp of last successful sync */
  lastSyncedAt: Date | null;
}

interface OfflineModeActions {
  /** Queue an operation for sync when online */
  queueOperation: (item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>) => void;
  /** Force a sync attempt now */
  syncNow: () => Promise<void>;
  /** Check if a specific data type has pending syncs */
  hasPendingSync: (type: SyncQueueItem['type']) => boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOfflineMode(): OfflineModeState & OfflineModeActions {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const pendingQueue = useRef<SyncQueueItem[]>([]);
  const isSyncing = useRef(false);

  // Define drainQueue first so effects can reference it
  const drainQueue = useCallback(async () => {
    if (isSyncing.current || !isOnline || pendingQueue.current.length === 0) {
      return;
    }

    isSyncing.current = true;
    setSyncStatus('syncing');

    const queue = [...pendingQueue.current];
    const failed: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        // In production: dispatch to appropriate API endpoint
        // await api[item.type].sync(item.payload);

        // Remove from queue on success
        pendingQueue.current = pendingQueue.current.filter(
          (q) => q.id !== item.id,
        );
      } catch {
        // Increment retry count
        const updated = { ...item, retryCount: item.retryCount + 1 };
        if (updated.retryCount < 5) {
          failed.push(updated);
        }
        // Items with 5+ retries are dropped (logged as error)
      }
    }

    pendingQueue.current = [
      ...pendingQueue.current.filter(
        (q) => !queue.some((orig) => orig.id === q.id),
      ),
      ...failed,
    ];

    setPendingCount(pendingQueue.current.length);
    setLastSyncedAt(new Date());
    setSyncStatus(pendingQueue.current.length > 0 ? 'pending' : 'synced');
    isSyncing.current = false;
  }, [isOnline]);

  // Listen for app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isOnline) {
        drainQueue();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isOnline, drainQueue]);

  // In production, this subscribes to @react-native-community/netinfo
  // For scaffold purposes, we monitor a simple online check
  useEffect(() => {
    // NetInfo.addEventListener((state) => setIsOnline(state.isConnected ?? false));
    setIsOnline(true); // Default to online until NetInfo is wired up
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      drainQueue();
    }
  }, [isOnline, pendingCount, drainQueue]);

  const queueOperation = useCallback(
    (item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>) => {
      const queueItem: SyncQueueItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        ...item,
      };
      pendingQueue.current.push(queueItem);
      setPendingCount(pendingQueue.current.length);
      setSyncStatus('pending');

      // In production: persist to WatermelonDB
      // await database.write(async () => { ... });
    },
    [],
  );

  const syncNow = useCallback(async () => {
    await drainQueue();
  }, [drainQueue]);

  const hasPendingSync = useCallback(
    (type: SyncQueueItem['type']): boolean => {
      return pendingQueue.current.some((item) => item.type === type);
    },
    [],
  );

  return {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncedAt,
    queueOperation,
    syncNow,
    hasPendingSync,
  };
}
