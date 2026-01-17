'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { KiaanLogo } from '@/src/components/KiaanLogo';
import { InnerPeaceLogo } from '@/components/branding';
import { MinimalFeatures } from '@/components/home/MinimalFeatures';
import { MinimalMoodCheckIn } from '@/components/home/MinimalMoodCheckIn';
import { FlowingEnergyTriangle } from '@/components/home/FlowingEnergyTriangle';
import { MinimalLanguageSelector } from '@/components/MinimalLanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';
import { springConfigs, animationVariants } from '@/lib/animations/spring-configs';

/**
 * Redesigned Home Page
 * - Minimal authentic introduction
 * - Minimal 3 feature cards
 * - Colored stone mood check-in
 * - KIAAN Chat moved to /kiaan/chat
 * - Flowing energy triangle
 * - Enhanced with smooth animations
 */
export default function Home() {
  const { t, isInitialized } = useLanguage();

  // Show loading state while translations load
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
            className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-orange-100">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden p-4 pb-28 md:p-8">
      {/* Language Selector - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <MinimalLanguageSelector />
      </div>

      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div 
          className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-orange-600/25 via-[#ff9933]/14 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.25, 0.35, 0.25],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-orange-500/10 to-transparent blur-[120px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.18, 0.28, 0.18],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <div className="absolute left-1/4 top-1/3 h-56 w-56 animate-pulse rounded-full bg-gradient-to-br from-[#1f2937]/70 via-[#ff9933]/10 to-transparent blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8">
        {/* Hero Header */}
        <motion.header 
          className="relative overflow-hidden rounded-3xl border border-orange-500/10 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfigs.smooth}
        >
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/40 via-[#ffb347]/30 to-transparent blur-2xl" />
          <div className="absolute bottom-4 left-4 h-32 w-32 rounded-full bg-gradient-to-tr from-sky-400/20 via-emerald-300/12 to-transparent blur-3xl" />
          
          <div className="relative flex flex-col items-center justify-center space-y-4 text-center">
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, ...springConfigs.smooth }}
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={springConfigs.bouncy}
              >
                <KiaanLogo size="lg" className="drop-shadow-[0_12px_55px_rgba(46,160,255,0.25)]" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={springConfigs.bouncy}
              >
                <InnerPeaceLogo size={100} className="drop-shadow-[0_12px_55px_rgba(139,92,246,0.25)]" />
              </motion.div>
            </motion.div>
            <motion.p 
              className="mx-auto max-w-xl text-sm text-orange-100/80 sm:text-base"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...springConfigs.smooth }}
            >
              {t('home.hero.tagline', 'Your calm, privacy-first mental wellness companion powered by ancient wisdom')}
            </motion.p>
            
            {/* Quick Actions */}
            <motion.div 
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...springConfigs.smooth }}
            >
              <Link href="/kiaan/chat">
                <motion.div
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 "
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(251, 146, 60, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={springConfigs.snappy}
                >
                  {t('home.hero.ctaPrimary', 'Talk to KIAAN')}
                  <motion.span 
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </Link>
              <Link href="/sacred-reflections">
                <motion.div
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-white/5 px-5 py-3 text-sm font-semibold text-orange-50 "
                  whileHover={{ 
                    scale: 1.05, 
                    borderColor: 'rgba(251, 146, 60, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={springConfigs.snappy}
                >
                  {t('home.hero.ctaSecondary', 'Sacred Reflections')}
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.header>

        {/* Privacy Notice */}
        <motion.div 
          className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center shadow-[0_10px_50px_rgba(255,115,39,0.18)] backdrop-blur"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, ...springConfigs.smooth }}
        >
          <p className="text-sm text-orange-100/90">
            {t('home.hero.privacy', '🔒 Conversations remain private • a warm, confidential refuge')}
          </p>
        </motion.div>

        {/* Minimalistic Introduction */}
        <motion.section 
          className="space-y-6 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-8 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={springConfigs.smooth}
        >
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-light text-orange-50 md:text-3xl">
              {t('common.app.name', 'Welcome to MindVibe')}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-orange-100/80">
              Your journey to mental wellness, guided by ancient wisdom and modern understanding
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/kiaan/chat">
              <motion.div
                className="interactive-link group rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10 px-6 py-3 text-sm font-semibold text-orange-50 "
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(251, 146, 60, 0.5)',
                  boxShadow: '0 20px 40px rgba(251, 146, 60, 0.3)'
                }}
                whileTap={{ scale: 0.95 }}
                transition={springConfigs.snappy}
              >
                <span className="flex items-center gap-2">
                  Start Chat
                  <motion.span 
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.div>
            </Link>
            <Link href="/dashboard">
              <motion.div
                className="interactive-link group rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 px-6 py-3 text-sm font-semibold text-teal-50 "
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(45, 212, 191, 0.5)',
                  boxShadow: '0 20px 40px rgba(45, 212, 191, 0.3)'
                }}
                whileTap={{ scale: 0.95 }}
                transition={springConfigs.snappy}
              >
              <span className="flex items-center gap-2">
                Explore Tools
                <motion.span 
                  aria-hidden
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </span>
            </motion.div>
            </Link>
            <Link href="/sacred-reflections">
              <motion.div
                className="interactive-link group rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 px-6 py-3 text-sm font-semibold text-blue-50 "
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(96, 165, 250, 0.5)',
                  boxShadow: '0 20px 40px rgba(96, 165, 250, 0.3)'
                }}
                whileTap={{ scale: 0.95 }}
                transition={springConfigs.snappy}
              >
                <span className="flex items-center gap-2">
                  Learn More
                  <motion.span 
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.div>
            </Link>
          </div>
        </motion.section>

        {/* Minimal Features */}
        <MinimalFeatures />

        {/* Mood Check-In */}
        <MinimalMoodCheckIn />

        {/* Quick Access Cards */}
        <motion.section 
          className="grid gap-3 md:grid-cols-3" 
          aria-label="Core daily actions"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div
            variants={animationVariants.slideUp}
          >
            <Link href="/kiaan/chat">
              <motion.div
                className="rounded-2xl border border-orange-500/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(255,147,71,0.16)] "
                whileHover={{ 
                  y: -4,
                  borderColor: 'rgba(251, 146, 60, 0.4)',
                  boxShadow: '0 20px 80px rgba(255,147,71,0.24)',
                  transition: springConfigs.snappy
                }}
              >
                <p className="text-xs text-orange-100/70">{t('home.quickAccess.kiaan.title', 'Talk to KIAAN')}</p>
                <h2 className="text-lg font-semibold text-orange-50">{t('home.quickAccess.kiaan.subtitle', 'Instant guidance')}</h2>
                <p className="mt-1 text-sm text-orange-100/80">
                  {t('home.quickAccess.kiaan.description', 'Jump into a focused conversation for mental wellness support')}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
                  {t('home.quickAccess.kiaan.cta', 'Open Chat')}
                  <motion.span 
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            variants={animationVariants.slideUp}
          >
            <Link href="/dashboard">
              <motion.div
                className="rounded-2xl border border-teal-400/15 bg-white/5 p-4 shadow-[0_14px_60px_rgba(34,197,235,0.12)] "
                whileHover={{ 
                  y: -4,
                  borderColor: 'rgba(45, 212, 191, 0.3)',
                  boxShadow: '0 20px 80px rgba(34,197,235,0.18)',
                  transition: springConfigs.snappy
                }}
              >
                <p className="text-xs text-white/60">{t('home.quickAccess.dashboard.title', 'Progress Tracking')}</p>
                <h2 className="text-lg font-semibold text-white">{t('home.quickAccess.dashboard.subtitle', 'Dashboard')}</h2>
                <p className="mt-1 text-sm text-white/70">
                  {t('home.quickAccess.dashboard.description', 'View insights from your mood check-ins and journal entries')}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-300">
                  {t('home.quickAccess.dashboard.cta', 'View Dashboard')}
                  <motion.span 
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            variants={animationVariants.slideUp}
          >
            <Link href="/emotional-reset">
              <motion.div
                className="rounded-2xl border border-amber-300/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(251,191,36,0.16)] "
                whileHover={{ 
                  y: -4,
                  borderColor: 'rgba(252, 211, 77, 0.4)',
                  boxShadow: '0 20px 80px rgba(251,191,36,0.24)',
                  transition: springConfigs.snappy
                }}
              >
                <p className="text-xs text-amber-100/80">{t('home.quickAccess.emotionalReset.title', 'Quick Reset')}</p>
                <h2 className="text-lg font-semibold text-amber-50">{t('home.quickAccess.emotionalReset.subtitle', 'Emotional Reset')}</h2>
                <p className="mt-1 text-sm text-amber-100/80">
                  {t('home.quickAccess.emotionalReset.description', 'Guided exercises to reset your emotional state instantly')}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                  {t('home.quickAccess.emotionalReset.cta', 'Try Reset')}
                  <motion.span 
                    aria-hidden
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </motion.section>

        {/* Disclaimer */}
        <motion.section 
          className="space-y-3 rounded-3xl border border-orange-500/15 bg-[#0b0b0f] p-5 shadow-[0_20px_80px_rgba(255,115,39,0.12)] md:p-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={springConfigs.smooth}
        >
          <h2 className="text-lg font-semibold text-orange-100">{t('home.disclaimer.title', 'Disclaimer')}</h2>
          <p className="text-sm leading-relaxed text-orange-100/80">
            {t('home.disclaimer.text', "KIAAN shares supportive reflections inspired by wisdom traditions. These conversations and exercises are not medical advice. If you are facing serious concerns or feel unsafe, please contact your country's emergency medical services or a licensed professional right away.")}
          </p>
        </motion.section>
      </div>
    </main>
  );
}
