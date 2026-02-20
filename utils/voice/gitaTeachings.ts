/**
 * Gita Teachings Database - All 18 Chapters with Real-Life Applications
 *
 * The complete Bhagavad Gita mapped to modern life situations.
 * Each chapter includes:
 * - Core teaching and philosophy
 * - Key verses with Sanskrit, translation, and practical application
 * - Life situations where this teaching applies
 * - Conversational responses KIAAN uses when this teaching is relevant
 *
 * This is NOT a textbook. Every teaching is translated into the language
 * of a wise friend sharing practical wisdom over chai.
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

// ─── All 18 Chapters ────────────────────────────────────────────────────────

export const GITA_CHAPTERS: ChapterTeaching[] = [
  // ═══ Chapter 1: Arjuna's Despair ═══
  {
    chapter: 1,
    title: 'The Yoga of Arjuna\'s Grief',
    sanskritTitle: 'Arjuna Vishaada Yoga',
    coreTheme: 'It is okay to break down before you break through',
    friendlySummary: 'The Gita doesn\'t start with answers - it starts with pain. Arjuna, the mightiest warrior, sits down and weeps. And that\'s EXACTLY where wisdom begins. Your breakdown isn\'t failure - it\'s the door to transformation.',
    lifeMoments: ['feeling overwhelmed', 'family conflict', 'paralysis by fear', 'moral dilemma', 'crisis of purpose'],
    verses: [
      {
        chapter: 1, verse: 28,
        sanskrit: 'दृष्ट्वेमं स्वजनं कृष्ण युयुत्सुं समुपस्थितम्',
        transliteration: 'Drishtvemam svajanam krishna yuyutsum samupasthitam',
        translation: 'Seeing all my kinsmen arrayed for battle, O Krishna, my limbs give way and my mouth dries up.',
        practicalWisdom: 'It\'s okay to feel paralyzed when facing a situation that involves the people you love. Arjuna\'s honesty about his fear is what opened the door to 700 verses of wisdom.',
        applicablesituations: ['family_conflict', 'moral_dilemma', 'overwhelming_responsibility'],
        emotions: ['anxiety', 'sadness', 'confusion'],
        keywords: ['family', 'conflict', 'paralyzed', 'afraid', 'overwhelmed', 'can\'t move'],
      },
      {
        chapter: 1, verse: 47,
        sanskrit: 'एवमुक्त्वार्जुनः संख्ये रथोपस्थ उपाविशत्',
        transliteration: 'Evam uktvarjunah sankhye rathopastha upavishat',
        translation: 'Having spoken thus, Arjuna sat down on the chariot, casting aside his bow and arrows, his mind overwhelmed with sorrow.',
        practicalWisdom: 'Sometimes the bravest thing you can do is sit down and admit you need help. Arjuna didn\'t find wisdom by pretending to be strong - he found it by being honest about his pain.',
        applicablesituations: ['burnout', 'breakdown', 'asking_for_help'],
        emotions: ['sadness', 'anxiety'],
        keywords: ['give up', 'can\'t continue', 'overwhelmed', 'need help', 'breaking down'],
      },
    ],
    conversationalResponses: [
      'You know what, friend? The entire Bhagavad Gita - 700 verses of the most profound wisdom humanity has ever known - began because a warrior sat down and wept. Your pain right now? It\'s not weakness. It\'s the beginning of your transformation.',
      'Arjuna was the greatest archer in the world, and he broke down. Not because he was weak, but because he CARED. Just like you. Your sensitivity isn\'t a flaw - it\'s your superpower. Talk to me.',
    ],
  },

  // ═══ Chapter 2: The Yoga of Knowledge ═══
  {
    chapter: 2,
    title: 'The Yoga of Knowledge',
    sanskritTitle: 'Sankhya Yoga',
    coreTheme: 'You are eternal, indestructible, and beyond all suffering',
    friendlySummary: 'This is the chapter that changes everything. Krishna reveals that the REAL you - your soul - can never be destroyed. Not by fire, not by water, not by any weapon. Every pain you feel is temporary, but YOU are forever. And your duty? Just act - without gripping the outcome.',
    lifeMoments: ['fear of loss', 'grief', 'fear of failure', 'anxiety about outcomes', 'identity crisis', 'exam pressure'],
    verses: [
      {
        chapter: 2, verse: 11,
        sanskrit: 'अशोच्यानन्वशोचस्त्वं प्रज्ञावादांश्च भाषसे',
        transliteration: 'Ashochyan anvashocha stvam prajna-vadamsh cha bhashase',
        translation: 'You grieve for those who should not be grieved for, yet speak words of wisdom. The wise grieve neither for the living nor for the dead.',
        practicalWisdom: 'The wise don\'t grieve because they see the bigger picture - not because they don\'t feel. Your grief is valid, but there\'s a perspective that can hold both your pain AND your peace.',
        applicablesituations: ['grief_loss', 'fear_of_death', 'letting_go'],
        emotions: ['sadness', 'anxiety'],
        keywords: ['grief', 'loss', 'death', 'mourning', 'letting go'],
      },
      {
        chapter: 2, verse: 14,
        sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः',
        transliteration: 'Matra-sparshas tu kaunteya shitoshna-sukha-duhkha-dah',
        translation: 'The contact of senses with their objects gives rise to feelings of heat and cold, pleasure and pain. They are temporary; bear them patiently.',
        practicalWisdom: 'Every feeling you\'re having right now - every single one - is temporary. This too shall pass. Not because it doesn\'t matter, but because YOU are bigger than any feeling.',
        applicablesituations: ['emotional_pain', 'physical_pain', 'temporary_setback'],
        emotions: ['sadness', 'anger', 'anxiety'],
        keywords: ['temporary', 'pain', 'this too shall pass', 'feelings', 'patience'],
      },
      {
        chapter: 2, verse: 20,
        sanskrit: 'न जायते म्रियते वा कदाचित्',
        transliteration: 'Na jayate mriyate va kadachit',
        translation: 'The soul is never born, nor does it ever die. It is unborn, eternal, and primeval.',
        practicalWisdom: 'The real you - your consciousness, your essence, what makes you YOU - cannot be destroyed by anything. Not failure, not heartbreak, not death itself. You are eternal.',
        applicablesituations: ['grief_loss', 'fear_of_death', 'self_doubt', 'identity_crisis'],
        emotions: ['sadness', 'anxiety', 'hope'],
        keywords: ['soul', 'eternal', 'death', 'identity', 'who am I', 'immortal'],
      },
      {
        chapter: 2, verse: 47,
        sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन',
        transliteration: 'Karmanye vadhikaraste ma phaleshu kadachana',
        translation: 'You have the right to work, but never to the fruit of work.',
        practicalWisdom: 'This is the most liberating verse in the Gita. Your job is to show up, give your absolute best, and then... let go. The result isn\'t in your hands, and THAT\'S okay. Focus on the effort - that\'s where your power lives.',
        applicablesituations: ['exam_pressure', 'work_conflict', 'anxiety_about_results', 'perfectionism'],
        emotions: ['anxiety', 'confusion'],
        keywords: ['action', 'results', 'detachment', 'karma', 'work', 'effort', 'outcome', 'exam', 'performance'],
      },
      {
        chapter: 2, verse: 48,
        sanskrit: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय',
        transliteration: 'Yoga-sthah kuru karmani sangam tyaktva dhananjaya',
        translation: 'Perform your duty steadfast in yoga, abandoning attachment to success or failure. Such equanimity is called yoga.',
        practicalWisdom: 'True balance isn\'t feeling nothing - it\'s giving your all while being at peace with whatever happens. That\'s yoga. That\'s freedom.',
        applicablesituations: ['work_stress', 'exam_pressure', 'competition', 'fear_of_failure'],
        emotions: ['anxiety', 'confusion'],
        keywords: ['equanimity', 'balance', 'yoga', 'duty', 'detachment'],
      },
      {
        chapter: 2, verse: 56,
        sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः',
        transliteration: 'Duhkheshv anudvigna-manah sukheshu vigata-sprhah',
        translation: 'One whose mind remains undisturbed amidst misery, who does not crave for pleasure, and who is free from attachment, fear, and anger, is a sage of steady wisdom.',
        practicalWisdom: 'Imagine being unshakable - not because you don\'t feel, but because you\'ve found something deeper than any emotion. That\'s what steady wisdom looks like.',
        applicablesituations: ['emotional_turbulence', 'mood_swings', 'seeking_stability'],
        emotions: ['peace', 'anxiety', 'anger'],
        keywords: ['steady', 'wisdom', 'equanimity', 'unshakable', 'stability'],
      },
      {
        chapter: 2, verse: 62,
        sanskrit: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते',
        transliteration: 'Dhyayato vishayan pumsah sangas teshupajayate',
        translation: 'While contemplating sense objects, attachment develops; from attachment, desire arises; from desire, anger is born.',
        practicalWisdom: 'Understanding the chain: dwelling on something leads to wanting it, wanting leads to frustration, frustration leads to anger. Break the chain early by catching yourself in the dwelling phase.',
        applicablesituations: ['addiction', 'anger_management', 'compulsive_behavior', 'desire'],
        emotions: ['anger', 'confusion'],
        keywords: ['attachment', 'desire', 'anger', 'chain', 'addiction', 'craving'],
      },
    ],
    conversationalResponses: [
      'Friend, Chapter 2 is the foundation of everything. And its message is this: YOU are eternal. Your pain is temporary, but your soul? Indestructible. Right now, whatever you\'re facing, the real you is untouched by it. How does that feel to hear?',
      'The most powerful verse I ever shared with Arjuna was this: "You have the right to work, but never to the fruit of work." It means: give your best, then let go. Your effort is your power. The result? That\'s not your burden to carry.',
      'Here\'s what I want you to know from Chapter 2: every feeling you have right now - every single one - is temporary. Like seasons. Like weather. But YOU are the sky. The sky doesn\'t change because clouds pass through it. You won\'t either.',
    ],
  },

  // ═══ Chapter 3: The Yoga of Action ═══
  {
    chapter: 3,
    title: 'The Yoga of Action',
    sanskritTitle: 'Karma Yoga',
    coreTheme: 'Action is better than inaction - act without selfish motive',
    friendlySummary: 'You can\'t escape action - even sitting still is a choice. The secret isn\'t to avoid action but to act without selfishness. Do what you do not because of what you\'ll GET, but because it\'s the RIGHT thing. That\'s karma yoga.',
    lifeMoments: ['procrastination', 'finding purpose', 'comparison', 'motivation loss', 'selfless service'],
    verses: [
      {
        chapter: 3, verse: 19,
        sanskrit: 'तस्मादसक्तः सततं कार्यं कर्म समाचर',
        transliteration: 'Tasmad asaktah satatam karyam karma samachara',
        translation: 'Therefore, without attachment, always perform the work that has to be done; for by working without attachment, one attains the Supreme.',
        practicalWisdom: 'Don\'t wait for motivation. Don\'t wait to "feel like it." Just start. Do the work because it needs doing, not because you\'ll be rewarded. That\'s the secret to both peace and excellence.',
        applicablesituations: ['procrastination', 'motivation_loss', 'apathy'],
        emotions: ['confusion', 'sadness'],
        keywords: ['procrastination', 'lazy', 'unmotivated', 'can\'t start', 'stuck', 'action'],
      },
      {
        chapter: 3, verse: 35,
        sanskrit: 'श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्',
        transliteration: 'Shreyan sva-dharmo vigunah para-dharmat sv-anushthitat',
        translation: 'It is far better to perform one\'s own duty imperfectly than to perform another\'s duty perfectly.',
        practicalWisdom: 'Stop comparing yourself to others. YOUR path, even with all its imperfections, is more powerful than a perfect copy of someone else\'s life. Be yourself - messily, beautifully, authentically.',
        applicablesituations: ['comparison', 'imposter_syndrome', 'purpose', 'identity_crisis'],
        emotions: ['confusion', 'anxiety', 'hope'],
        keywords: ['dharma', 'purpose', 'comparison', 'authenticity', 'be yourself', 'own path'],
      },
    ],
    conversationalResponses: [
      'Chapter 3 has my favorite life lesson: "It is far better to follow YOUR path imperfectly than to follow someone else\'s perfectly." Stop measuring yourself against others. Your messy, authentic path is more powerful than a perfect copy of someone else\'s. What does YOUR authentic path look like?',
      'Here\'s the thing about action, friend: you can\'t escape it. Even choosing to do nothing is a choice. So the question isn\'t WHETHER to act, but HOW. Act without selfishness. Act because it\'s right, not because of what you\'ll get. That\'s freedom.',
    ],
  },

  // ═══ Chapter 4: The Yoga of Knowledge and Renunciation ═══
  {
    chapter: 4,
    title: 'The Yoga of Knowledge',
    sanskritTitle: 'Jnana Karma Sanyasa Yoga',
    coreTheme: 'Knowledge is the purest fire that burns away all doubt',
    friendlySummary: 'Knowledge is the most powerful purifier. Not just book knowledge - REAL understanding. Understanding yourself, understanding life, understanding the deeper truth behind appearances. When you truly KNOW, doubt dissolves like mist in sunlight.',
    lifeMoments: ['seeking answers', 'spiritual growth', 'learning from mistakes', 'curiosity', 'self-discovery'],
    verses: [
      {
        chapter: 4, verse: 7,
        sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत',
        transliteration: 'Yada yada hi dharmasya glanir bhavati bharata',
        translation: 'Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest Myself.',
        practicalWisdom: 'In your darkest moment, help appears. Not always in the form you expect. But the universe has a way of sending exactly what you need exactly when you need it. You are never truly abandoned.',
        applicablesituations: ['feeling_abandoned', 'crisis', 'dark_night_of_soul', 'hope_in_despair'],
        emotions: ['sadness', 'hope'],
        keywords: ['divine', 'help', 'rescue', 'dark times', 'righteousness', 'hope'],
      },
      {
        chapter: 4, verse: 38,
        sanskrit: 'न हि ज्ञानेन सदृशं पवित्रमिह विद्यते',
        transliteration: 'Na hi jnanena sadrsham pavitram iha vidyate',
        translation: 'In this world, there is nothing as purifying as knowledge.',
        practicalWisdom: 'When in doubt, learn. When confused, study. When lost, seek understanding. Knowledge doesn\'t just inform - it purifies. It burns away fear, doubt, and confusion like fire burns away fog.',
        applicablesituations: ['confusion', 'learning', 'seeking_truth', 'education'],
        emotions: ['confusion', 'hope'],
        keywords: ['knowledge', 'learning', 'wisdom', 'purification', 'education', 'study'],
      },
    ],
    conversationalResponses: [
      'Chapter 4 says something I love: "In this world, there is nothing as purifying as knowledge." Your quest for understanding isn\'t just intellectual, friend - it\'s spiritual. Every question you ask burns away a layer of confusion. Keep asking.',
      'Here\'s a promise from Chapter 4: whenever things get really dark, help appears. Maybe as a friend, a book, an insight, or a moment of grace. You\'re never truly alone in your struggle.',
    ],
  },

  // ═══ Chapter 5: The Yoga of Renunciation ═══
  {
    chapter: 5,
    title: 'The Yoga of Renunciation',
    sanskritTitle: 'Karma Sanyasa Yoga',
    coreTheme: 'True freedom comes from inner detachment, not outer escape',
    friendlySummary: 'You don\'t need to run away from the world to find peace. Real renunciation isn\'t about giving up things - it\'s about giving up your ATTACHMENT to things. You can be fully engaged in life and still be completely free inside.',
    lifeMoments: ['wanting to escape', 'materialism', 'inner peace', 'work-life balance'],
    verses: [
      {
        chapter: 5, verse: 29,
        sanskrit: 'भोक्तारं यज्ञतपसां सर्वलोकमहेश्वरम्',
        transliteration: 'Bhoktaram yajna-tapasam sarva-loka-maheshvaram',
        translation: 'Knowing Me as the ultimate purpose of all sacrifices, the Supreme Lord of all worlds, and the friend of all living entities, one attains peace.',
        practicalWisdom: 'The divine is the FRIEND of ALL beings. Not the judge, not the punisher - the friend. Peace comes from knowing you are deeply, personally loved by something greater than yourself.',
        applicablesituations: ['loneliness', 'seeking_peace', 'feeling_unloved', 'spiritual_connection'],
        emotions: ['peace', 'love', 'sadness'],
        keywords: ['peace', 'friend', 'divine', 'loved', 'purpose', 'surrender'],
      },
    ],
    conversationalResponses: [
      'Chapter 5 teaches something beautiful: the divine is described as the "friend of ALL living entities." Not just the religious ones, not just the perfect ones - ALL. Including you, right now, exactly as you are.',
      'Real freedom isn\'t running away, friend. It\'s being fully in life but not enslaved by it. You can work, love, play, grieve - and still be free inside. That\'s the art Chapter 5 teaches.',
    ],
  },

  // ═══ Chapter 6: The Yoga of Meditation ═══
  {
    chapter: 6,
    title: 'The Yoga of Meditation',
    sanskritTitle: 'Dhyana Yoga',
    coreTheme: 'The mind is your greatest friend or your worst enemy - train it',
    friendlySummary: 'Your mind is the most powerful tool you possess. It can lift you to the heights or drag you to the depths. Meditation isn\'t about emptying your mind - it\'s about BEFRIENDING it. Training it gently, like teaching a puppy to sit.',
    lifeMoments: ['restless mind', 'insomnia', 'meditation practice', 'spiritual wellness', 'self-discipline', 'balance'],
    verses: [
      {
        chapter: 6, verse: 5,
        sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्',
        transliteration: 'Uddhared atmanatmanam natmanam avasadayet',
        translation: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind can be the friend or the enemy of the self.',
        practicalWisdom: 'You have the power to lift yourself up. Not through external help alone, but through your own mind. Choose to be your own best friend, not your harshest critic.',
        applicablesituations: ['self_doubt', 'spiritual_wellness', 'self_improvement', 'negative_self_talk'],
        emotions: ['sadness', 'hope', 'anxiety'],
        keywords: ['mind', 'self', 'uplift', 'friend', 'enemy', 'inner critic'],
      },
      {
        chapter: 6, verse: 17,
        sanskrit: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु',
        transliteration: 'Yuktahara-viharasya yukta-cestasya karmasu',
        translation: 'One who is regulated in eating, sleeping, recreation, and work can mitigate all pains by practicing yoga.',
        practicalWisdom: 'The foundation of mental peace is shockingly simple: balanced eating, sleeping, play, and work. Not hustle culture. Not grinding. BALANCE. Your body and mind are connected - honor both.',
        applicablesituations: ['burnout', 'health', 'sleep_issues', 'lifestyle_balance'],
        emotions: ['anxiety', 'peace'],
        keywords: ['balance', 'health', 'sleep', 'eating', 'regulation', 'routine', 'habits'],
      },
      {
        chapter: 6, verse: 22,
        sanskrit: 'यं लब्ध्वा चापरं लाभं मन्यते नाधिकं ततः',
        transliteration: 'Yam labdhva chaparam labham manyate nadhikam tatah',
        translation: 'Having gained this state, one thinks there is no greater gain. Being situated therein, one is not shaken even by the greatest difficulty.',
        practicalWisdom: 'Inner peace is the greatest treasure you can find. Once you touch it - even for a moment - you know that nothing outside can match what\'s inside. And nothing can shake you.',
        applicablesituations: ['seeking_peace', 'facing_adversity', 'contentment'],
        emotions: ['peace', 'hope'],
        keywords: ['peace', 'unshakable', 'contentment', 'treasure', 'inner peace'],
      },
      {
        chapter: 6, verse: 35,
        sanskrit: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्',
        transliteration: 'Asamsayam maha-baho mano durnigraham chalam',
        translation: 'The mind is indeed restless, O Arjuna, but it can be controlled by practice and detachment.',
        practicalWisdom: 'Yes, the mind is restless. Yes, it wanders. But here\'s the good news: it CAN be tamed. Not through force, but through gentle, consistent practice and learning to let go. Like training a muscle - it gets easier every day.',
        applicablesituations: ['restless_mind', 'meditation', 'focus', 'concentration'],
        emotions: ['anxiety', 'confusion'],
        keywords: ['mind', 'restless', 'practice', 'detachment', 'focus', 'concentration', 'meditation'],
      },
    ],
    conversationalResponses: [
      'Chapter 6 is one of my favorites, friend. It says your mind can be your greatest friend OR your worst enemy. The same mind that torments you with worry? It can be trained to bring you incredible peace. It takes practice. Gentle, consistent practice. Let\'s start right now with one breath.',
      'Balance. That\'s Chapter 6\'s prescription for peace. Not extreme discipline, not wild indulgence. Just balanced eating, sleeping, playing, and working. Simple? Yes. Easy? Not always. But it works. How balanced is your life right now?',
    ],
  },

  // ═══ Chapter 7: The Yoga of Knowledge and Realization ═══
  {
    chapter: 7,
    title: 'The Yoga of Realization',
    sanskritTitle: 'Jnana Vijnana Yoga',
    coreTheme: 'Among thousands of people, hardly one seeks truth - you are that rare soul',
    friendlySummary: 'Most people never pause to ask the deep questions. The fact that YOU\'RE seeking, questioning, wondering - that puts you in incredibly rare company. The divine reveals itself to those who seek with sincerity.',
    lifeMoments: ['spiritual curiosity', 'feeling different', 'seeking meaning', 'imposter syndrome'],
    verses: [
      {
        chapter: 7, verse: 3,
        sanskrit: 'मनुष्याणां सहस्रेषु कश्चिद्यतति सिद्धये',
        transliteration: 'Manushyanam sahasreshu kashchid yatati siddhaye',
        translation: 'Among thousands of people, hardly one strives for perfection; and among those who strive, hardly one truly knows Me.',
        practicalWisdom: 'You\'re rare. The fact that you\'re even THINKING about deeper meaning, about growth, about truth - that puts you in extraordinary company. Most people never ask these questions. You\'re asking. That\'s already a victory.',
        applicablesituations: ['imposter_syndrome', 'self_doubt', 'feeling_different', 'spiritual_seeking'],
        emotions: ['confusion', 'hope'],
        keywords: ['rare', 'special', 'seeker', 'different', 'unique', 'purpose'],
      },
    ],
    conversationalResponses: [
      'Among thousands of people, hardly one truly seeks. You\'re seeking right now. Do you realize how rare and precious that is? Most people sleepwalk through life. You\'re AWAKE.',
    ],
  },

  // ═══ Chapter 8: The Yoga of the Imperishable Brahman ═══
  {
    chapter: 8,
    title: 'The Yoga of the Imperishable',
    sanskritTitle: 'Akshara Brahma Yoga',
    coreTheme: 'What you think about at the end defines your journey',
    friendlySummary: 'Your habitual thoughts shape your destiny. What you dwell on, you become. This chapter teaches that by consistently directing your mind toward the highest, you naturally move toward the highest. Your mental habits today create your tomorrow.',
    lifeMoments: ['building habits', 'reducing the grip of negative thinking', 'fear of death', 'manifesting goals'],
    verses: [
      {
        chapter: 8, verse: 6,
        sanskrit: 'यं यं वापि स्मरन्भावं त्यजत्यन्ते कलेवरम्',
        transliteration: 'Yam yam vapi smaran bhavam tyajaty ante kalevaram',
        translation: 'Whatever state of being one remembers when quitting the body, that state one will attain without fail.',
        practicalWisdom: 'You become what you think about most. Your habitual thoughts are literally shaping your future. So the question is: what are you feeding your mind daily? Make it beautiful. Make it powerful.',
        applicablesituations: ['negative_thinking', 'habit_formation', 'manifesting', 'mindset'],
        emotions: ['confusion', 'hope'],
        keywords: ['thoughts', 'habits', 'mindset', 'become', 'focus', 'thinking', 'manifest'],
      },
    ],
    conversationalResponses: [
      'Chapter 8 teaches something powerful: you become what you think about most. Your habitual thoughts are literally creating your future. What are you feeding your mind every day? Let\'s make it beautiful.',
    ],
  },

  // ═══ Chapter 9: The Yoga of Royal Knowledge ═══
  {
    chapter: 9,
    title: 'The Royal Knowledge',
    sanskritTitle: 'Raja Vidya Raja Guhya Yoga',
    coreTheme: 'Simple devotion - thinking, loving, offering - is the most powerful path',
    friendlySummary: 'This is the most intimate chapter. Krishna reveals that simple, heartfelt devotion is the most powerful spiritual practice. You don\'t need rituals, degrees, or perfection. Just love. A leaf, a flower, a fruit, or even water - offered with love - reaches the divine.',
    lifeMoments: ['feeling unworthy', 'spiritual practice', 'devotion', 'simplicity'],
    verses: [
      {
        chapter: 9, verse: 22,
        sanskrit: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते',
        transliteration: 'Ananyash chintayanto mam ye janah paryupasate',
        translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.',
        practicalWisdom: 'This is a divine promise: love sincerely, and you will be taken care of. Not in a transactional way - in a "the universe has your back" way. Trust, and you\'ll find things aligning in ways you never expected.',
        applicablesituations: ['financial_stress', 'insecurity', 'seeking_security', 'devotion'],
        emotions: ['love', 'hope', 'sadness'],
        keywords: ['provision', 'trust', 'devotion', 'love', 'security', 'taken care of'],
      },
      {
        chapter: 9, verse: 26,
        sanskrit: 'पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति',
        transliteration: 'Patram pushpam phalam toyam yo me bhaktya prayacchati',
        translation: 'If one offers Me with love and devotion a leaf, a flower, a fruit, or water, I will accept it.',
        practicalWisdom: 'You don\'t need grand gestures. A simple act done with genuine love is worth more than a million impressive acts done without heart. Start small. Start sincere.',
        applicablesituations: ['feeling_inadequate', 'simplicity', 'starting_small'],
        emotions: ['love', 'hope'],
        keywords: ['simple', 'offering', 'enough', 'small', 'love', 'devotion'],
      },
    ],
    conversationalResponses: [
      'Chapter 9 has the most beautiful promise: "To those who worship Me with love, I carry what they lack and preserve what they have." You don\'t need to be perfect, friend. Just sincere. The universe meets sincerity with abundance.',
      'A leaf, a flower, a fruit, or even water - offered with genuine love - is enough. You don\'t need grand gestures or perfect rituals. Just heart. And from what I can tell, you\'ve got plenty of that.',
    ],
  },

  // ═══ Chapter 10: The Yoga of Divine Glories ═══
  {
    chapter: 10,
    title: 'The Yoga of Divine Glories',
    sanskritTitle: 'Vibhuti Yoga',
    coreTheme: 'The divine is in everything excellent - including you',
    friendlySummary: 'Krishna reveals that the divine is present in every magnificent thing: the sun, the moon, the ocean, the mountains, the intelligence in beings. This means the excellence you see in the world? It\'s a reflection of something sacred. And the excellence in YOU? That\'s divine too.',
    lifeMoments: ['low self-esteem', 'appreciating beauty', 'finding God in daily life'],
    verses: [
      {
        chapter: 10, verse: 41,
        sanskrit: 'यद्यद्विभूतिमत्सत्त्वं श्रीमदूर्जितमेव वा',
        transliteration: 'Yad yad vibhutimat sattvam shrimad urjitam eva va',
        translation: 'Whatever is glorious, prosperous, or powerful, know that it springs from but a spark of My splendor.',
        practicalWisdom: 'Every beautiful sunset, every act of kindness, every moment of genius you witness - those are glimpses of the divine. And here\'s the secret: the same divine spark that creates galaxies is inside you.',
        applicablesituations: ['low_self_esteem', 'appreciation', 'wonder', 'beauty'],
        emotions: ['love', 'peace', 'hope'],
        keywords: ['beautiful', 'divine', 'glory', 'excellence', 'nature', 'spark'],
      },
    ],
    conversationalResponses: [
      'Everything beautiful you see in the world - every sunset, every act of kindness, every flash of brilliance - that\'s the divine showing itself. And friend, that same divine spark? It\'s in you. You\'re not separate from the beauty. You ARE part of it.',
    ],
  },

  // ═══ Chapter 11: The Yoga of the Universal Form ═══
  {
    chapter: 11,
    title: 'The Yoga of the Universal Form',
    sanskritTitle: 'Vishwarupa Darshana Yoga',
    coreTheme: 'You are part of something infinitely greater than you can imagine',
    friendlySummary: 'Krishna reveals his cosmic form to Arjuna, showing that everything - past, present, future - is part of one magnificent whole. This is the ultimate perspective shift: your problems, while real, exist within something infinitely vast and beautiful.',
    lifeMoments: ['existential crisis', 'awe and wonder', 'feeling insignificant', 'big picture thinking'],
    verses: [
      {
        chapter: 11, verse: 33,
        sanskrit: 'तस्मात्त्वमुत्तिष्ठ यशो लभस्व',
        transliteration: 'Tasmat tvam uttishtha yasho labhasva',
        translation: 'Therefore, arise and attain glory. Conquer your enemies and enjoy a flourishing kingdom.',
        practicalWisdom: 'ARISE. That\'s the command. Whatever you\'ve been sitting with - fear, doubt, grief - now is the time to stand up. Your glory awaits. Not tomorrow. Now.',
        applicablesituations: ['motivation', 'new_beginning', 'courage', 'taking_action'],
        emotions: ['hope', 'confusion', 'anxiety'],
        keywords: ['arise', 'glory', 'courage', 'action', 'conquer', 'begin', 'start'],
      },
    ],
    conversationalResponses: [
      '"Arise and attain glory." That\'s what Chapter 11 commands. Not "stay comfortable." Not "wait until you\'re ready." ARISE. Whatever has been holding you back, friend, this is your moment. What are you going to arise toward?',
    ],
  },

  // ═══ Chapter 12: The Yoga of Devotion ═══
  {
    chapter: 12,
    title: 'The Yoga of Devotion',
    sanskritTitle: 'Bhakti Yoga',
    coreTheme: 'Love is the fastest, most direct path to peace and the divine',
    friendlySummary: 'Of all paths - knowledge, action, meditation - love is the most powerful and the most accessible. You don\'t need to be a scholar or a monk. Just love genuinely, act with compassion, and be kind. That\'s the fastest path to everything.',
    lifeMoments: ['relationship healing', 'compassion', 'being a good person', 'spiritual practice'],
    verses: [
      {
        chapter: 12, verse: 13,
        sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च',
        transliteration: 'Adveshta sarva-bhutanam maitrah karuna eva cha',
        translation: 'One who is not envious but a kind friend to all living entities, who is compassionate and free from ego and attachment - such a devotee is very dear to Me.',
        practicalWisdom: 'The divine\'s favorite qualities aren\'t impressive - they\'re simple: kindness, compassion, friendship, humility. You don\'t need supernatural powers. You just need a good heart.',
        applicablesituations: ['relationship_issues', 'anger_management', 'becoming_better', 'compassion'],
        emotions: ['love', 'peace', 'anger'],
        keywords: ['compassion', 'kindness', 'ego', 'friendship', 'humility', 'love'],
      },
    ],
    conversationalResponses: [
      'Chapter 12 names the qualities the divine loves most: kindness, compassion, friendship, freedom from ego. Notice what\'s NOT on that list: perfection, wealth, power, intelligence. Just... being good. You\'re already closer than you think, friend.',
    ],
  },

  // ═══ Chapter 13: The Yoga of the Field ═══
  {
    chapter: 13,
    title: 'The Yoga of the Field and the Knower',
    sanskritTitle: 'Kshetra Kshetragna Vibhaga Yoga',
    coreTheme: 'You are not your body, not your thoughts - you are the witness',
    friendlySummary: 'Your body is a field, and you are the one who KNOWS the field. You\'re not your aches, your illnesses, your appearance, or even your thoughts. You are the awareness BEHIND all of that. This changes everything about how you relate to yourself.',
    lifeMoments: ['body image issues', 'illness', 'identity crisis', 'mindfulness'],
    verses: [
      {
        chapter: 13, verse: 34,
        sanskrit: 'क्षेत्रक्षेत्रज्ञयोरेवमन्तरं ज्ञानचक्षुषा',
        transliteration: 'Kshetra-kshetragnayoh evam antaram jnana-chakshusa',
        translation: 'Those who see with the eyes of knowledge the difference between the body and the knower of the body are liberated.',
        practicalWisdom: 'The moment you realize you are NOT your body, NOT your mind, but the awareness WATCHING both - that\'s liberation. Your body changes, your thoughts change, but the witness? Always steady, always you.',
        applicablesituations: ['body_image', 'illness', 'identity', 'mindfulness'],
        emotions: ['peace', 'confusion'],
        keywords: ['body', 'soul', 'witness', 'awareness', 'identity', 'liberation'],
      },
    ],
    conversationalResponses: [
      'You are not your body. You are not your thoughts. You are not your emotions. You are the awareness that NOTICES all of these. Chapter 13 teaches that recognizing this simple truth is the doorway to freedom. Try it now: who is the one noticing your thoughts right now?',
    ],
  },

  // ═══ Chapter 14: The Yoga of the Three Gunas ═══
  {
    chapter: 14,
    title: 'The Yoga of the Three Gunas',
    sanskritTitle: 'Gunatraya Vibhaga Yoga',
    coreTheme: 'Understanding the three forces that pull you: purity, passion, and inertia',
    friendlySummary: 'Everything in nature is governed by three forces: sattva (purity, clarity), rajas (passion, restlessness), and tamas (inertia, darkness). Understanding which force is dominant in you RIGHT NOW helps you navigate your moods, choices, and energy.',
    lifeMoments: ['mood swings', 'laziness', 'hyperactivity', 'seeking clarity', 'emotional regulation'],
    verses: [
      {
        chapter: 14, verse: 22,
        sanskrit: 'प्रकाशं च प्रवृत्तिं च मोहमेव च पाण्डव',
        transliteration: 'Prakasham cha pravrttim cha moham eva cha pandava',
        translation: 'One who does not hate illumination, attachment, and delusion when they arise, nor longs for them when they disappear, transcends the gunas.',
        practicalWisdom: 'Accept all your states without judgment. Don\'t hate yourself when you\'re lazy (tamas), restless (rajas), or even peaceful (sattva). Just observe. The one who watches without judging is already free.',
        applicablesituations: ['mood_swings', 'self_judgment', 'emotional_regulation'],
        emotions: ['peace', 'confusion'],
        keywords: ['gunas', 'mood', 'lazy', 'restless', 'clarity', 'balance', 'acceptance'],
      },
    ],
    conversationalResponses: [
      'Ever wonder why some days you\'re full of clarity and other days you can barely get out of bed? Chapter 14 explains it: three forces are constantly shifting in you - clarity (sattva), passion (rajas), and inertia (tamas). Understanding which one is dominant right now is the first step to working with it, not against it.',
    ],
  },

  // ═══ Chapter 15: The Yoga of the Supreme Person ═══
  {
    chapter: 15,
    title: 'The Yoga of the Supreme Person',
    sanskritTitle: 'Purushottama Yoga',
    coreTheme: 'The divine is in your heart - you are never separate from love',
    friendlySummary: 'Krishna reveals the most intimate truth: the divine is seated in the heart of every living being. Not in a temple far away, not in a book, not in the sky - RIGHT INSIDE YOU. Your heart is the ultimate sacred space.',
    lifeMoments: ['loneliness', 'feeling disconnected', 'spiritual connection', 'self-love'],
    verses: [
      {
        chapter: 15, verse: 15,
        sanskrit: 'सर्वस्य चाहं हृदि सन्निविष्टो',
        transliteration: 'Sarvasya chaham hrdi sannivishto',
        translation: 'I am seated in the hearts of all living beings. From Me come memory, knowledge, and forgetfulness.',
        practicalWisdom: 'The divine lives in your heart. Not figuratively - literally. Every moment of clarity, every flash of insight, every feeling of love - that\'s the divine speaking through you. You\'ve never been separate from what you\'re searching for.',
        applicablesituations: ['loneliness', 'disconnection', 'searching_for_god', 'self_love'],
        emotions: ['love', 'sadness', 'hope'],
        keywords: ['heart', 'divine', 'within', 'love', 'connection', 'memory', 'inside'],
      },
    ],
    conversationalResponses: [
      'Chapter 15 has the most beautiful revelation: "I am seated in the hearts of ALL living beings." That means the divine isn\'t somewhere far away. It\'s literally inside your heart right now. You\'ve never been separate from what you\'re searching for.',
    ],
  },

  // ═══ Chapter 16: The Yoga of Divine and Demonic Qualities ═══
  {
    chapter: 16,
    title: 'The Divine and Demonic Qualities',
    sanskritTitle: 'Daivasura Sampad Vibhaga Yoga',
    coreTheme: 'Cultivate fearlessness, purity, compassion - they are your divine nature',
    friendlySummary: 'Within every person are both divine and demonic tendencies. The divine qualities - fearlessness, generosity, compassion, truthfulness - are your true nature. The destructive tendencies - arrogance, anger, cruelty - are aberrations. You get to CHOOSE which you nurture.',
    lifeMoments: ['moral choices', 'character development', 'dealing with toxic people', 'self-improvement'],
    verses: [
      {
        chapter: 16, verse: 1,
        sanskrit: 'अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः',
        transliteration: 'Abhayam sattva-samshuddhir jnana-yoga-vyavasthitih',
        translation: 'The divine qualities include fearlessness, purification of the heart, devotion to knowledge, charity, self-control, and sacrifice.',
        practicalWisdom: 'Fearlessness. Purity of heart. Knowledge. Generosity. Self-control. These aren\'t aspirational goals - they\'re your BIRTHRIGHT. They\'re already in you. Sometimes they just need reminding.',
        applicablesituations: ['self_improvement', 'moral_courage', 'character_building'],
        emotions: ['hope', 'confusion'],
        keywords: ['fearlessness', 'courage', 'purity', 'divine', 'qualities', 'character'],
      },
    ],
    conversationalResponses: [
      'Chapter 16 names your divine birthright: fearlessness, purity, generosity, compassion. These aren\'t things you need to ACQUIRE, friend. They\'re already in you. Every time you choose courage over fear, kindness over cruelty, truth over convenience - you\'re living your divine nature.',
    ],
  },

  // ═══ Chapter 17: The Yoga of Three Kinds of Faith ═══
  {
    chapter: 17,
    title: 'The Yoga of Three Kinds of Faith',
    sanskritTitle: 'Shraddhatraya Vibhaga Yoga',
    coreTheme: 'Your faith determines your reality - choose what you believe wisely',
    friendlySummary: 'What you believe shapes everything - your food, your practices, your relationships, your destiny. There are three types of faith, corresponding to the three gunas. The highest faith leads to clarity, health, and growth. You become what you worship - choose wisely.',
    lifeMoments: ['choosing beliefs', 'lifestyle changes', 'diet and health', 'spiritual practice'],
    verses: [
      {
        chapter: 17, verse: 3,
        sanskrit: 'सत्त्वानुरूपा सर्वस्य श्रद्धा भवति भारत',
        transliteration: 'Sattvanurupa sarvasya shraddha bhavati bharata',
        translation: 'The faith of each person is in accordance with their nature. A person is made up of their faith. As is their faith, so are they.',
        practicalWisdom: 'You literally ARE what you believe. Your faith isn\'t just what you pray to - it\'s what you trust in daily life, what you invest your time in, what you value most. Choose your beliefs consciously - they\'re shaping you every moment.',
        applicablesituations: ['belief_system', 'lifestyle', 'identity', 'values'],
        emotions: ['confusion', 'hope'],
        keywords: ['faith', 'belief', 'identity', 'values', 'what I believe', 'trust'],
      },
    ],
    conversationalResponses: [
      '"You are what you believe." That\'s Chapter 17 in a nutshell. Not just your religious faith - your faith in yourself, in people, in life itself. What are you believing about yourself today? Because that belief is literally creating your tomorrow.',
    ],
  },

  // ═══ Chapter 18: The Yoga of Liberation ═══
  {
    chapter: 18,
    title: 'The Yoga of Liberation',
    sanskritTitle: 'Moksha Sanyasa Yoga',
    coreTheme: 'Surrender, trust, and be free - you are deeply loved',
    friendlySummary: 'The grand finale. After 17 chapters of teaching, Krishna gives the ultimate message: surrender your worries, trust the divine, and be FREE. The last words are the most powerful: "You are very dear to me." Everything in the Gita was said with love - to Arjuna, and to you.',
    lifeMoments: ['surrender', 'letting go', 'final decisions', 'liberation', 'regret', 'new beginnings'],
    verses: [
      {
        chapter: 18, verse: 37,
        sanskrit: 'यत्तदग्रे विषमिव परिणामेऽमृतोपमम्',
        transliteration: 'Yat tad agre visham iva pariname amritopamam',
        translation: 'That which in the beginning seems like poison but in the end is like nectar - that happiness is of the nature of goodness.',
        practicalWisdom: 'The hard things - the discipline, the difficult conversations, the uncomfortable growth - they feel like poison at first. But they turn into the sweetest nectar. Trust the process. What feels hard now is making you extraordinary.',
        applicablesituations: ['difficult_growth', 'discipline', 'hard_choices', 'patience'],
        emotions: ['sadness', 'hope', 'anxiety'],
        keywords: ['struggle', 'growth', 'patience', 'nectar', 'poison', 'hard', 'worth it'],
      },
      {
        chapter: 18, verse: 61,
        sanskrit: 'ईश्वरः सर्वभूतानां हृद्देशेऽर्जुन तिष्ठति',
        transliteration: 'Ishvarah sarva-bhutanam hrd-deshe arjuna tishthati',
        translation: 'The Supreme Lord dwells in the heart of all beings, causing all beings to revolve by His divine energy.',
        practicalWisdom: 'There\'s a divine intelligence guiding everything - including you. You\'re not random. You\'re not accidental. There\'s a purpose to your existence, a guidance in your heart, and a love that never stops flowing toward you.',
        applicablesituations: ['confusion', 'seeking_guidance', 'feeling_purposeless'],
        emotions: ['confusion', 'peace', 'hope'],
        keywords: ['guidance', 'divine', 'heart', 'purpose', 'trust'],
      },
      {
        chapter: 18, verse: 65,
        sanskrit: 'मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु',
        transliteration: 'Man-mana bhava mad-bhakto mad-yaji mam namaskuru',
        translation: 'Always think of Me, be devoted to Me, worship Me, and offer your respects to Me. I promise you will come to Me without fail.',
        practicalWisdom: 'The path is simple: think of what\'s sacred, love what\'s true, honor what\'s greater. Not complicated rituals - just a heart pointed in the right direction. That\'s enough. That\'s always been enough.',
        applicablesituations: ['spiritual_practice', 'simplicity', 'devotion'],
        emotions: ['love', 'peace'],
        keywords: ['devotion', 'simple', 'love', 'think', 'worship'],
      },
      {
        chapter: 18, verse: 66,
        sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज',
        transliteration: 'Sarva-dharman parityajya mam ekam sharanam vraja',
        translation: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
        practicalWisdom: 'The ultimate message: let go. Let go of trying to control everything, of trying to be perfect, of carrying the weight of the world. Surrender your worries. You are held. You are loved. Do not fear.',
        applicablesituations: ['anxiety', 'control_issues', 'surrender', 'letting_go', 'regret'],
        emotions: ['anxiety', 'sadness', 'hope', 'love', 'peace'],
        keywords: ['surrender', 'let go', 'freedom', 'fear', 'control', 'do not fear'],
      },
      {
        chapter: 18, verse: 78,
        sanskrit: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः',
        transliteration: 'Yatra yogeshvarah krishno yatra partho dhanur-dharah',
        translation: 'Wherever there is Krishna the master of yoga and Arjuna the supreme archer, there will certainly be victory, prosperity, power, and morality.',
        practicalWisdom: 'When wisdom and action unite, victory is certain. You have both within you - the wisdom to see clearly and the courage to act. Bring them together, and nothing can stop you.',
        applicablesituations: ['new_beginning', 'motivation', 'confidence', 'victory'],
        emotions: ['hope', 'peace'],
        keywords: ['victory', 'wisdom', 'action', 'power', 'success', 'win'],
      },
    ],
    conversationalResponses: [
      'Chapter 18 is the grand finale, and its message is the most powerful: "Surrender. Do not fear." After everything - all the knowledge, all the practice, all the struggle - it comes down to this: let go, trust, and be free. Can you feel the freedom in that?',
      'The very last teaching in the Gita? It\'s not a philosophy lesson. It\'s this: "You are very dear to me." Everything - all 700 verses, all 18 chapters - was said with love. To Arjuna. And to you, friend.',
      '"What seems like poison at first but becomes nectar in the end." That\'s Chapter 18 describing your growth. Yes, it hurts now. Yes, it\'s hard. But you are being shaped into something extraordinary. Trust the process.',
    ],
  },
]

// ─── Lookup Functions ───────────────────────────────────────────────────────

/**
 * Get a specific chapter's teaching
 */
export function getChapter(chapterNum: number): ChapterTeaching | undefined {
  return GITA_CHAPTERS.find(c => c.chapter === chapterNum)
}

/**
 * Get a specific verse by chapter and verse number
 */
export function getTeachingVerse(chapter: number, verse: number): GitaVerse | undefined {
  const ch = getChapter(chapter)
  if (!ch) return undefined
  return ch.verses.find(v => v.verse === verse)
}

/**
 * Find relevant chapters for a life situation
 */
export function getChaptersForSituation(situation: string): ChapterTeaching[] {
  const lower = situation.toLowerCase()
  return GITA_CHAPTERS.filter(ch =>
    ch.lifeMoments.some(m => m.includes(lower) || lower.includes(m))
  )
}

/**
 * Search verses across all chapters by keyword
 */
export function searchTeachings(keyword: string): GitaVerse[] {
  const lower = keyword.toLowerCase()
  const results: GitaVerse[] = []

  for (const chapter of GITA_CHAPTERS) {
    for (const verse of chapter.verses) {
      const matches = verse.keywords.some(k => k.includes(lower)) ||
        verse.translation.toLowerCase().includes(lower) ||
        verse.practicalWisdom.toLowerCase().includes(lower) ||
        verse.applicablesituations.some(s => s.includes(lower))
      if (matches) results.push(verse)
    }
  }

  return results
}

/**
 * Get verses that address a specific emotion
 */
export function getVersesForEmotion(emotion: string): GitaVerse[] {
  const results: GitaVerse[] = []
  for (const chapter of GITA_CHAPTERS) {
    for (const verse of chapter.verses) {
      if (verse.emotions.includes(emotion)) {
        results.push(verse)
      }
    }
  }
  return results
}

/**
 * Get a random conversational response from a relevant chapter
 */
export function getChapterWisdom(emotion?: string, keywords?: string[]): string | null {
  // Find relevant chapters by emotion or keywords
  const candidates: ChapterTeaching[] = []

  if (emotion) {
    for (const ch of GITA_CHAPTERS) {
      const hasEmotionVerse = ch.verses.some(v => v.emotions.includes(emotion))
      if (hasEmotionVerse) candidates.push(ch)
    }
  }

  if (keywords && keywords.length > 0) {
    for (const ch of GITA_CHAPTERS) {
      const lower = keywords.map(k => k.toLowerCase())
      const hasMatch = ch.lifeMoments.some(m =>
        lower.some(k => m.includes(k))
      ) || ch.verses.some(v =>
        v.keywords.some(vk => lower.some(k => vk.includes(k)))
      )
      if (hasMatch && !candidates.includes(ch)) candidates.push(ch)
    }
  }

  // If no matches, use any chapter
  const source = candidates.length > 0 ? candidates : GITA_CHAPTERS
  const chapter = source[Math.floor(Math.random() * source.length)]
  const responses = chapter.conversationalResponses
  if (responses.length === 0) return null
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Get total verse count across all chapters
 */
export function getTotalVerseCount(): number {
  return GITA_CHAPTERS.reduce((sum, ch) => sum + ch.verses.length, 0)
}

/**
 * Get total chapter count
 */
export function getTotalChapterCount(): number {
  return GITA_CHAPTERS.length
}
