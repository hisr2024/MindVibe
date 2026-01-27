/**
 * KIAAN Crisis Detection System
 *
 * Detects signs of severe distress, suicidal ideation, or crisis
 * and provides immediate compassionate support with helpline information.
 *
 * CRITICAL: This is a safety feature for mental health support.
 * Always err on the side of caution and provide resources.
 */

export type CrisisLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical'

export interface CrisisAssessment {
  level: CrisisLevel
  detected: boolean
  keywords: string[]
  response: string
  shouldShowHelpline: boolean
  helplines: Helpline[]
  followUpQuestions?: string[]
}

export interface Helpline {
  name: string
  number: string
  description: string
  country: string
  available: string
}

// Crisis keywords organized by severity
const CRISIS_KEYWORDS = {
  critical: [
    'kill myself',
    'want to die',
    'end my life',
    'suicide',
    'suicidal',
    'don\'t want to live',
    'no reason to live',
    'better off dead',
    'end it all',
    'can\'t go on',
    'goodbye forever',
    'final goodbye',
    'self harm',
    'hurt myself',
    'cutting myself',
    'overdose',
    'hang myself',
    'jump off',
    'slit my wrist'
  ],
  high: [
    'no point in living',
    'wish i was dead',
    'wish i wasn\'t alive',
    'tired of living',
    'can\'t take it anymore',
    'nothing matters',
    'no way out',
    'trapped',
    'unbearable pain',
    'can\'t cope',
    'giving up',
    'lost all hope',
    'empty inside',
    'burden to everyone',
    'everyone would be better without me',
    'hate myself',
    'worthless'
  ],
  moderate: [
    'hopeless',
    'helpless',
    'don\'t care anymore',
    'can\'t see a future',
    'pointless',
    'numb',
    'invisible',
    'alone in this',
    'nobody cares',
    'nobody understands',
    'want to disappear',
    'exhausted from life',
    'drowning',
    'falling apart',
    'breaking down'
  ],
  low: [
    'really struggling',
    'feeling low',
    'dark thoughts',
    'hard to get up',
    'can\'t sleep',
    'not eating',
    'isolating',
    'withdrawing',
    'overwhelmed',
    'anxious all the time',
    'panic attacks',
    'scared',
    'worried constantly'
  ]
}

// Helplines by country
const HELPLINES: Helpline[] = [
  {
    name: 'iCall',
    number: '9152987821',
    description: 'Psychosocial helpline by TISS',
    country: 'India',
    available: 'Mon-Sat, 8am-10pm'
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    description: 'Mental health support 24/7',
    country: 'India',
    available: '24/7'
  },
  {
    name: 'NIMHANS',
    number: '080-46110007',
    description: 'National Institute of Mental Health helpline',
    country: 'India',
    available: '24/7'
  },
  {
    name: 'Snehi',
    number: '044-24640050',
    description: 'Emotional support helpline',
    country: 'India',
    available: '24/7'
  },
  {
    name: 'AASRA',
    number: '91-22-27546669',
    description: 'Crisis intervention center',
    country: 'India',
    available: '24/7'
  },
  {
    name: 'National Suicide Prevention',
    number: '988',
    description: 'Suicide & Crisis Lifeline',
    country: 'USA',
    available: '24/7'
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    description: 'Text-based crisis support',
    country: 'USA',
    available: '24/7'
  },
  {
    name: 'Samaritans',
    number: '116 123',
    description: 'Emotional support helpline',
    country: 'UK',
    available: '24/7'
  }
]

// Compassionate crisis responses
const CRISIS_RESPONSES = {
  critical: [
    "I hear you, and I'm deeply concerned about what you're sharing. Your life matters, and there are people who want to help you through this moment. Please reach out to a crisis helpline right now - they are trained to help and available 24/7.",
    "Thank you for trusting me with something so painful. What you're feeling right now is temporary, even though it doesn't feel that way. Please, reach out to someone who can help you right now. You don't have to face this alone.",
    "I'm here with you in this moment, and I care about your wellbeing. These feelings you're having - they can get better with the right support. Please call one of these helplines. They understand what you're going through."
  ],
  high: [
    "I can sense you're carrying tremendous pain right now. The Gita teaches that even in our darkest moments, the eternal light within us never dims. But right now, you need human support. Please consider reaching out to someone who can help.",
    "What you're feeling is real and valid, but these thoughts don't have to define your future. You matter more than you know. Would you consider talking to someone trained in crisis support?",
    "Your pain is evident, and I want you to know that reaching out takes courage. There is hope, even when we can't see it. Please know that professional support is available to help you through this."
  ],
  moderate: [
    "I hear the struggle in your words. These feelings are heavy, but they are not permanent. The Gita reminds us that we are not our suffering - we are the consciousness witnessing it. Would you like to talk more about what you're experiencing?",
    "It sounds like you're going through a very difficult time. Please know that these feelings, as intense as they are, do shift with time and support. I'm here to listen, and I want to make sure you have access to additional support if you need it.",
    "Thank you for sharing something so personal. Feeling this way is more common than you might think, and there is no shame in struggling. Let's take this one moment at a time together."
  ],
  low: [
    "I can tell things have been hard for you lately. It takes strength to acknowledge when we're struggling. The Gita teaches that challenges are opportunities for growth, but we don't have to face them alone. How can I support you right now?",
    "What you're feeling is valid, and I'm glad you're expressing it. Sometimes just naming our struggles helps lighten them. Would you like to explore these feelings together, or would a calming practice help?",
    "I'm here for you. These difficult periods are part of the human journey, and they do pass. Let's breathe together for a moment and find some ground."
  ]
}

// Follow-up questions to assess severity
const FOLLOW_UP_QUESTIONS = {
  critical: [
    "Are you safe right now?",
    "Is there someone with you, or can you call someone to be with you?",
    "Have you thought about how you might hurt yourself?"
  ],
  high: [
    "How long have you been feeling this way?",
    "Have you talked to anyone about these feelings?",
    "Is there someone you trust who you could reach out to right now?"
  ],
  moderate: [
    "When did these feelings start?",
    "What has been helping you cope so far?",
    "Would you like to explore some grounding techniques together?"
  ]
}

// Grounding techniques for moderate distress
const GROUNDING_TECHNIQUES = [
  {
    name: "5-4-3-2-1",
    instruction: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings you back to the present moment."
  },
  {
    name: "Box Breathing",
    instruction: "Breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, hold for 4 counts. Repeat this cycle four times."
  },
  {
    name: "Feet on Ground",
    instruction: "Press your feet firmly into the floor. Feel the solid ground beneath you. You are here, you are supported, you are real."
  },
  {
    name: "Cold Water",
    instruction: "If possible, splash cold water on your face or hold ice cubes. The sensation helps reset the nervous system."
  }
]

/**
 * Analyze message for crisis indicators
 */
export function detectCrisis(message: string): CrisisAssessment {
  const lowerMessage = message.toLowerCase()
  const detectedKeywords: string[] = []
  let highestLevel: CrisisLevel = 'none'

  // Priority order for crisis levels (higher index = more severe)
  const levelPriority: Record<CrisisLevel, number> = {
    'none': 0,
    'low': 1,
    'moderate': 2,
    'high': 3,
    'critical': 4
  }

  // Check each level for keywords
  for (const [level, keywords] of Object.entries(CRISIS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword)
        // Set level to highest found based on priority
        const currentLevel = level as CrisisLevel
        if (levelPriority[currentLevel] > levelPriority[highestLevel]) {
          highestLevel = currentLevel
        }
      }
    }
  }

  if (highestLevel === 'none') {
    return {
      level: 'none',
      detected: false,
      keywords: [],
      response: '',
      shouldShowHelpline: false,
      helplines: []
    }
  }

  // Get appropriate response
  const responses = CRISIS_RESPONSES[highestLevel as keyof typeof CRISIS_RESPONSES]
  const response = responses[Math.floor(Math.random() * responses.length)]

  // Determine if helplines should be shown
  const shouldShowHelpline = ['critical', 'high', 'moderate'].includes(highestLevel)

  // Get follow-up questions
  const followUpQuestions = FOLLOW_UP_QUESTIONS[highestLevel as keyof typeof FOLLOW_UP_QUESTIONS]

  return {
    level: highestLevel,
    detected: true,
    keywords: detectedKeywords,
    response,
    shouldShowHelpline,
    helplines: shouldShowHelpline ? HELPLINES : [],
    followUpQuestions
  }
}

/**
 * Get a grounding technique for someone in distress
 */
export function getGroundingTechnique(): { name: string; instruction: string } {
  return GROUNDING_TECHNIQUES[Math.floor(Math.random() * GROUNDING_TECHNIQUES.length)]
}

/**
 * Get crisis response with Gita wisdom
 */
export function getCrisisWisdomResponse(level: CrisisLevel): string {
  const wisdomResponses = {
    critical: "In this moment of darkness, remember the Gita's eternal truth: 'The soul is never born and never dies. It is eternal, indestructible.' Your pain is real, but it is not who you are. Please reach out for help right now.",
    high: "The Gita teaches: 'When one's mind is in distress, one should seek refuge in the wise.' You are showing wisdom by sharing this. Now take the next step and reach out to someone trained to help.",
    moderate: "Lord Krishna says: 'The mind is restless and difficult to control, but it can be trained through practice.' What you're feeling now can change. Let me share some techniques that might help ground you.",
    low: "The Gita reminds us: 'From anger comes delusion; from delusion, the loss of memory. But through patience and practice, peace returns.' You're taking the first step by acknowledging these feelings.",
    none: ""
  }

  return wisdomResponses[level]
}

/**
 * Format helplines for display or speech
 */
export function formatHelplinesForSpeech(helplines: Helpline[]): string {
  if (helplines.length === 0) return ''

  const indianHelplines = helplines.filter(h => h.country === 'India')

  if (indianHelplines.length > 0) {
    const primary = indianHelplines[0]
    return `You can reach ${primary.name} at ${primary.number}. They are available ${primary.available} and are trained to help with exactly what you're going through.`
  }

  return `Please reach out to a crisis helpline in your area. They are available 24/7 and want to help you.`
}

/**
 * Get safety plan prompt
 */
export function getSafetyPlanPrompt(): string {
  return `Let's create a simple safety plan together:

1. Warning signs: What thoughts, feelings, or situations make things worse for you?
2. Coping strategies: What has helped you feel better in the past, even a little?
3. People to contact: Who are 2-3 people you could reach out to when things feel hard?
4. Safe environments: Where do you feel safest? Can you go there when struggling?
5. Professional support: Have you considered speaking with a counselor or therapist?

Remember, having a plan doesn't mean you'll need it - it means you're prepared and taking care of yourself.`
}

/**
 * Check if message contains crisis content and needs priority handling
 */
export function needsCrisisPriority(message: string): boolean {
  const assessment = detectCrisis(message)
  return ['critical', 'high'].includes(assessment.level)
}

/**
 * Get gentle check-in message for someone who previously showed distress
 */
export function getDistressFollowUp(previousLevel: CrisisLevel): string {
  const followUps = {
    critical: "I've been thinking about you since we last spoke. How are you feeling right now? Remember, the helplines are always available if you need to talk to someone.",
    high: "I wanted to check in with you. I sensed you were carrying something heavy last time. How are you doing today?",
    moderate: "Hello, dear one. I remember our last conversation. I hope today is bringing you some moments of peace. How are you feeling?",
    low: "Welcome back. I hope you've found some ease since we last spoke. What brings you here today?",
    none: ""
  }

  return followUps[previousLevel]
}
