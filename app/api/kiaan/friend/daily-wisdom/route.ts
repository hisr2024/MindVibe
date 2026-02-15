/**
 * KIAAN Daily Wisdom - Next.js API Route
 *
 * Returns a daily Gita wisdom insight with modern psychology interpretation.
 * Rotates daily based on day-of-year so every user sees the same wisdom each day.
 */

import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DailyWisdomEntry {
  chapter: number
  verse: number
  verse_id: string
  modern_title: string
  insight: string
  secular_theme: string
  psychology: string
  daily_practice: string
  applies_to: string[]
}

const WISDOM_LIBRARY: DailyWisdomEntry[] = [
  {
    chapter: 2, verse: 47, verse_id: '2.47',
    modern_title: 'Focus on the Process, Not the Prize',
    insight: "You control what you do, not what happens next. Every top performer knows this: obsessing over results kills the performance that creates results.",
    secular_theme: 'Process over outcome',
    psychology: 'Self-Determination Theory shows intrinsic motivation (enjoying the process) outperforms extrinsic motivation (chasing rewards) for sustained high performance.',
    daily_practice: 'Pick one task today. Give it your full attention for 25 minutes without checking how it\'s "doing." Notice how it feels to work without scorekeeping.',
    applies_to: ['anxiety', 'perfectionism', 'procrastination', 'work stress'],
  },
  {
    chapter: 2, verse: 14, verse_id: '2.14',
    modern_title: 'Emotions Are Weather, Not Climate',
    insight: "Joy and pain are temporary visitors. They come, they sit, they leave. The mistake is building your identity around today's emotional weather.",
    secular_theme: 'Emotional impermanence',
    psychology: 'Acceptance and Commitment Therapy (ACT) teaches cognitive defusion: observing thoughts as passing events rather than facts about who you are.',
    daily_practice: "Next time a strong emotion hits, say: 'I notice I'm feeling [X] right now.' Adding 'I notice' creates psychological distance.",
    applies_to: ['mood swings', 'depression', 'grief', 'emotional regulation'],
  },
  {
    chapter: 6, verse: 5, verse_id: '6.5',
    modern_title: 'You Are Your Own Ally (or Enemy)',
    insight: "Your inner voice is either your best coach or your worst critic. The difference isn't talent — it's which voice you choose to listen to.",
    secular_theme: 'Self-compassion as strength',
    psychology: "Dr. Kristin Neff's research shows self-compassion correlates more strongly with resilience than self-esteem. Being kind to yourself isn't weakness — it's strategic.",
    daily_practice: "Catch one self-critical thought today. Rewrite it as you'd say it to a friend. Notice the difference in how your body responds.",
    applies_to: ['self-criticism', 'low self-esteem', 'imposter syndrome', 'inner conflict'],
  },
  {
    chapter: 6, verse: 35, verse_id: '6.35',
    modern_title: 'Your Mind Is a Puppy, Not a Problem',
    insight: "The restless mind isn't broken — it's untrained. Like a puppy that pulls on the leash, it needs patient, consistent redirection. Not punishment.",
    secular_theme: 'Mind training through practice',
    psychology: 'Neuroplasticity research shows meditation physically changes brain structure: thicker prefrontal cortex, smaller amygdala. The mind literally reshapes with practice.',
    daily_practice: "Set a timer for 3 minutes. Focus on your breath. When your mind wanders (it will), gently bring it back. That's one 'rep.' Each rep strengthens the muscle.",
    applies_to: ['anxiety', 'overthinking', 'ADHD', 'focus', 'meditation'],
  },
  {
    chapter: 3, verse: 19, verse_id: '3.19',
    modern_title: 'Action Without Agenda',
    insight: "The paradox: when you stop doing things FOR something (approval, reward, recognition), you start doing them BETTER. The agenda-free worker is the most dangerous competitor.",
    secular_theme: 'Intrinsic motivation',
    psychology: "Mihaly Csikszentmihalyi's Flow research: the state of peak performance occurs when you're fully absorbed in the activity itself, not thinking about outcomes.",
    daily_practice: 'Do one kind thing today with zero expectation of acknowledgment. Notice the quiet satisfaction that comes from action-as-its-own-reward.',
    applies_to: ['burnout', 'people-pleasing', 'work-life balance', 'purpose'],
  },
  {
    chapter: 18, verse: 47, verse_id: '18.47',
    modern_title: "Your Path Is Uniquely Yours",
    insight: "Stop comparing your chapter 3 to someone's chapter 20. Your imperfect path, walked authentically, beats someone else's path walked perfectly.",
    secular_theme: 'Authentic self-expression',
    psychology: "Carl Rogers' concept of congruence: mental health improves when your outer behavior aligns with your inner values. Inauthenticity is exhausting.",
    daily_practice: "Identify one area where you're performing someone else's expectations. Ask: 'What would I choose if nobody was watching?'",
    applies_to: ['comparison', 'identity', 'career confusion', 'social pressure'],
  },
  {
    chapter: 18, verse: 66, verse_id: '18.66',
    modern_title: 'The Power of Letting Go',
    insight: "Sometimes the bravest thing isn't fighting harder — it's releasing the grip. Surrender isn't giving up; it's giving over to something bigger than your anxiety.",
    secular_theme: 'Radical acceptance',
    psychology: 'DBT (Dialectical Behavior Therapy) teaches radical acceptance: acknowledging reality as it is (not as you wish it were) reduces suffering and opens space for change.',
    daily_practice: "Pick one thing you've been fighting against that you can't control. Say out loud: 'I accept this is how it is right now.' Feel the tension release.",
    applies_to: ['control issues', 'anxiety', 'grief', 'overwhelm', 'letting go'],
  },
]

export async function GET() {
  // Try backend first
  try {
    const res = await fetch(`${BACKEND_URL}/api/kiaan/friend/daily-wisdom`, {
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.wisdom) return NextResponse.json(data)
    }
  } catch {
    // Backend unavailable
  }

  // Static rotation based on day of year
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  const wisdom = WISDOM_LIBRARY[dayOfYear % WISDOM_LIBRARY.length]

  return NextResponse.json({ wisdom })
}
