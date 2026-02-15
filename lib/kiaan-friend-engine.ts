/**
 * KIAAN Local Friend Engine - Intelligent Response Generation Without OpenAI
 *
 * Mirrors the architecture of Ardha/Viyoga/Relationship Compass engines:
 * 1. Weighted mood detection (17 emotions + positive emotions)
 * 2. Topic detection (family, work, academic, celebration, loss, etc.)
 * 3. Entity extraction (daughter, exam, boss, etc.)
 * 4. Intent classification (sharing, venting, celebrating, asking advice)
 * 5. Phase-progressive responses (connect → listen → understand → guide → empower)
 * 6. Full 701-verse Gita Wisdom Core (phase-gated, mood+topic scored)
 * 7. Psychology-backed templates (CBT, ACT, Polyvagal, behavioral science)
 */

import { getGroundedWisdom } from '@/lib/wisdom-core'

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
    if (person && event) return pickRandom([`Your ${person}'s ${event} — that's a meaningful moment.`, `A ${event} for your ${person}. That matters.`])
    if (event) return pickRandom([`A ${event} — that's worth acknowledging.`, `${event.charAt(0).toUpperCase() + event.slice(1)} — good. Tell me about it.`])
    return pickRandom(["That sounds significant. Tell me more.", "Good news activates the reward system for a reason. What happened?"])
  }

  // For greetings
  if (intent === 'greeting') return pickRandom(["Hey. I'm here.", "Hi. What's on your mind?", "Good to hear from you. What's going on?"])

  // For loss / grief
  if (topic === 'loss') {
    const person = entities.find(e => PEOPLE_WORDS.includes(e))
    if (person) return `Your ${person}. I hear you. That kind of loss is real.`
    return "Loss activates some of the deepest pain circuits we have. I'm here."
  }

  // For negative moods with entities
  if (NEGATIVE_MOODS.has(mood)) {
    const person = entities.find(e => PEOPLE_WORDS.includes(e))
    const event = entities.find(e => EVENT_WORDS.includes(e))
    const time = entities.find(e => TIME_WORDS.includes(e))

    if (event && time) return pickRandom([`The ${event} ${time} — your nervous system is registering that pressure.`, `With the ${event} ${time}, that's a real stressor.`])
    if (event) return pickRandom([`The ${event} — that's carrying weight right now.`, `I hear you about the ${event}.`])
    if (person) return pickRandom([`When it involves your ${person}, the emotional stakes are higher.`, `Your ${person} — attachment bonds make this hit differently.`])

    // Mood-specific openers grounded in psychology
    const moodOpeners: Record<string, string[]> = {
      anxious: ["Your threat detection system is active right now.", "I can tell your nervous system is in alert mode."],
      sad: ["That heaviness you're describing is real.", "I hear the weight in that."],
      angry: ["That anger is carrying information.", "Your frustration is signaling something important."],
      confused: ["Multiple competing signals at once — that's disorienting.", "Your brain is trying to process conflicting inputs."],
      lonely: ["You reached out. That's a regulation strategy, and it's a good one.", "I'm here. Connection is a basic human need, not a weakness."],
      overwhelmed: ["Your cognitive load is past capacity right now.", "That's more than one system can process at once."],
      hurt: ["That kind of pain registers deeply.", "When trust is involved, the impact is amplified."],
      guilty: ["Naming guilt takes honesty. That itself tells me something about your values.", "Guilt is your value system flagging a mismatch."],
      stressed: ["Your stress response is active. That's physiology, not a character flaw.", "That pressure is real and measurable."],
      frustrated: ["Frustration signals a gap between expectation and reality.", "Something isn't working the way it should. That registers."],
    }
    return pickRandom(moodOpeners[mood] || ["I hear you.", "Something is happening. Let's look at it clearly.", "I'm here. Tell me what's going on.", "I can tell this is weighing on you."])
  }

  // For positive moods
  const positiveOpeners: Record<string, string[]> = {
    happy: ["That positive affect is real. Notice what conditions created it.", "Good. Your reward circuitry is online."],
    excited: ["Anticipation activates dopamine — your brain is already investing. Tell me.", "That energy is useful. What's driving it?"],
    hopeful: ["Hope is a forward-looking cognitive state. Something shifted.", "That's your brain modeling a better outcome. What changed?"],
    peaceful: ["That calm is a regulated nervous system. Worth noticing.", "Parasympathetic activation — your body found safety. Good."],
    grateful: ["Gratitude literally changes neural firing patterns. You're doing something right.", "Noticing the good is a skill. You're using it."],
  }
  return pickRandom(positiveOpeners[mood] || ["I'm listening. What's on your mind?", "I'm here. What's going on?", "Tell me what's happening.", "Walk me through it."])
}

function buildCoreBody(mood: string, topic: string, intent: string, phase: string, _entities: string[]): string {
  // Phase: connect — validate the emotion, name the mechanism
  if (phase === 'connect') {
    if (intent === 'celebrating' || ['happy', 'excited', 'hopeful', 'grateful'].includes(mood)) {
      return pickRandom([
        "Positive emotions broaden your attention and build psychological resources. This state is functional, not frivolous — stay with it.",
        "Your brain is releasing dopamine and oxytocin right now. These aren't just feelings — they're building blocks for resilience. Let this register fully.",
        "Savoring positive experiences literally strengthens neural pathways for well-being. Don't rush past this. Let it consolidate.",
        "What you're feeling right now is your reward system confirming alignment with something that matters to you.",
      ])
    }
    if (intent === 'greeting') {
      return pickRandom([
        "I'm here. No agenda, no pressure. Whatever's on your mind, we can look at it together.",
        "Good to connect. What's present for you right now?",
        "I'm listening. Whatever it is, we'll approach it clearly.",
      ])
    }

    // Negative mood — regulate first, then name mechanism
    const empathyTemplates: Record<string, string[]> = {
      anxious: [
        "Your amygdala is running threat simulations right now. That's your brain's protection system working overtime. It's not a flaw — it's a feature on overdrive. One slow exhale activates your vagus nerve and starts to dial it down.",
        "Anxiety is future-focused rumination — your mind rehearsing scenarios that haven't happened. Right now, in this actual moment, you're safe. Let's anchor there.",
        "Your nervous system is in sympathetic activation. The racing thoughts, the tension — that's cortisol and adrenaline doing their job. They'll metabolize. You don't have to fight them, just ride them out.",
      ],
      sad: [
        "Sadness is your brain's way of processing loss or unmet need. It's not dysfunction — it's an appropriate response to something that mattered. You don't need to override it.",
        "What you're feeling has a function. Sadness slows you down so you can process. That's not weakness — it's your system recalibrating.",
        "You don't need to perform being okay right now. The heaviness you're describing is real neurochemistry, not a character flaw.",
      ],
      angry: [
        "Anger is a boundary signal — it activates when something you value has been violated. That's not irrational. It's your value system in action. The question is what you do with the signal.",
        "Right now your prefrontal cortex is competing with your limbic system. The impulse is strong, but it's not the full picture. Take one breath before anything else.",
        "Your anger is data, not a directive. It's telling you a line was crossed. That information is useful — but only if you can process it without the cortisol spike making decisions for you.",
      ],
      lonely: [
        "Loneliness activates the same brain regions as physical pain. What you're feeling is not an exaggeration — it's literally painful. And you reached out, which is a regulation strategy.",
        "Social isolation triggers your threat detection system. You're wired for connection — feeling its absence is not neediness, it's neurobiology.",
      ],
      overwhelmed: [
        "When input exceeds your processing capacity, your executive function starts to shut down. That's not failure — it's cognitive overload. The fix is subtraction, not more effort. What's one thing you can remove from the pile?",
        "Your working memory holds about four items at once. You're trying to hold twenty. No wonder it's breaking. Let's narrow the field to just one thing.",
      ],
      confused: [
        "Confusion means your brain is holding multiple valid options without enough data to rank them. That's not indecision — that's incomplete information. What do you actually need to know?",
        "Clarity doesn't come from more thinking. It comes from one small action that generates feedback. What's the smallest test you could run?",
      ],
      hurt: [
        "Emotional pain from rejection or betrayal activates the anterior cingulate cortex — the same area that processes physical injury. Your pain is not an overreaction. It's real.",
        "When someone important causes pain, the attachment system and the threat system fire simultaneously. That's why it feels so disorienting.",
      ],
      guilty: [
        "Guilt is a values-discrepancy signal — your behavior didn't match your own standards. That discomfort means your moral compass is working. The question is what you do next, not what you did before.",
        "The past can't be edited. But your capacity for repair is active right now. Guilt that leads to action is functional. Guilt that loops into shame is not.",
      ],
      stressed: [
        "Your HPA axis is activated — cortisol is up, attention is narrowing, and your body is preparing for threat. That's your stress response working correctly. But the response itself becomes the problem when it doesn't deactivate.",
        "Stress is your brain treating the current demand as exceeding your resources. Sometimes that assessment is accurate, sometimes it's overestimating the demand. Which is it here?",
      ],
      frustrated: [
        "Frustration is the gap between expected outcome and actual outcome. Your brain predicted something should work, and it didn't. That prediction error is what's generating the emotional charge.",
        "When effort doesn't produce results, your dopamine system flags it. The frustration is your brain saying 'this approach isn't working — try a different one.'",
      ],
    }
    const neutralEmpathyResponses = [
      "I hear you. Help me understand what's actually happening — the specifics matter.",
      "Something is registering for you right now. Let's look at it clearly rather than in the abstract.",
      "I want to understand the actual situation, not just the feeling. Walk me through what happened.",
      "There's something here worth examining. What's the core of it?",
    ]
    return pickRandom(empathyTemplates[mood] || neutralEmpathyResponses)
  }

  // Phase: listen — identify patterns, name mechanisms
  if (phase === 'listen') {
    const listenTemplates: Record<string, string[]> = {
      anxious: ["There's a pattern here: your worry isn't about one specific thing — it's about uncertainty itself. The intolerance of not-knowing is the engine. The specific fears are just the content it grabs.", "Notice what your brain is doing: it's trying to solve a problem that hasn't happened yet. That's called anticipatory anxiety. The strategy that would actually help is the opposite — staying in the present moment."],
      sad: ["What you're describing has a timeline. How long has this been present? Sometimes naming when it started reveals the actual trigger underneath.", "The heaviness has a pattern to it. Is it constant, or does it come in waves? Waves suggest processing. Constant suggests something that needs attention."],
      angry: ["Underneath anger, there's almost always something more vulnerable — fear, hurt, or helplessness. The anger is the protective layer. What's it guarding?", "Your anger spikes when you feel dismissed or unseen. That's an attachment response, not an anger problem. The need for recognition is driving the emotion."],
      lonely: ["Loneliness and being alone are different circuits. You can feel lonely in a room full of people. What you're missing isn't presence — it's feeling understood.", "The pull toward isolation often comes from a belief that connection will lead to rejection. That's a conditioned pattern, not a prediction of the future."],
      overwhelmed: ["Your brain is treating all tasks as equally urgent. They're not. Prioritization breaks the overwhelm. If you could only do one thing, what would give you the most relief?", "Overwhelm is often a decision problem disguised as a volume problem. You don't have too much to do — you have too many unmade decisions."],
      confused: ["Name the competing values pulling you in different directions. Confusion usually isn't about facts — it's about values conflict.", "You can hold multiple truths at once without resolving them immediately. The pressure to decide right now might be the actual source of distress, not the decision itself."],
    }
    return pickRandom(listenTemplates[mood] || ["Let's go deeper. What pattern do you notice when you step back from this?"])
  }

  // Phase: understand — name the deeper pattern, connect dots
  if (phase === 'understand') {
    const understandTemplates: Record<string, string[]> = {
      anxious: ["Here's the mechanism: your threat detection system learned at some point that hypervigilance kept you safe. Now it runs automatically, even when the threat is gone. The alarm isn't matching the actual danger level — it's matching the old one.", "You're running a cognitive distortion called catastrophizing — jumping to the worst-case scenario and treating it as probable. Your evidence doesn't support the conclusion. What would a realistic assessment look like?"],
      sad: ["What I'm hearing is grief for something that mattered. Grief is the price of attachment, and the depth of your pain reflects the depth of what you valued. That's not pathology — that's being human.", "There's a pattern here: you're treating a temporary emotional state as a permanent identity. 'I am sad' versus 'I am experiencing sadness.' The first fuses you with it. The second gives you distance."],
      angry: ["Your anger has been serving a protective function — it keeps vulnerability at a distance. But the protection costs you connection. When the armor is always on, no one can reach you.", "The pattern is: perceived disrespect → threat response → anger → withdrawal or escalation. The intervention point is between perception and response. That gap is where your choice lives."],
    }
    return pickRandom(understandTemplates[mood] || ["I can see the pattern now. Your response makes complete sense given your conditioning. But the pattern that protected you then may be limiting you now."])
  }

  // Phase: guide — deliver insight through psychological framing
  if (phase === 'guide') {
    return pickRandom([
      "Here's what the research shows about situations like this:",
      "There's a concept from behavioral science that applies directly here:",
      "Let me name the mechanism at play, because understanding it changes the dynamic:",
      "The psychology here is clear, and once you see it, you can work with it:",
    ])
  }

  // Phase: empower — reinforce agency and capacity
  return pickRandom([
    "You already have the data you need. The next step isn't more information — it's trusting your own assessment and acting on it.",
    "Your track record of handling difficulty is 100%. Not because it was easy, but because you adapted. That capacity hasn't gone anywhere.",
    "The fact that you can observe your own patterns means you're no longer fully inside them. That metacognitive awareness is the foundation of change.",
    "You're not waiting for readiness. Readiness is a myth. Action comes first, confidence follows.",
  ])
}

function buildFollowUp(mood: string, topic: string, phase: string, intent: string, entities: string[]): string {
  // Topic-specific follow-ups (highest priority)
  if (topic !== 'general') {
    const topicFollowUps: Record<string, string[]> = {
      celebration: ["What does this mean for you specifically?", "What conditions made this possible?", "How are you marking this?"],
      family: ["What's the current dynamic?", "What changed recently?", "What do you need from this relationship right now?"],
      work: ["How long has this pattern been active?", "What's within your direct control here?", "What would shift this situation most?"],
      academic: ["What's the specific concern — preparation, capability, or outcome?", "What's your actual evidence about readiness?", "What's the timeline?"],
      loss: ["What do you need right now — space to feel it, or help processing it?", "How are you managing basic self-care through this?", "What does a day look like currently?"],
      relationship: ["What's the core need that isn't being met?", "How long has this pattern been running?", "What would 'workable' look like, concretely?"],
      health: ["How are you managing day to day, practically?", "Who's in your support system?", "What's one thing that would make today slightly more manageable?"],
      growth: ["What triggered this decision to change?", "What does a concrete first step look like?", "What's your actual metric for progress?"],
      spiritual: ["What's the practical question underneath the abstract one?", "Where in your daily life does this show up?", "What would an answer actually change for you?"],
    }
    const pool = topicFollowUps[topic]
    if (pool) {
      const person = entities.find(e => PEOPLE_WORDS.includes(e))
      if (person && topic === 'celebration') return pickRandom([`What does this mean for your ${person}?`, `What's the plan for your ${person}?`])
      if (person && topic === 'family') return `What's happening with your ${person} specifically?`
      return pickRandom(pool)
    }
  }

  // Phase-specific follow-ups — grounded, not poetic
  const phaseFollowUps: Record<string, string[]> = {
    connect: ["What's the most pressing thing right now?", "When you say it out loud, what shifts?", "What's the feeling underneath?"],
    listen: ["How long has this been running?", "When was the last time this felt different?", "What triggers it most reliably?"],
    understand: ["When you look at the pattern, what do you notice?", "What would you change if you could change one thing?", "What does this pattern cost you?"],
    guide: ["Does that mechanism match what you're experiencing?", "How could you apply that this week, concretely?"],
    empower: ["What's one small action you could take before tomorrow?", "What would you tell someone else in this same situation?"],
  }
  return pickRandom(phaseFollowUps[phase] || ["What else is relevant here?"])
}

// ─── 7. Gita Wisdom — Full 701-Verse Corpus (phase-gated) ───────────────
// Uses the Wisdom Core engine (lib/wisdom-core.ts) to select from the
// complete authenticated Bhagavad Gita corpus with psychology framing.

function selectWisdom(mood: string, topic: string, phase: string, recentVerseRefs: string[]): WisdomEntry | null {
  if (phase !== 'guide' && phase !== 'empower') return null

  // Query the full 701-verse Wisdom Core
  const result = getGroundedWisdom(mood, topic, recentVerseRefs)

  if (result) {
    return {
      wisdom: result.wisdom,
      principle: result.principle,
      verse_ref: result.verse_ref,
      moods: [],   // Not used for scoring — Wisdom Core handles scoring internally
      topics: [],  // Not used for scoring — Wisdom Core handles scoring internally
    }
  }

  return null
}

// ─── 8. Crisis Detection ─────────────────────────────────────────────────

const CRISIS_SIGNALS = ['kill myself', 'suicide', 'end my life', 'want to die', "don't want to live", 'self harm', 'self-harm', 'cutting myself', 'hurt myself', 'no reason to live', 'better off dead', "can't go on", 'end it all', 'take my life']

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase()
  return CRISIS_SIGNALS.some(s => lower.includes(s))
}

function buildCrisisResponse(): string {
  return "I hear you. What you're describing is serious, and I want to be direct: you deserve support from someone trained for this. That is not a weakness — it is the right action.\n\nPlease reach out now:\n\u2022 iCall: 9152987821 (India)\n\u2022 Vandrevala Foundation: 1860-2662-345 (24/7)\n\u2022 Crisis Text Line: Text HOME to 741741 (US)\n\u2022 International: findahelpline.com\n\nThese are trained professionals who can help with exactly what you're going through. I'm here too, but they have tools I don't."
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
  recentVerseRefs: string[] = [],
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
  }
  const phase = getPhase(state)

  // Select wisdom from the full 701-verse corpus via Wisdom Core
  const wisdom = selectWisdom(mood, topic, phase, recentVerseRefs)
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
  private recentVerseRefs: string[] = []

  processMessage(message: string): FriendEngineResult {
    const result = generateLocalResponse(
      message,
      this.turnCount,
      this.moodHistory,
      this.recentVerseRefs,
    )

    this.turnCount++
    this.moodHistory.push(result.mood)
    if (result.wisdom_used) {
      this.recentVerseRefs.push(result.wisdom_used.verse_ref)
      // Keep only last 10 verse refs for novelty tracking
      if (this.recentVerseRefs.length > 10) {
        this.recentVerseRefs = this.recentVerseRefs.slice(-10)
      }
    }

    return result
  }

  getState() {
    return { turnCount: this.turnCount, moodHistory: this.moodHistory, recentVerseRefs: this.recentVerseRefs }
  }

  resetState() {
    this.turnCount = 0
    this.moodHistory = []
    this.recentVerseRefs = []
  }
}
