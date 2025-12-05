import type { ReactNode } from 'react'

export const metadata = {
  title: 'Talk to KIAAN | MindVibe',
  description: 'Your calm AI companion for guidance and reflection.',
}

export default function KiaanLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
