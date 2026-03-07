/**
 * ChatVoiceInput Component Tests
 *
 * Tests rendering, text input, mic button, offline banner,
 * error display, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatVoiceInput } from '@/components/voice/ChatVoiceInput'

// Mock useVoiceToText hook
const mockStartListening = vi.fn()
const mockStopListening = vi.fn()
const mockReset = vi.fn()
let mockStatus = 'idle'
let mockIsListening = false
let mockIsSupported = true
let mockIsOnline = true
let mockError: string | null = null
let mockInterimTranscript = ''
let mockTranscript = ''
let mockConfidence = 0

vi.mock('@/hooks/useVoiceToText', () => ({
  useVoiceToText: () => ({
    status: mockStatus,
    isListening: mockIsListening,
    transcript: mockTranscript,
    interimTranscript: mockInterimTranscript,
    isSupported: mockIsSupported,
    isOnline: mockIsOnline,
    error: mockError,
    confidence: mockConfidence,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    reset: mockReset,
  }),
}))

// Mock useLanguage
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: vi.fn() }),
}))

describe('ChatVoiceInput', () => {
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStatus = 'idle'
    mockIsListening = false
    mockIsSupported = true
    mockIsOnline = true
    mockError = null
    mockInterimTranscript = ''
    mockTranscript = ''
    mockConfidence = 0
  })

  it('renders text input and send button', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.getByLabelText('Message input — type or use voice')).toBeInTheDocument()
    expect(screen.getByLabelText('Send message')).toBeInTheDocument()
  })

  it('renders mic button when VTT is supported', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.getByLabelText('Start voice input')).toBeInTheDocument()
  })

  it('does not render mic button when VTT is disabled', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} vttEnabled={false} />)
    expect(screen.queryByLabelText('Start voice input')).not.toBeInTheDocument()
  })

  it('does not render mic button when not supported', () => {
    mockIsSupported = false
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.queryByLabelText('Start voice input')).not.toBeInTheDocument()
  })

  it('calls startListening when mic button is clicked', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    fireEvent.click(screen.getByLabelText('Start voice input'))
    expect(mockStartListening).toHaveBeenCalledTimes(1)
  })

  it('calls stopListening when mic button is clicked while listening', () => {
    mockIsListening = true
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    fireEvent.click(screen.getByLabelText('Stop recording'))
    expect(mockStopListening).toHaveBeenCalledTimes(1)
  })

  it('submits text on form submit', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Message input — type or use voice')
    fireEvent.change(input, { target: { value: 'Hello KIAAN' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith('Hello KIAAN')
  })

  it('submits text on Enter key', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Message input — type or use voice')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('Test message')
  })

  it('does not submit empty text', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Message input — type or use voice')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows offline banner when offline', () => {
    mockIsOnline = false
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.getByText(/You are offline/)).toBeInTheDocument()
  })

  it('disables mic button when offline', () => {
    mockIsOnline = false
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    const micButton = screen.getByLabelText('Start voice input')
    expect(micButton).toBeDisabled()
  })

  it('shows error message when there is an error', () => {
    mockError = 'Network issue occurred'
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.getByText('Network issue occurred')).toBeInTheDocument()
  })

  it('shows permission denied guidance', () => {
    mockError = 'Microphone access denied'
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument()
  })

  it('disables inputs when disabled prop is true', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} disabled />)
    const input = screen.getByLabelText('Message input — type or use voice')
    expect(input).toBeDisabled()
  })

  it('uses custom placeholder', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} placeholder="Custom placeholder" />)
    const input = screen.getByLabelText('Message input — type or use voice')
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder')
  })

  it('shows listening placeholder when recording', () => {
    mockIsListening = true
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Message input — type or use voice')
    expect(input).toHaveAttribute('placeholder', 'Listening...')
  })

  it('has proper ARIA attributes for accessibility', () => {
    render(<ChatVoiceInput onSubmit={onSubmit} />)
    expect(screen.getByLabelText('Message input — type or use voice')).toBeInTheDocument()
    expect(screen.getByLabelText('Send message')).toBeInTheDocument()
    expect(screen.getByLabelText('Start voice input')).toBeInTheDocument()
  })
})
