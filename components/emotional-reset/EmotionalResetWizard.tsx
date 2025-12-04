'use client'

import { useState, useEffect, useCallback } from 'react'
import { BreathingAnimation } from './BreathingAnimation'

interface StepData {
  current_step: number
  total_steps: number
  step_title: string
  guidance: string
  progress: string
  assessment?: {
    assessment: string
    emotions: string[]
    themes: string[]
  }
  breathing?: {
    pattern: {
      inhale: number
      hold_in: number
      exhale: number
      hold_out: number
    }
    duration_seconds: number
    narration: string[]
    completion_message: string
  }
  visualization?: string
  wisdom?: Array<{
    wisdom: string
    application: string
  }>
  affirmations?: string[]
  summary?: {
    summary: string
    key_insight: string
    affirmation_to_remember: string
    next_steps: string[]
    closing_message: string
  }
}

interface EmotionalResetWizardProps {
  onComplete?: () => void
  onClose?: () => void
  className?: string
}

export function EmotionalResetWizard({
  onComplete,
  onClose,
  className = '',
}: EmotionalResetWizardProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepData, setStepData] = useState<StepData | null>(null)
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [crisisDetected, setCrisisDetected] = useState(false)
  const [crisisResponse, setCrisisResponse] = useState<string | null>(null)
  const [breathingComplete, setBreathingComplete] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

  // Start session on mount
  useEffect(() => {
    startSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/emotional-reset/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to start session')
      }

      const data = await response.json()
      setSessionId(data.session_id)
      setStepData({
        current_step: data.current_step,
        total_steps: data.total_steps,
        step_title: data.step_title,
        guidance: data.guidance,
        progress: data.progress,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setIsLoading(false)
    }
  }

  const processStep = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/emotional-reset/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          current_step: currentStep,
          user_input: currentStep === 1 ? userInput : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.crisis_detected) {
          setCrisisDetected(true)
          setCrisisResponse(data.crisis_response)
          return
        }
        throw new Error(data.detail || 'Failed to process step')
      }

      setCurrentStep(data.current_step)
      setStepData(data)
      setUserInput('')
      setBreathingComplete(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process step')
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, sessionId, currentStep, userInput])

  const completeSession = async () => {
    if (!sessionId) return

    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/emotional-reset/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to complete session')
      }

      setIsCompleted(true)
      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !userInput.trim()) {
      setError('Please share what\'s on your mind before continuing.')
      return
    }

    if (currentStep === 3 && !breathingComplete) {
      setError('Please complete the breathing exercise before continuing.')
      return
    }

    if (currentStep === 7) {
      completeSession()
    } else {
      processStep()
    }
  }

  const renderProgressBar = () => {
    const progress = (currentStep / 7) * 100

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-orange-100/70 mb-2">
          <span>{stepData?.step_title || 'Loading...'}</span>
          <span>{currentStep}/7</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-orange-100/90 leading-relaxed">
        {stepData?.guidance}
      </p>
      <div className="relative">
        <textarea
          value={userInput}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              setUserInput(e.target.value)
            }
          }}
          placeholder="Share what's weighing on your heart..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-orange-500/30 rounded-2xl text-orange-50 placeholder:text-orange-100/40 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
          aria-label="Share your feelings"
          maxLength={200}
        />
        <span className="absolute bottom-3 right-3 text-xs text-orange-100/50">
          {userInput.length}/200
        </span>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-orange-100/90 leading-relaxed">
        {stepData?.guidance}
      </p>
      {stepData?.assessment && (
        <div className="bg-gradient-to-br from-orange-500/10 to-amber-300/10 border border-orange-400/30 rounded-2xl p-4">
          <p className="text-orange-50 leading-relaxed whitespace-pre-wrap">
            {stepData.assessment.assessment}
          </p>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-orange-100/90 leading-relaxed text-center">
        {stepData?.guidance}
      </p>
      {stepData?.breathing && (
        <BreathingAnimation
          pattern={stepData.breathing.pattern}
          durationSeconds={stepData.breathing.duration_seconds}
          narration={stepData.breathing.narration}
          onComplete={() => setBreathingComplete(true)}
        />
      )}
      {breathingComplete && (
        <p className="text-center text-orange-100/80 animate-fadeIn">
          {stepData?.breathing?.completion_message}
        </p>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-orange-100/90 leading-relaxed">
        {stepData?.guidance}
      </p>
      {stepData?.visualization && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-2xl p-6">
          <p className="text-orange-50 leading-relaxed italic whitespace-pre-wrap">
            {stepData.visualization}
          </p>
        </div>
      )}
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <p className="text-orange-100/90 leading-relaxed">
        {stepData?.guidance}
      </p>
      {stepData?.wisdom?.map((item, index) => (
        <div key={index} className="bg-gradient-to-br from-orange-500/10 to-amber-300/10 border border-orange-400/30 rounded-2xl p-4 space-y-3">
          <p className="text-orange-50 leading-relaxed">
            &ldquo;{item.wisdom}&rdquo;
          </p>
          <p className="text-sm text-orange-100/70 border-t border-orange-500/20 pt-3">
            💡 {item.application}
          </p>
        </div>
      ))}
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-4">
      <p className="text-orange-100/90 leading-relaxed">
        {stepData?.guidance}
      </p>
      <div className="space-y-3">
        {stepData?.affirmations?.map((affirmation, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-orange-500/15 to-amber-300/15 border border-orange-400/25 rounded-xl p-4 flex items-start gap-3"
          >
            <span className="text-lg">✨</span>
            <p className="text-orange-50 leading-relaxed flex-1">
              {affirmation}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep7 = () => (
    <div className="space-y-6">
      {stepData?.summary && (
        <>
          <div className="text-center space-y-2">
            <span className="text-4xl">🌟</span>
            <h3 className="text-xl font-semibold text-orange-50">
              Session Complete
            </h3>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-amber-300/10 border border-orange-400/30 rounded-2xl p-4 space-y-3">
            <p className="text-orange-50 leading-relaxed">
              {stepData.summary.summary}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-orange-100/80">
              Key Insight
            </h4>
            <p className="text-orange-50 leading-relaxed">
              {stepData.summary.key_insight}
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500/15 to-orange-400/15 border border-amber-400/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-orange-100/80 mb-2">
              Affirmation to Remember
            </h4>
            <p className="text-orange-50 font-medium">
              &ldquo;{stepData.summary.affirmation_to_remember}&rdquo;
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-orange-100/80">
              Next Steps
            </h4>
            <ul className="space-y-2">
              {stepData.summary.next_steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-orange-100/80">
                  <span className="text-orange-400">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-orange-100/80 pt-4 border-t border-orange-500/20">
            {stepData.summary.closing_message}
          </p>
        </>
      )}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      case 6:
        return renderStep6()
      case 7:
        return renderStep7()
      default:
        return null
    }
  }

  const renderCrisisModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🆘</span>
          <h3 className="text-lg font-semibold text-red-400">
            Your Safety Matters
          </h3>
        </div>
        <div className="text-orange-100/90 whitespace-pre-wrap leading-relaxed">
          {crisisResponse}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setCrisisDetected(false)
              setCrisisResponse(null)
            }}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-orange-50 hover:bg-white/20 transition"
          >
            I Understand
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  )

  if (isCompleted) {
    return (
      <div className={`bg-black/50 border border-orange-500/20 rounded-2xl p-6 ${className}`}>
        <div className="text-center space-y-4">
          <span className="text-5xl">🌟</span>
          <h2 className="text-2xl font-semibold text-orange-50">
            Emotional Reset Complete
          </h2>
          <p className="text-orange-100/80">
            You&apos;ve taken a meaningful step toward emotional balance.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-300 rounded-xl font-semibold text-slate-900 hover:scale-105 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-black/50 border border-orange-500/20 rounded-2xl ${className}`}>
      {crisisDetected && renderCrisisModal()}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-500/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center">
            <span className="text-lg">🧘</span>
          </div>
          <div>
            <h2 className="font-semibold text-orange-50">Emotional Reset</h2>
            <p className="text-xs text-orange-100/60">KIAAN Guided Flow</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-orange-100/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {renderProgressBar()}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {isLoading && !stepData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-orange-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          renderCurrentStep()
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-orange-500/20 px-6 py-4">
        <button
          onClick={handleNext}
          disabled={isLoading || (currentStep === 1 && !userInput.trim()) || (currentStep === 3 && !breathingComplete)}
          className="w-full px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-300 rounded-xl font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
              Processing...
            </span>
          ) : currentStep === 7 ? (
            'Complete Session'
          ) : currentStep === 3 && !breathingComplete ? (
            'Complete Breathing First'
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  )
}

export default EmotionalResetWizard
