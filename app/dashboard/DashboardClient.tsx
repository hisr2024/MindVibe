'use client'

import { FadeIn } from '@/components/ui'
import { ToolsDashboardSection } from '@/components/dashboard'
import { motion } from 'framer-motion'
import Link from 'next/link'

/**
 * DashboardClient component - Main dashboard view
 *
 * Clean, focused dashboard with:
 * - Quick access to Introduction (divine features)
 * - All tools and features
 *
 * Note: Divine Krishna features have been moved to /introduction
 */
export default function DashboardClient() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
      <FadeIn>
        {/* Quick Access to Introduction */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/introduction"
            className="block p-6 bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/20 rounded-2xl hover:border-amber-500/40 transition-all group"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-4xl">🙏</span>
              </motion.div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-amber-100 mb-1 flex items-center gap-2">
                  Divine Presence
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                    Krishna
                  </span>
                </h2>
                <p className="text-amber-200/70 text-sm">
                  Experience Krishna's Morning Darshan, Heart-to-Heart Journal, Divine Protection Shield, and more sacred features.
                </p>
              </div>
              <div className="text-amber-300/50 group-hover:text-amber-300 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/kiaan"
            className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-500/20 rounded-xl hover:border-orange-500/40 transition-all"
          >
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/20"
              animate={{
                boxShadow: [
                  '0 0 15px rgba(251, 146, 60, 0.2)',
                  '0 0 25px rgba(251, 146, 60, 0.4)',
                  '0 0 15px rgba(251, 146, 60, 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-lg font-bold text-slate-900">K</span>
            </motion.div>
            <span className="text-white/80 text-sm font-medium">KIAAN</span>
          </Link>

          <Link
            href="/flows/journal"
            className="flex flex-col items-center p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-xl hover:border-white/20 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <span className="text-2xl">📝</span>
            </div>
            <span className="text-white/80 text-sm font-medium">Journal</span>
          </Link>

          <Link
            href="/wisdom-journey"
            className="flex flex-col items-center p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-xl hover:border-white/20 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <span className="text-2xl">📖</span>
            </div>
            <span className="text-white/80 text-sm font-medium">Gita Wisdom</span>
          </Link>

          <Link
            href="/flows/check-in"
            className="flex flex-col items-center p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-xl hover:border-white/20 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <span className="text-2xl">💙</span>
            </div>
            <span className="text-white/80 text-sm font-medium">Mood Check-in</span>
          </Link>
        </motion.div>

        {/* Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            All Tools & Features
          </h2>
          <ToolsDashboardSection />
        </motion.div>
      </FadeIn>
    </main>
  )
}
