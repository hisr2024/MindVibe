'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TOOLS_BY_CATEGORY, CORE_TOOLS, type ToolConfig } from '@/lib/constants/tools'
import { useLanguage } from '@/hooks/useLanguage'

export interface ToolItem {
  id: string
  name: string
  description: string
  href: string
  icon: React.ReactNode
  purposeDescKey?: string
}

export interface ToolCategory {
  id: string
  name: string
  items: ToolItem[]
}

export interface ToolsDropdownProps {
  /** Categories of tools to display (optional - uses defaults from constants) */
  categories?: ToolCategory[]
  /** Optional className for styling */
  className?: string
}

/**
 * ToolsDropdown component for organized display of guidance engines and karma tools.
 *
 * Features:
 * - Clean categorization with icons
 * - Keyboard navigation support
 * - Focus trap when open
 * - Click outside to close
 * - MindVibe dark theme styling
 */
export function ToolsDropdown({ categories, className = '' }: ToolsDropdownProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Use provided categories or convert from TOOLS_BY_CATEGORY
  const displayCategories: ToolCategory[] = categories || TOOLS_BY_CATEGORY.filter(
    cat => cat.id === 'guidance' || cat.id === 'karma'
  ).map(cat => ({
    id: cat.id,
    name: cat.name,
    items: cat.tools.map((tool: ToolConfig) => ({
      id: tool.id,
      name: tool.title,
      description: tool.description,
      href: tool.href,
      icon: <span className="text-base">{tool.icon}</span>,
      purposeDescKey: tool.purposeDescKey,
    })),
  }))

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#d4a44c] focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Tools
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#d4a44c]/20 bg-[#0f0f14] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-2">
            {/* Featured: KIAAN Vibe Player */}
            {(() => {
              const vibePlayer = CORE_TOOLS.find(t => t.id === 'kiaan-vibe-player')
              if (!vibePlayer) return null
              return (
                <div className="mb-2">
                  <Link
                    href={vibePlayer.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#d4a44c]/10 to-amber-500/5 border border-[#d4a44c]/20 px-3 py-3 transition-all hover:border-[#d4a44c]/40 hover:from-[#d4a44c]/15 hover:to-amber-500/10"
                    role="menuitem"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a44c]/25 to-amber-600/20 text-xl shadow-sm border border-[#d4a44c]/15">
                      {vibePlayer.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#f5f0e8]">{vibePlayer.title}</span>
                        {vibePlayer.badge && (
                          <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white">
                            {vibePlayer.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#f5f0e8]/50">{vibePlayer.description}</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]/40 group-hover:text-[#d4a44c] transition-colors flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </Link>
                </div>
              )
            })()}

            {displayCategories.map((category, categoryIndex) => (
              <div key={category.id}>
                {categoryIndex > 0 && (
                  <div className="my-2 border-t border-white/5" />
                )}
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#f5f0e8]/50">
                    {category.name}
                  </span>
                </div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                      role="menuitem"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/20">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#f5f0e8]">
                          {item.name}
                        </div>
                        <div className="text-xs text-[#f5f0e8]/60">
                          {item.description}
                        </div>
                        {item.purposeDescKey && (
                          <div className="text-[10px] text-[#e8b54a]/40 truncate">
                            {t(`dashboard.tool_desc.${item.purposeDescKey}`, '')}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* About Tools Link */}
            <div className="mt-2 border-t border-white/5 pt-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#f5f0e8]/70 transition hover:bg-white/5 hover:text-[#f5f0e8]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                View All Tools
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolsDropdown
