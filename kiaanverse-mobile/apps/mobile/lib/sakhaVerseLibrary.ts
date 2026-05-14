/**
 * Sakha Verse Library — client-side catalog of anchor Bhagavad Gita verses
 * for the KIAAN Voice Companion app (apps/mobile).
 *
 * Companion to kiaanverse-mobile/native/sakha-voice/android/src/main/java/
 * com/mindvibe/kiaan/voice/sakha/SakhaVerseReader.kt (the pure recitation
 * planner) and SakhaVoiceModule.readVerse (the RN bridge).
 *
 *   import { recite } from '../lib/sakhaVerseLibrary';
 *   await recite({ chapter: 2, verse: 47 });           // SA → HI → EN
 *   await recite({ chapter: 9, verse: 22, order: 'sa-only' });
 *   await recite({ chapter: 18, verse: 66, order: ['en','sa'] });
 *
 * Curation: 10 anchor verses Sakha's GUIDANCE engine leans on per
 * prompts/sakha.voice.openai.md. The full Gita corpus stays on the
 * backend (GITA_LIBRARY tool route) for verses outside this set.
 *
 * Sanskrit text: canonical (public domain).
 * English/Hindi: pending PD-baseline modernization (Phase 1A). Empty
 *   strings until the canonical corpus regenerates this file. Consumers
 *   that need en/hi for spoken playback should detect the empty state
 *   and fall back to the backend `/api/voice/synthesize` route, which
 *   in turn reads from the canonical 700-verse store.
 */

import { NativeModules } from 'react-native';

import type {
  SakhaLanguage,
  SakhaVerseRecitation,
  SakhaVerseSegment,
  SakhaVoiceNativeModule,
} from '../types/sakhaVoice';

const Native = NativeModules.SakhaVoice as SakhaVoiceNativeModule | undefined;

// ─── Library entries ─────────────────────────────────────────────────────

export interface VerseLibraryEntry {
  chapter: number;
  verse: number;
  citation: string;
  texts: { sa: string; en: string; hi: string };
  /** Short hint for UI: which mood / theme this verse anchors. */
  theme: string;
}

export const VERSE_LIBRARY: readonly VerseLibraryEntry[] = [
  {
    chapter: 2, verse: 47,
    citation: 'BG 2.47',
    theme: 'right-to-action',
    texts: {
      sa: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 2, verse: 48,
    citation: 'BG 2.48',
    theme: 'equanimity-as-yoga',
    texts: {
      sa: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 2, verse: 62,
    citation: 'BG 2.62',
    theme: 'chain-of-attachment',
    texts: {
      sa: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते। सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 2, verse: 63,
    citation: 'BG 2.63',
    theme: 'anger-to-ruin',
    texts: {
      sa: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः। स्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 6, verse: 5,
    citation: 'BG 6.5',
    theme: 'lift-yourself',
    texts: {
      sa: 'उद्धरेदात्मनाऽऽत्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 9, verse: 22,
    citation: 'BG 9.22',
    theme: 'yogakshemam-vahamyaham',
    texts: {
      sa: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 12, verse: 13,
    citation: 'BG 12.13',
    theme: 'qualities-of-devotee',
    texts: {
      sa: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च। निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 12, verse: 14,
    citation: 'BG 12.14',
    theme: 'steadfast-in-mind',
    texts: {
      sa: 'सन्तुष्टः सततं योगी यतात्मा दृढनिश्चयः। मय्यर्पितमनोबुद्धिर्यो मद्भक्तः स मे प्रियः॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 18, verse: 66,
    citation: 'BG 18.66',
    theme: 'sarva-dharman-parityajya',
    texts: {
      sa: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
      en: '',
      hi: '',
    },
  },
  {
    chapter: 18, verse: 78,
    citation: 'BG 18.78',
    theme: 'where-yoga-and-archer-meet',
    texts: {
      sa: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः। तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मम मतिः॥',
      en: '',
      hi: '',
    },
  },
] as const;

// ─── Lookup ──────────────────────────────────────────────────────────────

export function getVerse(chapter: number, verse: number): VerseLibraryEntry | null {
  return (
    VERSE_LIBRARY.find((v) => v.chapter === chapter && v.verse === verse) ?? null
  );
}

// ─── Recitation builder + driver ─────────────────────────────────────────

export type ReciteOrder =
  | 'sa-hi-en'  // canonical Gita study order; the persona prefers this
  | 'sa-en'
  | 'hi-en'
  | 'sa-only'   // chanting / japa
  | 'en-only'
  | 'hi-only'
  | SakhaLanguage[];

const ORDER_PRESETS: Record<Exclude<ReciteOrder, SakhaLanguage[]>, SakhaLanguage[]> = {
  'sa-hi-en': ['sa', 'hi', 'en'],
  'sa-en': ['sa', 'en'],
  'hi-en': ['hi', 'en'],
  'sa-only': ['sa'],
  'en-only': ['en'],
  'hi-only': ['hi'],
};

export interface ReciteOptions {
  chapter: number;
  verse: number;
  order?: ReciteOrder;
  betweenSegmentsPauseMs?: number;
}

export function buildRecitation(opts: ReciteOptions): SakhaVerseRecitation {
  const entry = getVerse(opts.chapter, opts.verse);
  if (!entry) {
    throw new Error(
      `sakhaVerseLibrary: BG ${opts.chapter}.${opts.verse} is not in the catalog. ` +
      `Add it to VERSE_LIBRARY or fetch from the backend GITA_LIBRARY route.`,
    );
  }
  const order = opts.order ?? 'sa-hi-en';
  const langs: SakhaLanguage[] = Array.isArray(order)
    ? order
    : ORDER_PRESETS[order];
  const segments: SakhaVerseSegment[] = langs
    .map((lang): SakhaVerseSegment | null => {
      switch (lang) {
        case 'sa': return { language: 'sa', text: entry.texts.sa };
        case 'en': return entry.texts.en ? { language: 'en', text: entry.texts.en } : null;
        case 'hi': return entry.texts.hi ? { language: 'hi', text: entry.texts.hi } : null;
        default: return null;
      }
    })
    .filter((s): s is SakhaVerseSegment => s !== null);

  if (segments.length === 0) {
    throw new Error(
      `sakhaVerseLibrary: order ${JSON.stringify(order)} produced no segments for BG ${opts.chapter}.${opts.verse}. ` +
        `(en/hi may be empty pending PD-baseline modernization — fall back to backend TTS.)`,
    );
  }
  return {
    chapter: opts.chapter,
    verse: opts.verse,
    segments,
    ...(opts.betweenSegmentsPauseMs !== undefined
      ? { betweenSegmentsPauseMs: opts.betweenSegmentsPauseMs }
      : {}),
  };
}

/**
 * True when the native SakhaVoice bridge is registered AND exposes
 * `readVerse`. Returns false in three real-world cases:
 *
 *   1. iOS / web — the module is Android-only.
 *   2. Expo Go — managed runtime cannot link prebuild-only native code.
 *   3. Android dev/staging APKs that haven't shipped the
 *      sakha-voice-native ReactPackage yet (current Play Store state).
 *
 * Callers should feature-detect first and fall back to the backend
 * /api/voice/synthesize TTS when this returns false instead of throwing
 * — sacred verses must never blow up the screen they're rendered on.
 */
export function isSakhaVoiceAvailable(): boolean {
  return !!Native && typeof Native.readVerse === 'function';
}

export async function recite(opts: ReciteOptions): Promise<void> {
  if (!isSakhaVoiceAvailable() || !Native) {
    // Fail soft so the caller can swap to the backend TTS fallback.
    const err = new Error(
      'sakhaVerseLibrary: SakhaVoice native bridge not available — ' +
        'use backend /api/voice/synthesize fallback',
    ) as Error & { code?: string };
    err.code = 'SAKHA_VOICE_UNAVAILABLE';
    throw err;
  }
  const recitation = buildRecitation(opts);
  await Native.readVerse(recitation);
}
