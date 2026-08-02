"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useData } from "@/context/DataContext";
import { getGuidanceForIntervention, getImplementationGuidance } from "@/lib/guidance";
import { getInterventionPuRows, getInterventionSummaries, getPuInterventionRows } from "@/lib/metrics";

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

export default function ReportsPage() {
  const { data } = useData();
  const [reportType, setReportType] = useState("intervention");
  const [selectedPu, setSelectedPu] = useState("");
  const [selectedIntv, setSelectedIntv] = useState("");
  const [selectedDiv, setSelectedDiv] = useState("");

  const puReportPu = data.planningUnits.find((p) => p.id === selectedPu);

  function exportInterventionCsv() {
    const rows = getInterventionSummaries(data, {}).map((s) => ({
      intervention: s.name,
      target: s.target,
      achieved: s.achieved,
      remaining: s.remaining,
      progress_pct: Math.round(s.progressPct),
      pus_covered: s.puCovered,
    }));
    downloadCsv("intervention-report.csv", rows);
  }

  function exportInterventionExcel() {
    const summary = getInterventionSummaries(data, {}).map((s) => ({
      Intervention: s.name,
      Target: s.target,
      Achieved: s.achieved,
      Remaining: s.remaining,
      "Progress %": Math.round(s.progressPct),
      "PUs Covered": s.puCovered,
    }));
    downloadExcel("intervention-report.xlsx", [{ name: "Summary", rows: summary }]);
  }

  function exportPuCsv() {
    if (!selectedPu) return;
    const rows = getPuInterventionRows(data, selectedPu).map((r) => ({
      planning_unit: puReportPu?.name,
      intervention: r.name,
      target: r.target,
      achieved: r.achieved,
      remaining: r.remaining,
      progress_pct: Math.round(r.progressPct),
    }));
    downloadCsv(`pu-report-${selectedPu}.csv`, rows);
  }

  function exportPuExcel() {
    if (!selectedPu || !puReportPu) return;
    const lu = puReportPu.landUse || {};
    const general = [{
      "PU Name": puReportPu.name,
      Region: puReportPu.region,
      Division: puReportPu.divisionName,
      "Area (Ha)": puReportPu.areaHa,
      Households: puReportPu.totalHouseholds,
      Population: puReportPu.population,
      "Existing Intervention Area": puReportPu.existingInterventionAreaHa,
    }];
    const landUse = [
      { Category: "Agriculture", "Area (Ha)": lu.agricultureHa },
      { Category: "Water body", "Area (Ha)": lu.waterBodyHa },
      { Category: "Settlement", "Area (Ha)": lu.settlementHa },
      { Category: "Forest", "Area (Ha)": lu.forestHa },
      { Category: "Grass land", "Area (Ha)": lu.grasslandHa },
      { Category: "Barren land", "Area (Ha)": lu.barrenLandHa },
      { Category: "Total", "Area (Ha)": lu.totalHa },
    ];
    const interventions = getPuInterventionRows(data, selectedPu).map((r) => ({
      Intervention: r.name,
      Target: r.target,
      Achieved: r.achieved,
      Remaining: r.remaining,
      "Progress %": Math.round(r.progressPct),
    }));
    const manual = data.manualEntries
      .filter((m) => m.planningUnitId === selectedPu)
      .map((m) => ({
        Date: m.date,
        Type: m.entryType,
        Target: m.targetValue,
        Achieved: m.achievedValue,
        Remarks: m.remarks,
      }));
    downloadExcel(`pu-report-${puReportPu.name}.xlsx`, [
      { name: "General Info", rows: general },
      { name: "Land Use", rows: landUse },
      { name: "Interventions", rows: interventions },
      { name: "Manual Entries", rows: manual },
    ]);
  }

  function exportDivisionExcel() {
    if (!selectedDiv) return;
    const div = data.divisions.find((d) => d.id === selectedDiv);
    const pus = data.planningUnits.filter((p) => p.divisionId === selectedDiv);
    const puRows = pus.map((pu) => {
      const rows = getPuInterventionRows(data, pu.id);
      const target = rows.reduce((a, r) => a + r.target, 0);
      const achieved = rows.reduce((a, r) => a + r.achieved, 0);
      return {
        "Planning Unit": pu.name,
        Target: target,
        Achieved: achieved,
        Remaining: Math.max(target - achieved, 0),
        "Progress %": target > 0 ? Math.round((achieved / target) * 100) : 0,
      };
    });
    const manual = data.manualEntries
      .filter((m) => m.divisionId === selectedDiv)
      .map((m) => ({
        Date: m.date,
        Type: m.entryType,
        PU: data.planningUnits.find((p) => p.id === m.planningUnitId)?.name,
        Remarks: m.remarks,
      }));
    downloadExcel(`division-report-${div?.name || selectedDiv}.xlsx`, [
      { name: "Planning Units", rows: puRows },
      { name: "Manual Updates", rows: manual },
    ]);
  }

  function exportInterventionDetailExcel() {
    if (!selectedIntv) return;
    const intv = data.interventionsMaster.find((i) => i.id === selectedIntv);
    const puRows = getInterventionPuRows(data, selectedIntv).map((r) => ({
      Region: r.region,
      Division: r.divisionName,
      "Planning Unit": r.planningUnitName,
      Target: r.target,
      Achieved: r.achieved,
      Remaining: r.remaining,
      "M-B": r.maleBeneficiaries,
      "F-B": r.femaleBeneficiaries,
      "Progress %": Math.round(r.progressPct),
    }));
    const guidance = getImplementationGuidance(selectedIntv, data)[0];
    const guidanceRows = guidance
      ? [{ Summary: guidance.summary, Objective: guidance.objective, Source: guidance.sourceDocumentTitle }]
      : getGuidanceForIntervention(selectedIntv, data.technicalGuidance, data.docs).map((g) => ({
          Title: g.title,
          Source: g.sourceDocumentTitle,
          Status: g.pending ? "Pending extraction" : "Available",
        }));
    downloadExcel(`intervention-detail-${intv?.id || selectedIntv}.xlsx`, [
      { name: "PU Breakdown", rows: puRows },
      { name: "Guidance", rows: guidanceRows },
    ]);
  }

  const interventionSummaries = useMemo(() => getInterventionSummaries(data, {}), [data]);

  return (
    <main className="container">
      <h1>Reports</h1>
      <p className="sub">Export planning unit profiles, intervention summaries, and division reports (CSV / Excel).</p>

      <section className="grid">
        <div className="card col-12">
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="intervention">Intervention Report</option>
            <option value="intervention_detail">Intervention Detail Report</option>
            <option value="planning_unit">Planning Unit Profile Report</option>
            <option value="division">Division Report</option>
          </select>
        </div>

        {reportType === "intervention" && (
          <div className="card col-12">
            <h3>Intervention Report</h3>
            <p className="small">Total target, achieved, remaining, and PU coverage for all interventions.</p>
            <div className="form-actions">
              <button type="button" onClick={exportInterventionCsv}>Export CSV</button>
              <button type="button" onClick={exportInterventionExcel}>Export Excel</button>
            </div>
            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr><th>Intervention</th><th>Target</th><th>Achieved</th><th>Remaining</th><th>Progress %</th><th>PUs</th></tr>
                </thead>
                <tbody>
                  {interventionSummaries.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.target.toLocaleString()}</td>
                      <td>{s.achieved.toLocaleString()}</td>
                      <td>{s.remaining.toLocaleString()}</td>
                      <td>{Math.round(s.progressPct)}%</td>
                      <td>{s.puCovered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === "intervention_detail" && (
          <div className="card col-12">
            <h3>Intervention Detail Report</h3>
            <label>Intervention</label>
            <select value={selectedIntv} onChange={(e) => setSelectedIntv(e.target.value)}>
              <option value="">Select intervention</option>
              {data.interventionsMaster.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <button type="button" onClick={exportInterventionDetailExcel} disabled={!selectedIntv}>Export Excel</button>
          </div>
        )}

        {reportType === "planning_unit" && (
          <div className="card col-12">
            <h3>Planning Unit Profile Report</h3>
            <label>Planning Unit</label>
            <select value={selectedPu} onChange={(e) => setSelectedPu(e.target.value)}>
              <option value="">Select planning unit</option>
              {data.planningUnits.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.divisionName})</option>
              ))}
            </select>
            <div className="form-actions">
              <button type="button" onClick={exportPuCsv} disabled={!selectedPu}>Export CSV</button>
              <button type="button" onClick={exportPuExcel} disabled={!selectedPu}>Export Excel</button>
            </div>
            {selectedPu && (
              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr><th>Intervention</th><th>Target</th><th>Achieved</th><th>Remaining</th><th>Progress %</th></tr>
                  </thead>
                  <tbody>
                    {getPuInterventionRows(data, selectedPu).map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.target.toLocaleString()}</td>
                        <td>{r.achieved.toLocaleString()}</td>
                        <td>{r.remaining.toLocaleString()}</td>
                        <td>{Math.round(r.progressPct)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {reportType === "division" && (
          <div className="card col-12">
            <h3>Division Report</h3>
            <label>Forest Division</label>
            <select value={selectedDiv} onChange={(e) => setSelectedDiv(e.target.value)}>
              <option value="">Select division</option>
              {data.divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button type="button" onClick={exportDivisionExcel} disabled={!selectedDiv}>Export Excel</button>
          </div>
        )}
      </section>
    </main>
  );
}
