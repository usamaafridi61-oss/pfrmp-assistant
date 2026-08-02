"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import PieChart from "@/components/PieChart";
import GroupedBarChart from "@/components/GroupedBarChart";
import GuidancePanel from "@/components/GuidancePanel";
import ManualEntryForm from "@/components/ManualEntryForm";
import { getInterventionPuRows, getInterventionSummaries } from "@/lib/metrics";
import { interventionHasBeneficiaries } from "@/lib/guidance";

export default function InterventionDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data, setData } = useData();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [filters] = useState({ region: "all", divisionId: "all", planningUnitId: "all" });

  const intervention = data.interventionsMaster.find((i) => i.id === id);
  const summary = useMemo(
    () => getInterventionSummaries(data, filters).find((s) => s.id === id),
    [data, filters, id]
  );
  const puRows = useMemo(() => getInterventionPuRows(data, id, filters), [data, id, filters]);

  const byDivision = useMemo(() => {
    const map = new Map();
    puRows.forEach((row) => {
      const key = row.divisionId;
      const existing = map.get(key) || {
        id: row.divisionId,
        href: `/divisions/${row.divisionId}`,
        label: row.divisionName || row.divisionId,
        target: 0,
        achieved: 0,
      };
      existing.target += row.target;
      existing.achieved += row.achieved;
      map.set(key, existing);
    });
    return [...map.values()].sort((a, b) => b.target - a.target);
  }, [puRows]);

  const byPu = useMemo(
    () =>
      [...puRows]
        .sort((a, b) => b.target - a.target)
        .slice(0, 15)
        .map((r) => ({
          id: r.planningUnitId,
          href: `/planning-units/${r.planningUnitId}`,
          label: r.planningUnitName,
          target: r.target,
          achieved: r.achieved,
        })),
    [puRows]
  );

  const showBeneficiaries = intervention && interventionHasBeneficiaries(intervention);

  if (!intervention) {
    return (
      <main className="container">
        <h1>Intervention not found</h1>
        <Link href="/interventions">Back to interventions</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <p className="breadcrumb">
        <Link href="/interventions">Interventions</Link> / {intervention.name}
      </p>
      <h1>{intervention.name}</h1>

      <section className="grid">
        <div className="card col-12">
          <h3>Intervention Overview</h3>
          <div className="profile-grid">
            <div><span className="muted">Category</span><strong>{intervention.category || "—"}</strong></div>
            <div><span className="muted">Unit</span><strong>{intervention.unit}</strong></div>
            <div><span className="muted">PUs with targets/progress</span><strong>{summary?.puCovered ?? 0}</strong></div>
            <div><span className="muted">Beneficiaries tracked</span><strong>{interventionHasBeneficiaries(intervention) ? "M-B / F-B" : "No"}</strong></div>
          </div>
        </div>

        <div className="card col-3 stat-card">
          <h3>Total Target</h3>
          <p className="stat-value">{summary?.target.toLocaleString() ?? 0}</p>
        </div>
        <div className="card col-3 stat-card">
          <h3>Achieved</h3>
          <p className="stat-value">{summary?.achieved.toLocaleString() ?? 0}</p>
        </div>
        <div className="card col-3 stat-card">
          <h3>Remaining</h3>
          <p className="stat-value">{summary?.remaining.toLocaleString() ?? 0}</p>
        </div>
        <div className="card col-3 stat-card">
          <h3>Progress</h3>
          <PieChart percent={summary?.progressPct ?? 0} size={80} />
        </div>

        <div className="card col-6">
          <h3>Target vs Achieved by Division</h3>
          <GroupedBarChart groups={byDivision.slice(0, 13)} />
        </div>
        <div className="card col-6">
          <h3>Target vs Achieved by Planning Unit (top 15)</h3>
          <GroupedBarChart groups={byPu} />
        </div>

        {showBeneficiaries && (
          <div className="card col-12">
            <h3>Male / Female Beneficiaries</h3>
            <GroupedBarChart
              groups={puRows.slice(0, 10).map((r) => ({
                id: r.planningUnitId,
                href: `/planning-units/${r.planningUnitId}`,
                label: r.planningUnitName,
                target: r.maleBeneficiaries,
                achieved: r.femaleBeneficiaries,
              }))}
            />
            <p className="small">Bars show M-B (target color) and F-B (achieved color) per PU.</p>
          </div>
        )}

        <div className="card col-12">
          <div className="card-header-row">
            <h3>Planning Unit Breakdown</h3>
            <button type="button" onClick={() => setShowManualEntry(!showManualEntry)}>
              {showManualEntry ? "Hide Manual Entry" : "Manual Entry"}
            </button>
          </div>
          {showManualEntry && (
            <ManualEntryForm data={data} setData={setData} defaults={{ interventionId: id }} />
          )}
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Division</th>
                  <th>Planning Unit</th>
                  <th>Target</th>
                  <th>Achieved</th>
                  <th>Remaining</th>
                  {showBeneficiaries && <th>M-B</th>}
                  {showBeneficiaries && <th>F-B</th>}
                  <th>Progress %</th>
                </tr>
              </thead>
              <tbody>
                {puRows.map((row) => (
                  <tr
                    key={row.planningUnitId}
                    className="clickable-row"
                    onClick={() => router.push(`/planning-units/${row.planningUnitId}`)}
                  >
                    <td>{row.region}</td>
                    <td>
                      <Link href={`/divisions/${row.divisionId}`} onClick={(e) => e.stopPropagation()}>
                        {row.divisionName}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/planning-units/${row.planningUnitId}`} onClick={(e) => e.stopPropagation()}>
                        {row.planningUnitName}
                      </Link>
                    </td>
                    <td>{row.target.toLocaleString()}</td>
                    <td>{row.achieved.toLocaleString()}</td>
                    <td>{row.remaining.toLocaleString()}</td>
                    {showBeneficiaries && <td>{row.maleBeneficiaries}</td>}
                    {showBeneficiaries && <td>{row.femaleBeneficiaries}</td>}
                    <td>{Math.round(row.progressPct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card col-12">
          <GuidancePanel interventionId={id} data={data} />
        </div>
      </section>
    </main>
  );
}
