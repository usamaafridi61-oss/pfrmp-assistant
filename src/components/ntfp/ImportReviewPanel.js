"use client";

import { formatPKR, formatPKRCompact } from "@/lib/ntfp/metrics";

export default function ImportReviewPanel({ parsed, fileName, showActionsPreview = true }) {
  if (!parsed) return null;

  const checks = parsed.featureChecks || [];
  const previewGroups = parsed.previewGroups || [];

  return (
    <div className="import-review-panel">
      <div className="import-review-header">
        <div>
          <h4>Action Plan Import Review</h4>
          <p className="small muted">{fileName || parsed.sourceFileName}</p>
        </div>
        <span
          className={`validation-chip validation-${parsed.validationStatus || "passed"}`}
        >
          {parsed.validationStatus === "failed"
            ? "Import Failed"
            : parsed.validationStatus === "warning"
              ? "Budget Warning"
              : "Ready to Import"}
        </span>
      </div>

      <div className="review-stat-grid review-stat-grid-4">
        <div className="review-stat">
          <span className="muted">Main Actions</span>
          <strong>{parsed.groupCount}</strong>
        </div>
        <div className="review-stat">
          <span className="muted">Implementation Activities</span>
          <strong>{parsed.activityCount}</strong>
        </div>
        <div className="review-stat">
          <span className="muted">Source Grand Total</span>
          <strong>
            {parsed.sourceGrandTotalPKR != null
              ? formatPKRCompact(parsed.sourceGrandTotalPKR)
              : "—"}
          </strong>
        </div>
        <div className="review-stat">
          <span className="muted">Calculated Grand Total</span>
          <strong className="ok">{formatPKRCompact(parsed.calculatedGrandTotalPKR)}</strong>
        </div>
      </div>

      {parsed.validationStatus === "failed" && (
        <div className="budget-warning-box">
          <strong>Action Plan Import Failed</strong>
          <p className="small" style={{ whiteSpace: "pre-wrap" }}>
            {parsed.mappingError || "The Action column could not be read correctly. No activities were saved."}
          </p>
        </div>
      )}

      {parsed.validationStatus === "warning" && parsed.sourceGrandTotalPKR != null && (
        <div className="budget-warning-box">
          <strong>Budget Validation Warning</strong>
          <p className="small">
            The calculated Action Plan budget does not match the total contained in the uploaded
            Excel file.
          </p>
          <div className="budget-warning-grid">
            <div>
              <span className="muted">Excel Total</span>
              <strong>{formatPKR(parsed.sourceGrandTotalPKR)}</strong>
            </div>
            <div>
              <span className="muted">Calculated Total</span>
              <strong>{formatPKR(parsed.calculatedGrandTotalPKR)}</strong>
            </div>
            <div>
              <span className="muted">Difference</span>
              <strong className="warn-text">
                {formatPKR(parsed.validationDifferencePKR)}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="feature-checklist">
        <h5>Detected Features</h5>
        <ul>
          {checks.map((check) => (
            <li key={check.key} className={check.passed ? "feature-pass" : "feature-miss"}>
              <span className="feature-icon">{check.passed ? "✓" : check.optional ? "–" : "○"}</span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {showActionsPreview && previewGroups.length > 0 && (
        <details className="import-actions-preview" open={previewGroups.length <= 6}>
          <summary>Review Actions ({previewGroups.length} main actions)</summary>
          <div className="import-actions-list">
            {previewGroups.map((group) => (
              <div key={group.actionCode} className="import-action-group">
                <div className="import-action-group-head">
                  <span className="group-code-badge">{group.actionCode}</span>
                  <strong>{group.title}</strong>
                  <span className="muted small">
                    {group.activityCount} activities · {formatPKRCompact(group.plannedBudgetPKR)}
                  </span>
                </div>
                <ul className="import-activity-preview">
                  {group.activities.slice(0, 8).map((act) => (
                    <li key={act.actionCode}>
                      <span className="activity-code-badge">{act.actionCode}</span>
                      <span className="import-act-title">{act.title}</span>
                      <span className="muted small">
                        {act.unit || "—"}
                        {act.plannedQuantity != null ? ` · Qty ${act.plannedQuantity}` : ""}
                        {act.estimatedBudgetPKR
                          ? ` · ${formatPKRCompact(act.estimatedBudgetPKR)}`
                          : ""}
                      </span>
                    </li>
                  ))}
                  {group.activities.length > 8 && (
                    <li className="muted small">
                      +{group.activities.length - 8} more activities
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
