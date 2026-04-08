/**
 * WisdomTab — Daily Gita teaching: serene contemplation screen
 * with Sanskrit reveal, KIAAN reflection, 7-day archive, and actions.
 */

'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { getDailyWisdom } from '@/utils/voice/dailyWisdom'
import { DailyWisdomCardMobile } from '../components/DailyWisdomCardMobile'
import { WisdomCardSkeleton } from '../skeletons/WisdomCardSkeleton'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WisdomTab() {
  const todayVerse = useMemo(() => getDailyWisdom(), [])
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 mb-5"
      >
        <h1
          className="font-divine text-[22px] italic text-[#D4A017]"
          style={{ textShadow: '0 0 16px rgba(212,160,23,0.2)' }}
        >
          {'\u0906\u091C \u0915\u093E \u091C\u094D\u091E\u093E\u0928'}
        </h1>
        <p className="text-xs text-[#B8AE98] font-ui mt-1">
          Today&apos;s Divine Wisdom
        </p>
        <p className="text-[9px] text-[#6B6355] font-ui mt-0.5">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </motion.div>

      {/* Daily Wisdom Card (hero) */}
      {todayVerse ? (
        <DailyWisdomCardMobile verse={todayVerse} />
      ) : (
        <WisdomCardSkeleton />
      )}

      {/* 7-day archive */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-3">
          This Week&apos;s Teachings
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayOffset = -(6 - i)
            const date = new Date()
            date.setDate(date.getDate() + dayOffset)
            const dow = date.getDay()
            const isToday = dayOffset === 0
            const isExpanded = expandedDay === i

            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                onClick={() => setExpandedDay(isExpanded ? null : i)}
                className="flex-shrink-0 w-[100px] rounded-xl flex flex-col items-center justify-center transition-all"
                style={{
                  height: isExpanded ? 100 : 80,
                  border: isToday
                    ? '1.5px solid rgba(212,160,23,0.5)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: isToday
                    ? 'rgba(212,160,23,0.08)'
                    : 'rgba(255,255,255,0.02)',
                }}
              >
                <span className="text-[9px] text-[#6B6355] font-ui">
                  {DAY_NAMES[dow]}
                </span>
                <span className="text-[11px] text-[#B8AE98] font-ui mt-0.5">
                  {date.getDate()}
                </span>
                {isToday && todayVerse ? (
                  <span className="text-[9px] text-[#D4A017] font-ui mt-1">
                    BG {todayVerse.chapter}.{todayVerse.verse}
                  </span>
                ) : (
                  <span className="text-[8px] text-[#6B6355]/60 font-ui mt-1 italic">
                    {isToday ? 'Today' : 'Past'}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.section>

      {/* Contemplation footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 text-center"
      >
        <p
          className="text-[10px] text-[#D4A017]/30 font-divine italic"
          style={{ fontFamily: '"Noto Sans Devanagari", "Cormorant Garamond", serif' }}
        >
          {'\u0905\u092D\u094D\u092F\u093E\u0938\u0947\u0928 \u0924\u0941 \u0915\u094C\u0928\u094D\u0924\u0947\u092F \u0935\u0948\u0930\u093E\u0917\u094D\u092F\u0947\u0923 \u091A \u0917\u0943\u0939\u094D\u092F\u0924\u0947'}
        </p>
        <p className="text-[9px] text-[#6B6355]/60 font-ui mt-1">
          &quot;Through practice and detachment, the restless mind can be mastered.&quot; — BG 6.35
        </p>
      </motion.div>
    </div>
  )
}
