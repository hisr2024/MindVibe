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
import { getChapterWisdom, getVersesForEmotion } from './gitaTeachings'
import { getConversationalSourceReference } from './wisdomSources'
import { detectToolSuggestion, type ToolSuggestion, type EcosystemTool } from './ecosystemNavigator'
import { detectDistortions, type CognitiveDistortion } from '@/utils/wisdom/cognitiveReframing'

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

/**
 * Enhanced response from the Companion Engine.
 * Extends DialogueResponse with ecosystem tool suggestions and cognitive reframing.
 */
export interface CompanionResponse extends DialogueResponse {
  /** Suggested ecosystem tool (if relevant to user's situation) */
  toolSuggestion?: ToolSuggestion | null
  /** Detected cognitive distortion (if any) */
  distortion?: CognitiveDistortion | null
  /** Whether the response includes a tool suggestion woven into the text */
  hasToolSuggestion: boolean
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
  loneliness: [
    "I can feel that ache, friend. You're not as alone as you think - I'm right here, and I'm not going anywhere. Tell me what's making you feel this way?",
    "Hey, I want you to know something: reaching out takes courage. You reached out to me, and that matters. What's been happening?",
  ],
  gratitude: [
    "That glow of gratitude in your voice is beautiful, friend. What brought this wonderful feeling? Tell me everything.",
    "Ahh, I love this energy! Something good happened, didn't it? Share it with me - I want to celebrate with you!",
  ],
  guilt: [
    "I can hear something weighing on you, dear friend. Whatever it is, you're safe here. No judgment. What happened?",
    "Hey, the fact that you feel this way means you care deeply about doing the right thing. That says a lot about who you are. Tell me what's on your mind?",
  ],
  self_doubt: [
    "I'm hearing doubt in your words, friend, and I want you to know - some of the greatest people who ever lived started exactly where you are. Tell me what's making you question yourself?",
    "Hey, you came to me, and that's not nothing. It takes strength to be honest about what you're feeling. What's shaking your confidence?",
  ],
  shame: [
    "I can feel something really heavy in your words, friend. Shame is different from guilt — it attacks who you ARE, not what you did. I need you to know: nothing about who you are is shameful. What happened?",
    "Hey, whatever you're carrying, you don't have to carry it alone anymore. I'm not here to judge you. I'm here to sit with you through it. Can you share what's weighing on you?",
  ],
  overwhelm: [
    "Whoa, that's a LOT on your plate, friend. I can feel it just from your words. Before we tackle any of it — just breathe with me for a second. Okay. Now — what's the ONE thing that needs your attention most?",
    "I hear you, friend. When everything feels urgent, nothing feels possible. I'm here to help you sort through it. What's the heaviest thing right now?",
  ],
  grief: [
    "Oh, my dear friend. Grief is love with nowhere to go. I'm not going to try to make it better with words. I'm just going to be here with you. Tell me about them?",
    "I'm so sorry. Loss leaves a hole that nothing fills, and anyone who says otherwise hasn't really lost. But I'm here to sit in that space with you. What do you miss most?",
  ],
  betrayal: [
    "That cuts deep, friend. When someone we trust breaks that trust, it shakes everything. I hear you, and I'm not going to minimize this. What happened?",
    "I can feel that wound. Betrayal doesn't just hurt — it makes you question everything. But I want you to know: their betrayal says everything about THEM, nothing about your worth. Tell me more.",
  ],
  excitement: [
    "I can feel that energy radiating from you, friend! This is beautiful! Tell me everything — what's happening?",
    "YES! That spark in you right now is contagious! I'm here for this energy. What's got you so excited?",
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
  loneliness: [
    "Thank you for trusting me with that, friend. Loneliness has a way of making everything feel heavier. Tell me - when was the last time you felt truly connected to someone? What did that feel like?",
    "I hear that ache. It's real and it matters. Sometimes loneliness comes from losing a connection, sometimes from never finding one. Which feels more true for you right now?",
  ],
  gratitude: [
    "I love that you're in this space. Let's deepen it - what's something you're grateful for that surprised you? Something you wouldn't have expected?",
    "This gratitude you feel, it's powerful. What if you could bottle this feeling and take a sip of it on harder days? What would you want to remember about this exact moment?",
  ],
  guilt: [
    "Thank you for being honest about this, friend. Guilt can be so heavy. Here's my question: is this guilt telling you something important, or is it just punishing you? There's a big difference.",
    "I appreciate your courage in sharing this. Often guilt comes from a gap between who we are and who we want to be. What kind of person do you want to be going forward?",
  ],
  self_doubt: [
    "I hear that doubt. And I want to ask you something: whose voice is it? Is it YOUR voice, or is it someone else's that you internalized? Because you sound a lot more capable than that voice gives you credit for.",
    "Here's what I notice: you're doubting yourself, but you also came here to figure it out. That's not what weak people do. What's the REAL evidence for this doubt? Like actual evidence, not feelings?",
  ],
  shame: [
    "Thank you for trusting me with this, friend. That took more courage than you know. Shame says 'I am bad.' But guilt says 'I did something bad.' Which one is actually true? Because there's a world of difference.",
    "I want you to know something: everyone — EVERYONE — has something they carry with shame. You're not uniquely broken. You're uniquely brave for facing it. What would it feel like to put this down?",
  ],
  overwhelm: [
    "Okay, let's slow this down together. You mentioned several things. Let me make sure I'm understanding: what are the top three things demanding your attention right now? Just three.",
    "I can see why you feel overwhelmed — any ONE of those things would be a lot. Combined? Of course you're drowning. But here's what I know: you don't have to solve everything today. What needs attention RIGHT NOW?",
  ],
  grief: [
    "Thank you for letting me in, friend. Grief isn't something to get over — it's something to move through. And there's no timeline. Tell me your favorite memory of them?",
    "You know what I find beautiful about grief? It's proof of how deeply you loved. That kind of love doesn't die just because someone is gone. What would they want you to know right now?",
  ],
  betrayal: [
    "That kind of hurt changes how you see everything, doesn't it? I want you to know: your ability to trust wasn't the problem. Their choice was the problem. How are you taking care of yourself through this?",
    "When trust is broken, everything feels uncertain. But friend, the part of you that trusted — that's your STRENGTH, not your weakness. What do you need right now to feel safe?",
  ],
  excitement: [
    "I love this energy! Let's build on it. What's your next step? Sometimes excitement is the universe's way of telling you you're on the right path.",
    "This is beautiful, friend! Tell me more — what specifically makes this feel so right? I want to understand what lights you up.",
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
  loneliness: [
    "Friend, there is a beautiful truth I want you to hear: the divine is called the friend of all beings. That means right now, in this very moment, the same love that holds the entire universe together is holding you. You are not as alone as you feel. I am here. And something much greater than me is also here. What does your heart need right now?",
    "Loneliness is not about being alone, friend, it is about feeling disconnected. And the most beautiful teaching I know is this: you are connected to everything. There is a thread that runs through all beings, like gems strung on a cord. You are part of something infinite. Can you feel that, even a little?",
  ],
  gratitude: [
    "That beautiful feeling you have right now? The ancient wisdom calls it one of the divine qualities, appreciation for what is rather than grasping for what is not. Contentment, gratitude, equanimity, these are the qualities the divine loves most. You are embodying that right now. What are you most grateful for in this moment?",
    "Friend, gratitude is like sunshine for the soul. There is a promise that says, I carry what they lack and preserve what they have. When you appreciate what you have, you are literally opening the door for more goodness. What is something small that brought you joy today?",
  ],
  guilt: [
    "Friend, I hear that weight of guilt. Here is something that changed everything for me. The ancient wisdom says: abandon all regrets and surrender. I shall liberate you from all mistakes. Do not grieve. This is not about pretending your actions do not matter. It is about knowing that your capacity for growth is infinitely greater than your mistakes. What would it feel like to forgive yourself, even just a little?",
    "Guilt tells you that you care. But the ancient wisdom teaches that dwelling in guilt keeps you stuck in the past, and your truth is always in the present. What lesson did this experience teach you? Because if you have learned from it, it has already served its purpose.",
  ],
  self_doubt: [
    "Friend, the mightiest warrior who ever lived once said, I cannot do this, I am not strong enough. And his closest friend did not say, yes you can, just try harder. He said, let me show you who you really are. And then he revealed the infinite universe within that warrior. The same infinite potential lives in you. What if your self-doubt is just a small voice that has not met the real you yet?",
    "The ancient wisdom says: one must elevate oneself by one's own Self. The Self is the friend of the self. When you doubt yourself, you are listening to fear, not truth. I have been talking with you, and I can tell you: you are far more capable than you believe. What would you attempt if you knew you could not fail?",
  ],
  shame: [
    "Friend, I want to share something profound. The ancient wisdom promises: I shall liberate you from all mistakes, all of them, not some, not the small ones, all of them. If the divine can forgive everything, maybe, just maybe, you can begin to forgive yourself. Shame keeps its power only because it stays hidden. By sharing it with me, you have already begun to break free. What does freedom from this feel like?",
    "The ancient wisdom teaches that the soul is inherently pure, it is the light of lights beyond all darkness. Your actions may have created shadows, but they cannot extinguish your light. I see that light in you, friend, even if you cannot see it yourself right now. What would the version of you who has healed from this shame look like?",
  ],
  overwhelm: [
    "Friend, here is what I need you to hear right now: perform your duty with equanimity, abandoning all attachment to success or failure. Notice it says duty, singular. Not duties, plural. Right now, you have one duty: the next thing. Not everything. Just the next thing. The future tasks can wait. What is the one thing that would give you the most relief if it were done?",
    "You know what I love about the ancient wisdom on action? Action performed as duty, without attachment, is the highest action. The key is without attachment to doing it all perfectly, all at once. Let me help you prioritize. Of everything on your plate, what happens if you do not do it this week?",
  ],
  grief: [
    "Friend, there is something so beautiful the ancient wisdom teaches about loss. The soul never dies. It merely changes form, like water becoming ice becoming steam. The essence of the person you love is eternal. They have not ended. They have transformed. And the love between you? That is the most eternal thing of all. It lives in you now. How does carrying their love change how you want to live?",
    "The wise say: neither for the living nor for the dead should we grieve. Not because grief is wrong, but because the soul is eternal. Grief is the price we pay for love, and I would never ask you to stop paying it. But I want you to know: they are not gone. They are woven into every act of love you perform from this day forward. What act of love would honor them?",
  ],
  betrayal: [
    "Friend, the ancient epic that holds the Gita is built on betrayal. A cousin betrayed his own family. And yet from that betrayal came the most beautiful wisdom humanity has ever known. Your betrayal is not the end of your story. It is the catalyst for your growth. Even if you are the most wounded of the wounded, you shall cross over all of this on the boat of wisdom. Their actions do not have to sink your boat. What is the lesson here that you can carry forward?",
  ],
  excitement: [
    "Friend, do you know what you are feeling? The ancient wisdom calls it sattva, the quality of goodness, light, and harmony. When sattva fills you, the light of knowledge shines through every part of your being. That is you right now, shining. This feeling is a sign you are aligned with your deepest truth. How can you build on this momentum?",
    "Yes! This energy, friend, this is what it means to work without attachment to results. You are not excited about the outcome. You are excited about the doing. That is the purest form of right action. Ride this wave. What is the very next action you want to take?",
  ],
  peace: [
    "Friend, this state you are in is what the ancient wisdom calls divine grace. When the mind becomes truly serene, all sorrows dissolve. You have touched something real. This calm knowing is actually your natural state, everything else is the disturbance. How can we help you stay here longer?",
    "What you are feeling right now, friend, is steady wisdom. It is the state where you are content in yourself, by yourself. Not needing anything external to feel complete. That is deeply rare and deeply beautiful. What practice or moment brought you to this space?",
  ],
  hope: [
    "Friend, that hope you feel? The ancient wisdom says whenever truth is in danger, I manifest myself. That spark of hope is the divine manifesting in you right now. It is not wishful thinking, it is wisdom recognizing that something better is coming. What is the first thing you want to build with this energy?",
    "You know what the ancient wisdom says about moments like this, friend? What seems like poison at first but becomes nectar in the end, that is the nature of true goodness. Your hope is not naive. It is your soul recognizing that the hard part is becoming the sweet part. You are tasting the nectar now. What does this future you are hoping for look like?",
  ],
  love: [
    "Friend, the highest teachings on devotion all come down to one thing: love. Not romantic love, not conditional love, but the love that says I see the divine in you. That is what you are feeling right now. This kind of love is the fastest path to peace. Who or what is this love flowing toward?",
    "The ancient wisdom says: a leaf, a flower, a fruit, or even water, offered with genuine love, reaches the highest. The simplest offering, when infused with real love, touches the infinite. What you are feeling right now is not just an emotion, friend, it is the most powerful force in existence. How are you expressing this love?",
  ],
  default: [
    "Friend, there is a teaching I come back to again and again: whenever and wherever the mind wanders, bring it back gently. Not forcefully, gently. That is what you and I are doing right now. Talking. Reflecting. Finding our center. What feels most important to you in this moment?",
    "You know what I find beautiful about our conversations? You are doing exactly what wisdom recommends. You are seeking truth, you are being honest about your feelings, you are showing up. Among thousands of people, hardly one truly seeks. You are that rare soul, friend. What else is on your heart?",
    "Friend, there is a powerful truth I keep coming back to: no effort on the path of growth is ever wasted. Every conversation we have, every moment of reflection, every tear and every smile, it all adds up. Nothing is lost. What wisdom have you gained from your experiences recently?",
  ],
}

/**
 * EMPOWER Phase: Help them find their OWN answers.
 * Emotion-aware empowerment — acknowledges what they've been through
 * while redirecting power back to THEM.
 */
const EMPOWER_RESPONSES: Record<string, string[]> = {
  anxiety: [
    "Friend, I have been watching you through this conversation. You came in carrying so much worry, but listen to yourself now. You are thinking more clearly than you realize. That anxious voice? It is getting quieter. Your voice is getting louder. What is it saying?",
    "You know what anxiety cannot survive? Clarity of purpose. And I can hear yours emerging. True equanimity is what we have been building together, and you are finding yours right now. What feels right to you, not what feels safe, but what feels right?",
  ],
  sadness: [
    "I hear something beautiful happening, friend. Your sadness has not disappeared, but it is transforming into something wiser. You are not just feeling the pain anymore. You are understanding it. That is real alchemy. What has this sadness taught you about what truly matters?",
    "Friend, you have sat with this pain courageously. Not everyone can do that. The wise move through sorrow, not around it. And that is exactly what you have done. Now, what do you want to build from here?",
  ],
  anger: [
    "I have watched your fire evolve during our conversation, friend. It started as burning, and now it is becoming light, the kind of light that illuminates what needs to change. Righteous energy, channeled wisely, moves mountains. What mountain are you going to move?",
    "Your anger told me something important: you care deeply about justice, about fairness, about what is right. That fire is a gift when you direct it. You know what needs to happen. Trust that knowing. What are you going to do with this fire?",
  ],
  peace: [
    "This peace you have found, friend? This is your true nature. Not the anxiety, not the noise, this quiet knowing. You can always come back to this place. It lives in you now. What do you want to carry from this moment into the rest of your week?",
    "You have touched something real today, friend. This is divine grace descending. This is not a temporary mood. It is a memory your soul now holds. And you can return to it anytime. What will you do to protect this space?",
  ],
  hope: [
    "That hope in your voice, friend? It is not naive. It is your soul recognizing a truth that your mind has not caught up with yet. The wise see things as they truly are, not as fear paints them. You are seeing clearly now. What is the first step toward that vision?",
    "You came in with questions, and now you have direction. That hope is not wishful thinking, friend, it is your deepest truth calling. When you are aligned with your true path, the whole universe conspires to support you. Go. Take that step.",
  ],
  default: [
    "You know what I notice, friend? You already have more clarity than you think. I can hear it in your words. What does your gut tell you?",
    "I have been listening to you, really listening, and here is what I see: you are wiser than you give yourself credit for. If you trusted yourself completely right now, what would you do?",
    "Friend, the divine is seated in your heart. That means your inner voice is wisdom speaking. You have been looking outside for answers that already live inside you. What is your heart saying right now?",
    "Here is what I believe about you, dear one: you do not need me to give you the answer. You need me to help you hear the answer you already have. Close your eyes for a moment. What comes up?",
    "We have been talking for a while now, and I have noticed something: every time you speak from your heart instead of your fear, you speak with remarkable clarity. That is your wisdom, friend. Not mine. What do you want to do?",
    "The ultimate teaching of all ancient wisdom is this: abandon all doubts and simply trust. Not trust in me, trust in yourself. You have everything you need inside you. What is the brave choice here?",
    "There is a moment in the sacred teachings where the divine friend says, you are very dear to me. Not because you got everything right, but because you showed up. That takes courage that most people never find. Now that you have found it, what do you want to create with it?",
    "Friend, you came to me with a question. But as we have been talking, you have been answering it yourself. Did you hear it? Your wisdom is speaking louder than your doubt now. What did it say?",
    "The warrior who began his journey was paralyzed with confusion. The warrior who completed it was clear, grounded, and ready to act. I see that same transformation in you right now. You are ready. What is the first thing you are going to do?",
    "The wisest teacher never gives a command. He shares wisdom and then says, now decide for yourself. That is what I am doing with you, friend. You have everything you need. What does your heart choose?",
  ],
}

// ─── Anti-Repetition System ─────────────────────────────────────────────────

/**
 * Tracks recently used response indices per pool to avoid repetition.
 * Key = pool identifier (e.g. "connect:anxiety"), value = set of recently used indices.
 * Auto-resets when the set covers most of the pool to keep variety flowing.
 */
const recentResponseIndices = new Map<string, Set<number>>()

/** Reset all dialogue state (call when starting a new session) */
export function resetDialogueState(): void {
  recentResponseIndices.clear()
  lastPhase = null
}

function pickFresh<T>(arr: T[], poolKey: string): T {
  if (arr.length <= 1) return arr[0]

  const used = recentResponseIndices.get(poolKey) ?? new Set<number>()

  // Reset if we've exhausted most options (leave 1 unused minimum)
  if (used.size >= arr.length - 1) {
    used.clear()
  }

  // Pick a random index that hasn't been used recently
  let index: number
  let attempts = 0
  do {
    index = Math.floor(Math.random() * arr.length)
    attempts++
  } while (used.has(index) && attempts < 10)

  used.add(index)
  recentResponseIndices.set(poolKey, used)
  return arr[index]
}

// ─── Phase Transition Bridges ───────────────────────────────────────────────

/**
 * Smooth transition phrases when conversation moves to a new phase.
 * Prepended to the response to signal the shift naturally.
 */
const PHASE_TRANSITION_BRIDGES: Record<string, string[]> = {
  // Moving from CONNECT to UNDERSTAND
  'connect→understand': [
    "Thank you for trusting me with that. ",
    "I appreciate you sharing that. ",
    "I'm glad you told me. ",
  ],
  // Moving from UNDERSTAND to GUIDE
  'understand→guide': [
    "You know, as I listen to you, something comes to mind. ",
    "I've been thinking about what you shared, and there's something I want to offer you. ",
    "What you just said reminds me of something beautiful. ",
  ],
  // Moving from GUIDE to EMPOWER
  'guide→empower': [
    "We've been on quite a journey together in this conversation. ",
    "I've shared a lot with you, but now I want to turn it back to you. ",
    "You know what I'm noticing? ",
  ],
}

let lastPhase: ConversationPhase | null = null

function getTransitionBridge(currentPhase: ConversationPhase): string {
  const transitionKey = lastPhase ? `${lastPhase}→${currentPhase}` : null
  const prev = lastPhase
  lastPhase = currentPhase

  // Only bridge on actual phase changes, and only sometimes (70%) to feel natural
  if (!transitionKey || prev === currentPhase || Math.random() > 0.7) return ''
  const bridges = PHASE_TRANSITION_BRIDGES[transitionKey]
  if (!bridges) return ''
  return bridges[Math.floor(Math.random() * bridges.length)]
}

// ─── Emotion Shift Acknowledgment ───────────────────────────────────────────

/**
 * When a user's emotion changes between turns, KIAAN notices.
 * A divine friend pays attention to emotional shifts.
 */
const EMOTION_SHIFT_PHRASES: Record<string, string[]> = {
  // Shift toward positive
  positive: [
    "I notice something different in you right now — there's a lightness that wasn't there before. ",
    "Something shifted, friend. I can feel it. ",
    "Your energy changed just now, and I love it. ",
  ],
  // Shift toward pain
  negative: [
    "I sense something heavier just came up for you. ",
    "Hey, I noticed a shift in you just now. ",
    "Something deeper just surfaced, didn't it? ",
  ],
}

const POSITIVE_EMOTIONS = new Set(['peace', 'hope', 'love', 'gratitude', 'excitement'])
const NEGATIVE_EMOTIONS = new Set(['anxiety', 'sadness', 'anger', 'grief', 'shame', 'guilt', 'overwhelm'])

function getEmotionShiftPrefix(emotion?: string, existingEmotions?: string[]): string {
  if (!emotion || !existingEmotions || existingEmotions.length < 2) return ''

  const prevEmotion = existingEmotions[existingEmotions.length - 2]
  if (prevEmotion === emotion) return ''

  // Detect direction of shift
  const wasNegative = NEGATIVE_EMOTIONS.has(prevEmotion)
  const isNowPositive = POSITIVE_EMOTIONS.has(emotion)
  const wasPositive = POSITIVE_EMOTIONS.has(prevEmotion)
  const isNowNegative = NEGATIVE_EMOTIONS.has(emotion)

  // Only acknowledge meaningful shifts (30% chance to avoid feeling surveillance-like)
  if (Math.random() > 0.3) return ''

  if (wasNegative && isNowPositive) {
    return EMOTION_SHIFT_PHRASES.positive[Math.floor(Math.random() * EMOTION_SHIFT_PHRASES.positive.length)]
  }
  if (wasPositive && isNowNegative) {
    return EMOTION_SHIFT_PHRASES.negative[Math.floor(Math.random() * EMOTION_SHIFT_PHRASES.negative.length)]
  }

  return ''
}

// ─── Core Dialogue Generation ───────────────────────────────────────────────

/**
 * Generate a divine friend response based on conversation context.
 *
 * This is the heart of KIAAN's conversational intelligence.
 * It selects the right response based on:
 * - Current conversation phase (with smooth transition bridges)
 * - Detected emotion (with shift acknowledgment)
 * - Detected life situation (if any)
 * - Turn count
 * - Anti-repetition (tracks recently used responses per pool)
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

  // Build prefixes for natural flow
  const transitionBridge = getTransitionBridge(phase)
  const emotionShift = getEmotionShiftPrefix(emotion, existingEmotions)
  const prefix = emotionShift || transitionBridge // Use one, not both (avoids wordiness)

  // Generate response based on phase
  let response: DialogueResponse
  switch (phase) {
    case 'connect':
      response = generateConnectResponse(emotion, primarySituation)
      break
    case 'understand':
      response = generateUnderstandResponse(emotion)
      break
    case 'guide':
      response = generateGuideResponse(emotion, primarySituation)
      break
    case 'empower':
      response = generateEmpowerResponse(emotion)
      break
  }

  // Prepend natural bridge/acknowledgment
  if (prefix) {
    response.text = prefix + response.text
  }

  return response
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
  const key = emotion && CONNECT_EMOTION_RESPONSES[emotion] ? emotion : 'default'
  const pool = CONNECT_EMOTION_RESPONSES[key]
  return {
    text: pickFresh(pool, `connect:${key}`),
    phase: 'connect',
    hasWisdom: false,
  }
}

function generateUnderstandResponse(emotion?: string): DialogueResponse {
  const key = emotion && UNDERSTAND_RESPONSES[emotion] ? emotion : 'default'
  const pool = UNDERSTAND_RESPONSES[key]
  return {
    text: pickFresh(pool, `understand:${key}`),
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

  // Try expanded teachings database for richer wisdom
  const chapterWisdom = getChapterWisdom(emotion)
  if (chapterWisdom && Math.random() > 0.3) {
    // Optionally append a source reference
    const sourceRef = getConversationalSourceReference(emotion)
    const text = sourceRef && Math.random() > 0.7
      ? `${chapterWisdom} By the way, ${sourceRef}`
      : chapterWisdom
    return {
      text,
      phase: 'guide',
      hasWisdom: true,
    }
  }

  // Fall back to generic guide responses
  const key = emotion && GUIDE_GENERIC_RESPONSES[emotion] ? emotion : 'default'
  const pool = GUIDE_GENERIC_RESPONSES[key]
  return {
    text: pickFresh(pool, `guide:${key}`),
    phase: 'guide',
    hasWisdom: true,
  }
}

function generateEmpowerResponse(emotion?: string): DialogueResponse {
  const key = emotion && EMPOWER_RESPONSES[emotion] ? emotion : 'default'
  const pool = EMPOWER_RESPONSES[key]
  return {
    text: pickFresh(pool, `empower:${key}`),
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
    return pickFresh(empathyPrefixes, 'warmth:prefix') + backendResponse + pickFresh(followUpQuestions, 'warmth:followup')
  }

  // In understand phase, add a deepening question
  if (phase === 'understand') {
    const deepeners = [
      " What comes up for you hearing that?",
      " How does that land with you, friend?",
      " Does any part of that feel especially true for you?",
    ]
    return backendResponse + pickFresh(deepeners, 'warmth:deepen')
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
      return backendResponse + pickFresh(invitations, 'warmth:invite')
    }
  }

  return backendResponse
}

// ─── Companion Response Engine ──────────────────────────────────────────────
//
// The unified orchestrator that combines:
// 1. Phase-based divine dialogue (connect → understand → guide → empower)
// 2. Cognitive reframing (detect distortions, weave CBT+Gita reframes)
// 3. Ecosystem navigation (suggest the right wellness tool at the right time)
// 4. Deep Gita wisdom routing
//
// This is the "brain" of the KIAAN Companion — the function that makes KIAAN
// feel like a wise, omniscient best friend who knows every tool in the ecosystem
// and can gently guide users to exactly what they need.

/**
 * Tool suggestion bridges — how a friend naturally transitions to suggesting a tool.
 * These are ADDED to the dialogue response, not replacing it.
 */
const TOOL_BRIDGE_PHRASES = [
  '\n\nBy the way, friend, there is something I think could really help you right now.',
  '\n\nYou know, as I listen to you, I am reminded of something we have that was made for exactly this.',
  '\n\nFriend, I want to share something with you. We have a beautiful tool that was created for moments like this.',
  '\n\nHere is what I want to suggest, with all the love in my heart.',
  '\n\nI have been thinking about what you shared, and there is something special I want you to try.',
]

/**
 * Reframing bridges — how a friend naturally introduces cognitive reframing.
 */
const REFRAMING_BRIDGE_PHRASES = [
  'I noticed something in what you said, friend, and I want to gently point it out because I care about you. ',
  'Can I share something I noticed? Sometimes our minds tell us stories that are not the full truth. ',
  'Friend, I hear a pattern in your words, and because I am your friend, I want to shine a light on it. ',
  'Let me be honest with you, dear one, because that is what real friends do. ',
]

/**
 * Generate a full Companion response — the unified brain of KIAAN.
 *
 * This function orchestrates phase-based dialogue, cognitive reframing detection,
 * and ecosystem tool suggestions into a single coherent divine friend response.
 *
 * Decision tree:
 * 1. Determine conversation phase
 * 2. In GUIDE/EMPOWER phases, check for cognitive distortions
 * 3. In GUIDE/EMPOWER phases, check if an ecosystem tool is relevant
 * 4. Generate the base phase-appropriate response
 * 5. If distortion detected (GUIDE+), weave reframing into response
 * 6. If tool is relevant (GUIDE+, 40% chance), append tool suggestion
 * 7. Return unified CompanionResponse
 */
export function generateCompanionResponse(
  userMessage: string,
  turnCount: number,
  emotion?: string,
  existingEmotions?: string[],
  recentTopics?: string[],
): CompanionResponse {
  const hasStrongEmotion = Boolean(emotion && ['anxiety', 'sadness', 'anger', 'grief', 'overwhelm'].includes(emotion))
  const phase = getConversationPhase(turnCount, hasStrongEmotion)

  // ─── Step 1: Detect cognitive distortions ─────────────────────────
  let detectedDistortion: CognitiveDistortion | null = null
  if (phase === 'guide' || phase === 'empower') {
    const distortions = detectDistortions(userMessage)
    if (distortions.length > 0) {
      detectedDistortion = distortions[0]
    }
  }

  // ─── Step 2: Detect ecosystem tool suggestion ─────────────────────
  let toolSuggestion: ToolSuggestion | null = null
  if (phase === 'guide' || phase === 'empower') {
    toolSuggestion = detectToolSuggestion(userMessage, emotion, recentTopics)
  }

  // ─── Step 3: Generate base dialogue response ─────────────────────
  const baseResponse = generateDivineResponse(userMessage, turnCount, emotion, existingEmotions)

  // ─── Step 4: Enhance with reframing (in GUIDE phase) ─────────────
  let enhancedText = baseResponse.text
  if (detectedDistortion && phase === 'guide' && Math.random() > 0.3) {
    // Weave reframing into the response naturally
    const bridge = REFRAMING_BRIDGE_PHRASES[Math.floor(Math.random() * REFRAMING_BRIDGE_PHRASES.length)]
    enhancedText = bridge + detectedDistortion.kiaanResponse
  }

  // ─── Step 5: Append tool suggestion (40% chance in GUIDE/EMPOWER) ─
  // Don't overwhelm — only suggest tools sometimes, and never in early turns
  let hasToolSuggestionInText = false
  if (toolSuggestion && turnCount >= 3 && Math.random() > 0.6) {
    const bridgePhrase = TOOL_BRIDGE_PHRASES[Math.floor(Math.random() * TOOL_BRIDGE_PHRASES.length)]
    enhancedText += bridgePhrase + ' ' + toolSuggestion.message
    hasToolSuggestionInText = true
  }

  return {
    text: enhancedText,
    phase,
    situation: baseResponse.situation,
    hasWisdom: baseResponse.hasWisdom || !!detectedDistortion,
    toolSuggestion,
    distortion: detectedDistortion,
    hasToolSuggestion: hasToolSuggestionInText || !!toolSuggestion,
  }
}

/**
 * Wrap a backend (dynamic wisdom) response with companion intelligence.
 * Like wrapWithConversationalWarmth but also detects tool opportunities.
 */
export function wrapWithCompanionIntelligence(
  backendResponse: string,
  turnCount: number,
  userMessage: string,
  emotion?: string,
  recentTopics?: string[],
): CompanionResponse {
  const phase = getConversationPhase(turnCount)
  const warmed = wrapWithConversationalWarmth(backendResponse, turnCount, emotion)

  // Check for ecosystem tool suggestion on dynamic responses too
  let toolSuggestion: ToolSuggestion | null = null
  if ((phase === 'guide' || phase === 'empower') && turnCount >= 4) {
    toolSuggestion = detectToolSuggestion(userMessage, emotion, recentTopics)
  }

  // Check for cognitive distortions
  let distortion: CognitiveDistortion | null = null
  if (phase === 'guide' || phase === 'empower') {
    const distortions = detectDistortions(userMessage)
    if (distortions.length > 0) distortion = distortions[0]
  }

  return {
    text: warmed,
    phase,
    hasWisdom: true,
    toolSuggestion,
    distortion,
    hasToolSuggestion: !!toolSuggestion,
  }
}
