# i18n QA

Navigator ships tri-lingual: **Kazakh (kk), Russian (ru), English (en)**.

## Parity guarantees (two layers)

1. **Compile-time:** `Messages = typeof en`; `ru`/`kk` are typed `: Messages`, so any missing or
   extra key fails `tsc`. This is the primary guard.
2. **Runtime test:** `tests/unit/i18n-parity.test.ts` deep-compares every leaf key path across
   locales and **reports the exact missing/extra paths** on failure. It also asserts no leaf is
   left as the `TODO_TRANSLATION_REVIEW` placeholder. (`tests/unit/i18n.test.ts` covers config +
   top-level parity.)

To intentionally defer a translation, set its value to the literal `TODO_TRANSLATION_REVIEW`;
the parity test will flag it so it isn't shipped silently.

## Tone (student-facing)

Simple, warm, teen-friendly — **not** academic, clinical, or deterministic. Frame results as a
starting point, never a verdict.

- Avoid: "Your professional self-determination is low."
  Use: "You are still exploring. That is normal — your next step is to learn more about your options."
- Avoid: "You are assigned to this profession."
  Use: "This direction may fit your current interests and strengths."

The deterministic readiness criteria are surfaced with shame-free copy
(`d3.explain.{low,medium,high}`), and the AI counselor is instructed to mirror this tone.

## Coverage

All user-facing strings route through the dictionary (`lib/i18n/messages/{en,ru,kk}.ts`).
Day-3/4/5 additions (`d3`, `d4`, `d4.admin`, `d4.compare`, `common.skipToContent`) are present in
all three locales. Career/major/route/cluster/subject/skill labels are localized via their data
modules and `tag-labels`.
