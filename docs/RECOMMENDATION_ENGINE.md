# Recommendation Engine

How a scored result becomes a set of careers, majors, subjects, and skills, plus
how the "why this fits" explanation is produced. All logic is **deterministic**
and lives in `lib/methodology/`.

> **Data note.** Careers and majors are **curated demo data**
> (`careers-data.ts`, `majors-data.ts`) mirroring `supabase/seed.sql`.
> `marketRelevance` is a curated demo signal, **not** live labor-market data.
> The Day-6 plan targets 100+ careers / ~30 majors with formalized provenance;
> today the catalog is smaller (~41 careers, ~25 majors).

## Inputs

`recommendCareers(input)` (`recommendations.ts`) consumes a `RecommendInput`
derived from the scored result and the student's onboarding profile:

- `primaryRoute`, `primaryCluster`, `secondaryCluster` — from scoring.
- `favoriteSubjects`, `currentGoals` — from onboarding (tag keys).
- `gradeLevel` — numeric grade (or null).
- `careers` — defaults to the full `CAREERS` catalog.

## Career entry shape (`careers-data.ts`)

```ts
interface Career {
  slug: string                 // stable id, e.g. 'software_developer'
  route: Route                 // one of the 5 routes
  clusterBias: Cluster[]       // clusters this career leans toward
  subjectTags: string[]        // same keys as onboarding favoriteSubjects
  goalTags: string[]           // same keys as onboarding currentGoals
  skillTags: string[]          // drives skill-gap / what-to-learn-next
  marketRelevance: number      // 0..100 curated demo relevance
  name: Record<Locale, string> // en/ru/kk display names
}
```

`CAREERS_BY_SLUG` provides O(1) lookup. Subject/goal/skill tags are the same
finite keys used in onboarding and `tag-labels.ts`, so overlap scoring "just
works" and labels stay localized.

## Scoring one career (`scoreCareer`)

Each career is scored against the student profile using fixed weights from
`RECOMMENDATION_WEIGHTS` (`scoring-config.ts`); max ≈ 90:

| Signal | Points |
|---|---|
| Route match (`career.route === primaryRoute`) | 35 |
| Primary-cluster match (in `clusterBias`) | 20 |
| Secondary-cluster match (only if no primary; mutually exclusive) | 10 |
| Favorite-subject overlap | 5 per hit, capped at 10 |
| Current-goal overlap | 5 per hit, capped at 10 |
| Market relevance | `round(marketRelevance/100 × 10)` |
| Grade feasibility (grade 8–11 present) | flat 5 |

`skillGaps` = the career's first two `skillTags` — this drives
`possible_skill_gap` / "what to learn next" in the UI.

**Confidence level** from the score (`RECOMMENDATION_CONFIDENCE`):
`high ≥ 65`, `medium ≥ 45`, else `low`.

**Deterministic ordering:** by score desc, then `marketRelevance` desc, then
slug alphabetically — so identical profiles always produce identical lists.

## Buckets (`recommendCareers`)

The flat output (~7 items) is tagged into three buckets, taking from
non-overlapping pools (a career appears in at most one bucket):

| Bucket | Selection | Count |
|---|---|---|
| `recommended` | on the student's primary route | top 3 |
| `exploratory` | off-route but matches a cluster (adjacent) | top 3 |
| `stretch` | off-route but high interest (subject/goal match) — i.e. a skill-gap stretch | top 1 |

`groupRecommendations()` splits a stored flat list back into these buckets for
the UI.

## Majors (`majors-data.ts`)

A `Major` is `{ slug, route, subjectTags, name }`. Majors are linked to a career
by **rule, not a hand-curated per-career list** (`relatedMajorsFor`):

1. Majors on the **same route** first, then
2. Majors on other routes that **share a subject tag** with the career,

deduped, capped (default 4), always returning at least one. This is transparent
and maintainable. TODO in code: replace with real KZ university programs + ENT
subject requirements.

## Subjects and skills

- **Subjects** surface two ways: as the student's matched `favoriteSubjects`
  (explainability) and as the union of `subjectTags` across recommended careers
  (e.g. assembled in `/api/chat`'s `buildFactors`). Localized via
  `SUBJECT_LABELS` (`tag-labels.ts`).
- **Skills** come from each career's `skillTags`; the top two become `skillGaps`
  ("what to learn next"). Localized via `SKILL_LABELS`.

## "Why this fits" explainability

The recommendation result is **self-explaining** — the match factors are carried
on each `CareerRecommendation` (`matchedRoute`, `matchedClusters`,
`matchedSubjects`, `matchedGoals`, `skillGaps`, `score`, `bucket`,
`confidenceLevel`). No separate explanation model is needed; the explanation is a
deterministic readout of *why the score was what it was*.

The results UI (`components/results/results-view.tsx`) turns this into human
reasons (`reasonsFor`), capped at 3 chips per career, in priority order:

1. **Route** — `matchedRoute` → "Fits your {route} direction"
2. **Cluster** — first `matchedClusters` → "Matches your {cluster} profile"
3. **Subjects** — first two `matchedSubjects` → "Builds on {subject}"

Each card also shows the **match %** (the score, capped at 100), a **confidence
badge**, and a "why recommended" disclosure listing **skill gaps / what to learn
next** (`skillGaps` via `SKILL_LABELS`). The same factors feed the AI counselor
context (`referenced_profile_factors` in `/api/chat`), so the chat explanation
and the on-screen explanation reference the same deterministic signals — the AI
never invents a different rationale.
