"use client";

import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import { statusLabel } from "@/lib/capacityBuilding/metrics";

function shortGroupName(name = "") {
  return name.replace(/^BTASP\s*\d+\s*-\s*/i, "").replace(/\s+/g, " ").trim();
}

export default function CapacityModuleCard({ group }) {
  const href = `/capacity-building/${encodeURIComponent(group.moduleGroupCode || group.moduleGroupName)}`;

  return (
    <article className="card value-chain-card">
      <div className="vc-card-top">
        <p className="vc-kicker">{group.moduleGroupCode}</p>
        <h3 className="vc-card-title">{shortGroupName(group.moduleGroupName) || group.moduleGroupCode}</h3>
        <p className="vc-card-meta muted small">
          {group.activityCount || 0} activities · {group.plannedParticipants?.toLocaleString() || 0} participant places
        </p>
      </div>

      <div className="capacity-counters">
        <div className="capacity-counter">
          <span className="muted small">Planned</span>
          <strong>{group.plannedEvents}</strong>
        </div>
        <div className="capacity-counter">
          <span className="muted small">Completed</span>
          <strong>{group.completedEvents}</strong>
        </div>
        <div className="capacity-counter">
          <span className="muted small">Remaining</span>
          <strong>{group.remainingEvents}</strong>
        </div>
      </div>

      <div className="vc-progress-item">
        <div className="vc-prog-label">
          <span>Progress</span>
          <strong>{group.progressPercent.toFixed(1)}%</strong>
        </div>
        <ProgressBar percent={group.progressPercent} />
      </div>

      <div className="vc-card-footer">
        <Link href={href} className="btn-open-vc">
          Open Group
        </Link>
        <span className={`status-badge status-${group.status || "not_started"}`}>
          {statusLabel(group.status || "not_started")}
        </span>
      </div>
    </article>
  );
}
