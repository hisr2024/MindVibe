/**
 * Emotional Reset Store — manages the 7-step sacred healing flow.
 *
 * Steps:
 * 1. emotion_select — Choose the emotion to process
 * 2. breathing — Guided breathing exercise
 * 3. visualization — Body scan / visualization
 * 4. wisdom — Gita verse and application
 * 5. affirmation — Sacred affirmation
 * 6. reflection — Journaling / reflection prompt
 * 7. summary — Summary and integration
 *
 * No persistence: session is transient, resets on app restart.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmotionalResetStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const STEP_NAMES: Record<EmotionalResetStep, string> = {
  1: 'emotion_select',
  2: 'breathing',
  3: 'visualization',
  4: 'wisdom',
  5: 'affirmation',
  6: 'reflection',
  7: 'summary',
};

interface BreathingPattern {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

interface StepResponse {
  step: EmotionalResetStep;
  data: Record<string, unknown>;
  completedAt: string;
}

/** Session object shape expected by screens */
interface SessionData {
  id: string;
  emotion: string;
  intensity: number;
  startedAt: number;
  steps: string[];
}

interface EmotionalResetState {
  /** Unique session identifier */
  sessionId: string | null;
  /** Current wizard step (1-7) */
  currentStep: EmotionalResetStep;
  /** Selected emotion to process */
  emotion: string | null;
  /** Emotion intensity (1-10 scale) */
  intensity: number;
  /** Breathing pattern configuration for step 2 */
  breathingPattern: BreathingPattern;
  /** Collected responses for each completed step */
  stepResponses: StepResponse[];
  /** Whether a session is currently in progress */
  isActive: boolean;
  /** ISO timestamp when the session was completed */
  completedAt: string | null;
  /** Session data for screen consumption */
  session: SessionData | null;
}

interface EmotionalResetActions {
  /** Begin a new emotional reset session */
  startSession: (sessionId: string) => void;
  /** Set the emotion being processed (step 1) */
  setEmotion: (emotion: string) => void;
  /** Set the emotion intensity (1-10) */
  setIntensity: (intensity: number) => void;
  /** Advance to the next step (max 7) */
  nextStep: () => void;
  /** Go back to the previous step (min 1) */
  prevStep: () => void;
  /** Record a response for the current or specified step */
  setStepResponse: (step: EmotionalResetStep, data: Record<string, unknown>) => void;
  /** Mark the session as complete */
  completeSession: () => void;
  /** Reset all state back to initial values */
  resetSession: () => void;
  /** Set the full session object (called after API start) */
  setSession: (session: SessionData) => void;
  /** Clear the session object (called on completion/exit) */
  clearSession: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: EmotionalResetState = {
  sessionId: null,
  currentStep: 1,
  emotion: null,
  intensity: 5,
  breathingPattern: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  stepResponses: [],
  isActive: false,
  completedAt: null,
  session: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEmotionalResetStore = create<EmotionalResetState & EmotionalResetActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      startSession: (sessionId: string) => {
        set((state) => {
          // Reset everything and begin fresh session
          Object.assign(state, { ...initialState });
          state.sessionId = sessionId;
          state.currentStep = 1;
          state.isActive = true;
        });
      },

      setEmotion: (emotion: string) => {
        set((state) => {
          state.emotion = emotion;
        });
      },

      setIntensity: (intensity: number) => {
        set((state) => {
          state.intensity = Math.max(1, Math.min(10, intensity));
        });
      },

      nextStep: () => {
        set((state) => {
          if (state.currentStep < 7) {
            state.currentStep = (state.currentStep + 1) as EmotionalResetStep;
          }
        });
      },

      prevStep: () => {
        set((state) => {
          if (state.currentStep > 1) {
            state.currentStep = (state.currentStep - 1) as EmotionalResetStep;
          }
        });
      },

      setStepResponse: (step: EmotionalResetStep, data: Record<string, unknown>) => {
        set((state) => {
          // Replace existing response for this step, or add new one
          const existingIndex = state.stepResponses.findIndex((r) => r.step === step);
          const response: StepResponse = {
            step,
            data,
            completedAt: new Date().toISOString(),
          };
          if (existingIndex !== -1) {
            state.stepResponses[existingIndex] = response;
          } else {
            state.stepResponses.push(response);
          }
        });
      },

      completeSession: () => {
        set((state) => {
          state.isActive = false;
          state.completedAt = new Date().toISOString();
        });
      },

      resetSession: () => {
        set(() => ({ ...initialState }));
      },

      setSession: (session: SessionData) => {
        set((state) => {
          state.session = session;
          state.sessionId = session.id;
          state.emotion = session.emotion;
          state.intensity = session.intensity;
          state.isActive = true;
        });
      },

      clearSession: () => {
        set((state) => {
          state.session = null;
          state.isActive = false;
          state.completedAt = new Date().toISOString();
        });
      },
    })),
    {
      name: 'EmotionalResetStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
