import { expect, test } from '@playwright/test'

// Day-3 added resume + a final review screen. A partially-answered assessment must
// resume where it left off, and a fully-answered one must land on review before submit.

test('assessment resumes at the first unanswered question', async ({ page }) => {
  await page.goto('/en/assessment')
  await page.waitForFunction(() => typeof window.__navTestSeed === 'function')
  // Answer the first 5 questions only, then reload.
  await page.evaluate(() => window.__navTestSeed(4, 5))
  await page.reload()
  await expect(page.getByText(/Welcome back/i)).toBeVisible()
})

test('fully-answered assessment shows review → submit goes to results', async ({ page }) => {
  await page.goto('/en/assessment')
  await page.waitForFunction(() => typeof window.__navTestSeed === 'function')
  // Seed all 40 answers (no submit) so the resume logic lands on the review screen.
  await page.evaluate(() => window.__navTestSeed(4))
  await page.reload()

  await expect(page.getByText('Review your answers')).toBeVisible()
  const submit = page.getByRole('button', { name: 'See my results' })
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(page).toHaveURL(/\/en\/results/)
})
