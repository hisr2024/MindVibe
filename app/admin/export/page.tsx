'use client'

import { useState } from 'react'

export default function AdminExportPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (type: string, format: string) => {
    setExporting(`${type}-${format}`)
    // In production, call API and download file
    setTimeout(() => {
      setExporting(null)
      alert(`${type} exported as ${format.toUpperCase()}`)
    }, 1500)
  }

  const exportOptions = [
    {
      id: 'users',
      title: 'Users',
      description: 'Export user data including email, registration date, and subscription status',
      icon: '👥',
      formats: ['csv', 'json'],
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions',
      description: 'Export subscription data including tiers, status, and payment history',
      icon: '💳',
      formats: ['csv', 'json'],
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Export payment transactions with amounts, dates, and status',
      icon: '💰',
      formats: ['csv', 'json'],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Export aggregated usage analytics (anonymized)',
      icon: '📊',
      formats: ['csv', 'json'],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Data Export</h1>
        <p className="text-sm text-slate-400">
          Export data in various formats for analysis and reporting
        </p>
      </div>

      {/* Export Options */}
      <div className="grid gap-4 md:grid-cols-2">
        {exportOptions.map((option) => (
          <div
            key={option.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{option.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-100">{option.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                <div className="mt-4 flex gap-2">
                  {option.formats.map((format) => (
                    <button
                      key={format}
                      onClick={() => handleExport(option.id, format)}
                      disabled={exporting !== null}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        exporting === `${option.id}-${format}`
                          ? 'bg-[#d4a44c]/50 text-slate-900'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                    >
                      {exporting === `${option.id}-${format}` ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin\" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Exporting...
                        </span>
                      ) : (
                        `Export ${format.toUpperCase()}`
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="rounded-xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <h3 className="font-semibold text-[#d4a44c]">Privacy Notice</h3>
            <ul className="mt-2 space-y-1 text-sm text-[#e8b54a]/80">
              <li>• Exported data is subject to your organization&apos;s data handling policies</li>
              <li>• Sensitive data like passwords are never included in exports</li>
              <li>• KIAAN conversation content is encrypted and NOT exportable</li>
              <li>• All export actions are logged in the audit trail</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h3 className="mb-4 font-semibold text-slate-100">Recent Exports</h3>
        <div className="space-y-3">
          {[
            { type: 'users', format: 'csv', admin: 'admin@mindvibe.life', date: new Date('2026-02-14') },
            { type: 'analytics', format: 'json', admin: 'admin@mindvibe.life', date: new Date('2026-02-13') },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded bg-slate-600 px-2 py-0.5 text-xs uppercase text-slate-300">
                  {item.format}
                </span>
                <span className="text-sm text-slate-200 capitalize">{item.type}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{item.admin}</p>
                <p className="text-xs text-slate-500">{item.date.toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
