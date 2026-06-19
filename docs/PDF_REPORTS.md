# PDF Reports

Student reports in Kim Bolam. This consolidates and extends `docs/REPORTS.md`
with the privacy and storage model, and clearly separates what is **implemented
today** from what is **planned**.

## What the report contains

Source today: the printable section in
`components/admin/admin-dashboard.tsx` (the `hidden print:block` block).

- Report title
- Student name + grade
- Latest result: **route** + **career readiness** (e.g. `72/100`)
- **Strengths** (top blocks) and **growth areas** (bottom blocks)
- **Top recommended careers**
- **Plan progress** (`done / total`)
- A **disclaimer**: readiness reflects self-awareness (not ability), and career
  relevance is curated demo data — not official labor-market figures.

The report is built from the same versioned snapshot the scoring engine produces
(`StudentResultSnapshot` carries `methodology_version` / `scoring_version` /
`template_version`), so a report can be stamped with the methodology version it
was generated under.

## Privacy invariants (must hold for every report)

- **Reports are private to the student.** A report is the student's own data.
- **Exclude chat history.** No counselor conversation is ever included.
- **Exclude raw answers.** Only derived results (scores, route, clusters,
  strengths/growth, recommendations, plan progress) appear — never the per-item
  1–5 responses.
- This mirrors the counselor context rule (`lib/ai/context-builder.ts`), which
  also deliberately excludes raw answers, email, name, and identifiers beyond
  what is needed.

## Intended storage model (private Cloud Storage + authorized access)

Defined by `storage.rules` and `lib/env.ts` / `lib/firebase/admin.ts`:

- Report files live under **`reports/{uid}/`** in **private Cloud Storage**.
- **Read:** only the owner (`request.auth.uid == uid`). **Write:** `false` for
  all clients — files are written **server-side via the Admin SDK only**
  (`getAdminBucket()`); the bucket is `reportBucket` (`REPORT_BUCKET` →
  `FIREBASE_STORAGE_BUCKET` → client storage bucket).
- **Report metadata** lives in Firestore at `users/{uid}/reports/{reportId}`:
  owner-readable, **server-write-only** (`firestore.rules`).
- **Admin access** to a student's report is mediated by an **authorized server
  route** that issues a **signed URL** (or an authorized download route) — there
  is no client rule path that lets one user read another's report.

## Implemented today vs. planned

### Implemented today — printable HTML
- A **print-only HTML layout** rendered from the admin detail drawer. The
  **Print report** button calls `window.print()`; the interactive UI is
  `print:hidden` while a clean report is `hidden print:block`.
- Supported path to a PDF today: **Print → Save as PDF** from the browser.
- This is intentionally a robust HTML artifact (usable for school/government
  pilots) rather than a fragile server PDF pipeline.

### Planned (post-MVP)
- `POST /api/export/student-report` — **server-side report generation**.
- **Server-side PDF rendering** written to **private Cloud Storage** under
  `reports/{uid}/`, never local disk, with access via signed URL / authorized
  route. (Storage rules and Admin SDK plumbing already exist; the export route
  and PDF renderer do not yet.)
- Persist export metadata (Firestore `reports` collection; legacy `exports`
  table on Supabase).
- Stamp methodology version + scoring version into the report header.
- Separate **student-facing** (positive, simple) vs **educator/admin** (more
  detail) report variants.

> Storage note: the legacy `docs/REPORTS.md` references **Supabase Storage** (the
> earlier backend). The Day-6 direction is **Firebase Cloud Storage**
> (`reports/{uid}/`); Supabase remains the documented legacy/fallback.
