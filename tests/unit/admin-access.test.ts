import { describe, expect, it } from 'vitest'
import { isAdminRole } from '@/lib/admin/access'

describe('admin access helper', () => {
  it('allows staff roles', () => {
    expect(isAdminRole('teacher')).toBe(true)
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('super_admin')).toBe(true)
  })

  it('blocks students and unknown/empty roles', () => {
    expect(isAdminRole('student')).toBe(false)
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
    expect(isAdminRole('')).toBe(false)
  })
})
