'use client';

/**
 * Sakha Divine Home Page
 *
 * An immersive divine experience — entering the world of Krishna,
 * the Divine Friend and Spiritual Companion.
 *
 * Flow:
 * 1. DivineKrishnaPresence — Krishna's welcome (OM + "Welcome, Dear Friend")
 * 2. Closing verse + Disclaimer
 */

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/hooks/useLanguage';
import { springConfigs } from '@/lib/animations/spring-configs';

// Dynamic imports for framer-motion components to reduce initial bundle size.
// DivineCelestialBackground is now rendered globally from ClientLayout, so
// it is no longer imported here.
const DivineKrishnaPresence = dynamic(() => import('@/components/divine/DivineKrishnaPresence').then(mod => mod.DivineKrishnaPresence), { ssr: false });

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Content layer — the celestial backdrop is rendered by ClientLayout */}
      <div className="relative z-10 mx-auto max-w-6xl space-y-section-lg pb-24 md:pb-16 px-page-x">

        {/* === DIVINE ENTRY: Krishna's Presence === */}
        <DivineKrishnaPresence />

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
          <p className="text-body text-[var(--mv-text-secondary)] leading-relaxed">
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
