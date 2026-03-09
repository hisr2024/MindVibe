'use client'

import { useState, useCallback, useRef, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquareHeart,
  Star,
  Send,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Bug,
  Lightbulb,
  Heart,
  Shield,
  Zap,
  ArrowLeft,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedbackCategory =
  | 'general'
  | 'bug'
  | 'feature'
  | 'experience'
  | 'spiritual'
  | 'performance'

type Step = 'category' | 'rating' | 'details' | 'success'

interface FeedbackFormData {
  category: FeedbackCategory
  rating: number
  title: string
  message: string
  email: string
  allowFollowUp: boolean
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES: {
  id: FeedbackCategory
  label: string
  description: string
  icon: typeof MessageSquareHeart
  gradient: string
}[] = [
  {
    id: 'general',
    label: 'General Feedback',
    description: 'Share your overall thoughts and impressions',
    icon: MessageSquareHeart,
    gradient: 'from-[#d4a44c]/20 to-[#e8b54a]/5',
  },
  {
    id: 'bug',
    label: 'Report an Issue',
    description: 'Something not working as expected?',
    icon: Bug,
    gradient: 'from-red-500/15 to-orange-500/5',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Suggest a new feature or improvement',
    icon: Lightbulb,
    gradient: 'from-[#17b1a7]/15 to-[#6dd7f2]/5',
  },
  {
    id: 'experience',
    label: 'User Experience',
    description: 'Help us improve navigation and design',
    icon: Heart,
    gradient: 'from-[#ff8fb4]/15 to-[#c2a5ff]/5',
  },
  {
    id: 'spiritual',
    label: 'Spiritual Content',
    description: 'Feedback on journeys, verses, or KIAAN wisdom',
    icon: Sparkles,
    gradient: 'from-[#c2a5ff]/15 to-[#d4a44c]/5',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Report slow loading or lag issues',
    icon: Zap,
    gradient: 'from-amber-500/15 to-yellow-500/5',
  },
]

const RATING_LABELS = [
  '',
  'Very Dissatisfied',
  'Dissatisfied',
  'Neutral',
  'Satisfied',
  'Very Satisfied',
]

const RATING_EMOJIS = ['', '😔', '😕', '😐', '😊', '🌟']

const INITIAL_FORM_DATA: FeedbackFormData = {
  category: 'general',
  rating: 0,
  title: '',
  message: '',
  email: '',
  allowFollowUp: false,
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function FeedbackPageClient() {
  const [step, setStep] = useState<Step>('category')
  const [formData, setFormData] = useState<FeedbackFormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  const selectedCategory = CATEGORIES.find((c) => c.id === formData.category)

  const handleCategorySelect = useCallback((id: FeedbackCategory) => {
    setFormData((prev) => ({ ...prev, category: id }))
    setStep('rating')
  }, [])

  const handleRatingSelect = useCallback((rating: number) => {
    setFormData((prev) => ({ ...prev, rating }))
    setStep('details')
  }, [])

  const handleBack = useCallback(() => {
    if (step === 'rating') setStep('category')
    else if (step === 'details') setStep('rating')
  }, [step])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!formData.message.trim()) return

      setIsSubmitting(true)

      // Simulate submission — replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSubmitting(false)
      setStep('success')
    },
    [formData.message]
  )

  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setStep('category')
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Step Indicators                                                  */
  /* ---------------------------------------------------------------- */

  const stepIndex = ['category', 'rating', 'details', 'success'].indexOf(step)
  const steps = ['Category', 'Rating', 'Details', 'Done']

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-2">
      {/* Header */}
      <section className="rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#050507]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d4a44c]/15">
            <MessageSquareHeart className="h-5 w-5 text-[#d4a44c]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/50">
              Your Voice Matters
            </p>
            <h1 className="text-2xl font-bold text-[#f5f0e8]">
              Share Your Feedback
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#f5f0e8]/70">
          Every piece of feedback is a stepping stone on our shared journey.
          Help us make MindVibe a more meaningful companion for your spiritual
          growth.
        </p>

        {/* Progress Steps */}
        <div className="mt-6 flex items-center gap-1">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                    i <= stepIndex
                      ? 'bg-gradient-to-r from-[#d4a44c] to-[#e8b54a]'
                      : 'bg-[#f5f0e8]/10'
                  }`}
                />
                <span
                  className={`text-[10px] tracking-wide transition-colors duration-300 ${
                    i <= stepIndex ? 'text-[#d4a44c]' : 'text-[#f5f0e8]/30'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* ---- STEP 1: Category Selection ---- */}
        {step === 'category' && (
          <motion.section
            key="category"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <p className="px-1 text-sm font-medium text-[#f5f0e8]/60">
              What would you like to share feedback about?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`group flex items-start gap-3 rounded-2xl border border-[#d4a44c]/10 bg-gradient-to-br ${cat.gradient} p-4 text-left transition-all duration-200 hover:border-[#d4a44c]/30 hover:shadow-[0_8px_40px_rgba(212,164,76,0.08)] active:scale-[0.98]`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4a44c]/10 transition-colors group-hover:bg-[#d4a44c]/20">
                      <Icon className="h-4.5 w-4.5 text-[#d4a44c]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#f5f0e8]">
                        {cat.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#f5f0e8]/50">
                        {cat.description}
                      </p>
                    </div>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-[#f5f0e8]/20 transition-all group-hover:translate-x-0.5 group-hover:text-[#d4a44c]/60" />
                  </button>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ---- STEP 2: Rating ---- */}
        {step === 'rating' && (
          <motion.section
            key="rating"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-[#d4a44c]/15 bg-black/40 p-6"
          >
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1.5 text-xs text-[#f5f0e8]/50 transition hover:text-[#d4a44c]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to categories
            </button>

            {selectedCategory && (
              <div className="mb-2 flex items-center gap-2">
                <selectedCategory.icon className="h-4 w-4 text-[#d4a44c]" />
                <span className="text-xs font-medium text-[#d4a44c]">
                  {selectedCategory.label}
                </span>
              </div>
            )}

            <h2 className="text-lg font-semibold text-[#f5f0e8]">
              How would you rate your experience?
            </h2>
            <p className="mt-1 text-sm text-[#f5f0e8]/50">
              Your rating helps us understand how you feel overall.
            </p>

            {/* Star Rating */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive =
                    star <= (hoveredRating || formData.rating)
                  return (
                    <button
                      key={star}
                      onClick={() => handleRatingSelect(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="group relative p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} out of 5: ${RATING_LABELS[star]}`}
                    >
                      <Star
                        className={`h-10 w-10 transition-all duration-200 ${
                          isActive
                            ? 'fill-[#d4a44c] text-[#d4a44c] drop-shadow-[0_0_8px_rgba(212,164,76,0.5)]'
                            : 'fill-transparent text-[#f5f0e8]/20 group-hover:text-[#d4a44c]/40'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Rating Label */}
              <AnimatePresence mode="wait">
                {(hoveredRating > 0 || formData.rating > 0) && (
                  <motion.div
                    key={hoveredRating || formData.rating}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-lg">
                      {RATING_EMOJIS[hoveredRating || formData.rating]}
                    </span>
                    <span className="font-medium text-[#f5f0e8]/80">
                      {RATING_LABELS[hoveredRating || formData.rating]}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-[#f5f0e8]/30">
                Click a star to continue
              </p>
            </div>
          </motion.section>
        )}

        {/* ---- STEP 3: Details ---- */}
        {step === 'details' && (
          <motion.section
            key="details"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-[#d4a44c]/15 bg-black/40 p-6"
          >
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1.5 text-xs text-[#f5f0e8]/50 transition hover:text-[#d4a44c]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to rating
            </button>

            {/* Selected info summary */}
            <div className="mb-5 flex items-center gap-3">
              {selectedCategory && (
                <div className="flex items-center gap-1.5 rounded-full border border-[#d4a44c]/15 bg-[#d4a44c]/5 px-3 py-1">
                  <selectedCategory.icon className="h-3.5 w-3.5 text-[#d4a44c]" />
                  <span className="text-xs text-[#d4a44c]">
                    {selectedCategory.label}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= formData.rating
                        ? 'fill-[#d4a44c] text-[#d4a44c]'
                        : 'text-[#f5f0e8]/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="feedback-title"
                  className="block text-sm font-semibold text-[#f5f0e8]"
                >
                  Subject{' '}
                  <span className="font-normal text-[#f5f0e8]/40">
                    (optional)
                  </span>
                </label>
                <input
                  id="feedback-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Brief summary of your feedback"
                  className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/30 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40"
                  maxLength={120}
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label
                  htmlFor="feedback-message"
                  className="block text-sm font-semibold text-[#f5f0e8]"
                >
                  Your Feedback{' '}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder={
                    formData.category === 'bug'
                      ? 'Please describe the issue — what happened, what you expected, and steps to reproduce...'
                      : formData.category === 'feature'
                        ? 'Describe the feature you would love to see and why it would help your journey...'
                        : 'Share your thoughts — every detail helps us grow...'
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm leading-relaxed text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/30 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40"
                  maxLength={2000}
                />
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#f5f0e8]/30">
                    Your feedback is treated with reverence and care
                  </span>
                  <span
                    className={`text-[10px] ${
                      formData.message.length > 1800
                        ? 'text-amber-400'
                        : 'text-[#f5f0e8]/30'
                    }`}
                  >
                    {formData.message.length}/2000
                  </span>
                </div>
              </div>

              {/* Email + Follow-up */}
              <div className="space-y-3 rounded-xl border border-[#d4a44c]/10 bg-[#d4a44c]/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a44c]/60" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#f5f0e8]/70">
                      Want us to follow up?
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[#f5f0e8]/40">
                      Completely optional. Your feedback is valuable with or
                      without contact details.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.allowFollowUp}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        allowFollowUp: !prev.allowFollowUp,
                      }))
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                      formData.allowFollowUp
                        ? 'bg-[#d4a44c]'
                        : 'bg-[#f5f0e8]/15'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        formData.allowFollowUp ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {formData.allowFollowUp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="your@email.com"
                        className="w-full rounded-lg border border-[#d4a44c]/15 bg-slate-900/50 px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/25 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.message.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-[#d4a44c]/25 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-[#d4a44c]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending with care...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </motion.section>
        )}

        {/* ---- STEP 4: Success ---- */}
        {step === 'success' && (
          <motion.section
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#050507]/80 to-[#0f0a08]/90 p-10 text-center shadow-[0_20px_80px_rgba(212,164,76,0.12)]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a44c]/20 to-[#e8b54a]/10"
            >
              <CheckCircle2 className="h-8 w-8 text-[#d4a44c]" />
            </motion.div>

            <h2 className="text-xl font-bold text-[#f5f0e8]">
              Thank You for Your Voice
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#f5f0e8]/60">
              Your feedback has been received with gratitude. Every word you
              share helps us create a more meaningful space for spiritual
              growth and inner peace.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleReset}
                className="rounded-xl border border-[#d4a44c]/25 px-4 py-2.5 text-sm font-medium text-[#f5f0e8] transition hover:bg-[#d4a44c]/10"
              >
                Share More Feedback
              </button>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Return to Dashboard
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer Note */}
      {step !== 'success' && (
        <p className="px-2 text-center text-xs leading-relaxed text-[#f5f0e8]/30">
          Your privacy is sacred to us. Feedback is encrypted and never shared
          with third parties.
          <br />
          For urgent matters, reach us at{' '}
          <a
            href="mailto:care@kiaanverse.com"
            className="text-[#d4a44c]/60 underline underline-offset-2 transition hover:text-[#d4a44c]"
          >
            care@kiaanverse.com
          </a>
        </p>
      )}
    </main>
  )
}
