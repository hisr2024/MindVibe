/**
 * MaxJourneysSheet — Bottom sheet shown when user has 5/5 active journeys.
 * Prompts user to complete or pause a journey before starting a new one.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface MaxJourneysSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function MaxJourneysSheet({ isOpen, onClose }: MaxJourneysSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full rounded-t-3xl bg-[#0B0E2A] border-t border-amber-500/20"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-6 py-5 text-center">
              <div className="text-3xl mb-3">{'\u2694\uFE0F'}</div>
              <h3 className="text-lg font-ui font-bold text-[#EDE8DC] mb-2">
                5 Active Journeys
              </h3>
              <p className="text-sm text-[#B8AE98] font-ui mb-5 leading-relaxed">
                You have reached the maximum of 5 active journeys.
                Complete or pause one to make room for a new path.
              </p>
              <p className="text-[10px] text-[#6B6355] font-ui italic mb-4">
                &quot;Focus on fewer battles to win the war within.&quot;
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#EDE8DC] bg-white/10 active:scale-[0.97] transition-transform"
              >
                Understood
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
