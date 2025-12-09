/**
 * Tests for ChatFooter component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatFooter } from '@/components/layout/ChatFooter'
import { ChatProvider } from '@/lib/ChatContext'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock KiaanChatModal
vi.mock('@/components/chat/KiaanChatModal', () => ({
  KiaanChatModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="kiaan-chat-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  ),
}))

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
    })
  })

  it('should have proper ARIA attributes for accessibility', async () => {
    renderWithProvider(<ChatFooter />)
    
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open kiaan chat/i })
      expect(button).toHaveAttribute('aria-label', 'Open KIAAN chat')
      expect(button).toHaveAttribute('title', 'Chat with KIAAN')
    })
  })

  it('should open modal when button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ChatFooter />)
    
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open kiaan chat/i })
      expect(button).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /open kiaan chat/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByTestId('kiaan-chat-modal')).toBeInTheDocument()
    })
  })

  it('should close modal when close is clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ChatFooter />)
    
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open kiaan chat/i })
      expect(button).toBeInTheDocument()
    })

    // Open modal
    const openButton = screen.getByRole('button', { name: /open kiaan chat/i })
    await user.click(openButton)

    await waitFor(() => {
      expect(screen.getByTestId('kiaan-chat-modal')).toBeInTheDocument()
    })

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close modal/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByTestId('kiaan-chat-modal')).not.toBeInTheDocument()
    })
  })

  it('should have proper styling for fixed positioning', async () => {
    renderWithProvider(<ChatFooter />)
    
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /open kiaan chat/i })
      expect(button).toBeInTheDocument()
    })

    const buttonContainer = screen.getByRole('button', { name: /open kiaan chat/i }).parentElement
    expect(buttonContainer).toHaveClass('fixed')
    expect(buttonContainer).toHaveClass('bottom-6')
    expect(buttonContainer).toHaveClass('right-6')
  })
})
