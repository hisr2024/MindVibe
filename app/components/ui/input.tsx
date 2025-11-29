import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-calm-200 bg-white/80 dark:bg-ink-200/30 dark:border-ink-300/60 px-4 text-base text-ink-100 placeholder:text-ink-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calm-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-50',
        className,
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
