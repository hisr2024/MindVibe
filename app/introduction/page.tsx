'use client'

import { useState, useCallback } from 'react'
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
  NamasteIcon,
} from '@/components/divine'
import { DivineConsciousnessProvider } from '@/contexts/DivineConsciousnessContext'
import { useUISound } from '@/hooks/useUISound'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'
import { Home, BookOpen, RefreshCw, Leaf, Shield, Heart, Sun, Compass } from 'lucide-react'

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
  const [hasSeenDarshan, setHasSeenDarshan] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const today = new Date().toDateString()
      const lastDarshanDate = localStorage.getItem('lastDarshanDate')
      return lastDarshanDate === today
    } catch {
      return false
    }
  })
  // Language hook for translations
  const { t } = useLanguage()

  // Audio hook for sound effects
  const { playSound } = useUISound()

  // Memoized handlers to prevent recreation
  const completeDarshan = useCallback(() => {
    setShowMorningDarshan(false)
    setHasSeenDarshan(true)
    try {
      localStorage.setItem('lastDarshanDate', new Date().toDateString())
    } catch {
      // localStorage unavailable
    }
  }, [])

  const openProtectionShield = useCallback(() => {
    setShowProtectionShield(true)
  }, [])
  const closeProtectionShield = useCallback(() => {
    setShowProtectionShield(false)
    playSound('close')
  }, [playSound])
  const openHeartJournal = useCallback(() => {
    setShowHeartJournal(true)
    playSound('open')
  }, [playSound])
  const closeHeartJournal = useCallback(() => {
    setShowHeartJournal(false)
    playSound('close')
  }, [playSound])
  const openMorningDarshan = useCallback(() => {
    setShowMorningDarshan(true)
  }, [])

  return (
    <DivineConsciousnessProvider>
      <SakhaModeProvider>
        {/* ==================== MODALS (Outside main for proper fixed positioning) ==================== */}

        {/* Morning Darshan Modal - Full screen on mobile */}
        <AnimatePresence mode="wait">
          {showMorningDarshan && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={completeDarshan}
              onKeyDown={(e) => { if (e.key === 'Escape') completeDarshan() }}
              role="dialog"
              aria-modal="true"
              aria-label="Morning Darshan"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-2xl"
                onClick={(e) => e.stopPropagation()}
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

        {/* Main Container - Responsive padding with CSS containment to prevent layout thrashing */}
        <main
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-28 sm:pb-20 md:pb-10"
          style={{ contain: 'layout style', touchAction: 'manipulation' }}
        >
          {/* ==================== HERO SECTION ==================== */}

          <motion.section
            className="text-center py-6 sm:py-8 md:py-10 lg:py-12"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Professionally Polished Namaste Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <NamasteIcon size="xl" animated={true} showGlow={true} />
            </div>

            {/* Title - Responsive typography with gold gradient */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 px-2"
              style={{
                background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 40%, #f0c96d 70%, #d4a44c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('home.introduction.heroTitle', 'Welcome to MindVibe')}
            </h1>

            {/* Subtitle */}
            <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 leading-relaxed">
              {t('home.introduction.heroSubtitle', 'Experience the loving guidance of Krishna. You are never alone on this journey.')}
            </p>

            {/* Morning Darshan Button - Mobile friendly */}
            {hasSeenDarshan && (
              <motion.button
                onClick={openMorningDarshan}
                className="mt-5 sm:mt-6 inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#d4a44c]/10 hover:bg-[#d4a44c]/15 active:bg-[#d4a44c]/20 border border-[#d4a44c]/30 rounded-full text-[#e8b54a] text-sm sm:text-base transition-all active:scale-95"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{ transform: 'translateZ(0)' }}
              >
                <Sun className="w-4 h-4 text-[#d4a44c]" />
                <span>{t('home.introduction.receiveDarshan', "Receive Krishna's Darshan")}</span>
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
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#1a1408] to-[#0f0c06] border border-[#d4a44c]/25 rounded-2xl hover:border-[#d4a44c]/45 transition-all active:scale-[0.98] group"
              >
                <motion.div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 50%, #f0c96d 100%)' }}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(212, 164, 76, 0.3)',
                      '0 0 35px rgba(212, 164, 76, 0.5)',
                      '0 0 20px rgba(212, 164, 76, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xl sm:text-2xl font-bold text-[#0a0a0f]">K</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#f0c96d] font-semibold text-base sm:text-lg">{t('home.introduction.talkToKiaan', 'Talk to KIAAN')}</h3>
                  <p className="text-[#d4a44c]/70 text-xs sm:text-sm truncate">{t('home.introduction.divineWisdom', 'Divine wisdom & guidance')}</p>
                </div>
                <div className="text-[#d4a44c]/50 group-hover:text-[#d4a44c]/80 transition-colors flex-shrink-0">
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
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#1a1408] to-[#0f0c06] border border-[#d4a44c]/20 rounded-2xl hover:border-[#d4a44c]/40 transition-all active:scale-[0.98] group text-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
                style={{ transform: 'translateZ(0)' }}
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-[#d4a44c]/15 flex items-center justify-center animate-spin-slow"
                  style={{ animationDuration: '12s' }}
                >
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-[#d4a44c]" />
                </div>
                <div className="w-full">
                  <h3 className="text-[#f0c96d] font-semibold text-sm sm:text-base md:text-lg">{t('home.introduction.protectionShield', 'Divine Protection Shield')}</h3>
                  <p className="text-[#d4a44c]/60 text-xs sm:text-sm mt-1">{t('home.introduction.activateProtection', "Activate Krishna's protection")}</p>
                </div>
              </motion.button>

              {/* RIGHT BRICK - Heart-to-Heart with Krishna */}
              <motion.button
                onClick={openHeartJournal}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#140a10] to-[#0f0608] border border-[#d4a44c]/15 rounded-2xl hover:border-[#d4a44c]/35 transition-all active:scale-[0.98] group text-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
                style={{ transform: 'translateZ(0)' }}
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-rose-500/15 flex items-center justify-center divine-heartbeat"
                >
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-rose-300/80" />
                </div>
                <div className="w-full">
                  <h3 className="text-rose-100/90 font-semibold text-sm sm:text-base md:text-lg">{t('home.introduction.heartToHeart', 'Heart-to-Heart with Krishna')}</h3>
                  <p className="text-rose-200/50 text-xs sm:text-sm mt-1">{t('home.introduction.writeLetter', 'Write a letter to the Divine')}</p>
                </div>
              </motion.button>

            </div>
          </section>

          {/* ==================== MOOD CHECK-IN SECTION ==================== */}

          <section className="mb-6 sm:mb-8">
            <motion.div
              className="bg-gradient-to-br from-[#0c0a06] to-[#080808] border border-[#d4a44c]/12 rounded-2xl p-5 sm:p-6 md:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-[#d4a44c]/70" />
                <div className="text-center">
                  <h3 className="text-white/85 font-medium text-base sm:text-lg">{t('home.introduction.howIsHeart', 'How is your heart?')}</h3>
                  <p className="text-white/50 text-xs sm:text-sm">{t('home.introduction.shareFeelings', 'Share your feelings with Krishna')}</p>
                </div>
              </div>
              <DivineMoodCheckIn compact={true} />
            </motion.div>
          </section>

          {/* ==================== MAIN FEATURES GRID ==================== */}

          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">

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
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#0c0a06] to-[#080808] border border-[#d4a44c]/15 rounded-2xl hover:border-[#d4a44c]/35 transition-all active:scale-[0.98] group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#d4a44c]/10 flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 sm:w-7 sm:h-7 text-[#d4a44c]/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white/85 font-semibold text-base sm:text-lg">{t('home.introduction.goToDashboard', 'Go to Dashboard')}</h3>
                      <p className="text-white/50 text-xs sm:text-sm">{t('home.introduction.accessTools', 'Access all tools & features')}</p>
                    </div>
                    <div className="text-[#d4a44c]/40 group-hover:text-[#d4a44c]/70 transition-colors flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>

                {/* Quick Divine Access Grid */}
                <motion.div
                  className="bg-gradient-to-br from-[#0c0a06] to-[#080808] border border-[#d4a44c]/10 rounded-2xl p-4 sm:p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <h3 className="text-white/80 font-medium text-sm sm:text-base mb-3 sm:mb-4">{t('home.introduction.quickAccess', 'Quick Divine Access')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <Link
                      href="/journeys"
                      className="flex flex-col items-center p-2 sm:p-3 bg-[#d4a44c]/5 hover:bg-[#d4a44c]/10 active:bg-[#d4a44c]/15 border border-[#d4a44c]/10 rounded-xl transition-all min-h-[72px] sm:min-h-[80px]"
                    >
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a44c]/70 mb-1" />
                      <span className="text-white/70 text-xs text-center leading-tight">{t('home.introduction.journeys', 'Journeys')}</span>
                    </Link>
                    <Link
                      href="/flows/journal"
                      className="flex flex-col items-center p-2 sm:p-3 bg-[#d4a44c]/5 hover:bg-[#d4a44c]/10 active:bg-[#d4a44c]/15 border border-[#d4a44c]/10 rounded-xl transition-all min-h-[72px] sm:min-h-[80px]"
                    >
                      <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a44c]/70 mb-1" />
                      <span className="text-white/70 text-xs text-center leading-tight">{t('home.introduction.journal', 'Journal')}</span>
                    </Link>
                    <Link
                      href="/tools/ardha"
                      className="flex flex-col items-center p-2 sm:p-3 bg-[#d4a44c]/5 hover:bg-[#d4a44c]/10 active:bg-[#d4a44c]/15 border border-[#d4a44c]/10 rounded-xl transition-all min-h-[72px] sm:min-h-[80px]"
                    >
                      <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a44c]/70 mb-1" />
                      <span className="text-white/70 text-xs text-center leading-tight">{t('home.introduction.reframe', 'Reframe')}</span>
                    </Link>
                    <Link
                      href="/tools/viyog"
                      className="flex flex-col items-center p-2 sm:p-3 bg-[#d4a44c]/5 hover:bg-[#d4a44c]/10 active:bg-[#d4a44c]/15 border border-[#d4a44c]/10 rounded-xl transition-all min-h-[72px] sm:min-h-[80px]"
                    >
                      <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a44c]/70 mb-1" />
                      <span className="text-white/70 text-xs text-center leading-tight">{t('home.introduction.detach', 'Detach')}</span>
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
            <p className="text-white/50 text-xs sm:text-sm italic font-sacred max-w-md mx-auto px-4 leading-relaxed">
              {t('home.introduction.footerVerse', '"I am the Self seated in the hearts of all beings. I am the beginning, the middle, and the end."')}
            </p>
            <p className="text-[#d4a44c]/50 text-xs mt-2 font-medium">{t('home.introduction.footerVerseRef', '— Bhagavad Gita 10.20')}</p>
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
            autoShow={false}
            intervalMinutes={30}
          />
        </main>
      </SakhaModeProvider>
    </DivineConsciousnessProvider>
  )
}
