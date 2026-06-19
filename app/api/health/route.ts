import { NextResponse } from 'next/server'
import { locales } from '@/lib/i18n/config'
import { APP_NAME } from '@/lib/utils/constants'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    app: APP_NAME,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    locales,
  })
}
