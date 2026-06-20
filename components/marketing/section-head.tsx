/** Centered section header (mockup `.sec-head`): uppercase red tag + H2 + subtitle. */
export function SectionHead({
  tag,
  title,
  subtitle,
}: {
  tag: string
  title: string
  subtitle: string
}) {
  return (
    <div className="sec-head">
      <div className="sec-tag">{tag}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  )
}
