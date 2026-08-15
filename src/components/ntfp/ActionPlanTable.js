"use client";

import { useMemo, useState } from "react";
import {
  computeActivityMetrics,
  formatPKR,
  formatPKRCompact,
  statusLabel,
} from "@/lib/ntfp/metrics";
import ProgressBar from "@/components/ProgressBar";

export default function ActionPlanTable({ items = [], progressRecords = [], onSelect }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const { groups, leaves } = useMemo(() => {
    const rawGroups = items.filter((i) => !i.parentActionCode);
    const rawLeaves = items.filter((i) => Boolean(i.parentActionCode));

    if (rawGroups.length > 0 && rawLeaves.length === 0) {
      return { groups: rawGroups, leaves: rawGroups };
    }

    return { groups: rawGroups, leaves: rawLeaves };
  }, [items]);

  const groupSummaries = useMemo(() => {
    const map = {};
    groups.forEach((group) => {
      const groupLeaves = leaves.filter((l) => l.parentActionCode === group.actionCode);
      let plannedBudget = 0;
      let completedCount = 0;
      let inProgressCount = 0;
      let remainingCount = 0;
      let delayedCount = 0;
      let physicalSum = 0;

      groupLeaves.forEach((leaf) => {
        const m = computeActivityMetrics(leaf, progressRecords);
        plannedBudget += leaf.plannedBudgetPKR || leaf.estimatedBudgetPKR || 0;
        physicalSum += m.physicalProgressPercent;
        if (m.status === "completed") completedCount += 1;
        else if (m.status === "in_progress") inProgressCount += 1;
        else if (m.status === "delayed") delayedCount += 1;
        else remainingCount += 1;
      });

      const totalCount = groupLeaves.length;
      map[group.actionCode] = {
        totalActivities: totalCount,
        completedActivities: completedCount,
        inProgressActivities: inProgressCount,
        remainingActivities: remainingCount,
        delayedActivities: delayedCount,
        plannedBudget: group.calculatedSubtotalPKR ?? plannedBudget,
        progressPercent: totalCount > 0 ? physicalSum / totalCount : 0,
      };
    });
    return map;
  }, [groups, leaves, progressRecords]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leaf) => {
      const m = computeActivityMetrics(leaf, progressRecords);
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = (leaf.actionTitle || "").toLowerCase().includes(q);
        const matchesCode = (leaf.actionCode || "").toLowerCase().includes(q);
        const matchesGroup = (leaf.actionGroup || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesGroup) return false;
      }
      return true;
    });
  }, [leaves, progressRecords, search, statusFilter]);

  function toggleGroup(groupCode) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupCode]: !prev[groupCode],
    }));
  }

  function expandAll() {
    setCollapsedGroups({});
  }

  function collapseAll() {
    const all = {};
    groups.forEach((g) => {
      all[g.actionCode] = true;
    });
    setCollapsedGroups(all);
  }

  return (
    <div className="action-plan-container">
      <div className="action-plan-toolbar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by code, activity, or main action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="action-search-input"
          />
          {search && (
            <button type="button" className="clear-search-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <div className="status-filter-pills">
          {[
            { key: "all", label: "All" },
            { key: "in_progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "not_started", label: "Not Started" },
            { key: "delayed", label: "Delayed" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`pill-btn ${statusFilter === tab.key ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="accordion-toggle-btns">
          <button type="button" className="btn-text-sm" onClick={expandAll}>
            Expand All
          </button>
          <span className="divider">·</span>
          <button type="button" className="btn-text-sm" onClick={collapseAll}>
            Collapse All
          </button>
        </div>
      </div>

      <div className="action-group-stack">
        {groups.map((group) => {
          const groupLeaves = filteredLeaves.filter((l) => l.parentActionCode === group.actionCode);
          const summary = groupSummaries[group.actionCode] || {};
          const isCollapsed = Boolean(collapsedGroups[group.actionCode]);

          if (
            filteredLeaves.length > 0 &&
            groupLeaves.length === 0 &&
            (search || statusFilter !== "all")
          ) {
            return null;
          }

          return (
            <div key={group.id} className={`action-group-card ${isCollapsed ? "collapsed" : ""}`}>
              <button
                type="button"
                className="action-group-header"
                onClick={() => toggleGroup(group.actionCode)}
              >
                <div className="group-title-left">
                  <span className={`group-chevron ${isCollapsed ? "closed" : "open"}`}>▼</span>
                  <span className="group-code-badge">{group.actionCode}</span>
                  <div className="group-title-stack">
                    <strong className="group-title">{group.actionTitle}</strong>
                    <span className="group-count-tag">
                      {summary.totalActivities || groupLeaves.length} activities ·{" "}
                      {summary.completedActivities || 0} completed ·{" "}
                      {summary.inProgressActivities || 0} in progress ·{" "}
                      {summary.remainingActivities || 0} remaining
                    </span>
                  </div>
                </div>
                <div className="group-title-right">
                  <div className="group-progress-block">
                    <span className="small muted">Physical</span>
                    <strong>{Math.round(summary.progressPercent || 0)}%</strong>
                    <ProgressBar percent={summary.progressPercent || 0} />
                  </div>
                  {(summary.plannedBudget > 0 || group.sourceSubtotalPKR) && (
                    <span className="group-budget-pill">
                      {formatPKRCompact(summary.plannedBudget || group.sourceSubtotalPKR)}
                    </span>
                  )}
                </div>
              </button>

              {!isCollapsed && (
                <>
                  <div className="table-wrap action-plan-table-wrap desktop-only-table">
                    <table className="data-table action-plan-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Action</th>
                          <th>Unit</th>
                          <th>Unit Cost</th>
                          <th>Planned Qty</th>
                          <th>Estimated Budget</th>
                          <th>Completed Qty</th>
                          <th>Progress</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupLeaves.map((item) => {
                          const m = computeActivityMetrics(item, progressRecords);
                          return (
                            <tr key={item.id} className="activity-row">
                              <td>
                                <span className="activity-code-badge">{item.actionCode}</span>
                              </td>
                              <td>
                                <span className="activity-title">{item.actionTitle}</span>
                              </td>
                              <td>{item.unit || "—"}</td>
                              <td>
                                {item.unitCostPKR != null ? formatPKR(item.unitCostPKR) : "—"}
                              </td>
                              <td>
                                {item.targetQuantity != null
                                  ? item.targetQuantity.toLocaleString()
                                  : "—"}
                              </td>
                              <td>
                                {item.plannedBudgetPKR
                                  ? formatPKR(item.plannedBudgetPKR)
                                  : "—"}
                              </td>
                              <td>{m.achieved}</td>
                              <td style={{ minWidth: 110 }}>
                                <ProgressBar percent={m.physicalProgressPercent} />
                                <span className="progress-percent-label">
                                  {Math.round(m.physicalProgressPercent)}%
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge status-${m.status}`}>
                                  {statusLabel(m.status)}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-sm btn-record-progress"
                                  onClick={() => onSelect?.(item)}
                                >
                                  Update Progress
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobile-activity-cards">
                    {groupLeaves.map((item) => {
                      const m = computeActivityMetrics(item, progressRecords);
                      return (
                        <div key={item.id} className="mobile-activity-card">
                          <div className="mobile-activity-top">
                            <span className="activity-code-badge">{item.actionCode}</span>
                            <span className={`status-badge status-${m.status}`}>
                              {statusLabel(m.status)}
                            </span>
                          </div>
                          <strong className="activity-title">{item.actionTitle}</strong>
                          <div className="mobile-activity-meta">
                            <span>Unit: {item.unit || "—"}</span>
                            <span>
                              Qty:{" "}
                              {item.targetQuantity != null
                                ? `${m.achieved} / ${item.targetQuantity}`
                                : m.achieved}
                            </span>
                            <span>
                              Budget:{" "}
                              {item.plannedBudgetPKR ? formatPKRCompact(item.plannedBudgetPKR) : "—"}
                            </span>
                          </div>
                          <ProgressBar percent={m.physicalProgressPercent} />
                          <button
                            type="button"
                            className="btn-sm btn-record-progress"
                            onClick={() => onSelect?.(item)}
                          >
                            Update Progress
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {filteredLeaves.length === 0 && (
          <div className="empty-table-cell card">
            <p>No action items match your search or status filter.</p>
            {(search || statusFilter !== "all") && (
              <button
                type="button"
                className="btn-sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
