export default function ProgressBar({ percent, label }) {
  const clamped = Math.max(0, Math.min(100, percent));
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
