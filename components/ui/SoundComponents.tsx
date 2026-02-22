'use client'

/**
 * Sound-Enabled UI Components
 *
 * Drop-in replacements for common UI elements with built-in sound effects.
 * Use these throughout the app for consistent audio feedback.
 *
 * Components:
 * - SoundButton: Button with click sound
 * - SoundIconButton: Icon button with subtle click
 * - SoundLink: Next.js Link with navigation sound
 * - SoundToggle: Switch with toggle sound
 * - SoundCheckbox: Checkbox with check sound
 * - SoundCard: Clickable card with select sound
 * - SoundInput: Input with focus/blur sounds
 * - SoundSlider: Slider with adjustment sounds
 * - SoundTabs: Tab navigation with transition sounds
 * - SoundAccordion: Accordion with open/close sounds
 * - SoundModal: Modal with open/close sounds
 * - SoundToast: Toast notification with sound
 */

import React, { forwardRef, useState } from 'react'
import Link from 'next/link'
import { useUISound, type UISound } from '@/hooks/useUISound'

// Simple utility for class name merging
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============ SoundButton ============

interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  sound?: UISound
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const SoundButton = forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ sound = 'click', variant = 'default', size = 'md', onClick, className, children, disabled, ...props }, ref) => {
    const { playSound } = useUISound()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        playSound(sound)
        onClick?.(e)
      }
    }

    const variantStyles = {
      default: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
      primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white',
      secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
      ghost: 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white',
      destructive: 'bg-red-600 hover:bg-red-500 text-white'
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-xl',
      lg: 'px-6 py-3 text-lg rounded-xl'
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SoundButton.displayName = 'SoundButton'

// ============ SoundIconButton ============

interface SoundIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  sound?: UISound
  size?: 'sm' | 'md' | 'lg'
}

export const SoundIconButton = forwardRef<HTMLButtonElement, SoundIconButtonProps>(
  ({ sound = 'click', size = 'md', onClick, className, children, disabled, ...props }, ref) => {
    const { playSound } = useUISound()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        playSound(sound)
        onClick?.(e)
      }
    }

    const sizeStyles = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 disabled:opacity-50',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SoundIconButton.displayName = 'SoundIconButton'

// ============ SoundLink ============

interface SoundLinkProps extends React.ComponentProps<typeof Link> {
  sound?: UISound
}

export function SoundLink({ sound = 'transition', onClick, children, ...props }: SoundLinkProps) {
  const { playSound } = useUISound()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playSound(sound)
    if (onClick) {
      ;(onClick as React.MouseEventHandler<HTMLAnchorElement>)(e)
    }
  }

  return (
    <Link onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

// ============ SoundToggle ============

interface SoundToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  sound?: UISound
  disabled?: boolean
  className?: string
  label?: string
}

export function SoundToggle({
  checked,
  onChange,
  sound = 'toggle',
  disabled = false,
  className = '',
  label
}: SoundToggleProps) {
  const { playSound } = useUISound()

  const handleChange = () => {
    if (!disabled) {
      playSound(sound)
      onChange(!checked)
    }
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={handleChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-purple-600' : 'bg-slate-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {label && <span className="text-white/70 text-sm">{label}</span>}
    </div>
  )
}

// ============ SoundCheckbox ============

interface SoundCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  sound?: UISound
  disabled?: boolean
  className?: string
  label?: string
}

export function SoundCheckbox({
  checked,
  onChange,
  sound = 'select',
  disabled = false,
  className = '',
  label
}: SoundCheckboxProps) {
  const { playSound } = useUISound()

  const handleChange = () => {
    if (!disabled) {
      playSound(checked ? 'deselect' : sound)
      onChange(!checked)
    }
  }

  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        role="checkbox"
        aria-checked={checked}
        onClick={handleChange}
        disabled={disabled}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
          checked
            ? 'bg-purple-600 border-purple-600'
            : 'bg-transparent border-white/30 hover:border-white/50'
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      {label && <span className="text-white/80">{label}</span>}
    </label>
  )
}

// ============ SoundCard ============

interface SoundCardProps extends React.HTMLAttributes<HTMLDivElement> {
  sound?: UISound
  selected?: boolean
  interactive?: boolean
}

export function SoundCard({
  sound = 'select',
  selected = false,
  interactive = true,
  onClick,
  className,
  children,
  ...props
}: SoundCardProps) {
  const { playSound } = useUISound()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactive) {
      playSound(sound)
      onClick?.(e)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'rounded-xl border transition-all duration-200',
        interactive && 'cursor-pointer',
        selected
          ? 'bg-white/10 border-purple-500/50'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ============ SoundInput ============

interface SoundInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  focusSound?: UISound
  typeSound?: boolean
}

export const SoundInput = forwardRef<HTMLInputElement, SoundInputProps>(
  ({ focusSound = 'click', typeSound: _typeSound = false, onFocus, onBlur, className, ...props }, ref) => {
    const { playSound } = useUISound()

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      playSound(focusSound)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e)
    }

    return (
      <input
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40',
          'focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-200',
          className
        )}
        {...props}
      />
    )
  }
)
SoundInput.displayName = 'SoundInput'

// ============ SoundTextarea ============

interface SoundTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  focusSound?: UISound
}

export const SoundTextarea = forwardRef<HTMLTextAreaElement, SoundTextareaProps>(
  ({ focusSound = 'click', onFocus, className, ...props }, ref) => {
    const { playSound } = useUISound()

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      playSound(focusSound)
      onFocus?.(e)
    }

    return (
      <textarea
        ref={ref}
        onFocus={handleFocus}
        className={cn(
          'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 resize-none',
          'focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-200',
          className
        )}
        {...props}
      />
    )
  }
)
SoundTextarea.displayName = 'SoundTextarea'

// ============ SoundSlider ============

interface SoundSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  sound?: UISound
  className?: string
  label?: string
}

export function SoundSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  sound = 'click',
  className = '',
  label
}: SoundSliderProps) {
  const { playSound } = useUISound()
  const [lastSoundValue, setLastSoundValue] = useState(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)

    // Play sound at intervals
    const interval = (max - min) / 10
    if (Math.abs(newValue - lastSoundValue) >= interval) {
      playSound(sound)
      setLastSoundValue(newValue)
    }

    onChange(newValue)
  }

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{label}</span>
          <span className="text-white/80">{Math.round(value)}</span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-2 appearance-none bg-transparent cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
    </div>
  )
}

// ============ SoundTabs ============

interface SoundTabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (tabId: string) => void
  sound?: UISound
  className?: string
}

export function SoundTabs({
  tabs,
  activeTab,
  onChange,
  sound = 'transition',
  className = ''
}: SoundTabsProps) {
  const { playSound } = useUISound()

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      playSound(sound)
      onChange(tabId)
    }
  }

  return (
    <div className={cn('flex rounded-xl bg-white/5 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            activeTab === tab.id
              ? 'bg-purple-600 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ============ SoundAccordion ============

interface SoundAccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  sound?: UISound
  className?: string
}

export function SoundAccordion({
  title,
  children,
  defaultOpen = false,
  sound: _sound = 'toggle',
  className = ''
}: SoundAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { playSound } = useUISound()

  const handleToggle = () => {
    playSound(isOpen ? 'close' : 'open')
    setIsOpen(!isOpen)
  }

  return (
    <div className={cn('border border-white/10 rounded-xl overflow-hidden', className)}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="font-medium text-white">{title}</span>
        <svg
          className={cn('w-5 h-5 text-white/60 transition-transform duration-200', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white/[0.02]">
          {children}
        </div>
      )}
    </div>
  )
}

// ============ SoundSelect ============

interface SoundSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  sound?: UISound
  placeholder?: string
  className?: string
}

export function SoundSelect({
  value,
  onChange,
  options,
  sound = 'select',
  placeholder = 'Select...',
  className = ''
}: SoundSelectProps) {
  const { playSound } = useUISound()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playSound(sound)
    onChange(e.target.value)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className={cn(
        'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white',
        'focus:outline-none focus:border-purple-500/50 transition-all duration-200',
        'appearance-none cursor-pointer',
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// ============ Meditation-Specific Components ============

interface MeditationBellButtonProps {
  onBell?: () => void
  className?: string
}

export function MeditationBellButton({ onBell, className }: MeditationBellButtonProps) {
  const { playBell } = useUISound()

  const handleClick = () => {
    playBell()
    onBell?.()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30',
        'flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-transform',
        className
      )}
      aria-label="Ring meditation bell"
    >
      <span className="text-3xl">🔔</span>
    </button>
  )
}

interface SingingBowlButtonProps {
  onBowl?: () => void
  className?: string
}

export function SingingBowlButton({ onBowl, className }: SingingBowlButtonProps) {
  const { playSingingBowl } = useUISound()

  const handleClick = () => {
    playSingingBowl()
    onBowl?.()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30',
        'flex items-center justify-center hover:scale-105 active:scale-95 transition-transform',
        className
      )}
      aria-label="Play singing bowl"
    >
      <span className="text-3xl">🎵</span>
    </button>
  )
}

interface OmButtonProps {
  onOm?: () => void
  className?: string
}

export function OmButton({ onOm, className }: OmButtonProps) {
  const { playOm } = useUISound()

  const handleClick = () => {
    playOm()
    onOm?.()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30',
        'flex items-center justify-center hover:scale-105 active:scale-95 transition-transform',
        className
      )}
      aria-label="Play Om sound"
    >
      <span className="text-3xl font-serif text-purple-300">ॐ</span>
    </button>
  )
}

interface GongButtonProps {
  onGong?: () => void
  className?: string
}

export function GongButton({ onGong, className }: GongButtonProps) {
  const { playGong } = useUISound()

  const handleClick = () => {
    playGong()
    onGong?.()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30',
        'flex items-center justify-center hover:scale-105 active:scale-95 transition-transform',
        className
      )}
      aria-label="Play gong"
    >
      <span className="text-3xl">🔔</span>
    </button>
  )
}

// ============ Export All ============

export const SoundComponents = {
  SoundButton,
  SoundIconButton,
  SoundLink,
  SoundToggle,
  SoundCheckbox,
  SoundCard,
  SoundInput,
  SoundTextarea,
  SoundSlider,
  SoundTabs,
  SoundAccordion,
  SoundSelect,
  MeditationBellButton,
  SingingBowlButton,
  OmButton,
  GongButton
}

export default SoundComponents
