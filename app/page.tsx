'use client';

/**
 * MindVibe Divine Home Page
 *
 * An immersive divine experience — entering the world of Krishna,
 * the Divine Friend and Spiritual Companion.
 *
 * Flow:
 * 1. DivineKrishnaPresence — Krishna's welcome (OM + "Welcome, Dear Friend")
 * 2. Krishna's Eternal Presence — He is always around us, guiding
 * 3. DivineAbhyaasVerse — The teaching of Practice (Gita 6.35)
 * 4. Sacred Actions — Quick access to KIAAN tools
 * 5. Pathway Map — Healing journey steps
 * 6. Closing verse + Disclaimer
 */

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/hooks/useLanguage';
import { springConfigs } from '@/lib/animations/spring-configs';

// Preserved non-animated component
import { PathwayMap } from '@/components/navigation/PathwayMap';

// Dynamic imports for framer-motion components to reduce initial bundle size
const DivineCelestialBackground = dynamic(() => import('@/components/divine/DivineCelestialBackground').then(mod => mod.DivineCelestialBackground), { ssr: false });
const DivineKrishnaPresence = dynamic(() => import('@/components/divine/DivineKrishnaPresence').then(mod => mod.DivineKrishnaPresence), { ssr: false });
const DivineAbhyaasVerse = dynamic(() => import('@/components/divine/DivineAbhyaasVerse').then(mod => mod.DivineAbhyaasVerse), { ssr: false });
const DivineSacredActions = dynamic(() => import('@/components/divine/DivineSacredActions').then(mod => mod.DivineSacredActions), { ssr: false });

export default function Home() {
  const { t, isInitialized } = useLanguage();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springConfigs.smooth}
        >
          <motion.div
            className="h-12 w-12 rounded-full border-4 border-[#d4a44c] border-t-transparent mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-[#d4a44c]/80 text-sm tracking-wide">
            {t('common.loading', 'Entering the sacred space...')}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Immersive celestial background — fixed, full-screen */}
      <DivineCelestialBackground />

      {/* Content layer — above the celestial backdrop */}
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 sm:space-y-12 pb-36 md:pb-16 px-4 sm:px-6">

        {/* === DIVINE ENTRY: Krishna's Presence (Image 4 — stays as is) === */}
        <DivineKrishnaPresence />

        {/* === KRISHNA'S ETERNAL PRESENCE: He is always around us === */}
        <motion.section
          className="relative mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Soft divine glow behind this section */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(212,164,76,0.06)_0%,transparent_70%)]" />

          <div className="relative space-y-5 py-6">
            {/* Ornamental line */}
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d4a44c]/30" />
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-[#d4a44c]/50"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d4a44c]/30" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              {t(
                'home.presence.title',
                'Krishna Is Always With You'
              )}
            </h2>

            <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {t(
                'home.presence.description',
                'In every breath, in every moment of stillness and struggle — the Divine walks beside you. Krishna is not a distant deity; He is the closest friend within your own heart. He whispers through your conscience, guides through your intuition, and waits patiently for you to turn inward.'
              )}
            </p>

            <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">
              {t(
                'home.presence.teaching',
                'The Bhagavad Gita teaches us that through Abhyaas — devoted, consistent practice — we can still the restless mind and realize this Divine Presence that has always been with us. Not through force, but through gentle, loving return to the Self.'
              )}
            </p>

            {/* Sacred verse about presence */}
            <motion.div
              className="mx-auto max-w-md pt-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <p className="font-sacred text-sm italic leading-relaxed text-[#d4a44c]/60 sm:text-base">
                {t(
                  'home.presence.verse',
                  '"I am seated in the hearts of all beings. From Me come memory, knowledge, and their loss."'
                )}
              </p>
              <p className="mt-1 text-xs text-[#d4a44c]/40">
                — {t('home.presence.verseRef', 'Bhagavad Gita 15.15')}
              </p>
            </motion.div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
              <a
                href="/introduction"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-semibold rounded-full hover:from-orange-400 hover:to-amber-400 transition-all text-sm sm:text-base shadow-lg shadow-orange-500/20"
              >
                {t('home.value.cta', 'Begin Your Journey')}
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#d4a44c]/30 text-[#d4a44c]/90 rounded-full hover:border-[#d4a44c]/60 transition-all text-sm"
              >
                {t('home.value.pricing', 'View Plans — Free to Start')}
              </a>
            </div>
          </div>
        </motion.section>

        {/* === ABHYAAS TEACHING: The core Gita message on Practice (Image 1) === */}
        <DivineAbhyaasVerse />

        {/* === SACRED ACTIONS: Quick access to KIAAN tools === */}
        <DivineSacredActions />

        {/* === PATHWAY MAP: Healing journey steps === */}
        <PathwayMap />

        {/* === CLOSING VERSE: Daily reminder === */}
        <motion.section
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-3 py-6">
            <p className="font-sacred text-base italic text-[#d4a44c]/70 sm:text-lg">
              {t(
                'home.closing.verse',
                '"Whenever the mind wanders — restless and unsteady — bring it back, again and again, to rest in the Self."'
              )}
            </p>
            <p className="text-xs text-[#d4a44c]/50">
              — {t('home.closing.ref', 'Bhagavad Gita 6.26')}
            </p>
          </div>
        </motion.section>

        {/* === A NOTE FROM KIAAN === */}
        <motion.section
          className="divine-disclaimer space-y-3 rounded-2xl p-5 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={springConfigs.smooth}
        >
          <h2 className="text-base font-semibold text-[#d4a44c]/80">
            {t('home.disclaimer.title', 'A Note from Your Divine Friend')}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400/80">
            {t(
              'home.disclaimer.text',
              "KIAAN walks beside you as a spiritual companion, sharing reflections rooted in the Bhagavad Gita and timeless wisdom traditions. This is a space for inner peace, self-discovery, and divine friendship — not a substitute for professional care. For matters beyond the spirit, always seek guidance from qualified professionals."
            )}
          </p>
        </motion.section>
      </div>
    </main>
  );
}
