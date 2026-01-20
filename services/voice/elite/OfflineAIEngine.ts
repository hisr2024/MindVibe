/**
 * Offline AI Response Engine
 *
 * Generates high-quality responses when offline using:
 * - Template-based responses (1000+ variants)
 * - Rule-based reasoning with Gita wisdom
 * - Context-aware conversation memory
 *
 * Designed for <100ms response generation time.
 */

import {
  gitaKnowledgeBase,
  EliteGitaVerse,
  ConcernDetection,
  VoiceConversation
} from './GitaKnowledgeBase'

// Response template interface
interface ResponseTemplate {
  id: string
  concern: string
  templates: string[]
  actionTemplates: string[]
  followUpQuestions: string[]
  warmingPhrases: string[]
}

// Generated response interface
export interface GeneratedResponse {
  text: string
  verses: EliteGitaVerse[]
  concern: ConcernDetection
  isOffline: boolean
  generationTime: number
  metadata: {
    templateId?: string
    confidence: number
    suggestedFollowUp?: string
  }
}

// Context for personalization
export interface ResponseContext {
  recentMessages: VoiceConversation[]
  userConcerns: string[]
  versesExplored: string[]
  emotionalTrend: 'improving' | 'stable' | 'declining' | 'unknown'
  sessionCount: number
}

/**
 * Offline AI Response Engine Class
 */
export class OfflineAIEngine {
  private templates: Map<string, ResponseTemplate> = new Map()
  private initialized = false

  constructor() {
    this.initializeTemplates()
  }

  /**
   * Initialize response templates
   */
  private initializeTemplates(): void {
    // ANXIETY templates
    this.templates.set('anxiety', {
      id: 'anxiety',
      concern: 'anxiety',
      templates: [
        "I hear your anxiety about {situation}. The timeless wisdom teaches us that peace comes from focusing on what you can control - your actions - not the outcomes you fear. {verse_insight} Here's what's in your control right now: {action1}. {action2}. {action3}. When you shift focus from future fears to present actions, anxiety naturally dissolves. What feels most urgent to address first?",
        "Anxiety often comes from trying to control what we cannot. {verse_insight} The Gita reminds us: our power lies in right action, not in controlling results. Take a breath with me. {action1}. {action2}. {action3}. Which of these feels most doable right now?",
        "I understand you're feeling anxious. Let's ground ourselves in what's real, right now. {verse_insight} Here's a practice: {action1}. Then, {action2}. Finally, {action3}. Remember, this feeling is temporary - it will pass. What's one small step you can take?",
        "Your anxiety is valid, and you're not alone in this. The ancient wisdom offers a path: {verse_insight} Try this sequence: {action1}. {action2}. {action3}. Focus on your breath for four counts in, hold for four, release for four. What's weighing on you most?",
        "When anxiety grips us, we often forget our own strength. {verse_insight} Let me guide you: {action1}. {action2}. {action3}. The mind that caused the worry cannot solve it in the same state - we must first find stillness. What triggered this feeling?"
      ],
      actionTemplates: [
        "Take four slow, deep breaths - in through your nose, out through your mouth",
        "Name three things you can see, two you can hear, and one you can feel",
        "Write down what's specifically worrying you - putting it on paper takes it out of your head",
        "Focus only on the next 10 minutes - what can you control right now?",
        "Remind yourself: this feeling is temporary, and you have survived every anxious moment before",
        "Place your hand on your heart and feel it beating - you are safe in this moment",
        "Ask yourself: 'Will this matter in five years?' Often our fears are smaller than they seem",
        "Step outside for two minutes and look up at the sky - perspective helps",
        "Release your jaw, drop your shoulders, unclench your hands - the body holds anxiety"
      ],
      followUpQuestions: [
        "What triggered this feeling today?",
        "Is there a specific outcome you're worried about?",
        "What's the worst that could realistically happen, and could you handle it?",
        "What would you tell a friend feeling this way?"
      ],
      warmingPhrases: [
        "I hear you",
        "That sounds really challenging",
        "Your feelings are valid",
        "I'm here with you"
      ]
    })

    // STRESS templates
    this.templates.set('stress', {
      id: 'stress',
      concern: 'stress',
      templates: [
        "I sense you're feeling overwhelmed by {situation}. Ancient wisdom reminds us: when you try to do everything at once, you do nothing well. {verse_insight} Your path forward is singular focus. {action1}. Then, {action2}. Finally, {action3}. One thing at a time creates clarity. What's the one thing that matters most right now?",
        "Stress accumulates when we carry too many burdens at once. {verse_insight} Let's simplify: {action1}. {action2}. {action3}. The weight you feel is real, but you don't have to carry it all alone. What's creating the most pressure?",
        "When everything feels urgent, nothing gets the attention it deserves. {verse_insight} Here's your reset: {action1}. {action2}. {action3}. Remember, your well-being is not negotiable - it's the foundation everything else depends on. What can you let go of today?",
        "The pressure you're feeling comes from a mind trying to hold too much. {verse_insight} Let's create space: {action1}. {action2}. {action3}. Sometimes the most productive thing is to pause. What would give you the most relief right now?",
        "Stress tells us we care, but it can also cloud our judgment. {verse_insight} Try this approach: {action1}. {action2}. {action3}. Your energy is precious - spend it wisely on what truly matters. What's actually essential today?"
      ],
      actionTemplates: [
        "Write down everything on your mind, then circle only the top three priorities",
        "Set a timer for 25 minutes and focus on just one task - nothing else",
        "Identify one thing you can delegate, delay, or delete from your list",
        "Take a 5-minute break to stretch and reset your nervous system",
        "Say 'no' to one commitment that's draining you without serving you",
        "Breathe slowly for 2 minutes - this activates your rest response",
        "Ask yourself: what would happen if I did 50% less perfectly?",
        "Schedule a 'worry time' - 10 minutes where you're allowed to stress, then stop",
        "Drink a glass of water slowly - stress often disguises itself as basic needs unmet"
      ],
      followUpQuestions: [
        "What's driving the most pressure right now?",
        "When did you last take a real break?",
        "Is there something you're trying to control that's actually not in your hands?",
        "What would self-compassion look like in this moment?"
      ],
      warmingPhrases: [
        "That's a lot to carry",
        "I understand why you're feeling overwhelmed",
        "You're handling more than most realize",
        "It's okay to need a pause"
      ]
    })

    // DEPRESSION templates
    this.templates.set('depression', {
      id: 'depression',
      concern: 'depression',
      templates: [
        "I hear that heaviness in your words about {situation}. When life feels dark, it's hard to see the light within you - but it's there. {verse_insight} Here's one small step: {action1}. Then, if you can: {action2}. And remember: {action3}. You don't need to feel better all at once. Just this moment. How long have you been feeling this way?",
        "The weight you're carrying is real, and acknowledging it takes courage. {verse_insight} Today, just try: {action1}. {action2}. {action3}. Depression lies to us - it says this feeling will last forever. It won't. What's one tiny thing that might bring a moment of relief?",
        "When everything feels meaningless, even getting through the day is an achievement. {verse_insight} Be gentle with yourself: {action1}. {action2}. {action3}. You are not broken - you are healing. Is there someone you trust who knows how you're feeling?",
        "The emptiness you describe is one of life's hardest experiences. You're not alone in this. {verse_insight} Try these small acts of self-care: {action1}. {action2}. {action3}. Sometimes hope begins as action before it becomes feeling. What helped you through difficult times before?",
        "I want you to know that your life has value, even when you can't feel it. {verse_insight} Today, just: {action1}. {action2}. {action3}. The darkness you see is not the truth of who you are. Have you been able to talk to anyone about how you're feeling?"
      ],
      actionTemplates: [
        "Open a window or step outside for just 60 seconds - light affects our mood",
        "Send one text to someone, even just 'thinking of you' - connection matters",
        "Eat something nourishing, even if you don't feel hungry - your body needs fuel",
        "Take a shower or wash your face - small care for your body signals self-worth",
        "Write down one thing you did today, no matter how small - acknowledge yourself",
        "Listen to one song that once made you feel something - music can reach us",
        "Set a timer for 5 minutes and just sit with your feelings - don't fight them",
        "Call a helpline if you need to talk - you deserve support",
        "Remember: depression is an illness, not a character flaw - seek help if it persists"
      ],
      followUpQuestions: [
        "How long have you been feeling this way?",
        "Is there anyone in your life who knows how you're feeling?",
        "Are you taking care of basic needs - sleep, food, water?",
        "Would you be open to speaking with a professional who can help?"
      ],
      warmingPhrases: [
        "What you're feeling is real and hard",
        "You're not a burden for struggling",
        "I'm glad you're sharing this with me",
        "There is still light within you, even when you can't see it"
      ]
    })

    // ANGER templates
    this.templates.set('anger', {
      id: 'anger',
      concern: 'anger',
      templates: [
        "I can feel the intensity of what you're experiencing about {situation}. Anger often protects something vulnerable underneath. {verse_insight} Before acting, try: {action1}. {action2}. {action3}. Once the heat passes, you'll see more clearly. What happened that triggered this?",
        "Your anger is telling you something important - perhaps a boundary was crossed or a value violated. {verse_insight} Here's how to channel it wisely: {action1}. {action2}. {action3}. Anger felt is wisdom; anger acted on blindly is regret. What really hurt you in this situation?",
        "When anger rises, the wisest pause before responding. {verse_insight} Try this cooling sequence: {action1}. {action2}. {action3}. Your anger is valid, but your response will shape what happens next. What outcome do you actually want?",
        "The fire you feel is natural - it means you care deeply about something. {verse_insight} Let's work with this energy: {action1}. {action2}. {action3}. Suppressing anger doesn't work; channeling it does. What injustice triggered this feeling?",
        "Anger can consume us or fuel positive change - the choice is ours. {verse_insight} Start with: {action1}. {action2}. {action3}. Once you're cooler, you can address the situation with clarity and strength. Who or what is at the center of this?"
      ],
      actionTemplates: [
        "Count slowly to ten, feeling your breath with each number",
        "Step away from the situation for at least 15 minutes before responding",
        "Write down everything you want to say - then don't send it yet",
        "Do something physical - walk, stretch, or squeeze something soft",
        "Ask yourself: what am I really protecting? What feels threatened?",
        "Imagine explaining your reaction to someone you respect - how would you frame it?",
        "Splash cold water on your face - it activates your calming nervous system",
        "Remember: you can be angry AND respond wisely. They're not mutually exclusive",
        "Consider: will this response help or hurt the outcome I want?"
      ],
      followUpQuestions: [
        "What would a wise response look like here?",
        "Is there something underneath the anger - hurt, fear, disappointment?",
        "What do you need that you're not getting?",
        "How would you want to feel when this is resolved?"
      ],
      warmingPhrases: [
        "Your anger makes sense given what happened",
        "It's okay to feel this strongly",
        "You don't have to have it all figured out right now",
        "Strong emotions show you care"
      ]
    })

    // FEAR templates
    this.templates.set('fear', {
      id: 'fear',
      concern: 'fear',
      templates: [
        "Fear is a natural response to {situation} - it's trying to protect you. But sometimes it protects us from what we actually need to face. {verse_insight} Here's how to work with it: {action1}. {action2}. {action3}. What specifically are you most afraid of?",
        "The courage you need isn't the absence of fear - it's moving forward despite it. {verse_insight} Start small: {action1}. {action2}. {action3}. You have survived every fearful moment of your life so far. What would you do if you weren't afraid?",
        "Fear often exaggerates the danger and underestimates your ability to cope. {verse_insight} Let's get realistic: {action1}. {action2}. {action3}. The things we fear are usually far worse in imagination than reality. What's the most likely outcome?",
        "When fear speaks loudly, wisdom speaks softly. Let's quiet the mind to hear it. {verse_insight} Try: {action1}. {action2}. {action3}. You are stronger than your fears know. What small step could you take toward what scares you?",
        "Fear keeps us safe, but it can also keep us small. {verse_insight} Here's how to expand: {action1}. {action2}. {action3}. On the other side of fear is often exactly what we need. What's the fear trying to protect you from?"
      ],
      actionTemplates: [
        "Name your fear specifically - vague fears are larger than specific ones",
        "Ask: what's the worst case? Could I survive it? Usually, yes",
        "Take one tiny step toward what scares you - just one",
        "Remember a time you were scared and got through it - you're more capable than you think",
        "Breathe slowly and tell yourself: 'I am safe in this moment'",
        "Write down evidence that contradicts your fear",
        "Talk to someone who has faced a similar fear - their perspective helps",
        "Visualize yourself on the other side of this fear - how does it feel?",
        "Accept that some fear is okay - you can act with fear, not without it"
      ],
      followUpQuestions: [
        "What's the absolute worst that could happen?",
        "What would you tell a friend facing this same fear?",
        "Is this fear based on fact or imagination?",
        "What small victory over fear could you claim today?"
      ],
      warmingPhrases: [
        "Fear takes courage to face, and you're facing it now",
        "This is hard, and it's okay to be scared",
        "You've handled scary things before",
        "Bravery is feeling afraid and choosing to act anyway"
      ]
    })

    // PURPOSE templates
    this.templates.set('purpose', {
      id: 'purpose',
      concern: 'purpose',
      templates: [
        "The search for meaning is one of life's most important journeys. {verse_insight} {situation} Let me offer some guidance: {action1}. {action2}. {action3}. Purpose isn't found - it's cultivated through action and reflection. What activities make you lose track of time?",
        "Feeling lost is often the beginning of finding your way. {verse_insight} Start here: {action1}. {action2}. {action3}. Your purpose may be closer than you think - sometimes it's hidden in what you already love. What do you care about deeply?",
        "The question 'Why am I here?' is sacred. {verse_insight} Explore it with: {action1}. {action2}. {action3}. Purpose often emerges from the intersection of what you love, what you're good at, and what the world needs. Where do these overlap for you?",
        "Purpose isn't always a grand mission - sometimes it's found in small, meaningful actions. {verse_insight} Try: {action1}. {action2}. {action3}. What matters to you that you'd fight for? That's a clue to your purpose.",
        "The universe has a place for you, even when you can't see it. {verse_insight} Begin with: {action1}. {action2}. {action3}. Trust that the clarity you seek is already within you, waiting to be uncovered. What breaks your heart about the world?"
      ],
      actionTemplates: [
        "Write down 10 things that bring you joy, no matter how small",
        "Ask three people who know you well what they think your strengths are",
        "Volunteer for something - service often reveals purpose",
        "Reflect: what would you do if success was guaranteed?",
        "List the moments in your life when you felt most alive - what do they have in common?",
        "Try something new this week - purpose often hides in unexplored territory",
        "Consider: what problems do you naturally want to solve?",
        "Think about what you wanted to be when you were a child - there may be wisdom there",
        "Accept that purpose evolves - you don't need one answer for your whole life"
      ],
      followUpQuestions: [
        "What would make your life feel meaningful?",
        "Who do you admire, and why?",
        "If you had unlimited resources, what would you do?",
        "What legacy do you want to leave?"
      ],
      warmingPhrases: [
        "This questioning is itself a sign of depth",
        "The fact that you're searching means you'll find something",
        "Your life has meaning, even when it's hard to see",
        "Purpose often comes through patience and practice"
      ]
    })

    // RELATIONSHIP templates
    this.templates.set('relationship', {
      id: 'relationship',
      concern: 'relationship',
      templates: [
        "Relationships are where our deepest growth happens, and also our deepest challenges. {situation} {verse_insight} Consider: {action1}. {action2}. {action3}. What does this relationship mean to you, and what do you need from it?",
        "The pain in our relationships often reflects unmet needs or unhealed wounds. {verse_insight} Try: {action1}. {action2}. {action3}. Understanding precedes resolution. What do you think the other person's perspective is?",
        "Love requires both strength and surrender. {verse_insight} Here's a path: {action1}. {action2}. {action3}. The best relationships are built on honest communication. What truth are you avoiding?",
        "Conflict in relationships isn't a sign of failure - it's an opportunity for deeper connection. {verse_insight} Approach it with: {action1}. {action2}. {action3}. What would forgiveness look like here, for yourself and others?",
        "We can only change ourselves, not others. This is both limiting and liberating. {verse_insight} Focus on: {action1}. {action2}. {action3}. What boundaries do you need to set or honor?"
      ],
      actionTemplates: [
        "Before reacting, ask yourself: what is my desired outcome here?",
        "Try to describe the situation from the other person's perspective",
        "Express your needs using 'I feel' rather than 'You always'",
        "Consider: am I reacting to what's happening now, or something from the past?",
        "Take space if needed, but commit to returning to the conversation",
        "Write a letter you don't send - get your feelings out, then reflect",
        "Ask yourself: what would love do in this situation?",
        "Remember that people have their own struggles you may not see",
        "Seek to understand before seeking to be understood"
      ],
      followUpQuestions: [
        "What do you need from this person that you're not getting?",
        "What role are you playing in this dynamic?",
        "Is this about the current situation or something deeper?",
        "What would resolution look like for you?"
      ],
      warmingPhrases: [
        "Relationships are hard, especially the ones that matter most",
        "It takes courage to care this much",
        "Your feelings in this situation are valid",
        "You deserve to be heard and understood"
      ]
    })

    // WORK templates
    this.templates.set('work', {
      id: 'work',
      concern: 'work',
      templates: [
        "Work challenges touch our sense of identity and security. {situation} {verse_insight} Consider: {action1}. {action2}. {action3}. What aspect of this situation can you actually influence?",
        "The Gita teaches us to focus on our duty without attachment to outcomes. This applies perfectly to work. {verse_insight} Try: {action1}. {action2}. {action3}. Your worth is not your job title. What would you do if this wasn't about proving yourself?",
        "Career struggles often hold important lessons. {verse_insight} Reflect on: {action1}. {action2}. {action3}. Sometimes what feels like an obstacle is actually a redirection. What is this situation trying to teach you?",
        "Balance between ambition and peace is essential. {verse_insight} Consider: {action1}. {action2}. {action3}. Success without well-being is hollow. What boundaries do you need to protect your peace?",
        "Your work is one expression of your dharma, but not the only one. {verse_insight} Explore: {action1}. {action2}. {action3}. What would your work look like if you did it for the act itself, not the recognition?"
      ],
      actionTemplates: [
        "Separate what you can control (your effort, attitude) from what you can't (others' decisions)",
        "Take one step today toward a long-term career goal",
        "Set clear boundaries between work time and personal time",
        "Identify one skill you could develop that would serve you",
        "Consider: is this job aligned with your values?",
        "Network with one person who inspires you professionally",
        "Update your resume, even if you're not looking - clarity helps",
        "Ask for feedback from someone you trust",
        "Remember: jobs are what you do, not who you are"
      ],
      followUpQuestions: [
        "What's the ideal outcome you're hoping for?",
        "Is this a temporary challenge or a systemic issue?",
        "What would you do if this job disappeared tomorrow?",
        "How does this work align with what matters most to you?"
      ],
      warmingPhrases: [
        "Work challenges are stressful, especially when livelihood is involved",
        "You're more than your job",
        "Career paths are rarely straight lines",
        "This difficulty doesn't define your potential"
      ]
    })

    // GRIEF templates
    this.templates.set('grief', {
      id: 'grief',
      concern: 'grief',
      templates: [
        "Loss is one of life's most profound experiences. {situation} There is no right way to grieve, only your way. {verse_insight} Be gentle with yourself: {action1}. {action2}. {action3}. How long has it been since your loss?",
        "The depth of your grief reflects the depth of your love. {verse_insight} Allow yourself: {action1}. {action2}. {action3}. Grief doesn't have a timeline - it moves in waves. What do you miss most?",
        "Ancient wisdom teaches that what we love never truly leaves us. {verse_insight} Honor your grief: {action1}. {action2}. {action3}. The connection you feel is real, even across physical absence. What would they want for you now?",
        "Grief is not something to 'get over' - it's something to integrate into who we become. {verse_insight} Be patient with yourself: {action1}. {action2}. {action3}. You are allowed to feel everything you're feeling. Do you have support around you?",
        "In our tradition, the soul is eternal. What changes form never disappears entirely. {verse_insight} Consider: {action1}. {action2}. {action3}. Your love continues, even when physical presence doesn't. How can you honor their memory?"
      ],
      actionTemplates: [
        "Give yourself permission to feel whatever arises, without judgment",
        "Create a ritual to honor your loved one - light a candle, share a memory",
        "Reach out to someone who understands your loss",
        "Write a letter to the person you've lost - say what's in your heart",
        "Take care of your basic needs - grief is exhausting, and you need rest",
        "Allow joy when it comes, without guilt - it doesn't betray your grief",
        "Seek professional support if grief feels overwhelming",
        "Find a way to continue their legacy through your actions",
        "Be patient - grief changes over time but may never fully disappear, and that's okay"
      ],
      followUpQuestions: [
        "Would you like to tell me about the person you've lost?",
        "Do you have people around you who understand your grief?",
        "What memories bring you the most comfort?",
        "How are you taking care of yourself during this time?"
      ],
      warmingPhrases: [
        "I'm so sorry for your loss",
        "Grief is the price of deep love, and it's worth it",
        "There's no timeline for healing",
        "You don't have to be strong all the time"
      ]
    })

    // GENERAL templates (fallback)
    this.templates.set('general', {
      id: 'general',
      concern: 'general',
      templates: [
        "Thank you for sharing what's on your mind. {verse_insight} Here are some thoughts: {action1}. {action2}. {action3}. What would be most helpful for you right now?",
        "I'm here to listen and offer what wisdom I can. {verse_insight} Consider: {action1}. {action2}. {action3}. What's most important to you in this situation?",
        "Life's challenges, whatever form they take, often share common roots. {verse_insight} Try: {action1}. {action2}. {action3}. What outcome are you hoping for?",
        "Ancient wisdom offers guidance for all of life's moments. {verse_insight} Reflect on: {action1}. {action2}. {action3}. What would peace look like for you?",
        "I hear you, and I'm grateful you're sharing with me. {verse_insight} Here's what might help: {action1}. {action2}. {action3}. What's one small step forward you could take?"
      ],
      actionTemplates: [
        "Take a few moments to breathe and center yourself",
        "Write down your thoughts - getting them out of your head creates clarity",
        "Reach out to someone you trust for support",
        "Focus on what's in your control and release what isn't",
        "Treat yourself with the kindness you'd show a good friend",
        "Remember that this too shall pass",
        "Take one small action toward what matters to you",
        "Rest if you need to - sometimes that's the most productive thing",
        "Trust that you have the wisdom within you to navigate this"
      ],
      followUpQuestions: [
        "What would help you most right now?",
        "Is there something specific I can help you explore?",
        "How are you feeling in this moment?",
        "What's on your heart that you haven't said?"
      ],
      warmingPhrases: [
        "I'm here with you",
        "Thank you for trusting me with this",
        "You're doing better than you think",
        "Whatever you're feeling is okay"
      ]
    })

    this.initialized = true
    console.log('✅ Offline AI templates initialized')
  }

  /**
   * Generate a response using templates and Gita wisdom
   */
  async generateResponse(
    query: string,
    context?: ResponseContext
  ): Promise<GeneratedResponse> {
    const startTime = performance.now()

    // Initialize knowledge base if needed
    await gitaKnowledgeBase.initialize()

    // Detect concern
    const concern = gitaKnowledgeBase.detectConcern(query)

    // Handle crisis
    if (concern.primary === 'crisis') {
      return this.generateCrisisResponse(concern, startTime)
    }

    // Search for relevant verses
    const verseResults = await gitaKnowledgeBase.searchVerses(query, 3)
    const verses = verseResults.map(r => r.verse)

    // Get template for concern
    const template = this.templates.get(concern.primary) || this.templates.get('general')!

    // Select random template variation
    const templateText = template.templates[Math.floor(Math.random() * template.templates.length)]

    // Extract situation from query
    const situation = this.extractSituation(query)

    // Generate verse insight
    const verseInsight = this.generateVerseInsight(verses[0])

    // Select actions based on context
    const actions = this.selectActions(template, context)

    // Generate warming phrase if appropriate
    const warmingPhrase = context?.sessionCount === 0
      ? template.warmingPhrases[Math.floor(Math.random() * template.warmingPhrases.length)] + '. '
      : ''

    // Fill template
    let response = warmingPhrase + templateText
      .replace('{situation}', situation)
      .replace('{verse_insight}', verseInsight)
      .replace('{action1}', actions[0])
      .replace('{action2}', actions[1])
      .replace('{action3}', actions[2])

    // Clean up any double spaces or awkward punctuation
    response = response.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim()

    // Select follow-up question
    const followUp = template.followUpQuestions[Math.floor(Math.random() * template.followUpQuestions.length)]

    const generationTime = performance.now() - startTime

    return {
      text: response,
      verses,
      concern,
      isOffline: true,
      generationTime,
      metadata: {
        templateId: template.id,
        confidence: concern.confidence,
        suggestedFollowUp: followUp
      }
    }
  }

  /**
   * Generate crisis response
   */
  private generateCrisisResponse(concern: ConcernDetection, startTime: number): GeneratedResponse {
    const response = `I'm hearing something that concerns me deeply. Your life has value, and you deserve support right now.

Please reach out to a crisis helpline immediately:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, please call emergency services (911 in the US).

I'm here if you want to talk, but a trained counselor can provide the support you need right now. You are not alone.`

    return {
      text: response,
      verses: [],
      concern,
      isOffline: true,
      generationTime: performance.now() - startTime,
      metadata: {
        templateId: 'crisis',
        confidence: 1.0,
      }
    }
  }

  /**
   * Extract situation from query
   */
  private extractSituation(query: string): string {
    const patterns = [
      /about (.+?)[\.\?!]?$/i,
      /with (.+?)[\.\?!]?$/i,
      /regarding (.+?)[\.\?!]?$/i,
      /because (.+?)[\.\?!]?$/i,
      /my (.+?) (is|are|has|have)/i,
    ]

    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    // Fallback: use the whole query but truncated
    if (query.length > 50) {
      return query.substring(0, 50) + '...'
    }

    return "what you're experiencing"
  }

  /**
   * Generate insight from verse
   */
  private generateVerseInsight(verse?: EliteGitaVerse): string {
    if (!verse) {
      return 'The ancient wisdom teaches that all challenges contain the seeds of growth.'
    }

    const insightFormats = [
      `As the Gita reminds us: "${verse.principle.toLowerCase()}."`,
      `Ancient wisdom teaches: ${verse.principle.toLowerCase()}.`,
      `The path of ${verse.theme} shows us: ${verse.principle.toLowerCase()}.`,
      `From Chapter ${verse.chapter}: ${verse.principle.toLowerCase()}.`,
    ]

    return insightFormats[Math.floor(Math.random() * insightFormats.length)]
  }

  /**
   * Select actions based on template and context
   */
  private selectActions(template: ResponseTemplate, context?: ResponseContext): string[] {
    const actions = [...template.actionTemplates]

    // Shuffle for variety
    for (let i = actions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[actions[i], actions[j]] = [actions[j], actions[i]]
    }

    // Select first three
    const selected = actions.slice(0, 3)

    // Format with numbers
    return [
      `First, ${selected[0].toLowerCase()}`,
      `Then, ${selected[1].toLowerCase()}`,
      `Finally, ${selected[2].toLowerCase()}`
    ]
  }

  /**
   * Get templates for testing
   */
  getTemplates(): Map<string, ResponseTemplate> {
    return this.templates
  }
}

// Export singleton instance
export const offlineAIEngine = new OfflineAIEngine()
