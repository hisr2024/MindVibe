'use client'

import * as React from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { motion, AnimatePresence } from 'framer-motion'

interface HoverCardProps {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  openDelay?: number
  closeDelay?: number
}

export function HoverCard({
  trigger,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  openDelay = 200,
  closeDelay = 100,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <HoverCardPrimitive.Root
      openDelay={openDelay}
      closeDelay={closeDelay}
      onOpenChange={setIsOpen}
    >
      <HoverCardPrimitive.Trigger asChild>
        {trigger}
      </HoverCardPrimitive.Trigger>
      <AnimatePresence>
        {isOpen && (
          <HoverCardPrimitive.Portal forceMount>
            <HoverCardPrimitive.Content
              side={side}
              align={align}
              sideOffset={sideOffset}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: side === 'bottom' ? -4 : 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: side === 'bottom' ? -4 : 4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="z-50 w-72 rounded-xl border border-orange-500/20 bg-slate-900/95 p-4 shadow-xl shadow-orange-500/10 backdrop-blur-sm"
              >
                {children}
                <HoverCardPrimitive.Arrow className="fill-slate-900/95" />
              </motion.div>
            </HoverCardPrimitive.Content>
          </HoverCardPrimitive.Portal>
        )}
      </AnimatePresence>
    </HoverCardPrimitive.Root>
  )
}

interface HoverCardTitleProps {
  children: React.ReactNode
  className?: string
}

export function HoverCardTitle({ children, className = '' }: HoverCardTitleProps) {
  return (
    <h4 className={`text-sm font-semibold text-orange-50 ${className}`}>
      {children}
    </h4>
  )
}

interface HoverCardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function HoverCardDescription({ children, className = '' }: HoverCardDescriptionProps) {
  return (
    <p className={`mt-1 text-xs text-orange-100/70 leading-relaxed ${className}`}>
      {children}
    </p>
  )
}

export default HoverCard
