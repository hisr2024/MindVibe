'use client'

/**
 * components/legal/PrivacyActions.tsx
 *
 * Client-only interactive affordances shared by both shells:
 *
 *   - <DownloadPdfButton />  → kicks off /api/privacy/pdf; handles error state.
 *   - <BackToTopFab />       → appears after 400px scroll; respects reduced motion.
 *
 * Kept here (and not in each page.tsx) so the pages themselves remain pure
 * server components and ship the minimum client bundle.
 */

import { useCallback, useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Download PDF button
// ---------------------------------------------------------------------------

interface DownloadPdfButtonProps {
  /**
   * Retained for backwards compatibility with older call sites — the server
   * route now produces a fixed filename (`kiaanverse-privacy-policy.pdf`),
   * but we still display the version in the tooltip if provided.
   */
  version?: string
  variant?: 'primary' | 'outline'
  className?: string
}

const PDF_URL = '/api/privacy/pdf'
const PDF_FILENAME = 'kiaanverse-privacy-policy.pdf'

export function DownloadPdfButton({
  version,
  variant = 'outline',
  className = '',
}: DownloadPdfButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'rate-limited'>(
    'idle',
  )

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (state === 'loading') return
      setState('loading')
      try {
        const response = await fetch(PDF_URL, { method: 'GET' })
        if (response.status === 429) {
          setState('rate-limited')
          return
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = PDF_FILENAME
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(objectUrl)
        setState('idle')
      } catch {
        setState('error')
        // Fall back to a plain navigation so the user still gets the file.
        window.location.href = PDF_URL
      }
    },
    [state],
  )

  const label =
    state === 'loading'
      ? 'Preparing PDF…'
      : state === 'error'
        ? 'Retry download'
        : state === 'rate-limited'
          ? 'Try again in a minute'
          : 'Download PDF'

  const baseClass =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 min-h-[44px] text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]'

  const variantClass =
    variant === 'primary'
      ? 'bg-[#C8A84B] text-[#0A0A14] hover:bg-[#d8b858]'
      : 'border border-[rgba(200,168,75,0.4)] text-[#E8DCC8] hover:bg-[rgba(200,168,75,0.1)]'

  return (
    <a
      href={PDF_URL}
      onClick={handleClick}
      aria-label={
        version
          ? `Download the Kiaanverse Privacy Policy (version ${version}) as a PDF`
          : 'Download the Kiaanverse Privacy Policy as a PDF'
      }
      title={version ? `Kiaanverse Privacy Policy v${version}` : undefined}
      aria-busy={state === 'loading'}
      data-state={state}
      className={[baseClass, variantClass, className].join(' ')}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={[
          'h-4 w-4',
          state === 'loading' ? 'animate-spin' : '',
        ].join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {state === 'loading' ? (
          <>
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" />
          </>
        ) : (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </>
        )}
      </svg>
      <span>{label}</span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// Back-to-top floating action button (desktop)
// ---------------------------------------------------------------------------

interface BackToTopFabProps {
  /** Scroll offset at which the FAB fades in. */
  threshold?: number
  className?: string
}

export function BackToTopFab({ threshold = 400, className = '' }: BackToTopFabProps) {
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => setVisible(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const handleClick = useCallback(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    // Restore focus to the skip-to-content target for screen-reader users.
    const main = document.getElementById('main-content')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
    }
  }, [])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top of page"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={[
        'fixed bottom-6 right-6 z-40',
        'h-12 w-12 rounded-full',
        'bg-[rgba(200,168,75,0.15)] border border-[rgba(200,168,75,0.45)] backdrop-blur-sm',
        'text-[#C8A84B]',
        'shadow-[0_10px_40px_rgba(200,168,75,0.2)]',
        'transition-all duration-200',
        'hover:bg-[rgba(200,168,75,0.25)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-2 pointer-events-none',
        className,
      ].join(' ')}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mx-auto h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  )
}
