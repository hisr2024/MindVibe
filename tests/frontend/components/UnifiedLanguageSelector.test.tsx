/**
 * Tests for the unified LanguageSelector component
 *
 * Covers:
 * - Rendering (trigger button, dropdown, bottom sheet)
 * - Language selection across all 17 languages
 * - Search / filtering
 * - Keyboard interaction (Escape to close)
 * - Accessibility (ARIA attributes, roles)
 * - Variant switching (dropdown vs sheet)
 * - Edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { LanguageSelector } from '@/components/navigation/LanguageSelector'
import { LanguageProvider } from '@/hooks/useLanguage'

// ---------- Mocks ----------

vi.mock('@/i18n', () => ({
  localeNames: {
    en: 'English', hi: 'हिन्दी', ta: 'தமிழ்', te: 'తెలుగు',
    bn: 'বাংলা', mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ', sa: 'संस्कृत', es: 'Español',
    fr: 'Français', de: 'Deutsch', pt: 'Português', ja: '日本語',
    'zh-CN': '简体中文',
  },
}))

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}))

vi.mock('@/hooks/useUISound', () => ({
  useUISound: () => ({
    playSound: vi.fn(),
    playBell: vi.fn(),
    playSingingBowl: vi.fn(),
    playOm: vi.fn(),
    playGong: vi.fn(),
    playChime: vi.fn(),
  }),
}))

// Lightweight mock of MobileBottomSheet that renders children when open
vi.mock('@/components/mobile/MobileBottomSheet', () => ({
  MobileBottomSheet: ({
    isOpen,
    onClose,
    children,
    title,
  }: {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    subtitle?: string
    height?: string
    className?: string
    zIndex?: number
  }) => {
    if (!isOpen) return null
    return (
      <div data-testid="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-label={title}>
        {title && <h2>{title}</h2>}
        <button aria-label="Close" onClick={onClose}>✕</button>
        {children}
      </div>
    )
  },
}))

// ---------- Helpers ----------

function renderWithProvider(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

// ---------- Tests ----------

describe('LanguageSelector (unified)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ================== Rendering ==================

  describe('Rendering', () => {
    it('renders trigger button with current language label', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /current language/i })
        expect(btn).toBeInTheDocument()
      })
    })

    it('shows native name on wider viewports (sm:inline)', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await waitFor(() => {
        // The native name "English" is rendered in a span hidden below sm
        expect(screen.getByText('English')).toBeInTheDocument()
      })
    })

    it('renders triggerOnly mode without dropdown content', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" triggerOnly />)
      const btn = screen.getByRole('button', { name: /current language/i })
      await userEvent.click(btn)
      // No listbox should appear
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  // ================== Dropdown variant ==================

  describe('Dropdown variant', () => {
    it('opens dropdown on click', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      const btn = screen.getByRole('button', { name: /current language/i })
      await userEvent.click(btn)
      expect(screen.getByRole('listbox', { name: /select language/i })).toBeInTheDocument()
    })

    it('displays all 17 languages in dropdown', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => {
        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(17)
        // Check a representative sample of native names are present
        expect(screen.getByText('हिन्दी')).toBeInTheDocument()
        expect(screen.getByText('தமிழ்')).toBeInTheDocument()
        expect(screen.getByText('తెలుగు')).toBeInTheDocument()
        expect(screen.getByText('বাংলা')).toBeInTheDocument()
        expect(screen.getByText('Español')).toBeInTheDocument()
        expect(screen.getByText('Français')).toBeInTheDocument()
        expect(screen.getByText('Deutsch')).toBeInTheDocument()
        expect(screen.getByText('日本語')).toBeInTheDocument()
        expect(screen.getByText('简体中文')).toBeInTheDocument()
      })
    })

    it('marks selected language with aria-selected', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => {
        const selected = screen.getByRole('option', { selected: true })
        expect(selected).toBeInTheDocument()
        // Default language is en — the English name sub-label is "English"
        expect(selected).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('closes dropdown and fires callback on selection', async () => {
      const onChange = vi.fn()
      renderWithProvider(<LanguageSelector variant="dropdown" onLanguageChange={onChange} />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => expect(screen.getByText('Español')).toBeInTheDocument())
      await userEvent.click(screen.getByText('Español'))
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('es')
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('persists selection to localStorage', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => expect(screen.getByText('Deutsch')).toBeInTheDocument())
      await userEvent.click(screen.getByText('Deutsch'))
      await waitFor(() => {
        expect(localStorage.getItem('preferredLocale')).toBe('de')
      })
    })

    it('closes on Escape key', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      fireEvent.keyDown(document, { key: 'Escape' })
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('closes on outside click', async () => {
      renderWithProvider(
        <div>
          <LanguageSelector variant="dropdown" />
          <button data-testid="outside">Outside</button>
        </div>,
      )
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      fireEvent.mouseDown(screen.getByTestId('outside'))
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })
  })

  // ================== Search / filtering ==================

  describe('Search functionality', () => {
    it('filters languages by name', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      await userEvent.type(searchbox, 'Tamil')
      await waitFor(() => {
        expect(screen.getByText('தமிழ்')).toBeInTheDocument()
        expect(screen.queryByText('Deutsch')).not.toBeInTheDocument()
      })
    })

    it('filters languages by native name', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      await userEvent.type(searchbox, 'Français')
      await waitFor(() => {
        expect(screen.getByText('Français')).toBeInTheDocument()
        // Only 1 option should remain (French)
        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(1)
      })
    })

    it('filters languages by code', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      await userEvent.type(searchbox, 'ja')
      await waitFor(() => {
        expect(screen.getByText('日本語')).toBeInTheDocument()
      })
    })

    it('shows empty state when no match', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      await userEvent.type(searchbox, 'xyz123')
      await waitFor(() => {
        expect(screen.getByText(/no languages found/i)).toBeInTheDocument()
      })
    })

    it('clears search when a language is selected', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      await userEvent.type(searchbox, 'fran')
      await userEvent.click(screen.getByText('Français'))
      // Re-open
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => {
        const newSearchbox = screen.getByRole('searchbox', { name: /search languages/i }) as HTMLInputElement
        expect(newSearchbox.value).toBe('')
      })
    })
  })

  // ================== Bottom sheet variant ==================

  describe('Bottom sheet variant', () => {
    it('opens MobileBottomSheet on click', async () => {
      renderWithProvider(<LanguageSelector variant="sheet" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument()
    })

    it('shows region group headers', async () => {
      renderWithProvider(<LanguageSelector variant="sheet" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => {
        expect(screen.getByText('Indian Languages')).toBeInTheDocument()
        expect(screen.getByText('European Languages')).toBeInTheDocument()
        expect(screen.getByText('East Asian Languages')).toBeInTheDocument()
      })
    })

    it('selects a language from the sheet', async () => {
      const onChange = vi.fn()
      renderWithProvider(<LanguageSelector variant="sheet" onLanguageChange={onChange} />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => expect(screen.getByText('ಕನ್ನಡ')).toBeInTheDocument())
      await userEvent.click(screen.getByText('ಕನ್ನಡ'))
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('kn')
      })
    })

    it('filters within grouped sheet view', async () => {
      renderWithProvider(<LanguageSelector variant="sheet" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      await userEvent.type(searchbox, 'Portuguese')
      await waitFor(() => {
        expect(screen.getByText('Português')).toBeInTheDocument()
        expect(screen.queryByText('हिन्दी')).not.toBeInTheDocument()
      })
    })

    it('closes sheet via close button', async () => {
      renderWithProvider(<LanguageSelector variant="sheet" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /close/i }))
      await waitFor(() => {
        expect(screen.queryByTestId('mobile-bottom-sheet')).not.toBeInTheDocument()
      })
    })
  })

  // ================== Accessibility ==================

  describe('Accessibility', () => {
    it('trigger has aria-expanded and aria-haspopup', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      const btn = screen.getByRole('button', { name: /current language/i })
      expect(btn).toHaveAttribute('aria-haspopup', 'listbox')
      expect(btn).toHaveAttribute('aria-expanded', 'false')
      await userEvent.click(btn)
      expect(btn).toHaveAttribute('aria-expanded', 'true')
    })

    it('dropdown listbox has correct aria-label', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      expect(screen.getByRole('listbox', { name: /select language/i })).toBeInTheDocument()
    })

    it('each option has role="option"', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const options = screen.getAllByRole('option')
      expect(options.length).toBe(17)
    })

    it('search input has role="searchbox" and aria-label', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      const searchbox = screen.getByRole('searchbox', { name: /search languages/i })
      expect(searchbox).toBeInTheDocument()
    })

    it('announces language change to screen readers', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await userEvent.click(screen.getByText('हिन्दी'))
      // The useLanguage hook adds a temporary role="status" element
      await waitFor(() => {
        const statusEl = document.querySelector('[role="status"]')
        expect(statusEl).not.toBeNull()
        expect(statusEl?.textContent).toContain('Hindi')
      })
    })
  })

  // ================== Edge cases ==================

  describe('Edge cases', () => {
    it('handles rapid language switching without errors', async () => {
      const onChange = vi.fn()
      renderWithProvider(<LanguageSelector variant="dropdown" onLanguageChange={onChange} />)
      const btn = screen.getByRole('button', { name: /current language/i })

      // Switch 1
      await userEvent.click(btn)
      await waitFor(() => expect(screen.getByText('Español')).toBeInTheDocument())
      await userEvent.click(screen.getByText('Español'))

      // Switch 2
      await userEvent.click(btn)
      await waitFor(() => expect(screen.getByText('Français')).toBeInTheDocument())
      await userEvent.click(screen.getByText('Français'))

      // Switch 3
      await userEvent.click(btn)
      await waitFor(() => expect(screen.getByText('Deutsch')).toBeInTheDocument())
      await userEvent.click(screen.getByText('Deutsch'))

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledTimes(3)
        expect(onChange).toHaveBeenLastCalledWith('de')
      })
    })

    it('does not break when onLanguageChange is omitted', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => expect(screen.getByText('Português')).toBeInTheDocument())
      // Should not throw
      await userEvent.click(screen.getByText('Português'))
    })

    it('passes custom className to trigger', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" className="my-custom-class" />)
      const btn = screen.getByRole('button', { name: /current language/i })
      expect(btn.className).toContain('my-custom-class')
    })

    it('updates document.lang attribute on selection', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      await waitFor(() => expect(screen.getByText('தமிழ்')).toBeInTheDocument())
      await userEvent.click(screen.getByText('தமிழ்'))
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('ta')
      })
    })

    it('footer shows correct language count', async () => {
      renderWithProvider(<LanguageSelector variant="dropdown" />)
      await userEvent.click(screen.getByRole('button', { name: /current language/i }))
      expect(screen.getByText('17 languages available')).toBeInTheDocument()
    })
  })
})
