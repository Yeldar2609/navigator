# Data Sources & Provenance — Kim Bolam

The app shows salary, demand/trend, and university information. To stay trustworthy with students, every
such figure must carry **provenance** and must never be invented by the AI.

## Principle
- Verified official data → label with the source.
- Not yet verified → show as a clearly-labeled **"curated estimate"** with a provenance note.
- The AI counselor must **never** generate salary/demand numbers or admissions requirements; it defers
  to official sources and a trusted adult.

## Approved / intended sources (Kazakhstan)
- **Enbek — Electronic Labour Exchange** (enbek.kz, https://www.enbek.kz) — single state
  employment platform; daily-updated vacancies and job-seeker data, occupation info, and the
  Atlas of New Professions. Source for demand/trend signals. See also the eGov description:
  https://egov.kz/cms/en/articles/enbek_kz
- **Bureau of National Statistics** of the Agency for Strategic Planning and Reforms
  (stat.gov.kz / new.stat.gov.kz) — **average monthly nominal wage by type of economic activity
  and by region**. Labor & income section:
  https://stat.gov.kz/en/industries/labor-and-income/stat-wags/
  Quarterly wage releases (e.g. Q1 2025): https://stat.gov.kz/en/news/wages-in-i-quarter-of-2025/
- **Ministry of Science and Higher Education of the Republic of Kazakhstan** — official body for
  universities and higher education: https://www.gov.kz/memleket/entities/sci
- Individual **university** official sites — admissions details (must be verified per-year).

### Anchor figures used for curated estimates (NOT per-occupation verified)
These are real published aggregates from stat.gov.kz, used only to keep curated salary ranges
plausible. They are sector/national aggregates, **not** verified per-occupation figures:
- National average nominal monthly wage ≈ **423,133 ₸** (Q1 2025).
- Sector premiums vs. the national average: **mining & quarrying ≈ 2.1×**,
  **information & communication ≈ 1.9×**, **professional/scientific/technical ≈ 1.5×**.
  (Source: stat.gov.kz wage releases, 2024–2025.)

## Provenance fields (data model)
Implemented on the `Career` interface in `lib/methodology/careers-data.ts`. All four are
**optional**, so existing data, consumers (the recommendation engine) and tests stay green:
- `salaryEstimateKzt?` — a curated monthly range string, e.g. `"400000–900000 ₸/мес"`.
- `salarySource?` — `'enbek' | 'stat_gov_kz' | 'curated_estimate'`.
- `demandTrend?` — `'growing' | 'stable' | 'declining'`.
- `demandSource?` — `'enbek' | 'curated_estimate'`.

A representative subset (~25 well-known careers across all five routes) is populated; every
populated entry currently uses `salarySource: 'curated_estimate'` / `demandSource:
'curated_estimate'`. Ranges are anchored to the stat.gov.kz aggregates above but are **not**
verified per-occupation. The remaining careers leave the fields unset (treated as curated).
A `// TODO(provenance): replace curated estimates with verified Enbek/stat.gov.kz figures`
comment marks this in the source.

> The AI counselor must never emit these numbers itself; the UI must render them as
> **"curated estimate"** with a link/reference to the official source, never as verified salary.

## Universities
- Curated catalog in `lib/methodology/universities-data.ts` (`UNIVERSITIES` + `UNIVERSITIES_BY_SLUG`),
  matching the style of `careers-data.ts` / `majors-data.ts`. ~8 real institutions
  (Nazarbayev University, KazNU al-Farabi, ENU Gumilyov, KBTU, Satbayev University, KIMEP, AlmaU, SDU).
- Each entry carries: `slug`, trilingual `name` + `city` + `description` (`{en,ru,kk}`), `routes`
  and `clusters` (reusing the existing `Route`/`Cluster` enums — no new ones invented),
  `source` / `sourceUrl`, and **`verifyAdmissions: true`**.
- `verifyAdmissions: true` means **"verify official admissions details."** Admissions requirements,
  tuition and ENT thresholds are deliberately **not** stored here and must be verified per-year against
  the university's official site and the Ministry of Science and Higher Education. Recommend only from
  this curated catalog; do not invent admissions requirements.

## Status (Day 6)
- Provenance fields are live on `Career` (optional) and populated for a representative subset as
  clearly-labeled **curated estimates**; precise verified per-occupation figures remain a follow-up
  requiring sourcing from Enbek / stat.gov.kz.
- A curated universities catalog ships with `verifyAdmissions: true` on every entry.
- Until figures are verified, any displayed salary/demand value is shown as a curated estimate, and
  universities show **"verify official admissions details."**
