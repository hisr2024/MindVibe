'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DivineGreeting,
  KrishnaMorningDarshan,
  DivineCompanion,
  DivineProtectionShield,
  HeartToHeartJournal,
  KrishnaWhispers,
  SakhaModeCard,
  SakhaModeProvider,
  SacredDashboardWidget,
  DivineMoodCheckIn,
} from '@/components/divine'
import { DivineConsciousnessProvider } from '@/contexts/DivineConsciousnessContext'
import Link from 'next/link'

// Animation variants for consistent motion
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

// Memoized feature card to prevent re-renders
const FeatureCard = memo(({
  href,
  icon,
  iconAnimation,
  title,
  subtitle,
  gradient,
  borderColor,
  textColor,
  delay = 0,
  onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  iconAnimation?: Record<string, unknown>;
  title: string;
  subtitle: string;
  gradient: string;
  borderColor: string;
  textColor: string;
  delay?: number;
  onClick?: () => void;
}) => {
  const content = (
    <motion.div
      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 ${gradient} border ${borderColor} rounded-2xl hover:border-opacity-70 transition-all active:scale-[0.98] group w-full text-left`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      style={{ transform: 'translateZ(0)' }}
    >
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${gradient.replace('50', '30')} flex items-center justify-center flex-shrink-0`}
        style={iconAnimation}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`${textColor} font-semibold text-base sm:text-lg`}>{title}</h3>
        <p className={`${textColor.replace('100', '200')}/60 text-xs sm:text-sm truncate`}>{subtitle}</p>
      </div>
      <div className={`${textColor.replace('100', '300')}/50 group-hover:${textColor.replace('100', '300')} transition-colors flex-shrink-0`}>
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick} className="w-full">{content}</button>;
});
FeatureCard.displayName = 'FeatureCard';

/**
 * Introduction Page - Divine Krishna Features
 *
 * Fully responsive design for:
 * - Mobile (< 640px): Single column, stacked cards
 * - Tablet (640px - 1024px): Two column grid
 * - Desktop (> 1024px): Three column grid
 *
 * "Welcome to the divine presence. You are never alone."
 */
export default function IntroductionPage() {
  const [showMorningDarshan, setShowMorningDarshan] = useState(false)
  const [showProtectionShield, setShowProtectionShield] = useState(false)
  const [showHeartJournal, setShowHeartJournal] = useState(false)
  const [hasSeenDarshan, setHasSeenDarshan] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)

  // Check if user has seen today's darshan
  useEffect(() => {
    // Small delay to ensure smooth page load
    const readyTimer = setTimeout(() => setIsPageReady(true), 100);

    const today = new Date().toDateString()
    const lastDarshanDate = localStorage.getItem('lastDarshanDate')

    if (lastDarshanDate !== today) {
      const timer = setTimeout(() => {
        setShowMorningDarshan(true)
      }, 1800) // Slightly longer delay for smoother appearance
      return () => {
        clearTimeout(timer)
        clearTimeout(readyTimer)
      }
    } else {
      setHasSeenDarshan(true)
    }

    return () => clearTimeout(readyTimer)
  }, [])

  // Memoized handlers to prevent recreation
  const completeDarshan = useCallback(() => {
    setShowMorningDarshan(false)
    setHasSeenDarshan(true)
    localStorage.setItem('lastDarshanDate', new Date().toDateString())
  }, [])

  const openProtectionShield = useCallback(() => setShowProtectionShield(true), [])
  const closeProtectionShield = useCallback(() => setShowProtectionShield(false), [])
  const openHeartJournal = useCallback(() => setShowHeartJournal(true), [])
  const closeHeartJournal = useCallback(() => setShowHeartJournal(false), [])
  const openMorningDarshan = useCallback(() => setShowMorningDarshan(true), [])

  return (
    <DivineConsciousnessProvider>
      <SakhaModeProvider>
        {/* Main Container - Responsive padding */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 sm:pb-20 md:pb-16">

          {/* ==================== MODALS ==================== */}

          {/* Morning Darshan Modal - Full screen on mobile */}
          <AnimatePresence mode="wait">
            {showMorningDarshan && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
                >
                  <KrishnaMorningDarshan
                    onComplete={completeDarshan}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <DivineProtectionShield
            isOpen={showProtectionShield}
            onClose={closeProtectionShield}
          />

          <HeartToHeartJournal
            isOpen={showHeartJournal}
            onClose={closeHeartJournal}
          />

          {/* ==================== HERO SECTION ==================== */}

          <motion.section
            className="text-center py-6 sm:py-8 md:py-10 lg:py-12"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Animated Icon - Scales with screen, reduced animation intensity */}
            <div
              className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 divine-pulse"
              style={{ transform: 'translateZ(0)' }}
            >
              🙏
            </div>

            {/* Title - Responsive typography */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white/90 mb-2 sm:mb-3 px-2">
              Welcome to Divine Presence
            </h1>

            {/* Subtitle */}
            <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 leading-relaxed">
              Experience the loving guidance of Krishna. You are never alone on this journey.
            </p>

            {/* Morning Darshan Button - Mobile friendly */}
            {hasSeenDarshan && (
              <motion.button
                onClick={openMorningDarshan}
                className="mt-5 sm:mt-6 inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 active:from-amber-500/40 active:to-orange-500/40 border border-amber-500/30 rounded-full text-amber-200 text-sm sm:text-base transition-all active:scale-95"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ transform: 'translateZ(0)' }}
              >
                <span>🌅</span>
                <span>Receive Krishna's Darshan</span>
              </motion.button>
            )}
          </motion.section>

          {/* ==================== DIVINE GREETING ==================== */}

          <motion.section
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DivineGreeting
              showAffirmation={true}
              showReminder={true}
              className="py-4 sm:py-6"
            />
          </motion.section>

          {/* ==================== PRIMARY ACTION - Talk to KIAAN ==================== */}

          <section className="mb-6 sm:mb-8">
            {/* Talk to KIAAN - Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/kiaan"
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-orange-900/50 to-amber-900/50 border border-orange-500/30 rounded-2xl hover:border-orange-500/50 transition-all active:scale-[0.98] group"
              >
                <motion.div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(251, 146, 60, 0.3)',
                      '0 0 35px rgba(251, 146, 60, 0.5)',
                      '0 0 20px rgba(251, 146, 60, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">K</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-orange-100 font-semibold text-base sm:text-lg">Talk to KIAAN</h3>
                  <p className="text-orange-200/60 text-xs sm:text-sm truncate">Divine wisdom & guidance</p>
                </div>
                <div className="text-orange-300/50 group-hover:text-orange-300 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          </section>

          {/* ==================== SYMMETRIC DIVINE FEATURES ==================== */}
          {/* Divine Protection Shield (Left) & Heart-to-Heart with Krishna (Right) */}

          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">

              {/* LEFT BRICK - Divine Protection Shield */}
              <motion.button
                onClick={openProtectionShield}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-500/30 rounded-2xl hover:border-amber-500/50 transition-all active:scale-[0.98] group text-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
                style={{ transform: 'translateZ(0)' }}
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center animate-spin-slow"
                  style={{ animationDuration: '12s' }}
                >
                  <span className="text-3xl sm:text-4xl">☸️</span>
                </div>
                <div className="w-full">
                  <h3 className="text-amber-100 font-semibold text-sm sm:text-base md:text-lg">Divine Protection Shield</h3>
                  <p className="text-amber-200/60 text-xs sm:text-sm mt-1">Activate Krishna's protection</p>
                </div>
              </motion.button>

              {/* RIGHT BRICK - Heart-to-Heart with Krishna */}
              <motion.button
                onClick={openHeartJournal}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-pink-900/50 to-rose-900/50 border border-pink-500/30 rounded-2xl hover:border-pink-500/50 transition-all active:scale-[0.98] group text-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
                style={{ transform: 'translateZ(0)' }}
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-pink-400/30 to-rose-500/30 flex items-center justify-center divine-heartbeat"
                >
                  <span className="text-3xl sm:text-4xl">💙</span>
                </div>
                <div className="w-full">
                  <h3 className="text-pink-100 font-semibold text-sm sm:text-base md:text-lg">Heart-to-Heart with Krishna</h3>
                  <p className="text-pink-200/60 text-xs sm:text-sm mt-1">Write a letter to the Divine</p>
                </div>
              </motion.button>

            </div>
          </section>

          {/* ==================== MAIN FEATURES GRID ==================== */}

          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">

              {/* Column 1: Sacred Space & Mood */}
              <div className="space-y-4 sm:space-y-5">
                {/* Sacred Dashboard Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <SacredDashboardWidget
                    showBreathing={true}
                    showMoments={true}
                    showReminder={true}
                  />
                </motion.div>

                {/* Divine Mood Check-In */}
                <motion.div
                  className="bg-gradient-to-br from-slate-900/80 to-indigo-900/50 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 md:p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">💙</span>
                    <div>
                      <h3 className="text-white/90 font-medium text-sm sm:text-base">How is your heart?</h3>
                      <p className="text-white/50 text-xs">Share your feelings with Krishna</p>
                    </div>
                  </div>
                  <DivineMoodCheckIn compact={true} />
                </motion.div>
              </div>

              {/* Column 2: Sakha Mode */}
              <div className="space-y-4 sm:space-y-5">
                {/* Sakha Mode Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <SakhaModeCard />
                </motion.div>
              </div>

              {/* Column 3: Navigation & Quick Access */}
              <div className="space-y-4 sm:space-y-5 md:col-span-2 lg:col-span-1">
                {/* Go to Dashboard */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl hover:border-indigo-500/50 transition-all active:scale-[0.98] group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl sm:text-3xl">🏠</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-indigo-100 font-semibold text-base sm:text-lg">Go to Dashboard</h3>
                      <p className="text-indigo-200/60 text-xs sm:text-sm">Access all tools & features</p>
                    </div>
                    <div className="text-indigo-300/50 group-hover:text-indigo-300 transition-colors flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>

                {/* Quick Divine Access Grid */}
                <motion.div
                  className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-4 sm:p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <h3 className="text-white/90 font-medium text-sm sm:text-base mb-3 sm:mb-4">Quick Divine Access</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
                    <Link
                      href="/wisdom-journey"
                      className="flex flex-col items-center p-2 sm:p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl transition-all min-h-[60px] sm:min-h-[72px]"
                    >
                      <span className="text-xl sm:text-2xl mb-1">📖</span>
                      <span className="text-white/70 text-[10px] sm:text-xs text-center leading-tight">Gita</span>
                    </Link>
                    <Link
                      href="/flows/journal"
                      className="flex flex-col items-center p-2 sm:p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl transition-all min-h-[60px] sm:min-h-[72px]"
                    >
                      <span className="text-xl sm:text-2xl mb-1">📝</span>
                      <span className="text-white/70 text-[10px] sm:text-xs text-center leading-tight">Journal</span>
                    </Link>
                    <Link
                      href="/ardha"
                      className="flex flex-col items-center p-2 sm:p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl transition-all min-h-[60px] sm:min-h-[72px]"
                    >
                      <span className="text-xl sm:text-2xl mb-1">🔄</span>
                      <span className="text-white/70 text-[10px] sm:text-xs text-center leading-tight">Reframe</span>
                    </Link>
                    <Link
                      href="/viyog"
                      className="flex flex-col items-center p-2 sm:p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl transition-all min-h-[60px] sm:min-h-[72px]"
                    >
                      <span className="text-xl sm:text-2xl mb-1">🧘</span>
                      <span className="text-white/70 text-[10px] sm:text-xs text-center leading-tight">Detach</span>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ==================== FOOTER MESSAGE ==================== */}

          <motion.section
            className="text-center py-6 sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-white/40 text-xs sm:text-sm italic max-w-md mx-auto px-4">
              "I am the Self seated in the hearts of all beings. I am the beginning, the middle, and the end."
            </p>
            <p className="text-amber-400/50 text-xs mt-2">— Bhagavad Gita 10.20</p>
          </motion.section>

          {/* ==================== FLOATING ELEMENTS ==================== */}

          {/* Divine Companion - Adjusted position for mobile */}
          <DivineCompanion
            position="bottom-right"
            size="md"
          />

          {/* Krishna's Whispers */}
          <KrishnaWhispers
            position="top-right"
            autoShow={true}
            intervalMinutes={30}
          />
        </main>
      </SakhaModeProvider>
    </DivineConsciousnessProvider>
  )
}
