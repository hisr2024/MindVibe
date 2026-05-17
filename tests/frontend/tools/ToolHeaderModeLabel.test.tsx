/**
 * Component test verifying the "You are in: ___ Mode" label
 * renders correctly in the ToolHeader component.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { ToolHeader } from '@/components/tools/ToolHeader'

describe('ToolHeader - mode label', () => {
  it('renders mode label text below the subtitle', () => {
    render(
      <ToolHeader
        icon="🎯"
        title="Viyoga - Outcome Anxiety Support"
        subtitle="Shift from worrying about results to focused action."
        modeLabel="You are in: Pause Mode"
      />
    )

    const modeLabel = screen.getByTestId('mode-label')
    expect(modeLabel).toBeInTheDocument()
    expect(modeLabel).toHaveTextContent('You are in: Pause Mode')
  })

  it('renders mode label with muted, small typography', () => {
    render(
      <ToolHeader
        icon="🔄"
        title="Ardha - Cognitive Reframing"
        subtitle="Transform distorted thoughts."
        modeLabel="You are in: Clarity Mode"
      />
    )

    const modeLabel = screen.getByTestId('mode-label')
    expect(modeLabel.tagName).toBe('P')
    expect(modeLabel.className).toContain('text-[11px]')
    expect(modeLabel.className).toContain('tracking-wide')
    expect(modeLabel.className).toContain('text-[#e8b54a]/50')
  })

  it('does not render mode label when prop is not provided', () => {
    render(
      <ToolHeader
        icon="🧭"
        title="Relationship Compass"
        subtitle="Navigate relationship challenges."
      />
    )

    expect(screen.queryByTestId('mode-label')).not.toBeInTheDocument()
  })

  it('renders correctly in RTL layout', () => {
    const { container } = render(
      <div dir="rtl">
        <ToolHeader
          icon="🎯"
          title="Viyoga"
          subtitle="Test subtitle"
          modeLabel="You are in: Pause Mode"
        />
      </div>
    )

    const rtlWrapper = container.firstElementChild as HTMLElement
    expect(rtlWrapper.getAttribute('dir')).toBe('rtl')

    const modeLabel = screen.getByTestId('mode-label')
    expect(modeLabel).toHaveTextContent('You are in: Pause Mode')
  })
})
