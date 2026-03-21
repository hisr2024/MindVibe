/**
 * Onboarding Store
 *
 * Multi-step onboarding flow state.
 * Tracks current step, collected answers, and completion.
 */

import { create } from 'zustand';

interface OnboardingAnswers {
  locale?: string | undefined;
  interests?: string[] | undefined;
  notificationsEnabled?: boolean | undefined;
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
  complete: () => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 3,
  answers: {},
  isComplete: false,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set, get) => ({
  ...initialState,

  setAnswer: (key, value) =>
    set({ answers: { ...get().answers, [key]: value } }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  complete: () => set({ isComplete: true }),

  reset: () => set(initialState),
}));
