'use client'

import { forwardRef, ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { Plus, X } from 'lucide-react'

export interface MobileActionButtonProps {
  /** Click handler */
  onClick?: () => void
  /** Icon to display */
  icon?: ReactNode
  /** Accessibility label */
  'aria-label': string
  /** Position of the FAB */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size of the button */
  size?: 'md' | 'lg'
  /** Disable haptic feedback */
  noHaptic?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether to show a badge */
  badge?: number | boolean
  /** Whether to hide when scrolling down */
  hideOnScroll?: boolean
  /** Custom z-index */
  zIndex?: number
}

// Animation variants
const fabVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20,
    },
  },
}

export const MobileActionButton = forwardRef<HTMLButtonElement, MobileActionButtonProps>(
  function MobileActionButton(
    {
      onClick,
      icon = <Plus className="w-6 h-6" />,
      'aria-label': ariaLabel,
      position = 'bottom-right',
      variant = 'primary',
      size = 'md',
      noHaptic = false,
      className = '',
      disabled = false,
      badge,
      zIndex = 45,
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()

    const positionClasses = {
      'bottom-right': 'right-4',
      'bottom-left': 'left-4',
      'bottom-center': 'left-1/2 -translate-x-1/2',
    }

    const variantClasses = {
      primary: `
        bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400
        text-slate-950
        shadow-lg shadow-orange-500/30
      `,
      secondary: `
        bg-[#1a2133] border border-orange-500/20
        text-orange-50
        shadow-lg shadow-black/20
      `,
      ghost: `
        bg-white/[0.08] backdrop-blur-lg
        text-orange-50
        border border-white/[0.1]
      `,
    }

    const sizeClasses = {
      md: 'w-14 h-14',
      lg: 'w-16 h-16',
    }

    const handleClick = () => {
      if (disabled) return
      if (!noHaptic) {
        triggerHaptic('medium')
      }
      onClick?.()
    }

    return (
      <motion.button
        ref={ref}
        variants={fabVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        whileTap={!disabled ? 'tap' : undefined}
        onClick={handleClick}
        disabled={disabled}
        className={`
          fixed
          bottom-[calc(88px+env(safe-area-inset-bottom,0px)+16px)]
          ${positionClasses[position]}
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          transition-colors duration-200
          ${variantClasses[variant]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `.trim()}
        style={{ zIndex }}
        aria-label={ariaLabel}
      >
        {/* Animated background glow */}
        {variant === 'primary' && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-full bg-orange-500/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Icon */}
        <span className="relative z-10">{icon}</span>

        {/* Badge */}
        {badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              absolute -top-1 -right-1
              min-w-5 h-5 px-1.5
              rounded-full
              bg-red-500 text-white text-xs font-bold
              flex items-center justify-center
              border-2 border-[#0f1624]
            `}
          >
            {typeof badge === 'number' ? (badge > 99 ? '99+' : badge) : ''}
          </motion.span>
        )}
      </motion.button>
    )
  }
)

/**
 * Extended FAB with expandable actions
 */
export interface FABAction {
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

export interface ExpandableFABProps {
  actions: FABAction[]
  mainIcon?: ReactNode
  expandedIcon?: ReactNode
  'aria-label': string
  position?: 'bottom-right' | 'bottom-left'
  className?: string
}

export function ExpandableFAB({
  actions,
  mainIcon = <Plus className="w-6 h-6" />,
  expandedIcon = <X className="w-6 h-6" />,
  'aria-label': ariaLabel,
  position = 'bottom-right',
  className = '',
}: ExpandableFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { triggerHaptic } = useHapticFeedback()

  const positionClasses = {
    'bottom-right': 'right-4 items-end',
    'bottom-left': 'left-4 items-start',
  }

  const handleToggle = () => {
    triggerHaptic(isExpanded ? 'light' : 'medium')
    setIsExpanded(!isExpanded)
  }

  const handleActionClick = (action: FABAction) => {
    triggerHaptic(action.variant === 'danger' ? 'warning' : 'selection')
    action.onClick()
    setIsExpanded(false)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div
        className={`
          fixed
          bottom-[calc(88px+env(safe-area-inset-bottom,0px)+16px)]
          ${positionClasses[position]}
          flex flex-col gap-3
          z-45
          ${className}
        `}
      >
        {/* Action Buttons */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.8,
                    transition: { delay: (actions.length - index) * 0.03 },
                  }}
                  className={`
                    flex items-center gap-3
                    ${position === 'bottom-right' ? 'flex-row-reverse' : 'flex-row'}
                  `}
                >
                  {/* Label */}
                  <span
                    className={`
                      px-3 py-1.5 rounded-lg
                      bg-[#1a2133] text-sm font-medium
                      text-slate-200 whitespace-nowrap
                      shadow-lg
                    `}
                  >
                    {action.label}
                  </span>

                  {/* Action Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleActionClick(action)}
                    className={`
                      w-12 h-12 rounded-full
                      flex items-center justify-center
                      shadow-lg
                      ${
                        action.variant === 'danger'
                          ? 'bg-red-500 text-white shadow-red-500/30'
                          : 'bg-white/[0.1] text-orange-50 border border-orange-500/20'
                      }
                    `}
                    aria-label={action.label}
                  >
                    {action.icon}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          animate={{ rotate: isExpanded ? 45 : 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className={`
            w-14 h-14 rounded-full
            flex items-center justify-center
            bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400
            text-slate-950
            shadow-lg shadow-orange-500/30
            transition-shadow duration-200
            ${isExpanded ? 'shadow-orange-500/50' : ''}
          `}
          aria-label={ariaLabel}
          aria-expanded={isExpanded}
        >
          <motion.span
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {isExpanded ? expandedIcon : mainIcon}
          </motion.span>
        </motion.button>
      </div>
    </>
  )
}

export default MobileActionButton
