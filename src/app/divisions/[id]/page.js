"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import ManualEntryForm from "@/components/ManualEntryForm";
import ProgressBar from "@/components/ProgressBar";
import { getDivisionSummaries, getEffectivePuIntervention } from "@/lib/metrics";

export default function DivisionDetailPage() {
  const { id } = useParams();
  const { data, setData } = useData();
  const [showManualEntry, setShowManualEntry] = useState(false);

  const division = data.divisions.find((d) => d.id === id);
  const { planningUnits, interventions } = useMemo(
    () => (division ? getDivisionSummaries(data, id) : { planningUnits: [], interventions: [] }),
    [data, division, id]
  );

  const underperforming = useMemo(() => {
    const rows = [];
    planningUnits.forEach((pu) => {
      interventions.forEach((intv) => {
        const m = getEffectivePuIntervention(data, pu.id, intv.id);
        if (m.hasTarget && m.progressPct < 50) {
          rows.push({ pu, intv, ...m });
        }
      });
    });
    return rows.sort((a, b) => a.progressPct - b.progressPct).slice(0, 10);
  }, [data, planningUnits, interventions]);

  const manualUpdates = data.manualEntries.filter((m) => m.divisionId === id);

  if (!division) {
    return (
      <main className="container">
        <h1>Division not found</h1>
        <Link href="/divisions">Back to divisions</Link>
      </main>
    );
  }

  const totalTarget = interventions.reduce((a, b) => a + b.target, 0);
  const totalAchieved = interventions.reduce((a, b) => a + b.achieved, 0);

  return (
    <main className="container">
      <p className="breadcrumb">
        <Link href="/divisions">Forest Divisions</Link> / {division.name}
      </p>
      <h1>{division.name}</h1>
      <p className="sub">{division.region} · {planningUnits.length} planning units</p>

      <section className="grid">
        <div className="card col-4 stat-card">
          <h3>Division Target</h3>
          <p className="stat-value">{totalTarget.toLocaleString()}</p>
        </div>
        <div className="card col-4 stat-card">
          <h3>Achieved</h3>
          <p className="stat-value">{totalAchieved.toLocaleString()}</p>
        </div>
        <div className="card col-4 stat-card">
          <h3>Progress</h3>
          <ProgressBar percent={totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0} />
        </div>

        <div className="card col-12">
          <div className="card-header-row">
            <h3>Planning Units</h3>
            <button type="button" onClick={() => setShowManualEntry(!showManualEntry)}>
              {showManualEntry ? "Hide Manual Entry" : "Manual Entry"}
            </button>
          </div>
          {showManualEntry && <ManualEntryForm data={data} setData={setData} defaults={{ divisionId: id }} />}
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr><th>Planning Unit</th><th>Region</th><th>Area (Ha)</th><th>Population</th></tr>
              </thead>
              <tbody>
                {planningUnits.map((pu) => (
                  <tr key={pu.id}>
                    <td><Link href={`/planning-units/${pu.id}`}>{pu.name}</Link></td>
                    <td>{pu.region}</td>
                    <td>{pu.areaHa?.toLocaleString() ?? "—"}</td>
                    <td>{pu.population?.toLocaleString() ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card col-12">
          <h3>Interventions in Division</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr><th>Intervention</th><th>Target</th><th>Achieved</th><th>Remaining</th><th>Progress %</th></tr>
              </thead>
              <tbody>
                {interventions.filter((i) => i.target > 0 || i.achieved > 0).map((row) => (
                  <tr key={row.id}>
                    <td><Link href={`/interventions/${row.id}`}>{row.name}</Link></td>
                    <td>{row.target.toLocaleString()}</td>
                    <td>{row.achieved.toLocaleString()}</td>
                    <td>{row.remaining.toLocaleString()}</td>
                    <td>{Math.round(row.progressPct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card col-6">
          <h3>Underperforming PU × Intervention</h3>
          <div className="list">
            {underperforming.map((row, i) => (
              <div key={i} className="item">
                <strong>{row.pu.name}</strong> — {row.intv.name}
                <ProgressBar percent={row.progressPct} />
              </div>
            ))}
            {underperforming.length === 0 && <p className="small">None below 50% progress.</p>}
          </div>
        </div>

        <div className="card col-6">
          <h3>Manual Updates</h3>
          <div className="list">
            {manualUpdates.map((m) => (
              <div key={m.id} className="item">
                <strong>{m.entryType}</strong> — {m.date}
                <p className="small">{m.remarks || "No remarks"}</p>
              </div>
            ))}
            {manualUpdates.length === 0 && <p className="small">No manual entries for this division.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
