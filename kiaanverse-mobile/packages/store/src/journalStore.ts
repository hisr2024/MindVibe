/**
 * Journal Store — manages the Sacred Journal.
 *
 * Handles:
 * - Cached entry list for offline display (persisted)
 * - Draft entry state for new/edit flow (transient)
 * - Edit mode tracking
 *
 * Only the entries cache is persisted via AsyncStorage.
 * Draft state is transient — lost on app restart.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JournalEntry {
  id: string;
  title: string;
  contentPreview: string;
  tags: string[];
  moodTag: string | null;
  createdAt: string;
  isEncrypted: boolean;
}

interface JournalDraft {
  title: string;
  content: string;
  tags: string[];
  moodTag: string | null;
}

interface JournalState {
  /** Cached journal entries for offline display */
  entries: JournalEntry[];
  /** Current draft being composed */
  currentDraft: JournalDraft;
  /** Whether the user is editing an existing entry */
  isEditing: boolean;
  /** ID of the entry being edited (null if creating new) */
  editingEntryId: string | null;
}

interface JournalActions {
  /** Replace the entire entries list (e.g. after fetch) */
  setEntries: (entries: JournalEntry[]) => void;
  /** Add a new entry to the top of the list */
  addEntry: (entry: JournalEntry) => void;
  /** Remove an entry by ID (soft delete in UI cache) */
  removeEntry: (id: string) => void;
  /** Update the current draft fields */
  setDraft: (draft: Partial<JournalDraft>) => void;
  /** Clear the draft back to empty state */
  clearDraft: () => void;
  /** Begin editing an existing entry */
  startEditing: (entryId: string) => void;
  /** Stop editing and clear draft */
  stopEditing: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const emptyDraft: JournalDraft = {
  title: '',
  content: '',
  tags: [],
  moodTag: null,
};

const initialState: JournalState = {
  entries: [],
  currentDraft: { ...emptyDraft },
  isEditing: false,
  editingEntryId: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useJournalStore = create<JournalState & JournalActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setEntries: (entries: JournalEntry[]) => {
          set((state) => {
            state.entries = entries;
          });
        },

        addEntry: (entry: JournalEntry) => {
          set((state) => {
            state.entries.unshift(entry);
            // Cap cached entries at 200 to limit storage usage
            if (state.entries.length > 200) {
              state.entries = state.entries.slice(0, 200);
            }
          });
        },

        removeEntry: (id: string) => {
          set((state) => {
            state.entries = state.entries.filter((e) => e.id !== id);
          });
        },

        setDraft: (draft: Partial<JournalDraft>) => {
          set((state) => {
            Object.assign(state.currentDraft, draft);
          });
        },

        clearDraft: () => {
          set((state) => {
            state.currentDraft = { ...emptyDraft };
            state.isEditing = false;
            state.editingEntryId = null;
          });
        },

        startEditing: (entryId: string) => {
          set((state) => {
            state.isEditing = true;
            state.editingEntryId = entryId;
            // Pre-populate draft from cached entry if available
            const entry = state.entries.find((e) => e.id === entryId);
            if (entry) {
              state.currentDraft.title = entry.title;
              state.currentDraft.tags = [...entry.tags];
              state.currentDraft.moodTag = entry.moodTag;
              // contentPreview is truncated — full content loaded from backend
            }
          });
        },

        stopEditing: () => {
          set((state) => {
            state.currentDraft = { ...emptyDraft };
            state.isEditing = false;
            state.editingEntryId = null;
          });
        },
      })),
      {
        name: 'kiaanverse-journal',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist entries cache — draft is transient
        partialize: (state) => ({
          entries: state.entries,
        }),
      },
    ),
    {
      name: 'JournalStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
