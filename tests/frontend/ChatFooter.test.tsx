/**
 * Tests for ChatFooter component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatFooter } from '@/components/layout/ChatFooter'
import { ChatProvider } from '@/lib/ChatContext'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock useLanguage hook
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
    isLoading: false,
    error: null,
    supportedLanguages: ['en', 'hi', 'es'],
    isRTL: false,
  }),
}))

// Mock window.matchMedia to simulate desktop viewport for responsive tests
// This makes md:block classes work correctly in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('min-width') || query.includes('768px'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock fetch for health check and DOM methods
beforeEach(() => {
  // Clear localStorage to ensure clean state for each test
  // The component loads 'kiaan-footer-open' from localStorage
  localStorage.clear()

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ status: 'healthy' }),
  })

  // Mock scrollIntoView which is not available in jsdom
  Element.prototype.scrollIntoView = vi.fn()
})

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ChatProvider>
      {component}
    </ChatProvider>
  )
}

describe('ChatFooter', () => {
  it('should render the chat button', async () => {
    renderWithProvider(<ChatFooter />)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open kiaan chat/i })
      expect(button).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should have proper ARIA attributes for accessibility', async () => {
    renderWithProvider(<ChatFooter />)

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open kiaan chat/i })
      expect(button).toHaveAttribute('aria-label', 'Open KIAAN chat')
      expect(button).toHaveAttribute('title', 'Chat with KIAAN')
    }, { timeout: 3000 })
  })

  it('should open chat panel when button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ChatFooter />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open kiaan chat/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    const button = screen.getByRole('button', { name: /open kiaan chat/i })
    await user.click(button)

    // After clicking, the chat panel opens (not a separate modal)
    await waitFor(() => {
      expect(screen.getByText(/Share what's on your mind/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should close chat panel when minimize is clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ChatFooter />)

    // The button has hidden md:block class - jsdom doesn't support CSS media queries
    // so we query directly by aria-label attribute using querySelector
    await waitFor(() => {
      const openButton = document.querySelector('button[aria-label="Open KIAAN chat"]')
      expect(openButton).toBeInTheDocument()
    }, { timeout: 3000 })

    // Open chat by clicking the button
    const openButton = document.querySelector('button[aria-label="Open KIAAN chat"]') as HTMLButtonElement
    await user.click(openButton)

    await waitFor(() => {
      expect(screen.getByText(/Share what's on your mind/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Close chat - click minimize button
    const minimizeButton = screen.getByRole('button', { name: /minimize chat/i })
    await user.click(minimizeButton)

    // After minimizing, the "Open KIAAN chat" button should be back in DOM
    await waitFor(() => {
      const button = document.querySelector('button[aria-label="Open KIAAN chat"]')
      expect(button).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should have proper styling for fixed positioning', async () => {
    renderWithProvider(<ChatFooter />)

    // The button has hidden md:block class - jsdom doesn't support CSS media queries
    // so we query directly by aria-label attribute using querySelector
    await waitFor(() => {
      const button = document.querySelector('button[aria-label="Open KIAAN chat"]')
      expect(button).toBeInTheDocument()
    }, { timeout: 3000 })

    const button = document.querySelector('button[aria-label="Open KIAAN chat"]')
    const buttonContainer = button?.closest('div')
    expect(buttonContainer).toHaveClass('fixed')
  })
})
