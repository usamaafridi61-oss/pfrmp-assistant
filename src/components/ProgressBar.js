export default function ProgressBar({ percent = 0, label }) {
  const num = Number(percent);
  const safe = Number.isFinite(num) ? num : 0;
  const clamped = Math.max(0, Math.min(100, safe));
  return (
    <div className="progress-row">
      {label ? <span className="progress-label">{label}</span> : null}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="progress-pct">{Math.round(clamped)}%</span>
    </div>
  );
}
