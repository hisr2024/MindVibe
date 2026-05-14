/**
 * Sacred Reflections — shared domain constants.
 *
 * Mood / Category / Tag / Mirror definitions used by every tab of the
 * Sacred Reflections experience. Kept separate from screen components so
 * the same labels & Sanskrit glyphs appear in the Editor, Browse filter,
 * and KIAAN insight without drift.
 *
 * Every mood and category label below is plaintext metadata — it travels
 * with the encrypted journal body as a `tags[]` entry so KarmaLytix can
 * analyse patterns without ever seeing the reflection text.
 */

// ---------------------------------------------------------------------------
// Moods — Kiaanverse.com mobile parity (screenshots show 6 primary + 4
// secondary moods). Sanskrit is Devanagari; emoji mirrors web glyphs.
// ---------------------------------------------------------------------------

export interface MoodDef {
  readonly id: MoodId;
  readonly label: string;
  readonly sanskrit: string;
  readonly emoji: string;
  readonly color: string;
}

export type MoodId =
  | 'peaceful'
  | 'grateful'
  | 'seeking'
  | 'heavy'
  | 'radiant'
  | 'wounded'
  | 'hopeful'
  | 'anxious'
  | 'angry'
  | 'neutral';

export const MOODS: readonly MoodDef[] = [
  {
    id: 'peaceful',
    label: 'PEACEFUL',
    sanskrit: 'शान्त',
    emoji: '\u{1F30A}',
    color: '#3B82F6',
  },
  {
    id: 'grateful',
    label: 'GRATEFUL',
    sanskrit: 'कृतज्ञ',
    emoji: '\u{1F64F}',
    color: '#D4A017',
  },
  {
    id: 'seeking',
    label: 'SEEKING',
    sanskrit: 'जिज्ञासु',
    emoji: '\u{1F50D}',
    color: '#06B6D4',
  },
  {
    id: 'heavy',
    label: 'HEAVY',
    sanskrit: 'भारग्रस्त',
    emoji: '\u{1F327}',
    color: '#6B7280',
  },
  {
    id: 'radiant',
    label: 'RADIANT',
    sanskrit: 'तेजस्वी',
    emoji: '\u{2728}',
    color: '#F59E0B',
  },
  {
    id: 'wounded',
    label: 'WOUNDED',
    sanskrit: 'आहत',
    emoji: '\u{1F494}',
    color: '#EF4444',
  },
  {
    id: 'hopeful',
    label: 'HOPEFUL',
    sanskrit: 'आशान्वित',
    emoji: '\u{1F305}',
    color: '#10B981',
  },
  {
    id: 'anxious',
    label: 'ANXIOUS',
    sanskrit: 'चिंतित',
    emoji: '\u{1F630}',
    color: '#8B5CF6',
  },
  {
    id: 'angry',
    label: 'ANGRY',
    sanskrit: 'क्रोधित',
    emoji: '\u{1F525}',
    color: '#DC2626',
  },
  {
    id: 'neutral',
    label: 'NEUTRAL',
    sanskrit: 'सामान्य',
    emoji: '\u{2696}',
    color: 'rgba(240,235,225,0.5)',
  },
] as const;

export const MOOD_BY_ID: Record<MoodId, MoodDef> = MOODS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<MoodId, MoodDef>
);

// ---------------------------------------------------------------------------
// Dharmic tag chips (mirrors the 12 chips on Kiaanverse.com EDITOR screen).
// ---------------------------------------------------------------------------

export const SACRED_TAGS = [
  'gratitude',
  'reflection',
  'growth',
  'dharma',
  'shadow',
  'healing',
  'surrender',
  'clarity',
  'forgiveness',
  'courage',
  'grief',
  'joy',
] as const;

export type SacredTag = (typeof SACRED_TAGS)[number];

/** Hard cap on user-selected tags (mood is counted separately). */
export const MAX_USER_TAGS = 5;

// ---------------------------------------------------------------------------
// Sacred tab identifiers for the 4-tab pill bar.
// ---------------------------------------------------------------------------

export type SacredTab = 'editor' | 'browse' | 'kiaan' | 'calendar';

/** Each tab carries a stable `id` (used in app state) plus an i18n `labelKey`
 *  resolved via t() at render. `sanskrit` is brand-fixed Devanagari across all
 *  locales — kept literal in the constant. */
export const SACRED_TABS: readonly {
  readonly id: SacredTab;
  readonly labelKey: string;
  readonly sanskrit: string;
}[] = [
  { id: 'editor', labelKey: 'tabEditorLabel', sanskrit: 'लेख' },
  { id: 'browse', labelKey: 'tabBrowseLabel', sanskrit: 'पठन' },
  { id: 'kiaan', labelKey: 'tabKiaanLabel', sanskrit: 'बोध' },
  { id: 'calendar', labelKey: 'tabCalendarLabel', sanskrit: 'तिथि' },
];

// ---------------------------------------------------------------------------
// Browse filter chips (screenshot shows All / Peaceful / Grateful / Seeking
// / heart). We derive the first 4 from MOODS to stay single-source.
// ---------------------------------------------------------------------------

export const BROWSE_FILTER_IDS: readonly (MoodId | 'all')[] = [
  'all',
  'peaceful',
  'grateful',
  'seeking',
  'wounded',
];

// ---------------------------------------------------------------------------
// COPY — literal English fallback strings. Kept around so tab components
// that haven't been refactored to useTranslation yet (Editor/Browse/Kiaan/
// Calendar) keep rendering English without breakage. New code should call
// `t(COPY_KEYS.heading)` from the `sacred-reflections` i18n namespace.
// ---------------------------------------------------------------------------

export const COPY = {
  heading: 'Sacred Reflection',
  headingSanskrit: 'आत्म-चिंतन',
  moodPrompt: 'HOW DO YOU FEEL?',
  titlePlaceholder: 'Give this reflection a title...',
  bodyPlaceholder:
    'What stirs in you today? Let the words come without judgment...',
  encryptionNotice:
    'Encrypted end-to-end · Only mood and tags are visible to KIAAN',
  ctaOffer: 'Offer This Reflection',
  browseHeading: 'Your Reflections',
  browseSanskrit: 'आत्म-चिंतन',
  browseSearch: 'Search your reflections...',
  emptyLibraryTitle: 'Your sacred library awaits',
  emptyLibrarySub: 'Return to the Editor tab to begin.',
  kiaanEmptyTitle: 'Your sacred library awaits',
  kiaanEmptySub:
    "Journal for a few days — then return here for Sakha's weekly reflection.",
  calendarCurrent: 'CURRENT STREAK',
  calendarLongest: 'LONGEST STREAK',
} as const;

/** i18n key mirror of COPY. Components that have been refactored to use
 *  `useTranslation('sacred-reflections')` should resolve their copy via
 *  `t(COPY_KEYS.heading)` etc. Once every consumer is migrated, COPY itself
 *  can be deleted. */
export const COPY_KEYS = {
  heading: 'heading',
  headingSanskrit: 'headingSanskrit',
  moodPrompt: 'moodPrompt',
  titlePlaceholder: 'titlePlaceholder',
  bodyPlaceholder: 'bodyPlaceholder',
  encryptionNotice: 'encryptionNotice',
  ctaOffer: 'ctaOffer',
  browseHeading: 'browseHeading',
  browseSanskrit: 'browseSanskrit',
  browseSearch: 'browseSearch',
  emptyLibraryTitle: 'emptyLibraryTitle',
  emptyLibrarySub: 'emptyLibrarySub',
  kiaanEmptyTitle: 'kiaanEmptyTitle',
  kiaanEmptySub: 'kiaanEmptySub',
  calendarCurrent: 'calendarCurrent',
  calendarLongest: 'calendarLongest',
} as const;
