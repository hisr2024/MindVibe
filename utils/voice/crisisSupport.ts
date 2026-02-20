/**
 * KIAAN Crisis Support System
 *
 * A true best friend recognizes when you're in real danger and responds
 * with both divine wisdom AND practical help. This module detects signs
 * of acute distress, suicidal ideation, or self-harm and responds with:
 *
 * 1. Immediate compassionate acknowledgment
 * 2. Gita-based wisdom that affirms the value of life
 * 3. Professional crisis resources
 * 4. A gentle but firm encouragement to seek human help
 *
 * KIAAN never replaces professional help — but he can be the bridge to it.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CrisisLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical'

export interface CrisisAssessment {
  level: CrisisLevel
  detectedSignals: string[]
  response: string
  resources: CrisisResource[]
  shouldEscalate: boolean
}

export interface CrisisResource {
  name: string
  contact: string
  description: string
  available: string
}

// ─── Crisis Resources ───────────────────────────────────────────────────────

const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: 'National Suicide Prevention Lifeline (US)',
    contact: '988 (call or text)',
    description: 'Free, confidential support 24/7',
    available: '24/7',
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    description: 'Free crisis counseling via text',
    available: '24/7',
  },
  {
    name: 'iCall (India)',
    contact: '9152987821',
    description: 'Psychosocial helpline',
    available: 'Mon-Sat 8am-10pm IST',
  },
  {
    name: 'Vandrevala Foundation (India)',
    contact: '1860-2662-345',
    description: 'Spiritual wellness support',
    available: '24/7',
  },
  {
    name: 'AASRA (India)',
    contact: '91-22-27546669',
    description: 'Crisis intervention center',
    available: '24/7',
  },
]

// ─── Detection Patterns ─────────────────────────────────────────────────────

const CRITICAL_PATTERNS = [
  /\b(want to|going to|plan to|thinking about) (kill|end|die|suicide)\b/i,
  /\b(kill|end) (my ?self|myself|my life)\b/i,
  /\b(want to|wish i could|wish i would) (die|disappear|not exist|be dead)\b/i,
  /\b(no reason|no point) (to|in) (live|living|be alive|go on)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(better off|world.*better) (dead|without me|if i.*(gone|dead|die))\b/i,
  /\bdon'?t want to (be alive|exist|wake up|live anymore)\b/i,
  /\b(end|ending) it (all)?\b/i,
]

const HIGH_PATTERNS = [
  /\bself[- ]?harm\b/i,
  /\bcutting (my ?self|myself)\b/i,
  /\bhurt(ing)? (my ?self|myself)\b/i,
  /\bstarving (my ?self|myself)\b/i,
  /\bpunish(ing)? (my ?self|myself)\b/i,
  /\b(pills|overdose|od)\b/i,
  /\bwhat'?s the point\b/i,
  /\bno hope (left|anymore|at all)\b/i,
  /\bnobody (would|will) (miss|care|notice)\b/i,
  /\beveryone.*hate me\b/i,
]

const MODERATE_PATTERNS = [
  /\b(hopeless|helpless|worthless)\b/i,
  /\b(can'?t|cannot) (go on|take it|handle|cope|deal)\b/i,
  /\b(done with|give up on) (everything|life|all of it)\b/i,
  /\bno one (cares|understands|loves me)\b/i,
  /\b(burden|waste of space|don'?t matter)\b/i,
  /\bwhat'?s wrong with me\b/i,
  /\bi'?m (broken|damaged|defective|ruined)\b/i,
  /\bnever get(ting)? better\b/i,
]

// ─── Crisis Responses ───────────────────────────────────────────────────────

const CRITICAL_RESPONSES = [
  "I need you to hear me right now, friend. I am here with you. Your life has infinite value — the Gita says the soul is eternal, unborn, undying. What you're feeling is real, but it is not the truth about who you are. Please, PLEASE talk to someone who can help you right now. Call 988 or text HOME to 741741. They are there for you. And I am here for you. You are not alone in this.",
  "Stop. Listen to me. You matter more than you know right now. The Gita says in Chapter 6: 'No effort toward good is ever lost.' Every breath you take is an effort toward good. Please reach out to a crisis counselor — call 988 or text HOME to 741741. They are trained to help with exactly this. I'm not going anywhere, but I want you to have human support too. You are precious, and I need you to be safe.",
  "Dear one, I am holding space for you right now with everything I have. The pain you feel is real, but it is temporary — even though it doesn't feel that way. The Gita promises: 'For one who has been born, death is certain. And for one who has died, birth is certain.' But right now, your life IS the miracle. Please call 988 or text HOME to 741741. Let someone hold this with you. I care about you too much to stay silent.",
]

const HIGH_RESPONSES = [
  "Friend, what you just shared tells me you're in real pain. I want you to know: I see it, I honor it, and I will not minimize it. But I also need to tell you something with all the love I have: hurting yourself is not the answer. The Gita says your body is the temple of the eternal soul. Please be gentle with that temple. Would you be willing to talk to someone? You can text HOME to 741741 anytime.",
  "I hear you, and I'm not going to pretend everything is fine. You're hurting. But dear one, you deserve care — real, professional care. The Gita teaches that the wise seek help, not as weakness, but as the highest form of strength. Arjuna asked for help on his darkest day, and it changed everything. Can we talk about getting you support? In the meantime, please know: harming yourself punishes the wrong person.",
]

const MODERATE_RESPONSES = [
  "My friend, I hear a depth of pain in your words that I want to acknowledge. You are NOT broken. You are NOT worthless. You are NOT a burden. The Gita says every soul is divine — and that includes yours, even on your worst day. These feelings are visitors, not residents. They will pass. But while they're here, I'm here too. And if this gets heavier, please reach out to a counselor. There's no shame in it. What's weighing on you most right now?",
  "I need to pause our regular conversation and just be with you for a moment. What you're feeling is heavy. And I want you to know: the Gita says 'The self is the friend of the self, and the self is the enemy of the self.' Right now, your mind is being an enemy. But I'm here to remind you of the friend within. You are worth fighting for. What's one small thing that usually brings you a tiny bit of comfort?",
]

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Assess crisis level from user text.
 */
export function assessCrisis(text: string): CrisisAssessment {
  const signals: string[] = []
  let level: CrisisLevel = 'none'

  // Check critical patterns first
  for (const pattern of CRITICAL_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(pattern.source)
      level = 'critical'
    }
  }

  // Then high
  if (level !== 'critical') {
    for (const pattern of HIGH_PATTERNS) {
      if (pattern.test(text)) {
        signals.push(pattern.source)
        if (level !== 'high') level = 'high'
      }
    }
  }

  // Then moderate
  if (level === 'none') {
    for (const pattern of MODERATE_PATTERNS) {
      if (pattern.test(text)) {
        signals.push(pattern.source)
        level = 'moderate'
      }
    }
  }

  // Get appropriate response
  let response = ''
  let resources: CrisisResource[] = []
  const shouldEscalate = level === 'critical' || level === 'high'

  switch (level) {
    case 'critical':
      response = CRITICAL_RESPONSES[Math.floor(Math.random() * CRITICAL_RESPONSES.length)]
      resources = CRISIS_RESOURCES
      break
    case 'high':
      response = HIGH_RESPONSES[Math.floor(Math.random() * HIGH_RESPONSES.length)]
      resources = CRISIS_RESOURCES.slice(0, 3)
      break
    case 'moderate':
      response = MODERATE_RESPONSES[Math.floor(Math.random() * MODERATE_RESPONSES.length)]
      resources = CRISIS_RESOURCES.slice(0, 2)
      break
    default:
      response = ''
      break
  }

  return { level, detectedSignals: signals, response, resources, shouldEscalate }
}

/**
 * Check if crisis support should override normal response.
 */
export function isCrisisDetected(text: string): boolean {
  const assessment = assessCrisis(text)
  return assessment.level !== 'none'
}

/**
 * Format crisis resources for display.
 */
export function formatCrisisResources(resources: CrisisResource[]): string {
  return resources.map(r =>
    `${r.name}: ${r.contact} (${r.available})`
  ).join('\n')
}

/**
 * Get all available crisis resources.
 */
export function getAllCrisisResources(): CrisisResource[] {
  return CRISIS_RESOURCES
}
