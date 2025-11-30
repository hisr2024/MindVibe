'use client'

import { useMemo, useState } from 'react'

const nunjucksTemplate = `{% set arrow = {
  goal_clarity: {
    original_goal: original_goal,
    refined_goal: refined_goal,
    time_frame: time_frame
  },
  purpose: {
    why_it_matters: why_it_matters,
    core_values: core_values,
    alignment_score: purpose_alignment
  },
  effort: {
    key_actions: key_actions,
    today_action: today_action,
    effort_focus_statement: effort_focus_statement
  },
  detachment: {
    outcome_fears: outcome_fears,
    detachment_reframe: detachment_reframe,
    let_go_statement: let_go_statement
  },
  consistency: {
    rhythm: rhythm,
    tiny_habit: tiny_habit,
    tracking_method: tracking_method,
    fallback_plan: fallback_plan
  },
  arrow_alignment: {
    purpose_alignment: purpose_alignment,
    effort_alignment: effort_alignment,
    detachment_alignment: detachment_alignment,
    consistency_alignment: consistency_alignment,
    overall_straightness_score: overall_score,
    coaching_note: coaching_note
  }
} %}`

const arrowCheckpoints = ['Purpose', 'Effort', 'Detachment', 'Consistency']

function toScore(value: string, bonus = 0) {
  if (!value.trim()) return 2 + bonus
  const base = Math.min(10, Math.round(value.trim().length / 28) + 3)
  return Math.min(10, base + bonus)
}

function average(values: number[]) {
  if (!values.length) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total / values.length)
}

export function PrecisionArrowEngine() {
  const [originalGoal, setOriginalGoal] = useState('Ship the Precision Arrow Engine UI prototype')
  const [refinedGoal, setRefinedGoal] = useState('Deliver a shippable Precision Arrow screen with scoring visual and mobile flow')
  const [timeFrame, setTimeFrame] = useState('This week')
  const [whyItMatters, setWhyItMatters] = useState('Clarifies what to build, keeps scope tight, and reduces decision fatigue for the team.')
  const [coreValues, setCoreValues] = useState('Clarity, craftsmanship')
  const [keyActions, setKeyActions] = useState('Sketch layout → Build React components → Validate responsive flow')
  const [todayAction, setTodayAction] = useState('Draft the Precision Arrow canvas and align scores to the schema')
  const [effortFocus, setEffortFocus] = useState('Own the actions; let outcomes follow')
  const [outcomeFears, setOutcomeFears] = useState('That the UI feels heavy or unclear on mobile')
  const [detachmentReframe, setDetachmentReframe] = useState('Ship the cleanest version possible, then iterate with real usage instead of predicting reactions.')
  const [letGoStatement, setLetGoStatement] = useState('Build with focus, learn from release')
  const [rhythm, setRhythm] = useState('Daily touch, 45-minute blocks')
  const [tinyHabit, setTinyHabit] = useState('Open the Precision Arrow screen and refine one alignment card')
  const [trackingMethod, setTrackingMethod] = useState('Checkbox list for Purpose/Effort/Detachment/Consistency')
  const [fallbackPlan, setFallbackPlan] = useState('If a day slips, rebuild momentum with one tiny habit and log why it slipped.')

  const purposeAlignment = useMemo(() => toScore(whyItMatters, coreValues ? 1 : 0), [whyItMatters, coreValues])
  const effortAlignment = useMemo(() => toScore(keyActions, todayAction ? 1 : 0), [keyActions, todayAction])
  const detachmentAlignment = useMemo(() => toScore(detachmentReframe, letGoStatement ? 1 : 0), [detachmentReframe, letGoStatement])
  const consistencyAlignment = useMemo(() => toScore(rhythm + tinyHabit + trackingMethod + fallbackPlan), [rhythm, tinyHabit, trackingMethod, fallbackPlan])

  const overallScore = useMemo(
    () => average([purposeAlignment, effortAlignment, detachmentAlignment, consistencyAlignment]),
    [purposeAlignment, effortAlignment, detachmentAlignment, consistencyAlignment]
  )

  const progress = Math.max(8, overallScore * 10)

  return (
    <section className="bg-[#0c0c10]/90 border border-orange-500/15 rounded-3xl p-6 md:p-8 shadow-[0_18px_80px_rgba(255,115,39,0.12)] space-y-6" id="precision-arrow">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Precision Arrow Engine</p>
          <h2 className="text-2xl md:text-3xl font-bold text-orange-50">Goal Alignment Canvas</h2>
          <p className="text-sm text-orange-100/80 max-w-2xl">
            Neutral, structured layout for turning any goal into a Purpose–Effort–Detachment–Consistency arrow. Built for React, with a Nunjucks schema handoff and a live scoring visual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-orange-400/20 text-orange-100/80">JSON aligned</span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-orange-400/20 text-orange-100/80">Mobile-first</span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-orange-400/20 text-orange-100/80">Arrow scoring</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Original goal" value={originalGoal} onChange={setOriginalGoal} />
            <LabeledField label="Refined goal" value={refinedGoal} onChange={setRefinedGoal} />
            <LabeledField label="Time frame" value={timeFrame} onChange={setTimeFrame} />
            <LabeledField label="Why it matters" value={whyItMatters} onChange={setWhyItMatters} />
            <LabeledField label="Core values (comma-separated)" value={coreValues} onChange={setCoreValues} />
            <LabeledField label="Outcome fears" value={outcomeFears} onChange={setOutcomeFears} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Key actions" value={keyActions} onChange={setKeyActions} multiline />
            <LabeledField label="Detachment reframe" value={detachmentReframe} onChange={setDetachmentReframe} multiline />
            <LabeledField label="Today action" value={todayAction} onChange={setTodayAction} />
            <LabeledField label="Effort focus statement" value={effortFocus} onChange={setEffortFocus} />
            <LabeledField label="Let-go statement" value={letGoStatement} onChange={setLetGoStatement} />
            <LabeledField label="Rhythm" value={rhythm} onChange={setRhythm} />
            <LabeledField label="Tiny habit" value={tinyHabit} onChange={setTinyHabit} />
            <LabeledField label="Tracking method" value={trackingMethod} onChange={setTrackingMethod} />
            <LabeledField label="Fallback plan" value={fallbackPlan} onChange={setFallbackPlan} multiline />
          </div>
        </div>

        <div className="space-y-4">
          <AlignmentCard
            overallScore={overallScore}
            purposeAlignment={purposeAlignment}
            effortAlignment={effortAlignment}
            detachmentAlignment={detachmentAlignment}
            consistencyAlignment={consistencyAlignment}
          />

          <div className="rounded-2xl border border-orange-500/15 bg-black/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Nunjucks handoff</p>
                <h3 className="text-sm font-semibold text-orange-50">Precision Arrow block</h3>
              </div>
              <span className="text-xs text-orange-100/70 bg-white/5 px-2 py-1 rounded-lg border border-orange-500/20">Drop-in</span>
            </div>
            <pre className="text-[11px] leading-relaxed text-orange-50 bg-[#0c0c10] border border-orange-500/10 rounded-xl p-3 overflow-auto">
{nunjucksTemplate}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-orange-50">Scoring Visual</h3>
          <div className="space-y-3">
            <div className="arrow-track">
              <div className="arrow-flight" style={{ width: `${progress}%` }} />
              <div className="arrow-head" style={{ left: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-orange-100/80">
              <ScorePill label="Purpose" value={purposeAlignment} />
              <ScorePill label="Effort" value={effortAlignment} />
              <ScorePill label="Detachment" value={detachmentAlignment} />
              <ScorePill label="Consistency" value={consistencyAlignment} />
            </div>
          </div>
          <p className="text-xs text-orange-100/70">Arrow flight animates on score updates; keep every pillar above 7 for a straight trajectory.</p>
        </div>

        <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-orange-50">Mobile-first flow</h3>
          <ol className="space-y-3 text-sm text-orange-100/80">
            <li className="flex gap-3">
              <span className="h-7 w-7 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-50 flex items-center justify-center text-xs font-semibold">1</span>
              <div>
                <p className="font-semibold text-orange-50">Step cards</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="h-7 w-7 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-50 flex items-center justify-center text-xs font-semibold">2</span>
              <div>
                <p className="font-semibold text-orange-50">Live arrow bar</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="h-7 w-7 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-50 flex items-center justify-center text-xs font-semibold">3</span>
              <div>
                <p className="font-semibold text-orange-50">JSON preview</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-orange-50">Checkpoints</h3>
          <div className="space-y-3">
            {arrowCheckpoints.map(checkpoint => (
              <div key={checkpoint} className="flex gap-3 items-start">
                <div className="h-3 w-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-200 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-orange-50">{checkpoint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LabeledField({
  label,
  value,
  onChange,
  multiline
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  const inputClassName =
    'w-full rounded-2xl bg-black/50 border border-orange-500/20 text-orange-50 placeholder:text-orange-100/60 p-3 focus:ring-2 focus:ring-orange-400/60 outline-none'

  if (multiline) {
    return (
      <label className="space-y-2 block">
        <span className="text-xs font-semibold text-orange-100/80">{label}</span>
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={3}
          className={`${inputClassName} min-h-[110px]`}
        />
      </label>
    )
  }

  return (
    <label className="space-y-2 block">
      <span className="text-xs font-semibold text-orange-100/80">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  )
}

function AlignmentCard({
  overallScore,
  purposeAlignment,
  effortAlignment,
  detachmentAlignment,
  consistencyAlignment
}: {
  overallScore: number
  purposeAlignment: number
  effortAlignment: number
  detachmentAlignment: number
  consistencyAlignment: number
}) {
  return (
    <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-b from-[#0d0d10] to-[#0c0c10] p-4 space-y-3 shadow-[0_10px_40px_rgba(255,115,39,0.14)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-orange-100/70">Arrow alignment</p>
          <h3 className="text-lg font-semibold text-orange-50">Overall: {overallScore}/10</h3>
        </div>
        <div className="text-right text-xs text-orange-100/70">
          <p className="text-orange-50 font-semibold">Scoring logic</p>
          <p>Presence + clarity weighting</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-orange-100/85">
        <ScoreBar label="Purpose" value={purposeAlignment} />
        <ScoreBar label="Effort" value={effortAlignment} />
        <ScoreBar label="Detachment" value={detachmentAlignment} />
        <ScoreBar label="Consistency" value={consistencyAlignment} />
      </div>
      <p className="text-xs text-orange-100/70">Keep Purpose and Effort above 7 to maintain a straight flight; strengthen Detachment and Consistency to reduce wobble.</p>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-orange-100/80">
        <span>{label}</span>
        <span className="text-orange-50 font-semibold">{value}/10</span>
      </div>
      <div className="h-2 rounded-full bg-orange-500/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-200" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-orange-500/15 bg-orange-500/10 px-3 py-2">
      <span className="text-xs text-orange-100/80">{label}</span>
      <span className="text-sm font-semibold text-orange-50">{value}</span>
    </div>
  )
}
