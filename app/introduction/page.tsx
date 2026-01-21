'use client'

import { useState, useEffect } from 'react'
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

/**
 * Introduction Page - Divine Krishna Features
 *
 * The first page users see - introducing them to Krishna's divine presence:
 * - Krishna's Morning Darshan (daily divine greeting)
 * - Divine Companion (always-present Krishna)
 * - Divine Protection Shield (Sudarshana Chakra)
 * - Heart-to-Heart Journal (prayer journal with Krishna)
 * - Krishna's Whispers (contextual notifications)
 * - Sakha Mode (Friend Krishna for KIAAN)
 *
 * "Welcome to the divine presence. You are never alone."
 */
export default function IntroductionPage() {
  const [showMorningDarshan, setShowMorningDarshan] = useState(false)
  const [showProtectionShield, setShowProtectionShield] = useState(false)
  const [showHeartJournal, setShowHeartJournal] = useState(false)
  const [hasSeenDarshan, setHasSeenDarshan] = useState(false)

  // Check if user has seen today's darshan
  useEffect(() => {
    const today = new Date().toDateString()
    const lastDarshanDate = localStorage.getItem('lastDarshanDate')

    if (lastDarshanDate !== today) {
      // Show morning darshan for first visit of the day
      const timer = setTimeout(() => {
        setShowMorningDarshan(true)
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setHasSeenDarshan(true)
    }
  }, [])

  const completeDarshan = () => {
    setShowMorningDarshan(false)
    setHasSeenDarshan(true)
    localStorage.setItem('lastDarshanDate', new Date().toDateString())
  }

  return (
    <DivineConsciousnessProvider>
      <SakhaModeProvider>
        <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
          {/* Morning Darshan Modal */}
          <AnimatePresence>
            {showMorningDarshan && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <KrishnaMorningDarshan
                  onComplete={completeDarshan}
                  className="max-w-lg w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divine Protection Shield Modal */}
          <DivineProtectionShield
            isOpen={showProtectionShield}
            onClose={() => setShowProtectionShield(false)}
          />

          {/* Heart-to-Heart Journal Modal */}
          <HeartToHeartJournal
            isOpen={showHeartJournal}
            onClose={() => setShowHeartJournal(false)}
          />

          {/* Page Header */}
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="text-6xl block mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🙏
            </motion.span>
            <h1 className="text-3xl md:text-4xl font-light text-white/90 mb-2">
              Welcome to Divine Presence
            </h1>
            <p className="text-white/60 max-w-xl mx-auto">
              Experience the loving guidance of Krishna. You are never alone on this journey.
            </p>
          </motion.div>

          {/* Divine Greeting Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DivineGreeting
              showAffirmation={true}
              showReminder={true}
              className="py-6"
            />
          </motion.div>

          {/* Divine Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Quick Divine Actions */}
            <div className="space-y-6">
              {/* Sacred Dashboard Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SacredDashboardWidget
                  showBreathing={true}
                  showMoments={true}
                  showReminder={true}
                />
              </motion.div>

              {/* Divine Mood Check-In */}
              <motion.div
                className="bg-gradient-to-br from-slate-900/80 to-indigo-900/50 border border-indigo-500/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">💙</span>
                  <div>
                    <h3 className="text-white/90 font-medium">How is your heart?</h3>
                    <p className="text-white/50 text-xs">Share your feelings with Krishna</p>
                  </div>
                </div>
                <DivineMoodCheckIn compact={true} />
              </motion.div>
            </div>

            {/* Center Column - Krishna Divine Features */}
            <div className="space-y-6">
              {/* Sakha Mode Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SakhaModeCard />
              </motion.div>

              {/* Heart-to-Heart Journal Button */}
              <motion.button
                onClick={() => setShowHeartJournal(true)}
                className="w-full flex items-center gap-4 p-5 bg-gradient-to-br from-pink-900/40 to-rose-900/40 border border-pink-500/20 rounded-2xl hover:border-pink-500/40 transition-all group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400/30 to-rose-500/30 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-3xl">💙</span>
                </motion.div>
                <div className="text-left">
                  <h3 className="text-pink-100 font-semibold text-lg">Heart-to-Heart with Krishna</h3>
                  <p className="text-pink-200/60 text-sm">Write a personal letter to the Divine</p>
                </div>
                <div className="ml-auto text-pink-300/50 group-hover:text-pink-300 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>

              {/* Divine Protection Shield Button */}
              <motion.button
                onClick={() => setShowProtectionShield(true)}
                className="w-full flex items-center gap-4 p-5 bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/20 rounded-2xl hover:border-amber-500/40 transition-all group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-3xl">☸️</span>
                </motion.div>
                <div className="text-left">
                  <h3 className="text-amber-100 font-semibold text-lg">Divine Protection Shield</h3>
                  <p className="text-amber-200/60 text-sm">Activate Sudarshana Chakra protection</p>
                </div>
                <div className="ml-auto text-amber-300/50 group-hover:text-amber-300 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            </div>

            {/* Right Column - KIAAN & Quick Access */}
            <div className="space-y-6">
              {/* Talk to KIAAN Card */}
              <motion.a
                href="/kiaan"
                className="block p-6 bg-gradient-to-br from-orange-900/40 to-amber-900/40 border border-orange-500/20 rounded-2xl hover:border-orange-500/40 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-lg shadow-orange-500/30"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(251, 146, 60, 0.3)',
                        '0 0 40px rgba(251, 146, 60, 0.5)',
                        '0 0 20px rgba(251, 146, 60, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-2xl font-bold text-slate-900">K</span>
                  </motion.div>
                  <div>
                    <h3 className="text-orange-100 font-semibold text-lg">Talk to KIAAN</h3>
                    <p className="text-orange-200/60 text-sm">Divine wisdom & guidance</p>
                  </div>
                </div>
                <p className="text-orange-200/70 text-sm">
                  Share what's on your mind. KIAAN offers warm, grounded guidance rooted in timeless wisdom from the Bhagavad Gita.
                </p>
              </motion.a>

              {/* Continue to Dashboard */}
              <motion.a
                href="/dashboard"
                className="block p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/40 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-500/30 flex items-center justify-center">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <div>
                    <h3 className="text-indigo-100 font-semibold text-lg">Go to Dashboard</h3>
                    <p className="text-indigo-200/60 text-sm">Access all tools & features</p>
                  </div>
                  <div className="ml-auto text-indigo-300/50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.a>

              {/* Morning Darshan Replay Button */}
              {hasSeenDarshan && (
                <motion.button
                  onClick={() => setShowMorningDarshan(true)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 rounded-xl text-amber-200/80 text-sm transition-all flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🌅</span>
                  <span>Receive Krishna's Darshan Again</span>
                </motion.button>
              )}

              {/* Quick Links */}
              <motion.div
                className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 rounded-2xl p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <h3 className="text-white/90 font-medium mb-4">Quick Divine Access</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="/wisdom-journey"
                    className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <span className="text-2xl mb-1">📖</span>
                    <span className="text-white/70 text-xs text-center">Gita Wisdom</span>
                  </a>
                  <a
                    href="/flows/journal"
                    className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <span className="text-2xl mb-1">📝</span>
                    <span className="text-white/70 text-xs text-center">Journal</span>
                  </a>
                  <a
                    href="/ardha"
                    className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <span className="text-2xl mb-1">🔄</span>
                    <span className="text-white/70 text-xs text-center">Reframe</span>
                  </a>
                  <a
                    href="/viyog"
                    className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <span className="text-2xl mb-1">🧘</span>
                    <span className="text-white/70 text-xs text-center">Detachment</span>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Divine Companion - Always Present Krishna (Bottom Right) */}
          <DivineCompanion position="bottom-right" size="md" />

          {/* Krishna's Whispers - Notifications (Top Right) */}
          <KrishnaWhispers position="top-right" autoShow={true} intervalMinutes={30} />
        </main>
      </SakhaModeProvider>
    </DivineConsciousnessProvider>
  )
}
