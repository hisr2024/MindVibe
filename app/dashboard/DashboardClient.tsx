'use client'

import { FadeIn } from '@/components/ui'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useCallback, useId } from 'react'
import { SubscriptionBanner } from '@/components/subscription'

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    },
  },
}

// Quick action card variants
const quickActionVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.96,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 25,
    },
  },
}

// Featured Sacred Tools — the three divine instruments (Gold-Black theme)
const SACRED_TOOLS = [
  {
    id: 'viyoga',
    title: 'Viyoga',
    sanskrit: '\u0935\u093F\u092F\u094B\u0917',
    subtitle: 'The Detachment Tool',
    verse: 'BG 2.47',
    href: '/tools/viyog',
    symbol: '\u{1F549}\uFE0F',
  },
  {
    id: 'ardha',
    title: 'Ardha',
    sanskrit: '\u0905\u0930\u094D\u0927',
    subtitle: 'The Reframing Tool',
    verse: 'BG 2.16',
    href: '/tools/ardha',
    symbol: '\u{1F4FF}',
  },
  {
    id: 'relationship-compass',
    title: 'Relationship Compass',
    sanskrit: '\u0938\u0902\u092C\u0928\u094D\u0927',
    subtitle: 'Dharma-Guided Clarity',
    verse: 'BG 6.29',
    href: '/tools/relationship-compass',
    symbol: '\u{1F54A}\uFE0F',
  },
] as const

// Other tools — compact sacred grid
const OTHER_TOOLS = [
  { id: 'emotional-reset', symbol: '\u{1F4AB}', title: 'Emotional Reset', subtitle: 'Guided healing', href: '/emotional-reset' },
  { id: 'karma-reset', symbol: '\u{1F49A}', title: 'Karma Reset', subtitle: 'Heal with grace', href: '/tools/karma-reset' },
  { id: 'sacred-reflections', symbol: '\u{1F4DD}', title: 'Sacred Reflections', subtitle: 'Private journal', href: '/flows/journal' },
  { id: 'karmic-tree', symbol: '\u{1F331}', title: 'Karmic Tree', subtitle: 'Your growth', href: '/karmic-tree' },
  { id: 'kiaan-vibe', symbol: '\u{1F3B5}', title: 'Vibe Player', subtitle: 'Sacred sounds', href: '/kiaan-vibe' },
  { id: 'wisdom-rooms', symbol: '\u{1F30D}', title: 'Wisdom Rooms', subtitle: 'Community chats', href: '/wisdom-rooms' },
] as const


// Divine Presence particles for the banner
const DIVINE_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 11) % 80}%`,
  delay: i * 0.5,
  duration: 3 + (i % 2) * 1.5,
  size: i % 2 === 0 ? 2.5 : 2,
}))

// Golden god particles for the sacred toolkit
const TOOLKIT_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${6 + (i * 9) % 88}%`,
  delay: i * 0.6,
  duration: 4.5 + (i % 3) * 1.2,
  size: i % 3 === 0 ? 2.5 : 1.5,
}))

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning, beautiful soul.'
  if (hour >= 12 && hour < 17) return 'Good afternoon, beautiful soul.'
  if (hour >= 17 && hour < 21) return 'Good evening, beautiful soul.'
  return 'The world is quiet. I\u2019m here with you.'
}

export default function DashboardClient() {
  const { triggerHaptic } = useHapticFeedback()
  const shouldReduceMotion = useReducedMotion()
  const uid = useId()
  const svgId = (name: string) => `${uid}-kb-${name}`

  const handleCardTap = useCallback(() => {
    triggerHaptic('light')
  }, [triggerHaptic])

  const handleFeatureTap = useCallback(() => {
    triggerHaptic('medium')
  }, [triggerHaptic])

  return (
    <div className="space-y-section-lg">
      <FadeIn>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-section-lg"
        >
          {/* ─── Sacred Greeting ─── */}
          <motion.div
            variants={itemVariants}
            className="pt-4 sm:pt-6 text-center"
          >
            <motion.p
              className="font-sacred text-lg sm:text-xl text-[var(--mv-text-secondary)] tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {getGreeting()}
            </motion.p>
          </motion.div>

          {/* ─── Divine Presence Banner ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/introduction"
              onClick={handleFeatureTap}
              className="group block"
            >
              <motion.div
                className="relative overflow-hidden rounded-[24px] px-5 py-5 sm:px-16 sm:py-6 md:px-24 md:py-7 min-h-[100px] sm:min-h-[110px] md:min-h-[130px] shadow-[0_8px_40px_rgba(212,168,67,0.15)] transition-all duration-300 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.12) 0%, rgba(184, 134, 11, 0.08) 50%, rgba(212, 168, 67, 0.06) 100%)',
                  border: '1px solid rgba(212, 168, 67, 0.2)',
                }}
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                {/* Divine Presence Glow Overlay */}
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-[24px]"
                  animate={{
                    boxShadow: [
                      'inset 0 0 30px rgba(212, 168, 67, 0.05)',
                      'inset 0 0 50px rgba(212, 168, 67, 0.12)',
                      'inset 0 0 30px rgba(212, 168, 67, 0.05)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* ═══ Left Krishna Silhouette — Full body with peacock, tree & moon ═══ */}
                <div className="absolute left-1 bottom-0 top-0 hidden sm:flex items-end pointer-events-none z-[1]" aria-hidden="true">
                  <svg
                    viewBox="0 0 220 240"
                    className="h-[100px] sm:h-[110px] md:h-[130px] w-auto"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient id={svgId('lmg')} cx="50%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="rgba(200,215,235,0.85)" />
                        <stop offset="60%" stopColor="rgba(160,180,210,0.3)" />
                        <stop offset="100%" stopColor="rgba(140,160,190,0.05)" />
                      </radialGradient>
                      <radialGradient id={svgId('lmh')} cx="50%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="rgba(180,200,230,0.15)" />
                        <stop offset="100%" stopColor="rgba(180,200,230,0)" />
                      </radialGradient>
                    </defs>

                    {/* Moon glow halo */}
                    <motion.circle
                      cx="120" cy="75" r="70"
                      fill={`url(#${svgId('lmh')})`}
                      animate={shouldReduceMotion ? undefined : { opacity: [0.4, 0.7, 0.4], scale: [0.97, 1.04, 0.97] }}
                      transition={shouldReduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Moon circle */}
                    <motion.circle
                      cx="120" cy="75" r="48"
                      fill={`url(#${svgId('lmg')})`}
                      animate={shouldReduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
                      transition={shouldReduceMotion ? undefined : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Cloud wisps near moon */}
                    <motion.path
                      d="M60 85 Q75 80 90 83 Q100 86 95 90 Q80 88 65 92 Z"
                      fill="rgba(200,215,235,0.12)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0.04, 0.14, 0.04], x: [0, 3, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.path
                      d="M145 65 Q160 60 175 64 Q182 68 175 70 Q162 67 148 72 Z"
                      fill="rgba(200,215,235,0.1)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0.03, 0.12, 0.03], x: [0, -2, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    />

                    {/* Tree branch from bottom-left */}
                    <path
                      d="M0 240 Q8 220 15 200 Q22 180 35 165 Q48 152 65 145 Q80 140 95 138 Q105 137 108 139 Q105 142 95 143 Q80 146 68 152 Q55 160 45 172 Q35 185 28 200 Q20 220 15 240 Z"
                      fill="#080810"
                    />
                    {/* Smaller branch offshoot */}
                    <path
                      d="M55 160 Q62 148 72 142 Q78 140 80 142 Q75 145 68 150 Q60 158 58 165 Z"
                      fill="#080810"
                    />
                    {/* Leaves on branch */}
                    <path d="M90 135 Q95 128 100 130 Q97 136 92 138 Z" fill="#080810" />
                    <path d="M80 138 Q84 131 89 133 Q87 138 82 140 Z" fill="#080810" />
                    <path d="M100 134 Q106 128 110 131 Q107 136 102 137 Z" fill="#080810" />

                    {/* Peacock perched on branch */}
                    <g fill="#080810">
                      {/* Body */}
                      <ellipse cx="78" cy="138" rx="8" ry="5" />
                      {/* Neck */}
                      <path d="M74 136 Q72 130 73 125 Q74 122 76 124 Q75 128 76 134 Z" />
                      {/* Head */}
                      <circle cx="73" cy="122" r="4" />
                      {/* Crest */}
                      <path d="M72 119 Q70 112 73 110 Q74 113 75 118" />
                      <path d="M73 118 Q74 111 76 110 Q75 114 74 118" />
                      <circle cx="72" cy="110" r="1.2" />
                      <circle cx="75" cy="109.5" r="1" />
                      {/* Beak */}
                      <path d="M70 122 L66 121 L70 120 Z" />
                      {/* Tail feathers flowing down */}
                      <path d="M86 138 Q95 145 100 160 Q102 170 98 178 Q95 172 93 160 Q90 148 85 140 Z" opacity="0.9" />
                      <path d="M84 140 Q92 150 95 165 Q96 175 93 182 Q90 175 88 165 Q86 152 83 143 Z" opacity="0.85" />
                      <path d="M82 141 Q88 152 90 168 Q90 178 87 185 Q85 178 84 168 Q83 155 81 144 Z" opacity="0.8" />
                    </g>

                    {/* Krishna figure — standing with flute, silhouetted against moon */}
                    <motion.g
                      fill="#080810"
                      animate={shouldReduceMotion ? undefined : { rotate: [-0.5, 0.5, -0.5] }}
                      transition={shouldReduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ transformOrigin: '130px 240px' }}
                    >
                      {/* Head */}
                      <ellipse cx="132" cy="68" rx="9" ry="11" />
                      {/* Crown (Mukut) */}
                      <path d="M125 62 L128 48 L131 58 L133 42 L135 58 L138 48 L141 62" />
                      <ellipse cx="133" cy="62" rx="8" ry="2" />
                      {/* Peacock feather on crown */}
                      <path d="M137 53 Q142 40 140 32 Q145 42 143 52" />
                      <ellipse cx="141" cy="36" rx="2" ry="3.5" opacity="0.8" />
                      {/* Neck */}
                      <rect x="129" y="78" width="6" height="6" rx="3" />
                      {/* Shoulders & upper torso */}
                      <path d="M118 86 Q125 82 133 84 Q141 82 148 86 L150 94 Q143 91 133 94 Q123 91 116 94 Z" />
                      {/* Torso */}
                      <path d="M119 94 Q122 120 126 148 Q130 152 133 151 Q136 152 140 148 Q144 120 147 94 Z" opacity="0.95" />
                      {/* Left arm — holding flute up */}
                      <path d="M118 86 Q108 96 102 104 Q99 108 101 110 L112 105 Q116 98 118 92" opacity="0.9" />
                      <ellipse cx="101" cy="108" rx="3" ry="2" opacity="0.85" />
                      {/* Right arm */}
                      <path d="M148 86 Q156 98 160 108 Q162 112 160 114 L152 110 Q149 100 147 92" opacity="0.9" />
                      <ellipse cx="161" cy="112" rx="2.5" ry="2" opacity="0.85" />
                      {/* Flute (Bansuri) */}
                      <rect x="96" y="106" width="66" height="2" rx="1" transform="rotate(-6 96 107)" opacity="0.9" />
                      {/* Flute gold accent */}
                      <rect x="96" y="106" width="66" height="2" rx="1" transform="rotate(-6 96 107)" stroke="#d4a843" strokeWidth="0.3" fill="none" opacity="0.2" />
                      {/* Dhoti / lower garment */}
                      <path d="M124 148 Q119 175 116 200 Q114 218 118 232 L133 236 L148 232 Q152 218 150 200 Q147 175 142 148 Z" opacity="0.9" />
                      {/* Dhoti drape lines */}
                      <path d="M126 152 Q123 175 127 200" stroke="#080810" strokeWidth="0.8" fill="none" opacity="0.4" />
                      {/* Feet */}
                      <ellipse cx="125" cy="235" rx="6" ry="2.5" opacity="0.8" />
                      <ellipse cx="141" cy="235" rx="6" ry="2.5" opacity="0.8" />
                    </motion.g>

                    {/* Rock/hill under Krishna */}
                    <ellipse cx="133" cy="238" rx="22" ry="5" fill="#080810" />

                    {/* Firefly dots */}
                    <motion.circle cx="90" cy="55" r="1" fill="rgba(200,215,235,0.5)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={shouldReduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                    />
                    <motion.circle cx="155" cy="45" r="0.8" fill="rgba(200,215,235,0.5)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0, 0.6, 0], scale: [0.5, 1.3, 0.5] }}
                      transition={shouldReduceMotion ? undefined : { duration: 3.2, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
                    />
                    <motion.circle cx="70" cy="100" r="0.7" fill="rgba(212,168,67,0.4)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0, 0.5, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 2 }}
                    />
                  </svg>
                </div>

                {/* ═══ Right Krishna Silhouette — Bust playing flute with moon ═══ */}
                <div className="absolute right-1 bottom-0 top-0 hidden sm:flex items-end pointer-events-none z-[1]" aria-hidden="true">
                  <svg
                    viewBox="0 0 180 220"
                    className="h-[100px] sm:h-[110px] md:h-[130px] w-auto"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <radialGradient id={svgId('rmg')} cx="50%" cy="38%" r="50%">
                        <stop offset="0%" stopColor="rgba(200,215,235,0.85)" />
                        <stop offset="60%" stopColor="rgba(160,180,210,0.3)" />
                        <stop offset="100%" stopColor="rgba(140,160,190,0.05)" />
                      </radialGradient>
                      <radialGradient id={svgId('rmh')} cx="50%" cy="38%" r="50%">
                        <stop offset="0%" stopColor="rgba(180,200,230,0.15)" />
                        <stop offset="100%" stopColor="rgba(180,200,230,0)" />
                      </radialGradient>
                    </defs>

                    {/* Moon glow halo */}
                    <motion.circle
                      cx="85" cy="75" r="75"
                      fill={`url(#${svgId('rmh')})`}
                      animate={shouldReduceMotion ? undefined : { opacity: [0.4, 0.7, 0.4], scale: [0.97, 1.04, 0.97] }}
                      transition={shouldReduceMotion ? undefined : { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />

                    {/* Moon circle */}
                    <motion.circle
                      cx="85" cy="75" r="52"
                      fill={`url(#${svgId('rmg')})`}
                      animate={shouldReduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
                      transition={shouldReduceMotion ? undefined : { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />

                    {/* Cloud wisps */}
                    <motion.path
                      d="M130 60 Q145 55 158 58 Q165 62 158 64 Q147 60 133 66 Z"
                      fill="rgba(200,215,235,0.1)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0.04, 0.13, 0.04], x: [0, -3, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.path
                      d="M20 90 Q35 85 50 88 Q58 92 50 94 Q38 90 25 96 Z"
                      fill="rgba(200,215,235,0.08)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0.03, 0.1, 0.03], x: [0, 2, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    />

                    {/* Krishna upper-body silhouette — playing flute, facing slightly left */}
                    <motion.g
                      fill="#080810"
                      animate={shouldReduceMotion ? undefined : { rotate: [-0.5, 0.5, -0.5] }}
                      transition={shouldReduceMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                      style={{ transformOrigin: '85px 220px' }}
                    >
                      {/* Head */}
                      <ellipse cx="88" cy="62" rx="11" ry="13" />
                      {/* Crown (Mukut) — ornate */}
                      <path d="M79 55 L83 38 L87 50 L89 30 L91 50 L95 38 L99 55" />
                      <ellipse cx="89" cy="54" rx="10" ry="2.5" />
                      {/* Peacock feather — prominent */}
                      <path d="M94 46 Q102 28 99 16 Q107 32 104 46" />
                      <ellipse cx="101" cy="22" rx="3" ry="5" opacity="0.85" />
                      {/* Peacock feather eye — gold accent */}
                      <ellipse cx="101" cy="22" rx="1.5" ry="2.5" fill="#d4a843" opacity="0.15" />
                      {/* Neck */}
                      <rect x="84" y="74" width="8" height="7" rx="4" />
                      {/* Shoulders & upper body */}
                      <path d="M68 84 Q78 78 89 81 Q100 78 110 84 L113 95 Q103 91 89 95 Q75 91 65 95 Z" />
                      {/* Torso */}
                      <path d="M70 95 Q74 125 78 155 Q83 162 89 160 Q95 162 100 155 Q104 125 108 95 Z" opacity="0.95" />
                      {/* Left arm — raised holding flute */}
                      <path d="M68 84 Q55 95 46 106 Q42 112 45 115 L56 109 Q60 100 66 92" opacity="0.9" />
                      <ellipse cx="44" cy="113" rx="3.5" ry="2.5" opacity="0.85" />
                      {/* Right arm — supporting flute */}
                      <path d="M110 84 Q120 100 126 114 Q129 120 127 123 L118 118 Q114 106 110 94" opacity="0.9" />
                      <ellipse cx="128" cy="120" rx="3" ry="2.5" opacity="0.85" />
                      {/* Flute (Bansuri) — diagonal across */}
                      <rect x="38" y="110" width="92" height="2.5" rx="1.25" transform="rotate(-7 38 111)" opacity="0.9" />
                      {/* Flute gold accent */}
                      <rect x="38" y="110" width="92" height="2.5" rx="1.25" transform="rotate(-7 38 111)" stroke="#d4a843" strokeWidth="0.4" fill="none" opacity="0.2" />
                      {/* Flute holes */}
                      <circle cx="60" cy="110" r="0.8" fill="#0d0d16" opacity="0.5" />
                      <circle cx="72" cy="109" r="0.8" fill="#0d0d16" opacity="0.5" />
                      <circle cx="84" cy="108" r="0.8" fill="#0d0d16" opacity="0.5" />
                      <circle cx="96" cy="107" r="0.8" fill="#0d0d16" opacity="0.5" />
                      {/* Necklace */}
                      <path d="M74 84 Q82 92 89 94 Q96 92 104 84" stroke="#080810" strokeWidth="1.5" fill="none" opacity="0.6" />
                      {/* Dhoti / lower garment — fades into bottom */}
                      <path d="M76 155 Q72 178 70 200 Q69 212 72 220 L89 222 L106 220 Q109 212 108 200 Q106 178 102 155 Z" opacity="0.9" />
                      {/* Dhoti drape */}
                      <path d="M80 158 Q77 178 80 200" stroke="#080810" strokeWidth="0.8" fill="none" opacity="0.3" />
                    </motion.g>

                    {/* Firefly dots */}
                    <motion.circle cx="40" cy="50" r="0.9" fill="rgba(200,215,235,0.5)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
                    />
                    <motion.circle cx="140" cy="40" r="0.7" fill="rgba(200,215,235,0.45)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0, 0.6, 0], scale: [0.5, 1.3, 0.5] }}
                      transition={shouldReduceMotion ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 1.8 }}
                    />
                    <motion.circle cx="55" cy="110" r="0.6" fill="rgba(212,168,67,0.35)"
                      animate={shouldReduceMotion ? undefined : { opacity: [0, 0.5, 0] }}
                      transition={shouldReduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 2.5 }}
                    />
                  </svg>
                </div>

                {/* Floating Divine Particles */}
                {DIVINE_PARTICLES.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-[#d4a843]/70"
                    style={{
                      width: particle.size,
                      height: particle.size,
                      left: particle.left,
                      bottom: 0,
                    }}
                    animate={{
                      y: [0, -120],
                      opacity: [0, 0.9, 0.7, 0],
                      scale: [0.4, 1, 0.6, 0.2],
                    }}
                    transition={{
                      duration: particle.duration,
                      repeat: Infinity,
                      delay: particle.delay,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Top radiance line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/50 to-transparent" />

                <div className="relative z-10 flex items-center gap-4 sm:gap-5">
                  {/* Golden Avatar Circle with Pulsing Glow */}
                  <motion.div
                    className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full sm:h-18 sm:w-18 md:h-20 md:w-20"
                    style={{
                      background: 'linear-gradient(135deg, #d4a843 0%, #e8c56d 50%, #b8860b 100%)',
                    }}
                    animate={{
                      scale: [1, 1.06, 1],
                      boxShadow: [
                        '0 0 25px rgba(212, 168, 67, 0.35), 0 0 50px rgba(212, 168, 67, 0.15)',
                        '0 0 35px rgba(212, 168, 67, 0.5), 0 0 70px rgba(212, 168, 67, 0.25)',
                        '0 0 25px rgba(212, 168, 67, 0.35), 0 0 50px rgba(212, 168, 67, 0.15)',
                      ],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* Inner glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                          'inset 0 0 18px rgba(255, 255, 255, 0.45)',
                          'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                    <span className="text-3xl sm:text-4xl md:text-[42px] text-[#0a0a0f] drop-shadow-sm select-none" style={{ lineHeight: 1 }}>
                      {'\u0950'}
                    </span>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2.5 font-semibold">
                      Divine Presence
                      <span className="inline-flex rounded-full border border-[#d4a843]/30 bg-[#d4a843]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#d4a843] tracking-wide uppercase">
                        Sacred
                      </span>
                    </h2>
                    <p className="mt-1.5 text-body text-[#d4a843]/70 line-clamp-2">
                      Enter the divine presence — experience Krishna&apos;s loving guidance and sacred wisdom
                    </p>
                  </div>

                  {/* Animated Arrow */}
                  <motion.div
                    className="flex-shrink-0 text-[#d4a843]/60 transition-colors duration-300 group-hover:text-[#d4a843]"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>

                {/* Bottom radiance line */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/30 to-transparent" />
              </motion.div>
            </Link>
          </motion.div>

          {/* ─── Subscription Upsell Banner (free users) ─── */}
          <motion.div variants={itemVariants}>
            <SubscriptionBanner
              feature="encrypted_journal"
              message="Unlock journals, voice synthesis, and 150 KIAAN questions — Plus starts at $4.99/mo"
              ctaText="View Plans"
            />
          </motion.div>

          {/* ─── Speak to KIAAN (SECONDARY) ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/kiaan/chat"
              onClick={handleCardTap}
              className="block"
            >
              <motion.div
                className="overflow-hidden rounded-[24px] bg-gradient-to-br from-orange-900/25 to-amber-900/20 p-4 sm:p-5 shadow-mobile-glow"
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a44c] to-[#e8b54a] shadow-lg shadow-[#d4a44c]/20"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(212, 164, 76, 0.2)',
                        '0 0 25px rgba(212, 164, 76, 0.35)',
                        '0 0 15px rgba(212, 164, 76, 0.2)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-lg font-bold text-slate-900">K</span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      Your Divine Friend is here
                    </h3>
                    <p className="mt-0.5 text-xs text-[#e8b54a]/60">
                      Talk to KIAAN — voice or text
                    </p>
                  </div>
                  <motion.div
                    className="flex-shrink-0 text-[#e8b54a]/30"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* ─── Sacred Spiritual Toolkit (Gold-Black Divine Theme) ─── */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-[28px] border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0a06]/90 via-[#080706]/95 to-[#0a0806]/90 p-5 sm:p-6"
              style={{ boxShadow: '0 12px 48px rgba(212, 164, 76, 0.08), inset 0 1px 0 rgba(212, 164, 76, 0.08)' }}
            >
              {/* Top golden radiance line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

              {/* Floating golden god particles */}
              {TOOLKIT_PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    left: p.left,
                    bottom: 0,
                    background: 'radial-gradient(circle, rgba(212,164,76,0.8) 0%, rgba(212,164,76,0) 70%)',
                  }}
                  animate={{
                    y: [0, -180],
                    opacity: [0, 0.7, 0.5, 0],
                    scale: [0.4, 1, 0.7, 0.2],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Section header */}
              <div className="relative mb-5 flex items-center gap-3">
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a44c]/15 to-[#e8b54a]/10 border border-[#d4a44c]/15"
                  animate={{
                    boxShadow: [
                      '0 0 12px rgba(212, 164, 76, 0.15)',
                      '0 0 20px rgba(212, 164, 76, 0.3)',
                      '0 0 12px rgba(212, 164, 76, 0.15)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="text-base select-none">{'\u{1F549}\uFE0F'}</span>
                </motion.div>
                <div>
                  <h2 className="font-semibold">
                    Your Sacred Instruments
                  </h2>
                  <p className="text-[10px] text-[#d4a44c]/40 font-sacred italic">
                    Guided by the eternal wisdom of the Bhagavad Gita
                  </p>
                </div>
              </div>

              {/* Featured Sacred Tools — Viyoga, Ardha, Relationship Compass */}
              <div className="relative space-y-2.5">
                {SACRED_TOOLS.map((tool, idx) => (
                  <motion.div
                    key={tool.id}
                    variants={quickActionVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Link
                      href={tool.href}
                      onClick={handleFeatureTap}
                      className="group block"
                    >
                      <div
                        className="relative overflow-hidden rounded-[18px] border border-[#d4a44c]/12 bg-gradient-to-r from-[#d4a44c]/[0.06] via-transparent to-[#d4a44c]/[0.03] p-4 sm:p-4.5 transition-all duration-300 hover:border-[#d4a44c]/25 hover:from-[#d4a44c]/[0.1]"
                        style={{
                          boxShadow: '0 4px 20px rgba(212, 164, 76, 0.04)',
                        }}
                      >
                        {/* Hover glow overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            boxShadow: 'inset 0 0 30px rgba(212, 164, 76, 0.08)',
                          }}
                        />

                        <div className="relative flex items-center gap-3.5">
                          {/* Sacred Sanskrit Symbol in golden circle */}
                          <motion.div
                            className="flex h-12 w-12 sm:h-13 sm:w-13 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d4a44c]/15"
                            style={{
                              background: 'linear-gradient(135deg, rgba(212, 164, 76, 0.12) 0%, rgba(232, 181, 74, 0.06) 100%)',
                            }}
                            animate={idx === 0 ? {
                              boxShadow: [
                                '0 0 10px rgba(212, 164, 76, 0.1)',
                                '0 0 18px rgba(212, 164, 76, 0.2)',
                                '0 0 10px rgba(212, 164, 76, 0.1)',
                              ],
                            } : undefined}
                            transition={idx === 0 ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
                          >
                            <span className="text-sm sm:text-base font-sacred text-[#e8b54a]/80 select-none">
                              {tool.sanskrit}
                            </span>
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{tool.symbol}</span>
                              <h3 className="font-semibold group-hover:text-[#f5f0e8] transition-colors">
                                {tool.title}
                              </h3>
                              <span className="text-[8px] text-[#d4a44c]/30 font-mono tracking-widest uppercase">
                                {tool.verse}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#d4a44c]/45 mt-0.5 font-sacred italic">
                              {tool.subtitle}
                            </p>
                          </div>

                          {/* Arrow */}
                          <motion.div
                            className="flex-shrink-0 text-[#d4a44c]/20 group-hover:text-[#d4a44c]/50 transition-colors"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.div>
                        </div>

                        {/* Bottom golden thread */}
                        <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/10 to-transparent" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Other Tools — Compact Grid */}
              <div className="relative mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {OTHER_TOOLS.map((tool) => (
                  <motion.div key={tool.id} variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                    <Link
                      href={tool.href}
                      onClick={handleCardTap}
                      className="flex flex-col items-center justify-center rounded-[14px] border border-[#d4a44c]/[0.06] bg-gradient-to-br from-[#d4a44c]/[0.03] to-transparent p-2.5 sm:p-3 transition-all duration-300 hover:border-[#d4a44c]/15 active:opacity-90"
                    >
                      <div className="mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#d4a44c]/[0.06]">
                        <span className="text-lg sm:text-xl">{tool.symbol}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-[#f5e6c8]/70 text-center leading-tight">{tool.title}</span>
                      <span className="mt-0.5 text-[8px] sm:text-[9px] text-[#d4a44c]/30 text-center leading-tight">{tool.subtitle}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bottom golden radiance line */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/20 to-transparent" />
            </div>
          </motion.div>

        </motion.div>
      </FadeIn>
    </div>
  )
}
