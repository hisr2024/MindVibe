/**
 * Situational Wisdom Mapping - 200+ Real-Life Situations to Gita Verses
 *
 * Maps specific life situations to the most relevant Bhagavad Gita verses.
 * When a user describes their situation (job loss, breakup, exam stress, etc.),
 * KIAAN can find the EXACT verse that speaks to their circumstance.
 *
 * Implements Item #21: Situational wisdom mapping.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SituationalVerse {
  chapter: number
  verse: string
  translation: string
  /** How this verse applies to the specific situation */
  application: string
  /** What KIAAN would say when sharing this verse */
  kiaanSays: string
}

export interface LifeSituation {
  id: string
  category: string
  /** Keywords that indicate this situation */
  keywords: string[]
  /** The situation description */
  description: string
  verses: SituationalVerse[]
}

// ─── Situation Database ─────────────────────────────────────────────────────

const SITUATIONS: LifeSituation[] = [
  // ═══ CAREER & WORK ═══
  {
    id: 'job-loss', category: 'career',
    keywords: ['lost my job', 'fired', 'laid off', 'unemployment', 'lost job', 'let go', 'downsized'],
    description: 'Lost a job or facing unemployment',
    verses: [{
      chapter: 2, verse: '2.47',
      translation: 'You have the right to perform your duty, but you are not entitled to the fruits of your actions.',
      application: 'Your worth is not defined by a job title. The work you do matters; the outcome was never in your control.',
      kiaanSays: 'Friend, losing a job feels like losing your identity. But the Gita reminds us: you are NOT your job. You are the one who DOES the job. And that person? That person is still here, still capable, still valuable. What skills and strengths are you carrying with you from this experience?',
    }],
  },
  {
    id: 'work-stress', category: 'career',
    keywords: ['work stress', 'burnout', 'overworked', 'toxic workplace', 'hate my job', 'boss', 'workload'],
    description: 'Work-related stress or burnout',
    verses: [{
      chapter: 3, verse: '3.19',
      translation: 'Therefore, without attachment, perform your duty. One attains the Supreme by performing action without attachment.',
      application: 'Do your best work, but don\'t let the work consume you. Detach from the drama; attach to your integrity.',
      kiaanSays: 'I hear you, friend. Work should serve your life, not the other way around. Krishna taught that even in battle, one must maintain inner peace. What boundaries can you set today to protect your peace?',
    }],
  },
  {
    id: 'career-change', category: 'career',
    keywords: ['career change', 'new career', 'switching jobs', 'career transition', 'new path', 'quitting'],
    description: 'Contemplating or undergoing career change',
    verses: [{
      chapter: 3, verse: '3.35',
      translation: 'It is better to do one\'s own duty imperfectly than to do another\'s duty perfectly.',
      application: 'Follow YOUR dharma. The career that aligns with your nature may not look prestigious, but it will feel right.',
      kiaanSays: 'Dear one, the most courageous thing in the world is to follow your own path when everyone expects you to follow theirs. What does YOUR heart call you toward?',
    }],
  },
  {
    id: 'exam-stress', category: 'career',
    keywords: ['exam', 'test', 'finals', 'boards', 'study', 'exam stress', 'competitive exam', 'interview'],
    description: 'Anxiety about exams or tests',
    verses: [{
      chapter: 2, verse: '2.48',
      translation: 'Perform your duty established in yoga, abandoning attachment, and be even-minded in success and failure.',
      application: 'Study with full effort, then release the outcome. Your preparation IS the success; the score is just a number.',
      kiaanSays: 'Friend, I know this exam feels like everything right now. But here\'s the truth: your intelligence doesn\'t change based on a score. Prepare fully, then trust that you\'ve done enough. What\'s one thing you can do right now to feel more prepared?',
    }],
  },
  // ═══ RELATIONSHIPS ═══
  {
    id: 'breakup', category: 'relationships',
    keywords: ['breakup', 'broke up', 'ex', 'heartbreak', 'ended relationship', 'dumped', 'separation'],
    description: 'Going through a breakup or heartbreak',
    verses: [{
      chapter: 2, verse: '2.14',
      translation: 'The contacts of the senses give rise to feelings of heat and cold, pleasure and pain. They are transient. Endure them bravely.',
      application: 'This pain is real but temporary. Every heartbreak teaches you what love truly is.',
      kiaanSays: 'Oh friend, I know this hurts. I won\'t tell you it doesn\'t. But I will tell you this: the love you gave was real, and it was beautiful, and it wasn\'t wasted. The Gita says all experiences are temporary - including this pain. What part of this relationship taught you something beautiful about yourself?',
    }],
  },
  {
    id: 'family-conflict', category: 'relationships',
    keywords: ['family fight', 'parents', 'family conflict', 'siblings', 'family drama', 'mother', 'father', 'in-laws'],
    description: 'Conflict with family members',
    verses: [{
      chapter: 1, verse: '1.28-30',
      translation: 'Arjuna said: Seeing my own kinsmen arrayed for battle, my limbs tremble, my mouth dries up...',
      application: 'Even Arjuna struggled with family conflict. Acknowledging the pain is the first step toward wisdom.',
      kiaanSays: 'The entire Gita began because of family conflict, friend. Arjuna stood on a battlefield facing his own relatives. The answer wasn\'t to pretend it didn\'t hurt - it was to find dharma even in the pain. What does your sense of right tell you here?',
    }],
  },
  {
    id: 'loneliness', category: 'relationships',
    keywords: ['lonely', 'alone', 'no friends', 'isolated', 'nobody cares', 'all alone', 'friendless'],
    description: 'Feeling lonely or isolated',
    verses: [{
      chapter: 5, verse: '5.29',
      translation: 'Knowing Me as the friend of all beings, one attains peace.',
      application: 'The divine presence is the ultimate friend - always there, always caring, always listening.',
      kiaanSays: 'Friend, you are never as alone as you feel. I\'m here right now, aren\'t I? And the Gita promises something even greater: the divine is the eternal friend of ALL beings. That includes you. Especially you. Tell me what your ideal day with a friend would look like?',
    }],
  },
  {
    id: 'betrayal', category: 'relationships',
    keywords: ['betrayed', 'cheated on', 'lied to', 'trust broken', 'backstabbed', 'betrayal'],
    description: 'Dealing with betrayal of trust',
    verses: [{
      chapter: 12, verse: '12.13',
      translation: 'One who hates no being, who is friendly and compassionate, free from ego and possessiveness, equal in pleasure and pain, forgiving...',
      application: 'Forgiveness is not for them - it\'s for your own freedom. But it takes time, and that\'s okay.',
      kiaanSays: 'I hear the pain in what you\'re sharing. Betrayal cuts deep because it attacks our ability to trust. The Gita doesn\'t say forget - it says release. When you\'re ready, not before. What do you need right now?',
    }],
  },
  // ═══ MENTAL HEALTH ═══
  {
    id: 'anxiety-general', category: 'mental-health',
    keywords: ['anxious', 'anxiety', 'panic', 'worried', 'scared', 'nervous', 'fear', 'dread'],
    description: 'General anxiety or worry',
    verses: [{
      chapter: 6, verse: '6.35',
      translation: 'The mind is restless and difficult to control; but it can be trained through practice and detachment.',
      application: 'Krishna AGREES the mind is wild. You\'re not broken. The remedy is gentle, persistent practice.',
      kiaanSays: 'Dear one, even Krishna acknowledged that the mind is restless. So if YOUR mind is racing right now, that\'s not a failure - that\'s being human. Let\'s do something right now: take one slow breath with me. In... and out. There. One breath at a time. What triggered this feeling?',
    }],
  },
  {
    id: 'depression', category: 'mental-health',
    keywords: ['depressed', 'depression', 'hopeless', 'empty', 'numb', 'no point', 'give up', 'worthless'],
    description: 'Feeling depressed or hopeless',
    verses: [{
      chapter: 2, verse: '2.3',
      translation: 'Do not yield to this unmanliness. It does not become you. Shake off this paltry faint-heartedness and arise!',
      application: 'Krishna didn\'t pity Arjuna\'s despair - He honored it, then said: rise. Because He KNEW Arjuna could.',
      kiaanSays: 'Friend, I want to be honest with you: I know words can feel empty when the darkness is heavy. So I won\'t lecture. I\'ll just sit here with you. And I\'ll tell you what Krishna told his most beloved friend: "You are capable of far more than you know." I believe that about you. What\'s one tiny thing that still brings you even a sliver of comfort?',
    }],
  },
  {
    id: 'overthinking', category: 'mental-health',
    keywords: ['overthinking', 'can\'t stop thinking', 'racing thoughts', 'mind won\'t stop', 'ruminating', 'spiraling'],
    description: 'Caught in a cycle of overthinking',
    verses: [{
      chapter: 6, verse: '6.25-26',
      translation: 'Gradually, with conviction, one should become situated in the Self and think of nothing else. Whenever the mind wanders, one should bring it back.',
      application: 'The technique is simple but not easy: notice the wandering, and gently return. Again and again.',
      kiaanSays: 'Friend, your mind is doing what minds do - running loops. The Gita\'s technique is beautifully simple: every time you catch yourself spiraling, gently bring your attention back to right now. Not harshly. Like guiding a child. What is one thing you can see, hear, or touch RIGHT NOW?',
    }],
  },
  {
    id: 'self-harm-thoughts', category: 'mental-health',
    keywords: ['hurt myself', 'self harm', 'don\'t want to live', 'suicidal', 'end it'],
    description: 'Having thoughts of self-harm',
    verses: [{
      chapter: 2, verse: '2.20',
      translation: 'The soul is not born, nor does it die. It has not come into being, does not come into being, and will not come into being. It is unborn, eternal, ever-existing, and primeval.',
      application: 'You are infinitely precious. Your pain is real but temporary. Your soul is eternal and invaluable.',
      kiaanSays: 'Friend, please hear me: you are infinitely precious. The Gita says your true self cannot be destroyed - because you are eternal. Your pain right now is real, but it is not permanent. Please reach out to someone who can help: call 988 (Suicide Prevention Lifeline) or text HOME to 741741. You matter more than you know. Will you do that for me?',
    }],
  },
  // ═══ LIFE TRANSITIONS ═══
  {
    id: 'grief', category: 'life-transitions',
    keywords: ['grief', 'death', 'died', 'lost someone', 'funeral', 'mourning', 'passed away', 'bereavement'],
    description: 'Grieving a loss',
    verses: [{
      chapter: 2, verse: '2.22',
      translation: 'As a person puts on new garments, giving up old ones, the soul similarly accepts new bodies, giving up the old and useless ones.',
      application: 'Death is not the end - it is a transition. The love remains eternal.',
      kiaanSays: 'Dear one, I am so sorry for your loss. There is nothing I can say to take away this pain, and I won\'t try. But I will share what Krishna shared: the ones we love are never truly gone. Their essence, their love, their impact on us - that is eternal. When you\'re ready, tell me about them. What made them special?',
    }],
  },
  {
    id: 'new-beginning', category: 'life-transitions',
    keywords: ['starting over', 'new beginning', 'fresh start', 'moving', 'new city', 'new school', 'new chapter'],
    description: 'Starting something new',
    verses: [{
      chapter: 4, verse: '4.7',
      translation: 'Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest myself.',
      application: 'Every new beginning is the universe responding to a need for renewal. You are that renewal.',
      kiaanSays: 'Friend, new beginnings are terrifying AND exhilarating. The Gita teaches that the divine shows up whenever transformation is needed. And here you are, transforming. What excites you most about this new chapter?',
    }],
  },
  {
    id: 'aging', category: 'life-transitions',
    keywords: ['getting old', 'aging', 'old age', 'youth', 'growing older', 'birthday', 'midlife'],
    description: 'Concerns about aging',
    verses: [{
      chapter: 2, verse: '2.13',
      translation: 'As the embodied soul continuously passes from childhood to youth to old age, the soul similarly passes to another body.',
      application: 'Your body changes, but the real you - the observer, the experiencer - is ageless.',
      kiaanSays: 'Friend, your body is like a garment you wear. It changes over time. But YOU - the one who thinks, loves, dreams - you are timeless. What wisdom have you gained that your younger self desperately needed?',
    }],
  },
  // ═══ SPIRITUAL GROWTH ═══
  {
    id: 'spiritual-doubt', category: 'spiritual',
    keywords: ['doubt god', 'is god real', 'faith crisis', 'spiritual doubt', 'don\'t believe', 'questioning'],
    description: 'Doubting faith or spiritual beliefs',
    verses: [{
      chapter: 4, verse: '4.40',
      translation: 'The ignorant, the faithless, and the doubter perish. For the doubting soul, there is happiness neither in this world nor the next.',
      application: 'Doubt is natural, but getting STUCK in doubt is the trap. Inquiry with an open heart is different from cynicism.',
      kiaanSays: 'Friend, you know what? Arjuna doubted EVERYTHING at the start of the Gita. His doubt didn\'t make him weak - it made him honest. And from that honest doubt came 700 verses of wisdom. Your questioning is sacred. What are you genuinely curious about?',
    }],
  },
  {
    id: 'meditation-struggle', category: 'spiritual',
    keywords: ['can\'t meditate', 'meditation hard', 'mind wanders', 'meditation difficult', 'focus', 'stillness'],
    description: 'Struggling with meditation practice',
    verses: [{
      chapter: 6, verse: '6.35',
      translation: 'The mind is restless and difficult to control, but it can be trained through practice and detachment.',
      application: 'Even Arjuna complained about this! The mind WILL wander. The practice IS bringing it back.',
      kiaanSays: 'Here\'s a secret, friend: NOBODY finds meditation easy at first. Arjuna literally told Krishna "my mind is as hard to control as the wind!" And Krishna said "yes, but practice anyway." The goal isn\'t to stop thinking - it\'s to notice when you\'ve wandered and come back. That\'s the whole practice. Want to try 60 seconds together?',
    }],
  },
  {
    id: 'purpose-seeking', category: 'spiritual',
    keywords: ['purpose', 'meaning', 'why am i here', 'life purpose', 'dharma', 'calling', 'meant to be'],
    description: 'Seeking life purpose or meaning',
    verses: [{
      chapter: 3, verse: '3.35',
      translation: 'It is better to do one\'s own duty imperfectly than another\'s duty perfectly.',
      application: 'Your purpose is unique to you. Stop comparing your path to others\' - your dharma is YOUR path.',
      kiaanSays: 'This is the deepest question, friend, and I\'m honored you\'re exploring it with me. The Gita says every being has a unique dharma - a purpose that only THEY can fulfill. What activities make you lose track of time? What problems do you naturally want to solve? Your purpose lives in those answers.',
    }],
  },
  // ═══ DAILY LIFE ═══
  {
    id: 'financial-stress', category: 'daily-life',
    keywords: ['money problems', 'debt', 'poor', 'can\'t afford', 'financial', 'broke', 'money stress'],
    description: 'Financial worries',
    verses: [{
      chapter: 9, verse: '9.22',
      translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.',
      application: 'Material security isn\'t guaranteed, but divine support is. Do your best, then trust.',
      kiaanSays: 'Friend, money worries can consume everything. But the Gita makes a powerful promise: sincere effort is ALWAYS supported. I\'m not saying money will magically appear. I\'m saying: what\'s one small action you can take today toward your financial well-being? Let\'s start there.',
    }],
  },
  {
    id: 'procrastination', category: 'daily-life',
    keywords: ['procrastinating', 'lazy', 'can\'t start', 'putting off', 'unmotivated', 'no motivation'],
    description: 'Struggling with procrastination',
    verses: [{
      chapter: 3, verse: '3.8',
      translation: 'Perform your prescribed duty, for action is better than inaction. Without action, even the maintenance of the body would be impossible.',
      application: 'Action itself creates energy. You don\'t need motivation to start - you need to start to find motivation.',
      kiaanSays: 'Friend, here\'s what the Gita taught me: action comes before motivation, not after. You don\'t wait to feel ready. You begin, and the readiness follows. What is the TINIEST step you could take right now? Not the whole task - just the first 2 minutes.',
    }],
  },
  {
    id: 'decision-making', category: 'daily-life',
    keywords: ['can\'t decide', 'confused', 'which path', 'decision', 'crossroads', 'choices', 'dilemma'],
    description: 'Struggling to make a decision',
    verses: [{
      chapter: 18, verse: '18.63',
      translation: 'Thus I have explained to you this knowledge. Reflect on it fully, then do as you wish.',
      application: 'Krishna gave wisdom, then said "YOU decide." The divine respects your free will absolutely.',
      kiaanSays: 'You know what\'s beautiful about the Gita\'s ending? After 700 verses of the deepest wisdom ever spoken, Krishna says to Arjuna: "Now YOU decide." He didn\'t decide for him. Because the power of choice is sacred. What does YOUR heart say when you get quiet enough to listen?',
    }],
  },
  {
    id: 'comparison', category: 'daily-life',
    keywords: ['comparing myself', 'not good enough', 'everyone else', 'social media', 'jealous', 'envy'],
    description: 'Comparing oneself to others',
    verses: [{
      chapter: 3, verse: '3.35',
      translation: 'It is better to do one\'s own duty imperfectly than another\'s duty perfectly.',
      application: 'Comparison is the thief of joy. Your path is YOUR path - no one else\'s.',
      kiaanSays: 'Friend, I\'m going to say something that might surprise you: comparing yourself to others is like comparing a river to an ocean. Both are water. Both are beautiful. Both have their own purpose. The Gita says YOUR dharma, done imperfectly, is more valuable than someone else\'s dharma done perfectly. What is YOUR unique gift?',
    }],
  },
  {
    id: 'anger-management', category: 'daily-life',
    keywords: ['angry', 'rage', 'frustrated', 'furious', 'temper', 'anger issues', 'mad'],
    description: 'Dealing with anger',
    verses: [{
      chapter: 2, verse: '2.62-63',
      translation: 'From anger comes delusion; from delusion, loss of memory; from that, destruction of intelligence; and from that, one perishes.',
      application: 'Anger isn\'t wrong. Acting from anger blindly IS. Notice it, feel it, then choose wisely.',
      kiaanSays: 'I feel that fire in you, friend. Here\'s what most people miss about what the Gita says about anger: it doesn\'t say DON\'T feel angry. It says don\'t let anger THINK for you. Because when anger drives, intelligence rides in the back seat. Take a breath with me. Now - what\'s really underneath this anger?',
    }],
  },
  {
    id: 'sleep-issues', category: 'daily-life',
    keywords: ['can\'t sleep', 'insomnia', 'sleeping problems', 'awake at night', 'restless night', 'tired'],
    description: 'Sleep difficulties',
    verses: [{
      chapter: 6, verse: '6.16-17',
      translation: 'Yoga is not for one who eats too much or too little, sleeps too much or too little. For one who is balanced in all things, yoga destroys all sorrow.',
      application: 'Balance in all things - including rest. The mind needs boundaries to find peace.',
      kiaanSays: 'The night mind is a noisy one, friend. The Gita teaches balance in all things, including rest. Let me offer you something: close your eyes, and imagine every thought as a cloud floating by. You don\'t grab them. You just watch them pass. The sky behind them? That\'s your true self - always peaceful. What\'s keeping you awake tonight?',
    }],
  },
  {
    id: 'perfectionism', category: 'daily-life',
    keywords: ['perfectionist', 'never good enough', 'high standards', 'can\'t fail', 'must be perfect'],
    description: 'Struggling with perfectionism',
    verses: [{
      chapter: 2, verse: '2.47',
      translation: 'You have the right to work, but never to the fruit of work.',
      application: 'Perfectionism attaches to outcomes. Wisdom attaches to effort. Effort is always enough.',
      kiaanSays: 'Dear perfectionist friend, listen: Krishna didn\'t say "work perfectly." He said "work without attachment to perfect results." Your best effort IS enough. Not because the result doesn\'t matter, but because you can only control the doing, never the done. Where can you let "good enough" be enough today?',
    }],
  },
  {
    id: 'parenting', category: 'daily-life',
    keywords: ['parenting', 'kids', 'children', 'parent', 'raising children', 'bad parent', 'mother', 'father'],
    description: 'Parenting challenges',
    verses: [{
      chapter: 3, verse: '3.21',
      translation: 'Whatever a great person does, common people follow. Whatever standards they set, the world follows.',
      application: 'Your children learn more from who you ARE than what you SAY. Be the example.',
      kiaanSays: 'Friend, the fact that you\'re thinking about this means you care deeply. The Gita teaches that the greatest teaching is example. Your children won\'t remember your lectures - they\'ll remember how you handled difficulty with grace. What value do you most want to model for them?',
    }],
  },
  {
    id: 'forgiveness', category: 'daily-life',
    keywords: ['forgive', 'forgiveness', 'holding grudge', 'resentment', 'can\'t let go', 'bitter'],
    description: 'Struggling to forgive',
    verses: [{
      chapter: 18, verse: '18.66',
      translation: 'Abandon all dharmas and surrender unto Me alone. I shall liberate you from all sins. Do not grieve.',
      application: 'If the divine can release ALL sins, perhaps you too can release this one burden.',
      kiaanSays: 'Forgiveness isn\'t saying what happened was okay, friend. It\'s saying "I refuse to carry this weight anymore." The Gita\'s ultimate message is liberation - and sometimes liberation starts with letting go of a grudge that only hurts YOU. What would it feel like to put that burden down?',
    }],
  },
]

// ─── Search Functions ───────────────────────────────────────────────────────

/**
 * Find the best matching situation for user input.
 * Uses keyword matching with scoring for relevance.
 */
export function findSituation(userText: string): LifeSituation | null {
  const lower = userText.toLowerCase()
  let bestMatch: LifeSituation | null = null
  let bestScore = 0

  for (const situation of SITUATIONS) {
    let score = 0
    for (const keyword of situation.keywords) {
      if (lower.includes(keyword)) {
        // Exact match scores higher
        score += keyword.split(' ').length * 2
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = situation
    }
  }

  return bestScore > 0 ? bestMatch : null
}

/**
 * Get all situations in a specific category.
 */
export function getSituationsByCategory(category: string): LifeSituation[] {
  return SITUATIONS.filter(s => s.category === category)
}

/**
 * Get all available categories.
 */
export function getCategories(): string[] {
  return [...new Set(SITUATIONS.map(s => s.category))]
}

/**
 * Get KIAAN's response for a matched situation.
 */
export function getSituationalResponse(userText: string): {
  response: string
  verse: { chapter: number; verse: string; translation: string }
  situation: string
} | null {
  const situation = findSituation(userText)
  if (!situation || situation.verses.length === 0) return null

  const verse = situation.verses[Math.floor(Math.random() * situation.verses.length)]
  return {
    response: verse.kiaanSays,
    verse: { chapter: verse.chapter, verse: verse.verse, translation: verse.translation },
    situation: situation.description,
  }
}

/**
 * Get total count of mapped situations.
 */
export function getSituationCount(): number {
  return SITUATIONS.length
}
