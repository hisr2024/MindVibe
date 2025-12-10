'use client';

import Link from 'next/link';
import { KiaanLogo } from '@/src/components/KiaanLogo';
import { MinimalFeatures } from '@/components/home/MinimalFeatures';
import { MinimalMoodCheckIn } from '@/components/home/MinimalMoodCheckIn';
import { FlowingEnergyTriangle } from '@/components/home/FlowingEnergyTriangle';

/**
 * Redesigned Home Page
 * - Minimal authentic introduction
 * - Minimal 3 feature cards
 * - Colored stone mood check-in
 * - KIAAN Chat moved to /kiaan/chat
 * - Flowing energy triangle
 */
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden p-4 pb-28 md:p-8">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-orange-600/25 via-[#ff9933]/14 to-transparent blur-3xl" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-orange-500/10 to-transparent blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-56 w-56 animate-pulse rounded-full bg-gradient-to-br from-[#1f2937]/70 via-[#ff9933]/10 to-transparent blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8">
        {/* Hero Header */}
        <header className="relative overflow-hidden rounded-3xl border border-orange-500/10 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-10">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/40 via-[#ffb347]/30 to-transparent blur-2xl" />
          <div className="absolute bottom-4 left-4 h-32 w-32 rounded-full bg-gradient-to-tr from-sky-400/20 via-emerald-300/12 to-transparent blur-3xl" />
          
          <div className="relative space-y-4">
            <KiaanLogo size="lg" className="drop-shadow-[0_12px_55px_rgba(46,160,255,0.25)]" />
            <p className="max-w-xl text-sm text-orange-100/80 sm:text-base">
              Your calm, privacy-first mental wellness companion powered by ancient wisdom
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/kiaan/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
              >
                Talk to KIAAN
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/sacred-reflections"
                className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-white/5 px-5 py-3 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10"
              >
                Sacred Reflections
              </Link>
            </div>
          </div>
        </header>

        {/* Privacy Notice */}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-center shadow-[0_10px_50px_rgba(255,115,39,0.18)] backdrop-blur">
          <p className="text-sm text-orange-100/90">
            🔒 Conversations remain private • a warm, confidential refuge
          </p>
        </div>

        {/* Minimalistic Introduction */}
        <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-8 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-light text-orange-50 md:text-3xl">
              Welcome to MindVibe
            </h2>
            <p className="mx-auto max-w-2xl text-base text-orange-100/80">
              Your journey to mental wellness, guided by ancient wisdom and modern understanding
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/kiaan/chat"
              className="interactive-link group rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/10 px-6 py-3 text-sm font-semibold text-orange-50 transition-all hover:scale-105 hover:border-orange-400/50 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30"
            >
              <span className="flex items-center gap-2">
                Start Chat
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="interactive-link group rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 px-6 py-3 text-sm font-semibold text-teal-50 transition-all hover:scale-105 hover:border-teal-400/50 hover:bg-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30"
            >
              <span className="flex items-center gap-2">
                Explore Tools
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
            <Link
              href="/sacred-reflections"
              className="interactive-link group rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 px-6 py-3 text-sm font-semibold text-blue-50 transition-all hover:scale-105 hover:border-blue-400/50 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
            >
              <span className="flex items-center gap-2">
                Learn More
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </div>
        </section>

        {/* Minimal Features */}
        <MinimalFeatures />

        {/* Mood Check-In */}
        <MinimalMoodCheckIn />

        {/* Quick Access Cards */}
        <section className="grid gap-3 md:grid-cols-3" aria-label="Core daily actions">
          <Link
            href="/kiaan/chat"
            className="rounded-2xl border border-orange-500/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(255,147,71,0.16)] transition-all hover:border-orange-500/40 hover:shadow-[0_20px_80px_rgba(255,147,71,0.24)]"
          >
            <p className="text-xs text-orange-100/70">Talk to KIAAN</p>
            <h2 className="text-lg font-semibold text-orange-50">Instant guidance</h2>
            <p className="mt-1 text-sm text-orange-100/80">
              Jump into a focused conversation for mental wellness support
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
              Open Chat
              <span aria-hidden>→</span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-2xl border border-teal-400/15 bg-white/5 p-4 shadow-[0_14px_60px_rgba(34,197,235,0.12)] transition-all hover:border-teal-400/30 hover:shadow-[0_20px_80px_rgba(34,197,235,0.18)]"
          >
            <p className="text-xs text-white/60">Progress Tracking</p>
            <h2 className="text-lg font-semibold text-white">Dashboard</h2>
            <p className="mt-1 text-sm text-white/70">
              View insights from your mood check-ins and journal entries
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-300">
              View Dashboard
              <span aria-hidden>→</span>
            </div>
          </Link>

          <Link
            href="/emotional-reset"
            className="rounded-2xl border border-amber-300/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(251,191,36,0.16)] transition-all hover:border-amber-300/40 hover:shadow-[0_20px_80px_rgba(251,191,36,0.24)]"
          >
            <p className="text-xs text-amber-100/80">Quick Reset</p>
            <h2 className="text-lg font-semibold text-amber-50">Emotional Reset</h2>
            <p className="mt-1 text-sm text-amber-100/80">
              Guided exercises to reset your emotional state instantly
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
              Try Reset
              <span aria-hidden>→</span>
            </div>
          </Link>
        </section>

        {/* Disclaimer */}
        <section className="space-y-3 rounded-3xl border border-orange-500/15 bg-[#0b0b0f] p-5 shadow-[0_20px_80px_rgba(255,115,39,0.12)] md:p-6">
          <h2 className="text-lg font-semibold text-orange-100">Disclaimer</h2>
          <p className="text-sm leading-relaxed text-orange-100/80">
            KIAAN shares supportive reflections inspired by wisdom traditions. These conversations and exercises are not medical advice. If you are facing serious concerns or feel unsafe, please contact your country's emergency medical services or a licensed professional right away.
          </p>
        </section>
      </div>
    </main>
  );
}
