# Data Sources & Provenance — Kim Bolam

The app shows salary, demand/trend, and university information. To stay trustworthy with students, every
such figure must carry **provenance** and must never be invented by the AI.

## Principle
- Verified official data → label with the source.
- Not yet verified → show as a clearly-labeled **"curated estimate"** with a provenance note.
- The AI counselor must **never** generate salary/demand numbers or admissions requirements; it defers
  to official sources and a trusted adult.

## Approved / intended sources (Kazakhstan)
- **Enbek** (Electronic Labour Exchange, enbek.kz) — vacancies, demand signals, occupation info.
- **Bureau of National Statistics (stat.gov.kz)** — wages by sector/region.
- **Ministry of Science and Higher Education** — official university/admissions information.
- Individual **university** official sites — admissions details (must be verified per-year).

## Provenance fields (data model)
Career/major/university catalog entries should carry, where applicable:
- `salaryEstimate` + `salarySource` (`enbek` | `stat_gov_kz` | `curated_estimate`)
- `demandScore` + `demandSource`
- `source` / `sourceUrl` / `verifiedAt` for university admissions facts
- a `provenance` of `curated_estimate` when not yet officially verified

> Implementation note: if the current `Career`/`Major` TypeScript types do not yet include these
> fields, add them in a dedicated curated provenance file/table rather than mutating the core type, so
> existing consumers and tests stay green. Track this as a follow-up.

## Universities
- Recommend only from the curated app catalog. Do not invent admissions requirements. If official data
  isn't present yet, show **"verify official admissions details."**

## Status (Day 6)
Salary/demand provenance scaffolding is documented; precise verified figures are a follow-up requiring
sourcing from the official datasets above. Until then, any displayed estimate is labeled as such.
