/**
 * KarmaResetTestimonials Section
 *
 * Displays a curated grid of testimonials from Karma Reset users.
 * Shows a rotating subset of testimonials on each render and provides
 * a "Show more" toggle for the full collection.
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { karmaResetTestimonials } from '@/data/testimonials/karma-reset-testimonials'
import { TestimonialCard } from './TestimonialCard'
import { springConfigs } from '@/lib/animations/spring-configs'

const INITIAL_DISPLAY_COUNT = 3

export function KarmaResetTestimonials() {
  const [showAll, setShowAll] = useState(false)

  // Select a stable subset for initial display using date-based seed
  // to vary by day without using Math.random() during render
  const initialTestimonials = useMemo(() => {
    const seed = new Date().getDate()
    const startIndex = seed % karmaResetTestimonials.length
    const result: typeof karmaResetTestimonials = []
    for (let i = 0; i < INITIAL_DISPLAY_COUNT; i++) {
      result.push(karmaResetTestimonials[(startIndex + i) % karmaResetTestimonials.length])
    }
    return result
  }, [])

  const displayedTestimonials = showAll
    ? karmaResetTestimonials
    : initialTestimonials

  const remainingCount =
    karmaResetTestimonials.length - INITIAL_DISPLAY_COUNT

  return (
    <motion.section
      className="mt-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={springConfigs.smooth}
    >
      {/* Section header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-orange-50/90">
          Voices from the journey
        </h2>
        <p className="mt-1 text-sm text-orange-100/50">
          Real experiences from those who walked this path
        </p>
      </div>

      {/* Testimonial grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {displayedTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Show more / Show less toggle */}
      {remainingCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="rounded-xl border border-orange-500/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-orange-100/70 transition-all duration-200 hover:border-orange-400/40 hover:bg-white/10 hover:text-orange-100/90"
          >
            {showAll
              ? 'Show fewer'
              : `Read ${remainingCount} more stories`}
          </button>
        </div>
      )}
    </motion.section>
  )
}
