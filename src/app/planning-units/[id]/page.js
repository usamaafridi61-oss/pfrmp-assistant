"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import DonutChart from "@/components/DonutChart";
import GroupedBarChart from "@/components/GroupedBarChart";
import PieChart from "@/components/PieChart";
import ProgressBar from "@/components/ProgressBar";
import GuidancePanel from "@/components/GuidancePanel";
import ManualEntryForm from "@/components/ManualEntryForm";
import SourceBadge from "@/components/SourceBadge";
import {
  getEffectivePuIntervention,
  getProgressTimeline,
  getPuInterventionRows,
  getInterventionSummaries,
} from "@/lib/metrics";

const LAND_USE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#059669", "#84cc16", "#9ca3af"];

export default function PlanningUnitDetailPage() {
  const { id } = useParams();
  const { data, setData } = useData();
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showGuidance, setShowGuidance] = useState(null);

  const pu = data.planningUnits.find((p) => p.id === id);
  const division = data.divisions.find((d) => d.id === pu?.divisionId);
  const interventionRows = useMemo(() => (pu ? getPuInterventionRows(data, pu.id) : []), [data, pu]);

  const landUseSegments = useMemo(() => {
    if (!pu?.landUse) return [];
    const lu = pu.landUse;
    return [
      { label: "Agriculture", value: lu.agricultureHa || 0 },
      { label: "Water body", value: lu.waterBodyHa || 0 },
      { label: "Settlement", value: lu.settlementHa || 0 },
      { label: "Forest", value: lu.forestHa || 0 },
      { label: "Grass land", value: lu.grasslandHa || 0 },
      { label: "Barren land", value: lu.barrenLandHa || 0 },
    ]
      .filter((s) => s.value > 0)
      .map((s, i) => ({ ...s, color: LAND_USE_COLORS[i % LAND_USE_COLORS.length] }));
  }, [pu]);

  const selectedMetrics = selectedIntervention
    ? getEffectivePuIntervention(data, id, selectedIntervention)
    : null;
  const selectedIntv = data.interventionsMaster.find((i) => i.id === selectedIntervention);
  const timeline = selectedIntervention ? getProgressTimeline(data, id, selectedIntervention) : [];

  const divisionAvg = useMemo(() => {
    if (!selectedIntervention || !pu) return null;
    const summaries = getInterventionSummaries(data, { divisionId: pu.divisionId });
    const s = summaries.find((i) => i.id === selectedIntervention);
    const puCount = data.planningUnits.filter((p) => p.divisionId === pu.divisionId).length || 1;
    return s ? { target: s.target / puCount, achieved: s.achieved / puCount } : null;
  }, [data, selectedIntervention, pu]);

  const programAvg = useMemo(() => {
    if (!selectedIntervention) return null;
    const summaries = getInterventionSummaries(data, {});
    const s = summaries.find((i) => i.id === selectedIntervention);
    const puCount = data.planningUnits.length || 1;
    return s ? { target: s.target / puCount, achieved: s.achieved / puCount } : null;
  }, [data, selectedIntervention]);

  if (!pu) {
    return (
      <main className="container">
        <h1>Planning unit not found</h1>
        <Link href="/planning-units">Back to planning units</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <p className="breadcrumb">
        <Link href="/planning-units">Planning Units</Link> / {pu.name}
      </p>
      <h1>{pu.name}</h1>

      <section className="grid">
        <div className="card col-12">
          <h3>General Information</h3>
          <div className="profile-grid">
            <div><span className="muted">Forest Division</span><strong>{pu.divisionName || division?.name}</strong></div>
            <div><span className="muted">Region</span><strong>{pu.region}</strong></div>
            <div><span className="muted">PU Area</span><strong>{pu.areaHa?.toLocaleString() ?? "—"} Ha</strong></div>
            <div><span className="muted">Total Households</span><strong>{pu.totalHouseholds?.toLocaleString() ?? "—"}</strong></div>
            <div><span className="muted">Population</span><strong>{pu.population?.toLocaleString() ?? "—"}</strong></div>
            <div><span className="muted">Existing Intervention Area</span><strong>{pu.existingInterventionAreaHa?.toLocaleString() ?? "—"} Ha</strong></div>
          </div>
        </div>

        {landUseSegments.length > 0 && (
          <>
            <div className="card col-12">
              <h3>Land Use Summary</h3>
              <div className="land-use-cards">
                {landUseSegments.map((s) => {
                  const total = pu.landUse?.totalHa || landUseSegments.reduce((a, b) => a + b.value, 0);
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.label} className="land-use-card" style={{ borderColor: s.color }}>
                      <span className="muted">{s.label}</span>
                      <strong>{s.value.toLocaleString()} Ha</strong>
                      <span className="small">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card col-6">
              <h3>Land Use Composition</h3>
              <DonutChart segments={landUseSegments} />
            </div>
            <div className="card col-6">
              <h3>Land Use Table &amp; Bar Chart</h3>
              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr><th>Land use</th><th>Area (Ha)</th><th>Share %</th></tr>
                  </thead>
                  <tbody>
                    {landUseSegments.map((s) => {
                      const total = pu.landUse?.totalHa || landUseSegments.reduce((a, b) => a + b.value, 0);
                      return (
                        <tr key={s.label}>
                          <td>{s.label}</td>
                          <td>{s.value.toLocaleString()}</td>
                          <td>{total > 0 ? Math.round((s.value / total) * 100) : 0}%</td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td><strong>Total</strong></td>
                      <td><strong>{(pu.landUse?.totalHa || 0).toLocaleString()}</strong></td>
                      <td><strong>100%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h4>Area by category (Ha)</h4>
              <GroupedBarChart groups={landUseSegments.map((s) => ({ label: s.label, target: s.value, achieved: s.value }))} />
            </div>
          </>
        )}

        <div className="card col-12">
          <div className="card-header-row">
            <h3>Interventions</h3>
            <button type="button" onClick={() => setShowManualEntry(!showManualEntry)}>
              {showManualEntry ? "Hide Manual Entry" : "Manual Entry"}
            </button>
          </div>
          {showManualEntry && (
            <ManualEntryForm data={data} setData={setData} defaults={{ divisionId: pu.divisionId, planningUnitId: pu.id }} />
          )}
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Intervention</th>
                  <th>Target</th>
                  <th>Achieved</th>
                  <th>Remaining</th>
                  <th>M-B</th>
                  <th>F-B</th>
                  <th>Progress %</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interventionRows.map((row) => (
                  <tr key={row.id}>
                    <td><Link href={`/interventions/${row.id}`}>{row.name}</Link></td>
                    <td>{row.target.toLocaleString()}</td>
                    <td>{row.achieved.toLocaleString()}</td>
                    <td>{row.remaining.toLocaleString()}</td>
                    <td>{row.maleBeneficiaries || "—"}</td>
                    <td>{row.femaleBeneficiaries || "—"}</td>
                    <td>
                      <ProgressBar percent={row.progressPct} />
                    </td>
                    <td><SourceBadge source={row.source} /></td>
                    <td className="action-cell">
                      <button type="button" className="btn-sm" onClick={() => setSelectedIntervention(row.id)}>View Graphs</button>
                      <button type="button" className="btn-sm" onClick={() => { setShowManualEntry(true); }}>Manual Entry</button>
                      <button type="button" className="btn-sm" onClick={() => setShowGuidance(showGuidance === row.id ? null : row.id)}>Guidance</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showGuidance && (
          <div className="card col-12">
            <GuidancePanel interventionId={showGuidance} data={data} />
          </div>
        )}

        {selectedIntervention && selectedMetrics && selectedIntv && (
          <div className="card col-12">
            <h3>{selectedIntv.name} — Graphics</h3>
            <div className="grid">
              <div className="col-4">
                <h4>Target vs Achieved</h4>
                <GroupedBarChart groups={[{ label: pu.name, target: selectedMetrics.target, achieved: selectedMetrics.achieved }]} />
              </div>
              <div className="col-4">
                <h4>Remaining Target</h4>
                <PieChart percent={selectedMetrics.target > 0 ? (selectedMetrics.remaining / selectedMetrics.target) * 100 : 0} />
                <p className="small">Remaining: {selectedMetrics.remaining.toLocaleString()}</p>
              </div>
              <div className="col-4">
                <h4>Progress</h4>
                <PieChart percent={selectedMetrics.progressPct} />
              </div>
              {timeline.length > 0 && (
                <div className="col-12">
                  <h4>Progress Timeline</h4>
                  <GroupedBarChart groups={timeline.map((t) => ({ label: t.date, target: t.cumulative, achieved: 0 }))} />
                </div>
              )}
              {(divisionAvg || programAvg) && (
                <div className="col-12">
                  <h4>Comparison</h4>
                  <GroupedBarChart
                    groups={[
                      { label: "This PU", target: selectedMetrics.target, achieved: selectedMetrics.achieved },
                      divisionAvg && { label: "Division avg", target: divisionAvg.target, achieved: divisionAvg.achieved },
                      programAvg && { label: "Program avg", target: programAvg.target, achieved: programAvg.achieved },
                    ].filter(Boolean)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
