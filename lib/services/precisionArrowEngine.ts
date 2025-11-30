import type { PrecisionArrowInput } from '@/app/api/precision-arrow/route'

const valueKeywords: Record<string, string> = {
  clarity: 'Clarity',
  craft: 'Craftsmanship',
  craftsmanship: 'Craftsmanship',
  focus: 'Focus',
  learning: 'Learning',
  consistency: 'Consistency',
  discipline: 'Discipline'
}

function clampScore(score: number) {
  return Math.max(0, Math.min(10, Math.round(score)))
}

function extractValues(text: string | null | undefined) {
  if (!text) return ['Clarity', 'Momentum']

  const lowered = text.toLowerCase()
  const matches = Object.entries(valueKeywords)
    .filter(([keyword]) => lowered.includes(keyword))
    .map(([, label]) => label)

  return matches.length ? Array.from(new Set(matches)) : ['Clarity', 'Momentum']
}

function makeRefinedGoal(goal: string, timeFrame: string | null | undefined) {
  const trimmed = goal.trim()
  if (!trimmed) return 'Define a clear target before refining it'

  if (timeFrame) return `${trimmed} — built to ship within ${timeFrame}`

  return `${trimmed} — scoped to be shippable`
}

function buildPurpose(
  goal: string,
  timeFrame: string | null | undefined,
  context: string | null | undefined,
  kiaanContext: string | null | undefined
) {
  const contextualWhy = context?.trim()
    ? `${context.trim()} Keep decisions tied to the goal’s finish line.`
    : `Ensure every action ladders up to "${goal}"${timeFrame ? ` within ${timeFrame}` : ''}.`

  if (!kiaanContext?.trim()) {
    return contextualWhy
  }

  return `${contextualWhy} Honor this KIAAN insight while staying objective: ${kiaanContext.trim()}`
}

function makeKeyActions(goal: string) {
  const compactGoal = goal.length > 80 ? `${goal.slice(0, 77)}...` : goal
  return [
    `Sketch the flow for "${compactGoal}"`,
    'Translate the flow into three executable steps',
    'Review for mobile clarity and friction each day'
  ]
}

function computeAlignmentScores(payload: PrecisionArrowInput) {
  const base = 7
  const hasTimeFrame = Boolean(payload.time_frame)
  const hasContext = Boolean(payload.context)
  const isAnxious = payload.emotional_state?.toLowerCase().includes('anxious')

  const purposeAlignment = clampScore(base + (hasContext ? 1 : 0))
  const effortAlignment = clampScore(base + (payload.goal.length > 60 ? 1 : 0))
  const detachmentAlignment = clampScore(base + (isAnxious ? -1 : 1))
  const consistencyAlignment = clampScore(base + (hasTimeFrame ? 2 : 1))

  const overall = clampScore((purposeAlignment + effortAlignment + detachmentAlignment + consistencyAlignment) / 4)

  return {
    purposeAlignment,
    effortAlignment,
    detachmentAlignment,
    consistencyAlignment,
    overall
  }
}

function coachingNote(scores: {
  purposeAlignment: number
  effortAlignment: number
  detachmentAlignment: number
  consistencyAlignment: number
}) {
  const gaps: string[] = []

  if (scores.effortAlignment < 7) gaps.push('tighten the daily actions')
  if (scores.detachmentAlignment < 7) gaps.push('relieve outcome pressure before working')
  if (scores.consistencyAlignment < 8) gaps.push('lock in a repeatable rhythm')

  if (!gaps.length) return 'Keep tiny habits visible; update alignment weekly.'

  const gapList = gaps.join(' and ')
  return `Strengthen the arrow by ${gapList}, then revisit the scores after one sprint.`
}

export function buildPrecisionArrow(payload: PrecisionArrowInput) {
  const goal = payload.goal.trim()
  const timeFrame = payload.time_frame?.trim() || null
  const context = payload.context?.trim() || null
  const emotionalState = payload.emotional_state?.trim() || null
  const kiaanContext = payload.kiaan_context?.trim() || null

  const refinedGoal = makeRefinedGoal(goal, timeFrame)
  const values = extractValues(context ?? goal ?? kiaanContext)
  const keyActions = makeKeyActions(goal)
  const whyItMatters = buildPurpose(goal, timeFrame, context, kiaanContext)
  const effortFocusStatement = 'Own the controllable inputs; let results trail the craft.'
  const todayAction = `Draft the canvas for "${goal}" and anchor scores to the schema.`

  const outcomeFears = emotionalState
    ? `Feeling ${emotionalState} could skew focus toward outcomes instead of inputs.`
    : `Worry that "${goal}" won’t land even with solid effort.`

  const detachmentReframe =
    'Aim for the cleanest execution today, then adjust with real feedback instead of forecasting reactions.'

  const letGoStatement = 'Build with focus, release the scorecard until review.'

  const rhythm = timeFrame?.toLowerCase().includes('week') ? 'Daily 45-minute blocks' : 'Daily 30-minute passes'
  const tinyHabit = `Open the Precision Arrow and improve one alignment card for "${goal}"`
  const trackingMethod = 'Checkbox list for Purpose/Effort/Detachment/Consistency'
  const fallbackPlan = 'If momentum slips, restart with one tiny habit and log why it slipped.'

  const scores = computeAlignmentScores(payload)
  const coaching = coachingNote(scores)

  const kiaanBridge = {
    context_applied: kiaanContext
      ? `Used KIAAN context without changing KIAAN: ${kiaanContext}`
      : 'No KIAAN context was provided; the Precision Arrow Engine used the goal and optional context only.',
    protection_note: 'KIAAN remains fully separate; the Precision Arrow Engine only reads the provided context.'
  }

  return {
    goal_clarity: {
      original_goal: goal,
      refined_goal: refinedGoal,
      time_frame: timeFrame
    },
    purpose: {
      why_it_matters: whyItMatters,
      core_values: values,
      alignment_score: scores.purposeAlignment
    },
    effort: {
      key_actions: keyActions,
      today_action: todayAction,
      effort_focus_statement: effortFocusStatement
    },
    detachment: {
      outcome_fears: outcomeFears,
      detachment_reframe: detachmentReframe,
      let_go_statement: letGoStatement
    },
    consistency: {
      rhythm,
      tiny_habit: tinyHabit,
      tracking_method: trackingMethod,
      fallback_plan: fallbackPlan
    },
    arrow_alignment: {
      purpose_alignment: scores.purposeAlignment,
      effort_alignment: scores.effortAlignment,
      detachment_alignment: scores.detachmentAlignment,
      consistency_alignment: scores.consistencyAlignment,
      overall_straightness_score: scores.overall,
      coaching_note: coaching
    },
    kiaan_bridge: kiaanBridge
  }
}
