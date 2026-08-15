export default function BarChart({ data }) {
  const { target = 0, achieved = 0, remaining = 0, progress = 0 } = data || {};
  const max = Math.max(target, achieved, remaining, 1);

  const bars = [
    { label: "Target", value: target, color: "#1e3a29", bg: "#e8efe9", pct: 100 },
    {
      label: "Achieved",
      value: achieved,
      color: "#16a34a",
      bg: "#dcfce7",
      pct: target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0,
    },
    {
      label: "Remaining",
      value: remaining,
      color: "#d97706",
      bg: "#fef3c7",
      pct: target > 0 ? Math.min(100, Math.round((remaining / target) * 100)) : 0,
    },
  ];

  return (
    <div className="clean-bar-chart">
      <div className="bar-chart-bars">
        {bars.map((bar) => {
          const widthPct = Math.max(0, Math.min(100, (bar.value / max) * 100));
          return (
            <div key={bar.label} className="clean-bar-row">
              <div className="clean-bar-header">
                <span className="clean-bar-label">{bar.label}</span>
                <div className="clean-bar-values">
                  <strong>{bar.value.toLocaleString()}</strong>
                  <span className="clean-bar-pct-badge" style={{ color: bar.color, background: bar.bg }}>
                    {bar.pct}%
                  </span>
                </div>
              </div>
              <div className="clean-bar-track">
                <div
                  className="clean-bar-fill"
                  style={{
                    width: `${widthPct}%`,
                    background: bar.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="clean-bar-footer">
        <span className="muted small">Overall Cumulative Progress:</span>
        <strong className="ok">{Math.round(progress)}% of Total Program Target</strong>
      </div>
    </div>
  );
}
