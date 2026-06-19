import { expect, test } from '@playwright/test'

// Retake produces a second attempt and a non-judgmental comparison of the two.
test('retake assessment shows a comparison of the two attempts', async ({ page }) => {
  // Attempt 1 (high answers)
  await page.goto('/en/assessment')
  await page.waitForFunction(() => typeof window.__navTestFill === 'function')
  await page.evaluate(() => window.__navTestFill(5))

  // Retake from the results page
  await page.goto('/en/results')
  await page.getByRole('button', { name: /retake assessment/i }).click()
  await expect(page).toHaveURL(/\/en\/assessment/)

  // Attempt 2 (low answers → a different result)
  await page.waitForFunction(() => typeof window.__navTestFill === 'function')
  await page.evaluate(() => window.__navTestFill(2))

  // The comparison card appears with its reassuring framing.
  await page.goto('/en/results')
  await expect(page.getByText(/Changing results is normal/i)).toBeVisible()
  await expect(page.getByText('Your assessments')).toBeVisible()
})
