'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { motion, AnimatePresence } from 'framer-motion'

interface DisclosureProps {
  items: {
    id: string
    title: string
    preview?: string
    content: React.ReactNode
  }[]
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
}

export function Disclosure({ items, type = 'single', defaultValue, className = '' }: DisclosureProps) {
  return (
    <AccordionPrimitive.Root
      type={type as 'single'}
      defaultValue={defaultValue as string}
      className={`space-y-2 ${className}`}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className="rounded-2xl border border-orange-500/15 bg-black/40 overflow-hidden"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-orange-500/5">
              <div className="flex-1">
                <span className="text-sm font-semibold text-orange-50">{item.title}</span>
                {item.preview && (
                  <span className="ml-2 text-xs text-orange-100/60">{item.preview}</span>
                )}
              </div>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-orange-400/70 transition-transform group-data-[state=open]:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </motion.svg>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="px-4 pb-4 pt-1 text-sm text-orange-100/80">
              {item.content}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}

interface DisclosureItemProps {
  title: string
  preview?: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function DisclosureItem({ title, preview, children, defaultOpen = false, className = '' }: DisclosureItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={`rounded-2xl border border-orange-500/15 bg-black/40 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-orange-500/5"
      >
        <div className="flex-1">
          <span className="text-sm font-semibold text-orange-50">{title}</span>
          {preview && !isOpen && (
            <span className="ml-2 text-xs text-orange-100/60">{preview}</span>
          )}
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-orange-400/70"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-1 text-sm text-orange-100/80">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Disclosure
