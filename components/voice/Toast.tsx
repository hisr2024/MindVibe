/**
 * Toast - Lightweight notification for voice companion actions
 *
 * Shows brief, self-dismissing notifications for:
 * - Copied to clipboard
 * - Saved to reflections
 * - Conversation exported
 */

'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

interface ToastItem {
  id: number
  message: string
  icon?: 'check' | 'copy' | 'save' | 'share' | 'error'
}

interface ToastContextValue {
  show: (message: string, icon?: ToastItem['icon']) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useCallback(() => Date.now() + Math.random(), [])

  const show = useCallback((message: string, icon?: ToastItem['icon']) => {
    const id = nextId()
    setToasts(prev => [...prev.slice(-2), { id, message, icon: icon || 'check' }])
  }, [nextId])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastBubble key={toast.id} toast={toast} onDone={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastBubble({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 200)
    }, 2200)
    return () => clearTimeout(timer)
  }, [onDone])

  const iconSvg = {
    check: <path d="M20 6L9 17l-5-5" />,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    save: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
    error: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>,
  }

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={toast.icon === 'error' ? '#ef4444' : '#34d399'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {iconSvg[toast.icon || 'check']}
      </svg>
      <span className="text-xs text-white/80 font-medium">{toast.message}</span>
    </div>
  )
}
