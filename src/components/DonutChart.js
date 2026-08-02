export default function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let cumulative = 0;
  const stops = segments.map((s) => {
    const start = cumulative;
    cumulative += (s.value / total) * 360;
    return `${s.color} ${start}deg ${cumulative}deg`;
  });

  return (
    <div className="donut-wrap">
      <div
        className="donut"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${stops.join(", ")})`,
        }}
      >
        <div className="donut-hole">{Math.round(total)} Ha</div>
      </div>
      <div className="donut-legend">
        {segments.map((s) => (
          <div key={s.label} className="donut-legend-item">
            <span className="donut-swatch" style={{ background: s.color }} />
            {s.label}: {s.value.toLocaleString()} ({Math.round((s.value / total) * 100)}%)
          </div>
        ))}
      </div>
    </div>
  );
}
