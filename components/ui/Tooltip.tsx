'use client'

import { type ReactNode, useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const sideStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent',
}

export function Tooltip({ content, children, side = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 ${sideStyles[side]} pointer-events-none`}
        >
          <div className="rounded-lg bg-slate-900 border border-orange-500/20 px-3 py-2 text-xs text-orange-50 shadow-lg shadow-orange-500/10 whitespace-nowrap">
            {content}
          </div>
          <div className={`absolute border-4 ${arrowStyles[side]}`} />
        </div>
      )}
    </div>
  )
}

export default Tooltip
