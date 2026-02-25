'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
  { href: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: '🚩' },
  { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { href: '/admin/ab-tests', label: 'A/B Tests', icon: '🧪' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📝' },
  { href: '/admin/backend-logs', label: 'Backend Logs', icon: '🖥️' },
  { href: '/admin/export', label: 'Export', icon: '📤' },
  { href: '/admin/kiaan-analytics', label: 'KIAAN Analytics', icon: '🕉️' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar toggle */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-4 border-b border-slate-700 bg-slate-900 px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-[#d4a44c]">MindVibe Admin</span>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-700 bg-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-700 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a44c] to-[#e8b54a] text-slate-900 font-bold">
              MV
            </span>
            <div>
              <p className="text-sm font-semibold text-[#d4a44c]">MindVibe</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#d4a44c]/20 text-[#d4a44c]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
          <Link
            href="/admin/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <span>🚪</span>
            Logout
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="pt-16 lg:pl-64 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
