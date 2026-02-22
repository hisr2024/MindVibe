import { test, expect } from '@playwright/test'

test.describe('SEO', () => {
  test('introduction page has meta description', async ({ page }) => {
    await page.goto('/introduction')
    const metaDesc = page.locator('meta[name="description"]')
    await expect(metaDesc).toBeAttached()
    const content = await metaDesc.getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(50)
  })

  test('page has Open Graph tags', async ({ page }) => {
    await page.goto('/introduction')
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toBeAttached()
    const ogDesc = page.locator('meta[property="og:description"]')
    await expect(ogDesc).toBeAttached()
  })

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
  })

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)
    const text = await response?.text()
    expect(text).toContain('Sitemap:')
  })

  test('JSON-LD structured data exists', async ({ page }) => {
    await page.goto('/introduction')
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd).toBeAttached()
    const content = await jsonLd.textContent()
    const data = JSON.parse(content!)
    expect(data['@context']).toBe('https://schema.org')
  })
})
