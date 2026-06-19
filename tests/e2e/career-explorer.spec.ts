import { expect, test } from '@playwright/test'

// Day-3 seed expansion: opening a career in the explorer surfaces related majors
// (linked by route + subject affinity), replacing the old "coming soon" stub.
test('career explorer: opening a career shows related majors', async ({ page }) => {
  await page.goto('/en/career-explorer')
  await page.getByRole('button', { name: 'Software Developer' }).click()
  await expect(page.getByText('Majors that lead here')).toBeVisible()
  await expect(page.getByText('Computer Science')).toBeVisible()
})
