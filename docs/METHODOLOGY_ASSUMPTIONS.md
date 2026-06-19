# Methodology Assumptions

Navigator productizes the master's-thesis methodology **"Navigator of Self-Determination."**
The exact thesis instrument (item wording, the awareness sub-scale formula, the
validated cluster key) was **not available at build time**. Where a decision was
required, we implemented a **safe, configurable default**, marked it `TODO`, and
documented it here. Nothing below is a hidden assumption.

## 1. Cluster mapping is PROPOSED, not a validated key
- `lib/methodology/clusters.ts` → `CLUSTER_ITEMS` is `PROPOSED_MAPPING_V1`.
- It is a **productization** mapping, **not** a validated clinical scoring key.
- Intentional properties: clusters **overlap** (e.g. `Q40` feeds three clusters) and
  have **uneven counts** (8–10 items each).
- Items `Q21, Q27, Q28, Q38` are **not** mapped to any cluster. They still contribute
  to block scores and the awareness index. (Correct and intended.)
- Because counts are uneven, cluster scores are **normalized to 0–100** (mean of a
  cluster's item answers), never compared as raw sums. See `lib/methodology/scoring.ts`.
- **TODO:** replace with the validated key once the thesis scoring table is available.

## 2. Professional Awareness Index (IPO): 0–60 raw + 0–100 percent
- Canonical scale is **raw 0–60**; we also store a normalized **0–100 percentage**.
  Both are persisted (`assessment_results.ipo_raw_60`, `ipo_pct_100`).
- 40 Likert items naturally sum to **40–200**, so a transform to 0–60 is **required**.
- **Default method (`rescale_all`)**: linearly map the full-instrument total onto 0–60
  (all-1s → 0, all-5s → 60). Transparent and reproducible.
- Levels: **low `< 30`**, **medium `30–47`**, **high `48–60`** (on the raw 0–60 scale).
- Configurable in `lib/methodology/scoring-config.ts` → `AWARENESS_CONFIG`. To use a
  specific awareness sub-scale instead, set `method: 'item_subset'` and fill
  `subsetItemCodes` — no other code changes.
- **TODO_METHODOLOGY:** confirm whether the thesis awareness index is the whole
  instrument or a named subset, and update `AWARENESS_CONFIG`.

## 3. Cluster → route mapping (proposed)
- 1:1 mapping in `recommendation-rules.ts` → `CLUSTER_ROUTE`:
  digital_innovator→technological, researcher→research, strategist→managerial,
  social_leader→social_humanitarian, creator→creative.
- Proposed; revisit alongside the validated cluster key.

## 4. Assessment item wording is paraphrased
- The 40 prompts in `assessment-items.ts` (`ITEM_PROMPTS`) are **student-friendly
  paraphrases**, illustrative pending the exact thesis text.
- Russian/Kazakh strings are a first pass — see `TODO_TRANSLATION_REVIEW` markers
  (item prompts, `lib/i18n/messages/kk.ts`). Kazakh needs a native review.

## 5. Career & major catalog is curated demo data
- 25 careers + 15 majors in `supabase/seed.sql` are **curated demo data**
  (`is_demo_data = true`), **not** live Kazakhstan labor-market data.
- `market_relevance_score` values are illustrative.
- **TODO:** source real market data before any official/government deployment.

## 6. Block scores
- Each of the 4 blocks (interests, competencies, values, strengths) is scored as a
  **normalized 0–100** value (mean of its 10 items mapped onto the Likert range).

## 7. Product / safety scope (MVP)
- **No parental-consent workflow** in the MVP. Required before minors use it in a
  school/government setting (KZ data-protection review pending).
- **AI counselor comes later.** It offers guidance and **does not replace
  professional or clinical care** (disclaimer shown in the chat UI).
- **Default locale is `ru`** (configurable via `DEFAULT_LOCALE`); KK and EN are first-class.

## 8. Row Level Security (Day 1)
- Owner-only policies on all student data; reference data is world-readable.
- **TODO (Day 2+):** admin/teacher cross-student reads scoped to a shared
  organization, via a `SECURITY DEFINER` helper to avoid recursive RLS. Deliberately
  omitted on Day 1 so no policy over-exposes student data. See `0001_init.sql`.

---

## Day 2 additions

### IPO v1 — Professional Awareness Index (productization)
`lib/methodology/awareness-index.ts → computeIpoV1`. The canonical raw 0–60 score is the sum of
**6 criteria (each 0–10)**, deterministic given block/cluster scores, onboarding inputs, and
whether a plan exists:
1. **interest_clarity** = 10 · (0.6 · distinctiveness + 0.4 · interests/100), where
   distinctiveness = clamp((top1 − top2) / 30, 0, 1) over cluster scores.
2. **competency_awareness** = 10 · competencies/100.
3. **profession_information** = 10 · careerConfidence/5 (default confidence 3 if unknown).
4. **independence** = 10 · base, base = { simple_guidance 0.8, detailed_guidance 0.6, ai_counselor 0.5, default 0.6 }.
5. **decision_confidence** = 10 · careerConfidence/5.
6. **professional_plan** = 4 before a plan exists, 8 after.

Levels unchanged: low < 30, medium 30–47, high 48–60. Shown to students as the
**"Career Readiness Score"** (normalized 0–100). This is a PRODUCTIZATION formula, not a validated
thesis instrument; fully configurable in `scoring-config.ts (IPO_V1, AWARENESS_METHOD)`.
`scoring_version` was bumped to `scoring_v2`.

### Route resolution v1
`recommendation-rules.ts → resolveRoute`. Base: top cluster → its route. Tie-breaks when the top-2
clusters are within 10 points: social_leader + strategist → managerial; digital_innovator +
researcher → technological; creator + social_leader → creative with a `creative_social_hybrid`
modifier stored in `result_json`.

### Career recommendations v1
`recommendations.ts`. Score = route match 45 + cluster bias (primary 20 / secondary 10) + subject
overlap (5 each, max 10) + goal overlap (5 each, max 10) + market (×10) + skill-gap feasibility 5
(flat in v1). Deterministic sort: score, then market relevance, then slug. Top 5 shown. NOTE:
career `goal_tags` are outcome tags (e.g. high_income) while student `current_goals` are process
goals — overlap is a weak signal in v1; route + cluster + subjects dominate (intended). Market
relevance is labeled **"curated demo relevance"**, NOT live labor-market data.

### Demo mode (DEV-only auth + local persistence)
When Supabase env is absent the app runs in **demo mode**: a local DEV-only account, client-side
localStorage persistence, and client-side deterministic scoring. No secrets (no service-role key,
no tokens) ever reach the browser. To disable: configure Supabase env (auto-disables demo) or set
`NEXT_PUBLIC_DEMO_MODE=off`. A real deployment MUST configure Supabase; the server APIs implement
that path.

---

## Day 3 additions

### IPO criteria renamed (student-facing concepts)
The 6 Career Readiness criteria were renamed (same formulas):
`interest_clarity → self_understanding`, `competency_awareness → skills_awareness`,
`profession_information → career_information`, `decision_confidence → confidence`,
`professional_plan → planning`, `independence` (unchanged). `calculateAwarenessIndex` is the
public entry point. A `METHODOLOGY_VERSION` (`navigator_methodology_v1`) now stamps results.

### Recommendation engine v2
Weights: route 35, primary cluster 20, secondary cluster 10, subject overlap 10 (5/hit),
goal overlap 10 (5/hit), market 10, grade feasibility 5. Max achievable ~90 (primary/secondary
cluster are mutually exclusive). **Grade feasibility is a flat presence bonus** in v2 — all
seeded careers are exploration-appropriate for grades 8–11; per-career grade gating is a TODO.
Confidence: high ≥ 65, medium ≥ 45, else low. Careers are bucketed: `recommended` (route match),
`exploratory` (off-route but cluster match), `stretch` (off-route, subject/goal interest only).
Market relevance remains **"curated demo relevance"**, not live KZ labor-market data (TODO: integrate).
