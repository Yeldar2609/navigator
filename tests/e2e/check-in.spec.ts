import { expect, test } from '@playwright/test'

// Check-ins must actually persist (Day-3 turned the stub into a real local store).
// Save one, see it in history, and confirm it survives a reload.
test('check-in: saving persists across reload', async ({ page }) => {
  await page.goto('/en/check-ins')
  await expect(page.getByText('No check-ins yet')).toBeVisible()

  // Save a check-in with the default scale values (mood 3/5).
  await page.getByRole('button', { name: 'Save check-in' }).click()
  await expect(page.getByText('Mood 3/5')).toBeVisible()
  await expect(page.getByText('No check-ins yet')).toHaveCount(0)

  // Reload — the entry is read back from the local store.
  await page.reload()
  await expect(page.getByText('Mood 3/5')).toBeVisible()
})
