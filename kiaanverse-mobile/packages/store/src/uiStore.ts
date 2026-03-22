/**
 * UI Store — Zustand state for global UI concerns.
 *
 * Manages:
 * - First launch detection
 * - Onboarding completion flag
 * - Global modal system (one active modal at a time)
 * - Toast notification queue (FIFO)
 * - Theme preference (dark/light/system)
 *
 * Persistence: Only isFirstLaunch, onboardingCompleted, and theme survive
 * app restart. Modals and toasts are transient.
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

/** Supported modal types in the app */
export type ModalType =
  | 'celebration'
  | 'journey-complete'
  | 'karma-award'
  | 'verse-detail'
  | 'mood-insight'
  | 'settings'
  | 'confirmation';

/** A toast notification in the queue */
export interface Toast {
  /** Unique toast identifier */
  id: string;
  /** Display message */
  message: string;
  /** Visual severity */
  type: 'success' | 'error' | 'info' | 'warning';
  /** Auto-dismiss duration in ms (default: 3000) */
  duration?: number;
  /** Optional action button */
  action?: { label: string; onPress: string };
}

interface UiState {
  /** Whether this is the very first app launch */
  isFirstLaunch: boolean;
  /** Whether the user completed onboarding */
  onboardingCompleted: boolean;
  /** Currently displayed modal (null = no modal) */
  activeModal: ModalType | null;
  /** Optional data payload for the active modal */
  modalData: Record<string, unknown> | null;
  /** FIFO queue of toast notifications */
  toastQueue: Toast[];
  /** User's theme preference */
  theme: 'dark' | 'light' | 'system';
}

interface UiActions {
  /** Mark first launch complete */
  setFirstLaunch: (value: boolean) => void;
  /** Mark onboarding as completed */
  setOnboardingCompleted: (value: boolean) => void;
  /** Open a modal with optional data payload */
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  /** Close the currently active modal */
  closeModal: () => void;
  /** Add a toast to the queue (auto-generates ID) */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** Remove a specific toast by ID */
  removeToast: (id: string) => void;
  /** Clear all toasts */
  clearToasts: () => void;
  /** Set the theme preference */
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

// ---------------------------------------------------------------------------
// ID Generator
// ---------------------------------------------------------------------------

let toastCounter = 0;

function generateToastId(): string {
  toastCounter += 1;
  return `toast_${Date.now()}_${toastCounter}`;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: UiState = {
  isFirstLaunch: true,
  onboardingCompleted: false,
  activeModal: null,
  modalData: null,
  toastQueue: [],
  theme: 'dark',
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUiStore = create<UiState & UiActions>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setFirstLaunch: (value: boolean) => {
          set((state) => {
            state.isFirstLaunch = value;
          });
        },

        setOnboardingCompleted: (value: boolean) => {
          set((state) => {
            state.onboardingCompleted = value;
          });
        },

        openModal: (type: ModalType, data?: Record<string, unknown>) => {
          set((state) => {
            state.activeModal = type;
            state.modalData = data ?? null;
          });
        },

        closeModal: () => {
          set((state) => {
            state.activeModal = null;
            state.modalData = null;
          });
        },

        addToast: (toast: Omit<Toast, 'id'>) => {
          set((state) => {
            state.toastQueue.push({
              ...toast,
              id: generateToastId(),
            });
          });
        },

        removeToast: (id: string) => {
          set((state) => {
            state.toastQueue = state.toastQueue.filter((t) => t.id !== id);
          });
        },

        clearToasts: () => {
          set((state) => {
            state.toastQueue = [];
          });
        },

        setTheme: (theme: 'dark' | 'light' | 'system') => {
          set((state) => {
            state.theme = theme;
          });
        },
      })),
      {
        name: 'kiaanverse-ui',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist durable preferences — NOT transient modals/toasts
        partialize: (state) => ({
          isFirstLaunch: state.isFirstLaunch,
          onboardingCompleted: state.onboardingCompleted,
          theme: state.theme,
        }),
      },
    ),
    {
      name: 'UiStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
