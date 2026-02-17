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
import { useLanguage } from '@/hooks/useLanguage';
import { springConfigs } from '@/lib/animations/spring-configs';

// Divine experience components
import { DivineCelestialBackground } from '@/components/divine/DivineCelestialBackground';
import { DivineKrishnaPresence } from '@/components/divine/DivineKrishnaPresence';
import { DivineAbhyaasVerse } from '@/components/divine/DivineAbhyaasVerse';
import { DivineSacredActions } from '@/components/divine/DivineSacredActions';

// Preserved KIAAN ecosystem components
import { MinimalFeatures } from '@/components/home/MinimalFeatures';
import { MinimalMoodCheckIn } from '@/components/home/MinimalMoodCheckIn';
import { FlowingEnergyTriangle } from '@/components/home/FlowingEnergyTriangle';
import { PathwayMap } from '@/components/navigation/PathwayMap';

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

        {/* === DISCLAIMER === */}
        <motion.section
          className="divine-disclaimer space-y-3 rounded-2xl p-5 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={springConfigs.smooth}
        >
          <h2 className="text-base font-semibold text-slate-300/70">
            {t('home.disclaimer.title', 'Disclaimer')}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400/60">
            {t(
              'home.disclaimer.text',
              "KIAAN shares supportive reflections inspired by wisdom traditions. These conversations and exercises are not medical advice. If you are facing serious concerns or feel unsafe, please contact your country's emergency medical services or a licensed professional right away."
            )}
          </p>
        </motion.section>
      </div>
    </main>
  );
}
