/**
 * Relationship Compass Store — manages relationship guidance sessions
 * and completed Sacred Compass readings (Sambandha Dharma flow).
 *
 * Handles:
 * - Legacy Q&A session history (question + guidance + verse reference)
 * - Sealed Compass readings — full 6-chamber flow output (relationship,
 *   gunas, dharma map, intention, etc.) for the user's reflection log
 * - Active question being composed
 * - Processing state while KIAAN generates guidance
 *
 * Persists: last 20 sessions + last 50 sealed readings for offline reference.
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

/** A sealed Sambandha-Dharma compass reading (Sacred Movement output). */
export interface SealedCompassReading {
  /** Unique reading identifier */
  id: string;
  /** Relationship type id (partner / parent / child / ...) */
  relationshipTypeId: string;
  /** Display label of the relationship type */
  relationshipTypeLabel: string;
  /** Optional partner / counterpart name */
  partnerName: string;
  /** Initial guna self-reading on the slider (tamas/rajas/sattva) */
  initialGunaReading: 'tamas' | 'rajas' | 'sattva' | 'balanced';
  /** Pattern ids selected per guna */
  selectedPatterns: {
    tamas: string[];
    rajas: string[];
    sattva: string[];
  };
  /** Computed guna scores (0-1 each) and dominant guna */
  gunaScores: {
    tamas: number;
    rajas: number;
    sattva: number;
    dominant: 'tamas' | 'rajas' | 'sattva' | 'balanced';
  };
  /** 8-axis dharma map values (0-1 each) */
  dharmaValues: Record<string, number>;
  /** Free-form situation text (sanitized, max 500 chars) */
  customQuery: string;
  /** Selected dharmic quality id, e.g. 'honesty' */
  selectedQualityId: string | null;
  /** Selected quality display label, e.g. 'Honesty' */
  selectedQualityLabel: string | null;
  /** Sankalpa intention text */
  intentionText: string;
  /** Gita-counsel response (markdown / sections) — optional when offline */
  gitaResponse: string | null;
  /** Number of Gita verses cited in the response */
  gitaVerses: number;
  /** ISO timestamp when the compass was sealed */
  sealedAt: string;
}

interface RelationshipState {
  /** History of relationship guidance sessions (newest first) */
  sessions: RelationshipSession[];
  /** History of sealed Sambandha-Dharma compass readings (newest first) */
  sealedReadings: SealedCompassReading[];
  /** The question currently being composed */
  activeQuestion: string;
  /** Whether KIAAN is processing a guidance request */
  isProcessing: boolean;
}

interface RelationshipActions {
  /** Add a completed session to the history (capped at 20) */
  addSession: (session: RelationshipSession) => void;
  /** Add a sealed compass reading to the log (capped at 50) */
  addSealedReading: (reading: SealedCompassReading) => void;
  /** Update the active question text */
  setActiveQuestion: (question: string) => void;
  /** Set the processing state */
  setProcessing: (processing: boolean) => void;
  /** Clear all session history */
  clearSessions: () => void;
  /** Clear all sealed compass readings */
  clearSealedReadings: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: RelationshipState = {
  sessions: [],
  sealedReadings: [],
  activeQuestion: '',
  isProcessing: false,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of sessions to persist */
const MAX_PERSISTED_SESSIONS = 20;

/** Maximum number of sealed compass readings to persist */
const MAX_PERSISTED_READINGS = 50;

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

        addSealedReading: (reading: SealedCompassReading) => {
          set((state) => {
            state.sealedReadings.unshift(reading);
            if (state.sealedReadings.length > MAX_PERSISTED_READINGS) {
              state.sealedReadings = state.sealedReadings.slice(
                0,
                MAX_PERSISTED_READINGS,
              );
            }
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
          set((state) => {
            state.sessions = [];
            state.activeQuestion = '';
            state.isProcessing = false;
          });
        },

        clearSealedReadings: () => {
          set((state) => {
            state.sealedReadings = [];
          });
        },
      })),
      {
        name: 'kiaanverse-relationship',
        storage: createJSONStorage(() => AsyncStorage),
        // Persist session history + sealed readings — NOT active question or processing state
        partialize: (state) => ({
          sessions: state.sessions.slice(0, MAX_PERSISTED_SESSIONS),
          sealedReadings: state.sealedReadings.slice(0, MAX_PERSISTED_READINGS),
        }),
      },
    ),
    {
      name: 'RelationshipStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
