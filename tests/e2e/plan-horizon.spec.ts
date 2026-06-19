import { expect, test } from '@playwright/test'

// Regression guard for the horizon-change data-loss bug: switching the plan
// horizon must NOT wipe completed-item progress. HORIZON_SEQUENCE is a prefix
// chain, so month 1 is identical across horizons — its checked items must carry
// over. Before the fix, changing horizon rebuilt every item as 'todo'.
test('changing plan horizon preserves completed progress', async ({ page }) => {
  // Onboarding (name + grade are required to advance)
  await page.goto('/en/onboarding')
  await page.locator('#name').fill('Aru')
  await page.getByRole('button', { name: '9', exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Informatics' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()

  // Assessment via the demo test hook
  await page.getByRole('link', { name: /start the assessment/i }).click()
  await expect(page).toHaveURL(/\/en\/assessment/)
  await page.waitForFunction(() => typeof window.__navTestFill === 'function')
  await page.evaluate(() => window.__navTestFill(4))

  // Build the 1-month plan (4 weekly actions)
  await page.goto('/en/results')
  await page.getByRole('button', { name: /build my plan/i }).click()
  await expect(page).toHaveURL(/\/en\/plan/)

  // Complete this week's action → 1 of 4 done
  await page.getByRole('button', { name: 'Mark done' }).click()
  await expect(page.getByText('1 of 4 done')).toBeVisible()

  // Switch to the 3-month horizon (12 actions). The shared month-1 action must
  // stay done — progress carries over instead of resetting to 0.
  await page.getByRole('button', { name: '3 months', exact: true }).click()
  await expect(page.getByText('1 of 12 done')).toBeVisible()
})
