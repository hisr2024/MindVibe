'use client'

import { useEffect, useState } from 'react'

const crisisDirectory: Record<string, { label: string; phone: string; url: string }> = {
  US: { label: '988 Suicide & Crisis Lifeline', phone: '988', url: 'https://988lifeline.org' },
  GB: { label: 'Samaritans UK', phone: '116 123', url: 'https://www.samaritans.org' },
  IN: { label: 'Vandrevala Foundation', phone: '9999 666 555', url: 'https://www.vandrevalafoundation.com' },
  AU: { label: 'Lifeline Australia', phone: '13 11 14', url: 'https://www.lifeline.org.au' },
  CA: { label: 'Talk Suicide Canada', phone: '1-833-456-4566', url: 'https://talksuicide.ca' },
}

export default function CrisisResources() {
  const [region, setRegion] = useState('US')

  useEffect(() => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale
    const regionCode = locale.split('-')[1]?.toUpperCase()
    if (regionCode && crisisDirectory[regionCode]) setRegion(regionCode)
  }, [])

  const resource = crisisDirectory[region]

  return (
    <section className="rounded-3xl border border-orange-500/20 bg-black/50 p-6 text-sm text-orange-100/80 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Crisis support</p>
          <h3 className="text-xl font-semibold text-orange-50">Ground rules and contacts</h3>
          <p>MindVibe is not a substitute for professional care. If you or someone else is in danger, contact a helpline immediately.</p>
        </div>
        <div className="rounded-xl border border-orange-500/25 bg-slate-950/70 px-4 py-3 text-xs text-orange-50">
          <p className="font-semibold">Region-aware contact</p>
          <p>{resource.label}</p>
          <p className="mt-1">Phone: {resource.phone}</p>
          <a className="text-orange-200 underline" href={resource.url} target="_blank" rel="noreferrer">
            Open site
          </a>
        </div>
      </div>
    </section>
  )
}
