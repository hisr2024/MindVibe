/**
 * Wisdom Themes — curated Bhagavad Gita verse lists per mood/theme.
 *
 * Each of the six themes shown on the Wisdom landing screen now has a
 * hand-picked list of verses from the Gita that classical commentary
 * traditions cite for that mood. The picks favour verses with real
 * Sanskrit + translation in the local corpus (data/gita/chapters/*.json)
 * so the theme detail screen never lands on a "teaches wisdom on
 * <theme>" placeholder verse.
 *
 * When a verse is canonical for two themes (e.g. BG 2.47 is both Right
 * Action and Letting Go) we assign it to the closer canonical bucket
 * and let users discover the cross-reference via the chapter browser
 * or the Ask Sakha flow.
 *
 * Mapping is editorially controlled — extending a theme is a
 * one-line addition to the `THEME_VERSE_REFS` table below.
 */

import type { VerseRef } from '@kiaanverse/store';

/** The six themes exposed on the Wisdom landing tile grid. */
export type WisdomThemeId =
  | 'peace'
  | 'courage'
  | 'wisdom'
  | 'devotion'
  | 'action'
  | 'detachment';

export interface WisdomThemeMeta {
  readonly id: WisdomThemeId;
  /** i18n key for the theme label — matches the tile on the landing screen. */
  readonly labelKey: string;
  /** i18n key for a one-line description shown atop the detail screen. */
  readonly tagline: string;
  readonly emoji: string;
  readonly sanskrit: string;
}

/**
 * Display metadata for every theme. Kept inline so the landing tile and
 * the detail screen render from the same source of truth (no drift
 * between "Inner Peace" the tile and "Inner Peace" the detail header).
 */
export const WISDOM_THEME_META: Readonly<Record<WisdomThemeId, WisdomThemeMeta>> = {
  peace: {
    id: 'peace',
    labelKey: 'wisdom.themeInnerPeace',
    tagline: 'Verses on samatva — equanimity, the still mind, the unshaken Self.',
    emoji: '🕊️',
    sanskrit: 'शान्ति',
  },
  courage: {
    id: 'courage',
    labelKey: 'wisdom.themeCourage',
    tagline:
      'Verses on abhaya — fearlessness, rising to dharma when the stakes are real.',
    emoji: '🦁',
    sanskrit: 'अभय',
  },
  wisdom: {
    id: 'wisdom',
    labelKey: 'wisdom.themeWisdom',
    tagline:
      "Verses on jñāna — the Self that is never born, never dies, never wavers.",
    emoji: '🧘',
    sanskrit: 'ज्ञान',
  },
  devotion: {
    id: 'devotion',
    labelKey: 'wisdom.themeDevotion',
    tagline: "Verses on bhakti — love offered, surrender as the shortest path.",
    emoji: '🙏',
    sanskrit: 'भक्ति',
  },
  action: {
    id: 'action',
    labelKey: 'wisdom.themeRightAction',
    tagline:
      'Verses on karma yoga — duty without attachment, action as offering.',
    emoji: '⚡',
    sanskrit: 'कर्म',
  },
  detachment: {
    id: 'detachment',
    labelKey: 'wisdom.themeLettingGo',
    tagline:
      'Verses on vairāgya — releasing what was never ours, freedom from desire.',
    emoji: '🍃',
    sanskrit: 'वैराग्य',
  },
};

/**
 * Curated verse list per theme. Order is intentional — opens with the
 * most accessible verse for the theme, builds toward the deeper teaching.
 * Numbers are (chapter, verse) into the local Gita corpus.
 */
export const THEME_VERSE_REFS: Readonly<Record<WisdomThemeId, ReadonlyArray<VerseRef>>> = {
  peace: [
    { chapter: 2, verse: 56 }, // sthitaprajna — unshaken in pain or pleasure
    { chapter: 2, verse: 66 }, // no peace without a steady mind
    { chapter: 2, verse: 70 }, // like an ocean unchanged by rivers
    { chapter: 5, verse: 23 }, // one who endures desire and anger finds peace
    { chapter: 5, verse: 29 }, // friend of all beings attains peace
    { chapter: 6, verse: 7 }, // self-controlled is the same in heat and cold
    { chapter: 6, verse: 27 }, // supreme peace comes to the yogi
    { chapter: 18, verse: 53 }, // having given up egoism, anger, possession
  ],
  courage: [
    { chapter: 2, verse: 3 }, // yield not to unmanliness — Krishna's first rebuke
    { chapter: 2, verse: 31 }, // for a kshatriya, nothing higher than righteous war
    { chapter: 2, verse: 33 }, // refusing the battle is itself sin
    { chapter: 2, verse: 37 }, // slain you attain heaven, victorious the earth
    { chapter: 11, verse: 33 }, // therefore arise, win glory
    { chapter: 16, verse: 1 }, // divine qualities — fearlessness leads the list
    { chapter: 18, verse: 43 }, // heroism, vigor, fortitude — duties of a kshatriya
  ],
  wisdom: [
    { chapter: 2, verse: 13 }, // soul passes through bodies — the wise mourn not
    { chapter: 2, verse: 16 }, // the unreal has no being, the real never ceases
    { chapter: 2, verse: 20 }, // never born, never dies — the Self
    { chapter: 2, verse: 22 }, // as one casts off worn-out garments
    { chapter: 2, verse: 55 }, // definition of sthitaprajna
    { chapter: 4, verse: 38 }, // nothing in this world is so pure as knowledge
    { chapter: 13, verse: 27 }, // sees the same Lord present in all beings
    { chapter: 18, verse: 20 }, // sattvic knowledge — sees the one in the many
  ],
  devotion: [
    { chapter: 9, verse: 22 }, // to those constantly devoted I bring what they lack
    { chapter: 9, verse: 27 }, // whatever you do, do it as offering
    { chapter: 9, verse: 34 }, // fix your mind on Me, be My devotee
    { chapter: 12, verse: 6 }, // those who worship Me with single-minded devotion
    { chapter: 12, verse: 13 }, // who hates none, friend and compassionate
    { chapter: 12, verse: 14 }, // ever content, self-controlled, firm in resolve
    { chapter: 18, verse: 65 }, // fix your mind on Me, surrender to Me
    { chapter: 18, verse: 66 }, // abandon all dharmas, take refuge in Me alone
  ],
  action: [
    { chapter: 2, verse: 47 }, // right to action, not to its fruits
    { chapter: 2, verse: 48 }, // perform action in yoga — samatvam yoga uchyate
    { chapter: 3, verse: 8 }, // perform thy bounden duty
    { chapter: 3, verse: 19 }, // without attachment, do thy duty constantly
    { chapter: 3, verse: 35 }, // own dharma though imperfect, better than another's
    { chapter: 4, verse: 18 }, // sees inaction in action and action in inaction
    { chapter: 18, verse: 45 }, // devoted to one's own duty, one attains perfection
    { chapter: 18, verse: 48 }, // never abandon one's natural duty
  ],
  detachment: [
    { chapter: 2, verse: 14 }, // endure the touches of senses — they come and go
    { chapter: 2, verse: 62 }, // chain of attachment → desire → anger
    { chapter: 2, verse: 63 }, // from anger arises delusion, then ruin
    { chapter: 2, verse: 71 }, // abandons all desires, free from longing
    { chapter: 5, verse: 10 }, // one who acts without attachment, sin doesn't cling
    { chapter: 6, verse: 4 }, // has renounced attachment to sense-objects
    { chapter: 12, verse: 16 }, // unattached, pure, skilful, unconcerned
    { chapter: 18, verse: 49 }, // mind unattached everywhere, self-controlled, free
  ],
};

/** Resolve a theme id string from a route param — returns undefined for unknowns. */
export function asWisdomThemeId(value: string | undefined): WisdomThemeId | undefined {
  if (!value) return undefined;
  return (Object.keys(WISDOM_THEME_META) as readonly WisdomThemeId[]).find(
    (id) => id === value,
  );
}
