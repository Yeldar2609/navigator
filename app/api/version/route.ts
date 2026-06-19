import { NextResponse } from 'next/server'
import { appEnv } from '@/lib/env'
import { isAiCounselorConfigured, isFirebaseAdminConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Build/version metadata — safe to expose (no secrets). */
export async function GET() {
  return NextResponse.json({
    name: 'Kim Bolam',
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
    commit: process.env.NEXT_PUBLIC_COMMIT_SHA ?? process.env.K_REVISION ?? 'dev',
    env: appEnv(),
    backend: isFirebaseAdminConfigured() ? 'firebase' : 'demo',
    aiCounselor: isAiCounselorConfigured() ? 'enabled' : 'disabled',
  })
}
