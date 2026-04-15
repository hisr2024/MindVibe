/**
 * components/legal/PrivacySectionBadge.tsx
 *
 * Compliance-framework badges rendered at the top of the privacy policy.
 * Each badge is a small, high-contrast chip that satisfies WCAG AA on the
 * #0A0A14 background (>= 7:1 text contrast).
 *
 * These are visual trust signals. They carry aria-labels so screen readers
 * announce "Compliant with GDPR" etc. rather than just the acronym.
 */

import type { ReactElement } from 'react'
import type { ComplianceTag } from '@/lib/mdx/privacy'

interface PrivacySectionBadgeProps {
  tag: ComplianceTag
  className?: string
}

interface BadgeStyle {
  label: string
  srLabel: string
  icon: ReactElement
}

const STYLES: Record<ComplianceTag, BadgeStyle> = {
  GDPR: {
    label: 'GDPR',
    srLabel: 'Compliant with the EU General Data Protection Regulation',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <g fill="currentColor">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * Math.PI) / 6
            const x = 12 + Math.cos(angle) * 7
            const y = 12 + Math.sin(angle) * 7
            return <circle key={i} cx={x} cy={y} r="0.9" />
          })}
        </g>
      </svg>
    ),
  },
  CCPA: {
    label: 'CCPA',
    srLabel: 'Compliant with the California Consumer Privacy Act',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
        <path
          d="M12 3 4 6v5c0 4.5 3.2 8.6 8 10 4.8-1.4 8-5.5 8-10V6l-8-3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  Apple: {
    label: 'Apple',
    srLabel: 'Compliant with Apple App Store privacy requirements',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.2 9.2.8 1.1 1.7 2.4 3 2.3 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.6ZM14.2 5.6c.6-.8 1-1.9.9-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.3-.5 2.9-1.3Z" />
      </svg>
    ),
  },
  'Google Play': {
    label: 'Google Play',
    srLabel: 'Compliant with Google Play Data Safety requirements',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M3.6 2.5c-.2.3-.3.7-.3 1.1v16.8c0 .4.1.8.3 1.1l9.6-9.5-9.6-9.5Zm10.9 10.8 2.6 2.6-10.5 6c-.5.3-1 .2-1.4 0l9.3-8.6Zm2.6-2 3.3 1.9c.9.5.9 1.9 0 2.4l-3.3 1.9-2.9-2.8 2.9-3.4Zm-2.6-2L5.2 2.7c.4-.2.9-.3 1.4 0l10.5 6-2.6 2.6Z" />
      </svg>
    ),
  },
}

/**
 * Render a single compliance badge chip.
 *
 * The chip uses a 10% gold fill with a 40% gold border; both test at WCAG AA
 * contrast against the #0A0A14 canvas. Icons are aria-hidden; the wrapper
 * carries the descriptive label.
 */
export function PrivacySectionBadge({ tag, className = '' }: PrivacySectionBadgeProps) {
  const style = STYLES[tag]
  return (
    <span
      role="img"
      aria-label={style.srLabel}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        'border-[rgba(200,168,75,0.4)] bg-[rgba(200,168,75,0.08)]',
        'text-[0.72rem] font-semibold uppercase tracking-[0.14em]',
        'text-[#E8DCC8]',
        className,
      ].join(' ')}
    >
      <span aria-hidden="true" className="text-[#C8A84B]">
        {style.icon}
      </span>
      {style.label}
    </span>
  )
}

interface PrivacyBadgeRowProps {
  tags: ReadonlyArray<ComplianceTag>
  className?: string
}

/** Convenience row — renders all compliance badges with proper spacing. */
export function PrivacyBadgeRow({ tags, className = '' }: PrivacyBadgeRowProps) {
  return (
    <ul
      aria-label="Compliance frameworks"
      className={['flex flex-wrap items-center gap-2', className].join(' ')}
    >
      {tags.map((tag) => (
        <li key={tag} className="list-none">
          <PrivacySectionBadge tag={tag} />
        </li>
      ))}
    </ul>
  )
}

export default PrivacySectionBadge
