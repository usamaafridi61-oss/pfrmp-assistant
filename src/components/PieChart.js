export default function PieChart({ percent = 0, size = 80, strokeWidth = 8, label }) {
  const num = Number(percent);
  const safe = Number.isFinite(num) ? num : 0;
  const clamped = Math.max(0, Math.min(100, safe));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="clean-progress-ring-wrap" style={{ width: size, height: size }}>
      <svg className="clean-progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress stroke */}
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center-content">
        <strong className="ring-pct-text">{Math.round(clamped)}%</strong>
        {label && <span className="ring-label-text">{label}</span>}
      </div>
    </div>
  );
}
