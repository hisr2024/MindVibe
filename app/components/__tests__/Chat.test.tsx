import React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'

import Chat from '../Chat'
import { apiFetch } from '@/lib/api'

jest.mock('@/lib/api')
jest.mock('../ParticleBackground', () => ({
  ParticleBackground: () => <div data-testid="particle-background" />,
}))

const mockApiFetch = apiFetch as jest.Mock

const startResponse = {
  ok: true,
  json: async () => ({ session_id: 'session-1', message: 'Welcome!', gita_powered: true }),
}

const messageResponse = {
  ok: true,
  json: async () => ({
    response: 'Assistant reply',
    model: 'gpt-4o-mini',
    gita_powered: true,
    validation_fallback: true,
    repo_context_used: true,
    regenerated: true,
  }),
}

const activeRoots: Array<{ root: ReturnType<typeof createRoot>; container: HTMLElement }> = []

const renderChat = async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  activeRoots.push({ root, container })

  await act(async () => {
    root.render(<Chat />)
  })

  return { container, root }
}

const updateInput = async (container: HTMLElement, value: string) => {
  const input = container.querySelector('input[placeholder="Share a quick thought for KIAAN"]') as HTMLInputElement

  await act(async () => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const clickSubmit = async (container: HTMLElement) => {
  const button = Array.from(container.querySelectorAll('button')).find(btn =>
    btn.textContent?.includes('Start Chat'),
  ) as HTMLButtonElement | undefined

  if (button) {
    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  }
}

describe('Chat component', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
  })

  afterEach(() => {
    activeRoots.splice(0).forEach(({ root, container }) => {
      act(() => {
        root.unmount()
      })
      container.remove()
    })
  })

  it('shows response metadata and fallback notices from the backend', async () => {
    mockApiFetch
      .mockResolvedValueOnce(startResponse)
      .mockResolvedValueOnce(messageResponse)

    const { container } = await renderChat()

    expect(container.textContent).toContain('Welcome!')

    await updateInput(container, 'Hello')
    await clickSubmit(container)

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Assistant reply')
    expect(container.textContent).toContain('Model in use: gpt-4o-mini')
    expect(container.textContent).toContain('Bhagavad Gita grounding active')
    expect(container.textContent).toContain('Validation fallback refreshed this reply')
    expect(container.textContent).toContain('regenerated for clarity')
    expect(container.textContent).toContain('Fallback repository context was used')
  })

  it('surfaces an error when sending fails', async () => {
    mockApiFetch
      .mockResolvedValueOnce(startResponse)
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })

    const { container } = await renderChat()

    await updateInput(container, 'Trigger error')
    await clickSubmit(container)

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).toContain('KIAAN is taking a moment... please try again.')
  })
})
