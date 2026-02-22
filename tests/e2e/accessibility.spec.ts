import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('skip to content link exists', async ({ page }) => {
    await page.goto('/introduction')
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeAttached()
  })

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/introduction')
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('viewport allows zooming', async ({ page }) => {
    await page.goto('/introduction')
    const viewport = page.locator('meta[name="viewport"]')
    const content = await viewport.getAttribute('content')
    expect(content).not.toContain('user-scalable=no')
    expect(content).not.toContain('maximum-scale=1')
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/introduction')
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `Image ${i} missing alt text`).toBeTruthy()
    }
  })
})
