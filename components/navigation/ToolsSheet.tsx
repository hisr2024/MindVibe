'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TOOLS_BY_CATEGORY, type ToolConfig } from '@/lib/constants/tools'

export interface ToolsSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Callback when the sheet should close */
  onClose: () => void
  /** Optional className for styling */
  className?: string
}

/**
 * ToolsSheet component for mobile tools bottom sheet.
 *
 * Features:
 * - Bottom sheet slide-up animation
 * - Tools organized by category
 * - Touch-friendly tap targets
 * - Backdrop click to close
 * - Escape key to close
 */
export function ToolsSheet({ isOpen, onClose, className = '' }: ToolsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-orange-500/20 bg-gradient-to-b from-[#0f0f14] to-[#0b0b0f] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label="Tools menu"
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-white/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 pb-3">
          <h2 className="text-lg font-semibold text-orange-50">All Tools</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close tools menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+80px)] pt-4">
          {TOOLS_BY_CATEGORY.map((category, categoryIndex) => (
            <div key={category.id} className={categoryIndex > 0 ? 'mt-6' : ''}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-100/50">
                {category.name}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {category.tools.map((tool: ToolConfig) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl border border-orange-500/25 bg-[#0f0f14] p-3 transition-all duration-200 hover:border-orange-400/50 hover:bg-[#141419] active:scale-[0.98]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-lg">
                      {tool.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-orange-50">
                        {tool.title}
                      </p>
                      {tool.badge && (
                        <span className="mt-0.5 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ToolsSheet
