"use client";

import { getUniqueRegions, getUniqueSnapshotDates } from "@/lib/metrics";

export default function Filters({ data, filters, onChange }) {
  const { divisions, planningUnits, interventionsMaster, progressUpdates } = data;
  const regions = getUniqueRegions(planningUnits);
  const snapshots = getUniqueSnapshotDates(progressUpdates);

  const planningUnitsInScope = planningUnits.filter((p) => {
    if (filters.region && filters.region !== "all" && p.region !== filters.region) return false;
    if (filters.divisionId && filters.divisionId !== "all" && p.divisionId !== filters.divisionId) return false;
    return true;
  });

  return (
    <div className="filters-grid">
      <div>
        <label>Region</label>
        <select value={filters.region || "all"} onChange={(e) => onChange({ ...filters, region: e.target.value })}>
          <option value="all">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Forest Division</label>
        <select value={filters.divisionId || "all"} onChange={(e) => onChange({ ...filters, divisionId: e.target.value, planningUnitId: "all" })}>
          <option value="all">All Divisions</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Planning Unit</label>
        <select value={filters.planningUnitId || "all"} onChange={(e) => onChange({ ...filters, planningUnitId: e.target.value })}>
          <option value="all">All Planning Units</option>
          {planningUnitsInScope.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Intervention</label>
        <select value={filters.interventionId || "all"} onChange={(e) => onChange({ ...filters, interventionId: e.target.value })}>
          <option value="all">All Interventions</option>
          {interventionsMaster.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Snapshot Date</label>
        <select value={filters.snapshotDate || "all"} onChange={(e) => onChange({ ...filters, snapshotDate: e.target.value })}>
          <option value="all">Latest</option>
          {snapshots.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Progress Status</label>
        <select value={filters.status || "all"} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
          <option value="all">All</option>
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="over_achieved">Over-achieved</option>
          <option value="no_target">No target</option>
        </select>
      </div>
      <div>
        <label>Source</label>
        <select value={filters.source || "all"} onChange={(e) => onChange({ ...filters, source: e.target.value })}>
          <option value="all">All</option>
          <option value="workbook">Workbook</option>
          <option value="manual">Manual</option>
          <option value="correction">Correction</option>
        </select>
      </div>
      <div>
        <label>Search</label>
        <input
          type="search"
          placeholder="PU, division, intervention…"
          value={filters.search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      </div>
    </div>
  );
}
