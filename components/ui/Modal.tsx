'use client'

import { type ReactNode, useEffect, useRef, useState, useCallback } from 'react'
import { Portal } from './Portal'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/mobile/bodyScrollLock'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  closeOnOutsideClick?: boolean
  /** Z-index for the modal (default: 70 per z-index system) */
  zIndex?: number
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOutsideClick = true,
  zIndex = 70,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(open)

  // Handle visibility and body scroll lock
  useEffect(() => {
    if (open) {
      lockBodyScroll()
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      unlockBodyScroll()
      return () => clearTimeout(timer)
    }
    return () => {
      unlockBodyScroll()
    }
  }, [open])

  // Sync open -> isVisible during render (React recommended pattern for prop-to-state)
  if (open && !isVisible) {
    setIsVisible(true)
  }

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  // Handle outside click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOutsideClick && event.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <Portal>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`overlay-modal transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          style={{
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div
          ref={contentRef}
          className={`relative w-full ${sizeStyles[size]} rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#0d0b08] via-[#0a0a12] to-[#080810] shadow-[0_24px_100px_rgba(212,164,76,0.12)] transition-transform duration-200 ${
            open ? 'scale-100' : 'scale-95'
          }`}
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#f5f0e8]/70 transition hover:bg-[#d4a44c]/10 hover:text-[#f5f0e8]"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Header */}
          {(title || description) && (
            <div className="p-6 pb-0">
              {title && (
                <h2 id="modal-title" className="text-xl font-semibold text-orange-50 pr-8">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-2 text-sm text-orange-100/70">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default Modal
