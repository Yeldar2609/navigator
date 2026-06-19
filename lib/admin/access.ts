// Who may see the admin dashboard. Students are never admins. In configured
// installs the role comes from organization_memberships; the page/API enforce it.
export const ADMIN_ROLES = ['teacher', 'admin', 'super_admin'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role)
}
