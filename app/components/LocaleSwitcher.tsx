'use client'

import { useI18n } from './LocaleProvider'
import { supportedLocales } from '../../lib/i18n/messages'

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="flex items-center gap-2 text-xs text-orange-100/80" aria-label={t('locale.switcher.label')}>
      <span className="font-semibold text-orange-50">{t('locale.switcher.label')}:</span>
      <div className="flex gap-1" role="group" aria-label={t('locale.switcher.label')}>
        {supportedLocales.map(code => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-xl border px-2 py-1 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
              locale === code
                ? 'border-orange-400/70 bg-orange-500/20 text-orange-50'
                : 'border-orange-500/20 bg-black/30 text-orange-100/80 hover:border-orange-400/50'
            }`}
          >
            {code === 'en' ? t('locale.switcher.english') : t('locale.switcher.spanish')}
          </button>
        ))}
      </div>
    </div>
  )
}
