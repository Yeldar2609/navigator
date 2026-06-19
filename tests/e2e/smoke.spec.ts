import { expect, test } from '@playwright/test'

test('landing loads for /en', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('h1')).toBeVisible()
})

test('landing loads for /ru', async ({ page }) => {
  await page.goto('/ru')
  await expect(page.locator('h1')).toBeVisible()
})

test('landing loads for /kk', async ({ page }) => {
  await page.goto('/kk')
  await expect(page.locator('h1')).toBeVisible()
})

test('language switcher exposes three locales', async ({ page }) => {
  await page.goto('/en')
  const group = page.getByRole('group', { name: 'Language' })
  await expect(group.locator('a')).toHaveCount(3)
})

test('sign-in page loads', async ({ page }) => {
  await page.goto('/en/auth/sign-in')
  await expect(page.getByText('Welcome back')).toBeVisible()
})
