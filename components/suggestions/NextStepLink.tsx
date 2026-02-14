'use client'

/**
 * NextStepLink – renders a single subtle text link suggesting the next
 * tool in the healing pathway.
 *
 * Returns null when suggestion is absent or the feature flag is off.
 * No network dependency — works fully offline.
 */

import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { useNextStepStore } from '@/lib/suggestions/store'
import type { Suggestion } from '@/lib/suggestions/nextStep'

interface NextStepLinkProps {
  suggestion: Suggestion | null
}

export function NextStepLink({ suggestion }: NextStepLinkProps) {
  const { t } = useLanguage()
  const enabled = useNextStepStore((s) => s.nextStepSuggestionsEnabled)

  if (!enabled || !suggestion) return null

  return (
    <div className="mt-3 text-right">
      <Link
        href={suggestion.href}
        className="text-xs text-orange-200/60 hover:text-orange-200 transition-colors duration-150"
      >
        {t(suggestion.labelKey, suggestion.labelFallback)}
      </Link>
    </div>
  )
}
