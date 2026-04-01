/**
 * MobileStreakCard — Streak count + 14-day practice heatmap.
 */

'use client'

import { motion } from 'framer-motion'

interface MobileStreakCardProps {
  currentStreak: number
  bestStreak?: number
  totalDaysPracticed: number
}

/** Generate a simple 14-day heatmap based on streak and total days. */
function generateHeatmap(streak: number, totalDays: number): boolean[] {
  // Approximate: last `streak` days are practiced, fill remaining from totalDays
  const days: boolean[] = new Array(14).fill(false)
  // Mark the most recent `streak` days as practiced (right-aligned)
  for (let i = 0; i < Math.min(streak, 14); i++) {
    days[13 - i] = true
  }
  // Fill additional practiced days from the left (older days)
  const remaining = Math.min(totalDays - streak, 14 - streak)
  let filled = 0
  for (let i = 0; i < 14 && filled < remaining; i++) {
    if (!days[i]) {
      // ~60% chance of having practiced on a past day
      if (Math.sin(i * 7 + totalDays) > -0.2) {
        days[i] = true
        filled++
      }
    }
  }
  return days
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function MobileStreakCard({
  currentStreak,
  bestStreak = 0,
  totalDaysPracticed,
}: MobileStreakCardProps) {
  const heatmap = generateHeatmap(currentStreak, totalDaysPracticed)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        {/* Left: Streak number */}
        <div className="flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {'\uD83D\uDD25'}
          </motion.span>
          <div>
            <div className="font-divine text-4xl font-light text-[#F97316]">
              {currentStreak}
            </div>
            <div className="text-[10px] text-white/50 font-ui">Day streak</div>
            {bestStreak > 0 && (
              <div className="text-[9px] text-white/35 font-ui">
                Best: {bestStreak} days
              </div>
            )}
          </div>
        </div>

        {/* Right: 14-day heatmap (2 rows x 7 cols) */}
        <div className="flex flex-col gap-1">
          {/* Day labels */}
          <div className="flex gap-1">
            {DAY_LABELS.map((label, i) => (
              <div
                key={`label-${i}`}
                className="w-5 text-center text-[7px] text-white/30 font-ui"
              >
                {label}
              </div>
            ))}
          </div>
          {/* Heatmap rows */}
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-1">
              {heatmap.slice(row * 7, row * 7 + 7).map((practiced, col) => {
                const dayIndex = row * 7 + col
                const isToday = dayIndex === 13
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15, delay: dayIndex * 0.01 }}
                    className="w-5 h-5 rounded"
                    style={{
                      backgroundColor: practiced
                        ? 'rgba(212, 160, 23, 0.5)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isToday
                        ? '2px solid rgba(212, 160, 23, 0.8)'
                        : '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
