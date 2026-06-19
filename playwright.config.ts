import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  // Full-journey specs (onboarding → assessment → results → plan) run against the
  // production server on OneDrive I/O; under parallel load they legitimately need
  // more than 30s, so give heavy journeys headroom instead of flaking.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Serve the production build: pre-rendered pages load instantly, which keeps
  // the smoke suite fast and reliable (dev's on-demand compile is too slow here,
  // especially under OneDrive I/O). Requires `npm run build` first.
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000/en',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
