# Assessment Algorithm

How Kim Bolam turns a student's questionnaire answers into a deterministic,
versioned result. The scoring engine lives in `lib/methodology/` and is **pure
and I/O-free** (`scoreAssessment()` in `scoring.ts`) — the AI counselor never
computes or overrides a score.

> **Status note.** Scoring is **deterministic and productized**, not externally
> psychometrically validated. Item wording, the item→cluster mapping, the
> awareness composition, and curated market signals are documented product
> assumptions (see `docs/METHODOLOGY_ASSUMPTIONS.md`). Treat results as a
> self-reflection and exploration aid, not a clinical instrument.

## 1. The instrument: 40 items, 4 blocks, 1–5 scale

Source: `lib/methodology/assessment-items.ts`.

- **40 Likert items**, codes `Q1…Q40`, in **4 blocks of 10**:
  | Block | Items | Measures |
  |---|---|---|
  | `interests` | Q1–Q10 | What the student is drawn to |
  | `competencies` | Q11–Q20 | Self-rated abilities |
  | `values` | Q21–Q30 | What matters in work |
  | `strengths` | Q31–Q40 | Personal qualities |
- Each item is a **1–5 Likert response** (`minValue: 1`, `maxValue: 5`;
  `LIKERT_MIN`/`LIKERT_MAX` in `scoring-config.ts`). Conceptually 1 = strongly
  disagree … 5 = strongly agree.
- `Q1…Q40` are the stable keys used by the DB seed and the cluster mapping.
  Prompt text is localized (en/ru/kk) in `ITEM_PROMPTS` and is a
  **student-friendly paraphrase** (illustrative, marked for review).

The answer payload passed into scoring is an `AnswerMap` — `Record<string,
number>` mapping each item code to its 1–5 value. Scoring tolerates missing
answers (`answeredCount` reports how many were present).

## 2. Block and cluster scores (0–100)

Both are computed as a **normalized percentage of the Likert range** (`scoring.ts`):

```
pct = round( (mean(answers) − 1) / (5 − 1) × 100 )
```

- **Block scores** — mean of the 10 items in each block → 0–100
  (`calculateBlockScores`).
- **Cluster scores** — mean of each cluster's mapped items → 0–100
  (`calculateClusterScores`).

### Clusters (`clusters.ts`)

Five professional clusters, with a **proposed** item→cluster mapping
(`PROPOSED_MAPPING_V1`):

`digital_innovator`, `researcher`, `social_leader`, `strategist`, `creator`.

Two intentional properties make normalization mandatory (never compare raw sums):
1. **Overlaps** — some items feed more than one cluster (e.g. `Q40`).
2. **Uneven counts** — clusters have 8–10 items each.

## 3. Routes and clusters (the student's direction)

Source: `routes.ts`, `recommendation-rules.ts`.

Five routes map 1:1 from the clusters (`CLUSTER_ROUTE`):

| Cluster | Route |
|---|---|
| `digital_innovator` | `technological` |
| `researcher` | `research` |
| `strategist` | `managerial` |
| `social_leader` | `social_humanitarian` |
| `creator` | `creative` |

- **Primary / secondary cluster** = top-2 clusters by score
  (`resolvePrimaryAndSecondaryCluster`). Ties break deterministically by the
  fixed `CLUSTERS` order, so results are reproducible.
- **Primary route** = route of the primary cluster, with **close-call
  tie-breaks** when the top-2 clusters are within `ROUTE_TIE_THRESHOLD` (10 pts)
  of each other (`resolveRoute`):
  - `social_leader` + `strategist` → `managerial`
  - `digital_innovator` + `researcher` → `technological`
  - `creator` + `social_leader` → `creative` with `routeModifier =
    creative_social_hybrid`
- **Strengths** = top-2 blocks; **growth areas** = bottom-2 blocks (lowest
  first), framed as areas to grow, never deficits (`buildStrengths` /
  `buildGrowthAreas`).

## 4. The internal 0–60 methodology score and the student-facing 0–100 score

The "Professional / Career Readiness Index" (IPO) is the headline awareness
number. It has **two representations** carried side-by-side in `ScoredResult`:

- **`ipoRaw60`** — the canonical internal **0–60** methodology score (the thesis
  scale). This is the source-of-truth value and is what awareness *levels* are
  classified from.
- **`ipoPct100`** — the **student-facing 0–100** percentage, simply
  `round(raw60 / 60 × 100)` (`rawToPct` in `awareness-index.ts`). This is what
  the UI and report display (e.g. "72/100").

### How the 0–60 is built — IPO v1 (active method)

`AWARENESS_METHOD = 'ipo_v1'` (`scoring-config.ts`). IPO v1 composes **6
criteria, each 0–10**, summed to the 0–60 raw score
(`calculateAwarenessIndex` in `awareness-index.ts`). Each criterion is clamped
to 0–10:

| Criterion | Derived from |
|---|---|
| `self_understanding` | distinctiveness of the top cluster vs. 2nd (gap / 30) + interests-block completeness |
| `skills_awareness` | `competencies` block average |
| `career_information` | onboarding career confidence (1–5; default 3 when unknown) |
| `independence` | onboarding support preference (`simple`/`detailed`/`ai`) → 0.8 / 0.6 / 0.5; default 0.6 |
| `confidence` | onboarding career confidence |
| `planning` | 4 before a plan exists, 8 once a plan is generated |

So the index folds in **onboarding context** (`OnboardingContext`:
careerConfidence, supportPreference, favoriteSubjects, currentGoals) and a
`planGenerated` flag — making it a productization composite, not a raw test
total.

### Fallback method — `rescale_all`

When there is no onboarding context, the legacy Day-1 method linearly rescales
the full 40-item total (range 40–200) onto 0–60 (`rescaleToRaw`). It is wired as
the `else` branch in `scoreAssessment` and configurable via
`AWARENESS_CONFIG.method` (`rescale_all` | `item_subset`). The `item_subset`
option is a documented extension point: set `subsetItemCodes` to score a
specific awareness sub-scale without other code changes.

## 5. Awareness levels

`classifyAwareness(raw60)` on the canonical 0–60 scale (`awareness-index.ts`,
thresholds in `scoring-config.ts`):

| Level | Raw 0–60 |
|---|---|
| `low` | raw < 30 |
| `medium` | 30 – 47 |
| `high` | 48 – 60 |

## 6. Versioning and the stored snapshot

Every result is stamped so stored results stay reproducible
(`scoring-config.ts`): `METHODOLOGY_VERSION = navigator_methodology_v1`,
`SCORING_VERSION = scoring_v2`, `TEMPLATE_VERSION = v1`. Bump `SCORING_VERSION`
whenever a scoring rule changes.

`buildStudentResultSnapshot()` serializes a `ScoredResult` into a stable,
versioned `StudentResultSnapshot` (`career_readiness` raw/pct/level/criteria,
route + modifier, clusters + scores, blocks, strengths, growth areas,
answered_count) for persistence in `result_json`.

## 7. Retake, adaptive branching, alternative wording

- **Retake** is supported today: `retakeAssessment()` (`lib/data/assessment.ts`,
  surfaced by `components/results/results-view.tsx`) lets a student take the
  assessment again, and `lib/methodology/comparison.ts` (`compareResults`)
  diffs two attempts — route change, score delta, cluster change, consistent
  strengths, new growth areas — framed as learning, not judgment.
- **Recommended retake interval: ~2 months.** This is a methodology
  *recommendation* (gives time for a student to act on a plan before
  re-measuring) — it is **not enforced in code**; nothing blocks an earlier
  retake.
- **Adaptive branching / retake-with-alternative-wording are documented
  extension points, not implemented today.** The assessment is currently a fixed
  40-item form delivered in a fixed order. The seams where they would plug in:
  - The item set is data (`ASSESSMENT_ITEMS` + `ITEM_PROMPTS`), and the rules
    reference an `assessmentItemBank` / `assessmentTemplates` Firestore catalog
    (`firestore.rules`). Alternative phrasings would live there as additional
    prompt variants keyed by the same `Q*` codes, so scoring is unchanged.
    A retake could select a different wording variant per item code.
  - Adaptive branching would sit between answer collection and `scoreAssessment`
    (e.g. choosing the next item from `assessmentItemBank`), and the result
    snapshot already records `answered_count`, so partial/branched forms are
    representable. The scoring engine itself does not yet implement item
    selection logic.

## What exists today vs. extension points

| Today | Extension point (documented, not built) |
|---|---|
| Fixed 40-item, 4-block, 1–5 form | Adaptive item selection / branching |
| Single prompt wording per item (paraphrased) | Alternative-wording variants for retakes |
| IPO v1 composite for the 0–60 / 0–100 score | `item_subset` awareness sub-scale via config |
| Deterministic retake + 2-attempt comparison | Enforced ~2-month retake interval |
| Productized, deterministic scoring | External psychometric validation |
