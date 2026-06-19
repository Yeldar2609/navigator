# Admin Dashboard

A calm, useful overview for school staff — intentionally simple, and never more
prominent than the student experience.

## Access control

- **Roles** live in `organization_memberships.role` ∈ `student | teacher | admin | super_admin`.
- Staff = `teacher | admin | super_admin` (`lib/admin/access.ts → isAdminRole`). **Students are
  never admins.**
- **Configured installs:** `/api/admin/students` enforces the guard — it resolves the caller's
  membership and returns **403** if they lack a staff role, then returns only students in the
  admin's own organization (RLS-scoped). Tested via `tests/unit/admin-access.test.ts`.
- **Demo mode:** the whole demo is unauthenticated (onboarding, results, etc. are all open), so
  `/admin` is an **open preview** populated with clearly-labelled sample students
  (`lib/admin/demo-students.ts`, "Demo data" badge + note). It is sample data, not real people,
  and the page states that production access is staff-only.

## Sections

- **Summary cards:** total students, assessments done, average readiness, top direction, and a
  "may need support" count (students who haven't started, scored low awareness, or have a plan
  with no progress).
- **Filters:** grade, direction (route), readiness (awareness level), assessment completed.
- **Student table:** name (+ support tag), grade, direction, readiness, plan progress, last
  check-in, and a row action that opens the detail drawer.
- **Detail drawer:** profile, latest result (route / readiness / awareness / cluster), strengths,
  growth areas, top recommendations, plan progress, and check-ins — plus **Print report**.

## Reports (today)

The drawer's **Print report** renders a clean, print-only report layout (`print:block`) and calls
`window.print()` — a printable HTML report usable for school/government pilots. A server-side PDF
export endpoint (`/api/export/student-report`) + the `exports` table + Supabase Storage are a
documented **TODO** (`docs/REPORTS.md`).

## Design intent

Trustworthy and clean; official enough for a pilot, but not flashy. The student-facing product
remains the priority — the admin view is a support tool, not the centerpiece.
