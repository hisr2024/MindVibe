import type { ReactNode } from 'react'

export const metadata = {
  title: 'Guided Flows | MindVibe',
  description: 'Dedicated pages that keep each guided flow focused and functional.',
}

export default function FlowsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#050507] to-[#120907] text-[#f5f0e8]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#d4a44c]/30 via-[#ff9933]/16 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-80 w-80 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-[#d4a44c]/12 to-transparent blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-10">
        {children}
      </div>
    </main>
  )
}
