'use client'

/**
 * Ambient Sounds Page
 *
 * Immersive ambient sound experience with:
 * - Beautiful sound scene presets
 * - Professional sound mixer
 * - Audio visualizations
 * - Timer functionality
 * - Activity modes (sleep, focus, meditation)
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
  Heart,
  Volume2,
  Clock,
  Music
} from 'lucide-react'
import { AmbientSoundsPlayer, SOUND_SCENES, SoundSceneCard } from '@/components/sounds'
import { GlobalMusicPlayer, MeditationMusicPlayer, ProgramTracker, AdvancedVisualizer } from '@/components/music'

export default function SoundsPage() {
  const [featuredScene, setFeaturedScene] = useState<string | null>(null)

  // Featured scenes for quick access
  const featuredScenes = SOUND_SCENES.slice(0, 4)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0812] text-white">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0d]/80 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10">
                      <Headphones className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        MindVibe Music
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-purple-200 font-medium">PRO</span>
                      </h1>
                      <p className="text-xs text-white/50">संगीत अनुभव</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">Audio Ready</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-200 via-purple-200 to-violet-100 bg-clip-text text-transparent">
                  Your Sacred Sound Sanctuary
                </span>
              </h2>
              <p className="text-white/60">
                Professional therapeutic sounds, time-based ragas, binaural beats, and sacred frequencies.
                Experience deep relaxation, enhanced focus, and spiritual connection.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: Music, label: 'Time-Based Ragas', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                { icon: Brain, label: 'Brainwave Sync', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                { icon: Heart, label: 'Healing Frequencies', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                { icon: Sparkles, label: 'Sacred Sounds', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${color}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Quick Access - Featured Scenes */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Quick Start</h3>
                <p className="text-sm text-white/50">Popular soundscapes to get you started</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredScenes.map((scene, index) => (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
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

          {/* Activity Modes */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: 'relax',
                  name: 'Relaxation',
                  nameHindi: 'विश्राम',
                  description: 'Unwind with calming nature sounds',
                  icon: Heart,
                  gradient: 'from-rose-600/80 via-pink-500/60 to-orange-400/40',
                  border: 'border-rose-500/30',
                  glow: 'shadow-[0_0_40px_rgba(244,63,94,0.2)]'
                },
                {
                  id: 'sleep',
                  name: 'Deep Sleep',
                  nameHindi: 'गहरी नींद',
                  description: 'Drift off with soothing soundscapes',
                  icon: Moon,
                  gradient: 'from-indigo-600/80 via-purple-500/60 to-violet-400/40',
                  border: 'border-indigo-500/30',
                  glow: 'shadow-[0_0_40px_rgba(99,102,241,0.2)]'
                },
                {
                  id: 'focus',
                  name: 'Focus Mode',
                  nameHindi: 'एकाग्रता',
                  description: 'Boost concentration with ambient audio',
                  icon: Brain,
                  gradient: 'from-blue-600/80 via-cyan-500/60 to-sky-400/40',
                  border: 'border-blue-500/30',
                  glow: 'shadow-[0_0_40px_rgba(14,165,233,0.2)]'
                },
                {
                  id: 'meditate',
                  name: 'Meditation',
                  nameHindi: 'ध्यान',
                  description: 'Sacred sounds for inner peace',
                  icon: Sparkles,
                  gradient: 'from-violet-600/80 via-purple-500/60 to-indigo-400/40',
                  border: 'border-violet-500/30',
                  glow: 'shadow-[0_0_40px_rgba(139,92,246,0.2)]'
                },
              ].map((mode, index) => {
                const Icon = mode.icon
                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className={`
                      relative overflow-hidden rounded-2xl p-6 border text-left
                      ${mode.border} ${mode.glow}
                      hover:scale-[1.02] transition-transform
                    `}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-30`} />
                    <div className="relative z-10">
                      <div className="p-3 rounded-xl bg-white/10 w-fit mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-1">{mode.name}</h4>
                      <p className="text-xs text-white/50 mb-2">{mode.nameHindi}</p>
                      <p className="text-sm text-white/60">{mode.description}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.section>

          {/* MindVibe Music System */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">🎵</span>
                  MindVibe Music Player
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">CORE</span>
                </h3>
                <p className="text-sm text-white/50">Indian classical ragas, spiritual sounds & therapeutic frequencies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlobalMusicPlayer
                showTimeMusic={true}
                showSpiritualMusic={true}
                compact={false}
              />

              <MeditationMusicPlayer
                showTimer={true}
              />
            </div>
          </motion.section>

          {/* Ambient Sound Scenes */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">🎧</span>
                  Ambient Soundscapes
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">MIX</span>
                </h3>
                <p className="text-sm text-white/50">Layer nature sounds for your perfect environment</p>
              </div>
            </div>

            <AmbientSoundsPlayer
              defaultScene={featuredScene || undefined}
              showMixer={true}
              showTimer={true}
            />
          </motion.section>

          {/* Therapeutic Programs Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">📿</span>
                  Therapeutic Journeys
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">NEW</span>
                </h3>
                <p className="text-sm text-white/50">Multi-day programs for deep transformation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgramTracker />

              {/* Visualizer Demo */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0d0d12] to-[#08080b] border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <span>✨</span> Audio Visualizer
                  </h4>
                  <p className="text-xs text-white/50 mt-1">Interactive sound visualization</p>
                </div>
                <AdvancedVisualizer
                  type="spectrum"
                  isPlaying={true}
                  colorScheme="purple"
                  size="large"
                  showControls={true}
                />
              </div>
            </div>
          </motion.section>

          {/* Info Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Layered Audio',
                  description: 'Mix multiple sounds to create your perfect ambiance',
                  icon: Volume2,
                  color: 'text-orange-400'
                },
                {
                  title: 'Sleep Timer',
                  description: 'Set a timer with gradual fade-out for peaceful sleep',
                  icon: Clock,
                  color: 'text-cyan-400'
                },
                {
                  title: 'Sacred Sounds',
                  description: 'Temple bells, singing bowls, and Om chanting',
                  icon: Sparkles,
                  color: 'text-violet-400'
                },
              ].map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02]"
                  >
                    <Icon className={`w-6 h-6 ${feature.color} mb-3`} />
                    <h4 className="font-medium text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-white/50">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </motion.section>

          {/* Bottom spacing for mobile nav */}
          <div className="h-24" />
        </div>
      </div>
    </main>
  )
}
