"use client";

import { useRouter } from "next/navigation";

function BarRow({ group, max }) {
  const router = useRouter();
  const targetPct = max > 0 ? Math.max(0, Math.min(100, (group.target / max) * 100)) : 0;
  const achievedPct = max > 0 ? Math.max(0, Math.min(100, (group.achieved / max) * 100)) : 0;
  const progressPercent = group.target > 0 ? Math.round((group.achieved / group.target) * 100) : 0;

  const content = (
    <div className="grouped-row-inner">
      <div className="grouped-label-col">
        <span className="grouped-bar-title" title={group.label}>
          {group.label}
        </span>
        <span className="grouped-pct-tag">
          {progressPercent}%
        </span>
      </div>

      <div className="grouped-bar-tracks-col">
        {/* Target Track */}
        <div className="grouped-track-container">
          <span className="track-indicator-label">Target</span>
          <div className="clean-bar-track">
            <div
              className="clean-bar-fill target-fill"
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <span className="track-val-num">{group.target.toLocaleString()}</span>
        </div>

        {/* Achieved Track */}
        <div className="grouped-track-container">
          <span className="track-indicator-label">Achieved</span>
          <div className="clean-bar-track">
            <div
              className="clean-bar-fill achieved-fill"
              style={{ width: `${achievedPct}%` }}
            />
          </div>
          <span className="track-val-num ok">{group.achieved.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  if (group.href) {
    return (
      <button
        type="button"
        className="grouped-bar-row-btn"
        onClick={() => router.push(group.href)}
      >
        {content}
      </button>
    );
  }

  return <div className="grouped-bar-row-static">{content}</div>;
}

export default function GroupedBarChart({ groups = [], maxValue }) {
  const max = maxValue || Math.max(...groups.flatMap((g) => [g.target || 0, g.achieved || 0]), 1);

  return (
    <div className="clean-grouped-chart">
      <div className="clean-chart-legend">
        <div className="legend-item">
          <span className="swatch target-swatch" />
          <span>Target Quantity</span>
        </div>
        <div className="legend-item">
          <span className="swatch achieved-swatch" />
          <span>Achieved Progress</span>
        </div>
      </div>

      <div className="grouped-chart-list">
        {groups.map((g) => (
          <BarRow key={g.id || g.label} group={g} max={max} />
        ))}
        {groups.length === 0 && (
          <p className="small muted">No division data available for current filter.</p>
        )}
      </div>
    </div>
  );
}
