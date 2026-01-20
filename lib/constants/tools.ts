/**
 * MindVibe Tool Configuration
 *
 * Configuration data for all tools in the MindVibe ecosystem.
 * Organized by category: Core, Community & Insights, Guidance, Karma, and Quick Access.
 */

export type ToolBadge = 'new' | 'premium' | 'beta'

export interface ToolConfig {
  id: string
  icon: string
  title: string
  description: string
  gradient: string
  href: string
  badge?: ToolBadge
  disabled?: boolean
  adminOnly?: boolean
}

export interface ToolCategory {
  id: string
  name: string
  tools: ToolConfig[]
}

/**
 * Core Tools - Essential features for everyday use
 */
export const CORE_TOOLS: ToolConfig[] = [
  {
    id: 'kiaan',
    icon: '💬',
    title: 'KIAAN Chat',
    description: 'AI mental health companion',
    gradient: 'from-blue-400/30 to-purple-400/30',
    href: '/#kiaan-chat',
  },
  {
    id: 'kiaan-voice',
    icon: '🎙️',
    title: 'KIAAN Voice',
    description: 'Voice-activated wisdom guide',
    gradient: 'from-orange-400/30 to-amber-400/30',
    href: '/kiaan/voice',
    badge: 'new',
  },
  {
    id: 'journal',
    icon: '📝',
    title: 'Private Journal',
    description: 'Encrypted journaling',
    gradient: 'from-amber-400/30 to-orange-400/30',
    href: '/sacred-reflections', // Same page as Sacred Reflections - encrypted journaling feature
  },
  {
    id: 'wisdom',
    icon: '🌍',
    title: 'Wisdom Rooms',
    description: 'Ancient wisdom',
    gradient: 'from-violet-400/30 to-indigo-400/30',
    href: '/wisdom-rooms',
  },
  {
    id: 'insights',
    icon: '📊',
    title: 'Mood Insights',
    description: 'Emotional patterns',
    gradient: 'from-teal-400/30 to-cyan-400/30',
    href: '/dashboard/analytics',
  },
]

/**
 * Community & Insights Tools - Social features and advanced analytics
 */
export const COMMUNITY_TOOLS: ToolConfig[] = [
  {
    id: 'community-circles',
    icon: '🤝',
    title: 'Community Circles',
    description: 'Anonymous peer support',
    gradient: 'from-pink-400/30 to-rose-400/30',
    href: '/community',
    badge: 'new',
  },
  {
    id: 'ai-insights',
    icon: '🧠',
    title: 'AI Insights',
    description: 'Predictive wellness AI',
    gradient: 'from-purple-400/30 to-pink-400/30',
    href: '/analytics',
    badge: 'new',
  },
  {
    id: 'emotion-themes',
    icon: '🎨',
    title: 'Emotion Themes',
    description: 'Mood-adaptive interface',
    gradient: 'from-indigo-400/30 to-purple-400/30',
    href: '/settings#themes',
    badge: 'new',
  },
]

/**
 * Guidance Engines - Specialized assistants for different situations
 */
export const GUIDANCE_TOOLS: ToolConfig[] = [
  {
    id: 'viyog',
    icon: '🎯',
    title: 'Viyoga',
    description: 'Outcome anxiety reducer',
    gradient: 'from-cyan-400/30 to-blue-400/30',
    href: '/tools/viyog',
    badge: 'new',
  },
  {
    id: 'ardha',
    icon: '🔄',
    title: 'Ardha',
    description: 'Ancient wisdom reframing',
    gradient: 'from-amber-400/30 to-yellow-400/30',
    href: '/tools/ardha',
  },
  {
    id: 'relationship-compass',
    icon: '🧭',
    title: 'Relationship Compass',
    description: 'Calm conflict guidance',
    gradient: 'from-rose-400/30 to-orange-400/30',
    href: '/tools/relationship-compass',
  },
]

/**
 * Karma & Growth Tools - Progress tracking and emotional processing
 */
export const KARMA_TOOLS: ToolConfig[] = [
  {
    id: 'karmic-tree',
    icon: '🌱',
    title: 'Karmic Tree',
    description: 'Visual progress tracking',
    gradient: 'from-green-400/30 to-emerald-400/30',
    href: '/tools/karmic-tree',
  },
  {
    id: 'karma-footprint',
    icon: '👣',
    title: 'Karma Footprint',
    description: 'Daily action reflection',
    gradient: 'from-lime-400/30 to-green-400/30',
    href: '/tools/karma-footprint',
  },
  {
    id: 'karma-reset',
    icon: '💚',
    title: 'Karma Reset',
    description: 'Heal relational harm',
    gradient: 'from-emerald-400/30 to-teal-400/30',
    href: '/tools/karma-reset',
    badge: 'new',
  },
  {
    id: 'emotional-reset',
    icon: '💫',
    title: 'Emotional Reset',
    description: '7-step guided processing',
    gradient: 'from-orange-400/30 to-amber-300/30',
    href: '/tools/emotional-reset',
  },
]

/**
 * Quick Access Tools - Settings and admin
 */
export const QUICK_ACCESS_TOOLS: ToolConfig[] = [
  {
    id: 'profile',
    icon: '⚙️',
    title: 'Profile & Settings',
    description: 'User preferences',
    gradient: 'from-slate-400/30 to-zinc-400/30',
    href: '/profile',
  },
  {
    id: 'subscription',
    icon: '💳',
    title: 'Subscription',
    description: 'Manage your plan',
    gradient: 'from-violet-400/30 to-fuchsia-400/30',
    href: '/subscription/success',
  },
  {
    id: 'about',
    icon: 'ℹ️',
    title: 'About MindVibe',
    description: 'Platform information',
    gradient: 'from-sky-400/30 to-blue-400/30',
    href: '/about',
  },
  {
    id: 'analytics-admin',
    icon: '📈',
    title: 'Analytics Dashboard',
    description: 'Usage insights',
    gradient: 'from-pink-400/30 to-rose-400/30',
    href: '/admin',
    adminOnly: true,
  },
  {
    id: 'sacred-reflections',
    icon: '🙏',
    title: 'Sacred Reflections',
    description: 'Spiritual journaling',
    gradient: 'from-purple-400/30 to-indigo-400/30',
    href: '/sacred-reflections', // Same page as Private Journal - spiritual/encrypted journaling
  },
]

/**
 * All tools organized by category for the tools dropdown and sheet
 */
export const TOOLS_BY_CATEGORY: ToolCategory[] = [
  {
    id: 'core',
    name: 'Core Tools',
    tools: CORE_TOOLS,
  },
  {
    id: 'community',
    name: 'Community & Insights',
    tools: COMMUNITY_TOOLS,
  },
  {
    id: 'guidance',
    name: 'Guidance Engines',
    tools: GUIDANCE_TOOLS,
  },
  {
    id: 'karma',
    name: 'Karma & Growth',
    tools: KARMA_TOOLS,
  },
  {
    id: 'quick-access',
    name: 'Quick Access',
    tools: QUICK_ACCESS_TOOLS,
  },
]

/**
 * All tools as a flat array
 */
export const ALL_TOOLS: ToolConfig[] = [
  ...CORE_TOOLS,
  ...COMMUNITY_TOOLS,
  ...GUIDANCE_TOOLS,
  ...KARMA_TOOLS,
  ...QUICK_ACCESS_TOOLS,
]

export default TOOLS_BY_CATEGORY
