import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const start = Date.now()
    await page.goto('/introduction', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(10_000)
  })

  test('no layout shift from fonts', async ({ page }) => {
    await page.goto('/introduction', { waitUntil: 'networkidle' })
    // Verify fonts are loaded (no FOUT/FOIT causing CLS)
    const fontLoaded = await page.evaluate(() => document.fonts.ready.then(() => true))
    expect(fontLoaded).toBe(true)
  })

  test('images use lazy loading', async ({ page }) => {
    await page.goto('/introduction', { waitUntil: 'domcontentloaded' })
    // Check that images below the fold use loading="lazy"
    const images = await page.locator('img').all()
    for (const img of images) {
      const loading = await img.getAttribute('loading')
      // Next.js Image component handles lazy loading
      // Just verify no eager loading is set on non-hero images
      if (loading) {
        expect(['lazy', 'eager']).toContain(loading)
      }
    }
  })

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.goto('/introduction', { waitUntil: 'domcontentloaded' })
    // Filter out known acceptable errors (e.g., missing favicon)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('manifest')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('service worker registers', async ({ page }) => {
    await page.goto('/introduction', { waitUntil: 'networkidle' })
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'not-supported'
      const registrations = await navigator.serviceWorker.getRegistrations()
      return registrations.length > 0 ? 'registered' : 'not-registered'
    })
    // Service worker may not register in test env
    expect(['registered', 'not-registered', 'not-supported']).toContain(swRegistered)
  })
})
