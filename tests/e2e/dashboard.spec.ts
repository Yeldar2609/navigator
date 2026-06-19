import { expect, test } from '@playwright/test'

// The dashboard ("Your path today") is the calm home: it invites a first-timer to
// the assessment, then after results surfaces a greeting and the next concrete step.
test('dashboard: start state → greeting + buildable step after assessment', async ({ page }) => {
  // A fresh visitor (empty local store) is invited to start the assessment.
  await page.goto('/en/dashboard')
  await expect(page.getByText('Start with the assessment')).toBeVisible()

  // Onboarding (name + grade required)
  await page.goto('/en/onboarding')
  await page.locator('#name').fill('Aru')
  await page.getByRole('button', { name: '9', exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Informatics' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Finish' }).click()

  // Assessment via the demo test hook (fills 40 + submits → a result exists)
  await page.getByRole('link', { name: /start the assessment/i }).click()
  await expect(page).toHaveURL(/\/en\/assessment/)
  await page.waitForFunction(() => typeof window.__navTestFill === 'function')
  await page.evaluate(() => window.__navTestFill(4))

  // Dashboard now greets by name and offers to build the plan.
  await page.goto('/en/dashboard')
  await expect(page.getByText('Hi, Aru')).toBeVisible()
  const build = page.getByRole('button', { name: /build my plan/i })
  await expect(build).toBeVisible()

  // Building a plan surfaces a concrete, completable step.
  await build.click()
  await expect(page.getByRole('button', { name: 'Mark done' })).toBeVisible()
})
