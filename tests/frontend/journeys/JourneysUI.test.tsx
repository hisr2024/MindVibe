/**
 * Tests for Journeys UI Components
 *
 * Tests:
 * - Journey card rendering
 * - Step view display
 * - Progress tracking
 * - Check-in slider
 * - Safety response handling
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// =============================================================================
// MOCK COMPONENTS - Based on actual component structure
// =============================================================================

// Mock JourneyCard Component
const JourneyCard = ({
  title,
  description,
  duration_days,
  difficulty,
  is_featured,
  is_free,
  enemy_tags,
  onStart,
}: {
  title: string
  description: string | null
  duration_days: number
  difficulty: number
  is_featured: boolean
  is_free: boolean
  enemy_tags: string[]
  onStart: () => void
}) => {
  const getDifficultyLabel = (level: number): string => {
    const labels = ['', 'Beginner', 'Easy', 'Moderate', 'Challenging', 'Advanced']
    return labels[level] || 'Unknown'
  }

  const formatDuration = (days: number): string => {
    if (days === 1) return '1 day'
    if (days < 7) return `${days} days`
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    if (remainingDays === 0) {
      return weeks === 1 ? '1 week' : `${weeks} weeks`
    }
    return `${weeks}w ${remainingDays}d`
  }

  return (
    <article
      data-testid="journey-card"
      className={is_featured ? 'featured' : ''}
      aria-label={`Journey: ${title}`}
    >
      <header>
        <h3 data-testid="journey-title">{title}</h3>
        {is_featured && <span data-testid="featured-badge">Featured</span>}
        {is_free && <span data-testid="free-badge">Free</span>}
      </header>

      {description && <p data-testid="journey-description">{description}</p>}

      <div className="metadata">
        <span data-testid="journey-duration">{formatDuration(duration_days)}</span>
        <span data-testid="journey-difficulty">{getDifficultyLabel(difficulty)}</span>
      </div>

      <div data-testid="enemy-tags">
        {enemy_tags.map(tag => (
          <span key={tag} className="enemy-tag" data-testid={`enemy-${tag}`}>
            {tag}
          </span>
        ))}
      </div>

      <button
        onClick={onStart}
        data-testid="start-journey-button"
        aria-label={`Start ${title}`}
      >
        Start Journey
      </button>
    </article>
  )
}

// Mock StepView Component
const StepView = ({
  step_title,
  today_focus,
  teaching,
  guided_reflection,
  practice,
  micro_commitment,
  check_in_prompt,
  verse_texts,
  is_safety_response,
  safety_message,
  crisis_resources,
  onComplete,
  onCheckInChange,
}: {
  step_title: string
  today_focus: string
  teaching: string
  guided_reflection: string[]
  practice: { name: string; instructions: string[]; duration_minutes: number }
  micro_commitment: string
  check_in_prompt: { scale: string; label: string }
  verse_texts?: { chapter: number; verse: number; translation: string }[]
  is_safety_response?: boolean
  safety_message?: string
  crisis_resources?: string[]
  onComplete: () => void
  onCheckInChange: (intensity: number) => void
}) => {
  const [intensity, setIntensity] = React.useState(5)
  const [reflection, setReflection] = React.useState('')

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setIntensity(value)
    onCheckInChange(value)
  }

  // Safety response takes priority
  if (is_safety_response) {
    return (
      <div data-testid="safety-response" role="alert" aria-live="assertive">
        <h2 data-testid="safety-title">We're Here for You</h2>
        <p data-testid="safety-message">{safety_message}</p>
        <div data-testid="crisis-resources">
          <h3>Crisis Resources</h3>
          <ul>
            {crisis_resources?.map((resource, idx) => (
              <li key={idx}>{resource}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <section data-testid="step-view" aria-label={step_title}>
      <header>
        <h2 data-testid="step-title">{step_title}</h2>
        <span data-testid="step-focus">Focus: {today_focus}</span>
      </header>

      {/* Verses */}
      {verse_texts && verse_texts.length > 0 && (
        <div data-testid="verses-section">
          {verse_texts.map((v, idx) => (
            <blockquote key={idx} data-testid={`verse-${v.chapter}-${v.verse}`}>
              <cite>Chapter {v.chapter}, Verse {v.verse}</cite>
              <p>{v.translation}</p>
            </blockquote>
          ))}
        </div>
      )}

      {/* Teaching */}
      <article data-testid="teaching-section">
        <h3>Today's Teaching</h3>
        <p data-testid="teaching-content">{teaching}</p>
      </article>

      {/* Guided Reflection */}
      <section data-testid="reflection-section">
        <h3>Guided Reflection</h3>
        <ul>
          {guided_reflection.map((q, idx) => (
            <li key={idx} data-testid={`reflection-question-${idx}`}>{q}</li>
          ))}
        </ul>
        <textarea
          data-testid="reflection-input"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Share your reflection..."
          aria-label="Your reflection"
        />
      </section>

      {/* Practice */}
      <section data-testid="practice-section">
        <h3>{practice.name}</h3>
        <p data-testid="practice-duration">{practice.duration_minutes} minutes</p>
        <ol>
          {practice.instructions.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Micro Commitment */}
      <div data-testid="commitment-section">
        <h3>Today's Commitment</h3>
        <p data-testid="micro-commitment">{micro_commitment}</p>
      </div>

      {/* Check-in */}
      <div data-testid="checkin-section">
        <label htmlFor="intensity-slider">{check_in_prompt.label}</label>
        <input
          type="range"
          id="intensity-slider"
          data-testid="intensity-slider"
          min="0"
          max="10"
          value={intensity}
          onChange={handleSliderChange}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={intensity}
        />
        <span data-testid="intensity-value">{intensity}/10</span>
      </div>

      {/* Complete Button */}
      <button
        data-testid="complete-button"
        onClick={onComplete}
        aria-label="Complete today's step"
      >
        Complete Step
      </button>
    </section>
  )
}

// Mock ProgressBar Component
const ProgressBar = ({
  current,
  total,
  label,
}: {
  current: number
  total: number
  label: string
}) => {
  const percentage = Math.min(Math.round((current / total) * 100), 100)

  return (
    <div
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <span data-testid="progress-label">{label}</span>
      <div
        data-testid="progress-fill"
        style={{ width: `${percentage}%` }}
      />
      <span data-testid="progress-text">{percentage}% complete</span>
    </div>
  )
}

// =============================================================================
// TESTS
// =============================================================================

describe('JourneyCard Component', () => {
  const defaultProps = {
    title: 'Transform Anger (Krodha)',
    description: 'A 14-day journey to transform anger',
    duration_days: 14,
    difficulty: 2,
    is_featured: true,
    is_free: true,
    enemy_tags: ['krodha'],
    onStart: vi.fn(),
  }

  it('renders journey title', () => {
    render(<JourneyCard {...defaultProps} />)
    expect(screen.getByTestId('journey-title')).toHaveTextContent('Transform Anger (Krodha)')
  })

  it('renders journey description', () => {
    render(<JourneyCard {...defaultProps} />)
    expect(screen.getByTestId('journey-description')).toHaveTextContent('A 14-day journey')
  })

  it('displays featured badge when featured', () => {
    render(<JourneyCard {...defaultProps} is_featured={true} />)
    expect(screen.getByTestId('featured-badge')).toBeInTheDocument()
  })

  it('displays free badge when free', () => {
    render(<JourneyCard {...defaultProps} is_free={true} />)
    expect(screen.getByTestId('free-badge')).toBeInTheDocument()
  })

  it('formats duration correctly for 2 weeks', () => {
    render(<JourneyCard {...defaultProps} duration_days={14} />)
    expect(screen.getByTestId('journey-duration')).toHaveTextContent('2 weeks')
  })

  it('formats duration correctly for 21 days', () => {
    render(<JourneyCard {...defaultProps} duration_days={21} />)
    expect(screen.getByTestId('journey-duration')).toHaveTextContent('3 weeks')
  })

  it('displays difficulty label', () => {
    render(<JourneyCard {...defaultProps} difficulty={2} />)
    expect(screen.getByTestId('journey-difficulty')).toHaveTextContent('Easy')
  })

  it('renders enemy tags', () => {
    render(<JourneyCard {...defaultProps} enemy_tags={['krodha', 'moha']} />)
    expect(screen.getByTestId('enemy-krodha')).toBeInTheDocument()
    expect(screen.getByTestId('enemy-moha')).toBeInTheDocument()
  })

  it('calls onStart when button clicked', () => {
    const onStart = vi.fn()
    render(<JourneyCard {...defaultProps} onStart={onStart} />)

    fireEvent.click(screen.getByTestId('start-journey-button'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('has accessible aria-label', () => {
    render(<JourneyCard {...defaultProps} />)
    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Journey: Transform Anger (Krodha)')
  })
})

describe('StepView Component', () => {
  const defaultStepProps = {
    step_title: 'Day 1: Understanding Anger',
    today_focus: 'krodha',
    teaching: 'Today we explore the nature of anger and its effects...',
    guided_reflection: [
      'When did you last feel angry?',
      'What triggered that anger?',
    ],
    practice: {
      name: 'Breath Awareness',
      instructions: ['Sit quietly', 'Breathe deeply', 'Observe thoughts'],
      duration_minutes: 5,
    },
    micro_commitment: 'I will pause before reacting today.',
    check_in_prompt: {
      scale: '0-10',
      label: 'How intense is your anger today?',
    },
    verse_texts: [
      { chapter: 2, verse: 63, translation: 'From anger arises delusion...' }
    ],
    onComplete: vi.fn(),
    onCheckInChange: vi.fn(),
  }

  it('renders step title', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('step-title')).toHaveTextContent('Day 1: Understanding Anger')
  })

  it('renders focus enemy', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('step-focus')).toHaveTextContent('Focus: krodha')
  })

  it('renders verses', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('verse-2-63')).toBeInTheDocument()
  })

  it('renders teaching content', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('teaching-content')).toHaveTextContent('Today we explore')
  })

  it('renders reflection questions', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('reflection-question-0')).toHaveTextContent('When did you last feel angry?')
    expect(screen.getByTestId('reflection-question-1')).toHaveTextContent('What triggered that anger?')
  })

  it('renders practice with duration', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('practice-duration')).toHaveTextContent('5 minutes')
  })

  it('renders micro commitment', () => {
    render(<StepView {...defaultStepProps} />)
    expect(screen.getByTestId('micro-commitment')).toHaveTextContent('I will pause before reacting')
  })

  it('renders check-in slider', () => {
    render(<StepView {...defaultStepProps} />)
    const slider = screen.getByTestId('intensity-slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '10')
  })

  it('calls onCheckInChange when slider moved', () => {
    const onCheckInChange = vi.fn()
    render(<StepView {...defaultStepProps} onCheckInChange={onCheckInChange} />)

    const slider = screen.getByTestId('intensity-slider')
    fireEvent.change(slider, { target: { value: '7' } })

    expect(onCheckInChange).toHaveBeenCalledWith(7)
  })

  it('calls onComplete when complete button clicked', () => {
    const onComplete = vi.fn()
    render(<StepView {...defaultStepProps} onComplete={onComplete} />)

    fireEvent.click(screen.getByTestId('complete-button'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('allows typing in reflection textarea', () => {
    render(<StepView {...defaultStepProps} />)

    const textarea = screen.getByTestId('reflection-input')
    fireEvent.change(textarea, { target: { value: 'My reflection text' } })

    expect(textarea).toHaveValue('My reflection text')
  })
})

describe('StepView Safety Response', () => {
  const safetyProps = {
    step_title: 'Safety Response',
    today_focus: 'safety',
    teaching: '',
    guided_reflection: [],
    practice: { name: '', instructions: [], duration_minutes: 0 },
    micro_commitment: '',
    check_in_prompt: { scale: '0-10', label: '' },
    is_safety_response: true,
    safety_message: "I'm here with you, and I'm concerned about what you've shared.",
    crisis_resources: [
      'iCall (India): 9152987821',
      'AASRA: 91-22-27546669',
    ],
    onComplete: vi.fn(),
    onCheckInChange: vi.fn(),
  }

  it('displays safety response when is_safety_response is true', () => {
    render(<StepView {...safetyProps} />)
    expect(screen.getByTestId('safety-response')).toBeInTheDocument()
  })

  it('does not display normal step content when safety response', () => {
    render(<StepView {...safetyProps} />)
    expect(screen.queryByTestId('step-view')).not.toBeInTheDocument()
  })

  it('displays safety message', () => {
    render(<StepView {...safetyProps} />)
    expect(screen.getByTestId('safety-message')).toHaveTextContent("I'm here with you")
  })

  it('displays crisis resources', () => {
    render(<StepView {...safetyProps} />)
    expect(screen.getByTestId('crisis-resources')).toBeInTheDocument()
  })

  it('has assertive aria-live for screen readers', () => {
    render(<StepView {...safetyProps} />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })
})

describe('ProgressBar Component', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar current={7} total={14} label="Journey Progress" />)
    expect(screen.getByTestId('progress-text')).toHaveTextContent('50% complete')
  })

  it('has correct aria attributes', () => {
    render(<ProgressBar current={7} total={14} label="Journey Progress" />)

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '7')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '14')
    expect(progressbar).toHaveAttribute('aria-label', 'Journey Progress')
  })

  it('caps percentage at 100%', () => {
    render(<ProgressBar current={15} total={14} label="Journey Progress" />)
    expect(screen.getByTestId('progress-text')).toHaveTextContent('100% complete')
  })

  it('shows 0% for no progress', () => {
    render(<ProgressBar current={0} total={14} label="Journey Progress" />)
    expect(screen.getByTestId('progress-text')).toHaveTextContent('0% complete')
  })
})

describe('Accessibility', () => {
  it('JourneyCard has proper button labeling', () => {
    render(
      <JourneyCard
        title="Test Journey"
        description={null}
        duration_days={7}
        difficulty={1}
        is_featured={false}
        is_free={false}
        enemy_tags={[]}
        onStart={vi.fn()}
      />
    )

    const button = screen.getByRole('button', { name: /start test journey/i })
    expect(button).toBeInTheDocument()
  })

  it('StepView slider has accessible labels', () => {
    render(
      <StepView
        step_title="Test"
        today_focus="krodha"
        teaching="Test teaching"
        guided_reflection={[]}
        practice={{ name: 'Test', instructions: [], duration_minutes: 5 }}
        micro_commitment="Test"
        check_in_prompt={{ scale: '0-10', label: 'Test label' }}
        onComplete={vi.fn()}
        onCheckInChange={vi.fn()}
      />
    )

    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuenow')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '10')
  })

  it('reflection textarea has accessible label', () => {
    render(
      <StepView
        step_title="Test"
        today_focus="krodha"
        teaching="Test"
        guided_reflection={[]}
        practice={{ name: 'Test', instructions: [], duration_minutes: 5 }}
        micro_commitment="Test"
        check_in_prompt={{ scale: '0-10', label: 'Test' }}
        onComplete={vi.fn()}
        onCheckInChange={vi.fn()}
      />
    )

    const textarea = screen.getByRole('textbox', { name: /your reflection/i })
    expect(textarea).toBeInTheDocument()
  })
})
