'use client'

/**
 * Mobile Tools Page
 *
 * Hub for all MindVibe spiritual and spiritual wellness tools.
 * Organized by category with quick access and descriptions.
 */

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Flame,
  Leaf,
  TreePine,
  Footprints,
  Compass,
  RefreshCw,
  BookOpen,
  Sparkles,
  Users,
  Brain,
  Volume2,
  Lock,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface Tool {
  id: string
  label: string
  description: string
  icon: React.ElementType
  href: string
  gradient: string
  iconColor: string
  premium?: boolean
}

const CORE_TOOLS: Tool[] = [
  {
    id: 'kiaan',
    label: 'KIAAN Chat',
    description: 'AI wisdom companion',
    icon: Sparkles,
    href: '/m/kiaan',
    gradient: 'from-[#d4a44c]/15 to-[#d4a44c]/15',
    iconColor: 'text-[#d4a44c]',
  },
  {
    id: 'journal',
    label: 'Personal Reflections',
    description: 'Write in your journal',
    icon: BookOpen,
    href: '/m/journal',
    gradient: 'from-purple-500/15 to-pink-500/15',
    iconColor: 'text-purple-400',
  },
  {
    id: 'journeys',
    label: 'Wisdom Journeys',
    description: 'Transformational paths',
    icon: Compass,
    href: '/m/journeys',
    gradient: 'from-cyan-500/15 to-blue-500/15',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'gita',
    label: 'Bhagavad Gita',
    description: '700+ verses of wisdom',
    icon: BookOpen,
    href: '/kiaan-vibe/gita',
    gradient: 'from-teal-500/15 to-green-500/15',
    iconColor: 'text-teal-400',
  },
]

const EMOTIONAL_TOOLS: Tool[] = [
  {
    id: 'ardha',
    label: 'Ardha',
    description: 'Transform anger & ego',
    icon: Flame,
    href: '/tools/ardha',
    gradient: 'from-red-500/15 to-[#d4a44c]/15',
    iconColor: 'text-red-400',
  },
  {
    id: 'viyog',
    label: 'Viyoga',
    description: 'Practice detachment',
    icon: Leaf,
    href: '/tools/viyog',
    gradient: 'from-green-500/15 to-emerald-500/15',
    iconColor: 'text-green-400',
  },
  {
    id: 'emotional-reset',
    label: 'Emotional Reset',
    description: 'CBT-based regulation',
    icon: RefreshCw,
    href: '/tools/emotional-reset',
    gradient: 'from-blue-500/15 to-indigo-500/15',
    iconColor: 'text-blue-400',
  },
  {
    id: 'relationship-compass',
    label: 'Relationship Compass',
    description: 'Navigate relationships',
    icon: Users,
    href: '/tools/relationship-compass',
    gradient: 'from-pink-500/15 to-rose-500/15',
    iconColor: 'text-pink-400',
    premium: true,
  },
]

const GROWTH_TOOLS: Tool[] = [
  {
    id: 'karma-footprint',
    label: 'Karma Footprint',
    description: 'Track your impact',
    icon: Footprints,
    href: '/tools/karma-footprint',
    gradient: 'from-[#d4a44c]/15 to-yellow-500/15',
    iconColor: 'text-[#d4a44c]',
  },
  {
    id: 'karmic-tree',
    label: 'Karmic Tree',
    description: 'Visualize progress',
    icon: TreePine,
    href: '/tools/karmic-tree',
    gradient: 'from-emerald-500/15 to-green-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'deep-insights',
    label: 'Deep Insights',
    description: 'Quantum analysis',
    icon: Brain,
    href: '/kiaan/quantum-dive',
    gradient: 'from-violet-500/15 to-purple-500/15',
    iconColor: 'text-violet-400',
    premium: true,
  },
  {
    id: 'voice-companion',
    label: 'Voice Companion',
    description: 'Speak with KIAAN',
    icon: Volume2,
    href: '/companion/voice-companion',
    gradient: 'from-sky-500/15 to-cyan-500/15',
    iconColor: 'text-sky-400',
    premium: true,
  },
]

interface ToolsSectionProps {
  title: string
  tools: Tool[]
  onToolPress: (href: string) => void
  baseDelay: number
}

function ToolsSection({ title, tools, onToolPress, baseDelay }: ToolsSectionProps) {
  return (
    <div>
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: baseDelay + index * 0.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolPress(tool.href)}
            className={`relative p-4 rounded-2xl text-left bg-gradient-to-br ${tool.gradient} border border-white/[0.06]`}
          >
            {tool.premium && (
              <div className="absolute top-2 right-2">
                <Lock className="w-3 h-3 text-[#d4a44c]" />
              </div>
            )}
            <tool.icon className={`w-6 h-6 ${tool.iconColor} mb-2`} />
            <p className="text-sm font-semibold text-white">{tool.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{tool.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function MobileToolsPage() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  const handleToolPress = useCallback((href: string) => {
    triggerHaptic('selection')
    router.push(href)
  }, [router, triggerHaptic])

  return (
    <MobileAppShell
      title="Tools"
      largeTitle
      showBack
      onBack={() => router.back()}
      showTabBar={false}
    >
      <div className="px-4 pb-safe-bottom space-y-6">
        <ToolsSection title="Core" tools={CORE_TOOLS} onToolPress={handleToolPress} baseDelay={0.05} />
        <ToolsSection title="Emotional Wellness" tools={EMOTIONAL_TOOLS} onToolPress={handleToolPress} baseDelay={0.2} />
        <ToolsSection title="Growth & Discovery" tools={GROWTH_TOOLS} onToolPress={handleToolPress} baseDelay={0.35} />
      </div>
    </MobileAppShell>
  )
}
