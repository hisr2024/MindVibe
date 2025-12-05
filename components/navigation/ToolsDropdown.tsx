'use client'

import { useState, useRef, useEffect } from 'react'
import { colors } from '@/lib/design-tokens'

export interface ToolItem {
  id: string
  name: string
  description: string
  href: string
  icon: React.ReactNode
}

export interface ToolCategory {
  id: string
  name: string
  items: ToolItem[]
}

export interface ToolsDropdownProps {
  /** Categories of tools to display */
  categories: ToolCategory[]
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
 */
export function ToolsDropdown({ categories, className = '' }: ToolsDropdownProps) {
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

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-2">
            {categories.map((category, categoryIndex) => (
              <div key={category.id}>
                {categoryIndex > 0 && (
                  <div className="my-2 border-t border-gray-100" />
                )}
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {category.name}
                  </span>
                </div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      role="menuitem"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
                        }}
                      >
                        <span className="text-white">{item.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolsDropdown
