/**
 * Sakha Verse Library — client-side catalog of anchor Bhagavad Gita verses.
 *
 * Companion to native/android/voice/sakha/SakhaVerseReader.kt (the pure
 * recitation planner) and SakhaVoiceModule.readVerse (the RN bridge).
 * This file is the JS-side data layer + ergonomic wrapper:
 *
 *   import { recite } from '@sakha/lib/sakha-verse-library';
 *   await recite({ chapter: 2, verse: 47 });          // SA → HI → EN
 *   await recite({ chapter: 2, verse: 47, order: 'sa-only' });
 *   await recite({ chapter: 9, verse: 22, order: ['en','sa','hi'] });
 *
 * Curation rationale:
 * The Sakha persona's wisdom-grounded responses (engine = GUIDANCE)
 * draw from a small set of anchor verses repeatedly — see
 * prompts/sakha.voice.openai.md. This catalog is exactly those anchors,
 * pre-bundled in the .aab so the user can ask "Sakha, recite Gita 2.47"
 * with no network round-trip. The full Gita corpus stays on the backend
 * (GITA_LIBRARY tool route) for verses outside this set.
 *
 * Sanskrit text: canonical (public domain, Mahabharata Critical Edition).
 * English/Hindi: plain prose paraphrases of the meaning — NOT verbatim
 * copies of any specific copyrighted translation. Suitable for guided
 * reflection, not scholarly reference.
 *
 * SAKHA_LANGUAGE / SAKHA_VERSE_RECITATION shape:
 * Mirrors native/shared/SakhaVoiceInterface.ts. Mirrored locally rather
 * than imported across the workspace boundary — same convention the
 * adjacent wss-types.ts uses for backend frame mirrors.
 */

import { NativeModules } from 'react-native';

// ─── Type mirror (single source of truth: native/shared/SakhaVoiceInterface.ts)

/** Subset of SakhaLanguage actually used by the verse library today.
 *  Keep aligned with native/shared/SakhaVoiceInterface.ts SakhaLanguage. */
export type SakhaLanguage =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'ta'
  | 'te'
  | 'bn'
  | 'mr'
  | 'sa';

export interface SakhaVerseSegment {
  language: SakhaLanguage;
  text: string;
}

export interface SakhaVerseRecitation {
  chapter: number;
  verse: number;
  segments: SakhaVerseSegment[];
  betweenSegmentsPauseMs?: number;
}

interface SakhaVoiceNative {
  readVerse(recitation: SakhaVerseRecitation): Promise<void>;
}

const Native = NativeModules.SakhaVoice as SakhaVoiceNative | undefined;

// ─── Library entries ─────────────────────────────────────────────────────

export interface VerseLibraryEntry {
  chapter: number;
  verse: number;
  citation: string;
  texts: { sa: string; en: string; hi: string };
  /** Short hint for UI: which mood / theme this verse anchors. */
  theme: string;
}

/**
 * 10 anchor verses Sakha's GUIDANCE engine leans on. Sanskrit pulled
 * from the canonical Mahabharata text (public domain). English / Hindi
 * are plain-prose paraphrases — meant for spoken reflection, not for
 * academic citation. Add more verses as the persona's repertoire grows.
 */
export const VERSE_LIBRARY: readonly VerseLibraryEntry[] = [
  {
    chapter: 2, verse: 47,
    citation: 'BG 2.47',
    theme: 'right-to-action',
    texts: {
      sa: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      en: 'You have a right to your action alone, never to its fruits. Do not act for the fruit, and do not become attached to inaction.',
      hi: 'तुम्हारा अधिकार केवल कर्म पर है, फल पर कभी नहीं। फल की इच्छा से कर्म मत करो, और न ही कर्म से विरक्त हो जाओ।',
    },
  },
  {
    chapter: 2, verse: 48,
    citation: 'BG 2.48',
    theme: 'equanimity-as-yoga',
    texts: {
      sa: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
      en: 'Established in yoga, perform action with attachment let go. Be steady in success and failure alike — that steadiness is what yoga is.',
      hi: 'योग में स्थित होकर, आसक्ति त्यागकर कर्म करो। सिद्धि और असिद्धि में समान रहो — यही समत्व ही योग कहलाता है।',
    },
  },
  {
    chapter: 2, verse: 62,
    citation: 'BG 2.62',
    theme: 'chain-of-attachment',
    texts: {
      sa: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते। सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥',
      en: 'When a person dwells on objects of the senses, attachment to them is born. From attachment desire arises, and from desire, anger.',
      hi: 'जब कोई इन्द्रियों के विषयों का चिन्तन करता है, उनमें आसक्ति उत्पन्न होती है। आसक्ति से कामना जन्म लेती है, और कामना से क्रोध।',
    },
  },
  {
    chapter: 2, verse: 63,
    citation: 'BG 2.63',
    theme: 'anger-to-ruin',
    texts: {
      sa: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः। स्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥',
      en: 'Anger clouds the mind. A clouded mind loses memory. Lost memory destroys discernment, and when discernment is destroyed, the person is lost.',
      hi: 'क्रोध से मोह उत्पन्न होता है, मोह से स्मृति भ्रमित हो जाती है। स्मृति के नाश से बुद्धि का नाश होता है, और बुद्धि के नाश से व्यक्ति नष्ट हो जाता है।',
    },
  },
  {
    chapter: 6, verse: 5,
    citation: 'BG 6.5',
    theme: 'lift-yourself',
    texts: {
      sa: 'उद्धरेदात्मनाऽऽत्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
      en: 'Lift yourself by your own self. Do not let yourself fall. The self alone is the friend of the self, and the self alone is its enemy.',
      hi: 'अपने आप से अपने आप को ऊपर उठाओ, अपने आप को नीचे मत गिरने दो। आत्मा ही आत्मा का मित्र है, और आत्मा ही आत्मा का शत्रु है।',
    },
  },
  {
    chapter: 9, verse: 22,
    citation: 'BG 9.22',
    theme: 'yogakshemam-vahamyaham',
    texts: {
      sa: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',
      en: 'For those who think only of me and worship me with steady devotion — for them, ever-united with me, I bring what they lack and protect what they have.',
      hi: 'जो लोग अनन्य भाव से मेरा चिन्तन करते हुए मेरी उपासना करते हैं, उन सदा युक्त भक्तों का योगक्षेम मैं स्वयं वहन करता हूँ।',
    },
  },
  {
    chapter: 12, verse: 13,
    citation: 'BG 12.13',
    theme: 'qualities-of-devotee',
    texts: {
      sa: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च। निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
      en: 'One who hates no being, who is friendly and compassionate, free of possessiveness and ego, equal in pain and pleasure, and forgiving — that one is dear to me.',
      hi: 'जो किसी प्राणी से द्वेष नहीं करता, जो मैत्रीपूर्ण और करुणामय है, ममता और अहंकार से रहित, सुख-दुःख में समान और क्षमाशील — वह मुझे प्रिय है।',
    },
  },
  {
    chapter: 12, verse: 14,
    citation: 'BG 12.14',
    theme: 'steadfast-in-mind',
    texts: {
      sa: 'सन्तुष्टः सततं योगी यतात्मा दृढनिश्चयः। मय्यर्पितमनोबुद्धिर्यो मद्भक्तः स मे प्रियः॥',
      en: 'Always content, in self-control, of firm resolve, with mind and intellect dedicated to me — such a devotee is dear to me.',
      hi: 'जो सदा सन्तुष्ट है, संयमी है, दृढ़ निश्चय वाला है, और जिसका मन और बुद्धि मुझमें अर्पित हैं — ऐसा भक्त मुझे प्रिय है।',
    },
  },
  {
    chapter: 18, verse: 66,
    citation: 'BG 18.66',
    theme: 'sarva-dharman-parityajya',
    texts: {
      sa: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
      en: 'Let go of every other refuge and take refuge in me alone. I will free you from all that binds. Do not grieve.',
      hi: 'सब धर्मों को छोड़कर एकमात्र मेरी शरण में आओ। मैं तुम्हें सब पापों से मुक्त कर दूँगा, शोक मत करो।',
    },
  },
  {
    chapter: 18, verse: 78,
    citation: 'BG 18.78',
    theme: 'where-yoga-and-archer-meet',
    texts: {
      sa: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः। तत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मम मतिः॥',
      en: 'Where Krishna, the master of yoga, stands beside Arjuna, the bow-bearer, there is fortune, victory, prosperity, and unwavering right action — this is my conviction.',
      hi: 'जहाँ योगेश्वर कृष्ण हैं और जहाँ धनुर्धर अर्जुन है, वहाँ श्री, विजय, समृद्धि और निश्चल नीति है — यही मेरी मति है।',
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

/** Common recitation orders. Pass an array of [SakhaLanguage] for custom. */
export type ReciteOrder =
  | 'sa-hi-en'  // canonical Gita study order; the persona prefers this
  | 'sa-en'     // Sanskrit + English (most international users)
  | 'hi-en'     // Hindi + English (Indian diaspora bilingual)
  | 'sa-only'   // chanting / japa
  | 'en-only'   // first-time listeners who want meaning first
  | 'hi-only'   // Hindi-only audience
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
  /** Default 'sa-hi-en'. */
  order?: ReciteOrder;
  /** Default 700ms (matches the Kotlin default). */
  betweenSegmentsPauseMs?: number;
}

/**
 * Pure: build a recitation payload from the library. Useful for tests
 * and for callers that want to pass the recitation through their own
 * bridge invocation pipeline.
 */
export function buildRecitation(opts: ReciteOptions): SakhaVerseRecitation {
  const entry = getVerse(opts.chapter, opts.verse);
  if (!entry) {
    throw new Error(
      `sakha-verse-library: BG ${opts.chapter}.${opts.verse} is not in the catalog. ` +
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
        case 'en': return { language: 'en', text: entry.texts.en };
        case 'hi': return { language: 'hi', text: entry.texts.hi };
        // Languages we don't yet have curated text for — silently skip
        // rather than emit empty segments.
        default: return null;
      }
    })
    .filter((s): s is SakhaVerseSegment => s !== null);

  if (segments.length === 0) {
    throw new Error(
      `sakha-verse-library: order ${JSON.stringify(order)} produced no segments for BG ${opts.chapter}.${opts.verse}`,
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
 * Build the recitation from the library and dispatch it to the native
 * Sakha bridge. Resolves on dispatch — per-segment progress arrives via
 * the SakhaVoiceVerseSegmentRead / SakhaVoiceVerseReadComplete events
 * (subscribe via NativeEventEmitter on NativeModules.SakhaVoice).
 *
 * Throws synchronously if:
 *   - the verse is not in the catalog
 *   - the order produces no segments
 *   - the native module is not loaded (dev / unsupported platform)
 */
export async function recite(opts: ReciteOptions): Promise<void> {
  if (!Native) {
    throw new Error('sakha-verse-library: NativeModules.SakhaVoice is not loaded');
  }
  const recitation = buildRecitation(opts);
  await Native.readVerse(recitation);
}
