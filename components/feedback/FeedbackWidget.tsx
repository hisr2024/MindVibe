'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MessageSquareHeart,
  X,
  Star,
  Send,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedbackType = 'general' | 'bug' | 'feature' | 'experience'

interface QuickFeedbackData {
  type: FeedbackType
  rating: number
  message: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FEEDBACK_TYPES: { id: FeedbackType; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature', label: 'Feature Idea' },
  { id: 'experience', label: 'Experience' },
]

const INITIAL_DATA: QuickFeedbackData = {
  type: 'general',
  rating: 0,
  message: '',
}

/* ------------------------------------------------------------------ */
/*  Floating Feedback Widget                                           */
/*  A compact, always-accessible feedback trigger that expands into    */
/*  a quick feedback form. Place in your root layout.                  */
/* ------------------------------------------------------------------ */

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<QuickFeedbackData>(INITIAL_DATA)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
    if (isSuccess) {
      setIsSuccess(false)
      setData(INITIAL_DATA)
    }
  }, [isSuccess])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!data.message.trim()) return

      setIsSubmitting(true)
      // Simulate API call — replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setIsSubmitting(false)
      setIsSuccess(true)

      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsOpen(false)
        setTimeout(() => {
          setIsSuccess(false)
          setData(INITIAL_DATA)
        }, 300)
      }, 3000)
    },
    [data.message]
  )

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={toggle}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#d4a44c]/20 bg-gradient-to-br from-[#0d0b08] via-[#0a0a12] to-[#080810] shadow-[0_8px_32px_rgba(212,164,76,0.15)] transition-all duration-300 hover:border-[#d4a44c]/40 hover:shadow-[0_8px_40px_rgba(212,164,76,0.25)] md:bottom-6 md:right-6"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close feedback' : 'Share feedback'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5 text-[#f5f0e8]/70" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquareHeart className="h-5 w-5 text-[#d4a44c]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Popover Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-[5.5rem] right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0b08] via-[#0a0a12] to-[#080810] shadow-[0_24px_80px_rgba(0,0,0,0.5),0_8px_40px_rgba(212,164,76,0.1)] md:bottom-20 md:right-6"
          >
            {isSuccess ? (
              /* ---- Success State ---- */
              <div className="flex flex-col items-center p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-[#d4a44c]" />
                </motion.div>
                <p className="mt-3 text-sm font-semibold text-[#f5f0e8]">
                  Thank you!
                </p>
                <p className="mt-1 text-xs text-[#f5f0e8]/50">
                  Your feedback makes our journey better.
                </p>
              </div>
            ) : (
              /* ---- Form ---- */
              <form onSubmit={handleSubmit} className="p-4">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#f5f0e8]">
                    Quick Feedback
                  </h3>
                  <a
                    href="/feedback"
                    className="text-[10px] text-[#d4a44c]/60 underline underline-offset-2 transition hover:text-[#d4a44c]"
                  >
                    Detailed form
                  </a>
                </div>

                {/* Type Selector */}
                <div className="relative mb-3">
                  <select
                    value={data.type}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        type: e.target.value as FeedbackType,
                      }))
                    }
                    className="w-full appearance-none rounded-lg border border-[#d4a44c]/15 bg-slate-900/60 px-3 py-2 pr-8 text-xs text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-1 focus:ring-[#d4a44c]/30"
                    aria-label="Feedback type"
                  >
                    {FEEDBACK_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#f5f0e8]/30" />
                </div>

                {/* Star Rating */}
                <div className="mb-3 flex items-center gap-1">
                  <span className="mr-1.5 text-[10px] text-[#f5f0e8]/40">
                    Rating:
                  </span>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoveredStar || data.rating)
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({ ...prev, rating: star }))
                        }
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-0.5 transition-transform hover:scale-110"
                        aria-label={`Rate ${star} out of 5`}
                      >
                        <Star
                          className={`h-5 w-5 transition-all ${
                            active
                              ? 'fill-[#d4a44c] text-[#d4a44c]'
                              : 'fill-transparent text-[#f5f0e8]/15'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Message */}
                <textarea
                  required
                  value={data.message}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="mb-3 w-full resize-none rounded-lg border border-[#d4a44c]/15 bg-slate-900/60 px-3 py-2.5 text-xs leading-relaxed text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/25 focus:border-[#d4a44c] focus:ring-1 focus:ring-[#d4a44c]/30"
                  maxLength={500}
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !data.message.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-[#d4a44c]/20 transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
