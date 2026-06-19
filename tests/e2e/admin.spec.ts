import { expect, test } from '@playwright/test'

// Admin dashboard (demo preview): summary cards, the student table, and a
// detail drawer that opens for a student.
test('admin dashboard lists students and opens a detail drawer', async ({ page }) => {
  await page.goto('/en/admin')
  await expect(page.getByText('Demo data')).toBeVisible()
  await expect(page.getByText('May need support')).toBeVisible()

  // Open a student → detail drawer with their recommendations.
  await page.getByRole('button', { name: /Aru/ }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  // Scope to the drawer — the print-only report also contains this label.
  await expect(drawer.getByText('Top recommendations')).toBeVisible()
})
