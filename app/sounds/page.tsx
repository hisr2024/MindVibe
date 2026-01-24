'use client'

/**
 * Sounds Page - Clean & Polished
 * MindVibe Music - Ultra HD Professional Audio
 */

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Headphones,
  Sparkles,
  Moon,
  Brain,
  Heart
} from 'lucide-react'
import { AmbientSoundsPlayer, SOUND_SCENES, SoundSceneCard } from '@/components/sounds'
import { GlobalMusicPlayer, MeditationMusicPlayer, ProgramTracker, AdvancedVisualizer } from '@/components/music'

export default function SoundsPage() {
  const [featuredScene, setFeaturedScene] = useState<string | null>(null)
  const featuredScenes = SOUND_SCENES.slice(0, 4)

  const activityModes = [
    { id: 'relax', name: 'Relaxation', icon: Heart, gradient: 'from-rose-600/60 to-pink-500/40', border: 'border-rose-500/20' },
    { id: 'sleep', name: 'Deep Sleep', icon: Moon, gradient: 'from-indigo-600/60 to-purple-500/40', border: 'border-indigo-500/20' },
    { id: 'focus', name: 'Focus', icon: Brain, gradient: 'from-blue-600/60 to-cyan-500/40', border: 'border-blue-500/20' },
    { id: 'meditate', name: 'Meditation', icon: Sparkles, gradient: 'from-violet-600/60 to-purple-500/40', border: 'border-violet-500/20' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0812] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0d]/80 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-500/20">
                    <Headphones className="w-5 h-5 text-violet-400" />
                  </div>
                  <h1 className="text-xl font-bold text-white">MindVibe Music</h1>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">Ready</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

          {/* Hero */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-violet-200 to-purple-100 bg-clip-text text-transparent">
                Your Sound Sanctuary
              </h2>
              <p className="text-white/50 text-sm">
                Professional therapeutic audio with Ultra HD quality
              </p>
            </div>
          </motion.section>

          {/* Activity Modes */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {activityModes.map((mode, i) => {
                const Icon = mode.icon
                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className={`relative overflow-hidden rounded-xl p-5 border ${mode.border} hover:scale-[1.02] transition-transform text-left`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-30`} />
                    <div className="relative z-10">
                      <div className="p-2.5 rounded-lg bg-white/10 w-fit mb-3">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-white">{mode.name}</h4>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.section>

          {/* Main Players */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GlobalMusicPlayer showTimeMusic={true} showSpiritualMusic={true} compact={false} />
              <MeditationMusicPlayer showTimer={true} />
            </div>
          </motion.section>

          {/* Quick Scenes */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-sm font-medium text-white/70 mb-4">Quick Start</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredScenes.map((scene, i) => (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                >
                  <SoundSceneCard
                    scene={scene}
                    isActive={featuredScene === scene.id}
                    isPlaying={false}
                    onSelect={() => setFeaturedScene(scene.id)}
                    variant="featured"
                    className="h-full"
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Ambient Mixer */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="text-sm font-medium text-white/70 mb-4">Sound Mixer</h3>
            <AmbientSoundsPlayer defaultScene={featuredScene || undefined} showMixer={true} showTimer={true} />
          </motion.section>

          {/* Programs & Visualizer */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4">Therapeutic Programs</h3>
                <ProgramTracker />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-4">Visualizer</h3>
                <div className="rounded-2xl bg-[#0d0d12] border border-white/10 overflow-hidden">
                  <AdvancedVisualizer type="spectrum" isPlaying={true} colorScheme="purple" size="large" showControls={true} />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Bottom spacing */}
          <div className="h-20" />
        </div>
      </div>
    </main>
  )
}
