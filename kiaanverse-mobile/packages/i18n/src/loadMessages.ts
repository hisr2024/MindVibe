/**
 * Message loading for i18n.
 *
 * In development, returns inline English translations.
 * In production, locale bundles are loaded from app assets or fetched from API.
 * Falls back to English on missing keys.
 */

import type { Locale, TranslationNamespace, TranslationMessages } from './types';

/** Inline English translations for development */
const englishMessages: Record<TranslationNamespace, TranslationMessages> = {
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try Again',
    cancel: 'Cancel',
    save: 'Save',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    search: 'Search',
    noResults: 'No results found',
    offline: 'You are offline',
  },
  auth: {
    login: 'Sign In',
    register: 'Create Account',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginError: 'Invalid email or password',
    signupError: 'Could not create account',
  },
  home: {
    greeting: 'Namaste',
    dailyVerse: 'Verse of the Day',
    moodCheckIn: 'How are you feeling?',
    activeJourney: 'Your Active Journey',
    noJourneys: 'Start a journey to begin your transformation',
    startJourney: 'Begin Journey',
  },
  kiaan: {
    placeholder: 'Ask Sakha anything...',
    thinking: 'Sakha is reflecting...',
    error: 'Sakha is unavailable right now',
    welcome: 'I am Sakha, your spiritual companion. How may I guide you today?',
  },
  navigation: {
    home: 'Home',
    sakha: 'Sakha',
    journey: 'Journey',
    gita: 'Gita',
    profile: 'Profile',
  },
  errors: {
    network: 'Network error. Please check your connection.',
    server: 'Server error. Please try again later.',
    notFound: 'Not found',
    unauthorized: 'Please sign in to continue',
    timeout: 'Request timed out. Please try again.',
  },
  dashboard: {
    title: 'Your Dashboard',
    streakLabel: 'Day Streak',
    journeysCompleted: 'Journeys Completed',
    versesRead: 'Verses Read',
  },
  features: {
    journeys: 'Spiritual Journeys',
    emotionalReset: 'Emotional Reset',
    journal: 'Sacred Journal',
    vibePlayer: 'Vibe Player',
  },
  divine: {
    blessing: 'May peace be with you',
    breathe: 'Take a moment to breathe',
  },
  journeys: {
    catalog: 'Journey Catalog',
    active: 'Active Journeys',
    completed: 'Completed',
    start: 'Start Journey',
    resume: 'Resume',
    pause: 'Pause',
    day: 'Day',
    progress: 'Progress',
    completeStep: 'Mark Complete',
  },
};

/** Cache for loaded locale bundles */
const messageCache = new Map<string, TranslationMessages>();

export async function loadMessages(
  locale: Locale,
  namespace: TranslationNamespace,
): Promise<TranslationMessages> {
  const cacheKey = `${locale}:${namespace}`;

  const cached = messageCache.get(cacheKey);
  if (cached) return cached;

  // For English, return inline messages directly
  if (locale === 'en') {
    const messages = englishMessages[namespace];
    messageCache.set(cacheKey, messages);
    return messages;
  }

  // For other locales, fall back to English (locale bundles loaded from assets in production)
  const fallback = englishMessages[namespace];
  messageCache.set(cacheKey, fallback);
  return fallback;
}

export function getDefaultMessages(namespace: TranslationNamespace): TranslationMessages {
  return englishMessages[namespace];
}
