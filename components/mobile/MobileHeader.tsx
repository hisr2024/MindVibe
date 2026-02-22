'use client'

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { ArrowLeft } from 'lucide-react'

export interface MobileHeaderProps {
  /** Title text */
  title?: string
  /** Subtitle text */
  subtitle?: string
  /** Left action (usually back button) */
  leftAction?: ReactNode
  /** Right actions */
  rightActions?: ReactNode
  /** Whether to show back button */
  showBack?: boolean
  /** Back button click handler */
  onBack?: () => void
  /** Whether header is transparent initially */
  transparent?: boolean
  /** Whether header hides on scroll down */
  hideOnScroll?: boolean
  /** Scroll container ref for scroll-aware behavior */
  scrollContainerRef?: React.RefObject<HTMLElement>
  /** Large title (iOS-style) */
  largeTitle?: boolean
  /** Background blur intensity */
  blurIntensity?: 'none' | 'light' | 'heavy'
  /** Custom className */
  className?: string
  /** Children rendered below title */
  children?: ReactNode
  /** Whether the header is sticky */
  sticky?: boolean
  /** Z-index */
  zIndex?: number
}

export const MobileHeader = forwardRef<HTMLElement, MobileHeaderProps>(
  function MobileHeader(
    {
      title,
      subtitle,
      leftAction,
      rightActions,
      showBack = false,
      onBack,
      transparent = false,
      hideOnScroll = false,
      scrollContainerRef,
      largeTitle = false,
      blurIntensity = 'light',
      className = '',
      children,
      sticky = true,
      zIndex = 40,
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()
    const headerRef = useRef<HTMLElement>(null)
    const [isHidden, setIsHidden] = useState(false)
    const [_isScrolled, setIsScrolled] = useState(false)
    const lastScrollY = useRef(0)

    // Track scroll for hide on scroll behavior
    useEffect(() => {
      if (!hideOnScroll) return

      const container = scrollContainerRef?.current || window
      const handleScroll = () => {
        const scrollY = scrollContainerRef?.current
          ? scrollContainerRef.current.scrollTop
          : window.scrollY

        // Determine scroll direction
        const isScrollingDown = scrollY > lastScrollY.current
        const scrollDelta = Math.abs(scrollY - lastScrollY.current)

        // Only hide/show if scroll is significant
        if (scrollDelta > 10) {
          if (isScrollingDown && scrollY > 60) {
            setIsHidden(true)
          } else if (!isScrollingDown) {
            setIsHidden(false)
          }
        }

        // Track if we've scrolled at all (for background)
        setIsScrolled(scrollY > 10)
        lastScrollY.current = scrollY
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }, [hideOnScroll, scrollContainerRef])

    // Track scroll for background opacity
    const { scrollY } = useScroll({
      ...(scrollContainerRef ? { container: scrollContainerRef } : {}),
    })

    const backgroundOpacity = useTransform(
      scrollY,
      [0, 60],
      transparent ? [0, 1] : [1, 1]
    )

    const borderOpacity = useTransform(scrollY, [0, 60], [0, 1])

    const largeTitleScale = useTransform(scrollY, [0, 80], [1, 0.8])
    const largeTitleOpacity = useTransform(scrollY, [0, 40], [1, 0])
    const smallTitleOpacity = useTransform(scrollY, [20, 60], [0, 1])

    const handleBack = useCallback(() => {
      triggerHaptic('light')
      onBack?.()
    }, [onBack, triggerHaptic])

    const blurClasses = {
      none: '',
      light: 'backdrop-blur-md',
      heavy: 'backdrop-blur-xl',
    }

    return (
      <>
        <motion.header
          ref={(node) => {
            (headerRef as React.MutableRefObject<HTMLElement | null>).current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          animate={{
            y: isHidden ? -100 : 0,
            opacity: isHidden ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`
            ${sticky ? 'fixed' : 'relative'}
            top-0 left-0 right-0
            ${blurClasses[blurIntensity]}
            ${className}
          `.trim()}
          style={{
            zIndex,
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {/* Background */}
          <motion.div
            className="absolute inset-0 bg-[#0b0b0f]/90"
            style={{ opacity: backgroundOpacity }}
          />

          {/* Border */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.08]"
            style={{ opacity: borderOpacity }}
          />

          {/* Content */}
          <div className="relative flex items-center h-14 px-4">
            {/* Left Action */}
            <div className="flex items-center w-12">
              {showBack && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBack}
                  className="
                    w-10 h-10 -ml-2
                    flex items-center justify-center
                    rounded-full
                    hover:bg-white/[0.06]
                    transition-colors
                  "
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
              )}
              {leftAction}
            </div>

            {/* Title (small, centered) */}
            {!largeTitle && title && (
              <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                <h1 className="text-base font-semibold text-white truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-400 truncate">{subtitle}</p>
                )}
              </div>
            )}

            {/* Title (animated for large title mode) */}
            {largeTitle && (
              <motion.div
                className="flex-1 flex items-center justify-center"
                style={{ opacity: smallTitleOpacity }}
              >
                <h1 className="text-base font-semibold text-white truncate">
                  {title}
                </h1>
              </motion.div>
            )}

            {/* Right Actions */}
            <div className="flex items-center justify-end w-12 gap-1">
              {rightActions}
            </div>
          </div>

          {/* Large Title (iOS-style) */}
          {largeTitle && (
            <motion.div
              className="px-4 pb-3"
              style={{
                scale: largeTitleScale,
                opacity: largeTitleOpacity,
                transformOrigin: 'left center',
              }}
            >
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </motion.div>
          )}

          {/* Additional children */}
          {children}
        </motion.header>

        {/* Spacer for fixed positioning */}
        {sticky && (
          <div
            style={{
              height: largeTitle ? 100 : 56,
              paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
          />
        )}
      </>
    )
  }
)

/**
 * Header action button
 */
export interface HeaderActionProps {
  icon: ReactNode
  onClick?: () => void
  'aria-label': string
  badge?: number | boolean
  disabled?: boolean
}

export function HeaderAction({
  icon,
  onClick,
  'aria-label': ariaLabel,
  badge,
  disabled = false,
}: HeaderActionProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        if (disabled) return
        triggerHaptic('selection')
        onClick?.()
      }}
      disabled={disabled}
      className={`
        relative w-10 h-10
        flex items-center justify-center
        rounded-full
        hover:bg-white/[0.06]
        transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      aria-label={ariaLabel}
    >
      <span className="text-white">{icon}</span>

      {badge && (
        <span className="
          absolute top-1 right-1
          min-w-4 h-4 px-1
          rounded-full
          bg-orange-500 text-white text-[10px] font-bold
          flex items-center justify-center
        ">
          {typeof badge === 'number' ? (badge > 9 ? '9+' : badge) : ''}
        </span>
      )}
    </motion.button>
  )
}

/**
 * Search header variant
 */
export interface SearchHeaderProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onBack?: () => void
  onClear?: () => void
  autoFocus?: boolean
  className?: string
}

export function SearchHeader({
  value,
  onChange,
  placeholder = 'Search...',
  onBack,
  onClear,
  autoFocus = true,
  className = '',
}: SearchHeaderProps) {
  const { triggerHaptic } = useHapticFeedback()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    triggerHaptic('light')
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <MobileHeader
      showBack={!!onBack}
      onBack={onBack}
      className={className}
    >
      <div className="px-4 pb-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="
              w-full h-10 pl-4 pr-10
              rounded-xl
              bg-white/[0.06] border border-white/[0.08]
              text-white placeholder:text-slate-500
              text-base
              focus:outline-none focus:border-orange-500/40
              transition-colors
            "
            style={{ fontSize: '16px' }}
          />

          <AnimatePresence>
            {value && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  w-6 h-6 rounded-full
                  bg-white/[0.1]
                  flex items-center justify-center
                "
                aria-label="Clear search"
              >
                <span className="text-slate-400 text-sm">✕</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileHeader>
  )
}

export default MobileHeader
