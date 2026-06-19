# Reports

## Today: printable HTML

The student report ships as a **print-only HTML layout** rendered from the admin detail drawer
(`components/admin/admin-dashboard.tsx`). The drawer's **Print report** button calls
`window.print()`; a `hidden print:block` section renders a clean report while the interactive UI
is `print:hidden`.

Report contents: title, student + grade, latest result (route + readiness), strengths, growth
areas, top recommendations, plan progress, and a disclaimer that readiness reflects
self-awareness (not ability) and that career relevance is curated demo data (not official
labor-market figures).

This is intentionally a printable HTML artifact (usable for school/government pilots) rather than
a fragile PDF pipeline.

## Post-MVP (TODO)

- `POST /api/export/student-report` — server-side report generation.
- Persist export metadata to the `exports` table; write the file to **Supabase Storage** (never
  local disk in production).
- Server-side **PDF** rendering once a stable, dependency-light approach is chosen; until then the
  printable HTML (Print → Save as PDF) is the supported path.
- Methodology version + scoring version stamped into the report header (the snapshot already
  carries `methodology_version` / `scoring_version` / `template_version`).
- Separate student-facing (positive, simple) vs educator/admin (more detail) report variants.
