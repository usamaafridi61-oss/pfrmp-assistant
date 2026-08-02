const LABELS = { workbook: "Workbook", manual: "Manual", correction: "Correction" };

export default function SourceBadge({ source }) {
  if (!source) return null;
  return <span className={`badge badge-${source}`}>{LABELS[source] || source}</span>;
}
