'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegister() {
  const [status, setStatus] = useState<'idle' | 'registered' | 'error'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => setStatus('registered'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="sr-only" aria-live="polite">
      {status === 'registered' && 'Service worker registered for offline support.'}
      {status === 'error' && 'Service worker registration failed.'}
    </div>
  )
}
