'use client'

/**
 * Sounds Page - Natural Ultra HD Meditation Music & Bhagavad Gita Audio
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Clean, minimal meditation music player with Gita audio integration.
 * Natural, authentic sounds - no gimmicks.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Headphones, BookOpen, Music2, ChevronRight, Sparkles, Brain, Zap } from 'lucide-react'
import { SimpleMusicPlayer } from '@/components/music'

export default function SoundsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0812] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0d]/80 border-b border-white/5">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-500/20">
                    <Headphones className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Meditation Music</h1>
                    <p className="text-xs text-white/40">ध्यान संगीत</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* KIAAN Vibe Promotion - NEW */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/kiaan-vibe">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-orange-500/20 border border-violet-500/30 p-5 group hover:border-violet-500/50 transition-all cursor-pointer">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-orange-500/10 animate-pulse" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-colors" />

                <div className="relative flex items-center gap-4">
                  {/* Logo */}
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-orange-500/30 flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(139, 92, 246, 0.3)',
                        '0 0 40px rgba(249, 115, 22, 0.4)',
                        '0 0 20px rgba(139, 92, 246, 0.3)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-orange-300 bg-clip-text text-transparent">ॐ</span>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-violet-200 to-orange-200 bg-clip-text text-transparent">
                        KIAAN Vibe
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/30 to-orange-500/30 text-white text-[10px] font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        NEW
                      </span>
                    </div>
                    <p className="text-sm text-violet-200/70 font-sanskrit mb-1">कियान वाइब - दिव्य ध्वनि</p>
                    <p className="text-xs text-white/50">
                      AI-powered meditation music + Bhagavad Gita unified experience
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Features */}
                <div className="relative mt-4 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <Brain className="w-3 h-3 text-violet-400" />
                    <span>AI Recommendations</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <BookOpen className="w-3 h-3 text-orange-400" />
                    <span>18 Gita Chapters</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <Music2 className="w-3 h-3 text-purple-400" />
                    <span>Ambient Layers</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Mood-based</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.section>

          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-violet-200 to-purple-100 bg-clip-text text-transparent">
              Natural Meditation Music
            </h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Ultra HD quality music for deep meditation, peaceful sleep, and inner calm
            </p>
          </motion.section>

          {/* Soul-Soothing Music Player - Real Natural Audio */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <SimpleMusicPlayer />
          </motion.section>

          {/* Bhagavad Gita Audio Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link href="/gita-audio">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-rose-500/20 border border-orange-500/20 p-5 group hover:border-orange-500/40 transition-all cursor-pointer">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-colors" />

                <div className="relative flex items-center gap-4">
                  {/* Icon */}
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(249, 115, 22, 0.2)',
                        '0 0 20px rgba(249, 115, 22, 0.4)',
                        '0 0 10px rgba(249, 115, 22, 0.2)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-2xl">ॐ</span>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">Bhagavad Gita Audio</h3>
                    </div>
                    <p className="text-sm text-amber-200/70 font-sanskrit mb-1">श्रीमद्भगवद्गीता</p>
                    <p className="text-xs text-white/50">
                      Listen in Sanskrit, Hindi, Telugu & more with ambient sounds
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Features */}
                <div className="relative mt-4 flex gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <BookOpen className="w-3 h-3" />
                    <span>18 Chapters</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <Music2 className="w-3 h-3" />
                    <span>Ambient Layers</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50">
                    <Sparkles className="w-3 h-3" />
                    <span>6+ Languages</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.section>

          {/* Info Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-8"
          >
            <div className="rounded-2xl bg-white/5 border border-white/5 p-5">
              <h3 className="text-sm font-medium text-white/70 mb-3">Music Categories</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-orange-400 font-medium">Morning Ragas</span>
                  <p className="text-white/40 mt-0.5">Bhairav, Todi - Dawn meditation</p>
                </div>
                <div>
                  <span className="text-pink-400 font-medium">Evening Ragas</span>
                  <p className="text-white/40 mt-0.5">Yaman, Puriya - Twilight peace</p>
                </div>
                <div>
                  <span className="text-violet-400 font-medium">Deep Meditation</span>
                  <p className="text-white/40 mt-0.5">Tanpura drones, ambient</p>
                </div>
                <div>
                  <span className="text-indigo-400 font-medium">Sleep Music</span>
                  <p className="text-white/40 mt-0.5">Gentle sounds for rest</p>
                </div>
                <div>
                  <span className="text-emerald-400 font-medium">Nature</span>
                  <p className="text-white/40 mt-0.5">Forest, river, mountains</p>
                </div>
                <div>
                  <span className="text-amber-400 font-medium">Devotional</span>
                  <p className="text-white/40 mt-0.5">Sacred chants and mantras</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Tips */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <div className="rounded-2xl bg-violet-500/5 border border-violet-500/10 p-5">
              <h3 className="text-sm font-medium text-violet-300 mb-2">For Best Experience</h3>
              <ul className="text-xs text-white/50 space-y-2">
                <li>• Use quality headphones for full audio depth</li>
                <li>• Find a quiet, comfortable space</li>
                <li>• Let the music play without interruption</li>
                <li>• Start with shorter sessions, gradually increase</li>
              </ul>
            </div>
          </motion.section>

          {/* Bottom spacing */}
          <div className="h-20" />
        </div>
      </div>
    </main>
  )
}
