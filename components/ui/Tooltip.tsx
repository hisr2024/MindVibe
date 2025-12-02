'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  sideOffset?: number
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export function Tooltip({ content, children, side = 'top', delay = 200, sideOffset = 6 }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root onOpenChange={setIsOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span className="inline-flex cursor-default">{children}</span>
        </TooltipPrimitive.Trigger>
        <AnimatePresence>
          {isOpen && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content
                side={side}
                sideOffset={sideOffset}
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="z-50 max-w-xs rounded-lg border border-orange-500/20 bg-slate-900 px-3 py-2 text-xs text-orange-50 shadow-lg shadow-orange-500/10"
                >
                  {content}
                  <TooltipPrimitive.Arrow className="fill-slate-900" />
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export default Tooltip
