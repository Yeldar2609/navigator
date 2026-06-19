import { expect, test } from '@playwright/test'

// The authenticated shell shows a fixed bottom tab bar on small screens.
test('mobile bottom nav is present on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/en/dashboard')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Plan' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Check-ins' })).toBeVisible()
})
