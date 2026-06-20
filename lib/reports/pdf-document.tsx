/**
 * Server-side PDF report for Kim Bolam (@react-pdf/renderer).
 *
 * Renders a clean, professional student report from a DERIVED snapshot only —
 * scores, route, clusters, qualities, strengths/growth, recommendations and the
 * plan summary. It MUST NOT include chat history or raw 1–5 answers (privacy
 * invariant; see docs/PDF_REPORTS.md). The component is pure: all content comes
 * from the typed `ReportData` payload, so the same data can be validated on the
 * server before rendering.
 */
import * as React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from '@react-pdf/renderer'

/**
 * The full, self-contained report payload. The client assembles this from the
 * student's local result + profile + the methodology catalog; the server trusts
 * the identity from the bearer token (never a uid in this body) and renders it.
 */
export interface ReportData {
  /** Product name shown on the report — always "Kim Bolam". */
  appName: string
  /** Student's display name or nickname. */
  studentName: string
  /** Optional grade label (e.g. "Grade 10"). */
  gradeLabel?: string
  /** Human date the report was generated, already localized by the caller. */
  date: string

  /** Primary professional route (localized title). */
  route: string
  /** Short description of the route. */
  routeDescription?: string
  /** Professional clusters the student leans toward (localized titles). */
  clusters: string[]
  /** Standout qualities (localized). */
  qualities: string[]
  /** A short motivation / work-style sentence. */
  motivationProfile: string

  /** Career readiness score, 0–100 (the headline number). */
  score0to100: number
  /** Internal IPO raw score, 0–60 (shown in a detail line). */
  score0to60: number
  /** Localized awareness level label (e.g. "Finding your footing"). */
  awarenessLabel?: string

  /** Top strengths (localized labels). */
  strengths: string[]
  /** Areas to grow (localized labels). */
  growthAreas: string[]

  /** Recommended careers (localized names). */
  careers: string[]
  /** Recommended majors (localized names). */
  majors: string[]
  /** School subjects to focus on (localized). */
  subjects: string[]
  /** Suggested projects / practical next steps (localized). */
  projects: string[]
  /** Universities to look into (localized "Name — City"). */
  universities: string[]

  /** One-paragraph plan summary. */
  planSummary: string

  /** Methodology / scoring version stamp (e.g. "ipo_v1 · scoring v1.2"). */
  methodologyVersion: string
  /** Where the catalog figures come from (provenance note). */
  dataSourceNote: string
  /** Closing disclaimer (readiness ≠ ability; curated demo data; etc). */
  disclaimer: string

  /** Section/field labels, supplied localized by the caller. */
  labels: ReportLabels
}

export interface ReportLabels {
  reportTitle: string
  preparedFor: string
  generatedOn: string
  readinessScore: string
  internalScoreDetail: string // template with {raw}
  yourDirection: string
  yourClusters: string
  yourQualities: string
  motivationWorkStyle: string
  yourStrengths: string
  areasToGrow: string
  recommendedCareers: string
  recommendedMajors: string
  subjectsToFocus: string
  projectIdeas: string
  universitiesToExplore: string
  yourPlan: string
  methodology: string
  dataSources: string
  disclaimerHeading: string
  none: string // shown when a list is empty
}

// Red / blue / white accent palette — readable, professional, no emojis.
const RED = '#d23b3b'
const BLUE = '#1f4e96'
const INK = '#1a1a1a'
const MUTED = '#5b6470'
const HAIRLINE = '#e3e7ee'
const SOFT_BLUE = '#eef3fb'

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10.5,
    lineHeight: 1.5,
    color: INK,
    fontFamily: 'Helvetica',
  },
  // Header band
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
    paddingBottom: 10,
    marginBottom: 18,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 14,
    height: 14,
    backgroundColor: RED,
    borderRadius: 3,
    marginRight: 7,
  },
  brandName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: BLUE },
  reportTitle: { fontSize: 9, color: MUTED, marginTop: 3 },
  headerRight: { textAlign: 'right' },
  metaLabel: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INK },
  metaSub: { fontSize: 8.5, color: MUTED, marginTop: 1 },

  // Score hero
  hero: {
    flexDirection: 'row',
    backgroundColor: SOFT_BLUE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
  },
  scoreBlock: {
    width: 92,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: HAIRLINE,
    paddingRight: 14,
    marginRight: 14,
  },
  scoreNumber: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: BLUE },
  scoreOutOf: { fontSize: 9, color: MUTED },
  scoreCaption: { fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 4 },
  heroBody: { flex: 1 },
  heroRoute: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: INK },
  heroRouteDesc: { fontSize: 9.5, color: MUTED, marginTop: 2 },
  detailLine: { fontSize: 8.5, color: MUTED, marginTop: 6 },

  // Sections
  section: { marginBottom: 13 },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  accentRule: { height: 2, width: 26, backgroundColor: RED, marginBottom: 6 },
  paragraph: { fontSize: 10, color: INK },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },

  // Chip list (wraps)
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: SOFT_BLUE,
    color: BLUE,
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 9,
    marginRight: 5,
    marginBottom: 5,
  },
  // Bullet list
  bulletItem: { flexDirection: 'row', marginBottom: 2.5 },
  bulletDot: { color: RED, marginRight: 5, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 10, color: INK, flex: 1 },

  // Footer / disclaimer
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    paddingTop: 8,
  },
  footnoteLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: MUTED, marginTop: 5 },
  footnote: { fontSize: 8, color: MUTED },
  pageNumber: {
    position: 'absolute',
    bottom: 26,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: MUTED,
    textAlign: 'center',
  },
})

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  )
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <Text style={styles.paragraph}>{empty}</Text>
  return (
    <View style={styles.chipRow}>
      {items.map((item, i) => (
        <Text key={`${item}-${i}`} style={styles.chip}>
          {item}
        </Text>
      ))}
    </View>
  )
}

function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <Text style={styles.paragraph}>{empty}</Text>
  return (
    <View>
      {items.map((item, i) => (
        <View key={`${item}-${i}`} style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.accentRule} />
      {children}
    </View>
  )
}

/**
 * The report Document element, typed for `renderToBuffer`. Use this from the
 * server route: `renderToBuffer(reportDocument(data))`.
 */
export function reportDocument(data: ReportData): React.ReactElement<DocumentProps> {
  return ReportPdf({ data })
}

/** The report Document. Render with `renderToBuffer(<ReportPdf data={...} />)`. */
export function ReportPdf({ data }: { data: ReportData }): React.ReactElement<DocumentProps> {
  const l = data.labels
  return (
    <Document
      title={`${data.appName} — ${l.reportTitle}`}
      author={data.appName}
      subject={l.reportTitle}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandMark} />
              <Text style={styles.brandName}>{data.appName}</Text>
            </View>
            <Text style={styles.reportTitle}>{l.reportTitle}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.metaLabel}>{l.preparedFor}</Text>
            <Text style={styles.metaValue}>{data.studentName}</Text>
            {data.gradeLabel ? <Text style={styles.metaSub}>{data.gradeLabel}</Text> : null}
            <Text style={styles.metaSub}>
              {l.generatedOn}: {data.date}
            </Text>
          </View>
        </View>

        {/* Score hero */}
        <View style={styles.hero}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreNumber}>{Math.round(data.score0to100)}</Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
            <Text style={styles.scoreCaption}>{l.readinessScore}</Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroRoute}>{data.route}</Text>
            {data.routeDescription ? (
              <Text style={styles.heroRouteDesc}>{data.routeDescription}</Text>
            ) : null}
            <Text style={styles.detailLine}>
              {fillTemplate(l.internalScoreDetail, { raw: Math.round(data.score0to60) })}
              {data.awarenessLabel ? ` · ${data.awarenessLabel}` : ''}
            </Text>
          </View>
        </View>

        {/* Direction + clusters */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Section title={l.yourDirection}>
              <Text style={styles.paragraph}>{data.route}</Text>
              {data.routeDescription ? (
                <Text style={[styles.paragraph, { color: MUTED, marginTop: 2 }]}>
                  {data.routeDescription}
                </Text>
              ) : null}
            </Section>
          </View>
          <View style={styles.col}>
            <Section title={l.yourClusters}>
              <Chips items={data.clusters} empty={l.none} />
            </Section>
          </View>
        </View>

        {/* Qualities + motivation */}
        <Section title={l.yourQualities}>
          <Chips items={data.qualities} empty={l.none} />
        </Section>

        <Section title={l.motivationWorkStyle}>
          <Text style={styles.paragraph}>{data.motivationProfile}</Text>
        </Section>

        {/* Strengths + growth */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Section title={l.yourStrengths}>
              <Bullets items={data.strengths} empty={l.none} />
            </Section>
          </View>
          <View style={styles.col}>
            <Section title={l.areasToGrow}>
              <Bullets items={data.growthAreas} empty={l.none} />
            </Section>
          </View>
        </View>

        {/* Careers + majors */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Section title={l.recommendedCareers}>
              <Bullets items={data.careers} empty={l.none} />
            </Section>
          </View>
          <View style={styles.col}>
            <Section title={l.recommendedMajors}>
              <Bullets items={data.majors} empty={l.none} />
            </Section>
          </View>
        </View>

        {/* Subjects + projects */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Section title={l.subjectsToFocus}>
              <Chips items={data.subjects} empty={l.none} />
            </Section>
          </View>
          <View style={styles.col}>
            <Section title={l.projectIdeas}>
              <Bullets items={data.projects} empty={l.none} />
            </Section>
          </View>
        </View>

        {/* Universities */}
        <Section title={l.universitiesToExplore}>
          <Bullets items={data.universities} empty={l.none} />
        </Section>

        {/* Plan summary */}
        <Section title={l.yourPlan}>
          <Text style={styles.paragraph}>{data.planSummary}</Text>
        </Section>

        {/* Footer: methodology, data sources, disclaimer */}
        <View style={styles.footer} wrap={false}>
          <Text style={styles.footnoteLabel}>{l.methodology}</Text>
          <Text style={styles.footnote}>{data.methodologyVersion}</Text>
          <Text style={styles.footnoteLabel}>{l.dataSources}</Text>
          <Text style={styles.footnote}>{data.dataSourceNote}</Text>
          <Text style={styles.footnoteLabel}>{l.disclaimerHeading}</Text>
          <Text style={styles.footnote}>{data.disclaimer}</Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${data.appName} · ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}

export default ReportPdf
