'use client';

/**
 * MindVibe Divine Home Page
 *
 * An immersive divine experience — entering the world of Krishna,
 * the Divine Friend and Spiritual Companion.
 *
 * Features:
 * - Celestial starfield background with sacred geometry
 * - Krishna's presence as the welcoming divine friend
 * - The teaching of Abhyaas (Practice) from Bhagavad Gita 6.35
 * - Sacred pathway navigation (preserved)
 * - Mood check-in with divine stones (preserved)
 * - Feature showcase and energy triangle (preserved)
 * - KIAAN ecosystem fully intact — no tools broken
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
const MinimalFeatures = dynamic(() => import('@/components/home/MinimalFeatures').then(mod => mod.MinimalFeatures), { ssr: false });
const MinimalMoodCheckIn = dynamic(() => import('@/components/home/MinimalMoodCheckIn').then(mod => mod.MinimalMoodCheckIn), { ssr: false });
const FlowingEnergyTriangle = dynamic(() => import('@/components/home/FlowingEnergyTriangle').then(mod => mod.FlowingEnergyTriangle), { ssr: false });

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
          <p className="text-[#d4a44c]/60 text-sm tracking-wide">
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

        {/* === DIVINE ENTRY: Krishna's Presence === */}
        <DivineKrishnaPresence />

        {/* === PATHWAY MAP: Healing journey steps === */}
        <PathwayMap />

        {/* === ABHYAAS TEACHING: The core Gita message on Practice === */}
        <DivineAbhyaasVerse />

        {/* === SACRED ACTIONS: Quick access to KIAAN tools === */}
        <DivineSacredActions />

        {/* === MOOD CHECK-IN: Colored divine stones === */}
        <MinimalMoodCheckIn />

        {/* === FEATURES: Voice, Offline, Reset === */}
        <MinimalFeatures />

        {/* === FLOWING ENERGY TRIANGLE: KIAAN modes === */}
        <FlowingEnergyTriangle />

        {/* === CLOSING VERSE: Daily reminder === */}
        <motion.section
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-3 py-6">
            <p className="font-sacred text-base italic text-[#d4a44c]/50 sm:text-lg">
              {t(
                'home.closing.verse',
                '"Whenever the mind wanders — restless and unsteady — bring it back, again and again, to rest in the Self."'
              )}
            </p>
            <p className="text-xs text-[#d4a44c]/30">
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
          <h2 className="text-base font-semibold text-[#d4a44c]/60">
            {t('home.disclaimer.title', 'A Note from Your Divine Friend')}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400/60">
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
