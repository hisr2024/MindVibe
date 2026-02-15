/**
 * Centralized Pathway Map configuration.
 *
 * Defines the five-step healing pathway:
 *   Pause → Understand → Converse → Apply → Train
 *
 * Each step maps to a tool page. Labels and aria text are resolved
 * via i18n keys at render time so this module stays locale-agnostic.
 */

export interface PathwayStep {
  /** Unique identifier used for i18n key lookup and tests. */
  id: string
  /** i18n key for the user-visible label (e.g. "Pause"). */
  labelKey: string
  /** English fallback when the i18n key is missing. */
  labelFallback: string
  /** Route the step links to. */
  href: string
}

/**
 * Ordered pathway steps.  The array order is the display order.
 */
export const PATHWAY_STEPS: readonly PathwayStep[] = [
  {
    id: 'pause',
    labelKey: 'navigation.pathway.pause',
    labelFallback: 'Pause',
    href: '/viyog',
  },
  {
    id: 'understand',
    labelKey: 'navigation.pathway.understand',
    labelFallback: 'Understand',
    href: '/ardha',
  },
  {
    id: 'converse',
    labelKey: 'navigation.pathway.converse',
    labelFallback: 'Converse',
    href: '/kiaan/chat',
  },
  {
    id: 'apply',
    labelKey: 'navigation.pathway.apply',
    labelFallback: 'Apply',
    href: '/relationship-compass',
  },
  {
    id: 'train',
    labelKey: 'navigation.pathway.train',
    labelFallback: 'Train',
    href: '/journeys',
  },
] as const

/** i18n key for the "You are here" aria label on the active step. */
export const PATHWAY_YOU_ARE_HERE_KEY = 'navigation.pathway.you_are_here'
export const PATHWAY_YOU_ARE_HERE_FALLBACK = 'You are here'

/** i18n key for the nav landmark label. */
export const PATHWAY_NAV_LABEL_KEY = 'navigation.pathway.nav_label'
export const PATHWAY_NAV_LABEL_FALLBACK = 'Healing pathway'
