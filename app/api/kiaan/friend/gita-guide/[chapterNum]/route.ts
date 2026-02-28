/**
 * KIAAN Gita Guide - Chapter Interpretation Route
 *
 * Returns a modern, secular, psychology-backed interpretation of a Gita chapter.
 * Falls back to static interpretations when backend/OpenAI unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { BACKEND_URL } from '@/lib/proxy-utils'

interface ChapterGuide {
  chapter: number
  modern_title: string
  secular_theme: string
  psychology_connection: string
  modern_lesson: string
  daily_practice: string
  applies_to: string[]
}

const CHAPTER_GUIDES: Record<number, ChapterGuide> = {
  1: { chapter: 1, modern_title: "When Everything Falls Apart", secular_theme: "Confronting overwhelming crisis", psychology_connection: "The freeze response in fight-flight-freeze. Arjuna's collapse mirrors how we shut down when decisions feel impossible.", modern_lesson: "Feeling paralyzed isn't weakness — it's your nervous system protecting you from a decision that conflicts with your values. The first step isn't action; it's acknowledging the conflict.", daily_practice: "When you feel stuck, write down the two values that are in conflict. Naming the tension is the beginning of resolving it.", applies_to: ['overwhelm', 'decision paralysis', 'moral dilemma', 'anxiety'] },
  2: { chapter: 2, modern_title: "The Psychology of Letting Go", secular_theme: "Detachment from outcomes as a performance strategy", psychology_connection: "Process-focused mindset (Carol Dweck's growth mindset) + Stoic philosophy. Focus on effort, release attachment to results.", modern_lesson: "You can't control outcomes, but you can master your response. Peak performers obsess over process, not prizes. The paradox: letting go of results actually improves them.", daily_practice: "Pick one task today. Set a timer for 25 minutes. Work with full presence. When done, close it — don't check 'how it did.' Notice the freedom.", applies_to: ['perfectionism', 'anxiety', 'work stress', 'emotional regulation'] },
  3: { chapter: 3, modern_title: "The Antidote to Paralysis", secular_theme: "Why action beats overthinking", psychology_connection: "Behavioral Activation (BA) therapy: action precedes motivation, not the other way around. You don't wait to feel ready — you act, and readiness follows.", modern_lesson: "Overthinking is procrastination wearing a thinking cap. The Gita says: consistent action, done without selfish agenda, is the path to inner peace. Start before you're ready.", daily_practice: "Identify one thing you've been 'thinking about' doing. Do the smallest possible version of it today. 2 minutes. That's it.", applies_to: ['procrastination', 'depression', 'overthinking', 'purpose'] },
  4: { chapter: 4, modern_title: "Knowledge as Liberation", secular_theme: "Self-knowledge dissolves suffering", psychology_connection: "Psychoeducation + metacognition: understanding WHY you feel what you feel reduces its power over you.", modern_lesson: "Knowledge isn't just information — it's self-awareness. When you understand your patterns, triggers, and defaults, you stop being their puppet.", daily_practice: "Journal for 5 minutes: 'Today I noticed I tend to [pattern] when [trigger] happens. Next time, I could try [alternative].'", applies_to: ['self-doubt', 'trust issues', 'learning', 'patterns'] },
  5: { chapter: 5, modern_title: "Finding Peace in Chaos", secular_theme: "Inner detachment while staying engaged", psychology_connection: "Mindfulness-Based Stress Reduction (MBSR): being fully present in action while maintaining inner equanimity.", modern_lesson: "You can be in the storm without being OF the storm. True peace isn't escaping life — it's engaging fully while keeping your center.", daily_practice: "During one stressful task today, pause. Take 3 breaths. Then continue with awareness. Notice: you can be calm AND productive.", applies_to: ['stress', 'burnout', 'work-life balance', 'inner peace'] },
  6: { chapter: 6, modern_title: "Training Your Mind Like an Athlete", secular_theme: "Meditation and mind training as practical tools", psychology_connection: "Neuroplasticity: meditation physically reshapes the brain — thicker prefrontal cortex, smaller amygdala. Mental training is as real as physical training.", modern_lesson: "Your mind isn't broken, it's untrained. Like a puppy on a leash, it pulls in every direction. Patient, daily practice builds the neural pathways for focus and calm.", daily_practice: "3 minutes of breath focus. When your mind wanders, gently return. Each return is one 'rep.' You're building a muscle.", applies_to: ['anxiety', 'focus', 'ADHD', 'meditation', 'mindfulness'] },
  7: { chapter: 7, modern_title: "The Wonder of Understanding", secular_theme: "Intellectual curiosity as spiritual practice", psychology_connection: "Awe research (Dacher Keltner): experiencing wonder and awe improves wellbeing, reduces inflammation, and increases generosity.", modern_lesson: "Curiosity is medicine. When you approach life with genuine wonder instead of cynicism, your brain chemistry literally changes.", daily_practice: "Spend 5 minutes observing something ordinary with fresh eyes. A leaf. Your hand. The sky. What do you notice that you usually miss?", applies_to: ['existential questions', 'curiosity', 'meaning', 'wonder'] },
  8: { chapter: 8, modern_title: "What Lasts When Everything Ends", secular_theme: "Confronting mortality to live fully", psychology_connection: "Terror Management Theory + memento mori: reflecting on death reduces anxiety and increases meaning-making.", modern_lesson: "Avoiding thoughts of mortality makes you live smaller. Facing impermanence directly is the fastest path to living with urgency and purpose.", daily_practice: "Ask yourself: 'If this was my last week, what would I stop doing? What would I start?' Let the answers guide today.", applies_to: ['death anxiety', 'grief', 'meaning of life', 'urgency'] },
  9: { chapter: 9, modern_title: "You Are Enough, As You Are", secular_theme: "Unconditional self-worth", psychology_connection: "Carl Rogers' unconditional positive regard: healing happens when you feel accepted exactly as you are, flaws included.", modern_lesson: "You don't need to earn your worth through achievement. A leaf, a flower, water — the smallest offering, given with sincerity, is enough. YOU are enough.", daily_practice: "Write down one thing you appreciate about yourself that has nothing to do with achievement or productivity.", applies_to: ['self-worth', 'imposter syndrome', 'perfectionism', 'self-acceptance'] },
  10: { chapter: 10, modern_title: "Seeing Excellence Everywhere", secular_theme: "Gratitude and recognizing greatness", psychology_connection: "Gratitude research (Robert Emmons): regular gratitude practice increases happiness by 25% and improves sleep quality.", modern_lesson: "Excellence isn't rare — it's everywhere, once you train your eyes to see it. The sunrise, a friend's loyalty, your own persistence.", daily_practice: "Before bed, name 3 things that were excellent today. Not just 'good' — genuinely excellent. Raise your standard for noticing.", applies_to: ['low self-esteem', 'negativity bias', 'gratitude', 'appreciation'] },
  11: { chapter: 11, modern_title: "The Humbling Power of Perspective", secular_theme: "Cosmic perspective reduces ego and anxiety", psychology_connection: "Overview Effect: astronauts who see Earth from space experience lasting shifts in perspective, reduced pettiness, increased compassion.", modern_lesson: "When you zoom out far enough, your problems become appropriately sized. Not dismissing them — but seeing them within the bigger picture.", daily_practice: "Step outside tonight. Look at the stars. Hold your biggest worry in mind. Notice how it feels smaller from this perspective.", applies_to: ['ego', 'perspective', 'humility', 'anxiety'] },
  12: { chapter: 12, modern_title: "The Qualities of a Great Friend", secular_theme: "What it means to truly love and be loved", psychology_connection: "Attachment Theory (John Bowlby): secure attachment — consistent, non-judgmental presence — is the foundation of all healthy relationships.", modern_lesson: "The ideal friend (and the ideal self) is: forgiving, non-judgmental, content with simplicity, steady in crisis, and not swayed by praise or blame.", daily_practice: "Be that friend to ONE person today. Listen fully. Don't fix. Don't judge. Just be present. Notice how it changes the interaction.", applies_to: ['relationships', 'loneliness', 'love', 'friendship'] },
  13: { chapter: 13, modern_title: "You Are Not Your Thoughts", secular_theme: "The observer self vs. the thinking self", psychology_connection: "ACT (Acceptance and Commitment Therapy): distinguishing between 'self-as-content' (I am anxious) and 'self-as-context' (I notice anxiety arising).", modern_lesson: "You are not your body, your emotions, your job title, or your bank account. You are the awareness BEHIND all of that. This distinction changes everything.", daily_practice: "Next time you feel a strong emotion, practice: 'I am not anxious. There is anxiety present.' Feel the difference? That's freedom.", applies_to: ['identity crisis', 'mindfulness', 'self-knowledge', 'emotional distance'] },
  14: { chapter: 14, modern_title: "Understanding Your Operating Modes", secular_theme: "The three modes that drive all behavior", psychology_connection: "The three gunas map to modern psychology: Sattva = growth mindset, Rajas = competitive/anxious drive, Tamas = depressive inertia.", modern_lesson: "Understanding which mode you're in — energized growth, anxious pushing, or heavy inertia — lets you consciously shift gears.", daily_practice: "Check in 3 times today: 'Am I in growth mode, push mode, or shutdown mode?' Name it. Then decide: is this where I want to be?", applies_to: ['habits', 'mood management', 'self-awareness', 'behavior change'] },
  15: { chapter: 15, modern_title: "Finding Your Purpose", secular_theme: "What you're here to do", psychology_connection: "Viktor Frankl's logotherapy: meaning is the primary drive. Those who find their 'why' can endure any 'how.'", modern_lesson: "Purpose isn't found by thinking harder — it's found by paying attention. What makes you lose track of time? What problem do you wish someone would solve?", daily_practice: "Complete this sentence without overthinking: 'The world needs more _____ and I could contribute by _____.'", applies_to: ['life purpose', 'career', 'meaning', 'direction'] },
  16: { chapter: 16, modern_title: "Your Light Side vs. Dark Side", secular_theme: "Cultivating virtues, recognizing toxic patterns", psychology_connection: "Shadow Work (Carl Jung): integrating your shadow — the parts you deny — is essential for wholeness.", modern_lesson: "Everyone has both divine and demonic qualities. Growth isn't pretending the dark side doesn't exist — it's choosing which side to feed.", daily_practice: "Honestly identify one 'shadow trait' (jealousy, spite, dishonesty). Don't judge it. Just acknowledge: 'This is also part of me.' That's step one.", applies_to: ['character growth', 'toxic traits', 'self-improvement', 'shadow work'] },
  17: { chapter: 17, modern_title: "What Actually Motivates You?", secular_theme: "Understanding the quality of your drive", psychology_connection: "Self-Determination Theory (Deci & Ryan): intrinsic motivation (genuine interest) outperforms extrinsic motivation (fear, reward) for long-term success.", modern_lesson: "Not all discipline is created equal. Are you motivated by genuine calling, anxious obligation, or lazy habit? The source of motivation determines the quality of the outcome.", daily_practice: "For each task today, ask: 'Am I doing this because I genuinely believe in it, because I feel I should, or because it's just habit?'", applies_to: ['motivation', 'discipline', 'faith', 'purpose'] },
  18: { chapter: 18, modern_title: "Integration — Bringing It All Together", secular_theme: "The synthesis of all wisdom into daily life", psychology_connection: "Psychosynthesis: the goal of psychological growth is integration — bringing together all parts of yourself into a coherent, purposeful whole.", modern_lesson: "The final teaching: do your best work, detach from results, be kind, stay curious, and when all else fails — let go and trust. You've always had everything you need.", daily_practice: "At the end of today, ask: 'Did I act with integrity? Did I learn something? Did I let go of what I couldn't control?' If yes to any — good day.", applies_to: ['integration', 'liberation', 'surrender', 'wholeness'] },
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterNum: string }> },
) {
  const { chapterNum: raw } = await params
  const chapterNum = parseInt(raw, 10)

  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 18) {
    return NextResponse.json({ error: 'Chapter must be 1-18' }, { status: 400 })
  }

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/guidance/chapter/${chapterNum}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.chapter_guide) return NextResponse.json(data)
    }
  } catch {
    // Backend unavailable
  }

  // Try OpenAI for dynamic interpretation
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey && apiKey !== 'your-api-key-here') {
    try {
      const staticGuide = CHAPTER_GUIDES[chapterNum]
      if (staticGuide) {
        const client = new OpenAI({ apiKey })
        const completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a modern psychology expert who interprets Bhagavad Gita wisdom in completely secular, practical terms. Never use religious language. Use behavioral science, CBT, ACT, and neuroscience frameworks. Be specific and actionable.`,
            },
            {
              role: 'user',
              content: `Give a fresh, modern interpretation of Bhagavad Gita Chapter ${chapterNum} "${staticGuide.modern_title}". Theme: ${staticGuide.secular_theme}. Include: 1) A modern lesson (2-3 sentences), 2) A psychology connection, 3) A specific daily practice. Keep total under 200 words.`,
            },
          ],
          max_tokens: 300,
          temperature: 0.8,
        })

        const text = completion.choices[0]?.message?.content
        if (text) {
          return NextResponse.json({
            chapter_guide: {
              ...staticGuide,
              modern_lesson: text,
            },
          })
        }
      }
    } catch {
      // OpenAI failed, use static
    }
  }

  // Static fallback
  const guide = CHAPTER_GUIDES[chapterNum]
  if (!guide) {
    return NextResponse.json({ chapter_guide: null })
  }

  return NextResponse.json({ chapter_guide: guide })
}
