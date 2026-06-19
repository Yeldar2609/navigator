import { expect, test } from '@playwright/test'

// Full demo journey: onboarding → assessment (filled via the demo test hook)
// → results → one-month plan. Runs against the production server (demo mode,
// no Supabase), so persistence is the client localStorage store.
test('demo journey: onboarding → assessment → results → plan', async ({ page }) => {
  await page.goto('/en/onboarding')

  // Step 1 — basics (name + grade required to advance)
  await page.locator('#name').fill('Aru')
  await page.getByRole('button', { name: '9', exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  // Step 2 — subjects
  await page.getByRole('button', { name: 'Informatics' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  // Step 3 — goals
  await page.getByRole('button', { name: 'Continue' }).click()
  // Step 4 — confidence & support → finish
  await page.getByRole('button', { name: 'Finish' }).click()

  // Celebration → start assessment
  await page.getByRole('link', { name: /start the assessment/i }).click()
  await expect(page).toHaveURL(/\/en\/assessment/)

  // Fill all 40 answers + submit via the demo test hook
  await page.waitForFunction(() => typeof window.__navTestFill === 'function')
  await page.evaluate(() => window.__navTestFill(4))

  // Results
  await page.goto('/en/results')
  await expect(page.getByText('Career Readiness Score', { exact: true })).toBeVisible()
  await expect(page.getByText('match', { exact: false }).first()).toBeVisible()

  // Methodology transparency: "How we calculated this" disclosure opens with detail
  await page.getByText('How we calculated this').click()
  await expect(page.getByText('The six areas')).toBeVisible()

  // Build the one-month plan
  await page.getByRole('button', { name: /build my plan/i }).click()
  await expect(page).toHaveURL(/\/en\/plan/)
  await expect(page.getByText(/Explore/i).first()).toBeVisible()
})
