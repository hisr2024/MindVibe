'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BreathingAnimation } from './BreathingAnimation'
import { VoiceInputButton, VoiceResponseButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import {
  startEmotionalReset,
  processStep as apiProcessStep,
  completeSession as apiCompleteSession,
} from '@/lib/api/emotional-reset'

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

/**
 * Retry a function with exponential backoff.
 * Retries on network/timeout/server errors but not on 4xx client errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry on client errors (rate limit messages are surfaced directly)
      const msg = lastError.message.toLowerCase()
      const isNonRetryable =
        msg.includes('not found') ||
        msg.includes('already been completed') ||
        msg.includes('daily limit')
      if (isNonRetryable) throw lastError

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Convert API errors into compassionate, actionable user messages.
 */
function getFriendlyErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong. Please try again.'

  const msg = err.message.toLowerCase()

  if (msg.includes('abort') || msg.includes('timeout') || msg.includes('timed out')) {
    return 'The request timed out. The service may be busy — please try again in a moment.'
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('connect') || msg.includes('failed to fetch')) {
    return 'Unable to connect. Please check your internet connection and try again.'
  }
  // Preserve server-side messages for rate limits, session errors, etc.
  return err.message
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

  // Voice integration
  const { language } = useLanguage()
  const [crisisResponse, setCrisisResponse] = useState<string | null>(null)
  const [breathingComplete, setBreathingComplete] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Track the last failed action so retry button can re-invoke it
  const lastFailedAction = useRef<(() => void) | null>(null)

  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Start session only after client-side hydration is complete
  useEffect(() => {
    if (isMounted && !sessionId) {
      startSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sessionId excluded intentionally: we only want to start a session once after mount, not re-run when sessionId changes. startSession is defined inline.
  }, [isMounted])

  const startSession = async () => {
    setIsLoading(true)
    setError(null)
    lastFailedAction.current = null

    try {
      const data = await withRetry(() => startEmotionalReset())
      setSessionId(data.session_id)
      setStepData({
        current_step: data.current_step,
        total_steps: data.total_steps,
        step_title: data.step_title,
        guidance: data.guidance,
        progress: data.progress,
      })
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
      lastFailedAction.current = startSession
    } finally {
      setIsLoading(false)
    }
  }

  const processStep = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)
    lastFailedAction.current = null

    try {
      const data = await withRetry(() =>
        apiProcessStep(sessionId, currentStep, currentStep === 1 ? userInput : undefined)
      )

      if (data.crisis_detected) {
        setCrisisDetected(true)
        setCrisisResponse(data.crisis_response || null)
        return
      }

      setCurrentStep(data.current_step)
      setStepData(data)
      setUserInput('')
      setBreathingComplete(false)
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
      lastFailedAction.current = processStep
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, currentStep, userInput])

  const completeSession = async () => {
    if (!sessionId) return

    setIsLoading(true)
    lastFailedAction.current = null

    try {
      await withRetry(() => apiCompleteSession(sessionId))
      setIsCompleted(true)
      onComplete?.()
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
      lastFailedAction.current = completeSession
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
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[#f5f0e8]/65">{stepData?.step_title || 'Preparing...'}</span>
          <span className="text-[#d4a44c]/60 text-xs">{currentStep} of 7</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full divine-progress-bar rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[#f5f0e8]/90 leading-relaxed flex-1">
          {stepData?.guidance}
        </p>
        {stepData?.guidance && (
          <VoiceResponseButton
            text={stepData.guidance}
            language={language}
            size="sm"
            variant="minimal"
          />
        )}
      </div>
      <div className="relative">
        <div className="flex items-center justify-end mb-2">
          <VoiceInputButton
            language={language}
            onTranscript={(text) => {
              const newValue = userInput ? `${userInput} ${text}` : text
              if (newValue.length <= 200) {
                setUserInput(newValue)
              }
            }}
            disabled={isLoading}
          />
        </div>
        <textarea
          value={userInput}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              setUserInput(e.target.value)
            }
          }}
          placeholder="Speak or type what's weighing on your heart..."
          className="w-full h-32 px-4 py-3 bg-white/5 border border-[#d4a44c]/30 rounded-2xl text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/50 resize-none"
          aria-label="Share your feelings"
          maxLength={200}
        />
        <span className="absolute bottom-3 right-3 text-xs text-[#f5f0e8]/50">
          {userInput.length}/200
        </span>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-[#f5f0e8]/90 leading-relaxed">
        {stepData?.guidance}
      </p>
      {stepData?.assessment && (
        <div className="bg-gradient-to-br from-[#d4a44c]/10 to-[#e8b54a]/10 border border-[#d4a44c]/30 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[#f5f0e8] leading-relaxed whitespace-pre-wrap flex-1">
              {stepData.assessment.assessment}
            </p>
            <VoiceResponseButton
              text={stepData.assessment.assessment}
              language={language}
              size="sm"
              variant="accent"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-[#f5f0e8]/90 leading-relaxed text-center">
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
        <p className="text-center text-[#f5f0e8]/80 animate-fadeIn">
          {stepData?.breathing?.completion_message}
        </p>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-[#f5f0e8]/80 leading-relaxed font-sacred">
        {stepData?.guidance}
      </p>
      {stepData?.visualization && (
        <div className="divine-step-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[#f5f0e8]/90 leading-relaxed italic whitespace-pre-wrap flex-1 font-sacred">
              {stepData.visualization}
            </p>
            <VoiceResponseButton
              text={stepData.visualization}
              language={language}
              size="sm"
              variant="accent"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <p className="text-[#f5f0e8]/80 leading-relaxed font-sacred">
        {stepData?.guidance}
      </p>
      {stepData?.wisdom?.map((item, index) => (
        <div key={index} className="divine-step-card rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[#f5f0e8]/90 leading-relaxed flex-1 font-sacred">
              &ldquo;{item.wisdom}&rdquo;
            </p>
            <VoiceResponseButton
              text={`${item.wisdom}. ${item.application}`}
              language={language}
              size="sm"
              variant="accent"
            />
          </div>
          <div className="divine-sacred-thread w-full" />
          <p className="text-sm text-[#f5f0e8]/60 leading-relaxed">
            {item.application}
          </p>
        </div>
      ))}
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-4">
      <p className="text-[#f5f0e8]/80 leading-relaxed font-sacred">
        {stepData?.guidance}
      </p>
      <div className="space-y-3">
        {stepData?.affirmations?.map((affirmation, index) => (
          <div
            key={index}
            className="divine-step-card rounded-xl p-4 flex items-start gap-3"
          >
            <span className="divine-diya h-2 w-2 rounded-full bg-[#e8b54a] mt-1.5 flex-shrink-0" />
            <p className="text-[#f5f0e8]/85 leading-relaxed flex-1 font-sacred">
              {affirmation}
            </p>
            <VoiceResponseButton
              text={affirmation}
              language={language}
              size="sm"
              variant="minimal"
            />
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
            <div className="divine-companion-avatar h-14 w-14 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center mx-auto">
              <span className="text-xl">&#x1F31F;</span>
            </div>
            <h3 className="text-xl font-semibold kiaan-text-golden">
              Sacred Journey Complete
            </h3>
            <p className="text-[10px] text-[#d4a44c]/45 tracking-[0.1em] uppercase">KIAAN honors your courage</p>
            <div className="divine-sacred-thread w-16 mx-auto mt-2" />
          </div>

          <div className="divine-step-card rounded-2xl p-5 space-y-3">
            <p className="text-[#f5f0e8]/85 leading-relaxed font-sacred">
              {stepData.summary.summary}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#d4a44c]/70 flex items-center gap-2">
              <span>&#x1F4A1;</span> Key Insight
            </h4>
            <p className="text-[#f5f0e8]/80 leading-relaxed font-sacred">
              {stepData.summary.key_insight}
            </p>
          </div>

          <div className="divine-step-card rounded-xl p-5">
            <h4 className="text-sm font-semibold text-[#d4a44c]/70 mb-2 flex items-center gap-2">
              <span>&#x1F9D8;</span> Sacred Affirmation
            </h4>
            <p className="text-[#f5f0e8] font-medium font-sacred leading-relaxed">
              &ldquo;{stepData.summary.affirmation_to_remember}&rdquo;
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#d4a44c]/70 flex items-center gap-2">
              <span>&#x1F54A;&#xFE0F;</span> Your Path Forward
            </h4>
            <ul className="space-y-2">
              {stepData.summary.next_steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2.5 text-[#f5f0e8]/75 text-sm">
                  <span className="divine-diya h-1.5 w-1.5 rounded-full bg-[#e8b54a] mt-1.5 flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="divine-sacred-thread w-full" />
          <p className="text-center text-[#f5f0e8]/60 font-sacred leading-relaxed">
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
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="divine-reset-container rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="divine-companion-avatar h-10 w-10 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center">
            <span className="text-lg">&#x1F64F;</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold kiaan-text-golden">
              KIAAN Cares Deeply for You
            </h3>
            <p className="text-[10px] text-[#d4a44c]/45 tracking-wide">You are not alone</p>
          </div>
        </div>
        <div className="divine-sacred-thread w-full" />
        <div className="text-[#f5f0e8]/80 whitespace-pre-wrap leading-relaxed font-sacred">
          {crisisResponse}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setCrisisDetected(false)
              setCrisisResponse(null)
            }}
            className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[#d4a44c]/20 rounded-xl text-[#f5f0e8] hover:bg-white/[0.08] hover:border-[#d4a44c]/35 transition"
          >
            I Understand
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 hover:bg-red-500/20 transition"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  )

  // Prevent hydration mismatch by waiting for client-side mount
  if (!isMounted) {
    return (
      <div className={`bg-black/50 border border-[#d4a44c]/20 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-[#d4a44c] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className={`divine-reset-container rounded-2xl p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="divine-companion-avatar h-16 w-16 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center mx-auto">
            <span className="text-2xl">&#x1F31F;</span>
          </div>
          <h2 className="text-2xl font-semibold kiaan-text-golden">
            Sacred Reset Complete
          </h2>
          <div className="divine-sacred-thread w-16 mx-auto" />
          <p className="text-[#f5f0e8]/65 font-sacred leading-relaxed max-w-sm mx-auto">
            You have walked through the sacred process with courage. KIAAN honors your journey toward inner peace and balance.
          </p>
          <button
            onClick={onClose}
            className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold hover:scale-[1.03] transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`divine-reset-container rounded-2xl ${className}`}>
      {crisisDetected && renderCrisisModal()}

      {/* Header — Sacred Companion */}
      <div className="flex items-center justify-between border-b border-[#d4a44c]/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="divine-companion-avatar h-10 w-10 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center">
            <span className="text-lg">&#x1F9D8;</span>
          </div>
          <div>
            <h2 className="font-semibold text-[#f5f0e8]">Emotional Reset</h2>
            <p className="text-[10px] text-[#d4a44c]/50 tracking-wide">KIAAN Sacred Wellness Flow</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-[#f5f0e8]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {renderProgressBar()}

        {error && (
          <div className="mb-4 p-3 bg-[#d4a44c]/8 border border-[#d4a44c]/20 rounded-xl text-[#e8b54a]/80 text-sm flex items-start justify-between gap-3">
            <span>{error}</span>
            {lastFailedAction.current && (
              <button
                onClick={() => {
                  setError(null)
                  lastFailedAction.current?.()
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-[#d4a44c]/15 border border-[#d4a44c]/30 rounded-lg text-[#e8b54a] text-xs font-medium hover:bg-[#d4a44c]/25 transition"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {isLoading && !stepData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-[#d4a44c] border-t-transparent rounded-full" />
          </div>
        ) : (
          renderCurrentStep()
        )}
      </div>

      {/* Footer — Sacred Continue */}
      <div className="border-t border-[#d4a44c]/10 px-6 py-4">
        <button
          onClick={handleNext}
          disabled={isLoading || (currentStep === 1 && !userInput.trim()) || (currentStep === 3 && !breathingComplete)}
          className="w-full px-6 py-3 kiaan-btn-golden rounded-xl font-semibold transition hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-[#0a0a12] border-t-transparent rounded-full" />
              KIAAN is reflecting...
            </span>
          ) : currentStep === 7 ? (
            'Complete Sacred Session'
          ) : currentStep === 3 && !breathingComplete ? (
            'Complete Breathing First'
          ) : (
            'Continue Journey'
          )}
        </button>
      </div>
    </div>
  )
}

export default EmotionalResetWizard
