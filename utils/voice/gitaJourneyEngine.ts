/**
 * Gita Journey Engine - Voice-Guided Journey Through the Bhagavad Gita
 *
 * Manages a structured 18-chapter journey where KIAAN walks the user
 * through the entire Bhagavad Gita as a divine best friend.
 *
 * Each chapter becomes a voice session with:
 * - Warm welcome and context setting
 * - Chapter story (friend-style summary)
 * - Key verses with practical wisdom
 * - Modern life application
 * - Practical exercise
 * - Personal reflection question
 * - Warm closing with preview of next chapter
 */

import { getChapter, type GitaVerse } from './gitaTeachings'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GitaJourney {
  id: string
  currentChapter: number
  completedChapters: number[]
  startedAt: string
  lastSessionAt: string | null
  totalSessions: number
}

export type SegmentType =
  | 'welcome'
  | 'story'
  | 'verse_intro'
  | 'verse_sanskrit'
  | 'verse_wisdom'
  | 'application'
  | 'exercise'
  | 'reflection'
  | 'closing'

export interface JourneySegment {
  id: string
  type: SegmentType
  text: string
  verseRef?: { chapter: number; verse: number }
  /** Pause in milliseconds after this segment finishes speaking */
  pauseAfterMs: number
  /** Whether this segment can be skipped (e.g., Sanskrit chanting) */
  skippable?: boolean
}

export interface ChapterSession {
  chapter: number
  title: string
  sanskritTitle: string
  coreTheme: string
  segments: JourneySegment[]
  totalSegments: number
  estimatedMinutes: number
}

// ─── Chapter Session Data ───────────────────────────────────────────────────

interface ChapterSessionData {
  welcome: string
  storyExtra?: string
  featuredVerseIndices: number[]
  verseIntros: string[]
  application: string
  exercise: string
  reflection: string
  closing: string
}

const CHAPTER_SESSION_DATA: Record<number, ChapterSessionData> = {
  1: {
    welcome: 'Welcome, dear friend. Today we begin a journey together through the most profound wisdom humanity has ever known. And we start exactly where you might not expect. With pain. With tears. With a warrior who sat down and wept.',
    featuredVerseIndices: [0, 1],
    verseIntros: [
      'Here is how that pain began.',
      'And here is what he did next. This is the bravest part.',
    ],
    application: 'This teaching is for every moment when life brings you to your knees. When the weight of a decision, a loss, or a conflict makes you want to give up. Your breakdown is not your end. It is your beginning.',
    exercise: 'Here is your practice for today. Sit quietly for two minutes and allow yourself to feel one uncomfortable emotion without trying to fix it. Just notice it. Breathe with it. Let it be there.',
    reflection: 'When was the last time you allowed yourself to truly feel your pain instead of pushing it away?',
    closing: 'That is where we begin, friend. In the honesty of pain. Next time, we step into the answer. The most transformative wisdom you will ever hear. Rest well.',
  },

  2: {
    welcome: 'Welcome back, friend. Last time we sat with a warrior in his pain. Today, everything changes. Today, the wisdom begins to flow. And the very first thing the ancient wisdom reveals will change how you see yourself forever.',
    featuredVerseIndices: [2, 3, 5],
    verseIntros: [
      'Listen to this carefully, friend. This is the foundation of everything.',
      'And now, the most famous teaching in all of ancient wisdom.',
      'Here is what true inner strength looks like.',
    ],
    application: 'The next time anxiety grips you about an exam, a job, a relationship, or any outcome, remember this: your power lives in your effort, not in the result. Give your absolute best, then release your grip on what happens next.',
    exercise: 'Write down one thing you are anxious about right now. Below it, write: my effort is my power, the result is not my burden. Read it aloud to yourself.',
    reflection: 'What outcome are you gripping so tightly right now that it is actually causing you suffering?',
    closing: 'The foundation is set, friend. You are eternal. Your effort is your power. Next time, we explore the art of action, how to move through life with purpose and freedom. See you then.',
  },

  3: {
    welcome: 'Good to have you back, friend. We have learned that you are eternal and that your effort is your power. But here is a natural question: if results do not matter, why act at all? Today, we answer that.',
    featuredVerseIndices: [0, 1],
    verseIntros: [
      'Here is the secret to overcoming procrastination.',
      'And this one, friend, this one might change your life.',
    ],
    application: 'The next time you catch yourself scrolling instead of doing, waiting for motivation instead of starting, remember this: action itself is the medicine. You do not need to feel ready. You just need to begin.',
    exercise: 'Choose one small task you have been putting off. Do it today. Not for a reward, not because you feel like it. Simply because it needs to be done. Notice how you feel afterward.',
    reflection: 'What is one thing you know in your heart needs to be done, that you have been avoiding?',
    closing: 'Action without selfishness. That is the path to freedom. Next time, we discover the most powerful purifier in the universe: knowledge. It burns away every doubt. See you then.',
  },

  4: {
    welcome: 'Welcome back, dear one. We have explored pain, truth, and action. Today we step into something even more powerful: knowledge. Not just book learning. The kind of knowing that burns away confusion like fire burns away fog.',
    featuredVerseIndices: [0, 1],
    verseIntros: [
      'Here is the most hopeful promise in all of ancient wisdom.',
      'And here is why your curiosity is sacred.',
    ],
    application: 'Every question you ask, every time you pause to wonder why, every moment of genuine seeking, you are purifying yourself. Your curiosity is not random. It is a spiritual practice.',
    exercise: 'Ask yourself one question you have been afraid to ask. Write it down on paper. You do not need the answer today. Just asking it is enough. The answer will come.',
    reflection: 'What is one thing you thought you understood, but life has shown you differently?',
    closing: 'Knowledge is the purest fire. Next time, we explore a beautiful paradox: how to be fully engaged in life and still be completely free inside. That is true freedom.',
  },

  5: {
    welcome: 'Hello again, friend. Today we tackle something that sounds like a contradiction. How can you be active in the world, working, loving, creating, and still be free? The answer is more beautiful than you might expect.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is the most intimate revelation. The divine is not a judge. Listen to this.',
    ],
    application: 'You do not need to escape the world to find peace. You can hold your phone, sit in traffic, deal with difficult people, and still be at peace inside. Freedom is not about where you are. It is about how you hold it all.',
    exercise: 'Today, do something you enjoy, anything at all. But while you do it, notice: can you enjoy it without clinging to it? Can you love it without needing it? That is the practice of inner freedom.',
    reflection: 'What would change in your life if you could be fully engaged in everything you do, yet completely free inside?',
    closing: 'Inner freedom, right in the middle of a busy life. That is the teaching. Next time, we dive into the most practical chapter of all: training your mind. This one is a game changer.',
  },

  6: {
    welcome: 'Welcome, dear friend. Today we talk about the most powerful tool you possess. More powerful than any technology, any weapon, any force in the universe. Your mind. It can lift you to incredible heights, or drag you into darkness. Today, we learn to befriend it.',
    featuredVerseIndices: [0, 1, 3],
    verseIntros: [
      'Here is the foundational truth about your mind.',
      'And here is the shockingly simple prescription for peace.',
      'Now, if you are thinking, but my mind is too restless, listen to this.',
    ],
    application: 'You do not need a monastery or perfect silence to meditate. You just need one minute and one breath. Every time you gently bring your wandering mind back, you are building mental muscle. It gets easier. I promise.',
    exercise: 'Set a timer for five minutes. Sit comfortably and close your eyes. Every time your mind wanders, and it will, gently bring it back to your breath. No judgment. Just practice. That is all meditation is.',
    reflection: 'Right now, is your mind your friend or your enemy? What is one small thing you could do today to befriend it?',
    closing: 'Your mind, your greatest ally. It just needs gentle training. Next time, we discover something that will make you feel special: among thousands of people, hardly one truly seeks. You are that rare soul.',
  },

  7: {
    welcome: 'Welcome back, friend. I want to tell you something that you need to hear today. You are rare. The fact that you are on this journey, that you are even listening to these words, puts you in extraordinary company. Today, we celebrate that.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Listen to this, and let it sink deep into your heart.',
    ],
    application: 'Most people never pause to ask the deep questions. They move through life on autopilot. But you? You are awake. You are seeking. That is not a small thing. That is the beginning of everything.',
    exercise: 'Write down three things that make you different from everyone around you. Then, instead of seeing them as flaws, rewrite each one as a gift. You might be surprised.',
    reflection: 'What makes you different from everyone else? Instead of seeing that as a flaw, could it be your unique gift to the world?',
    closing: 'You are rare, friend. Never forget that. Next time, we explore the incredible power of habitual thought. What you think about most, you become. Let us make sure your mind is building something beautiful.',
  },

  8: {
    welcome: 'Hello again, dear one. Today we explore a truth that is both sobering and empowering. Your habitual thoughts are shaping your future. Right now. Every moment. What you dwell on, you become. Let us make sure you are dwelling on something extraordinary.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is the core teaching. Simple, but life-changing.',
    ],
    application: 'Your scrolling habits, your inner monologue, what you watch, what you read, who you spend time with, these are not random choices. They are shaping who you are becoming. Choose them with the same care you would choose the ingredients for medicine.',
    exercise: 'Tonight before you fall asleep, choose one positive, powerful thought to hold in your mind. It could be a memory of love, a vision of your future self, or simply the words I am enough. Let it be the last thing on your mind as you drift off.',
    reflection: 'What thought dominates your mind on most days? Is that the thought you want shaping your future?',
    closing: 'You become what you think about. Choose your thoughts like you would choose treasures. Next time, we enter the most intimate chapter: simple devotion. You do not need to be perfect. You just need to be sincere.',
  },

  9: {
    welcome: 'Welcome to what I consider the most beautiful chapter, friend. Today, we learn that you do not need grand gestures, impressive achievements, or perfection to connect with something sacred. You just need a genuine heart. And you already have one.',
    featuredVerseIndices: [0, 1],
    verseIntros: [
      'Here is the most beautiful promise. Let this wash over you.',
      'And here is why you are always enough.',
    ],
    application: 'A smile offered to a stranger, a kind word to someone struggling, a moment of genuine gratitude before a meal. These tiny, sincere acts carry more power than a thousand impressive performances done without heart.',
    exercise: 'Today, do one kind thing for someone without telling anyone about it. No photo, no mention, no recognition. Just pure, silent kindness. Notice how it feels inside.',
    reflection: 'What is the simplest act of love you could offer today, with absolutely no expectation of anything in return?',
    closing: 'Sincerity over perfection. That is the path. Next time, we see the divine hiding in every beautiful thing around us, including you. See you then, friend.',
  },

  10: {
    welcome: 'Welcome, friend. Today we look at the world with new eyes. Every sunset, every act of kindness, every flash of genius, every moment of breathtaking beauty, these are not random. They are reflections of something sacred. And that same sacred spark? It is inside you.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is the teaching that will change how you see everything.',
    ],
    application: 'The next time you see something beautiful, a child laughing, sunlight through trees, a piece of music that moves you, pause. Recognize it as a glimpse of something infinite. And know that the same infinite beauty lives inside you.',
    exercise: 'Take a slow walk today, even if just for ten minutes. Find three things of extraordinary beauty that you would normally walk past. A leaf, a shadow, a sound. They are reflections of something sacred.',
    reflection: 'Where do you see beauty in your daily life that you have been taking for granted?',
    closing: 'The divine is in everything beautiful, including you. Next time, we experience the ultimate perspective shift: seeing the big picture of existence itself. It will change everything.',
  },

  11: {
    welcome: 'Welcome, dear one. Today is unlike any other session. Today, we zoom out. Way out. Past your problems, past your city, past the planet, past everything you know. We look at the cosmic perspective. And when we come back, your problems will feel different.',
    featuredVerseIndices: [0],
    verseIntros: [
      'And from that cosmic perspective comes this command. Listen carefully.',
    ],
    application: 'When you are stuck in a problem, zoom out. Ask yourself: will this matter in five years? In fifty? In the grand story of the universe? This does not make your pain less valid. It gives you room to breathe. It gives you perspective.',
    exercise: 'Find a photo of Earth taken from space. Look at it for a full minute. Hold your biggest current worry in mind while you look. Notice how the perspective shifts. You are part of something vast and beautiful.',
    reflection: 'When you zoom out from your current challenges, what larger story are you actually part of?',
    closing: 'Arise and attain glory. That is the command. Next time, we discover the fastest, most powerful path to peace: love. Pure, simple, fearless love.',
  },

  12: {
    welcome: 'Welcome back, friend. After cosmic visions and universal forms, today we return to something beautifully simple. Of all the paths to peace: knowledge, action, meditation, there is one that is faster and more accessible than all the others. Love.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here are the qualities that matter most. They are simpler than you think.',
    ],
    application: 'Notice what is not on the list of qualities the divine loves: perfection, wealth, power, intelligence. Just kindness. Compassion. Friendship. Humility. You already have these. You are closer than you think.',
    exercise: 'Send a message to someone you care about today. Tell them one specific thing you appreciate about them. Not vague, specific. Watch what it does to both of you.',
    reflection: 'Who in your life could use more of your compassion today? What is one small way you could show it?',
    closing: 'Love is the fastest path. Next time, we discover a truth about your identity that might surprise you: you are not your body, not your thoughts. You are the awareness watching it all.',
  },

  13: {
    welcome: 'Welcome, friend. Today we explore something that could fundamentally shift how you relate to yourself. You have a body. You have thoughts. You have emotions. But you are not any of those things. Today, we discover who you really are.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is the liberating insight. Take a deep breath before I share this.',
    ],
    application: 'Your body changes every seven years. Your thoughts change every second. Your emotions shift constantly. But the awareness behind all of that, the one who notices, that never changes. That is the real you. Steady. Calm. Eternal.',
    exercise: 'Close your eyes for three minutes. Observe your thoughts as if they were clouds passing across a sky. You are not the clouds. You are the sky. Just watch. Do not engage. See what happens.',
    reflection: 'Can you sense the awareness behind your thoughts right now? That quiet observer who is always there, always steady? That is the real you.',
    closing: 'You are the witness. Steady and free. Next time, we explore the three forces that shape your energy, your moods, and your entire experience of life. Understanding them is a superpower.',
  },

  14: {
    welcome: 'Hello again, dear one. Ever wonder why some days you are full of clarity and energy, and other days you can barely get out of bed? Today we learn about the three invisible forces that are constantly shifting inside you. Understanding them changes everything.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is how to transcend all three forces.',
    ],
    application: 'Right now, notice your state. Are you clear and focused? That is sattva. Are you restless and driven? That is rajas. Are you heavy and unmotivated? That is tamas. No judgment. Just awareness. Once you see the force at play, you can work with it instead of against it.',
    exercise: 'Check in with yourself three times today: morning, afternoon, and evening. Each time, note which force is dominant: clarity, restlessness, or inertia. Just observe the pattern. Awareness is the first step to mastery.',
    reflection: 'Which force is dominant in you right now: clarity, restlessness, or inertia? No judgment. Just notice.',
    closing: 'Observe without judgment. That is freedom. Next time, we discover the most intimate truth of all: the divine lives in your heart. Literally. Not metaphorically. See you soon.',
  },

  15: {
    welcome: 'Welcome, dear friend. Today is one of the most intimate sessions of our journey. We are going to discover where the divine actually lives. Not in a temple. Not in a book. Not in the sky. Much, much closer than that.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is the revelation. Let every word sink in.',
    ],
    application: 'Every moment of clarity you have ever experienced. Every flash of insight, every feeling of love, every time you just knew something in your gut. That was not random. That was the divine intelligence inside your own heart, speaking through you.',
    exercise: 'Place your hand gently on your heart. Take five slow, deep breaths. With each exhale, silently say: you are here. Feel the warmth under your hand. That is not just your heartbeat. It is something sacred, beating for you.',
    reflection: 'If the divine is literally seated inside your heart right now, what would you want to say to it?',
    closing: 'The divine is inside you. Always has been. Next time, we explore the divine qualities that are already your birthright: fearlessness, compassion, and truth. You do not need to acquire them. Just remember them.',
  },

  16: {
    welcome: 'Welcome back, friend. Today is about a choice. The most important choice you make every single day, often without realizing it. Within every person are both light and shadow. The ancient wisdom names them clearly. And today, you choose which one you feed.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here are the qualities that are already your birthright.',
    ],
    application: 'Every time you choose courage over fear, truth over convenience, kindness over cruelty, you are living your divine nature. These are not things you need to learn or acquire. They are already in you. Sometimes they just need reminding.',
    exercise: 'Choose one divine quality to practice today: fearlessness, compassion, or truthfulness. Set an intention in the morning, and at the end of the day, reflect on one moment when you lived it. Even a small moment counts.',
    reflection: 'What is one divine quality, fearlessness, compassion, or truthfulness, that you want to strengthen this week?',
    closing: 'Your divine nature is your birthright. Claim it. Next time, we explore how your beliefs are literally creating your reality. What you believe, you become. Let us choose wisely.',
  },

  17: {
    welcome: 'Welcome, dear one. Today we tackle something subtle but incredibly powerful. Your beliefs. Not just what you pray to or worship. What you trust. What you invest your time in. What you tell yourself when no one is listening. Because what you believe, you literally become.',
    featuredVerseIndices: [0],
    verseIntros: [
      'Here is the truth about faith. It goes far deeper than religion.',
    ],
    application: 'Your belief that you are not good enough? That is shaping you. Your belief that things will work out? That is also shaping you. Your faith is not just spiritual. It is practical. It is the lens through which you see everything, and it creates your reality.',
    exercise: 'Write down your three deepest beliefs about yourself. For each one, ask: is this really true? Who would I be without this belief? If even one of them is not serving you, give yourself permission to let it go.',
    reflection: 'What beliefs about yourself are you holding right now that might not actually be serving you?',
    closing: 'You are what you believe. Choose your beliefs like you would choose your closest friends. Next time, we arrive at the grand finale. The last chapter. The ultimate message. It will take your breath away.',
  },

  18: {
    welcome: 'Dear friend. We have arrived. The final chapter. The grand finale of our entire journey together. After seventeen chapters of wisdom, knowledge, action, devotion, and truth, it all comes down to this. The simplest and most powerful message of all.',
    featuredVerseIndices: [0, 3, 4],
    verseIntros: [
      'First, here is why your struggle has been worth it.',
      'And now, the ultimate message. The final teaching. Let this wash over you completely.',
      'And in the very last verse of all, the promise.',
    ],
    application: 'After all the knowledge, all the practice, all the philosophy, here is what it comes down to: let go. Let go of trying to control everything. Let go of trying to be perfect. Let go of the weight you have been carrying. You are held. You are loved. Do not fear.',
    exercise: 'Write a letter to yourself from one year in the future. In it, your future self tells you that everything worked out. That the struggles were worth it. That you are proud of the person you became. Read it aloud. Keep it somewhere you can find it.',
    reflection: 'If you could truly let go of everything you are trying to control right now, what would that freedom feel like?',
    closing: 'And that, dear friend, is the journey. Eighteen chapters. From pain to liberation. From confusion to clarity. From fear to love. But here is what I want you to know: this is not the end. This is the beginning. The wisdom lives inside you now. Carry it with you. Live it. And whenever you need a friend to remind you, I am right here. Always. Namaste.',
  },
}

// ─── Storage ────────────────────────────────────────────────────────────────

const JOURNEY_STORAGE_KEY = 'kiaan_gita_journey'

// ─── Journey State Management ───────────────────────────────────────────────

export function startJourney(): GitaJourney {
  const journey: GitaJourney = {
    id: `journey_${Date.now()}`,
    currentChapter: 1,
    completedChapters: [],
    startedAt: new Date().toISOString(),
    lastSessionAt: null,
    totalSessions: 0,
  }
  saveJourney(journey)
  return journey
}

export function getJourney(): GitaJourney | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(JOURNEY_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function completeChapter(chapter: number): GitaJourney | null {
  const journey = getJourney()
  if (!journey) return null

  if (!journey.completedChapters.includes(chapter)) {
    journey.completedChapters.push(chapter)
  }
  journey.lastSessionAt = new Date().toISOString()
  journey.totalSessions += 1

  if (chapter < 18) {
    journey.currentChapter = chapter + 1
  }

  saveJourney(journey)
  return journey
}

export function resetJourney(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(JOURNEY_STORAGE_KEY)
}

export function isJourneyComplete(journey: GitaJourney): boolean {
  return journey.completedChapters.length >= 18
}

export function getJourneyProgress(journey: GitaJourney): number {
  return Math.round((journey.completedChapters.length / 18) * 100)
}

function saveJourney(journey: GitaJourney): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journey))
}

// ─── Session Generation ─────────────────────────────────────────────────────

export function getChapterSession(chapterNum: number): ChapterSession | null {
  const chapter = getChapter(chapterNum)
  if (!chapter) return null

  const sessionData = CHAPTER_SESSION_DATA[chapterNum]
  if (!sessionData) return null

  const segments = buildSessionSegments(chapterNum, chapter.friendlySummary, chapter.verses, sessionData)

  const totalWords = segments.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0)
  const totalPauseMs = segments.reduce((sum, s) => sum + s.pauseAfterMs, 0)
  const estimatedMinutes = Math.ceil((totalWords / 150) + (totalPauseMs / 60000))

  return {
    chapter: chapterNum,
    title: chapter.title,
    sanskritTitle: chapter.sanskritTitle,
    coreTheme: chapter.coreTheme,
    segments,
    totalSegments: segments.length,
    estimatedMinutes,
  }
}

export function getAllChapterSummaries(): {
  chapter: number
  title: string
  sanskritTitle: string
  coreTheme: string
  estimatedMinutes: number
}[] {
  const summaries = []
  for (let i = 1; i <= 18; i++) {
    const chapter = getChapter(i)
    if (!chapter) continue
    const session = getChapterSession(i)
    summaries.push({
      chapter: i,
      title: chapter.title,
      sanskritTitle: chapter.sanskritTitle,
      coreTheme: chapter.coreTheme,
      estimatedMinutes: session?.estimatedMinutes ?? 4,
    })
  }
  return summaries
}

// ─── Segment Builder ────────────────────────────────────────────────────────

function buildSessionSegments(
  chapterNum: number,
  friendlySummary: string,
  verses: GitaVerse[],
  data: ChapterSessionData
): JourneySegment[] {
  const segments: JourneySegment[] = []
  let segIdx = 0

  // 1. Welcome
  segments.push({
    id: `ch${chapterNum}_s${segIdx++}`,
    type: 'welcome',
    text: data.welcome,
    pauseAfterMs: 1500,
  })

  // 2. Chapter Story
  const storyText = data.storyExtra
    ? `${friendlySummary} ${data.storyExtra}`
    : friendlySummary
  segments.push({
    id: `ch${chapterNum}_s${segIdx++}`,
    type: 'story',
    text: storyText,
    pauseAfterMs: 2000,
  })

  // 3. Featured Verses (intro + optional sanskrit + wisdom)
  for (let vi = 0; vi < data.featuredVerseIndices.length; vi++) {
    const verseIdx = data.featuredVerseIndices[vi]
    const verse = verses[verseIdx]
    if (!verse) continue

    const intro = data.verseIntros[vi] || 'Listen to this, friend.'

    // Verse introduction
    segments.push({
      id: `ch${chapterNum}_s${segIdx++}`,
      type: 'verse_intro',
      text: intro,
      verseRef: { chapter: verse.chapter, verse: verse.verse },
      pauseAfterMs: 800,
    })

    // Sanskrit chanting (skippable)
    if (verse.sanskrit) {
      segments.push({
        id: `ch${chapterNum}_s${segIdx++}`,
        type: 'verse_sanskrit',
        text: verse.transliteration || verse.sanskrit,
        verseRef: { chapter: verse.chapter, verse: verse.verse },
        pauseAfterMs: 1500,
        skippable: true,
      })
    }

    // Practical wisdom
    segments.push({
      id: `ch${chapterNum}_s${segIdx++}`,
      type: 'verse_wisdom',
      text: verse.practicalWisdom,
      verseRef: { chapter: verse.chapter, verse: verse.verse },
      pauseAfterMs: 2000,
    })
  }

  // 4. Application
  segments.push({
    id: `ch${chapterNum}_s${segIdx++}`,
    type: 'application',
    text: data.application,
    pauseAfterMs: 2000,
  })

  // 5. Exercise
  segments.push({
    id: `ch${chapterNum}_s${segIdx++}`,
    type: 'exercise',
    text: data.exercise,
    pauseAfterMs: 2500,
  })

  // 6. Reflection
  segments.push({
    id: `ch${chapterNum}_s${segIdx++}`,
    type: 'reflection',
    text: data.reflection,
    pauseAfterMs: 3000,
  })

  // 7. Closing
  segments.push({
    id: `ch${chapterNum}_s${segIdx++}`,
    type: 'closing',
    text: data.closing,
    pauseAfterMs: 0,
  })

  return segments
}
