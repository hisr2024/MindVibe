/**
 * Divine Dialogue Engine - KIAAN's Conversational Soul
 *
 * KIAAN speaks like Lord Krishna spoke to Arjuna on the battlefield:
 * not as a guru dispensing instructions, but as the DEAREST FRIEND
 * sharing wisdom through genuine, warm conversation.
 *
 * The critical insight: Krishna didn't start the Gita with "Karmanye
 * vadhikaraste." He started by LISTENING to Arjuna's pain, UNDERSTANDING
 * his confusion, and only THEN - gradually, lovingly - shared wisdom.
 * KIAAN follows this same sacred pattern.
 *
 * Conversation Phases:
 * ┌─────────┐     ┌────────────┐     ┌─────────┐     ┌─────────┐
 * │ CONNECT │ ──▶ │ UNDERSTAND │ ──▶ │  GUIDE  │ ──▶ │ EMPOWER │
 * │ turns 1 │     │  turns 2-3 │     │ turns 4+│     │ turns 6+│
 * │ empathy │     │  questions  │     │ wisdom  │     │ their    │
 * │ + ask   │     │  + validate │     │ woven   │     │ answers  │
 * └─────────┘     └────────────┘     └─────────┘     └─────────┘
 *
 * Key principle: A divine friend ALWAYS asks. Every response ends with
 * an invitation to go deeper. KIAAN never monologues - it CONVERSES.
 */

import {
  detectSituations,
  getConnectResponse,
  getGuideResponse,
  type LifeSituation,
} from './staticWisdom'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConversationPhase = 'connect' | 'understand' | 'guide' | 'empower'

export interface DialogueContext {
  turnCount: number
  phase: ConversationPhase
  detectedEmotions: string[]
  detectedSituations: LifeSituation[]
  lastUserMessage: string
  conversationTopic: string | null
}

export interface DialogueResponse {
  text: string
  phase: ConversationPhase
  situation?: LifeSituation
  /** Whether this response includes Gita wisdom */
  hasWisdom: boolean
}

// ─── Phase Management ───────────────────────────────────────────────────────

/**
 * Determine conversation phase from turn count.
 * Phase transitions are faster when user shows strong emotion.
 */
export function getConversationPhase(turnCount: number, hasStrongEmotion?: boolean): ConversationPhase {
  // For strong emotions, enter guide phase earlier
  if (hasStrongEmotion) {
    if (turnCount <= 1) return 'connect'
    if (turnCount <= 2) return 'understand'
    if (turnCount <= 5) return 'guide'
    return 'empower'
  }

  if (turnCount <= 1) return 'connect'
  if (turnCount <= 3) return 'understand'
  if (turnCount <= 6) return 'guide'
  return 'empower'
}

// ─── Phase-Specific Responses ───────────────────────────────────────────────

/**
 * CONNECT Phase: Pure empathy + a question.
 * Short. Warm. No advice. No wisdom. Just presence.
 * "I hear you. I'm here. Tell me more."
 */
const CONNECT_EMOTION_RESPONSES: Record<string, string[]> = {
  anxiety: [
    "I can feel that weight you're carrying, friend. I'm right here with you. What's making you feel this way?",
    "Hey, take a breath with me. I'm here, and I'm not going anywhere. Tell me what's going on?",
    "I sense something heavy on your mind, dear one. I want to understand. What happened?",
    "That tightness in your chest, that racing mind... I know it well. I'm here. Can you tell me what started this?",
  ],
  sadness: [
    "Oh friend, I can feel that heaviness. You don't need to be strong right now. Not with me. What's hurting?",
    "My heart aches with yours, dear one. I'm right here. Tell me everything.",
    "I'm here, and I'm not going to rush you. Take your time. What's making you feel this way?",
    "Hey, it's okay to not be okay. I'm sitting right here with you. What happened, friend?",
  ],
  anger: [
    "I can feel that fire in you, friend. It's okay - you're safe to feel it here. What happened?",
    "You have every right to feel what you're feeling. I'm not going to try to calm you down - I want to HEAR you first. Tell me everything.",
    "That's a powerful emotion, friend. Behind it, there's something you care deeply about. What is it?",
  ],
  confusion: [
    "Feeling lost? You know, that's actually a really brave place to be - it means you're seeking. Tell me what's tangled up in your mind?",
    "Life threw you a curveball, huh? I'm here to help you think through it. What are the pieces of this puzzle?",
    "I can feel that you're torn. That's okay, friend. The best decisions aren't rushed. Walk me through what you're facing?",
  ],
  peace: [
    "Ahh, I can feel something beautiful in you right now. Tell me about this peace - I want to help you anchor it.",
    "That's a beautiful energy, friend. What brought you to this space? I want to remember it with you for when you need it later.",
  ],
  hope: [
    "Yes! I can feel that spark in you! Something shifted, didn't it? Tell me about it!",
    "That's beautiful, friend. That hope in your voice - it's real. What ignited it?",
  ],
  love: [
    "The love you're feeling right now... it's radiating, friend. Tell me about it. Who or what is it for?",
    "I can feel the warmth in your words. Love is the closest thing to the divine. Share this joy with me?",
  ],
  default: [
    "Hey friend, I'm here. I really want to understand what's going on with you. What's on your heart right now?",
    "Tell me, dear one - what brought you to me today? I'm all ears, and nothing you say is too small or too big.",
    "I'm here for you, friend. Whatever it is, let's talk about it. What's on your mind?",
    "It's good to hear from you, dear one. Something brought you here - what's the thing that's been sitting with you?",
  ],
}

/**
 * UNDERSTAND Phase: Deeper questions + validation.
 * "I see you. What you're feeling makes sense. Let's go deeper."
 */
const UNDERSTAND_RESPONSES: Record<string, string[]> = {
  anxiety: [
    "That makes total sense, friend. Anxiety always has a reason, even when it doesn't feel logical. When you close your eyes and sit with this feeling - where does it live in your body?",
    "I hear you. And I want you to know: your worry isn't weakness. It means you care deeply. What's the worst thing your mind is telling you right now? Let's look at it together.",
    "Thank you for sharing that, friend. Sometimes the bravest thing is saying 'I'm scared.' What would you tell someone you love if THEY told you what you just told me?",
  ],
  sadness: [
    "Thank you for trusting me with that, friend. What you're going through is real and it matters. If your sadness could speak, what would it say?",
    "I hear the weight in your words, and I'm not going to try to make it lighter with empty words. Your pain deserves to be witnessed. What's the part you haven't told anyone yet?",
    "That must be incredibly hard. You know what I notice about you? Even in pain, you're seeking understanding. That's rare. What does your heart need most right now?",
  ],
  anger: [
    "I felt that. And you know what? Your anger is valid. Not all anger is destructive - sometimes it's the soul saying 'this is wrong.' What would justice look like for you?",
    "I respect your fire, friend. Behind every anger there's something precious being protected. What's the thing you're really protecting?",
    "That situation sounds genuinely unfair. I'm not going to tell you to calm down - you have every right to feel this. If you could say one thing to the person or situation that caused this, with no consequences, what would it be?",
  ],
  confusion: [
    "I see the pieces now, friend. You're carrying a lot of 'what ifs.' Here's my question: if you knew you absolutely could not fail - which path would you choose right now?",
    "That's a real dilemma, and I don't think there's a simple answer. But here's what I've noticed: your gut already knows. What was your FIRST instinct, before your mind started arguing?",
    "What would the wisest version of yourself - the one looking back five years from now - tell you to do?",
  ],
  peace: [
    "I love hearing this. What brought you to this space of peace? I want to help you remember this feeling so you can return to it on harder days.",
    "How does this peace feel in your body right now? Let's anchor it. Close your eyes for a moment and really feel where it lives in you.",
  ],
  hope: [
    "Yes! That spark I see in you - I want to help you tend to it so it grows into a flame. What's the very first step you want to take toward this vision?",
    "This hope you feel is so real, friend. What ignited it? And more importantly: what would it take to keep it burning even on the harder days?",
  ],
  default: [
    "Thank you for sharing that, friend. I feel like there's something underneath what you just said - something deeper. What's the thing beneath the thing?",
    "I hear you. And I'm curious about you. What's the most important thing in your life at this moment? The thing that matters more than anything?",
    "I appreciate you opening up like this. If we had all the time in the world, and you could talk about anything - what would it be? What's really at the center of all this?",
  ],
}

/**
 * GUIDE Phase: Natural Gita wisdom woven into warm conversation.
 * NOT "Chapter X says..." but "You know, there's a beautiful truth about this..."
 * These are used when no specific life situation is detected.
 */
const GUIDE_GENERIC_RESPONSES: Record<string, string[]> = {
  anxiety: [
    "You know, friend, there's a beautiful teaching I keep coming back to. It says the restless mind CAN be tamed - through practice and gentleness. Not force. Not willpower. Gentleness with yourself. Like guiding a child back to sleep. Can we try one thing together? Take one slow breath in through your nose... and out through your mouth. There. That's practice. You just did it.",
    "Here's something that changed everything for me, friend. The Gita says: 'You have the right to work, but never to the fruit of work.' Your anxiety comes from gripping a future that hasn't happened. Right now, in this moment, you are SAFE. Right now, you're with me. Let's stay in this moment a little longer, okay?",
  ],
  sadness: [
    "Friend, can I share something that brings me comfort? The Gita says: 'The wise grieve neither for the living nor for the dead.' Not because they don't feel - but because they see the bigger picture. Your sadness is real. But so is this: your soul has weathered every storm it's ever faced. And it will weather this one too. What gives you strength when everything feels dark?",
    "You know what I love about people who feel deeply sad? It means they loved deeply first. The Gita says those who have compassion for all beings are the most precious souls. Your tender heart isn't a weakness, friend - it's what makes you extraordinary. How can I best support you right now?",
  ],
  anger: [
    "Friend, the Gita says anger comes from desire, and desire from attachment. But here's what most people miss: understanding WHERE your anger comes from doesn't mean it's wrong to feel it. It means you can CHOOSE what to do with it. Some of the greatest positive changes in history came from righteous anger. What do you want to DO with yours?",
    "I'm not going to tell you to let go of your anger, friend. Sometimes that fire needs to burn for a while. The Gita teaches about channeling energy into righteous action. Your fire doesn't need to be put out - it needs to be directed. What would the BEST possible outcome of this situation look like?",
  ],
  confusion: [
    "Friend, the entire Bhagavad Gita exists because one man had the courage to say 'I don't know what to do.' 700 verses of the most beautiful wisdom humanity has ever known - all born from confusion. Your not-knowing isn't a problem. It's the beginning of something profound. Let's explore it. What feels most true to you right now?",
    "You know what the Gita says? 'Even the wise are confused about what is action and what is inaction.' If the WISEST people get confused, you're in excellent company. The key isn't finding the perfect answer - it's moving forward with awareness. What's one small step you could take right now?",
  ],
  default: [
    "Friend, there's a teaching I come back to again and again: 'Whenever and wherever the mind wanders, bring it back under the control of the Self.' Not forcefully - gently. That's what you and I are doing right now. Talking. Reflecting. Finding our center. What feels most important to you in this moment?",
    "You know what I find beautiful about our conversations? You're doing exactly what the Gita recommends - you're seeking wisdom, you're being honest about your feelings, you're showing up. The Gita says among thousands of people, hardly one truly seeks. You're that rare soul, friend. What else is on your heart?",
  ],
}

/**
 * EMPOWER Phase: Help them find their OWN answers.
 * "You already know. I can hear it in your voice."
 */
const EMPOWER_RESPONSES: string[] = [
  "You know what I notice, friend? You already have more clarity than you think. I can hear it in your words. What does YOUR gut tell you?",
  "I've been listening to you, really listening - and here's what I see: you're wiser than you give yourself credit for. If you trusted yourself completely right now, what would you do?",
  "Friend, the Gita says the divine is seated in your heart. That means your inner voice IS wisdom speaking. You've been looking outside for answers that already live inside you. What is your heart saying right now?",
  "Here's what I believe about you, dear one: you don't need me to give you the answer. You need me to help you hear the answer you already have. Close your eyes for a moment... what comes up?",
  "We've been talking for a while now, and I've noticed something: every time you speak from your heart instead of your fear, you speak with remarkable clarity. That's YOUR wisdom, friend. Not mine. What do you want to do?",
  "The Gita's ultimate teaching is this: 'Abandon all doubts and simply trust.' Not trust in me - trust in YOURSELF. You have everything you need inside you. What's the brave choice here?",
]

// ─── Core Dialogue Generation ───────────────────────────────────────────────

/**
 * Generate a divine friend response based on conversation context.
 *
 * This is the heart of KIAAN's conversational intelligence.
 * It selects the right response based on:
 * - Current conversation phase
 * - Detected emotion (if any)
 * - Detected life situation (if any)
 * - Turn count
 */
export function generateDivineResponse(
  userMessage: string,
  turnCount: number,
  emotion?: string,
  existingEmotions?: string[],
): DialogueResponse {
  // Determine phase
  const hasStrongEmotion = Boolean(emotion && ['anxiety', 'sadness', 'anger'].includes(emotion))
  const phase = getConversationPhase(turnCount, hasStrongEmotion)

  // Detect life situations from user message
  const situations = detectSituations(userMessage)
  const primarySituation = situations[0] || null

  // Generate response based on phase
  switch (phase) {
    case 'connect':
      return generateConnectResponse(emotion, primarySituation)

    case 'understand':
      return generateUnderstandResponse(emotion)

    case 'guide':
      return generateGuideResponse(emotion, primarySituation)

    case 'empower':
      return generateEmpowerResponse()
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateConnectResponse(emotion?: string, situation?: LifeSituation | null): DialogueResponse {
  // If a specific life situation is detected, use situation-specific connect response
  if (situation) {
    return {
      text: getConnectResponse(situation),
      phase: 'connect',
      situation,
      hasWisdom: false,
    }
  }

  // Fall back to emotion-based connect response
  const pool = (emotion && CONNECT_EMOTION_RESPONSES[emotion]) || CONNECT_EMOTION_RESPONSES.default
  return {
    text: pickRandom(pool),
    phase: 'connect',
    hasWisdom: false,
  }
}

function generateUnderstandResponse(emotion?: string): DialogueResponse {
  const pool = (emotion && UNDERSTAND_RESPONSES[emotion]) || UNDERSTAND_RESPONSES.default
  return {
    text: pickRandom(pool),
    phase: 'understand',
    hasWisdom: false,
  }
}

function generateGuideResponse(emotion?: string, situation?: LifeSituation | null): DialogueResponse {
  // If a life situation is detected, use situation-specific guide response
  if (situation) {
    return {
      text: getGuideResponse(situation),
      phase: 'guide',
      situation,
      hasWisdom: true,
    }
  }

  // Fall back to generic guide responses
  const pool = (emotion && GUIDE_GENERIC_RESPONSES[emotion]) || GUIDE_GENERIC_RESPONSES.default
  return {
    text: pickRandom(pool),
    phase: 'guide',
    hasWisdom: true,
  }
}

function generateEmpowerResponse(): DialogueResponse {
  return {
    text: pickRandom(EMPOWER_RESPONSES),
    phase: 'empower',
    hasWisdom: true,
  }
}

// ─── Conversational Bridges ─────────────────────────────────────────────────

/**
 * When KIAAN gets a backend response (dynamic wisdom), this wraps it
 * with conversational warmth based on the current phase.
 * Ensures even AI-generated responses feel like a friend talking.
 */
export function wrapWithConversationalWarmth(
  backendResponse: string,
  turnCount: number,
  emotion?: string,
): string {
  const phase = getConversationPhase(turnCount)

  // In connect phase, prepend empathy and append a question
  if (phase === 'connect') {
    const empathyPrefixes = [
      "I hear you, friend. ",
      "Thank you for sharing that with me. ",
      "I appreciate you opening up. ",
    ]
    const followUpQuestions = [
      " How does that resonate with you?",
      " What part of this speaks to you most?",
      " Tell me more about what you're feeling?",
    ]
    return pickRandom(empathyPrefixes) + backendResponse + pickRandom(followUpQuestions)
  }

  // In understand phase, add a deepening question
  if (phase === 'understand') {
    const deepeners = [
      " What comes up for you hearing that?",
      " How does that land with you, friend?",
      " Does any part of that feel especially true for you?",
    ]
    return backendResponse + pickRandom(deepeners)
  }

  // In guide/empower phase, add an invitation to continue
  if (phase === 'guide' || phase === 'empower') {
    const invitations = [
      " What are you thinking, friend?",
      " Where does your heart want to go from here?",
      " What do you want to explore next?",
    ]
    // Only add follow-up sometimes in guide phase (not every response)
    if (Math.random() > 0.4) {
      return backendResponse + pickRandom(invitations)
    }
  }

  return backendResponse
}
