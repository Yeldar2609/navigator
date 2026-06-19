import { NextResponse } from 'next/server'
import type { ZodSchema } from 'zod'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

/** Day-1 placeholder for endpoints that are wired up on Day 2. */
export function notImplemented(endpoint: string) {
  return NextResponse.json(
    { ok: false, status: 'not_implemented', endpoint, message: 'This endpoint wires up on Day 2.' },
    { status: 501 },
  )
}

type ParseResult<T> = { success: true; data: T } | { success: false; response: NextResponse }

/** Parse + validate a JSON request body, returning a ready error response on failure. */
export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<ParseResult<T>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { success: false, response: fail('Invalid JSON body', 400) }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, response: fail('Validation failed', 422, { issues: parsed.error.issues }) }
  }
  return { success: true, data: parsed.data }
}
