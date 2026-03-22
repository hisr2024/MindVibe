/**
 * Onboarding Store
 *
 * Multi-step onboarding flow state (5 steps):
 * 1. Welcome — meet Sakha
 * 2. Purpose — spiritual goals multi-select
 * 3. Gita Familiarity — slider 0-4
 * 4. Daily Practice — reminder time picker
 * 5. Ready — notification permission + launch
 *
 * Answers are persisted to Zustand and POSTed to /user/preferences on completion.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnboardingAnswers {
  locale?: string | undefined;
  /** Selected spiritual purposes from step 2 */
  purposes?: string[] | undefined;
  /** Gita familiarity level 0-4 (never read → scholar) */
  gitaFamiliarity?: number | undefined;
  /** Daily practice reminder time in HH:mm format */
  dailyPracticeTime?: string | undefined;
  /** Whether notifications are enabled */
  notificationsEnabled?: boolean | undefined;
  // Legacy field kept for backward compatibility
  interests?: string[] | undefined;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  answers: OnboardingAnswers;
  isComplete: boolean;
}

interface OnboardingActions {
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  complete: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
  answers: {},
  isComplete: false,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set, get) => ({
  ...initialState,

  setAnswer: (key, value) =>
    set({ answers: { ...get().answers, [key]: value } }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_STEPS - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      set({ currentStep: step });
    }
  },

  complete: () => set({ isComplete: true }),

  reset: () => set(initialState),
}));
