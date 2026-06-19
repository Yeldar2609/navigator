import { afterEach, describe, expect, it, vi } from 'vitest'

// lib/env reads process.env at call time, so we can flip env per-test.
async function freshEnv() {
  vi.resetModules()
  return import('@/lib/env')
}

const ORIGINAL = { ...process.env }
afterEach(() => {
  process.env = { ...ORIGINAL }
})

describe('env: production fail-closed', () => {
  it('throws when a critical var is missing in production', async () => {
    process.env.APP_ENV = 'production'
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY
    const env = await freshEnv()
    expect(() => env.assertProductionEnv()).toThrow(/missing required env/i)
  })

  it('does not throw in development even with vars missing', async () => {
    process.env.APP_ENV = 'development'
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const env = await freshEnv()
    expect(() => env.assertProductionEnv()).not.toThrow()
  })

  it('does not throw in production when all critical vars are present', async () => {
    Object.assign(process.env, {
      APP_ENV: 'production',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'k',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'kim-bolam',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'app',
      FIREBASE_ADMIN_CLIENT_EMAIL: 'a@b.iam',
      FIREBASE_ADMIN_PRIVATE_KEY: 'key',
    })
    const env = await freshEnv()
    expect(() => env.assertProductionEnv()).not.toThrow()
  })
})

describe('env: AI counselor configured gate', () => {
  it('is disabled unless enabled AND agent id present', async () => {
    process.env.ENABLE_AI_COUNSELOR = 'true'
    process.env.DIALOGFLOW_CX_PROJECT_ID = 'kim-bolam'
    process.env.DIALOGFLOW_CX_LOCATION = ''
    process.env.DIALOGFLOW_CX_AGENT_ID = ''
    const env = await freshEnv()
    expect(env.isAiCounselorConfigured()).toBe(false)
  })

  it('is enabled when fully configured', async () => {
    process.env.ENABLE_AI_COUNSELOR = 'true'
    process.env.DIALOGFLOW_CX_PROJECT_ID = 'kim-bolam'
    process.env.DIALOGFLOW_CX_LOCATION = 'us-central1'
    process.env.DIALOGFLOW_CX_AGENT_ID = 'agent-123'
    const env = await freshEnv()
    expect(env.isAiCounselorConfigured()).toBe(true)
  })
})
