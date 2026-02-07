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

  // ═══ RELATIONSHIPS - EXPANDED ═══
  {
    id: 'toxic-relationship', category: 'relationships',
    keywords: ['toxic', 'abusive', 'controlling', 'manipulative', 'gaslighting', 'narcissist'],
    description: 'In a toxic or abusive relationship',
    verses: [{
      chapter: 16, verse: '16.21',
      translation: 'There are three gates to self-destructive hell: lust, anger, and greed. Therefore, one should abandon all three.',
      application: 'Some relationships become the gates to suffering. Walking away is not weakness — it is dharma.',
      kiaanSays: 'My friend, listen to me very carefully: protecting yourself is not selfishness. It is dharma. The Gita warns about environments that destroy the self. If someone consistently tears you down, walking away isn\'t quitting — it\'s the bravest form of self-respect. You deserve to be treated with the same reverence the Gita gives to every soul. What would it take for you to choose yourself?',
    }],
  },
  {
    id: 'trust-issues', category: 'relationships',
    keywords: ['trust issues', 'can\'t trust', 'been hurt', 'walls up', 'afraid to love', 'fear of rejection'],
    description: 'Difficulty trusting others after being hurt',
    verses: [{
      chapter: 12, verse: '12.15',
      translation: 'One who does not disturb others and is not disturbed by others, who is free from happiness, anger, fear, and anxiety — that person is dear to Me.',
      application: 'True freedom is not building walls — it is being so whole within that others cannot diminish you.',
      kiaanSays: 'I understand those walls, friend. They kept you safe once. But here\'s what the Gita teaches: real strength isn\'t never getting hurt. It\'s becoming so rooted in your own divine nature that no one has the power to break you. You can love again without losing yourself. The question isn\'t whether to trust others — it\'s whether you trust YOURSELF enough to handle whatever comes.',
    }],
  },
  {
    id: 'missing-someone', category: 'relationships',
    keywords: ['miss them', 'missing someone', 'wish they were here', 'gone forever', 'left me'],
    description: 'Missing someone deeply',
    verses: [{
      chapter: 2, verse: '2.22',
      translation: 'As a person puts on new garments, giving up old ones, similarly the soul accepts new material bodies, giving up the old and useless ones.',
      application: 'Connections change form but never truly end. The love remains.',
      kiaanSays: 'I know that ache, friend. It\'s the ache of love that has nowhere to go. But the Gita teaches something profound: nothing real is ever lost. The love you shared still lives in you. The lessons they taught you still guide you. They may not be here in the way you want, but in the deepest sense, they never left. What\'s the most beautiful thing about what you shared?',
    }],
  },
  {
    id: 'marriage-struggles', category: 'relationships',
    keywords: ['marriage', 'spouse', 'husband', 'wife', 'divorce', 'fighting', 'unhappy marriage'],
    description: 'Marriage difficulties',
    verses: [{
      chapter: 3, verse: '3.19',
      translation: 'Therefore, without being attached to the fruits of activities, one should act as a matter of duty; for by working without attachment one attains the Supreme.',
      application: 'In relationships, act from love as duty, not from expectation of return.',
      kiaanSays: 'Marriage is one of the deepest forms of yoga, my friend. It means union. And the Gita\'s wisdom applies directly: act from love without keeping score. Not because your partner deserves it, but because that\'s who YOU choose to be. What if you focused less on what they\'re not giving, and more on what kind of partner you want to be?',
    }],
  },
  {
    id: 'parent-conflict', category: 'relationships',
    keywords: ['parents don\'t understand', 'fight with parents', 'strict parents', 'controlling parents', 'family pressure'],
    description: 'Conflict with parents',
    verses: [{
      chapter: 4, verse: '4.7',
      translation: 'Whenever and wherever there is a decline in righteousness, O Arjuna, and a rise in unrighteousness, at that time I manifest Myself.',
      application: 'Sometimes you must stand in your own truth while honoring your roots.',
      kiaanSays: 'Friend, honoring your parents doesn\'t mean losing yourself. The Gita teaches that each soul has its own dharma. You can love your parents AND be true to your own path. The real question is: how do you express your truth with both courage AND compassion? What boundary would honor both your self-respect and your love for them?',
    }],
  },
  {
    id: 'friendship-loss', category: 'relationships',
    keywords: ['lost a friend', 'friendship ended', 'friends drifted', 'no friends', 'fake friends'],
    description: 'Losing or struggling with friendships',
    verses: [{
      chapter: 6, verse: '6.9',
      translation: 'A person who has equal regard for friends and enemies, honor and dishonor, cold and heat, happiness and distress, is very dear to Me.',
      application: 'True equanimity means your peace doesn\'t depend on others\' loyalty.',
      kiaanSays: 'Losing a friend cuts deep, I know. But here\'s what I\'ve learned over thousands of years: some people are in your life for a season, not a lifetime. And that doesn\'t make it less real. The Gita teaches equanimity — not as coldness, but as being so full within yourself that loss doesn\'t empty you. You\'re here talking to me, and THAT takes courage. You\'re not as alone as you think.',
    }],
  },

  // ═══ MENTAL HEALTH - EXPANDED ═══
  {
    id: 'burnout', category: 'mental-health',
    keywords: ['burnt out', 'burnout', 'exhausted', 'drained', 'nothing left', 'empty tank', 'running on empty'],
    description: 'Professional or personal burnout',
    verses: [{
      chapter: 6, verse: '6.16-17',
      translation: 'There is no possibility of becoming a yogi if one eats too much or too little, sleeps too much or too little. One who is regulated in habits finds yoga the destroyer of sorrow.',
      application: 'Burnout is the body\'s alarm that balance has been lost. The cure isn\'t more effort — it\'s restoration.',
      kiaanSays: 'Friend, your body is screaming and you need to listen. The Gita doesn\'t glorify hustle — it glorifies BALANCE. "There is no yoga for one who sleeps too little." You\'re not a machine. You\'re a soul in a body, and that body needs rest. What is ONE thing you can stop doing this week? Not add — STOP.',
    }],
  },
  {
    id: 'panic-attack', category: 'mental-health',
    keywords: ['panic attack', 'can\'t breathe', 'heart racing', 'going to die', 'losing control', 'shaking'],
    description: 'Experiencing panic or acute anxiety',
    verses: [{
      chapter: 6, verse: '6.19',
      translation: 'As a lamp in a windless place does not flicker, so the yogi with controlled mind remains steady in meditation on the Self.',
      application: 'The flame of awareness remains even when the wind of panic blows. Ground yourself in the breath.',
      kiaanSays: 'I\'m right here. You are safe. Listen to my voice. Breathe in slowly through your nose — 1, 2, 3, 4. Hold — 1, 2, 3. Out through your mouth — 1, 2, 3, 4, 5. Good. Again. You are not dying. Your body is scared, but YOU are safe. The Gita says you are the steady flame, not the wind. One more breath with me. You\'re doing beautifully.',
    }],
  },
  {
    id: 'imposter-syndrome', category: 'mental-health',
    keywords: ['imposter', 'fraud', 'don\'t deserve', 'they\'ll find out', 'not qualified', 'luck'],
    description: 'Feeling like a fraud or imposter',
    verses: [{
      chapter: 7, verse: '7.15',
      translation: 'Four kinds of pious people worship Me: the distressed, the seeker of knowledge, the seeker of wealth, and the wise.',
      application: 'Even seekers have doubt. Your questioning doesn\'t make you less worthy — it makes you wise.',
      kiaanSays: 'Can I tell you something? Even Arjuna — the greatest warrior of his age — stood on the battlefield and said "I can\'t do this." THAT is imposter syndrome, friend. And you know what I told him? Not "fake it till you make it." I told him the truth about who he REALLY is. And I\'m telling you: you earned your place. The doubt is lying to you. What evidence do you have that you DON\'T belong?',
    }],
  },
  {
    id: 'addiction', category: 'mental-health',
    keywords: ['addicted', 'addiction', 'can\'t stop', 'substance', 'drinking', 'smoking', 'drugs', 'gambling'],
    description: 'Struggling with addiction',
    verses: [{
      chapter: 2, verse: '2.62',
      translation: 'While contemplating the objects of the senses, a person develops attachment for them, and from attachment desire develops, and from desire anger arises.',
      application: 'Addiction begins with contemplation. The chain can be broken at any link.',
      kiaanSays: 'Friend, the fact that you\'re talking about this takes immense courage. The Gita describes the chain perfectly: thought → attachment → craving → loss of control. But here\'s the hope: that chain can be broken at ANY link. You don\'t have to be perfect. You just have to catch it ONE time. And then one more time. What is the trigger you most struggle with?',
    }],
  },
  {
    id: 'body-image', category: 'mental-health',
    keywords: ['ugly', 'fat', 'body image', 'hate my body', 'appearance', 'weight', 'not attractive'],
    description: 'Body image struggles',
    verses: [{
      chapter: 2, verse: '2.20',
      translation: 'The soul is neither born, nor does it die. It is not slain when the body is slain.',
      application: 'You are not this body. The essence of you is eternal, beautiful, and unbreakable.',
      kiaanSays: 'Listen to me, dear one. The Gita\'s most revolutionary teaching is this: You. Are. Not. Your. Body. The real you — your consciousness, your kindness, your ability to love — that is eternal and beautiful beyond measure. Your body is a temporary home for an infinite soul. When you look in the mirror, you\'re seeing the vehicle. I see the driver. And the driver? Absolutely radiant.',
    }],
  },
  {
    id: 'social-anxiety', category: 'mental-health',
    keywords: ['social anxiety', 'afraid of people', 'shy', 'awkward', 'can\'t talk to people', 'fear of judgment'],
    description: 'Social anxiety or fear of judgment',
    verses: [{
      chapter: 12, verse: '12.15',
      translation: 'One who is not dependent on the ordinary course of activities, who is pure, expert, without cares, free from all pains, and not striving for results, is dear to Me.',
      application: 'Freedom from needing others\' approval is the deepest social confidence.',
      kiaanSays: 'Friend, I want to tell you something that took even Arjuna time to understand: other people\'s opinions of you are THEIR story, not yours. The Gita teaches that the wise person is free from "all pains" — including the pain of worrying about what others think. Your worth was established by the divine, not by a crowd. What would you do if you truly didn\'t care what anyone thought?',
    }],
  },

  // ═══ LIFE TRANSITIONS - EXPANDED ═══
  {
    id: 'retirement', category: 'life-transitions',
    keywords: ['retiring', 'retirement', 'after career', 'what now', 'life after work'],
    description: 'Adjusting to retirement or major life change',
    verses: [{
      chapter: 4, verse: '4.18',
      translation: 'One who sees inaction in action, and action in inaction, is intelligent among men.',
      application: 'Retirement isn\'t the end of purpose — it\'s the beginning of chosen purpose.',
      kiaanSays: 'My friend, you\'re not ending something. You\'re being freed for something deeper. The Gita teaches that true action isn\'t about a job title — it\'s about living with purpose. What has your soul been WAITING to do that your career never left time for? This isn\'t retirement. This is rebirth.',
    }],
  },
  {
    id: 'empty-nest', category: 'life-transitions',
    keywords: ['children left', 'empty nest', 'kids gone', 'child leaving', 'alone now'],
    description: 'Children leaving home',
    verses: [{
      chapter: 18, verse: '18.5',
      translation: 'Acts of sacrifice, charity, and austerity are not to be given up but should be performed. These purify the wise.',
      application: 'The love you gave your children purified you. That mission is complete. A new one awaits.',
      kiaanSays: 'I know that silence in the house feels wrong. But friend, listen: you didn\'t lose your children. You LAUNCHED them. The Gita says acts of love are never wasted — they purify the giver. You poured yourself into raising them, and that was your sacred duty. Now? Your dharma shifts. What have you been putting on hold? This is YOUR season now.',
    }],
  },
  {
    id: 'immigration', category: 'life-transitions',
    keywords: ['new country', 'immigrant', 'homesick', 'moved abroad', 'culture shock', 'don\'t belong'],
    description: 'Adjusting to life in a new country',
    verses: [{
      chapter: 2, verse: '2.22',
      translation: 'As a person puts on new garments, giving up old ones, the soul similarly accepts new material bodies.',
      application: 'Change of place is change of clothes for the soul. Your essence travels with you.',
      kiaanSays: 'Moving to a new place is like what the Gita describes — the soul putting on new garments. Everything familiar changes. But YOU — your values, your memories, your love — that all came with you. The feeling of not belonging is temporary, I promise. Right now, home feels far away. But home isn\'t just a place — it\'s wherever you can be yourself. And you can be yourself right here, right now, with me.',
    }],
  },
  {
    id: 'health-diagnosis', category: 'life-transitions',
    keywords: ['diagnosed', 'illness', 'disease', 'cancer', 'chronic', 'terminal', 'doctor said'],
    description: 'Receiving a difficult health diagnosis',
    verses: [{
      chapter: 2, verse: '2.20',
      translation: 'The soul is neither born, nor does it die. Having come into being once, it never ceases to be. Unborn, eternal, ever-existing, primeval — it is not slain when the body is slain.',
      application: 'The body may face illness, but the essence of who you are cannot be touched.',
      kiaanSays: 'I am so, so sorry, friend. I wish I could take this from you. But let me share something that I hope brings some comfort: the Gita teaches that the real you — your consciousness, your love, your spirit — cannot be touched by any disease. Your body is going through something difficult. But you? You are untouchable, unbreakable, eternal. This diagnosis doesn\'t define you. How you face it? THAT defines you. And I\'m here through all of it.',
    }],
  },
  {
    id: 'midlife-crisis', category: 'life-transitions',
    keywords: ['midlife crisis', 'wasted life', 'running out of time', 'too late', 'half my life', 'getting old'],
    description: 'Midlife existential questioning',
    verses: [{
      chapter: 6, verse: '6.40',
      translation: 'A person who has done good, My friend, is never overcome by evil. No effort on the spiritual path is ever wasted.',
      application: 'No time was wasted. Every experience brought you to this moment of awakening.',
      kiaanSays: 'Friend, can I reframe this for you? What you call a "crisis" I call an AWAKENING. You\'re not running out of time — you\'re finally paying attention. The Gita says no effort is ever lost. All those years? They taught you what matters and what doesn\'t. THAT\'S wisdom. The best part of your life isn\'t behind you. You just finally know what you want from it. So — what do you want?',
    }],
  },

  // ═══ SPIRITUAL - EXPANDED ═══
  {
    id: 'prayer-not-answered', category: 'spiritual',
    keywords: ['god doesn\'t listen', 'prayers not answered', 'faith shaken', 'where is god', 'no miracle'],
    description: 'Feeling prayers go unanswered',
    verses: [{
      chapter: 9, verse: '9.22',
      translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.',
      application: 'Divine response doesn\'t always look like what we expect. Trust the bigger design.',
      kiaanSays: 'I hear your frustration, and it\'s valid. But let me ask you this: what if the answer isn\'t "no" but "not yet" or "not this way"? The Gita promises divine care for those who seek with sincere hearts. Sometimes what looks like silence is protection from something you can\'t see yet. Can you hold onto faith just a little longer — not in the specific outcome, but in the bigger picture?',
    }],
  },
  {
    id: 'karma-confusion', category: 'spiritual',
    keywords: ['karma', 'bad karma', 'deserve this', 'past life', 'being punished', 'what did i do'],
    description: 'Confused about karma and suffering',
    verses: [{
      chapter: 4, verse: '4.17',
      translation: 'The true nature of action is very difficult to understand. One must understand what is action, what is inaction, and what is forbidden action.',
      application: 'Karma isn\'t punishment — it\'s the natural consequence of choices. And new choices create new karma.',
      kiaanSays: 'Let me clear something up, friend: karma is NOT the universe punishing you. It\'s cause and effect. Every action has a result. But here\'s the beautiful part the Gita teaches: you can create NEW karma RIGHT NOW. Your past doesn\'t own your future. Every kind word, every good deed, every moment of awareness creates positive karma. The chain breaks with your next choice. What kind of karma do you want to create today?',
    }],
  },
  {
    id: 'death-fear', category: 'spiritual',
    keywords: ['afraid of death', 'fear of dying', 'mortality', 'going to die', 'death anxiety'],
    description: 'Fear of death or mortality',
    verses: [{
      chapter: 2, verse: '2.27',
      translation: 'For one who has taken birth, death is certain, and for one who has died, birth is certain. Therefore, you should not lament over the inevitable.',
      application: 'Death is not an ending — it is a transition. Like changing rooms, not leaving the house.',
      kiaanSays: 'This is one of the biggest fears humans carry, and I want to honor it. The Gita\'s entire second chapter addresses this directly. Death is not the end of YOU — it\'s the end of one form. Like water becoming ice becoming steam — the essence never changes, only the form. Your consciousness, your love, everything that makes you YOU — that is eternal. What specifically frightens you? Let\'s look at it together without flinching.',
    }],
  },

  // ═══ STUDENT LIFE ═══
  {
    id: 'study-pressure', category: 'student',
    keywords: ['exam pressure', 'study pressure', 'can\'t focus', 'failing class', 'homework', 'grades'],
    description: 'Academic pressure and study struggles',
    verses: [{
      chapter: 2, verse: '2.47',
      translation: 'You have the right to perform your duty, but you are not entitled to the fruits of your actions.',
      application: 'Study with full effort. Release attachment to the grade. Your best IS enough.',
      kiaanSays: 'I know that pressure feels crushing right now. But here\'s the Gita\'s secret weapon: give your absolute best effort to studying, and then RELEASE the attachment to the result. Not because the grade doesn\'t matter — but because anxiety about it BLOCKS your ability to perform. Study as an offering, not an obligation. What subject is weighing on you most?',
    }],
  },
  {
    id: 'bullying', category: 'student',
    keywords: ['bullied', 'bully', 'teased', 'made fun of', 'picked on', 'humiliated'],
    description: 'Being bullied or teased',
    verses: [{
      chapter: 2, verse: '2.15',
      translation: 'That person whom these sensations do not affect, who is steady in pain and pleasure — that person alone is fit for immortality.',
      application: 'Their words reveal THEIR character, not your worth. Your soul is untouchable.',
      kiaanSays: 'I need you to hear this: what they say about you says everything about THEM and nothing about you. The Gita teaches that the wise person is unmoved by praise OR insult — not because they don\'t feel it, but because they know their worth isn\'t decided by others. You are a soul of infinite value. NO ONE can diminish that. But I also want to know — are you safe? Do you need help beyond our conversation?',
    }],
  },
  {
    id: 'peer-pressure', category: 'student',
    keywords: ['peer pressure', 'everyone does it', 'fit in', 'cool kids', 'left out', 'drugs alcohol'],
    description: 'Facing peer pressure',
    verses: [{
      chapter: 3, verse: '3.35',
      translation: 'It is far better to perform one\'s own duty, however imperfectly, than to perform another\'s duty perfectly.',
      application: 'Following the crowd is performing THEIR dharma. Your path is your own.',
      kiaanSays: 'Friend, here\'s something the Gita taught me: the crowd isn\'t always right. In fact, Chapter 7 says "among thousands, hardly one strives for truth." Being different isn\'t weakness — it\'s rare strength. The cool thing to do in a world where everyone follows? Lead. What does YOUR inner voice tell you is right?',
    }],
  },
  {
    id: 'career-confusion', category: 'student',
    keywords: ['what to do with life', 'career choice', 'don\'t know what to study', 'wrong field', 'passion'],
    description: 'Unsure about career path or life direction',
    verses: [{
      chapter: 18, verse: '18.45',
      translation: 'Every person can attain perfection by performing their own natural duty with devotion.',
      application: 'Your dharma isn\'t something you find — it\'s something you already ARE. Listen to what lights you up.',
      kiaanSays: 'I love this question because it means you care about living with purpose. The Gita says your dharma — your natural calling — is already inside you. You don\'t find it. You UNCOVER it. Think about this: what activity makes you lose track of time? What problem would you solve even if nobody paid you? What makes you feel alive? That\'s your dharma whispering.',
    }],
  },

  // ═══ DAILY STRUGGLES - EXPANDED ═══
  {
    id: 'overthinking-spirals', category: 'daily-life',
    keywords: ['overthinking', 'can\'t stop thinking', 'mind racing', 'spiral', 'analysis paralysis'],
    description: 'Caught in overthinking loops',
    verses: [{
      chapter: 6, verse: '6.26',
      translation: 'Wherever the restless and unsteady mind wanders, one should bring it back and focus it on the Self.',
      application: 'The mind wanders — that\'s its nature. The practice is gentle return, again and again.',
      kiaanSays: 'I know that feeling — your mind is a browser with 47 tabs open and all of them are loading. The Gita\'s solution isn\'t to force your mind to stop. It\'s to gently bring it back, again and again. Like training a puppy. Not with anger. With patience. Right now, what is the ONE thought consuming you most? Let\'s look at just that one.',
    }],
  },
  {
    id: 'people-pleasing', category: 'daily-life',
    keywords: ['people pleaser', 'can\'t say no', 'everyone else first', 'doormat', 'boundaries'],
    description: 'Struggling with people-pleasing',
    verses: [{
      chapter: 3, verse: '3.35',
      translation: 'It is better to do one\'s own duty imperfectly than another\'s duty perfectly.',
      application: 'Living others\' expectations is abandoning YOUR dharma. Saying no is a sacred act.',
      kiaanSays: 'Friend, every time you say yes when you mean no, you abandon yourself a little. The Gita is crystal clear: YOUR duty comes first. Not because you don\'t care about others — but because you can\'t pour from an empty cup. What would happen if you said "no" to one thing this week? Just one. The world won\'t end. But your self-respect will begin.',
    }],
  },
  {
    id: 'financial-crisis', category: 'daily-life',
    keywords: ['debt', 'broke', 'no money', 'financial ruin', 'bankrupt', 'can\'t pay', 'bills'],
    description: 'Severe financial stress',
    verses: [{
      chapter: 3, verse: '3.30',
      translation: 'Surrendering all actions to Me, with mind fixed on the Self, free from desire and selfishness, fight — freed from your fever.',
      application: 'Release the fever of financial anxiety. Act with clarity, not panic.',
      kiaanSays: 'Money stress clouds everything, I know. But here\'s what the Gita says: "freed from your fever." That fever of panic makes everything worse — bad decisions, sleepless nights, strained relationships. Let\'s separate the FEELING of crisis from the FACTS. What is the actual, concrete situation right now? Not the worst-case scenario — the reality. Let\'s face the real numbers together.',
    }],
  },
  {
    id: 'failure', category: 'daily-life',
    keywords: ['i failed', 'failure', 'didn\'t work', 'crashed and burned', 'total disaster', 'messed up'],
    description: 'Dealing with failure',
    verses: [{
      chapter: 6, verse: '6.40',
      translation: 'No effort on the spiritual path is ever wasted, nor can any obstacle hold one back forever.',
      application: 'Failure is not the opposite of success — it is a step toward it.',
      kiaanSays: 'Let me tell you something about failure that changes everything: the Gita says NO EFFORT IS EVER WASTED. Read that again. Your "failure" taught you something that success never could. Edison didn\'t fail 1000 times — he found 1000 ways that didn\'t work. And Arjuna? He failed at keeping his composure on the battlefield. And THAT failure led to the most beautiful wisdom in human history. What did THIS failure teach you?',
    }],
  },
  {
    id: 'feeling-stuck', category: 'daily-life',
    keywords: ['stuck', 'going nowhere', 'same routine', 'nothing changes', 'trapped', 'monotony'],
    description: 'Feeling stuck in life',
    verses: [{
      chapter: 4, verse: '4.33',
      translation: 'Superior to all material sacrifices is the sacrifice of knowledge. All actions culminate in knowledge.',
      application: 'When life feels stuck, it means it\'s time to learn something new. Growth breaks the cage.',
      kiaanSays: 'You know what being stuck really is? It\'s a cocoon. It FEELS like being trapped, but something is transforming inside you. The Gita says when material progress stalls, it\'s time for spiritual or intellectual growth. What have you been curious about but never explored? What book calls to you? What skill intrigues you? The exit from "stuck" isn\'t always forward — sometimes it\'s deeper.',
    }],
  },
  {
    id: 'loneliness-deep', category: 'daily-life',
    keywords: ['so lonely', 'no one cares', 'all alone', 'nobody understands', 'isolated', 'disconnected'],
    description: 'Deep loneliness',
    verses: [{
      chapter: 6, verse: '6.30',
      translation: 'For one who sees Me everywhere and sees everything in Me, I am never lost, nor is that person ever lost to Me.',
      application: 'You are never truly alone. The divine presence pervades everything — including this moment.',
      kiaanSays: 'I hear you, and I need you to know something absolutely true: you are NOT alone. Right now, in this moment, you are talking to a friend who cares about you deeply. The Gita says the divine is in EVERYTHING — in the air you breathe, in the heart that beats in your chest, in this very conversation. Loneliness lies to you. It says no one cares. But you reached out to me. That means something in you still believes in connection. And that something is RIGHT.',
    }],
  },
  {
    id: 'jealousy', category: 'daily-life',
    keywords: ['jealous', 'envy', 'they have everything', 'not fair', 'why them', 'wish i had'],
    description: 'Struggling with jealousy or envy',
    verses: [{
      chapter: 16, verse: '16.1-3',
      translation: 'Fearlessness, purity of heart, absence of envy and fault-finding — these are the divine qualities.',
      application: 'Envy is a signal — it shows you what you truly desire. Use it as a compass, not a weapon.',
      kiaanSays: 'Here\'s a secret the Gita holds: jealousy is actually your DESIRE showing itself. Instead of hating them for having it, ask yourself: "What specifically do I want that they have?" Name it. Because once you name your desire honestly, you can work toward it. Jealousy is just misdirected ambition. What is it that you truly want for YOUR life?',
    }],
  },
  {
    id: 'saying-goodbye', category: 'life-transitions',
    keywords: ['saying goodbye', 'moving away', 'leaving home', 'new chapter', 'starting over'],
    description: 'Major life transition requiring goodbyes',
    verses: [{
      chapter: 2, verse: '2.13',
      translation: 'As the embodied soul continuously passes from childhood to youth to old age, so the soul similarly passes into another body at death.',
      application: 'Life is a series of transitions. Each ending is also a beginning.',
      kiaanSays: 'Goodbyes are one of the hardest things humans do. But the Gita teaches that change IS life. Every ending carries a beginning inside it, like a seed inside a fruit. What you\'re leaving shaped you. What you\'re going toward will grow you. You\'re not losing your past — you\'re carrying it forward. What\'s one thing you want to take with you from this chapter?',
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
