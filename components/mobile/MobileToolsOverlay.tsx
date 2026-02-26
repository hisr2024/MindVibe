'use client'

/**
 * MobileToolsOverlay Component
 *
 * A slide-up overlay (bottom sheet) for the mobile UI that provides
 * quick access to MindVibe's spiritual wellness tools:
 * - Viyoga (Detachment Coach)
 * - Ardha (Cognitive Reframing)
 * - Relationship Compass
 * - Emotional Reset
 * - Karmic Reset
 *
 * Uses the existing MobileBottomSheet for consistent UX and haptics.
 */

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Leaf,
  Flame,
  Users,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

import { MobileBottomSheet } from './MobileBottomSheet'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

/** Tool definition for the overlay */
interface OverlayTool {
  id: string
  label: string
  description: string
  icon: React.ElementType
  href: string
  gradient: string
  iconColor: string
  accentBorder: string
}

/** The five spiritual wellness tools shown in the overlay */
const OVERLAY_TOOLS: OverlayTool[] = [
  {
    id: 'viyoga',
    label: 'Viyoga',
    description: 'Practice sacred detachment from outcomes',
    icon: Leaf,
    href: '/tools/viyoga',
    gradient: 'from-green-500/15 to-emerald-500/10',
    iconColor: 'text-green-400',
    accentBorder: 'border-green-500/20',
  },
  {
    id: 'ardha',
    label: 'Ardha',
    description: 'Cognitive reframing with Gita wisdom',
    icon: Flame,
    href: '/tools/ardha',
    gradient: 'from-red-500/15 to-[#d4a44c]/10',
    iconColor: 'text-red-400',
    accentBorder: 'border-red-500/20',
  },
  {
    id: 'relationship-compass',
    label: 'Relationship Compass',
    description: 'Navigate relationships with clarity',
    icon: Users,
    href: '/tools/relationship-compass',
    gradient: 'from-pink-500/15 to-rose-500/10',
    iconColor: 'text-pink-400',
    accentBorder: 'border-pink-500/20',
  },
  {
    id: 'emotional-reset',
    label: 'Emotional Reset',
    description: '7-step flow to restore inner peace',
    icon: RefreshCw,
    href: '/tools/emotional-reset',
    gradient: 'from-blue-500/15 to-indigo-500/10',
    iconColor: 'text-blue-400',
    accentBorder: 'border-blue-500/20',
  },
  {
    id: 'karmic-reset',
    label: 'Karmic Reset',
    description: 'Heal relational harm with compassion',
    icon: Sparkles,
    href: '/tools/karma-reset',
    gradient: 'from-[#d4a44c]/15 to-yellow-500/10',
    iconColor: 'text-[#d4a44c]',
    accentBorder: 'border-[#d4a44c]/20',
  },
]

export interface MobileToolsOverlayProps {
  /** Whether the overlay is open */
  isOpen: boolean
  /** Callback when overlay should close */
  onClose: () => void
}

export function MobileToolsOverlay({ isOpen, onClose }: MobileToolsOverlayProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  const handleToolPress = useCallback(
    (href: string) => {
      triggerHaptic('selection')
      onClose()
      // Small delay so the sheet close animation starts before navigation
      setTimeout(() => {
        router.push(href)
      }, 150)
    },
    [router, triggerHaptic, onClose]
  )

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Spiritual Tools"
      subtitle="Sacred instruments for inner peace"
      showHandle
      showCloseButton
      height="auto"
      dismissible
      zIndex={70}
    >
      <div className="space-y-2 pb-2">
        {OVERLAY_TOOLS.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + index * 0.06, duration: 0.3, ease: 'easeOut' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleToolPress(tool.href)}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl text-left
              bg-gradient-to-r ${tool.gradient}
              border ${tool.accentBorder}
              active:scale-[0.98] transition-transform
            `}
            aria-label={`Open ${tool.label}`}
          >
            {/* Icon container */}
            <div
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                bg-white/[0.06]
              `}
            >
              <tool.icon className={`w-6 h-6 ${tool.iconColor}`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{tool.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {tool.description}
              </p>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </MobileBottomSheet>
  )
}

export default MobileToolsOverlay
