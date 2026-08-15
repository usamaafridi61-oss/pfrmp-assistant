"use client";

import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import {
  formatDate,
  formatPKRCompact,
  statusColor,
  statusLabel,
} from "@/lib/ntfp/metrics";

function LifecycleStrip({ chain }) {
  const isMedicinal = Boolean(chain.isEditablePlaceholder || chain.medicinalIdentificationStatus);

  const stages = [
    isMedicinal
      ? {
          key: "id",
          label: "Identification",
          done: ["confirmed", "shortlisted"].includes(chain.medicinalIdentificationStatus),
          current:
            !chain.medicinalIdentificationStatus ||
            ["pending", "assessment_underway"].includes(chain.medicinalIdentificationStatus),
        }
      : null,
    {
      key: "report",
      label: "Report",
      done: ["completed", "approved"].includes(chain.valueChainReportStatus),
      current: chain.valueChainReportStatus === "under_preparation",
    },
    {
      key: "plan",
      label: "Action Plan",
      done: chain.actionPlanStatus === "available" || chain.status === "action_plan_available",
      current: chain.actionPlanStatus === "under_preparation",
    },
    {
      key: "impl",
      label: "Implementation",
      done: chain.implementationStatus === "completed",
      current: ["in_progress", "delayed"].includes(chain.implementationStatus),
    },
  ].filter(Boolean);

  return (
    <div className="vc-lifecycle" aria-label="Value chain lifecycle">
      {stages.map((stage, index) => (
        <div key={stage.key} className="vc-lifecycle-item">
          {index > 0 && <span className="vc-lifecycle-connector" />}
          <span
            className={`vc-lifecycle-dot ${
              stage.done ? "done" : stage.current ? "current" : "muted"
            }`}
          >
            {stage.done ? "✓" : index + 1}
          </span>
          <span className={`vc-lifecycle-label ${stage.done || stage.current ? "active" : ""}`}>
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusRow({ label, value }) {
  if (!value) return null;
  const color = statusColor(value);
  return (
    <div className="vc-status-row">
      <span className="vc-status-label">{label}</span>
      <span className={`status-pill pill-${color} pill-sm`}>{statusLabel(value)}</span>
    </div>
  );
}

export default function ValueChainCard({ summary }) {
  if (!summary?.chain) return null;
  const { chain } = summary;
  const color = statusColor(
    chain.actionPlanStatus === "available" ? "action_plan_available" : chain.status
  );
  const hasPlan = summary.totalActivities > 0;

  return (
    <article className={`card value-chain-card status-border-${color}`}>
      <div className="vc-card-top">
        <h3 className="vc-card-title">{chain.name}</h3>
        {chain.objective && <p className="vc-objective">{chain.objective}</p>}
        <p className="vc-card-meta muted small">
          {chain.commonName && <span>{chain.commonName}</span>}
          {chain.commonName && chain.geographicArea && <span> · </span>}
          {chain.geographicArea || "Target Forest Regions"}
        </p>
      </div>

      <LifecycleStrip chain={chain} />

      <div className="vc-status-stack">
        {(chain.isEditablePlaceholder || chain.medicinalIdentificationStatus) && (
          <StatusRow
            label="Species / Value Chain"
            value={chain.medicinalIdentificationStatus || "pending"}
          />
        )}
        <StatusRow label="Value Chain Report" value={chain.valueChainReportStatus} />
        <StatusRow
          label="Action Plan"
          value={
            chain.actionPlanStatus ||
            (chain.status === "action_plan_available" ? "available" : "not_started")
          }
        />
        <StatusRow label="Implementation" value={chain.implementationStatus || "not_started"} />
      </div>

      {hasPlan ? (
        <div className="vc-stats-body">
          <div className="vc-metrics-grid">
            <div className="vc-metric-cell">
              <span className="muted small">Planned Budget</span>
              <strong>{formatPKRCompact(summary.plannedBudget)}</strong>
            </div>
            <div className="vc-metric-cell">
              <span className="muted small">Activities</span>
              <strong>
                {summary.completedActivities} / {summary.totalActivities} completed
              </strong>
            </div>
          </div>

          <div className="vc-progress-item">
            <div className="vc-prog-label">
              <span>Physical Progress</span>
              <strong>{summary.physicalProgress.toFixed(0)}%</strong>
            </div>
            <ProgressBar percent={summary.physicalProgress} />
          </div>

          {summary.hasAnyExpenditure && (
            <div className="vc-progress-item">
              <div className="vc-prog-label">
                <span>Budget Utilization</span>
                <strong>{(summary.financialProgress || 0).toFixed(0)}%</strong>
              </div>
              <ProgressBar percent={summary.financialProgress || 0} />
            </div>
          )}

          <p className="small muted vc-last-update">Last update: {formatDate(summary.lastUpdate)}</p>
        </div>
      ) : (
        <div className="vc-empty-notice">
          <p className="small muted">
            {chain.actionPlanStatus === "available"
              ? "Action plan marked available — upload the Excel file to load activities."
              : "No approved Action Plan has been uploaded yet."}
          </p>
        </div>
      )}

      <div className="vc-card-footer">
        <Link href={`/ntfp/${chain.id}`} className="btn-open-vc">
          Open Value Chain
        </Link>
        {hasPlan && (
          <Link href={`/ntfp/${chain.id}`} className="btn-secondary btn-sm">
            Update Progress
          </Link>
        )}
      </div>
    </article>
  );
}
