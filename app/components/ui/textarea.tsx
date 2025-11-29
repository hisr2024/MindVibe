import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-calm-200 bg-white/80 dark:bg-ink-200/30 dark:border-ink-300/60 px-4 py-3 text-base text-ink-100 placeholder:text-ink-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calm-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-50',
        className,
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
