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
      <h1>Dashboard</h1>
      <p className="sub">
        BTASP monitoring: {data.divisions.length} divisions, {data.planningUnits.length} planning units,{" "}
        {data.interventionsMaster.length} interventions
        {!hasData && " — import the internal monitoring workbook for full data."}
      </p>

      <section className="grid">
        <div className="card col-12">
          <h3>Filters</h3>
          <Filters data={data} filters={filters} onChange={handleFilterChange} />
        </div>

        <div className="card col-3 stat-card">
          <h3>Total Target</h3>
          <p className="stat-value">{totals.target.toLocaleString()}</p>
        </div>
        <div className="card col-3 stat-card">
          <h3>Achieved</h3>
          <p className="stat-value">{totals.achieved.toLocaleString()}</p>
        </div>
        <div className="card col-3 stat-card">
          <h3>Remaining</h3>
          <p className="stat-value">{totals.remaining.toLocaleString()}</p>
        </div>
        <div className="card col-3 stat-card">
          <h3>Progress</h3>
          <PieChart percent={totals.progress} size={80} />
        </div>

        <div className="card col-6">
          <h3>Program Overview</h3>
          <BarChart data={totals} />
        </div>
        <div className="card col-6">
          <h3>Top Completed Interventions</h3>
          <div className="list">
            {topCompleted.map((row) => (
              <Link key={row.id} href={`/interventions/${row.id}`} className="item link-item">
                <div className="item-header">
                  <strong>{row.name}</strong>
                  <span>{Math.round(row.progressPct)}%</span>
                </div>
                <ProgressBar percent={row.progressPct} />
              </Link>
            ))}
            {topCompleted.length === 0 && <p className="small">No data yet.</p>}
          </div>
        </div>

        <div className="card col-6">
          <h3>Division-wise Progress</h3>
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
          <h3>Top Delayed Interventions</h3>
          <div className="list">
            {topDelayed.map((row) => (
              <Link key={row.id} href={`/interventions/${row.id}`} className="item link-item">
                <div className="item-header">
                  <strong>{row.name}</strong>
                  <span>{Math.round(row.progressPct)}%</span>
                </div>
                <ProgressBar percent={row.progressPct} />
              </Link>
            ))}
            {topDelayed.length === 0 && <p className="small">No delayed interventions.</p>}
          </div>
        </div>

        <div className="card col-12">
          <h3>Intervention-wise Summary</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Intervention</th>
                  <th>Total Target</th>
                  <th>Achieved</th>
                  <th>Remaining</th>
                  <th>Progress %</th>
                  <th>PUs Covered</th>
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
                      <Link href={`/interventions/${row.id}`} onClick={(e) => e.stopPropagation()}>
                        {row.name}
                      </Link>
                    </td>
                    <td>{row.target.toLocaleString()}</td>
                    <td>{row.achieved.toLocaleString()}</td>
                    <td>{row.remaining.toLocaleString()}</td>
                    <td>{Math.round(row.progressPct)}%</td>
                    <td>{row.puCovered}</td>
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
