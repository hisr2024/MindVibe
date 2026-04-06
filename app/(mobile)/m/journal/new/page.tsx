'use client'

/**
 * Deep-link entry point that opens the journal on the Editor tab.
 * Used by KIAAN and other surfaces to hand-off into a new reflection.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JournalNewPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/m/journal#editor')
  }, [router])
  return null
}
