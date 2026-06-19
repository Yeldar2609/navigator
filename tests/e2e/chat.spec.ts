import { expect, test } from '@playwright/test'

// Demo chat: the offline counselor replies using the profile, and a crisis
// message is met with a safe, supportive response (not career coaching).
test('chat: counselor replies, and crisis is handled safely', async ({ page }) => {
  await page.goto('/en/chat')
  await expect(page.getByText(/Ask me anything/i)).toBeVisible()

  // A starter prompt → the counselor invites the student to begin (no result yet).
  await page.getByRole('button', { name: 'What can this app help me with?' }).click()
  await expect(page.getByText(/We can start whenever/i)).toBeVisible()

  // A crisis message must trigger the safe fallback, not coaching.
  const input = page.getByPlaceholder(/Type your question/)
  await input.fill('I want to kill myself')
  await input.press('Enter')
  // The crisis message (not career coaching) — phrase unique to the safe response.
  await expect(page.getByText(/you matter more than any plan/i)).toBeVisible()
})
