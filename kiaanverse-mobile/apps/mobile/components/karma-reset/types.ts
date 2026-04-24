/**
 * Karma Reset — 6-Phase State Machine Types (Android/Expo port).
 *
 * Mirrors the web canonical spec at `app/(mobile)/m/karma-reset/types.ts`.
 * The 6 phases are: entry → context → reflection → wisdom → sankalpa → seal.
 */

export type KarmaResetPhase =
  | 'entry'
  | 'context'
  | 'reflection'
  | 'wisdom'
  | 'sankalpa'
  | 'seal';

export type KarmaCategory =
  | 'action'
  | 'speech'
  | 'thought'
  | 'reaction'
  | 'avoidance'
  | 'intention';

export type KarmaWeight = 'light' | 'moderate' | 'heavy' | 'very_heavy';

export type KarmaTimeframe = 'today' | 'recent' | 'ongoing' | 'past';

export interface KarmaCategoryConfig {
  readonly id: KarmaCategory;
  readonly label: string;
  readonly sanskrit: string;
  readonly description: string;
  /** Hex accent color (without alpha) */
  readonly color: string;
  /** rgba() background for the selected state */
  readonly bg: string;
}

export const KARMA_CATEGORIES: readonly KarmaCategoryConfig[] = [
  {
    id: 'action',
    label: 'Action',
    sanskrit: 'कर्म',
    description: 'Something I did',
    color: '#D97706',
    bg: 'rgba(120,53,15,0.15)',
  },
  {
    id: 'speech',
    label: 'Speech',
    sanskrit: 'वाक्',
    description: 'Something I said',
    color: '#2563EB',
    bg: 'rgba(30,64,175,0.15)',
  },
  {
    id: 'thought',
    label: 'Thought',
    sanskrit: 'मनस्',
    description: 'A mental pattern',
    color: '#7C3AED',
    bg: 'rgba(76,29,149,0.15)',
  },
  {
    id: 'reaction',
    label: 'Reaction',
    sanskrit: 'प्रतिक्रिया',
    description: 'How I responded',
    color: '#0E7490',
    bg: 'rgba(14,116,144,0.15)',
  },
  {
    id: 'avoidance',
    label: 'Avoidance',
    sanskrit: 'परिहार',
    description: "What I didn't do",
    color: '#B91C1C',
    bg: 'rgba(127,29,29,0.15)',
  },
  {
    id: 'intention',
    label: 'Intention',
    sanskrit: 'संकल्प',
    description: 'The why behind it',
    color: '#D4A017',
    bg: 'rgba(120,80,0,0.15)',
  },
] as const;

export interface KarmaWeightConfig {
  readonly id: KarmaWeight;
  readonly sanskrit: string;
  readonly label: string;
  readonly flameSize: number;
  readonly reflectionDepth: number;
}

export const KARMA_WEIGHTS: readonly KarmaWeightConfig[] = [
  {
    id: 'light',
    sanskrit: 'स्पर्श',
    label: 'A brush',
    flameSize: 20,
    reflectionDepth: 1,
  },
  {
    id: 'moderate',
    sanskrit: 'उपस्थित',
    label: 'Present',
    flameSize: 28,
    reflectionDepth: 2,
  },
  {
    id: 'heavy',
    sanskrit: 'प्रबल',
    label: 'Heavy',
    flameSize: 38,
    reflectionDepth: 3,
  },
  {
    id: 'very_heavy',
    sanskrit: 'अभिभूत',
    label: 'All-consuming',
    flameSize: 48,
    reflectionDepth: 4,
  },
] as const;

export interface KarmaResetContext {
  category: KarmaCategory;
  weight: KarmaWeight;
  description: string;
  whoInvolved?: 'self' | 'one_person' | 'group';
  timeframe: KarmaTimeframe;
}

export interface KarmaReflectionQuestion {
  question: string;
  subtext: string;
  options: string[];
}

export interface KarmaReflectionAnswer {
  questionIndex: number;
  question: string;
  answer: string;
}

export interface KarmaWisdomActionDharma {
  concept: string;
  meaning: string;
  practice: string;
  gitaRef: string;
}

export interface KarmaWisdomResponse {
  dharmicMirror: string;
  primaryShloka: {
    sanskrit: string;
    transliteration: string;
    english: string;
    chapter: number;
    verse: number;
    chapterName: string;
  };
  dharmicCounsel: string;
  karmicInsight: string;
  actionDharma: KarmaWisdomActionDharma[];
  affirmation: string;
}

export interface DharmicQualityConfig {
  readonly id: string;
  readonly sanskrit: string;
  readonly label: string;
  readonly color: string;
  readonly description: string;
}

export const DHARMIC_QUALITIES: readonly DharmicQualityConfig[] = [
  {
    id: 'ahimsa',
    sanskrit: 'अहिंसा',
    label: 'Non-Harm',
    color: '#065F46',
    description: 'Do no harm in thought, word, deed',
  },
  {
    id: 'satya',
    sanskrit: 'सत्य',
    label: 'Truth',
    color: '#1D4ED8',
    description: 'Speak and act with complete honesty',
  },
  {
    id: 'karuna',
    sanskrit: 'करुणा',
    label: 'Compassion',
    color: '#0E7490',
    description: "Meet others' pain with warmth",
  },
  {
    id: 'viveka',
    sanskrit: 'विवेक',
    label: 'Discernment',
    color: '#7C3AED',
    description: 'Choose wisdom over reaction',
  },
  {
    id: 'seva',
    sanskrit: 'सेवा',
    label: 'Service',
    color: '#D4A017',
    description: 'Give without expectation of return',
  },
  {
    id: 'vairagya',
    sanskrit: 'वैराग्य',
    label: 'Detachment',
    color: '#B91C1C',
    description: 'Act without clinging to outcome',
  },
] as const;

export interface SankalpaSeal {
  dharmicFocus: string;
  intentionText: string;
  sealed: boolean;
  sealedAt?: Date;
}

export interface KarmaResetSession {
  sessionId: string;
  phase: KarmaResetPhase;
  context: KarmaResetContext;
  reflections: KarmaReflectionAnswer[];
  wisdom: KarmaWisdomResponse | null;
  sankalpa: SankalpaSeal | null;
  xpAwarded: number;
  streakCount: number;
  startedAt: Date;
  completedAt?: Date;
}

/** Category color lookup */
export const CATEGORY_COLORS: Record<KarmaCategory, string> = {
  action: '#D97706',
  speech: '#2563EB',
  thought: '#7C3AED',
  reaction: '#0E7490',
  avoidance: '#B91C1C',
  intention: '#D4A017',
};

/** Hex to "r,g,b" triplet for inline rgba() composition */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export interface KarmaCompleteResponse {
  success: boolean;
  xpAwarded: number;
  streakCount: number;
  message: string;
}
