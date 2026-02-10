/**
 * KIAAN Local Friend Engine - Intelligent Response Generation Without OpenAI
 *
 * Mirrors the architecture of Ardha/Viyoga/Relationship Compass engines:
 * 1. Weighted mood detection (17 emotions + positive emotions)
 * 2. Topic detection (family, work, academic, celebration, loss, etc.)
 * 3. Entity extraction (daughter, exam, boss, etc.)
 * 4. Intent classification (sharing, venting, celebrating, asking advice)
 * 5. Phase-progressive responses (connect → listen → understand → guide → empower)
 * 6. Gita wisdom weaving (phase-gated, topic-matched)
 * 7. Psychology-backed templates (MI, EFT, Polyvagal, Narrative)
 */

// ─── Types ───────────────────────────────────────────────────────────────

type WeightedKeyword = [string, number]

export interface FriendEngineResult {
  response: string
  mood: string
  mood_intensity: number
  topic: string
  intent: string
  entities: string[]
  phase: string
  wisdom_used: { principle: string; verse_ref: string } | null
}

interface ConversationState {
  turnCount: number
  moodHistory: string[]
  topicHistory: string[]
  entitiesHistory: string[]
  currentPhase: string
  lastWisdomPrinciple: string | null
}

interface WisdomEntry {
  wisdom: string
  principle: string
  verse_ref: string
  moods: string[]
  topics: string[]
}

// ─── 1. Weighted Mood Detection ──────────────────────────────────────────

const EMOTION_KEYWORDS: Record<string, WeightedKeyword[]> = {
  anxious: [['anxious', 3], ['anxiety', 3], ['worried', 2.5], ['scared', 2], ['panic', 3], ['stress', 2], ['nervous', 2.5], ['afraid', 2], ['fear', 2], ['tense', 2], ['restless', 2], ['uneasy', 2], ['dread', 3]],
  sad: [['sad', 2.5], ['depressed', 3], ['hopeless', 3], ['crying', 3], ['heartbroken', 3], ['empty', 2.5], ['grief', 3], ['miss', 1.5], ['numb', 2.5], ['miserable', 3], ['devastated', 3], ['tears', 2.5], ['losing hope', 2.5], ['lost hope', 2.5], ['giving up', 2.5], ['no point', 2.5]],
  angry: [['angry', 3], ['furious', 3], ['frustrated', 2.5], ['mad', 2], ['hate', 2.5], ['unfair', 2], ['betrayed', 3], ['rage', 3], ['irritated', 2], ['pissed', 2.5], ['livid', 3], ['fight', 2.5], ['fights', 2.5], ['fighting', 2.5], ['argument', 2.5], ['arguments', 2.5], ['yelling', 2.5], ['screaming', 2.5]],
  confused: [['confused', 3], ['lost', 2], ['stuck', 2], ['unsure', 2.5], ["don't know", 2], ['uncertain', 2.5], ['torn', 2.5], ['dilemma', 2.5], ['indecisive', 2.5], ['misunderstanding', 2.5], ['mixed signals', 2.5], ['dont understand', 2.5], ["don't understand", 2.5]],
  lonely: [['lonely', 3], ['alone', 2.5], ['isolated', 3], ['nobody', 2.5], ['no one', 2.5], ['abandoned', 3], ['disconnected', 2.5], ['need someone', 2.5], ['need to talk', 2.5], ['someone to talk', 2.5], ['need a friend', 2.5], ['no friends', 2.5]],
  overwhelmed: [['overwhelmed', 3], ['too much', 2.5], ['exhausted', 2.5], ['burnt out', 3], ['drowning', 3], ["can't cope", 3], ['overloaded', 2.5], ['no solution', 2.5], ["don't know what to do", 2.5], ['dont know what to do', 2.5]],
  hurt: [['hurt', 2.5], ['wounded', 3], ['broken', 2.5], ['damaged', 2.5], ['betrayed', 3], ['let down', 2.5], ['disappointed', 2], ['fight', 2], ['fights', 2], ['lied to me', 2.5], ['cheated', 2.5]],
  guilty: [['guilty', 3], ['shame', 3], ['regret', 2.5], ['sorry', 1.5], ['fault', 2], ['blame myself', 3], ['ashamed', 3]],
  fearful: [['terrified', 3], ['petrified', 3], ['dread', 3], ['horror', 3], ['phobia', 3], ['panicking', 3]],
  stressed: [['stressed', 3], ['pressure', 2.5], ['deadline', 2], ['hectic', 2], ['swamped', 2.5], ['slammed', 2.5]],
  frustrated: [['frustrated', 3], ['annoyed', 2], ['fed up', 3], ['sick of', 2.5], ['irritating', 2.5], ['aggravating', 2.5], ['no solution', 2.5], ['cant find', 2.5], ["can't find", 2.5], ['nothing works', 2.5], ['misunderstanding', 2], ['misunderstood', 2.5], ['not working', 2.5]],
  jealous: [['jealous', 3], ['envious', 3], ['resentful', 2.5], ['grudge', 2.5], ['why them', 2.5]],
  // Positive emotions (the critical gap that was missing)
  happy: [['happy', 2.5], ['joy', 2.5], ['wonderful', 2], ['amazing', 2], ['birthday', 2], ['celebration', 2.5], ['celebrate', 2.5], ['wedding', 2], ['promotion', 2], ['graduated', 2.5], ['won', 2], ['blessed', 2], ['delighted', 2.5], ['fantastic', 2.5]],
  excited: [['excited', 3], ["can't wait", 3], ['thrilled', 3], ['pumped', 2.5], ['great news', 3], ['awesome', 2], ['stoked', 2.5], ['looking forward', 2.5]],
  hopeful: [['hopeful', 3], ['optimistic', 3], ['inspired', 3], ['motivated', 2], ['breakthrough', 3], ['turning point', 3], ['fresh start', 2.5]],
  peaceful: [['peaceful', 3], ['calm', 2.5], ['serene', 3], ['relaxed', 2.5], ['content', 2.5], ['centered', 2.5], ['at peace', 3]],
  grateful: [['grateful', 3], ['thankful', 3], ['appreciate', 2.5], ['thank you', 2], ['gratitude', 3], ['fortunate', 2.5]],
}

const NEGATIVE_MOODS = new Set(['anxious', 'sad', 'angry', 'confused', 'lonely', 'overwhelmed', 'hurt', 'guilty', 'fearful', 'stressed', 'frustrated', 'jealous'])

function detectMood(message: string): { mood: string; intensity: number } {
  const lower = message.toLowerCase()
  const scores: Record<string, number> = {}
  let maxPossible = 0

  for (const [mood, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let total = 0
    let possible = 0
    for (const [kw, weight] of keywords) {
      possible += weight
      if (lower.includes(kw)) total += weight
    }
    if (total > 0) scores[mood] = total
    if (possible > maxPossible) maxPossible = possible
  }

  if (Object.keys(scores).length === 0) return { mood: 'neutral', intensity: 0.3 }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return { mood: best[0], intensity: Math.min(best[1] / (maxPossible * 0.3), 1.0) }
}

// ─── 2. Topic Detection ──────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  family: ['mother', 'father', 'mom', 'dad', 'son', 'daughter', 'brother', 'sister', 'wife', 'husband', 'parents', 'kids', 'children', 'family', 'grandma', 'grandpa', 'uncle', 'aunt', 'baby', 'sibling'],
  relationship: ['boyfriend', 'girlfriend', 'partner', 'ex', 'dating', 'breakup', 'broke up', 'marriage', 'divorce', 'crush', 'relationship', 'romantic'],
  work: ['boss', 'manager', 'job', 'office', 'colleague', 'coworker', 'career', 'promotion', 'fired', 'interview', 'salary', 'work', 'project', 'deadline', 'meeting', 'client', 'company'],
  academic: ['exam', 'test', 'school', 'college', 'university', 'grade', 'homework', 'professor', 'study', 'studying', 'course', 'class', 'assignment', 'thesis', 'semester', 'teacher'],
  health: ['sick', 'ill', 'hospital', 'doctor', 'diagnosed', 'surgery', 'medication', 'therapy', 'sleep', 'insomnia', 'headache', 'tired', 'chronic', 'disease'],
  celebration: ['birthday', 'wedding', 'anniversary', 'graduation', 'engaged', 'celebrate', 'party', 'achievement', 'won', 'award', 'milestone'],
  loss: ['died', 'death', 'passing', 'funeral', 'mourning', 'grief', 'passed away', 'gone forever', 'lost someone'],
  growth: ['goal', 'dream', 'change', 'new chapter', 'moving', 'starting', 'beginning', 'journey', 'improve', 'learn', 'grow', 'better myself'],
  spiritual: ['meditate', 'meditation', 'prayer', 'meaning', 'purpose', 'spiritual', 'soul', 'universe', 'faith', 'karma', 'dharma'],
}

function detectTopic(message: string): string {
  const lower = message.toLowerCase()
  let best = 'general'
  let bestCount = 0

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const count = keywords.filter(kw => lower.includes(kw)).length
    if (count > bestCount) { bestCount = count; best = topic }
  }
  return best
}

// ─── 3. Entity Extraction ────────────────────────────────────────────────

const PEOPLE_WORDS = ['mom', 'mother', 'dad', 'father', 'brother', 'sister', 'wife', 'husband', 'partner', 'boss', 'friend', 'colleague', 'child', 'son', 'daughter', 'girlfriend', 'boyfriend', 'grandma', 'grandpa', 'teacher', 'professor', 'ex', 'baby']
const EVENT_WORDS = ['birthday', 'wedding', 'anniversary', 'exam', 'interview', 'promotion', 'graduation', 'funeral', 'surgery', 'vacation', 'trip', 'meeting', 'deadline', 'presentation']
const TIME_WORDS = ['today', 'tomorrow', 'yesterday', 'next week', 'this week', 'tonight', 'this morning', 'last week', 'last night', 'soon']

function extractEntities(message: string): string[] {
  const lower = message.toLowerCase()
  const entities: string[] = []

  // Use word boundary regex to avoid false matches like "personal" matching "son"
  for (const word of PEOPLE_WORDS) {
    const regex = new RegExp('\\b' + word + '\\b', 'i')
    if (regex.test(lower)) entities.push(word)
  }
  for (const word of EVENT_WORDS) {
    const regex = new RegExp('\\b' + word + '\\b', 'i')
    if (regex.test(lower)) entities.push(word)
  }
  for (const word of TIME_WORDS) {
    // TIME_WORDS can be multi-word phrases like "next week" — regex handles them fine
    const regex = new RegExp('\\b' + word + '\\b', 'i')
    if (regex.test(lower)) entities.push(word)
  }

  // Extract "my [person]" pattern for possessive context (already uses word boundaries)
  const myPattern = /\bmy\s+(mom|mother|dad|father|brother|sister|wife|husband|partner|boss|friend|daughter|son|child|girlfriend|boyfriend|baby|grandma|grandpa)\b/gi
  for (const match of lower.matchAll(myPattern)) {
    const entity = `my ${match[1]}`
    if (!entities.includes(entity)) entities.push(entity)
  }

  return [...new Set(entities)]
}

// ─── 4. Intent Classification ────────────────────────────────────────────

const INTENT_PATTERNS: Record<string, string[]> = {
  celebrating: ['birthday', 'promotion', 'engaged', 'pregnant', 'got the job', 'graduated', 'passed', 'won', 'amazing news', 'so happy', 'excited about', 'great news'],
  asking_advice: ['what should i', 'what do i do', 'help me', 'advice', 'how do i', 'how can i', 'any tips', 'suggestion', 'what would you'],
  venting: ['so frustrated', 'i hate', 'sick of', 'unfair', "can't believe", 'fed up', 'why does', 'so annoying', 'ridiculous'],
  seeking_wisdom: ['meaning', 'purpose', 'why do i', 'verse', 'wisdom', 'spiritual', 'philosophy', 'deeper', 'what does life'],
  sharing: ['i have', 'i had', 'i went', 'i did', 'i was', 'happened', 'told me', 'found out', 'i got', 'we went', 'just finished'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good evening', "what's up", 'how are you', 'sup', 'howdy'],
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  // Priority order: celebrating > asking_advice > venting > seeking_wisdom > sharing > greeting
  for (const intent of ['celebrating', 'asking_advice', 'venting', 'seeking_wisdom', 'sharing', 'greeting']) {
    if (INTENT_PATTERNS[intent].some(p => lower.includes(p))) return intent
  }
  return 'sharing'
}

// ─── 5. Phase State Machine ──────────────────────────────────────────────

function getPhase(state: ConversationState): string {
  const { turnCount, moodHistory } = state
  const lastMood = moodHistory[moodHistory.length - 1] || 'neutral'
  const hasStrongEmotion = NEGATIVE_MOODS.has(lastMood)

  if (hasStrongEmotion) {
    if (turnCount <= 1) return 'connect'
    if (turnCount <= 2) return 'listen'
    if (turnCount <= 4) return 'guide'
    return 'empower'
  }

  if (turnCount <= 1) return 'connect'
  if (turnCount <= 3) return 'listen'
  if (turnCount <= 5) return 'understand'
  if (turnCount <= 8) return 'guide'
  return 'empower'
}

// ─── 6. Response Templates ───────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildEntityOpener(mood: string, topic: string, entities: string[], intent: string): string {
  // For celebrations / positive moments
  if (intent === 'celebrating' || topic === 'celebration') {
    const person = entities.find(e => PEOPLE_WORDS.includes(e))
    const event = entities.find(e => EVENT_WORDS.includes(e))
    if (person && event) return pickRandom([`Your ${person}'s ${event} — that's so special!`, `Oh wow, ${event} for your ${person}!`, `A ${event} — I love this!`])
    if (event) return pickRandom([`A ${event} — that's wonderful!`, `${event.charAt(0).toUpperCase() + event.slice(1)} time!`])
    return pickRandom(["Oh, I love this!", "This is beautiful!", "Tell me everything!"])
  }

  // For greetings
  if (intent === 'greeting') return pickRandom(["Hey friend!", "Hey! Good to see you.", "Hi! I'm here."])

  // For loss / grief
  if (topic === 'loss') {
    const person = entities.find(e => PEOPLE_WORDS.includes(e))
    if (person) return `Oh friend. Your ${person}... I'm so sorry.`
    return "I'm so sorry for your loss."
  }

  // For negative moods with entities
  if (NEGATIVE_MOODS.has(mood)) {
    const person = entities.find(e => PEOPLE_WORDS.includes(e))
    const event = entities.find(e => EVENT_WORDS.includes(e))
    const time = entities.find(e => TIME_WORDS.includes(e))

    if (event && time) return pickRandom([`${event.charAt(0).toUpperCase() + event.slice(1)} ${time} — I can feel that pressure.`, `With the ${event} ${time}, I hear you.`])
    if (event) return pickRandom([`The ${event} — yeah, that's heavy.`, `I hear you about the ${event}.`])
    if (person) return pickRandom([`When it comes to your ${person}, that's personal.`, `Your ${person} — I get why that hits deep.`])

    // Generic mood openers
    const moodOpeners: Record<string, string[]> = {
      anxious: ["I can feel that tension.", "Your mind is racing right now, isn't it?"],
      sad: ["Oh friend.", "I hear the heaviness in that."],
      angry: ["I feel that fire.", "That frustration makes total sense."],
      confused: ["I get why that feels tangled.", "Yeah, that's a lot to sort through."],
      lonely: ["The fact that you reached out — that means something.", "I'm right here."],
      overwhelmed: ["That's a LOT. I hear you.", "Yeah, that's more than anyone should carry alone."],
      hurt: ["Ouch. That hits deep.", "I'm sorry you're going through this."],
      guilty: ["That takes courage to say.", "The fact that you feel it means you care."],
      stressed: ["I can feel that weight.", "That pressure is real."],
      frustrated: ["I hear that frustration.", "Yeah, that's maddening."],
    }
    return pickRandom(moodOpeners[mood] || ["I hear you.", "Something's going on — I can feel it.", "I'm with you on this.", "Talk to me — I'm listening.", "I can tell this is weighing on you."])
  }

  // For positive moods
  const positiveOpeners: Record<string, string[]> = {
    happy: ["I love this energy!", "OK this is the kind of news I live for!", "Your vibe right now is contagious!"],
    excited: ["YES! I can feel that excitement!", "Oh this is going to be good!", "I'm already invested — tell me!"],
    hopeful: ["I love hearing that spark.", "That hope is real, and it matters.", "Something shifted, didn't it?"],
    peaceful: ["I can feel that calm coming through.", "That's beautiful.", "There's a steadiness in your words."],
    grateful: ["Gratitude looks good on you.", "I love that you're noticing the good.", "That awareness is powerful."],
  }
  return pickRandom(positiveOpeners[mood] || ["I'm listening — what's on your mind?", "I'm here for it. What's going on?", "OK, I'm all ears.", "You've got my attention.", "Let's get into it — what's happening?", "I'm right here. Walk me through it."])
}

function buildCoreBody(mood: string, topic: string, intent: string, phase: string, entities: string[]): string {
  // Phase: connect — pure empathy, mirror the emotion
  if (phase === 'connect') {
    if (intent === 'celebrating' || ['happy', 'excited', 'hopeful', 'grateful'].includes(mood)) {
      return pickRandom([
        "Moments like these are what life's actually about. Soak it in.",
        "This is the stuff memories are made of. Be fully present for it.",
        "Don't rush past this feeling — let it land. You deserve to enjoy this.",
        "Your energy is telling me everything I need to know. This matters to you.",
      ])
    }
    if (intent === 'greeting') {
      return pickRandom([
        "No agenda, no judgment. Just a friend with two ears. What's on your mind?",
        "I'm here. Whatever's going on, you don't have to carry it alone.",
        "Good to talk to you. What's happening in your world?",
      ])
    }

    // Negative mood empathy (ported from backend _build_empathy_response)
    const empathyTemplates: Record<string, string[]> = {
      anxious: [
        "Your brain right now is like a browser with 47 tabs open, half playing different music. You don't need to close them all — let's just find the loudest one.",
        "Take a breath with me. Just one. In... and out. The future isn't here yet. We're just in THIS moment.",
        "The anxiety is running disaster simulations. But think about your track record — you've survived 100% of your worst days.",
      ],
      sad: [
        "You don't need to put on a brave face right now. Not with me. This is a judgment-free zone.",
        "Grief isn't something to 'get over.' It's something to walk through. And you don't have to walk alone.",
        "Some days are just heavy. You don't need to fix everything today.",
      ],
      angry: [
        "Your anger is telling me something important — a line was crossed that matters to you. That's not weakness, that's values.",
        "I'm not going to tell you to calm down. Your frustration is valid. Let it breathe for a moment.",
        "Anger is like rocket fuel — in a rocket it takes you to the moon, in a dumpster it just burns. Let's aim yours somewhere useful.",
      ],
      lonely: [
        "You reached out right now. That tiny act tells me something huge: you're braver than loneliness wants you to believe.",
        "Loneliness is a liar. It tells you no one cares, but here you are, and here I am. That's not nothing.",
      ],
      overwhelmed: [
        "Imagine a kitchen after Thanksgiving dinner. You don't clean it all at once — you start with ONE counter. What's your one counter?",
        "Here's permission you didn't know you needed: you don't have to be productive today. Sometimes 'showing up' means drinking water.",
      ],
      confused: [
        "Feeling stuck is your brain saying 'I need more info before I decide.' That's not weakness — that's intelligence.",
        "Clarity doesn't come from thinking harder. It comes from one small step. What's the tiniest next thing you could do?",
      ],
      hurt: [
        "That kind of pain doesn't have a quick fix, and I'm not going to pretend it does. But I'm here.",
        "When someone hurts you, it's natural to want to protect yourself. Your guard going up isn't a problem — it's wisdom.",
      ],
      guilty: [
        "Guilt can be heavy. But the fact that you feel it means you care about doing right. That's not a flaw, that's your compass working.",
        "The past already happened. You can't edit it. But THIS moment? It's a blank page. What do you want to write?",
      ],
      stressed: [
        "Your body is literally in fight-or-flight right now. That's biology, not weakness. Let's give your nervous system a moment.",
        "Stress is your brain treating a Tuesday like a tiger attack. The alarm is real, but the tiger isn't. What's the actual threat?",
      ],
      frustrated: [
        "Something isn't working the way it should, and you care enough to be frustrated about it. That tells me a lot about you.",
        "Frustration is the gap between what IS and what you KNOW is possible. You see a better version. That's insight, not impatience.",
      ],
    }
    const neutralEmpathyResponses = [
      "I hear you. Let me understand what's going on — walk me through it.",
      "I'm picking up that something's on your mind. No rush — let's talk through it together.",
      "That's real, and I'm glad you're sharing it. Help me understand what's happening.",
      "OK, I'm with you. There's clearly something beneath the surface here. What's the full picture?",
      "You've got my full attention. I want to get this right — tell me more about what's really going on.",
      "Something's clearly weighing on you. I don't want to assume — fill me in on what's happening.",
      "I can tell this matters to you. Whatever it is, I'm here for it — no judgment, just listening.",
    ]
    return pickRandom(empathyTemplates[mood] || neutralEmpathyResponses)
  }

  // Phase: listen — deepening questions, complex reflections
  if (phase === 'listen') {
    const listenTemplates: Record<string, string[]> = {
      anxious: ["It sounds like your brain is running worst-case scenarios on full blast. The irony? The need for certainty IS the anxiety.", "There's a pattern I'm noticing — the worry isn't about one thing, it's about losing control. Sound right?"],
      sad: ["There's a depth to what you're carrying. It's not just sadness — it's the weight of something that mattered deeply.", "How long have you been holding this? Sometimes just naming the timeline helps it feel less infinite."],
      angry: ["I think what's really happening is someone crossed a line that matters deeply to you. Your anger isn't the problem — it's the messenger.", "Underneath the frustration, I'm hearing something else. Fear? Hurt? What's at the bottom of this?"],
      lonely: ["Loneliness isn't about being alone — it's about not feeling seen. When's the last time someone really saw you?", "Social media makes everyone look connected. But real connection? That's rare and valuable. Like what we're doing right now."],
      overwhelmed: ["When everything feels urgent, nothing actually is. Your brain is in emergency mode. Let's downshift together.", "Let me ask you something: if you could only fix ONE thing from this pile, which one would give you the most relief?"],
      confused: ["What are the two things pulling you in different directions? Sometimes naming both sides of the tug-of-war helps.", "You're not confused because you're weak. You're confused because you can see multiple truths at once. That's actually depth."],
    }
    return pickRandom(listenTemplates[mood] || ["Tell me more about what's underneath this. I'm listening to understand, not to fix."])
  }

  // Phase: understand — pattern naming, deeper insight
  if (phase === 'understand') {
    const understandTemplates: Record<string, string[]> = {
      anxious: ["Here's what I'm seeing: your mind is trying to protect you by preparing for every possible outcome. But that protection has become its own problem. The guard is exhausting the person it's guarding.", "You know what I notice? When you're anxious, you're actually living in two timelines — the one where things go wrong AND the one where you're already dealing with the fallout. Neither is real. THIS moment is real."],
      sad: ["What I hear is someone who loved something deeply enough to grieve it. That capacity to care? It's the same capacity that will carry you forward.", "There's a version of you that believes this heaviness is permanent. But you've weathered storms before. The sun didn't stop existing just because clouds showed up."],
      angry: ["Your anger has been doing a job — protecting something vulnerable underneath. What would happen if you put the armor down, just for a moment?", "I've noticed the anger spikes when you feel unheard or unseen. That's not anger issues — that's a human need for respect."],
    }
    return pickRandom(understandTemplates[mood] || ["I'm starting to see a pattern here. Your reaction makes complete sense when I look at the bigger picture of what you've shared."])
  }

  // Phase: guide — deliver wisdom through modern framing
  if (phase === 'guide') {
    return pickRandom([
      "Here's something that changed how I see things like this:",
      "Can I share a perspective? It hit me hard when I first heard it:",
      "You know what I've learned about situations like yours?",
      "Someone once told me something that rewired how I think about this:",
    ])
  }

  // Phase: empower — affirm strength, encourage action
  return pickRandom([
    "You know what I see in you? Someone who already has the answers but hasn't given themselves permission to trust them yet.",
    "Real talk? You've survived 100% of your worst days. Your track record is literally flawless.",
    "The fact that you keep showing up, keep talking, keep trying — that's not luck. That's character.",
    "I've been watching you process this, and you're handling it with more wisdom than you realize.",
  ])
}

function buildFollowUp(mood: string, topic: string, phase: string, intent: string, entities: string[]): string {
  // Topic-specific follow-ups (highest priority)
  if (topic !== 'general') {
    const topicFollowUps: Record<string, string[]> = {
      celebration: ["Tell me everything — what are you planning?", "How are you celebrating?", "Who else is involved in the celebration?"],
      family: ["How are things between you two?", "What's the dynamic been like lately?", "How does that make you feel about your relationship with them?"],
      work: ["How long has this been going on at work?", "What would make the biggest difference in this situation?", "If you could change ONE thing about it, what would it be?"],
      academic: ["How are you feeling about your preparation?", "What's the subject that's got you most concerned?", "When exactly is it?"],
      loss: ["What's one thing about them you want to tell me?", "How are you taking care of yourself through this?", "What are the days like right now?"],
      relationship: ["What's the thing that's weighing on you most about this?", "How long have you been feeling this way?", "What would 'better' look like for you?"],
      health: ["How are you managing day to day?", "Who's supporting you through this?", "What would help you feel even a little better right now?"],
      growth: ["What made you decide to make this change?", "What does success look like for you?", "What's the first step?"],
      spiritual: ["What brought you to this question?", "What does your gut tell you?", "Is there a specific area of your life where this applies?"],
    }
    const pool = topicFollowUps[topic]
    if (pool) {
      // Try entity-specific variants
      const person = entities.find(e => PEOPLE_WORDS.includes(e))
      if (person && topic === 'celebration') return pickRandom([`How old is your ${person} turning?`, `What's the plan for your ${person}?`, `Tell me about your ${person}!`])
      if (person && topic === 'family') return `What's going on with your ${person}?`
      return pickRandom(pool)
    }
  }

  // Phase-specific follow-ups (ported from backend _build_psychology_follow_up)
  const phaseFollowUps: Record<string, string[]> = {
    connect: ["What's weighing on you the most right now?", "How does that sit with you when you say it out loud?", "What's the feeling underneath all of this?"],
    listen: ["How long have you been carrying this?", "Has there been a moment recently where this felt even a little lighter?", "What would it feel like to put this burden down, just for a moment?"],
    understand: ["When you step back and look at the pattern, what do you see?", "What do you think your future self would say about this moment?", "If you could change one thing about this situation, what would it be?"],
    guide: ["What do you think about that perspective?", "Does that resonate with where you are right now?", "How could you apply that starting today?"],
    empower: ["What's the smallest win you could have this week?", "What would you tell a friend going through the same thing?", "What's one thing you're proud of right now?"],
  }
  return pickRandom(phaseFollowUps[phase] || ["What else is on your mind?"])
}

// ─── 7. Gita Wisdom (curated, phase-gated) ──────────────────────────────

const WISDOM_CORE: WisdomEntry[] = [
  { wisdom: "Think of it like applying for your dream job — you pour everything in, then let go. You did YOUR part. The result isn't yours to control. That's where freedom actually lives.", principle: 'detachment_from_outcomes', verse_ref: '2.47', moods: ['anxious', 'stressed', 'overwhelmed'], topics: ['work', 'academic', 'general'] },
  { wisdom: "Emotions are like weather — storms pass, sun returns. The mistake is building your identity around today's emotional forecast. You are the sky, not the clouds.", principle: 'impermanence', verse_ref: '2.14', moods: ['sad', 'hurt', 'lonely'], topics: ['general', 'loss', 'relationship'] },
  { wisdom: "When anger shows up, it hijacks the smart part of your brain. Literally — the prefrontal cortex goes offline. One conscious breath? That's you taking back the wheel.", principle: 'emotional_regulation', verse_ref: '2.63', moods: ['angry', 'frustrated'], topics: ['relationship', 'work', 'family'] },
  { wisdom: "Your mind is like a puppy — it pulls in every direction. You don't punish a puppy, you train it with patience. Each time you notice your mind wandering? That's one rep. That's progress.", principle: 'mind_mastery', verse_ref: '6.6', moods: ['anxious', 'confused', 'overwhelmed'], topics: ['general', 'health', 'academic'] },
  { wisdom: "You are your own best friend AND your own worst enemy. Same person, same mind. The difference is which voice you choose to listen to right now.", principle: 'self_as_friend', verse_ref: '6.5', moods: ['sad', 'guilty', 'lonely', 'hurt'], topics: ['general', 'growth'] },
  { wisdom: "Overthinking is procrastination wearing a thinking cap. Action creates clarity — you don't wait to feel ready, you start and readiness follows.", principle: 'action_over_overthinking', verse_ref: '3.19', moods: ['confused', 'anxious', 'stressed'], topics: ['work', 'academic', 'growth'] },
  { wisdom: "Balance isn't about doing everything equally. It's about knowing when to push and when to rest. Even nature has seasons — growth AND stillness.", principle: 'balance', verse_ref: '6.17', moods: ['overwhelmed', 'stressed', 'peaceful'], topics: ['health', 'work', 'general'] },
  { wisdom: "When everything feels heavy, sometimes the bravest thing isn't fighting harder — it's letting go. Not giving up. Giving over. There's a difference.", principle: 'surrender', verse_ref: '18.66', moods: ['overwhelmed', 'anxious', 'hurt', 'sad'], topics: ['general', 'loss', 'health'] },
  { wisdom: "Stop comparing your chapter 3 to someone else's chapter 20. Your imperfect path, walked authentically, beats someone else's path walked perfectly.", principle: 'your_unique_path', verse_ref: '18.47', moods: ['jealous', 'confused', 'frustrated'], topics: ['work', 'growth', 'relationship'] },
  { wisdom: "Knowledge isn't just information — it's self-awareness. When you understand your patterns and triggers, you stop being their puppet.", principle: 'self_knowledge', verse_ref: '4.38', moods: ['confused', 'angry', 'frustrated'], topics: ['general', 'growth', 'relationship'] },
  { wisdom: "You can be IN the storm without being OF the storm. The chaos around you doesn't have to become the chaos within you.", principle: 'inner_peace_amid_chaos', verse_ref: '5.24', moods: ['stressed', 'overwhelmed', 'anxious'], topics: ['work', 'family', 'general'] },
  { wisdom: "The real difference between people who build the life they want? It's not talent — it's showing up on Tuesday. Consistency beats intensity every single time.", principle: 'consistent_action', verse_ref: '2.40', moods: ['hopeful', 'confused', 'frustrated'], topics: ['growth', 'work', 'academic'] },
  { wisdom: "Desire isn't the problem. It's clinging to desire — white-knuckling outcomes — that creates suffering. Hold your goals like a bird: firm enough it doesn't fly away, gentle enough you don't crush it.", principle: 'desire_management', verse_ref: '3.37', moods: ['anxious', 'stressed', 'frustrated'], topics: ['work', 'relationship', 'general'] },
  { wisdom: "You don't need to earn your worth through achievement. A leaf, a flower, water — the smallest offering, given sincerely, is enough. YOU are enough.", principle: 'inherent_worth', verse_ref: '9.26', moods: ['guilty', 'sad', 'lonely', 'hurt'], topics: ['general', 'growth', 'relationship'] },
  { wisdom: "Even the most broken person, choosing to grow, is regarded as righteous. Your past doesn't define you. Your next choice does.", principle: 'redemption', verse_ref: '9.30', moods: ['guilty', 'hurt', 'sad'], topics: ['general', 'growth'] },
  { wisdom: "Peace doesn't come from controlling everything. It comes from letting desires flow through you like rivers into the ocean — always receiving, never disturbed.", principle: 'inner_peace', verse_ref: '2.70', moods: ['anxious', 'overwhelmed', 'stressed'], topics: ['general', 'health'] },
  { wisdom: "One who is undisturbed by misery and unattached to happiness — that's not numbness, that's mastery. You can feel everything without being controlled by anything.", principle: 'equanimity', verse_ref: '2.56', moods: ['sad', 'anxious', 'overwhelmed', 'peaceful'], topics: ['general', 'health', 'growth'] },
  { wisdom: "The things that happen TO you are temporary. Who you BECOME through them is permanent. You're not just surviving this — you're being shaped by it.", principle: 'growth_through_adversity', verse_ref: '2.23', moods: ['sad', 'hurt', 'fearful', 'stressed'], topics: ['general', 'loss', 'health'] },
  { wisdom: "Gratitude isn't ignoring what's hard. It's seeing what's good ALONGSIDE what's hard. Both can exist at once. That's not toxic positivity — that's the full picture.", principle: 'gratitude_amid_difficulty', verse_ref: '14.24', moods: ['grateful', 'happy', 'peaceful', 'hopeful'], topics: ['general', 'celebration', 'growth'] },
  { wisdom: "Your right is to the work itself, never to what comes from it. Freedom isn't getting everything you want — it's being at peace with whatever comes.", principle: 'karma_yoga', verse_ref: '2.48', moods: ['anxious', 'stressed', 'frustrated'], topics: ['work', 'academic', 'general'] },
  { wisdom: "When the forest of delusion clears, you become indifferent to what was heard and what is yet to come. That's clarity — not knowing everything, but needing to.", principle: 'clarity', verse_ref: '2.52', moods: ['confused', 'anxious'], topics: ['general', 'spiritual', 'growth'] },
  { wisdom: "Celebration itself is sacred. Joy isn't frivolous — it's fuel. The moments where you feel alive are telling you something about who you really are.", principle: 'joy_as_purpose', verse_ref: '10.20', moods: ['happy', 'excited', 'grateful', 'peaceful'], topics: ['celebration', 'family', 'general'] },
  { wisdom: "The connections that matter most aren't the ones you perform — they're the ones you feel. Being present with someone? That's the real offering.", principle: 'presence_as_love', verse_ref: '12.14', moods: ['happy', 'grateful', 'lonely', 'hopeful'], topics: ['family', 'relationship', 'celebration'] },
  { wisdom: "In this endeavor there is no loss. Even a little progress protects you from the greatest fear. Every step counts. Even the ones that feel small.", principle: 'no_effort_is_wasted', verse_ref: '2.40', moods: ['hopeful', 'confused', 'frustrated', 'overwhelmed'], topics: ['growth', 'academic', 'work'] },
]

function selectWisdom(mood: string, topic: string, phase: string, lastPrinciple: string | null): WisdomEntry | null {
  if (phase !== 'guide' && phase !== 'empower') return null

  const scored = WISDOM_CORE.map(entry => {
    let score = 0
    // Mood match (+3)
    if (entry.moods.includes(mood)) score += 3
    // Topic match (+2)
    if (entry.topics.includes(topic)) score += 2
    // Novelty (+3)
    if (entry.principle !== lastPrinciple) score += 3
    // Phase alignment
    if (phase === 'empower' && ['self_as_friend', 'inherent_worth', 'redemption', 'growth_through_adversity', 'consistent_action'].includes(entry.principle)) score += 2
    if (phase === 'guide' && ['detachment_from_outcomes', 'karma_yoga', 'mind_mastery', 'action_over_overthinking', 'balance'].includes(entry.principle)) score += 2
    return { entry, score }
  }).filter(s => s.score > 2).sort((a, b) => b.score - a.score)

  if (scored.length === 0) return null
  // Pick from top 3 for variety
  const top = scored.slice(0, Math.min(3, scored.length))
  return pickRandom(top).entry
}

// ─── 8. Crisis Detection ─────────────────────────────────────────────────

const CRISIS_SIGNALS = ['kill myself', 'suicide', 'end my life', 'want to die', "don't want to live", 'self harm', 'self-harm', 'cutting myself', 'hurt myself', 'no reason to live', 'better off dead', "can't go on", 'end it all', 'take my life']

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase()
  return CRISIS_SIGNALS.some(s => lower.includes(s))
}

function buildCrisisResponse(): string {
  return "I hear you, and I'm really glad you told me this. What you're feeling is real, and it matters. You matter.\n\nI want to be honest: I care deeply, but right now you deserve to talk to someone who can truly help.\n\nPlease reach out:\n\u2022 iCall: 9152987821 (India)\n\u2022 Vandrevala Foundation: 1860-2662-345 (24/7)\n\u2022 Crisis Text Line: Text HOME to 741741 (US)\n\u2022 International: findahelpline.com\n\nI'm not going anywhere. I'll be right here before, during, and after you reach out."
}

// ─── 9. Response Assembly ────────────────────────────────────────────────

function assembleResponse(opener: string, body: string, followUp: string, wisdom: WisdomEntry | null, phase: string): string {
  const parts: string[] = [opener]

  if (phase === 'guide' && wisdom) {
    // In guide phase, wisdom IS the core body
    parts.push(body) // transition phrase
    parts.push(wisdom.wisdom)
  } else if (phase === 'empower' && wisdom) {
    parts.push(body)
    parts.push(wisdom.wisdom)
  } else {
    parts.push(body)
  }

  parts.push(followUp)
  return parts.join(' ')
}

// ─── 10. Public API ──────────────────────────────────────────────────────

export function generateLocalResponse(
  message: string,
  turnCount: number = 0,
  conversationMoods: string[] = [],
  lastWisdomPrinciple: string | null = null,
): FriendEngineResult {
  // Crisis check
  if (detectCrisis(message)) {
    return {
      response: buildCrisisResponse(),
      mood: 'sad',
      mood_intensity: 1.0,
      topic: 'general',
      intent: 'sharing',
      entities: [],
      phase: 'connect',
      wisdom_used: null,
    }
  }

  const { mood, intensity } = detectMood(message)
  const topic = detectTopic(message)
  const entities = extractEntities(message)
  const intent = detectIntent(message)

  const state: ConversationState = {
    turnCount,
    moodHistory: [...conversationMoods, mood],
    topicHistory: [],
    entitiesHistory: entities,
    currentPhase: 'connect',
    lastWisdomPrinciple: lastWisdomPrinciple,
  }
  const phase = getPhase(state)

  const wisdom = selectWisdom(mood, topic, phase, lastWisdomPrinciple)
  const opener = buildEntityOpener(mood, topic, entities, intent)
  const body = buildCoreBody(mood, topic, intent, phase, entities)
  const followUp = buildFollowUp(mood, topic, phase, intent, entities)
  const response = assembleResponse(opener, body, followUp, wisdom, phase)

  return {
    response,
    mood,
    mood_intensity: intensity,
    topic,
    intent,
    entities,
    phase,
    wisdom_used: wisdom ? { principle: wisdom.principle, verse_ref: wisdom.verse_ref } : null,
  }
}

/** Stateful engine for tracking conversation across turns */
export class KiaanFriendEngine {
  private turnCount = 0
  private moodHistory: string[] = []
  private lastWisdomPrinciple: string | null = null

  processMessage(message: string): FriendEngineResult {
    const result = generateLocalResponse(
      message,
      this.turnCount,
      this.moodHistory,
      this.lastWisdomPrinciple,
    )

    this.turnCount++
    this.moodHistory.push(result.mood)
    if (result.wisdom_used) this.lastWisdomPrinciple = result.wisdom_used.principle

    return result
  }

  getState() {
    return { turnCount: this.turnCount, moodHistory: this.moodHistory, lastWisdomPrinciple: this.lastWisdomPrinciple }
  }

  resetState() {
    this.turnCount = 0
    this.moodHistory = []
    this.lastWisdomPrinciple = null
  }
}
