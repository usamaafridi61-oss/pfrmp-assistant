"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import ValueChainCard from "@/components/ntfp/ValueChainCard";
import {
  formatPKRCompact,
  getNtfpDashboardSummary,
} from "@/lib/ntfp/metrics";

export default function NtfpDashboardPage() {
  const { data } = useData();
  const { canWrite } = useAuth();
  const summary = useMemo(() => getNtfpDashboardSummary(data), [data]);
  const [filter, setFilter] = useState("all");

  const filteredChains = useMemo(() => {
    if (filter === "all") return summary.chainSummaries;
    if (filter === "active") {
      return summary.chainSummaries.filter(
        (s) =>
          s?.chain?.actionPlanStatus === "available" ||
          s?.chain?.status === "action_plan_available"
      );
    }
    if (filter === "pending") {
      return summary.chainSummaries.filter(
        (s) =>
          s?.chain?.actionPlanStatus === "not_started" ||
          s?.chain?.status === "action_plan_pending" ||
          s?.chain?.status === "identification_pending"
      );
    }
    return summary.chainSummaries;
  }, [summary.chainSummaries, filter]);

  return (
    <main className="container ntfp-module">
      <div className="breadcrumb">
        <Link href="/">Dashboard</Link> / NTFP Value Chains
      </div>

      <div className="page-header-banner">
        <div>
          <h1>NTFP Value Chains</h1>
          <p className="sub">
            Track value-chain reports, Action Plan budgets, and physical implementation progress
            across six BTASP NTFP value chains.
          </p>
        </div>
        <div className="page-header-actions">
          {canWrite ? (
            <Link href="/ntfp/manual-entry" className="btn-primary">
              Manual Entry
            </Link>
          ) : null}
          <Link href="/module-import" className="btn-secondary">
            Import Action Plan
          </Link>
          <Link href="/reports" className="btn-secondary">
            Reports
          </Link>
        </div>
      </div>

      <section className="grid ntfp-kpi-grid">
        <div className="card stat-card col-3">
          <div className="stat-label">Total Value Chains</div>
          <p className="stat-value">{summary.totalValueChains}</p>
          <div className="stat-foot muted small">
            {summary.reportsCompletedCount} reports completed
          </div>
        </div>

        <div className="card stat-card col-3">
          <div className="stat-label">Action Plans Available</div>
          <p className="stat-value">{summary.actionPlansAvailableCount}</p>
          <div className="stat-foot muted small">
            {summary.medicinalPendingCount} medicinal pending ID
          </div>
        </div>

        <div className="card stat-card col-3 stat-physical">
          <div className="stat-label">Overall Physical Progress</div>
          <p className="stat-value">{summary.overallPhysicalProgress.toFixed(1)}%</p>
          <div className="stat-foot muted small">
            {summary.completedActivities}/{summary.totalActivities || 0} activities done
          </div>
        </div>

        <div className="card stat-card col-3">
          <div className="stat-label">Total Planned Budget</div>
          <p className="stat-value">{formatPKRCompact(summary.totalPlannedBudget)}</p>
          <div className="stat-foot muted small">
            {summary.hasAnyExpenditure
              ? `${formatPKRCompact(summary.actualExpenditure)} spent`
              : "No expenditure data yet"}
          </div>
        </div>

        <div className="card stat-card col-3">
          <div className="stat-label">Activities In Progress</div>
          <p className="stat-value">{summary.inProgressActivities}</p>
          <div className="stat-foot muted small">
            {summary.remainingActivities} remaining · {summary.delayedActivities} delayed
          </div>
        </div>

        <div className="card stat-card col-3">
          <div className="stat-label">Reports Under Preparation</div>
          <p className="stat-value">{summary.reportsUnderPreparationCount}</p>
          <div className="stat-foot muted small">
            {summary.actionPlansUnderPreparationCount} plans under preparation
          </div>
        </div>

        {summary.hasAnyExpenditure && (
          <>
            <div className="card stat-card col-3 stat-financial">
              <div className="stat-label">Budget Utilization</div>
              <p className="stat-value">{(summary.budgetUtilization || 0).toFixed(1)}%</p>
              <div className="stat-foot muted small">Physical ≠ financial progress</div>
            </div>
            <div className="card stat-card col-3">
              <div className="stat-label">Remaining Budget</div>
              <p className="stat-value">{formatPKRCompact(summary.remainingBudget)}</p>
              <div className="stat-foot muted small">After recorded expenditure</div>
            </div>
          </>
        )}
      </section>

      <section className="grid">
        <div className="card col-12 card-header-row">
          <div>
            <h3>All Value Chains ({filteredChains.length})</h3>
            <p className="small muted">
              Open a value chain to review its Action Plan, update progress, or upload a new plan
              version.
            </p>
          </div>

          <div className="filter-pill-group">
            <button
              type="button"
              className={`pill-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({summary.totalValueChains})
            </button>
            <button
              type="button"
              className={`pill-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Action Plan Available ({summary.actionPlansAvailableCount})
            </button>
            <button
              type="button"
              className={`pill-btn ${filter === "pending" ? "active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pending (
              {summary.actionPlansPendingCount + summary.identificationPendingCount})
            </button>
          </div>
        </div>

        {filteredChains.map((chainSummary) => (
          <div key={chainSummary?.chain?.id} className="col-4">
            <ValueChainCard summary={chainSummary} />
          </div>
        ))}
      </section>
    </main>
  );
}
