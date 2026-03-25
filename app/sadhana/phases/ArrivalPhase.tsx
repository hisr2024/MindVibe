'use client'

/**
 * ArrivalPhase — Divine grace opening for the sacred practice.
 * Replaces the repetitive mood grid with floating orbital mood spheres,
 * Sanskrit invocation, and an immersive sacred atmosphere.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SadhanaMood, MoodOption } from '@/types/sadhana.types'

interface ArrivalPhaseProps {
  greeting: string | null
  isComposing: boolean
  onMoodSelect: (mood: SadhanaMood) => void
}

/** Sacred mood options with colors and Sanskrit */
const MOODS: (MoodOption & { sanskrit: string; gradient: string; auraColor: string })[] = [
  {
    id: 'radiant', label: 'Radiant', emoji: '✦', color: '#FFD700', description: 'Joyful, bright, full of energy',
    sanskrit: 'तेजस्वी', gradient: 'from-[#FFD700]/20 to-[#F4A460]/10', auraColor: '255,215,0',
  },
  {
    id: 'peaceful', label: 'At Peace', emoji: '☽', color: '#87CEEB', description: 'Calm, centered, content',
    sanskrit: 'शान्त', gradient: 'from-[#87CEEB]/20 to-[#6BA3BE]/10', auraColor: '135,206,235',
  },
  {
    id: 'grateful', label: 'Grateful', emoji: '🙏', color: '#98FB98', description: 'Thankful, blessed, appreciative',
    sanskrit: 'कृतज्ञ', gradient: 'from-[#98FB98]/20 to-[#7BC67B]/10', auraColor: '152,251,152',
  },
  {
    id: 'seeking', label: 'Seeking', emoji: '◈', color: '#DDA0DD', description: 'Curious, searching, questioning',
    sanskrit: 'जिज्ञासु', gradient: 'from-[#DDA0DD]/20 to-[#BA7EBA]/10', auraColor: '221,160,221',
  },
  {
    id: 'heavy', label: 'Heavy', emoji: '☁', color: '#A0A0C0', description: 'Burdened, tired, weighed down',
    sanskrit: 'भारग्रस्त', gradient: 'from-[#A0A0C0]/20 to-[#808098]/10', auraColor: '160,160,192',
  },
  {
    id: 'wounded', label: 'Wounded', emoji: '♡', color: '#CD5C5C', description: 'Hurting, grieving, in pain',
    sanskrit: 'आहत', gradient: 'from-[#CD5C5C]/20 to-[#A04040]/10', auraColor: '205,92,92',
  },
]

/** Sanskrit time greetings */
function getSacredGreeting(): { sanskrit: string; english: string } {
  const hour = new Date().getHours()
  if (hour < 12) return { sanskrit: 'शुभ प्रभात, प्रिय आत्मा', english: 'Good morning, dear soul' }
  if (hour < 17) return { sanskrit: 'शुभ अपराह्न, प्रिय आत्मा', english: 'Good afternoon, dear soul' }
  return { sanskrit: 'शुभ संध्या, प्रिय आत्मा', english: 'Good evening, dear soul' }
}

/** Opening invocation */
const INVOCATION = 'ॐ सह नाववतु। सह नौ भुनक्तु।'
const INVOCATION_MEANING = 'Om. May we be protected together. May we be nourished together.'

export function ArrivalPhase({ greeting, isComposing, onMoodSelect }: ArrivalPhaseProps) {
  const [selectedMood, setSelectedMood] = useState<SadhanaMood | null>(null)
  const [showMoods, setShowMoods] = useState(false)
  const timeGreeting = getSacredGreeting()

  const handleSelect = useCallback((mood: SadhanaMood) => {
    setSelectedMood(mood)
    onMoodSelect(mood)
  }, [onMoodSelect])

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
      transition={{ duration: 1 }}
    >
      {/* Opening Sanskrit invocation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        onAnimationComplete={() => setTimeout(() => setShowMoods(true), 800)}
        className="text-center mb-10 relative z-10"
      >
        <motion.p
          className="text-sm md:text-base tracking-[0.3em] text-[#d4a44c]/50 font-light mb-6"
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1.5, delay: 0.5 }}
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          {INVOCATION}
        </motion.p>

        <motion.p
          className="text-xs text-[#d4a44c]/30 mb-10 italic font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {INVOCATION_MEANING}
        </motion.p>

        {/* Sacred time greeting */}
        <motion.h1
          className="text-3xl md:text-4xl font-light mb-2 text-[#FFF8DC]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          {timeGreeting.sanskrit}
        </motion.h1>
        <motion.p
          className="text-lg text-[#d4a44c]/60 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.5 }}
        >
          {timeGreeting.english}
        </motion.p>

        {/* Sacred question */}
        <motion.p
          className="text-[#d4a44c]/50 text-sm mt-6 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 3 }}
        >
          What is the colour of your soul today?
        </motion.p>
      </motion.div>

      {/* Floating Mood Spheres — Orbital arrangement */}
      <AnimatePresence>
        {showMoods && !selectedMood && (
          <motion.div
            className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
          >
            {MOODS.map((mood, i) => {
              const angle = (i / MOODS.length) * Math.PI * 2 - Math.PI / 2
              const radius = 130
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius

              return (
                <motion.button
                  key={mood.id}
                  onClick={() => handleSelect(mood.id)}
                  disabled={isComposing}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x,
                    y,
                  }}
                  transition={{
                    delay: 0.1 * i,
                    duration: 0.6,
                    type: 'spring',
                    stiffness: 120,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 group"
                  style={{ zIndex: 10 }}
                >
                  {/* Particle aura */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 80,
                      height: 80,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: `radial-gradient(circle, rgba(${mood.auraColor},0.15) 0%, transparent 70%)`,
                    }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Sphere */}
                  <motion.div
                    className={`
                      w-16 h-16 md:w-[72px] md:h-[72px] rounded-full
                      flex items-center justify-center
                      bg-gradient-to-br ${mood.gradient}
                      border border-white/10
                      backdrop-blur-md
                      cursor-pointer
                    `}
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    }}
                  >
                    <span className="text-2xl" style={{ color: mood.color }}>{mood.emoji}</span>
                  </motion.div>

                  {/* Label */}
                  <span className="text-xs text-[#FFF8DC]/60 font-light whitespace-nowrap">{mood.label}</span>

                  {/* Sanskrit tooltip on hover */}
                  <motion.span
                    className="absolute -bottom-8 text-[10px] text-[#d4a44c]/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
                  >
                    {mood.sanskrit}
                  </motion.span>
                </motion.button>
              )
            })}

            {/* Center subtle Om */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#d4a44c]/10 text-4xl pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            >
              ॐ
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected mood — expands to center with pulse */}
      <AnimatePresence>
        {selectedMood && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 relative z-10"
          >
            {(() => {
              const mood = MOODS.find(m => m.id === selectedMood)
              if (!mood) return null
              return (
                <>
                  {/* Expanding aura */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, rgba(${mood.auraColor},0.12) 0%, transparent 70%)`,
                    }}
                    initial={{ width: 80, height: 80 }}
                    animate={{
                      width: [100, 200, 160],
                      height: [100, 200, 160],
                      opacity: [0.8, 0.4, 0.6],
                    }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />

                  {/* Selected sphere */}
                  <motion.div
                    className={`w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${mood.gradient} border border-[#d4a44c]/20 backdrop-blur-md`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="text-3xl" style={{ color: mood.color }}>{mood.emoji}</span>
                  </motion.div>

                  <motion.p
                    className="text-[#FFF8DC]/70 font-light text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
                  >
                    {mood.sanskrit} — {mood.label}
                  </motion.p>
                </>
              )
            })()}

            {/* Composing state */}
            {isComposing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-4"
              >
                {/* Sacred loading — rotating mandala dots */}
                <div className="flex gap-1.5 justify-center mb-3">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#d4a44c]/50"
                      animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <p className="text-[#d4a44c]/50 text-sm font-light italic">
                  Preparing your sacred practice...
                </p>
              </motion.div>
            )}

            {/* AI Greeting after composition */}
            {greeting && !isComposing && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="mt-4 max-w-lg text-center"
              >
                <p
                  className="text-lg text-[#FFF8DC]/70 font-light italic leading-relaxed"
                  style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
                >
                  &ldquo;{greeting}&rdquo;
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
