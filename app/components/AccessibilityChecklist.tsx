'use client'

import { useI18n } from './LocaleProvider'

const checklist = [
  'Semantic headings with skip links for quick navigation.',
  'WCAG-friendly contrast, focus states, and reduced motion toggles.',
  'ARIA labels on navigation, buttons, and status messaging.',
  'Keyboard-friendly forms with visible focus and error states.',
]

export default function AccessibilityChecklist() {
  const { t } = useI18n()

  return (
    <section
      className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-50 shadow-[0_16px_80px_rgba(74,222,128,0.14)]"
      aria-labelledby="accessibility-heading"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/30 text-lg font-bold text-emerald-950">
          A11y
        </div>
        <div className="space-y-2">
          <h2 id="accessibility-heading" className="text-lg font-semibold">
            {t('insights.title')}
          </h2>
          <p className="text-sm text-emerald-50/90">
            Audited for clarity, safety, and translated nav/footer strings so every user can orient quickly.
          </p>
          <ul className="space-y-1 text-sm" aria-label="Accessibility checklist">
            {checklist.map(item => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-emerald-200">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
