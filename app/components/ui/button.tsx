'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calm-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none ring-offset-white dark:ring-offset-ink-50',
  {
    variants: {
      variant: {
        default: 'bg-ink-500 text-white hover:bg-ink-600 shadow-soft',
        secondary: 'bg-calm-100 text-ink-100 hover:bg-calm-200 border border-calm-200 text-sm',
        ghost: 'bg-transparent text-ink-100 hover:bg-calm-100/60 dark:hover:bg-ink-300/40 border border-transparent',
        outline: 'border border-calm-300 dark:border-ink-400 text-ink-100 dark:text-calm-50 hover:bg-calm-100/70 dark:hover:bg-ink-300/30',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-5 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as never}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
