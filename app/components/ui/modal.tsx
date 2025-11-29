'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from './button'

export const Modal = DialogPrimitive.Root
export const ModalTrigger = DialogPrimitive.Trigger
export const ModalClose = DialogPrimitive.Close

export function ModalContent({ className, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink-50/40 dark:bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 w-full max-w-lg rounded-3xl bg-white dark:bg-ink-200/70 border border-calm-200/80 dark:border-ink-300/60 p-6 shadow-soft focus:outline-none',
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          className,
        )}
        {...props}
      >
        <div className="absolute right-4 top-4">
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon" aria-label="Close dialog">
              <X className="h-5 w-5" />
            </Button>
          </DialogPrimitive.Close>
        </div>
        {props.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function ModalTitle({ className, ...props }: DialogPrimitive.DialogTitleProps) {
  return <DialogPrimitive.Title className={cn('text-xl font-semibold text-ink-100 dark:text-calm-50', className)} {...props} />
}

export function ModalDescription({ className, ...props }: DialogPrimitive.DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn('text-sm text-ink-100/75 dark:text-calm-100/80', className)} {...props} />
}
