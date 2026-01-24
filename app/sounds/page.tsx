'use client'

/**
 * Sounds Page - Natural Ultra HD Meditation Music
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Clean, minimal meditation music player.
 * Natural, authentic sounds - no gimmicks.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Headphones, Music } from 'lucide-react'
import { SpiritualMusicPlayer, SoulSoothingMusicPlayer } from '@/components/music'

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
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Natural Music Library</h3>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs">Real Audio</span>
            </div>
            <SoulSoothingMusicPlayer />
          </motion.section>

          {/* Spiritual Sound Generator */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Headphones className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Sound Generator</h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">Mix Your Own</span>
            </div>
            <SpiritualMusicPlayer />
          </motion.section>

          {/* Info Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
            transition={{ delay: 0.4 }}
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
