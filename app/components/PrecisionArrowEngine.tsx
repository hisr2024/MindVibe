'use client'

import { type FormEvent, useMemo, useState } from 'react'

import { createPrecisionArrow, type PrecisionArrowInput } from '@/app/hooks/usePrecisionArrow'

const arrowCheckpoints = ['Purpose', 'Effort', 'Detachment', 'Consistency']

type ArrowPayload = {
  goal_clarity: {
    original_goal: string
    refined_goal: string
    time_frame: string | null
  }
  purpose: {
    why_it_matters: string
    core_values: string[]
    alignment_score: number
  }
  effort: {
    key_actions: string[]
    today_action: string
    effort_focus_statement: string
  }
  detachment: {
    outcome_fears: string | null
    detachment_reframe: string
    let_go_statement: string
  }
  consistency: {
    rhythm: string
    tiny_habit: string
    tracking_method: string
    fallback_plan: string
  }
  arrow_alignment: {
    purpose_alignment: number
    effort_alignment: number
    detachment_alignment: number
    consistency_alignment: number
    overall_straightness_score: number
    coaching_note: string
  }
}

const defaultArrow: ArrowPayload = {
  goal_clarity: {
    original_goal: 'Ship the Precision Arrow Engine UI prototype',
    refined_goal: 'Deliver a shippable Precision Arrow screen with scoring visual and mobile flow',
    time_frame: 'This week'
  },
  purpose: {
    why_it_matters: 'Clarifies what to build, keeps scope tight, and reduces decision fatigue for the team.',
    core_values: ['Clarity', 'craftsmanship'],
    alignment_score: 7
  },
  effort: {
    key_actions: ['Sketch layout', 'Build React components', 'Validate responsive flow'],
    today_action: 'Draft the Precision Arrow canvas and align scores to the schema',
    effort_focus_statement: 'Own the actions; let outcomes follow'
  },
  detachment: {
    outcome_fears: 'That the UI feels heavy or unclear on mobile',
    detachment_reframe: 'Ship the cleanest version possible, then iterate with real usage instead of predicting reactions.',
    let_go_statement: 'Build with focus, learn from release'
  },
  consistency: {
    rhythm: 'Daily touch, 45-minute blocks',
    tiny_habit: 'Open the Precision Arrow screen and refine one alignment card',
    tracking_method: 'Checkbox list for Purpose/Effort/Detachment/Consistency',
    fallback_plan: 'If a day slips, rebuild momentum with one tiny habit and log why it slipped.'
  },
  arrow_alignment: {
    purpose_alignment: 7,
    effort_alignment: 6,
    detachment_alignment: 7,
    consistency_alignment: 10,
    overall_straightness_score: 8,
    coaching_note: 'Keep tiny habits visible; update alignment weekly.'
  }
}

function average(values: number[]) {
  if (!values.length) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total / values.length)
}

export function PrecisionArrowEngine() {
  const [inputGoal, setInputGoal] = useState(defaultArrow.goal_clarity.original_goal)
  const [inputTimeFrame, setInputTimeFrame] = useState(defaultArrow.goal_clarity.time_frame ?? '')
  const [inputContext, setInputContext] = useState('')
  const [inputEmotion, setInputEmotion] = useState('')
  const [arrowPayload, setArrowPayload] = useState<ArrowPayload>(defaultArrow)
  const [status, setStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  const { purpose_alignment, effort_alignment, detachment_alignment, consistency_alignment, overall_straightness_score } =
    arrowPayload.arrow_alignment

  const overallScore = useMemo(
    () =>
      (overall_straightness_score ?? null) !== null
        ? overall_straightness_score
        : average([purpose_alignment, effort_alignment, detachment_alignment, consistency_alignment]),
    [overall_straightness_score, purpose_alignment, effort_alignment, detachment_alignment, consistency_alignment]
  )

  const progress = Math.min(100, Math.max(0, overallScore * 10))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedGoal = inputGoal.trim()

    if (!trimmedGoal) {
      setStatus({ tone: 'error', message: 'Add a clear goal before generating the Precision Arrow.' })
      return
    }

    setLoading(true)
    setStatus(null)

    const payload: PrecisionArrowInput = {
      goal: trimmedGoal,
      time_frame: inputTimeFrame || undefined,
      context: inputContext || undefined,
      emotional_state: inputEmotion || undefined
    }

    try {
      const response = await createPrecisionArrow(payload)
      setArrowPayload(response as ArrowPayload)
      setStatus({ tone: 'success', message: 'Precision Arrow updated from the live model.' })
    } catch (error) {
      console.error('Precision Arrow generation failed', error)
      const message = error instanceof Error ? error.message : 'Could not generate the Precision Arrow. Try again.'
      const kiaanSupport = 'KIAAN can still support you while the Precision Arrow Engine retries.'
      setStatus({ tone: 'error', message: `${message} ${kiaanSupport}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#0c0c10]/90 border border-orange-500/15 rounded-3xl p-6 md:p-8 shadow-[0_18px_80px_rgba(255,115,39,0.12)] space-y-6" id="precision-arrow">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Precision Arrow Engine</p>
          <h2 className="text-2xl md:text-3xl font-bold text-orange-50">Goal Alignment Canvas</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-orange-400/20 text-orange-100/80">Live model</span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-orange-400/20 text-orange-100/80">Mobile-first</span>
          <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-orange-400/20 text-orange-100/80">Arrow scoring</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-orange-500/15 bg-black/40 p-4 shadow-[0_12px_40px_rgba(255,115,39,0.1)]"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledField label="Goal" value={inputGoal} onChange={setInputGoal} />
          <LabeledField label="Time frame" value={inputTimeFrame} onChange={setInputTimeFrame} />
          <LabeledField label="Context (optional)" value={inputContext} onChange={setInputContext} multiline />
          <LabeledField label="Emotional state (optional)" value={inputEmotion} onChange={setInputEmotion} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-orange-100/80">Live model populates the alignment cards and scoring visual.</p>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 text-slate-950 font-semibold shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating…' : 'Generate Precision Arrow'}
          </button>
        </div>

        {status ? (
          <p
            className={`text-sm ${status.tone === 'error' ? 'text-red-200' : 'text-orange-100/80'}`}
            role={status.tone === 'error' ? 'alert' : undefined}
          >
            {status.message}
          </p>
        ) : null}
      </form>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <AlignmentCard
            overallScore={overallScore}
            purposeAlignment={purpose_alignment}
            effortAlignment={effort_alignment}
            detachmentAlignment={detachment_alignment}
            consistencyAlignment={consistency_alignment}
            coachingNote={arrowPayload.arrow_alignment.coaching_note}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard
              title="Goal clarity"
              items={[
                { label: 'Original goal', value: arrowPayload.goal_clarity.original_goal },
                { label: 'Refined goal', value: arrowPayload.goal_clarity.refined_goal },
                { label: 'Time frame', value: arrowPayload.goal_clarity.time_frame ?? 'Not set' }
              ]}
            />
            <DetailCard
              title="Purpose"
              items={[
                { label: 'Why it matters', value: arrowPayload.purpose.why_it_matters },
                { label: 'Core values', value: arrowPayload.purpose.core_values }
              ]}
              alignment={arrowPayload.purpose.alignment_score}
            />
            <DetailCard
              title="Effort"
              items={[
                { label: 'Key actions', value: arrowPayload.effort.key_actions },
                { label: 'Today action', value: arrowPayload.effort.today_action },
                { label: 'Effort focus', value: arrowPayload.effort.effort_focus_statement }
              ]}
            />
            <DetailCard
              title="Detachment"
              items={[
                { label: 'Outcome fears', value: arrowPayload.detachment.outcome_fears ?? 'Not set' },
                { label: 'Reframe', value: arrowPayload.detachment.detachment_reframe },
                { label: 'Let-go statement', value: arrowPayload.detachment.let_go_statement }
              ]}
            />
            <DetailCard
              title="Consistency"
              items={[
                { label: 'Rhythm', value: arrowPayload.consistency.rhythm },
                { label: 'Tiny habit', value: arrowPayload.consistency.tiny_habit },
                { label: 'Tracking method', value: arrowPayload.consistency.tracking_method },
                { label: 'Fallback plan', value: arrowPayload.consistency.fallback_plan }
              ]}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-orange-50">Scoring Visual</h3>
            <div className="space-y-3">
              <div className="relative h-3 rounded-full bg-gradient-to-r from-orange-500/10 via-orange-500/20 to-orange-400/30 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-200 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute -top-1 h-5 w-5 rounded-full border-2 border-orange-300 bg-orange-500/80 shadow-[0_0_20px_rgba(255,158,94,0.6)] transition-all duration-500"
                  style={{ left: `calc(${progress}% - 10px)` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-orange-100/80">
                <ScorePill label="Purpose" value={purpose_alignment} />
                <ScorePill label="Effort" value={effort_alignment} />
                <ScorePill label="Detachment" value={detachment_alignment} />
                <ScorePill label="Consistency" value={consistency_alignment} />
              </div>
            </div>
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
  consistencyAlignment,
  coachingNote
}: {
  overallScore: number
  purposeAlignment: number
  effortAlignment: number
  detachmentAlignment: number
  consistencyAlignment: number
  coachingNote: string
}) {
  return (
    <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-b from-[#0d0d10] to-[#0c0c10] p-4 space-y-3 shadow-[0_10px_40px_rgba(255,115,39,0.14)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-orange-100/70">Arrow alignment</p>
          <h3 className="text-lg font-semibold text-orange-50">Overall: {overallScore}/10</h3>
        </div>
      </div>
      <div className="space-y-2 text-sm text-orange-100/85">
        <ScoreBar label="Purpose" value={purposeAlignment} />
        <ScoreBar label="Effort" value={effortAlignment} />
        <ScoreBar label="Detachment" value={detachmentAlignment} />
        <ScoreBar label="Consistency" value={consistencyAlignment} />
      </div>
      <p className="text-sm text-orange-100/80 leading-relaxed border-t border-orange-500/10 pt-3">{coachingNote}</p>
    </div>
  )
}

function DetailCard({
  title,
  items,
  alignment
}: {
  title: string
  items: { label: string; value: string | string[] }[]
  alignment?: number
}) {
  return (
    <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">{title}</p>
          {typeof alignment === 'number' ? (
            <p className="text-sm font-semibold text-orange-50">Alignment {alignment}/10</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="space-y-1 rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-orange-100/70">{item.label}</p>
            {Array.isArray(item.value) ? (
              <ul className="list-disc list-inside text-sm text-orange-50 space-y-1">
                {item.value.map(entry => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-orange-50 leading-relaxed">{item.value}</p>
            )}
          </div>
        ))}
      </div>
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
