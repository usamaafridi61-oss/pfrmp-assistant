export default function BarChart({ data }) {
  const { target = 0, achieved = 0, remaining = 0, progress = 0 } = data || {};
  const max = Math.max(target, achieved, remaining, 1);

  const bars = [
    { label: "Target", value: target, color: "var(--primary)" },
    { label: "Achieved", value: achieved, color: "var(--ok)" },
    { label: "Remaining", value: remaining, color: "#f59e0b" },
  ];

  return (
    <div className="bar-chart">
      <div className="bar-chart-bars">
        {bars.map((bar) => (
          <div key={bar.label} className="bar-chart-row">
            <span className="bar-chart-label">{bar.label}</span>
            <div className="bar-chart-track">
              <div
                className="bar-chart-fill"
                style={{
                  width: `${(bar.value / max) * 100}%`,
                  background: bar.color,
                }}
              />
            </div>
            <span className="bar-chart-value">{bar.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <p className="small">Overall progress: {Math.round(progress)}%</p>
    </div>
  );
}
