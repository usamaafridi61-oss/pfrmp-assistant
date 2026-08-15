export default function DonutChart({ segments = [], size = 180, strokeWidth = 24 }) {
  const total = segments.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="clean-donut-container">
      <div className="donut-visual-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="clean-donut-svg">
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="#e5ece7"
            fill="transparent"
          />

          {/* Slices */}
          {segments.map((seg, idx) => {
            const segVal = Number(seg.value) || 0;
            const pct = segVal / total;
            const strokeLength = pct * circumference;
            const strokeOffset = -(accumulatedPercent * circumference);
            accumulatedPercent += pct;

            if (segVal <= 0) return null;

            return (
              <circle
                key={seg.label || idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                stroke={seg.color || "#15803d"}
                fill="transparent"
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="donut-slice"
              />
            );
          })}
        </svg>

        {/* Center Hole Text */}
        <div className="donut-center-badge">
          <span className="donut-center-val">{Math.round(total).toLocaleString()}</span>
          <span className="donut-center-unit">Total Ha</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="clean-donut-legend">
        {segments.map((s) => {
          const val = Number(s.value) || 0;
          const pct = Math.round((val / total) * 100);
          return (
            <div key={s.label} className="donut-legend-row">
              <div className="legend-label-left">
                <span className="donut-legend-dot" style={{ background: s.color }} />
                <span className="legend-category-name">{s.label}</span>
              </div>
              <div className="legend-values-right">
                <strong>{val.toLocaleString()} Ha</strong>
                <span className="legend-pct-chip">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
