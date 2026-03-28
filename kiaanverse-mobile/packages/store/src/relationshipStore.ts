/**
 * Relationship Compass Store — manages relationship guidance sessions.
 *
 * Handles:
 * - Session history (question + guidance + verse reference)
 * - Active question being composed
 * - Processing state while KIAAN generates guidance
 *
 * Persists: last 20 sessions for offline reference.
 * Transient: activeQuestion, isProcessing.
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

interface RelationshipSession {
  /** Unique session identifier */
  id: string;
  /** The user's relationship question */
  question: string;
  /** KIAAN's guidance response */
  guidance: string;
  /** Bhagavad Gita verse reference (e.g. "2.47") */
  verseRef: string | null;
  /** ISO timestamp when the session was created */
  createdAt: string;
}

interface RelationshipState {
  /** History of relationship guidance sessions (newest first) */
  sessions: RelationshipSession[];
  /** The question currently being composed */
  activeQuestion: string;
  /** Whether KIAAN is processing a guidance request */
  isProcessing: boolean;
}

interface RelationshipActions {
  /** Add a completed session to the history (capped at 20) */
  addSession: (session: RelationshipSession) => void;
  /** Update the active question text */
  setActiveQuestion: (question: string) => void;
  /** Set the processing state */
  setProcessing: (processing: boolean) => void;
  /** Clear all session history */
  clearSessions: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: RelationshipState = {
  sessions: [],
  activeQuestion: '',
  isProcessing: false,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of sessions to persist */
const MAX_PERSISTED_SESSIONS = 20;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRelationshipStore = create<RelationshipState & RelationshipActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        addSession: (session: RelationshipSession) => {
          set((state) => {
            state.sessions.unshift(session);
            // Cap at MAX_PERSISTED_SESSIONS to limit storage usage
            if (state.sessions.length > MAX_PERSISTED_SESSIONS) {
              state.sessions = state.sessions.slice(0, MAX_PERSISTED_SESSIONS);
            }
            // Clear the active question after submitting
            state.activeQuestion = '';
            state.isProcessing = false;
          });
        },

        setActiveQuestion: (question: string) => {
          set((state) => {
            state.activeQuestion = question;
          });
        },

        setProcessing: (processing: boolean) => {
          set((state) => {
            state.isProcessing = processing;
          });
        },

        clearSessions: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'kiaanverse-relationship',
        storage: createJSONStorage(() => AsyncStorage),
        // Persist session history — NOT active question or processing state
        partialize: (state) => ({
          sessions: state.sessions.slice(0, MAX_PERSISTED_SESSIONS),
        }),
      },
    ),
    {
      name: 'RelationshipStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
