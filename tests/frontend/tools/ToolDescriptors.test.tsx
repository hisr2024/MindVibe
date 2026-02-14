/**
 * RTL test verifying tool purpose descriptors render under tool titles
 * on the ToolsDashboardSection component, including RTL layout.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock useLanguage to return tool_desc translations
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    config: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
    isRTL: false,
    isInitialized: true,
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.allTools': 'All tools in one place',
        'dashboard.subtitle': 'MindVibe tools',
        'dashboard.returnHome': 'Return to home',
        'dashboard.toolsCount': 'tools',
        'dashboard.categories.core': 'Core Tools',
        'dashboard.categories.community': 'Community & Insights',
        'dashboard.categories.guidance': 'Guidance Engines',
        'dashboard.categories.karma': 'Karma & Growth',
        'dashboard.categories.quick-access': 'Quick Access',
        'dashboard.tools.kiaan.title': 'KIAAN Chat',
        'dashboard.tools.kiaan.description': 'AI mental health companion',
        'dashboard.tools.kiaan-voice.title': 'KIAAN Companion',
        'dashboard.tools.kiaan-voice.description': 'Your best friend who truly listens',
        'dashboard.tools.viyog.title': 'Viyoga',
        'dashboard.tools.viyog.description': 'Outcome anxiety reducer',
        'dashboard.tools.ardha.title': 'Ardha',
        'dashboard.tools.ardha.description': 'Ancient wisdom reframing',
        'dashboard.tools.relationship-compass.title': 'Relationship Compass',
        'dashboard.tools.relationship-compass.description': 'Calm conflict guidance',
        'dashboard.tool_desc.viyog': 'Calm the immediate reaction',
        'dashboard.tool_desc.ardha': 'Reframe the perception',
        'dashboard.tool_desc.kiaan': 'Talk it through',
        'dashboard.tool_desc.relationship-compass': 'Navigate relational clarity',
        'dashboard.tool_desc.journey': 'Train long-term inner steadiness',
      }
      return translations[key] ?? fallback ?? key
    },
  }),
}))

// Mock useHapticFeedback
vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}))

// Mock framer-motion to simplify DOM
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) =>
      React.createElement('div', { ...filterDomProps(props), ref }, children)
    ),
    span: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLSpanElement>) =>
      React.createElement('span', { ...filterDomProps(props), ref }, children)
    ),
    button: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLButtonElement>) =>
      React.createElement('button', { ...filterDomProps(props), ref }, children)
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}))

function filterDomProps(props: Record<string, unknown>) {
  const filtered: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(props)) {
    if (
      !key.startsWith('variants') &&
      !key.startsWith('initial') &&
      !key.startsWith('animate') &&
      !key.startsWith('exit') &&
      !key.startsWith('whileHover') &&
      !key.startsWith('whileTap') &&
      !key.startsWith('custom') &&
      !key.startsWith('drag') &&
      !key.startsWith('onDrag') &&
      key !== 'transition'
    ) {
      filtered[key] = val
    }
  }
  return filtered
}

import { ToolsDashboardSection } from '@/components/dashboard/ToolsDashboardSection'

describe('ToolsDashboardSection - purpose descriptors', () => {
  it('renders purpose descriptors under each applicable tool title', () => {
    render(<ToolsDashboardSection />)

    expect(screen.getByText('Calm the immediate reaction')).toBeInTheDocument()
    expect(screen.getByText('Reframe the perception')).toBeInTheDocument()
    // "Talk it through" appears twice (KIAAN Chat + KIAAN Companion share the same descriptor)
    expect(screen.getAllByText('Talk it through').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Navigate relational clarity')).toBeInTheDocument()
  })

  it('renders descriptors with muted, small typography', () => {
    render(<ToolsDashboardSection />)

    const descriptor = screen.getByText('Calm the immediate reaction')
    expect(descriptor.tagName).toBe('P')
    expect(descriptor.className).toContain('text-')
    expect(descriptor.className).toContain('truncate')
  })

  it('renders descriptors below tool title, not above it', () => {
    render(<ToolsDashboardSection />)

    const title = screen.getByText('Viyoga')
    const descriptor = screen.getByText('Calm the immediate reaction')

    // Both should share a common parent container
    const titleParent = title.parentElement
    const descriptorParent = descriptor.parentElement
    expect(titleParent).toBe(descriptorParent)

    // Descriptor should come after the description text in DOM order
    const children = Array.from(titleParent!.children)
    const titleIndex = children.indexOf(title)
    const descriptorIndex = children.indexOf(descriptor)
    expect(descriptorIndex).toBeGreaterThan(titleIndex)
  })

  it('renders correctly with RTL direction on the container', () => {
    const { container } = render(
      <div dir="rtl">
        <ToolsDashboardSection />
      </div>
    )

    // Verify the RTL wrapper exists
    const rtlWrapper = container.firstElementChild as HTMLElement
    expect(rtlWrapper.getAttribute('dir')).toBe('rtl')

    // Descriptors should still render
    expect(screen.getByText('Calm the immediate reaction')).toBeInTheDocument()
    expect(screen.getByText('Reframe the perception')).toBeInTheDocument()
    expect(screen.getAllByText('Talk it through').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Navigate relational clarity')).toBeInTheDocument()

    // Each descriptor should use truncate which works with RTL via text-overflow
    const descriptor = screen.getByText('Calm the immediate reaction')
    expect(descriptor.className).toContain('truncate')
  })
})
