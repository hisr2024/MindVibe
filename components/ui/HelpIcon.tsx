'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'

interface HelpIconProps {
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function HelpIcon({ content, side = 'top', size = 'md', className = '' }: HelpIconProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <TooltipPrimitive.Root onOpenChange={setIsOpen}>
      <TooltipPrimitive.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full text-[#d4a44c]/70 hover:text-[#d4a44c] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 ${className}`}
          aria-label="More information"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={sizeStyles[size]}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </TooltipPrimitive.Trigger>
      <AnimatePresence>
        {isOpen && (
          <TooltipPrimitive.Portal forceMount>
            <TooltipPrimitive.Content
              side={side}
              sideOffset={6}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="z-50 max-w-xs rounded-lg border border-[#d4a44c]/20 bg-slate-900 px-3 py-2 text-xs text-[#f5f0e8]/90 shadow-lg shadow-[#d4a44c]/10"
              >
                {content}
                <TooltipPrimitive.Arrow className="fill-slate-900" />
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Root>
  )
}

export default HelpIcon
