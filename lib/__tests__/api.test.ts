import { apiFetch } from '../api'

describe('apiFetch', () => {
  const originalEnv = { ...process.env }
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch
  })

  it('builds urls with configured base and attaches uid header', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    const mockFetch = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch as unknown as typeof fetch

    await apiFetch('/hello', {}, 'user-123')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/hello',
      expect.objectContaining({ headers: expect.any(Headers) })
    )

    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('X-Auth-UID')).toBe('user-123')
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('respects absolute paths and internal override without clobbering headers', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    process.env.INTERNAL_API_URL = 'https://internal.example.com'

    const mockFetch = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch as unknown as typeof fetch

    await apiFetch('https://absolute.test/api', {
      headers: { Accept: 'text/plain', 'X-Test': 'ok' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://absolute.test/api',
      expect.objectContaining({ headers: expect.any(Headers) })
    )

    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Accept')).toBe('text/plain')
    expect(headers.get('X-Test')).toBe('ok')
  })
})
