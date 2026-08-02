"use client";

import { useRouter } from "next/navigation";

function BarRow({ group, max }) {
  const router = useRouter();

  const content = (
    <>
      <span className="grouped-bar-label" title={group.label}>
        {group.label}
      </span>
      <div className="grouped-bar-tracks">
        <div className="grouped-bar-track">
          <div className="grouped-bar-fill target" style={{ width: `${(group.target / max) * 100}%` }} />
        </div>
        <div className="grouped-bar-track">
          <div className="grouped-bar-fill achieved" style={{ width: `${(group.achieved / max) * 100}%` }} />
        </div>
      </div>
      <span className="grouped-bar-values">
        {group.achieved}/{group.target}
      </span>
    </>
  );

  if (group.href) {
    return (
      <button
        type="button"
        className="grouped-bar-row grouped-bar-row-link"
        onClick={() => router.push(group.href)}
      >
        {content}
      </button>
    );
  }

  return <div className="grouped-bar-row">{content}</div>;
}

export default function GroupedBarChart({ groups, maxValue }) {
  const max = maxValue || Math.max(...groups.flatMap((g) => [g.target, g.achieved]), 1);

  return (
    <div className="grouped-bar-chart">
      {groups.map((g) => (
        <BarRow key={g.id || g.label} group={g} max={max} />
      ))}
      <div className="chart-legend">
        <span><i className="swatch target" /> Target</span>
        <span><i className="swatch achieved" /> Achieved</span>
      </div>
    </div>
  );
}
