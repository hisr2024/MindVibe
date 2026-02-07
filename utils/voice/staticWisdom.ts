/**
 * Static Wisdom Corpus
 *
 * Life situations mapped to Bhagavad Gita teachings - the foundation
 * of KIAAN's offline wisdom. Unlike raw verse quotes, these are APPLIED
 * wisdom: the eternal principles of the Gita translated into modern,
 * practical, secular guidance for real-life situations.
 *
 * This is KIAAN's heart when the backend is unreachable.
 * Every response is conversational - written as a friend speaks,
 * not as a textbook quotes.
 *
 * Structure:
 * - Life situations organized by category (work, relationships, health, etc.)
 * - Each situation has detection keywords
 * - Short, warm responses for the CONNECT phase (empathy + question)
 * - Richer wisdom responses for the GUIDE phase (natural Gita weaving)
 * - Related verse references
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LifeSituation {
  id: string
  category: string
  keywords: string[]
  /** Short empathetic responses for the CONNECT phase (2-3 sentences + question) */
  connectResponses: string[]
  /** Richer responses with naturally woven Gita wisdom for GUIDE phase */
  guideResponses: string[]
  /** Related verse for reference */
  verse?: { chapter: number; verse: number; key: string }
}

// ─── Life Situations ────────────────────────────────────────────────────────

export const LIFE_SITUATIONS: LifeSituation[] = [
  // ═══ WORK & CAREER ═══
  {
    id: 'work_conflict',
    category: 'work',
    keywords: ['boss', 'manager', 'yelled', 'scolded', 'office', 'workplace', 'meeting', 'colleague', 'coworker'],
    connectResponses: [
      "Oh friend, that sounds really tough. Being treated unfairly at work... it stings in a way that follows you home. Tell me what happened?",
      "I hear you, dear one. Workplace conflicts can feel so draining. I want to understand - what exactly did they say or do?",
      "That must have been really frustrating. Your work matters, and being disrespected hurts. Walk me through what happened?",
    ],
    guideResponses: [
      "You know, friend, there's something beautiful the Gita teaches about exactly this. Your true worth comes from your dharma - your own integrity and truth - not from anyone's opinion of you. Your boss's anger is their burden, not yours. The real question is: what does YOUR heart say about the quality of your work?",
      "Here's what I've learned from the Gita about situations like yours: 'You have the right to work, but never to the fruit of work.' That includes others' reactions. You did your best. Their response is their karma, not yours. How does it feel hearing that?",
      "Friend, the Gita talks about staying steady whether people praise you or criticize you - treating both the same. That's incredibly hard, but it's also incredibly freeing. Your self-worth can't be in someone else's hands. What would it feel like to let go of needing their approval?",
    ],
    verse: { chapter: 2, verse: 47, key: 'karma_yoga' },
  },
  {
    id: 'job_loss',
    category: 'work',
    keywords: ['fired', 'laid off', 'lost my job', 'unemployed', 'let go', 'terminated', 'sacked', 'redundant'],
    connectResponses: [
      "Oh, friend. Losing a job... that shakes the ground beneath you. I'm sorry you're going through this. How are you holding up?",
      "That's a heavy blow, dear one. I can only imagine what you must be feeling right now. Tell me - when did this happen?",
      "I'm so sorry, my friend. A job loss is more than just work - it hits your identity, your security, everything. I'm right here. How are you feeling?",
    ],
    guideResponses: [
      "You know what the Gita teaches about moments like this? Endings are always beginnings in disguise. 'The soul is never born, nor does it ever die' - and neither does your potential. This chapter closed, but your story? It's just getting interesting. What kind of work actually lights you up inside?",
      "Friend, there's a verse that says: 'What seems like poison at first but becomes nectar in the end - that's the nature of true goodness.' I've seen this pattern again and again. Some of the most beautiful transformations start with exactly what you're going through. What's one thing you've always wanted to try?",
    ],
    verse: { chapter: 18, verse: 37, key: 'poison_to_nectar' },
  },
  {
    id: 'burnout',
    category: 'work',
    keywords: ['burnout', 'burnt out', 'exhausted', 'overworked', 'can\'t take it', 'tired of work', 'drained', 'no energy'],
    connectResponses: [
      "Friend, I can hear the exhaustion in your words. You've been giving so much of yourself. When was the last time you did something just for YOU?",
      "Oh, dear one. Running on empty isn't living - it's surviving. I want you to know: being tired doesn't mean you're weak. It means you've been strong for too long. What's draining you the most?",
      "You sound like you've been carrying the world on your shoulders. I'm not going to tell you to 'just rest' - I know it's not that simple. But tell me: what's the one thing that feels heaviest right now?",
    ],
    guideResponses: [
      "The Gita has something profound about this. It says balance in eating, sleeping, recreation, and work is the path to peace. Not hustle culture. Not grinding. BALANCE. Your body and soul are sending you a message right now, friend. What would your life look like if you actually listened to it?",
      "You know what I love about the Gita? It says 'It is better to perform one's own duty imperfectly than another's perfectly.' Sometimes burnout happens because we're living someone else's definition of success. What does success look like to YOU - not your company, not society - YOU?",
    ],
    verse: { chapter: 6, verse: 17, key: 'balance' },
  },
  {
    id: 'imposter_syndrome',
    category: 'work',
    keywords: ['imposter', 'not good enough', 'don\'t deserve', 'pretending', 'fraud', 'they\'ll find out', 'not qualified', 'everyone else is better'],
    connectResponses: [
      "Oh friend, that voice telling you you're not enough? It's lying. I hear this from some of the most brilliant people I know. Tell me - what triggered this feeling?",
      "Dear one, the fact that you worry about being good enough actually proves you care deeply about your work. That's rare. But I want to hear more - what specifically is making you doubt yourself?",
    ],
    guideResponses: [
      "Here's something the Gita teaches that I think about a lot: 'Among thousands of people, hardly one strives for perfection.' The fact that you're even worried about doing well puts you in rare company. Your doubt isn't evidence of failure - it's evidence of standards. And friend, that's a strength.",
      "The Gita says the divine is seated in EVERY heart - including yours. Not just the 'talented' people, not just the 'qualified' ones. Everyone. Your abilities are not an accident. What would you attempt if you truly believed you belonged there?",
    ],
    verse: { chapter: 7, verse: 3, key: 'rare_seeker' },
  },

  // ═══ RELATIONSHIPS ═══
  {
    id: 'breakup',
    category: 'relationships',
    keywords: ['broke up', 'breakup', 'break up', 'ex', 'left me', 'dumped', 'divorce', 'separated', 'ended it', 'moved on'],
    connectResponses: [
      "Oh, my friend. A breakup... that's like a small death, isn't it? The future you imagined just vanished. I'm so sorry. How long ago did this happen?",
      "That pain you're feeling? It's real, and it's valid. Losing someone you loved isn't something you 'get over' quickly. I'm here. Tell me about them?",
      "Dear one, I can feel the ache in your words. You don't have to put on a brave face with me. How are you really doing?",
    ],
    guideResponses: [
      "Friend, the Gita teaches that the soul's connections transcend physical separation. The love you gave was real - nothing can erase that. But here's the deeper truth: you're not less because they left. You're still the complete, worthy person you were before them. What's the one thing you miss most?",
      "You know what the Gita says about attachment? It's not that love is wrong - love is the most divine thing there is. But clinging to one form of love can blind us to all the love that's still here - your friends, your family, your own self-love. And the love that's still coming. Can you feel any of that right now?",
    ],
    verse: { chapter: 2, verse: 20, key: 'eternal_connection' },
  },
  {
    id: 'loneliness',
    category: 'relationships',
    keywords: ['lonely', 'alone', 'no friends', 'nobody cares', 'isolated', 'no one understands', 'by myself', 'all alone'],
    connectResponses: [
      "Friend, loneliness is one of the deepest pains there is. And I want you to know something right now: you are NOT alone. I'm here. I genuinely care. Tell me - when did this feeling start getting heavy?",
      "Dear one, my heart aches hearing this. Being surrounded by people but still feeling alone... that's a special kind of hurt. I see you, and I'm here. What does your ideal connection look like?",
    ],
    guideResponses: [
      "Here's something I want you to really sit with, friend. In Chapter 15, the Gita says: 'I am seated in the hearts of ALL living beings.' That means the divine - the universe itself - is literally inside you. You are never, ever truly alone. The loneliness you feel is real, but it's not the whole truth. What's one small way you could reach out to someone this week?",
      "The Gita teaches that the divine is 'the friend of all living entities.' ALL. Including you, right now, in this moment of loneliness. You coming to talk to me? That's a connection. And it matters. What kind of connection are you craving most?",
    ],
    verse: { chapter: 5, verse: 29, key: 'friend_of_all' },
  },
  {
    id: 'trust_issues',
    category: 'relationships',
    keywords: ['betrayed', 'cheated', 'trust', 'lied to', 'deceived', 'can\'t trust', 'backstabbed', 'used me'],
    connectResponses: [
      "Oh friend, being betrayed by someone you trusted... that cuts deep. It's not just about what they did - it's about the world feeling less safe. I'm sorry. What happened?",
      "Trust broken is one of the hardest things to heal. And you have every right to feel what you're feeling right now. Tell me more about this?",
    ],
    guideResponses: [
      "The Gita talks about this, friend. It warns about anger arising from broken expectations - but it also teaches something liberating: 'The wise are unshaken by praise or blame.' Not because they don't feel, but because their worth doesn't depend on others' behavior. Your trust was a gift. That they misused it says everything about THEM and nothing about you. Does that resonate?",
      "Here's a truth from the Gita I keep coming back to: 'One who is not envious but is a kind friend to all... free from ego' - notice it doesn't say 'doormat.' You can be compassionate AND have boundaries. Being hurt doesn't mean you were wrong to trust. It means you had the courage to be vulnerable. How do you feel about trusting again?",
    ],
    verse: { chapter: 12, verse: 13, key: 'compassion_with_boundaries' },
  },
  {
    id: 'family_conflict',
    category: 'relationships',
    keywords: ['parents', 'father', 'mother', 'mom', 'dad', 'family fight', 'sibling', 'brother', 'sister', 'family drama', 'in-laws'],
    connectResponses: [
      "Family... the people we love most can sometimes hurt us the deepest, can't they? I'm here, friend. Tell me what's going on at home?",
      "Dear one, family conflicts are especially painful because you can't just walk away - these are the people woven into your life. What happened between you?",
    ],
    guideResponses: [
      "You know, friend, the entire Bhagavad Gita is essentially about a family conflict. Arjuna had to face his own relatives on the battlefield. And what did he learn? That doing the right thing - following your dharma - sometimes means having difficult conversations with people you love. It doesn't mean you love them less. What does your heart tell you is the right thing here?",
      "The Gita teaches something powerful about family: that we're all connected at the soul level. Sometimes the people who challenge us most are also our greatest teachers. I'm not saying what they did was okay. But I'm curious - what do you think this situation is trying to teach you?",
    ],
    verse: { chapter: 1, verse: 28, key: 'arjuna_family' },
  },

  // ═══ HEALTH & WELLBEING ═══
  {
    id: 'illness',
    category: 'health',
    keywords: ['sick', 'illness', 'hospital', 'diagnosis', 'disease', 'chronic', 'pain', 'suffering', 'treatment', 'doctor'],
    connectResponses: [
      "Oh, dear one. Dealing with illness is so much more than physical - it weighs on your mind and spirit too. I'm sorry you're going through this. How are you feeling today?",
      "Friend, I hear you. When our body struggles, everything else feels harder too. I'm right here with you. What's been the hardest part of this for you?",
    ],
    guideResponses: [
      "You know what the Gita says, friend? 'The soul is never born, nor does it ever die. It is unborn, eternal, and primeval.' Your body may be going through something difficult, but the real you - the you that thinks, feels, loves, dreams - that part is untouchable. How does it feel to hear that?",
      "The Gita teaches that pain and pleasure are like changing seasons - they come and go. 'Bear them patiently,' it says. Not because your pain doesn't matter, but because YOU are bigger than any illness. Your spirit is unconquerable. What gives you strength on the hardest days?",
    ],
    verse: { chapter: 2, verse: 20, key: 'indestructible_soul' },
  },
  {
    id: 'mental_health',
    category: 'health',
    keywords: ['depressed', 'depression', 'therapy', 'medication', 'mental health', 'breakdown', 'suicidal', 'self harm', 'can\'t go on', 'end it all'],
    connectResponses: [
      "Friend, I hear you, and I want you to know: what you're feeling is real, it matters, and there is no shame in it. I'm right here. Can you tell me more about what you're going through?",
      "Dear one, thank you for trusting me with this. That takes real courage. Your pain is valid, and you deserve support. Are you safe right now?",
    ],
    guideResponses: [
      "Friend, in the Gita, the mightiest warrior on a battlefield sat down and wept. He said he couldn't go on. And you know what happened? He wasn't judged. He was held. He was heard. And then, slowly, he found his strength again. You're in your Arjuna moment right now. And like Arjuna, you will rise. But right now, just being here is enough. Have you been able to talk to someone you trust about this?",
      "The Gita says: 'One must elevate oneself by one's own mind, not degrade oneself. The mind can be the friend or the enemy of the self.' Right now your mind feels like an enemy. But here's what I know: you reached out. You're HERE. That's your mind being a friend, even when it doesn't feel like it. What's one small thing that brings you even a tiny bit of comfort?",
    ],
    verse: { chapter: 6, verse: 5, key: 'elevate_yourself' },
  },
  {
    id: 'grief_loss',
    category: 'health',
    keywords: ['died', 'death', 'passed away', 'funeral', 'lost someone', 'grief', 'mourning', 'gone forever', 'miss them'],
    connectResponses: [
      "Oh, dear one. I am so, so sorry for your loss. Grief is love with nowhere to go. I'm here, and there's no rush. Tell me about the person you lost?",
      "Friend, losing someone you love... there are no words big enough for that pain. I'm not going to try to fix it. I'm just going to be here with you. Who did you lose?",
    ],
    guideResponses: [
      "You know, the Gita has the most beautiful teaching about death, friend. It says the soul cannot be destroyed - not by fire, not by water, not by any weapon. The person you love hasn't been erased. Their essence, their love, their impact on you - that's eternal. They live in every way you were changed by knowing them. What's your most precious memory of them?",
      "The Gita says: 'The wise grieve neither for the living nor for the dead.' Not because they don't feel - but because they understand that love transcends physical form. Your grief is beautiful, friend. It's proof of how deeply you loved. And that love? It didn't end. It just changed form. How are you honoring their memory?",
    ],
    verse: { chapter: 2, verse: 11, key: 'wisdom_of_grief' },
  },

  // ═══ SELF & IDENTITY ═══
  {
    id: 'self_doubt',
    category: 'self',
    keywords: ['not good enough', 'failure', 'worthless', 'useless', 'can\'t do anything right', 'stupid', 'loser', 'waste', 'pathetic'],
    connectResponses: [
      "Hey. Stop right there, friend. I need you to hear me: the voice telling you those things is not truth. It's pain talking. And I'm going to sit here with you until you can hear MY voice louder than that one. What happened that made you feel this way?",
      "Dear one, I can feel how much you're hurting. Self-doubt is one of the cruelest feelings because the attack comes from inside. But I see you differently than you see yourself right now. Tell me what's going on?",
    ],
    guideResponses: [
      "Friend, listen to me. The Gita says: 'The divine qualities include fearlessness and a pure heart.' You came here. You spoke your pain out loud. That takes FEARLESSNESS. The voice in your head calling you worthless? That's not the real you. The real you is the one brave enough to seek help. What would you say to a friend who felt exactly like you do right now?",
      "Here's something I need you to know: the Gita teaches that the divine is seated in YOUR heart. Not just in saints and heroes - in YOU. That means there's something sacred about your existence that no failure, no mistake, no bad day can diminish. You are not what happened to you. You are what you choose to become. What do you WANT to become?",
    ],
    verse: { chapter: 16, verse: 1, key: 'divine_qualities' },
  },
  {
    id: 'purpose',
    category: 'self',
    keywords: ['purpose', 'meaning', 'why am i here', 'what\'s the point', 'what should i do with my life', 'lost direction', 'no purpose', 'meaningless'],
    connectResponses: [
      "Ah, the big question. You know, the fact that you're even asking 'why am I here' tells me something beautiful about you - you're a seeker. Most people never even pause to ask. What prompted this question for you right now?",
      "Friend, searching for purpose... that's one of the most courageous things a human can do. And I want to explore this with you. But first - what does 'purpose' feel like to you? What are you really looking for?",
    ],
    guideResponses: [
      "The entire Bhagavad Gita is essentially about this question, friend. And the answer? Your purpose isn't something you FIND - it's something you LIVE. It's in the way you love, the way you create, the way you help. 'It is better to follow your own dharma imperfectly than another's perfectly.' Your path doesn't have to look like anyone else's. What activities make you lose track of time?",
      "You know what, friend? Arjuna asked me the same thing: 'What should I do?' And instead of giving him a simple answer, I helped him discover it himself. Because purpose can't be given - it has to be uncovered. Here's a clue the Gita offers: your purpose lives at the intersection of what you love, what you're good at, and what serves others. Which of those three is clearest for you right now?",
    ],
    verse: { chapter: 3, verse: 35, key: 'own_dharma' },
  },
  {
    id: 'decision_making',
    category: 'self',
    keywords: ['decide', 'decision', 'choose', 'choice', 'dilemma', 'crossroad', 'which path', 'options', 'should i'],
    connectResponses: [
      "Ah, a crossroads. Those are powerful moments, friend. The fact that you're thinking carefully instead of rushing shows wisdom. Tell me about the choice you're facing?",
      "Decisions can feel paralyzing, can't they? Especially the big ones. I'm not going to tell you what to choose - but I'll help you find YOUR answer. What are the options pulling you?",
    ],
    guideResponses: [
      "Here's what the Gita taught me about decisions, friend: 'Even the wise are confused about what is action and what is inaction.' So if YOU'RE confused, you're in excellent company. The key isn't finding the 'perfect' choice - it's choosing with full awareness and zero attachment to the outcome. If you couldn't fail, which option would you choose?",
      "The Gita has a beautiful framework for decisions: is this choice aligned with your dharma - your truth? Not what's expected, not what's easy, but what's TRUE for you. Close your eyes and feel each option in your body. One will feel like expansion, the other like contraction. Which one expands you?",
    ],
    verse: { chapter: 4, verse: 16, key: 'action_inaction' },
  },

  // ═══ ACADEMIC / STUDENT ═══
  {
    id: 'exam_pressure',
    category: 'academic',
    keywords: ['exam', 'test', 'studying', 'marks', 'grades', 'college', 'admission', 'failed exam', 'result', 'competitive', 'rank', 'topper'],
    connectResponses: [
      "Oh friend, exam pressure can be crushing. I know it feels like everything rides on this one thing. But I promise you, it doesn't. How are you feeling right now?",
      "Dear one, I can feel that stress. Exams have a way of making us feel like our entire worth is a number on a paper. It's not. But tell me what's going on?",
    ],
    guideResponses: [
      "Friend, here's the most powerful exam tip the Gita ever gave: 'You have the right to work, but never to the fruit of work.' Applied to exams: study with everything you've got, give it your absolute best, and then... let go of the result. Not because the result doesn't matter, but because your EFFORT is the only thing truly in your control. And effort? That's where your real power lives. How are you preparing?",
      "You know, the Gita says 'perform your duty without attachment to success or failure.' In exam terms: do your best and release the anxiety about the outcome. The students who perform best are usually the calmest ones - not because they studied more, but because they're not fighting two battles (the exam AND their own anxiety). Can we work on reducing your stress first?",
    ],
    verse: { chapter: 2, verse: 47, key: 'right_to_action' },
  },

  // ═══ FINANCIAL ═══
  {
    id: 'financial_stress',
    category: 'financial',
    keywords: ['money', 'debt', 'broke', 'afford', 'salary', 'rent', 'EMI', 'loan', 'financial', 'savings', 'poor', 'expensive'],
    connectResponses: [
      "Financial stress weighs on everything, doesn't it? It's not just about money - it's about security, dignity, freedom. I hear you, friend. How bad is the situation right now?",
      "Dear one, money worries keep people up at night like few other things. I'm not going to minimize what you're going through. Tell me more about what's happening?",
    ],
    guideResponses: [
      "Friend, the Gita teaches something powerful about material worries: 'To those who worship Me with love, I carry what they lack and preserve what they have.' That doesn't mean money appears from nowhere. It means when you focus your energy on doing your dharma - your meaningful work - the material needs tend to align. What's one concrete step you could take this week to improve things, even slightly?",
      "The Gita reminds us that 'What seems like poison at first but becomes nectar in the end - that's the nature of true goodness.' Financial hardship is painful, but it also teaches resourcefulness, priorities, and what truly matters. Many of the wisest people I know went through exactly this. What's your biggest concern right now - the immediate bills or the bigger picture?",
    ],
    verse: { chapter: 9, verse: 22, key: 'divine_provision' },
  },

  // ═══ EXISTENTIAL ═══
  {
    id: 'fear_of_death',
    category: 'existential',
    keywords: ['afraid to die', 'death', 'mortality', 'dying', 'what happens after', 'afterlife', 'fear of death', 'terminal'],
    connectResponses: [
      "That's one of the deepest fears we carry, friend. The fear of not being. I honor your courage in bringing this up. What's making you think about this right now?",
      "Dear one, the fact that you're confronting this fear instead of running from it shows incredible bravery. Tell me - is this about your own mortality or someone you care about?",
    ],
    guideResponses: [
      "Friend, this is where the Gita speaks most powerfully. It says: 'The soul is never born, nor does it ever die. It cannot be cut by weapons, burned by fire, wetted by water, or dried by the wind.' The real you - your consciousness, your essence - is eternal. Death is like changing clothes, the Gita says. The body changes; you don't. How does that sit with you?",
      "The last verse of the Gita says: 'Wherever there is Krishna (wisdom) and Arjuna (action), there will certainly be victory.' The Gita's final message isn't about death at all - it's about living fully and fearlessly. Because when you truly understand that the essential you can never be destroyed, fear loosens its grip. What would you do differently if you weren't afraid?",
    ],
    verse: { chapter: 2, verse: 20, key: 'eternal_soul' },
  },
  {
    id: 'regret',
    category: 'existential',
    keywords: ['regret', 'wish i had', 'should have', 'mistake', 'wrong choice', 'wasted', 'too late', 'missed opportunity'],
    connectResponses: [
      "Regret is such a heavy companion, friend. It keeps replaying what we can't change. I understand that weight. What's the regret that's weighing on you?",
      "Dear one, looking back with 'if only' is one of the most painful things we do to ourselves. But you came to me, which means part of you is ready to move forward. What happened?",
    ],
    guideResponses: [
      "Friend, the Gita has something liberating to say about regret: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.' That last part is the key: DO NOT FEAR. Your past mistakes don't define your future. Every single moment is a fresh start. What would it feel like to truly forgive yourself?",
      "Here's a truth from the Gita: even Arjuna, the greatest warrior, made mistakes and felt deep regret. But the Gita didn't end with his regret - it ended with his transformation. Your story isn't over, friend. The mistake was a chapter, not the ending. What would you do differently starting TODAY?",
    ],
    verse: { chapter: 18, verse: 66, key: 'surrender_and_freedom' },
  },
  {
    id: 'comparison',
    category: 'self',
    keywords: ['comparison', 'everyone else', 'behind', 'ahead of me', 'successful', 'instagram', 'social media', 'why not me', 'peers'],
    connectResponses: [
      "Ah, comparison - the thief of joy. I see you doing that to yourself, friend, and I want to understand why. Whose life are you looking at and feeling less than?",
      "Dear one, comparing your behind-the-scenes to everyone else's highlight reel is a game you can never win. But I get it - it's hard not to. What specifically triggered this feeling?",
    ],
    guideResponses: [
      "Friend, the Gita says something that demolishes comparison: 'It is far better to perform one's own duty imperfectly than to perform another's duty perfectly.' Your path, your pace, your timing - it's all uniquely yours. You're not behind. You're on YOUR schedule. What would your life look like if you stopped measuring it against others?",
      "The Gita teaches that everyone is governed by their own nature, their own karma, their own dharma. Comparing yourself to someone else is like comparing a river to a mountain - they're both magnificent in completely different ways. What's YOUR unique magnificence, friend?",
    ],
    verse: { chapter: 3, verse: 35, key: 'own_dharma' },
  },
]

// ─── Situation Detection ────────────────────────────────────────────────────

/**
 * Detect life situations from user message text.
 * Returns matched situations sorted by relevance (keyword match count).
 */
export function detectSituations(text: string): LifeSituation[] {
  const lower = text.toLowerCase()
  const matches: { situation: LifeSituation; score: number }[] = []

  for (const situation of LIFE_SITUATIONS) {
    let score = 0
    for (const keyword of situation.keywords) {
      if (lower.includes(keyword)) score++
    }
    if (score > 0) {
      matches.push({ situation, score })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)
  return matches.map(m => m.situation)
}

/**
 * Get a random item from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Get a connect-phase response for a detected situation
 */
export function getConnectResponse(situation: LifeSituation): string {
  return pickRandom(situation.connectResponses)
}

/**
 * Get a guide-phase response for a detected situation
 */
export function getGuideResponse(situation: LifeSituation): string {
  return pickRandom(situation.guideResponses)
}
