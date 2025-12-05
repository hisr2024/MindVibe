'use client'

import { ToolCard } from './ToolCard'
import type { ToolConfig } from '@/lib/constants/tools'
import { HelpIcon } from '@/components/ui'

export interface ToolGridProps {
  /** Section title */
  title: string
  /** Optional description/tooltip for the section */
  description?: string
  /** Tools to display in the grid */
  tools: ToolConfig[]
  /** Optional className for styling */
  className?: string
}

/**
 * ToolGrid component for displaying a section of tools.
 *
 * Features:
 * - Section title with optional help icon
 * - Responsive grid layout (3 cols desktop, 2 cols tablet, 1 col mobile)
 * - MindVibe brand styling
 */
export function ToolGrid({
  title,
  description,
  tools,
  className = '',
}: ToolGridProps) {
  return (
    <section
      className={`rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)] ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-orange-50">{title}</h2>
          {description && <HelpIcon content={description} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            icon={tool.icon}
            title={tool.title}
            description={tool.description}
            gradient={tool.gradient}
            href={tool.href}
            badge={tool.badge}
            disabled={tool.disabled}
          />
        ))}
      </div>
    </section>
  )
}

export default ToolGrid
