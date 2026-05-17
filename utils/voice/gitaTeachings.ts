/**
 * Gita Teachings — chapter metadata + original commentary scaffold.
 *
 * Pending PD-baseline translation rebuild, the per-verse `translation` and
 * `practicalWisdom` fields have been cleared. Chapter-level commentary
 * (coreTheme, friendlySummary, lifeMoments, conversationalResponses) is
 * the team's original wellness writing and remains in place.
 *
 * The full populated catalog returns when the canonical PD-baseline
 * corpus regenerates downstream files (see
 * internal IP-drafts/_telang_baseline/regenerate_downstream.py).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
  /** How a wise friend would explain this */
  practicalWisdom: string
  /** Life situations where this verse helps */
  applicablesituations: string[]
  /** Emotions this verse addresses */
  emotions: string[]
  /** Keywords for search/detection */
  keywords: string[]
}

export interface ChapterTeaching {
  chapter: number
  title: string
  sanskritTitle: string
  /** Core theme in one phrase */
  coreTheme: string
  /** Friend-style summary of this chapter's teaching */
  friendlySummary: string
  /** When in life this chapter's teachings are most needed */
  lifeMoments: string[]
  /** Key verses from this chapter */
  verses: GitaVerse[]
  /** Conversational responses based on this chapter's teaching */
  conversationalResponses: string[]
}

// ─── All 18 Chapters — original commentary scaffold; verses cleared ────────

export const GITA_CHAPTERS: ChapterTeaching[] = [
  {
    chapter: 1,
    title: "The Yoga of Arjuna's Grief",
    sanskritTitle: 'Arjuna Vishaada Yoga',
    coreTheme: 'It is okay to break down before you break through',
    friendlySummary:
      "The Gita doesn't start with answers — it starts with pain. The mightiest warrior sits down and weeps, and that is exactly where wisdom begins. A breakdown is not failure; it can be the door to transformation.",
    lifeMoments: ['feeling overwhelmed', 'family conflict', 'paralysis by fear', 'moral dilemma', 'crisis of purpose'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 2,
    title: 'The Yoga of Knowledge',
    sanskritTitle: 'Sankhya Yoga',
    coreTheme: 'The mind is the field of every battle',
    friendlySummary:
      'The longest chapter — and the densest with practical teaching. Here the work shifts from circumstances to inner stance. Whatever the situation, the response begins in the mind.',
    lifeMoments: ['inner conflict', 'decision under pressure', 'losing perspective', 'overwhelmed by emotion'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 3,
    title: 'The Yoga of Action',
    sanskritTitle: 'Karma Yoga',
    coreTheme: 'Right action without attachment is its own discipline',
    friendlySummary:
      'Action is not optional. Even sitting still is a kind of action. What matters is the spirit in which you act: with care, with full presence, and without clinging to results.',
    lifeMoments: ['stuck in inaction', 'over-attached to outcomes', 'burning out from over-effort'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 4,
    title: 'The Yoga of Wisdom in Action',
    sanskritTitle: 'Jnana Karma Sannyasa Yoga',
    coreTheme: 'Knowledge transforms action without changing what is done',
    friendlySummary:
      'Two people can do the same outward act and have entirely different inner experiences. The difference is wisdom — seeing clearly what is actually happening.',
    lifeMoments: ['routine feeling meaningless', 'searching for purpose', 'spiritual dryness'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 5,
    title: 'The Yoga of Renunciation',
    sanskritTitle: 'Karma Sannyasa Yoga',
    coreTheme: 'Action and renunciation lead to the same place',
    friendlySummary:
      "You don't have to choose between engagement and detachment. Renunciation is not running away; it is acting without ego claiming the action.",
    lifeMoments: ['urge to escape', 'feeling trapped', 'questioning whether to engage'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 6,
    title: 'The Yoga of Meditation',
    sanskritTitle: 'Dhyana Yoga',
    coreTheme: 'Self-mastery is the foundation of every other yoga',
    friendlySummary:
      'Practical guidance on stilling the mind. The famous teaching: lift yourself by your own self. Your own self is your closest friend, and your closest adversary.',
    lifeMoments: ['restless mind', 'inability to focus', 'self-sabotage', 'beginning meditation practice'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 7,
    title: 'The Yoga of Knowledge and Realization',
    sanskritTitle: 'Jnana Vijnana Yoga',
    coreTheme: 'There is a thread running through every form',
    friendlySummary:
      'Beneath the surface of every changing thing, something unchanging holds it together. Seeing this thread changes everything else.',
    lifeMoments: ['feeling fragmented', 'sense of meaninglessness', 'longing for unity'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 8,
    title: 'The Yoga of the Imperishable',
    sanskritTitle: 'Akshara Brahma Yoga',
    coreTheme: 'What you focus on at the end is what you become',
    friendlySummary:
      "Where attention rests, the self drifts. The discipline of returning attention to what matters most — repeatedly, gently — is the long arc of practice.",
    lifeMoments: ['existential anxiety', 'preparing for difficulty', 'practicing focus'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 9,
    title: 'The Royal Knowledge',
    sanskritTitle: 'Raja Vidya Raja Guhya Yoga',
    coreTheme: 'The most profound teaching is also the most accessible',
    friendlySummary:
      'You do not need elaborate qualifications to begin. Simple steady devotion — to whatever holds your truest care — is the foundation.',
    lifeMoments: ['feeling unworthy', 'inadequacy in practice', 'beginner overwhelm'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 10,
    title: 'The Yoga of Divine Manifestations',
    sanskritTitle: 'Vibhuti Yoga',
    coreTheme: 'The sacred is hidden in plain sight',
    friendlySummary:
      'A roll call of the wonders in the world — and the suggestion that whatever shines in any field shines because the deepest reality is in it.',
    lifeMoments: ['cynicism', 'feeling life is dull', 'reconnecting with awe'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 11,
    title: 'The Vision of the Cosmic Form',
    sanskritTitle: 'Vishwarupa Darshana Yoga',
    coreTheme: 'Some truths are too big to hold easily',
    friendlySummary:
      "A glimpse of everything at once — and how quickly even the bravest mind asks for it to be smaller, kinder, more familiar. There is wisdom in not always knowing the whole picture.",
    lifeMoments: ['terror of the unknown', 'mystical experience', 'crisis of scale'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 12,
    title: 'The Yoga of Devotion',
    sanskritTitle: 'Bhakti Yoga',
    coreTheme: 'Love is the simplest doorway',
    friendlySummary:
      "When the intellect can't carry you further, love can. Heart-practice is not lesser than head-practice — for many people, it is the truest path.",
    lifeMoments: ['intellectual exhaustion', 'longing for connection', 'simplifying practice'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 13,
    title: 'The Field and the Knower of the Field',
    sanskritTitle: 'Kshetra Kshetrajna Vibhaga Yoga',
    coreTheme: 'You are the witness, not the changing scenery',
    friendlySummary:
      'The body is a field where experience plays out; you are the awareness that knows the field. Confusing the two is the source of much suffering.',
    lifeMoments: ['identity confusion', 'over-identification with body/mood', 'witnessing practice'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 14,
    title: 'The Three Qualities',
    sanskritTitle: 'Gunatraya Vibhaga Yoga',
    coreTheme: 'Notice the texture of your present state',
    friendlySummary:
      'Every moment has a quality: heavy, restless, or clear. Learning to read your own state, without judging it, is the first step in working with it skillfully.',
    lifeMoments: ['inertia', 'agitation', 'gaining clarity', 'self-observation'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 15,
    title: 'The Yoga of the Supreme Self',
    sanskritTitle: 'Purushottama Yoga',
    coreTheme: 'The roots of what you see are above, not below',
    friendlySummary:
      'A tree-image for life: the visible world has invisible roots. Recognizing what is sourcing the visible reveals where to place attention.',
    lifeMoments: ['existential question', 'seeking deeper cause', 'mapping inner architecture'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 16,
    title: 'The Divine and the Demonic',
    sanskritTitle: 'Daivasura Sampad Vibhaga Yoga',
    coreTheme: 'Two orientations live in every person',
    friendlySummary:
      'Generosity and grasping. Truth and pretense. Courage and cruelty. Both currents flow in everyone; awareness of which one is active is what gives the power to choose.',
    lifeMoments: ['ethical conflict', 'self-examination', 'witnessing harmful patterns'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 17,
    title: 'The Three Kinds of Faith',
    sanskritTitle: 'Shraddhatraya Vibhaga Yoga',
    coreTheme: 'You become what you keep returning to',
    friendlySummary:
      'Food, speech, practice, giving — every habit has a texture, and the textures repeated become character. Pay attention to what you repeat.',
    lifeMoments: ['examining habits', 'changing patterns', 'shaping character'],
    verses: [],
    conversationalResponses: [],
  },
  {
    chapter: 18,
    title: 'The Yoga of Liberation',
    sanskritTitle: 'Moksha Sannyasa Yoga',
    coreTheme: 'The whole teaching gathers into a final clarity',
    friendlySummary:
      'The Gita ends not with new theory but with summary and choice: act from your truest understanding, let go of what you cannot control, and trust the unfolding.',
    lifeMoments: ['integration of practice', 'final decisions', 'arriving at clarity'],
    verses: [],
    conversationalResponses: [],
  },
]

// ─── Helpers (return empty/undefined until canonical corpus is reloaded) ────

export function getChapter(num: number): ChapterTeaching | undefined {
  return GITA_CHAPTERS.find((c) => c.chapter === num)
}

export function getAllChapters(): ChapterTeaching[] {
  return GITA_CHAPTERS
}

export function searchVerses(_query: string): GitaVerse[] {
  return []
}

export function getVersesByEmotion(_emotion: string): GitaVerse[] {
  return []
}

export default GITA_CHAPTERS
