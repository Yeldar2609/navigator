// Who may see the admin dashboard. Students are never admins.
//
// Authorization is a Firebase CUSTOM CLAIM (`admin: true`) baked into the user's
// ID token by an out-of-band script (scripts/set-admin.mjs, run by an operator
// with ADC). EVERY admin API route MUST call `requireAdmin(req)` first and 403
// when it returns null. Identity (uid) and the claim are read ONLY from the
// verified token — never from the request body, query, headers, or cookies.
import { getAuthedUser } from '@/lib/firebase/admin'

// Legacy Supabase role labels — retained only for the demo/preview path and any
// older callers. They confer NO admin access in the Firebase model below.
export const ADMIN_ROLES = ['teacher', 'admin', 'super_admin'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role)
}

/**
 * Gate for every admin API route. Verifies the bearer token and returns the
 * caller's uid ONLY when the token carries the `admin: true` custom claim.
 * Returns null otherwise (caller must respond 403). Never trusts a uid/role from
 * the request body or query — both identity and the claim come from the token.
 */
export async function requireAdmin(req: Request): Promise<{ uid: string } | null> {
  const decoded = await getAuthedUser(req)
  if (!decoded) return null
  // The claim is set server-side via setCustomUserClaims and is part of the
  // signed token, so it cannot be forged by the client.
  if (decoded.admin !== true) return null
  return { uid: decoded.uid }
}
