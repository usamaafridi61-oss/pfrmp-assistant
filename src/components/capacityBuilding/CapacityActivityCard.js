"use client";

import ProgressBar from "@/components/ProgressBar";
import { statusLabel } from "@/lib/capacityBuilding/metrics";

export default function CapacityActivityCard({ item, metrics, onRecord, onViewLog }) {
  const completed = metrics?.completedEvents || 0;
  const remaining = metrics?.remainingEvents ?? Math.max((item.plannedEvents || 0) - completed, 0);
  const progress = metrics?.progressPercent || 0;
  const status = metrics?.status || "not_started";
  const meta = [item.placeLevel, item.participantType, item.daysPerEvent ? `${item.daysPerEvent} days/event` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="card capacity-activity-card">
      <div className="vc-card-top">
        <div className="capacity-activity-head">
          <span className="activity-code-badge">{item.moduleCode}</span>
          <span className={`status-badge status-${status}`}>{statusLabel(status)}</span>
        </div>
        <h3 className="vc-card-title">{item.trainingSubject}</h3>
        {meta ? <p className="vc-card-meta muted small">{meta}</p> : null}
      </div>

      <div className="capacity-counters">
        <div className="capacity-counter">
          <span className="muted small">Planned</span>
          <strong>{item.plannedEvents || 0}</strong>
        </div>
        <div className="capacity-counter">
          <span className="muted small">Completed</span>
          <strong>{completed}</strong>
        </div>
        <div className="capacity-counter">
          <span className="muted small">Remaining</span>
          <strong>{remaining}</strong>
        </div>
      </div>

      <div className="vc-progress-item">
        <div className="vc-prog-label">
          <span>Event completion</span>
          <strong>{progress.toFixed(0)}%</strong>
        </div>
        <ProgressBar percent={progress} />
      </div>

      <div className="vc-card-footer">
        <button type="button" className="btn-open-vc" onClick={onRecord}>
          Record Event
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={onViewLog}>
          View Event Log
        </button>
      </div>
    </article>
  );
}
