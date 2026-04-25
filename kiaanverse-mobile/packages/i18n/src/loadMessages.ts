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
    chat: 'Sakha',
    // The middle tab is now "Sacred Tools" — a hub that contains the
    // Bhagavad Gita, every wellness/wisdom instrument, Wisdom Rooms,
    // Sacred Reflections, Journeys, and the KIAAN Vibe Player. The
    // route file is still `shlokas/` so deep links of the form
    // `/shlokas/[chapter]/[verse]` keep resolving to the Gita verse view.
    shlokas: 'Sacred Tools',
    journeys: 'Journeys',
    journal: 'Journal',
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
  tools: {},
  'emotional-reset': {},
  'karma-reset': {},
  journal: {
    hubTitle: 'Sacred Reflections',
    sacredJournal: 'Sacred Journal',
    journeys: 'Journeys',
    newEntry: 'New Reflection',
    reflection: 'Reflection',
    emptyTitle: 'Your sacred reflections await.',
    emptySub: 'Begin your first entry. Every reflection is AES-256 encrypted on your device.',
    karmalytixNote:
      '🔒 Your reflections power KarmaLytix — private insights, never shared.',
    searchPlaceholder: 'Search reflections...',
    loading: 'Gathering your reflections...',
    edit: 'Edit',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteTitle: 'Delete Reflection',
    deleteMessage: 'This reflection will be archived. You can recover it later.',
    deleteErrorTitle: 'Could Not Delete',
    deleteErrorMessage: 'Please try again in a moment.',

    // New-entry composer
    newEntryTitle: 'Sacred Reflection',
    privacyNote: '🔒 Your words are encrypted on this device · Never read by Kiaanverse',
    moodSectionLabel: 'How is your inner state right now?',
    categorySectionLabel: 'This reflection is a…',
    tagsSectionLabel: 'Themes present today',
    reflectionSectionLabel: 'Your sacred reflection',
    encryptedLabel: '🔒 Encrypted on this device',
    bodyPlaceholder: 'Begin your sacred reflection… Write freely. This space is yours alone.',
    sealReflection: 'Seal this Reflection',
    emptyBodyTitle: 'Sacred space awaits',
    emptyBodyMessage: 'Please write your reflection before saving.',
    missingMoodTitle: 'How are you feeling?',
    missingMoodMessage: 'Please select your current mood.',
    saveErrorTitle: 'Could Not Save',
    saveErrorMessage: 'Your reflection could not be saved right now. Please try again.',

    // Weekly assessment
    assessmentTitle: '🌀 Weekly Sacred Assessment',
    assessmentSub:
      'These answers are plaintext and power your KarmaLytix analysis. They are NOT encrypted — choose your words accordingly.',
    q1Label: 'What was your greatest dharmic challenge this week?',
    q2Label: 'Which Gita teaching felt most alive this week?',
    q3Label: 'How consistent was your practice? (1–5)',
    q4Label: 'What pattern are you noticing in yourself?',
    q5Label: 'What sankalpa do you carry into next week?',
  },
  sadhana: {},
  community: {},
  'vibe-player': {},
  analytics: {
    title: 'KarmaLytix',
    privacyNote: '🔒 Analyzed from metadata only · Your content is never read',
    viewOverview: 'Overview',
    viewDimensions: 'Dimensions',
    viewReflection: 'Sacred Mirror',
    loading: 'Reading your karma patterns…',
    emptyTitle: 'Your Sacred Mirror Awaits',
    emptySubReady:
      'Let KIAAN illuminate your karmic patterns from this week’s metadata.',
    emptySubNeedMore:
      'Write a few more reflections this week, then return here for your sacred mirror.',
    emptyNote:
      'Your journal content is never read. KarmaLytix works only from mood labels, tags, and the weekly assessment you complete.',
    writeReflection: 'Write a Reflection',
    dharmicAlignment: 'Dharmic Alignment · This Week',
    outOf100: '/ 100',
    dimensionsHeading: 'Karma Dimensions',
    thisWeeksPractice: "This Week's Sacred Practice",
    statEntries: 'Entries',
    statDays: 'Days',
    statVerses: 'Verses',
    topThemes: 'Top themes:',
    kiaanReflection: "KIAAN's Sacred Reflection",
    channelledThrough: 'Channelled through Bhagavad Gita wisdom',
    dynamicWisdom: 'Dynamic Wisdom',
    dynamicWisdomPending:
      'Fresh wisdom for this week’s theme will appear here when the KarmaLytix engine finishes its weekly run.',
    dynamicWisdomFirstWeek:
      'Your first week of reflections is being seeded. The dynamic wisdom will arrive once enough metadata has accrued.',
    dynamicNote: 'Generated fresh each week by KIAAN · Grounded in Gita philosophy',
    refreshMirror: 'Refresh Sacred Mirror',
    viewJourneyInsights: 'View Journey Insights',
  },
  settings: {},
};

// Now-exhaustive Record<TranslationNamespace, ...>: loadMessages'
// `englishMessages[namespace]` lookups in this file expect TranslationMessages
// (not possibly undefined), so these empty objects satisfy the type without
// shipping English copy for feature-area translations that are loaded from
// locale bundles in production.

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
