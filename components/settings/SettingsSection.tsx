'use client'

import { type ReactNode } from 'react'
import { HelpIcon } from '@/components/ui'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsSection({
  title,
  description,
  children,
  className = '',
}: SettingsSectionProps) {
  return (
    <div className={`rounded-2xl border border-[#d4a44c]/15 bg-[#0d0d10]/85 p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-lg font-semibold text-[#f5f0e8]">{title}</h3>
        {description && <HelpIcon content={description} size="sm" />}
      </div>
      {children}
    </div>
  )
}

interface SettingsItemProps {
  label: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsItem({
  label,
  description,
  children,
  className = '',
}: SettingsItemProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-[#f5f0e8]">{label}</p>
        {description && <HelpIcon content={description} size="sm" />}
      </div>
      <div>{children}</div>
    </div>
  )
}

interface SettingsDividerProps {
  className?: string
}

export function SettingsDivider({ className = '' }: SettingsDividerProps) {
  return <hr className={`border-[#d4a44c]/10 ${className}`} />
}

export default SettingsSection
