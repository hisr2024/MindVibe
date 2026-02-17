'use client'

/**
 * DivineAbhyaasVerse - The sacred teaching of Abhyaas (Practice) from Bhagavad Gita
 *
 * Krishna's emphasis on practice (abhyaas) as the path to mastering the mind.
 * Primary verse: Chapter 6, Verse 35
 * Supporting verse: Chapter 12, Verse 9
 *
 * "The mind is restless and difficult to control. But through practice
 * and detachment, it can be mastered." — Shri Krishna
 */

import { motion, useReducedMotion } from 'framer-motion'
import { springConfigs } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

export function DivineAbhyaasVerse() {
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <motion.section
      className="relative mx-auto max-w-4xl overflow-hidden"
      initial={reduceMotion ? undefined : { opacity: 0, y: 40 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      aria-label="The Teaching of Abhyaas - Practice"
    >
      {/* Sacred container */}
      <div className="divine-verse-container relative rounded-3xl border border-[#d4a44c]/15 p-6 sm:p-8 md:p-12">
        {/* Inner glow */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-[#d4a44c]/[0.04] via-transparent to-[#1e3a8a]/[0.03]" />

        {/* Decorative corner flourishes */}
        <div className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l border-t border-[#d4a44c]/20 rounded-tl-lg" />
        <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r border-t border-[#d4a44c]/20 rounded-tr-lg" />
        <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b border-l border-[#d4a44c]/20 rounded-bl-lg" />
        <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b border-r border-[#d4a44c]/20 rounded-br-lg" />

        {/* Chapter marker */}
        <motion.div
          className="mb-6 flex items-center justify-center gap-3"
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, ...springConfigs.smooth }}
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4a44c]/40" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4a44c]/70">
            {t('home.abhyaas.chapter', 'Bhagavad Gita 6.35')}
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4a44c]/40" />
        </motion.div>

        {/* Sanskrit verse */}
        <motion.div
          className="mb-6 text-center"
          initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="font-sacred text-xl leading-relaxed tracking-wide text-[#f0c96d]/90 sm:text-2xl md:text-3xl"
            lang="sa"
          >
            अभ्यासेन तु कौन्तेय
          </p>
          <p
            className="font-sacred text-xl leading-relaxed tracking-wide text-[#f0c96d]/90 sm:text-2xl md:text-3xl"
            lang="sa"
          >
            वैराग्येण च गृह्यते
          </p>
        </motion.div>

        {/* Transliteration */}
        <motion.p
          className="mb-6 text-center font-sacred text-sm italic tracking-wider text-slate-300/60 sm:text-base"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          abhyaasena tu kaunteya vairaagyena cha grihyate
        </motion.p>

        {/* Divider */}
        <div className="mx-auto mb-6 flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4a44c]/30" />
          <motion.span
            className="block h-1.5 w-1.5 rounded-full bg-[#d4a44c]/50"
            animate={reduceMotion ? undefined : { scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4a44c]/30" />
        </div>

        {/* Translation / meaning */}
        <motion.blockquote
          className="mb-8 text-center"
          initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-200/85 sm:text-lg md:text-xl">
            {t(
              'home.abhyaas.translation',
              '"The mind is indeed restless and difficult to restrain, O son of Kunti. But through practice and detachment, it can be mastered."'
            )}
          </p>
          <footer className="mt-4">
            <cite className="text-sm font-medium not-italic text-[#d4a44c]/60">
              {t('home.abhyaas.speaker', '— Shri Krishna to Arjuna')}
            </cite>
          </footer>
        </motion.blockquote>

        {/* The Teaching of Abhyaas */}
        <motion.div
          className="space-y-4 text-center"
          initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="text-lg font-semibold tracking-wide text-slate-100/90 sm:text-xl">
            {t('home.abhyaas.title', 'The Power of Abhyaas (Practice)')}
          </h3>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300/70 sm:text-base">
            {t(
              'home.abhyaas.teaching',
              'Krishna teaches that the restless mind — always wandering, always distracted — is not your enemy. It is simply untrained. Through Abhyaas, the devoted and consistent practice of turning inward, the mind becomes your greatest ally. Not through force, but through gentle, persistent return to stillness.'
            )}
          </p>
        </motion.div>

        {/* Supporting verse */}
        <motion.div
          className="mt-8 rounded-2xl border border-[#1e3a8a]/20 bg-[#1e3a8a]/[0.06] p-4 sm:p-6"
          initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#6ad7ff]/50">
            {t('home.abhyaas.supporting', 'Bhagavad Gita 12.9')}
          </p>
          <p className="text-center font-sacred text-base italic leading-relaxed text-slate-300/70 sm:text-lg">
            {t(
              'home.abhyaas.verse2',
              '"If you cannot fix your mind steadily upon Me, then seek to reach Me by the yoga of constant practice."'
            )}
          </p>
          <p className="mt-2 text-center text-xs text-[#6ad7ff]/40">
            {t('home.abhyaas.verse2speaker', '— Shri Krishna to Arjuna')}
          </p>
        </motion.div>

        {/* Call to practice */}
        <motion.div
          className="mt-8 text-center"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <p className="text-sm italic text-[#d4a44c]/50">
            {t(
              'home.abhyaas.invitation',
              'Your journey of practice begins with a single breath. KIAAN walks beside you.'
            )}
          </p>
        </motion.div>
      </div>
    </motion.section>
  )
}
