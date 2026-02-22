/**
 * MindVibe Conflict Resolution Service
 *
 * Handles data conflicts when syncing offline changes back to server.
 * Implements multiple conflict resolution strategies based on data type.
 *
 * Quantum Coherence Principle: When multiple quantum states collapse into one,
 * we must choose the most meaningful superposition - in data sync, we preserve
 * user intent while maintaining system integrity.
 */

export type ConflictStrategy = 'last-write-wins' | 'merge' | 'user-prompt' | 'keep-both';

export interface ConflictData<T = Record<string, unknown>> {
  localVersion: T;
  serverVersion: T;
  localTimestamp: Date;
  serverTimestamp: Date;
  entityType: string;
  entityId: string;
}

export interface ConflictResolution<T = Record<string, unknown>> {
  strategy: ConflictStrategy;
  resolvedData: T;
  requiresUserInput: boolean;
  metadata?: {
    mergedFields?: string[];
    discardedFields?: string[];
    reason?: string;
  };
}

/**
 * Main conflict resolver that determines strategy based on entity type
 */
export class ConflictResolver {
  /**
   * Resolve a conflict based on entity type and data characteristics
   */
  static resolve<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { entityType } = conflict;

    switch (entityType) {
      case 'mood':
        return this.resolveMoodConflict(conflict);

      case 'journal':
        return this.resolveJournalConflict(conflict);

      case 'journey_progress':
        return this.resolveJourneyProgressConflict(conflict);

      case 'user_preferences':
        return this.resolvePreferencesConflict(conflict);

      case 'verse_interaction':
        return this.resolveVerseInteractionConflict(conflict);

      default:
        // Default to last-write-wins for unknown types
        return this.resolveLastWriteWins(conflict);
    }
  }

  /**
   * Mood conflicts: Last-write-wins (user owns their mood data)
   */
  private static resolveMoodConflict<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { localTimestamp, serverTimestamp, localVersion, serverVersion } = conflict;

    // Use the most recent mood entry
    const useLocal = localTimestamp > serverTimestamp;

    return {
      strategy: 'last-write-wins',
      resolvedData: useLocal ? localVersion : serverVersion,
      requiresUserInput: false,
      metadata: {
        reason: `Using ${useLocal ? 'local' : 'server'} version based on timestamp`
      }
    };
  }

  /**
   * Journal conflicts: User prompt (both versions may be important)
   */
  private static resolveJournalConflict<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { localVersion, serverVersion, localTimestamp, serverTimestamp } = conflict;

    // Check if content is substantially different
    const localRecord = localVersion as Record<string, unknown>;
    const serverRecord = serverVersion as Record<string, unknown>;
    const localContent = (localRecord.encrypted_data as string) || (localRecord.content as string) || '';
    const serverContent = (serverRecord.encrypted_data as string) || (serverRecord.content as string) || '';

    // If content is identical, just update timestamp
    if (localContent === serverContent) {
      const useLocal = localTimestamp > serverTimestamp;
      return {
        strategy: 'last-write-wins',
        resolvedData: useLocal ? localVersion : serverVersion,
        requiresUserInput: false,
        metadata: {
          reason: 'Content identical, using most recent timestamp'
        }
      };
    }

    // Substantial difference - require user decision
    return {
      strategy: 'user-prompt',
      resolvedData: localVersion, // Default to local until user decides
      requiresUserInput: true,
      metadata: {
        reason: 'Journal entries differ substantially - user decision required'
      }
    };
  }

  /**
   * Journey progress conflicts: Merge strategy (sum progress)
   */
  private static resolveJourneyProgressConflict<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { localVersion, serverVersion } = conflict;

    const local = localVersion as Record<string, unknown>;
    const server = serverVersion as Record<string, unknown>;

    // Merge progress tracking fields
    const merged = {
      ...server,
      ...local,
      current_step: Math.max((local.current_step as number) || 0, (server.current_step as number) || 0),
      progress_percentage: Math.max((local.progress_percentage as number) || 0, (server.progress_percentage as number) || 0),
      completed_steps: this.mergeArrays((local.completed_steps as unknown[]) || [], (server.completed_steps as unknown[]) || []),
      time_spent_seconds: ((local.time_spent_seconds as number) || 0) + ((server.time_spent_seconds as number) || 0),
      updated_at: (local.updated_at as string) > (server.updated_at as string) ? local.updated_at : server.updated_at
    };

    return {
      strategy: 'merge',
      resolvedData: merged as unknown as T,
      requiresUserInput: false,
      metadata: {
        mergedFields: ['current_step', 'progress_percentage', 'completed_steps', 'time_spent_seconds'],
        reason: 'Progress metrics merged using max/sum strategies'
      }
    };
  }

  /**
   * User preferences conflicts: Last-write-wins with merge of nested objects
   */
  private static resolvePreferencesConflict<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { localVersion, serverVersion, localTimestamp: _localTimestamp, serverTimestamp: _serverTimestamp } = conflict;

    // Merge preferences, preferring local changes for conflicting keys
    const merged = this.deepMerge(serverVersion as Record<string, unknown>, localVersion as Record<string, unknown>);

    return {
      strategy: 'merge',
      resolvedData: merged as unknown as T,
      requiresUserInput: false,
      metadata: {
        reason: 'Preferences merged with local values taking precedence'
      }
    };
  }

  /**
   * Verse interaction conflicts: Merge strategy (aggregate interactions)
   */
  private static resolveVerseInteractionConflict<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { localVersion, serverVersion } = conflict;

    const local = localVersion as Record<string, unknown>;
    const server = serverVersion as Record<string, unknown>;

    // Merge interaction metrics
    const merged = {
      ...server,
      ...local,
      view_count: ((local.view_count as number) || 0) + ((server.view_count as number) || 0),
      favorite: local.favorite || server.favorite,
      notes: local.notes || server.notes || null,
      last_viewed_at: (local.last_viewed_at as string) > (server.last_viewed_at as string) ? local.last_viewed_at : server.last_viewed_at,
      time_spent_seconds: ((local.time_spent_seconds as number) || 0) + ((server.time_spent_seconds as number) || 0)
    };

    return {
      strategy: 'merge',
      resolvedData: merged as unknown as T,
      requiresUserInput: false,
      metadata: {
        mergedFields: ['view_count', 'time_spent_seconds'],
        reason: 'Interaction metrics aggregated from both sources'
      }
    };
  }

  /**
   * Default last-write-wins strategy
   */
  private static resolveLastWriteWins<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { localTimestamp, serverTimestamp, localVersion, serverVersion } = conflict;

    const useLocal = localTimestamp > serverTimestamp;

    return {
      strategy: 'last-write-wins',
      resolvedData: useLocal ? localVersion : serverVersion,
      requiresUserInput: false,
      metadata: {
        reason: `Using ${useLocal ? 'local' : 'server'} version based on timestamp (default strategy)`
      }
    };
  }

  /**
   * Helper: Merge two arrays, removing duplicates
   */
  private static mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
    const combined = [...arr1, ...arr2];
    // Remove duplicates (works for primitive values)
    return Array.from(new Set(combined.map(item => JSON.stringify(item))))
      .map(item => JSON.parse(item));
  }

  /**
   * Helper: Deep merge two objects (local takes precedence)
   */
  private static deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * Helper: Check if value is a plain object
   */
  private static isObject(item: unknown): item is Record<string, unknown> {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
  }
}

/**
 * Batch conflict resolver for handling multiple conflicts
 */
export class BatchConflictResolver {
  private conflicts: ConflictData[] = [];
  private resolutions: Map<string, ConflictResolution> = new Map();

  /**
   * Add a conflict to the batch
   */
  addConflict(conflict: ConflictData): void {
    this.conflicts.push(conflict);
  }

  /**
   * Resolve all conflicts in the batch
   */
  resolveAll(): Map<string, ConflictResolution> {
    this.resolutions.clear();

    for (const conflict of this.conflicts) {
      const resolution = ConflictResolver.resolve(conflict);
      this.resolutions.set(conflict.entityId, resolution);
    }

    return this.resolutions;
  }

  /**
   * Get conflicts that require user input
   */
  getUnresolvedConflicts(): ConflictData[] {
    return this.conflicts.filter((conflict) => {
      const resolution = this.resolutions.get(conflict.entityId);
      return resolution?.requiresUserInput === true;
    });
  }

  /**
   * Get all automatic resolutions (no user input needed)
   */
  getAutoResolutions(): Map<string, ConflictResolution> {
    const autoResolutions = new Map<string, ConflictResolution>();

    for (const [entityId, resolution] of this.resolutions.entries()) {
      if (!resolution.requiresUserInput) {
        autoResolutions.set(entityId, resolution);
      }
    }

    return autoResolutions;
  }

  /**
   * Clear all conflicts and resolutions
   */
  clear(): void {
    this.conflicts = [];
    this.resolutions.clear();
  }
}

/**
 * User-facing conflict dialog data
 */
export interface UserConflictPrompt {
  entityType: string;
  entityId: string;
  question: string;
  localOption: {
    label: string;
    preview: string;
    timestamp: Date;
  };
  serverOption: {
    label: string;
    preview: string;
    timestamp: Date;
  };
  keepBothOption?: {
    label: string;
    description: string;
  };
}

/**
 * Generate user-friendly conflict prompts for UI display
 */
export function generateUserPrompt(conflict: ConflictData): UserConflictPrompt {
  const { entityType, localVersion, serverVersion, localTimestamp, serverTimestamp } = conflict;

  switch (entityType) {
    case 'journal':
      return {
        entityType,
        entityId: conflict.entityId,
        question: 'You edited this journal entry offline, but it was also changed on another device. Which version would you like to keep?',
        localOption: {
          label: 'My offline changes',
          preview: ((localVersion as Record<string, unknown>).content as string)?.substring(0, 100) + '...',
          timestamp: localTimestamp
        },
        serverOption: {
          label: 'Changes from other device',
          preview: ((serverVersion as Record<string, unknown>).content as string)?.substring(0, 100) + '...',
          timestamp: serverTimestamp
        },
        keepBothOption: {
          label: 'Keep both as separate entries',
          description: 'Create two journal entries to preserve both versions'
        }
      };

    default:
      return {
        entityType,
        entityId: conflict.entityId,
        question: 'This data was changed offline and online. Which version would you like to keep?',
        localOption: {
          label: 'Offline version',
          preview: JSON.stringify(localVersion).substring(0, 100),
          timestamp: localTimestamp
        },
        serverOption: {
          label: 'Online version',
          preview: JSON.stringify(serverVersion).substring(0, 100),
          timestamp: serverTimestamp
        }
      };
  }
}
