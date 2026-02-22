import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('homepage redirects to introduction', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/introduction/)
  })

  test('introduction page loads successfully', async ({ page }) => {
    await page.goto('/introduction')
    await expect(page).toHaveTitle(/MindVibe/)
    await expect(page.locator('main, [id="main-content"], body')).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle(/MindVibe/)
  })

  test('tools page loads', async ({ page }) => {
    await page.goto('/tools')
    await expect(page).toHaveTitle(/MindVibe/)
  })

  test('404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.locator('text=Page Not Found, text=not found, text=404').first()).toBeVisible()
  })
})
