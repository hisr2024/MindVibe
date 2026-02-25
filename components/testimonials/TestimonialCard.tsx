/**
 * TestimonialCard Component
 *
 * Displays a single testimonial with an avatar initial, quote text,
 * author name, and emotional tag. Styled to match MindVibe's
 * warm, dark-theme design language.
 */

'use client'

import { motion } from 'framer-motion'
import { KarmaResetTestimonial } from '@/data/testimonials/karma-reset-testimonials'

interface TestimonialCardProps {
  testimonial: KarmaResetTestimonial
  index: number
}

export function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      className="flex flex-col rounded-2xl border border-[#d4a44c]/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 backdrop-blur"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
    >
      {/* Quote */}
      <p className="flex-1 text-sm leading-relaxed text-[#f5f0e8]/75">
        &ldquo;{testimonial.testimonial}&rdquo;
      </p>

      {/* Footer: author + tag */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar initial */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/20 border border-[#d4a44c]/20">
            <span className="text-sm font-semibold text-[#e8b54a]">
              {testimonial.initial}
            </span>
          </div>
          <span className="text-sm font-medium text-[#f5f0e8]/60">
            {testimonial.name}
          </span>
        </div>

        {/* Emotional tag */}
        <span className="text-xs text-[#e8b54a]/40">
          {testimonial.tag}
        </span>
      </div>
    </motion.div>
  )
}
