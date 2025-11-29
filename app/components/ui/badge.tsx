import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-calm-100 text-ink-100 dark:bg-ink-300/50 dark:text-calm-50 px-3 py-1 text-xs font-semibold tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  )
}
