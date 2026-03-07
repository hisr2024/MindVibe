/**
 * UniversalVoiceInput Component Tests
 *
 * Tests rendering, text fallback, mic button, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UniversalVoiceInput } from '@/components/voice/UniversalVoiceInput'

// Mock useVoiceInput hook
const mockStartListening = vi.fn()
const mockStopListening = vi.fn()
let mockIsSupported = true
let mockIsListening = false
let mockError: string | null = null
let mockInterimTranscript = ''

vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: (opts: { onTranscript?: (text: string, isFinal: boolean) => void }) => ({
    isListening: mockIsListening,
    transcript: '',
    interimTranscript: mockInterimTranscript,
    isSupported: mockIsSupported,
    error: mockError,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    resetTranscript: vi.fn(),
  }),
}))

// Mock voice controller
vi.mock('@/lib/voice-controller', () => ({
  classifyIntent: vi.fn(() => ({
    action: 'query',
    targetTool: null,
    query: 'test',
    extractedContext: { emotion: null, topic: null, entities: [] },
    confidence: 0.5,
  })),
}))

describe('UniversalVoiceInput', () => {
  const onTranscript = vi.fn()
  const onIntentDetected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSupported = true
    mockIsListening = false
    mockError = null
    mockInterimTranscript = ''
  })

  it('renders mic button when speech is supported', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    const micButton = screen.getByLabelText('Start voice input')
    expect(micButton).toBeInTheDocument()
  })

  it('renders text input when fallbackToText is true', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} fallbackToText={true} />)
    const textInput = screen.getByLabelText('Text input fallback')
    expect(textInput).toBeInTheDocument()
  })

  it('submits text input on Enter key', () => {
    render(
      <UniversalVoiceInput onTranscript={onTranscript} onIntentDetected={onIntentDetected} />,
    )
    const textInput = screen.getByLabelText('Text input fallback')
    fireEvent.change(textInput, { target: { value: 'take me to ardha' } })
    fireEvent.keyDown(textInput, { key: 'Enter' })

    expect(onTranscript).toHaveBeenCalledWith('take me to ardha')
    expect(onIntentDetected).toHaveBeenCalled()
  })

  it('shows send button when text is entered', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    const textInput = screen.getByLabelText('Text input fallback')
    fireEvent.change(textInput, { target: { value: 'hello' } })

    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeInTheDocument()
  })

  it('calls startListening when mic button is clicked', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    const micButton = screen.getByLabelText('Start voice input')
    fireEvent.click(micButton)

    expect(mockStartListening).toHaveBeenCalled()
  })

  it('shows privacy info button', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    const infoButton = screen.getByLabelText('Voice privacy information')
    expect(infoButton).toBeInTheDocument()
  })

  it('has search role on container', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} module="ardha" />)
    const container = screen.getByRole('search')
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute('aria-label', 'Voice and text input for ardha')
  })

  it('disables inputs when disabled prop is true', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} disabled={true} />)
    const micButton = screen.getByLabelText('Start voice input')
    const textInput = screen.getByLabelText('Text input fallback')

    expect(micButton).toBeDisabled()
    expect(textInput).toBeDisabled()
  })

  it('shows permission denied message when mic is denied', () => {
    mockError = 'Microphone access denied'
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    expect(screen.getByText(/Mic access denied/)).toBeInTheDocument()
  })

  it('clears text input after submit', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    const textInput = screen.getByLabelText('Text input fallback') as HTMLInputElement
    fireEvent.change(textInput, { target: { value: 'test message' } })
    fireEvent.keyDown(textInput, { key: 'Enter' })

    expect(textInput.value).toBe('')
  })

  it('does not submit empty text', () => {
    render(<UniversalVoiceInput onTranscript={onTranscript} />)
    const textInput = screen.getByLabelText('Text input fallback')
    fireEvent.keyDown(textInput, { key: 'Enter' })

    expect(onTranscript).not.toHaveBeenCalled()
  })
})
