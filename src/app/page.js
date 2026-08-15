"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import Filters from "@/components/Filters";
import PieChart from "@/components/PieChart";
import ProgressBar from "@/components/ProgressBar";
import BarChart from "@/components/BarChart";
import GroupedBarChart from "@/components/GroupedBarChart";
import { applyFilterNavigation } from "@/lib/filterNavigation";
import { getDivisionProgressSummaries, getInterventionSummaries, getProgramTotals } from "@/lib/metrics";

function applySearchFilter(summaries, search) {
  if (!search?.trim()) return summaries;
  const q = search.toLowerCase();
  return summaries.filter((s) => s.name.toLowerCase().includes(q));
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useData();
  const [filters, setFilters] = useState({
    region: "all",
    divisionId: "all",
    planningUnitId: "all",
    interventionId: "all",
    snapshotDate: "all",
    status: "all",
    source: "all",
    search: "",
  });

  const summaries = useMemo(() => {
    let rows = getInterventionSummaries(data, filters);
    if (filters.status && filters.status !== "all") {
      rows = rows.filter((r) => r.status === filters.status);
    }
    if (filters.source && filters.source !== "all") {
      rows = rows.filter((r) => r.source === filters.source);
    }
    return applySearchFilter(rows, filters.search);
  }, [data, filters]);

  const totals = useMemo(() => getProgramTotals(data, filters), [data, filters]);

  const topCompleted = useMemo(
    () => [...summaries].filter((s) => s.target > 0).sort((a, b) => b.progressPct - a.progressPct).slice(0, 5),
    [summaries]
  );
  const topDelayed = useMemo(
    () => [...summaries].filter((s) => s.target > 0 && s.progressPct < 100).sort((a, b) => a.progressPct - b.progressPct).slice(0, 5),
    [summaries]
  );

  const divisionProgress = useMemo(
    () => getDivisionProgressSummaries(data, filters),
    [data, filters]
  );

  const hasData = data.divisions.length > 0;

  function handleFilterChange(next) {
    if (applyFilterNavigation(router, pathname, filters, next)) return;
    setFilters(next);
  }

  return (
    <main className="container">
      {/* Hero Page Header */}
      <div className="page-header-banner">
        <div>
          <h1>BTASP Monitoring Dashboard</h1>
          <p className="sub">
            Decision support system tracking {data.divisions.length} forest divisions, {data.planningUnits.length} planning units, and {data.interventionsMaster.length} interventions.
            {!hasData && " — import the internal monitoring workbook to begin."}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/manual-entry" className="btn-primary">
            Manual Data Entry
          </Link>
          <Link href="/import" className="btn-secondary">
            Import Workbook
          </Link>
          <Link href="/reports" className="btn-secondary">
            Export Reports
          </Link>
        </div>
      </div>

      {/* Quick Nav Shortcut Cards */}
      <div className="quick-nav-bar">
        <Link href="/interventions" className="quick-nav-card">
          <span className="quick-icon">🌱</span>
          <div className="quick-text">
            <strong>{data.interventionsMaster.length} Interventions</strong>
            <span>Progress &amp; Targets</span>
          </div>
        </Link>
        <Link href="/planning-units" className="quick-nav-card">
          <span className="quick-icon">📍</span>
          <div className="quick-text">
            <strong>{data.planningUnits.length} Planning Units</strong>
            <span>Land Use &amp; Demographics</span>
          </div>
        </Link>
        <Link href="/divisions" className="quick-nav-card">
          <span className="quick-icon">🌲</span>
          <div className="quick-text">
            <strong>{data.divisions.length} Forest Divisions</strong>
            <span>Division Summaries</span>
          </div>
        </Link>
        <Link href="/ntfp" className="quick-nav-card">
          <span className="quick-icon">🍯</span>
          <div className="quick-text">
            <strong>NTFP Value Chains</strong>
            <span>Honey &amp; Walnut Action Plans</span>
          </div>
        </Link>
        <Link href="/capacity-building" className="quick-nav-card">
          <span className="quick-icon">🎓</span>
          <div className="quick-text">
            <strong>Capacity Building</strong>
            <span>551 planned training events</span>
          </div>
        </Link>
        <Link href="/gis" className="quick-nav-card">
          <span className="quick-icon">🗺️</span>
          <div className="quick-text">
            <strong>GIS / Spatial Map</strong>
            <span>Shapefiles &amp; Boundaries</span>
          </div>
        </Link>
      </div>

      <section className="grid">
        {/* Filters Card */}
        <div className="card col-12">
          <Filters data={data} filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Core Stat KPIs */}
        <div className="card col-3 stat-card">
          <div className="stat-label">Total Program Target</div>
          <p className="stat-value">{totals.target.toLocaleString()}</p>
          <div className="stat-foot muted small">Across active interventions</div>
        </div>
        <div className="card col-3 stat-card stat-physical">
          <div className="stat-label">Cumulative Achieved</div>
          <p className="stat-value ok">{totals.achieved.toLocaleString()}</p>
          <div className="stat-foot ok small">Verified progress</div>
        </div>
        <div className="card col-3 stat-card">
          <div className="stat-label">Remaining Balance</div>
          <p className="stat-value">{totals.remaining.toLocaleString()}</p>
          <div className="stat-foot muted small">To be completed</div>
        </div>
        <div className="card col-3 stat-card stat-financial">
          <div className="stat-label">Overall Completion</div>
          <div className="stat-progress-box">
            <PieChart percent={totals.progress} size={76} />
            <div className="stat-progress-text">
              <strong>{Math.round(totals.progress)}%</strong>
              <span className="muted small">Achieved</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="card col-6">
          <div className="card-header-row">
            <h3>Program Target vs. Achieved</h3>
          </div>
          <BarChart data={totals} />
        </div>

        <div className="card col-6">
          <div className="card-header-row">
            <h3>Top Completed Interventions</h3>
            <Link href="/interventions" className="small-link">View All →</Link>
          </div>
          <div className="list">
            {topCompleted.map((row) => (
              <Link key={row.id} href={`/interventions/${row.id}`} className="item link-item">
                <div className="item-header">
                  <strong>{row.name}</strong>
                  <span className="badge-percent ok">{Math.round(row.progressPct)}%</span>
                </div>
                <ProgressBar percent={row.progressPct} />
                <div className="item-sub-numbers muted small">
                  Target: {row.target.toLocaleString()} · Achieved: {row.achieved.toLocaleString()}
                </div>
              </Link>
            ))}
            {topCompleted.length === 0 && <p className="small muted">No intervention data loaded.</p>}
          </div>
        </div>

        <div className="card col-6">
          <div className="card-header-row">
            <h3>Division-wise Progress</h3>
            <Link href="/divisions" className="small-link">All Divisions →</Link>
          </div>
          <GroupedBarChart
            groups={divisionProgress.slice(0, 13).map((d) => ({
              id: d.id,
              href: `/divisions/${d.id}`,
              label: d.label,
              target: d.target,
              achieved: d.achieved,
            }))}
          />
        </div>

        <div className="card col-6">
          <div className="card-header-row">
            <h3>Interventions Needing Attention</h3>
            <span className="small muted">Lowest progress</span>
          </div>
          <div className="list">
            {topDelayed.map((row) => (
              <Link key={row.id} href={`/interventions/${row.id}`} className="item link-item">
                <div className="item-header">
                  <strong>{row.name}</strong>
                  <span className="badge-percent warn">{Math.round(row.progressPct)}%</span>
                </div>
                <ProgressBar percent={row.progressPct} />
                <div className="item-sub-numbers muted small">
                  Target: {row.target.toLocaleString()} · Remaining: {row.remaining.toLocaleString()}
                </div>
              </Link>
            ))}
            {topDelayed.length === 0 && <p className="small muted">No delayed interventions found.</p>}
          </div>
        </div>

        {/* Master Intervention Summary Table */}
        <div className="card col-12">
          <div className="card-header-row">
            <div>
              <h3>Intervention-wise Master Summary</h3>
              <p className="small muted">
                Click any row or intervention link to open the planning-unit-wise breakdown and technical guidance.
              </p>
            </div>
            <span className="table-count-badge">{summaries.length} items</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Intervention Name</th>
                  <th style={{ width: "12%" }}>Total Target</th>
                  <th style={{ width: "12%" }}>Achieved</th>
                  <th style={{ width: "12%" }}>Remaining</th>
                  <th style={{ width: "17%" }}>Progress %</th>
                  <th style={{ width: "12%" }}>PUs Covered</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((row) => (
                  <tr
                    key={row.id}
                    className="clickable-row"
                    onClick={() => router.push(`/interventions/${row.id}`)}
                  >
                    <td>
                      <div className="table-name-cell">
                        <Link href={`/interventions/${row.id}`} onClick={(e) => e.stopPropagation()} className="row-main-link">
                          {row.name}
                        </Link>
                        {row.unit && <span className="cell-unit-pill">{row.unit}</span>}
                      </div>
                    </td>
                    <td><strong>{row.target.toLocaleString()}</strong></td>
                    <td><span className="ok">{row.achieved.toLocaleString()}</span></td>
                    <td><span className="muted">{row.remaining.toLocaleString()}</span></td>
                    <td>
                      <div className="progress-stack-cell">
                        <ProgressBar percent={row.progressPct} />
                        <span className="cell-pct-text">{Math.round(row.progressPct)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="pu-covered-badge">{row.puCovered} PUs</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
