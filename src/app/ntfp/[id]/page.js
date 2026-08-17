"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import ActionPlanTable from "@/components/ntfp/ActionPlanTable";
import ImportReviewPanel from "@/components/ntfp/ImportReviewPanel";
import ProgressBar from "@/components/ProgressBar";
import {
  computeActivityMetrics,
  formatDate,
  formatPKR,
  formatPKRCompact,
  getValueChainSummary,
  statusColor,
  statusLabel,
} from "@/lib/ntfp/metrics";
import { applyNtfpImport, parseNtfpActionPlanFile } from "@/lib/ntfp/import";
import {
  createNtfpProgressRecord,
  deleteNtfpProgress,
  upsertNtfpProgress,
} from "@/lib/ntfp/records";
import AdminEntryActions from "@/components/AdminEntryActions";
import { NTFP_STATUS } from "@/lib/modules/seed";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "action-plan", label: "Action Plan" },
  { id: "progress", label: "Progress" },
  { id: "budget", label: "Budget" },
  { id: "history", label: "History" },
];

export default function ValueChainDetailPage() {
  const { id } = useParams();
  const { data, setData } = useData();
  const { canWrite, isAdmin, user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importReview, setImportReview] = useState(null);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importRemark, setImportRemark] = useState("");
  const fileInputRef = useRef(null);

  const [progressForm, setProgressForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    completedQuantity: "",
    manualProgressPercent: "",
    status: "in_progress",
    actualExpenditurePKR: "",
    locationText: "",
    remarks: "",
  });
  const [editingProgress, setEditingProgress] = useState(null);

  const summary = useMemo(() => getValueChainSummary(data, id), [data, id]);
  const chain = summary?.chain;
  const statusUpdates = useMemo(
    () =>
      (data.ntfpStatusUpdates || [])
        .filter((u) => u.valueChainId === id)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [data.ntfpStatusUpdates, id]
  );
  const versions = useMemo(
    () =>
      (data.ntfpActionPlanVersions || [])
        .filter((v) => v.valueChainId === id)
        .sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0)),
    [data.ntfpActionPlanVersions, id]
  );

  if (!chain) {
    return (
      <main className="container ntfp-module">
        <div className="card col-12">
          <h1>Value Chain Not Found</h1>
          <p className="sub">The requested NTFP value chain could not be located.</p>
          <Link href="/ntfp" className="btn-primary">
            Back to NTFP Dashboard
          </Link>
        </div>
      </main>
    );
  }

  function showToast(msg) {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(""), 4000);
  }

  function saveIdentification(e) {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      ntfpValueChains: prev.ntfpValueChains.map((c) =>
        c.id === chain.id
          ? {
              ...c,
              ...editForm,
              name: editForm.commonName ? `${editForm.commonName} Value Chain` : c.name,
              medicinalIdentificationStatus: "confirmed",
              status: NTFP_STATUS.ACTION_PLAN_PENDING,
              actionPlanStatus: "not_started",
              valueChainReportStatus: "not_started",
              updatedAt: timestamp,
              lastUpdatedAt: timestamp,
            }
          : c
      ),
      ntfpStatusUpdates: [
        ...(prev.ntfpStatusUpdates || []),
        {
          id: crypto.randomUUID(),
          valueChainId: chain.id,
          updateType: "identification",
          newValue: "confirmed",
          date: timestamp.slice(0, 10),
          remarks: editForm.remarks,
          createdBy: "user",
          createdAt: timestamp,
        },
      ],
    }));
    setEditForm(null);
    showToast("Value chain identification updated successfully.");
  }

  function handleSelectActivity(item) {
    setSelectedItem(item);
    setEditingProgress(null);
    const m = computeActivityMetrics(item, summary.progressRecords);
    setProgressForm({
      date: new Date().toISOString().slice(0, 10),
      completedQuantity: "",
      manualProgressPercent: "",
      status: m.status === "not_started" ? "in_progress" : m.status,
      actualExpenditurePKR: "",
      locationText: "",
      remarks: "",
    });
  }

  function saveProgress(e) {
    e.preventDefault();
    if (!selectedItem) return;
    const record = createNtfpProgressRecord(progressForm, {
      chainId: chain.id,
      actionItem: selectedItem,
      previous: editingProgress,
      createdBy: user?.displayName || user?.username || "user",
    });
    setData(upsertNtfpProgress(data, record));
    showToast(
      editingProgress
        ? `Progress updated for activity ${selectedItem.actionCode}.`
        : `Progress saved for activity ${selectedItem.actionCode}.`
    );
    setSelectedItem(null);
    setEditingProgress(null);
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportWarnings([]);
    setImporting(true);

    try {
      const parsed = await parseNtfpActionPlanFile(file);
      setImportReview({ parsed, fileName: file.name });
      setImportWarnings(parsed.warnings || []);
      if (parsed.validationStatus === "failed") {
        setImportError(parsed.mappingError || "The Action column could not be read correctly.");
      }
    } catch (err) {
      setImportError(`File parse error: ${err.message}`);
      setImportReview(null);
    } finally {
      setImporting(false);
    }
  }

  function confirmImportActionPlan() {
    if (!importReview) return;
    if (importReview.parsed.validationStatus === "failed") {
      setImportError(importReview.parsed.mappingError || "Action Plan import failed. No activities were saved.");
      return;
    }
    if (importReview.parsed.validationStatus === "warning" && !importRemark.trim()) {
      setImportError("Please add a remark before importing with a budget validation warning.");
      return;
    }
    try {
      const result = applyNtfpImport(data, chain.id, importReview.parsed, {
        importRemark,
      });
      setData(result.data);
      setImportModalOpen(false);
      setImportReview(null);
      setImportRemark("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTab("action-plan");
      showToast(
        `Action Plan imported (${importReview.parsed.activityCount} activities, ${importReview.parsed.groupCount} main actions).`
      );
    } catch (err) {
      setImportError(`Failed to save action plan: ${err.message}`);
    }
  }

  const selectedItemMetrics = selectedItem
    ? computeActivityMetrics(selectedItem, summary.progressRecords)
    : null;

  const hasPlan = summary.totalActivities > 0;
  const recentProgress = [...summary.progressRecords]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 12);

  const groupBudgetRows = (summary.groups || []).map((group) => {
    const activities = summary.items.filter((i) => i.parentActionCode === group.actionCode);
    let planned = 0;
    let spent = 0;
    activities.forEach((a) => {
      const m = computeActivityMetrics(a, summary.progressRecords);
      planned += a.plannedBudgetPKR || 0;
      spent += m.cumulativeExp || 0;
    });
    return {
      ...group,
      planned,
      spent,
      activityCount: activities.length,
    };
  });

  return (
    <main className="container ntfp-module">
      <div className="breadcrumb">
        <Link href="/">Dashboard</Link> / <Link href="/ntfp">NTFP Value Chains</Link> /{" "}
        <span>{chain.name}</span>
      </div>

      <div className="page-header-banner">
        <div className="page-header-text">
          <div className="header-badge-row">
            <span
              className={`status-pill pill-${statusColor(
                chain.actionPlanStatus === "available" ? "available" : chain.status
              )}`}
            >
              Action Plan: {statusLabel(chain.actionPlanStatus || chain.status)}
            </span>
            {summary.currentVersion && (
              <span className="period-pill">{summary.currentVersion.versionLabel}</span>
            )}
          </div>
          <h1>{chain.name}</h1>
          <p className="sub">
            {chain.objective ||
              [
                chain.commonName,
                chain.scientificName ? `(${chain.scientificName})` : null,
                chain.geographicArea,
              ]
                .filter(Boolean)
                .join(" · ")}
          </p>
        </div>

        <div className="page-header-actions">
          {canWrite ? (
            <Link href="/ntfp/manual-entry" className="btn-secondary">
              Manual Entry
            </Link>
          ) : null}
          <button type="button" className="btn-primary" onClick={() => setImportModalOpen(true)}>
            Upload Action Plan
          </button>
          <Link href="/ntfp" className="btn-secondary">
            All Value Chains
          </Link>
        </div>
      </div>

      {saveMessage && (
        <div className="toast-notification">
          <span>✓ {saveMessage}</span>
        </div>
      )}

      {chain.isEditablePlaceholder && (
        <section className="card col-12 identification-card">
          <div className="card-header-row">
            <div>
              <h3>Species / Value Chain Identification</h3>
              <p className="small muted">
                Confirm the priority medicinal plant before preparing its Value Chain Report and
                Action Plan.
              </p>
            </div>
            {!editForm && (
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setEditForm({
                    commonName: chain.commonName || "",
                    scientificName: chain.scientificName || "",
                    geographicArea: chain.geographicArea || "",
                    forestDivision: chain.forestDivision || "",
                    assessmentDocument: chain.assessmentDocument || "",
                    remarks: chain.remarks || "",
                  })
                }
              >
                Update Identification
              </button>
            )}
          </div>

          {editForm && (
            <form onSubmit={saveIdentification} className="form-grid edit-form">
              <div>
                <label>Common / Local Name</label>
                <input
                  value={editForm.commonName}
                  onChange={(e) => setEditForm({ ...editForm, commonName: e.target.value })}
                  placeholder="e.g. Valeriana / Mushk-e-Bala"
                  required
                />
              </div>
              <div>
                <label>Scientific Name</label>
                <input
                  value={editForm.scientificName}
                  onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
                  placeholder="e.g. Valeriana jatamansi"
                />
              </div>
              <div>
                <label>Assessment Area / Region</label>
                <input
                  value={editForm.geographicArea}
                  onChange={(e) => setEditForm({ ...editForm, geographicArea: e.target.value })}
                />
              </div>
              <div>
                <label>Forest Division</label>
                <input
                  value={editForm.forestDivision}
                  onChange={(e) => setEditForm({ ...editForm, forestDivision: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label>Supporting Document</label>
                <input
                  value={editForm.assessmentDocument}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assessmentDocument: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <label>Remarks</label>
                <textarea
                  rows={3}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                />
              </div>
              <div className="form-actions-row">
                <button type="submit" className="btn-primary">
                  Save Identification
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {hasPlan && (
        <section className="grid">
          <div className="card col-3 stat-card stat-physical">
            <div className="stat-label">Planned Budget</div>
            <p className="stat-value">{formatPKRCompact(summary.plannedBudget)}</p>
          </div>
          <div className="card col-3 stat-card">
            <div className="stat-label">Physical Progress</div>
            <p className="stat-value">{summary.physicalProgress.toFixed(1)}%</p>
            <ProgressBar percent={summary.physicalProgress} />
          </div>
          <div className="card col-3 stat-card">
            <div className="stat-label">Activities Completed</div>
            <p className="stat-value">
              {summary.completedActivities} / {summary.totalActivities}
            </p>
            <div className="stat-foot muted small">
              {summary.inProgressActivities} in progress · {summary.remainingActivities} remaining
              {summary.delayedActivities ? ` · ${summary.delayedActivities} delayed` : ""}
            </div>
          </div>
          <div className="card col-3 stat-card stat-financial">
            <div className="stat-label">
              {summary.hasAnyExpenditure ? "Actual Expenditure" : "Expenditure"}
            </div>
            <p className="stat-value">
              {summary.hasAnyExpenditure
                ? formatPKRCompact(summary.actualExpenditure)
                : "No data"}
            </p>
            {summary.hasAnyExpenditure && (
              <div className="stat-foot muted small">
                Utilization {(summary.financialProgress || 0).toFixed(1)}%
              </div>
            )}
          </div>
        </section>
      )}

      <div className="ntfp-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={`ntfp-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="card col-12">
          <div className="overview-grid">
            <div>
              <h3>Overview</h3>
              <dl className="overview-dl">
                <div>
                  <dt>Objective</dt>
                  <dd>{chain.objective || "—"}</dd>
                </div>
                <div>
                  <dt>Species / Product</dt>
                  <dd>
                    {chain.commonName || "—"}
                    {chain.scientificName ? ` · ${chain.scientificName}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Value Chain Report</dt>
                  <dd>
                    <span
                      className={`status-pill pill-${statusColor(
                        chain.valueChainReportStatus
                      )} pill-sm`}
                    >
                      {statusLabel(chain.valueChainReportStatus)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Action Plan Status</dt>
                  <dd>
                    <span
                      className={`status-pill pill-${statusColor(
                        chain.actionPlanStatus || "not_started"
                      )} pill-sm`}
                    >
                      {statusLabel(chain.actionPlanStatus || "not_started")}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Action Plan Version</dt>
                  <dd>{summary.currentVersion?.versionLabel || "Not uploaded"}</dd>
                </div>
                <div>
                  <dt>Implementation</dt>
                  <dd>
                    <span
                      className={`status-pill pill-${statusColor(
                        chain.implementationStatus || "not_started"
                      )} pill-sm`}
                    >
                      {statusLabel(chain.implementationStatus || "not_started")}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Last Update</dt>
                  <dd>{formatDate(summary.lastUpdate)}</dd>
                </div>
              </dl>
            </div>

            {!hasPlan && (
              <div className="empty-action-plan">
                <div className="empty-state-content">
                  <h3>Action Plan: Not Available</h3>
                  <p className="sub">
                    No approved Action Plan has been uploaded. Upload the standard NTFP Action Plan
                    Excel file when it becomes available.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setImportModalOpen(true)}
                  >
                    Upload Action Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "action-plan" && (
        <section className="card col-12 action-plan-card">
          {hasPlan ? (
            <>
              <div className="card-header-row">
                <div>
                  <h3>Action Plan</h3>
                  <p className="small muted">
                    Expand Main Actions to review units, quantities, budgets and update physical
                    progress. You should not need to reopen Excel.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setImportModalOpen(true)}
                >
                  Upload New Version
                </button>
              </div>
              <ActionPlanTable
                items={data.ntfpActionItems.filter((i) => i.valueChainId === chain.id)}
                progressRecords={summary.progressRecords}
                onSelect={handleSelectActivity}
              />
            </>
          ) : (
            <div className="empty-action-plan">
              <div className="empty-state-content">
                <h3>No Action Plan Loaded</h3>
                <p className="sub">
                  Upload the standard Excel Action Plan (S. No, Action, Unit, Unit Cost, Qty,
                  Estimated Budget) to populate this page.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setImportModalOpen(true)}
                >
                  Upload Action Plan
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "progress" && (
        <section className="card col-12">
          <h3>Progress</h3>
          {!hasPlan ? (
            <p className="muted">Upload an Action Plan to begin tracking progress.</p>
          ) : (
            <>
              <div className="progress-summary-grid">
                {(summary.groups || []).map((group) => {
                  const activities = summary.items.filter(
                    (i) => i.parentActionCode === group.actionCode
                  );
                  const avg =
                    activities.reduce(
                      (s, a) =>
                        s + computeActivityMetrics(a, summary.progressRecords).physicalProgressPercent,
                      0
                    ) / (activities.length || 1);
                  return (
                    <div key={group.id} className="progress-group-tile">
                      <span className="group-code-badge">{group.actionCode}</span>
                      <strong>{group.actionTitle}</strong>
                      <ProgressBar percent={avg} />
                      <span className="small muted">{Math.round(avg)}% physical</span>
                    </div>
                  );
                })}
              </div>

              <h4 className="section-subhead">Recent Progress Updates</h4>
              {recentProgress.length === 0 ? (
                <p className="muted small">No progress records yet.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Completed Qty</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        {isAdmin ? <th>Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {recentProgress.map((rec) => {
                        const item = summary.items.find((i) => i.id === rec.actionItemId);
                        return (
                          <tr key={rec.id}>
                            <td>{formatDate(rec.date)}</td>
                            <td>
                              {item?.actionCode} {item?.actionTitle || ""}
                            </td>
                            <td>{rec.completedQuantity ?? "—"}</td>
                            <td>
                              {rec.resultingProgressPercent != null
                                ? `${Math.round(rec.resultingProgressPercent)}%`
                                : "—"}
                            </td>
                            <td>{statusLabel(rec.status || "in_progress")}</td>
                            <td>{rec.remarks || "—"}</td>
                            {isAdmin ? (
                              <td>
                                <AdminEntryActions
                                  isAdmin={isAdmin}
                                  onEdit={() => {
                                    const activity =
                                      item || data.ntfpActionItems.find((i) => i.id === rec.actionItemId);
                                    if (!activity) return;
                                    setSelectedItem(activity);
                                    setEditingProgress(rec);
                                    setProgressForm({
                                      date: rec.date || new Date().toISOString().slice(0, 10),
                                      completedQuantity: rec.completedQuantity ?? "",
                                      manualProgressPercent: rec.manualProgressPercent ?? "",
                                      status: rec.status || "in_progress",
                                      actualExpenditurePKR: rec.actualExpenditurePKR ?? "",
                                      locationText: rec.locationText || "",
                                      remarks: rec.remarks || "",
                                    });
                                  }}
                                  onDelete={() => {
                                    setData(deleteNtfpProgress(data, rec.id));
                                    showToast("Progress record deleted.");
                                  }}
                                  deleteLabel="this NTFP progress record"
                                />
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === "budget" && (
        <section className="card col-12">
          <h3>Budget</h3>
          {!hasPlan ? (
            <p className="muted">Budget detail appears after an Action Plan is imported.</p>
          ) : (
            <>
              <div className="budget-summary-row">
                <div>
                  <span className="muted small">Planned Budget</span>
                  <strong>{formatPKR(summary.plannedBudget)}</strong>
                </div>
                <div>
                  <span className="muted small">Actual Expenditure</span>
                  <strong>
                    {summary.hasAnyExpenditure
                      ? formatPKR(summary.actualExpenditure)
                      : "No expenditure data"}
                  </strong>
                </div>
                <div>
                  <span className="muted small">Remaining</span>
                  <strong>
                    {summary.hasAnyExpenditure
                      ? formatPKR(summary.remainingBudget)
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Main Action</th>
                      <th>Activities</th>
                      <th>Planned Budget</th>
                      <th>Actual Expenditure</th>
                      <th>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupBudgetRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>
                            {row.actionCode}. {row.actionTitle}
                          </strong>
                        </td>
                        <td>{row.activityCount}</td>
                        <td>{formatPKR(row.planned)}</td>
                        <td>
                          {summary.hasAnyExpenditure ? formatPKR(row.spent) : "—"}
                        </td>
                        <td>
                          {summary.hasAnyExpenditure && row.planned > 0
                            ? `${((row.spent / row.planned) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="card col-12">
          <h3>History</h3>
          <h4 className="section-subhead">Action Plan Versions</h4>
          {versions.length === 0 ? (
            <p className="muted small">No Action Plan versions yet.</p>
          ) : (
            <ul className="version-list">
              {versions.map((v) => (
                <li key={v.id}>
                  <strong>{v.versionLabel}</strong>
                  <span className="muted small">
                    {v.sourceFileName || v.title} · {formatDate(v.uploadedAt)}
                    {v.isCurrent ? " · Active" : ""}
                    {v.validationStatus === "warning" ? " · Imported with warning" : ""}
                  </span>
                  <span>{formatPKRCompact(v.calculatedGrandTotalPKR || v.plannedBudgetPKR)}</span>
                </li>
              ))}
            </ul>
          )}

          <h4 className="section-subhead">Status Updates</h4>
          {statusUpdates.length === 0 ? (
            <p className="muted small">No status history recorded yet.</p>
          ) : (
            <ul className="version-list">
              {statusUpdates.map((u) => (
                <li key={u.id}>
                  <strong>{u.updateType.replace(/_/g, " ")}</strong>
                  <span className="muted small">
                    {formatDate(u.date)} · {u.newValue}
                  </span>
                  <span>{u.remarks || ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {importModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setImportModalOpen(false);
            setImportReview(null);
            setImportError("");
          }}
        >
          <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Upload Action Plan — {chain.name}</h3>
                <p className="small muted">
                  Upload the standard Excel Action Plan. The app will detect Main Actions,
                  activities, units, quantities and budgets, then show a feature review before
                  import.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportReview(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <label>Select Action Plan File (.xlsx, .xls, .csv)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileSelect}
              />

              {importing && <p className="small muted">Reading and validating Action Plan…</p>}
              {importError && <div className="import-status import-status-error">{importError}</div>}

              {importWarnings.length > 0 && (
                <div className="import-warnings">
                  <strong>Validation notes</strong>
                  <ul>
                    {importWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importReview && (
                <>
                  <ImportReviewPanel
                    parsed={importReview.parsed}
                    fileName={importReview.fileName}
                  />
                  {importReview.parsed.validationStatus === "warning" && (
                    <div className="form-item" style={{ marginTop: 12 }}>
                      <label>Remark for import with warning *</label>
                      <textarea
                        rows={2}
                        value={importRemark}
                        onChange={(e) => setImportRemark(e.target.value)}
                        placeholder="Explain why you are proceeding despite the budget difference…"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={!importReview || importing || importReview?.parsed?.validationStatus === "failed"}
                onClick={confirmImportActionPlan}
              >
                {importReview?.parsed?.validationStatus === "warning"
                  ? "Import with Warning"
                  : "Import Action Plan"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportReview(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && selectedItemMetrics && (
        <div className="drawer-backdrop" onClick={() => { setSelectedItem(null); setEditingProgress(null); }}>
          <aside className="progress-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="drawer-kicker">
                  {editingProgress ? "Edit Action Progress" : "Update Action Progress"}
                </p>
                <span className="activity-code-badge">{selectedItem.actionCode}</span>
                <h3>{selectedItem.actionTitle}</h3>
                <p className="small muted">{chain.name}</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setSelectedItem(null);
                  setEditingProgress(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="activity-modal-stats drawer-stats">
              <div className="mini-stat">
                <span className="muted">Planned Unit</span>
                <strong>{selectedItem.unit || "—"}</strong>
              </div>
              <div className="mini-stat">
                <span className="muted">Planned Quantity</span>
                <strong>
                  {selectedItem.targetQuantity != null ? selectedItem.targetQuantity : "—"}
                </strong>
              </div>
              <div className="mini-stat">
                <span className="muted">Planned Budget</span>
                <strong>{formatPKR(selectedItem.plannedBudgetPKR)}</strong>
              </div>
              <div className="mini-stat">
                <span className="muted">Completed Qty</span>
                <strong>{selectedItemMetrics.achieved}</strong>
              </div>
              <div className="mini-stat">
                <span className="muted">Physical Progress</span>
                <strong>{selectedItemMetrics.physicalProgressPercent.toFixed(1)}%</strong>
              </div>
              <div className="mini-stat">
                <span className="muted">Expenditure</span>
                <strong>
                  {selectedItemMetrics.hasExpenditure
                    ? formatPKR(selectedItemMetrics.cumulativeExp)
                    : "None"}
                </strong>
              </div>
            </div>

            {selectedItemMetrics.isOverBudget && (
              <div className="budget-warning-box">
                <strong>Budget Overrun</strong>
                <p className="small">
                  Actual expenditure exceeds the planned budget by{" "}
                  {formatPKR(
                    selectedItemMetrics.cumulativeExp - (selectedItem.plannedBudgetPKR || 0)
                  )}
                  .
                </p>
              </div>
            )}

            <form onSubmit={saveProgress} className="modal-form">
              <div className="form-grid drawer-form-grid">
                <div>
                  <label>Date *</label>
                  <input
                    type="date"
                    value={progressForm.date}
                    onChange={(e) => setProgressForm({ ...progressForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Status</label>
                  <select
                    value={progressForm.status}
                    onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label>Completed Quantity Increment ({selectedItem.unit || "units"})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={progressForm.completedQuantity}
                    onChange={(e) =>
                      setProgressForm({ ...progressForm, completedQuantity: e.target.value })
                    }
                  />
                </div>
                {!(selectedItem.targetQuantity > 0) && (
                  <div>
                    <label>Manual Physical Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={progressForm.manualProgressPercent}
                      onChange={(e) =>
                        setProgressForm({
                          ...progressForm,
                          manualProgressPercent: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <label>Actual Expenditure Increment (PKR, optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={progressForm.actualExpenditurePKR}
                    onChange={(e) =>
                      setProgressForm({ ...progressForm, actualExpenditurePKR: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Location</label>
                  <input
                    type="text"
                    value={progressForm.locationText}
                    onChange={(e) =>
                      setProgressForm({ ...progressForm, locationText: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label>Remarks</label>
                  <textarea
                    rows={3}
                    value={progressForm.remarks}
                    onChange={(e) =>
                      setProgressForm({ ...progressForm, remarks: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingProgress ? "Update Progress" : "Save Progress"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedItem(null);
                    setEditingProgress(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
