"use client";

import { getUniqueRegions, getUniqueSnapshotDates } from "@/lib/metrics";

export default function Filters({ data, filters, onChange }) {
  const { divisions, planningUnits, interventionsMaster, progressUpdates } = data;
  const regions = getUniqueRegions(planningUnits);
  const snapshots = getUniqueSnapshotDates(progressUpdates);

  const divisionsInScope = divisions.filter((d) => {
    if (!filters.region || filters.region === "all") return true;
    if (d.region === filters.region) return true;
    return planningUnits.some((p) => p.divisionId === d.id && p.region === filters.region);
  });

  const planningUnitsInScope = planningUnits.filter((p) => {
    if (filters.region && filters.region !== "all" && p.region !== filters.region) return false;
    if (filters.divisionId && filters.divisionId !== "all" && p.divisionId !== filters.divisionId) return false;
    return true;
  });

  const activeCount = [
    filters.region !== "all" && filters.region,
    filters.divisionId !== "all" && filters.divisionId,
    filters.planningUnitId !== "all" && filters.planningUnitId,
    filters.interventionId !== "all" && filters.interventionId,
    filters.snapshotDate !== "all" && filters.snapshotDate,
    filters.status !== "all" && filters.status,
    filters.source !== "all" && filters.source,
    filters.search?.trim(),
  ].filter(Boolean).length;

  function resetAll() {
    onChange({
      region: "all",
      divisionId: "all",
      planningUnitId: "all",
      interventionId: "all",
      snapshotDate: "all",
      status: "all",
      source: "all",
      search: "",
    });
  }

  return (
    <div className="filters-container">
      <div className="filters-header-row">
        <span className="filters-title">
          Filter &amp; search
          {activeCount > 0 && (
            <span className="active-filter-badge">{activeCount} active</span>
          )}
        </span>
        {activeCount > 0 && (
          <button type="button" className="btn-reset-filters" onClick={resetAll}>
            Reset
          </button>
        )}
      </div>

      <div className="filters-grid">
        <div className="filter-item">
          <label>Region</label>
          <select
            value={filters.region || "all"}
            onChange={(e) =>
              onChange({
                ...filters,
                region: e.target.value,
                divisionId: "all",
                planningUnitId: "all",
              })
            }
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Forest Division</label>
          <select
            value={filters.divisionId || "all"}
            onChange={(e) => onChange({ ...filters, divisionId: e.target.value, planningUnitId: "all" })}
          >
            <option value="all">All Divisions</option>
            {divisionsInScope.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Planning Unit</label>
          <select value={filters.planningUnitId || "all"} onChange={(e) => onChange({ ...filters, planningUnitId: e.target.value })}>
            <option value="all">All Planning Units</option>
            {planningUnitsInScope.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Intervention</label>
          <select value={filters.interventionId || "all"} onChange={(e) => onChange({ ...filters, interventionId: e.target.value })}>
            <option value="all">All Interventions</option>
            {interventionsMaster.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Snapshot Date</label>
          <select value={filters.snapshotDate || "all"} onChange={(e) => onChange({ ...filters, snapshotDate: e.target.value })}>
            <option value="all">Latest Snapshot</option>
            {snapshots.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Status</label>
          <select value={filters.status || "all"} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="over_achieved">Over-achieved</option>
            <option value="no_target">No Target</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Source</label>
          <select value={filters.source || "all"} onChange={(e) => onChange({ ...filters, source: e.target.value })}>
            <option value="all">All Sources</option>
            <option value="workbook">Workbook</option>
            <option value="manual">Manual</option>
            <option value="correction">Correction</option>
          </select>
        </div>

        <div className="filter-item search-filter-item">
          <label>Search Keyword</label>
          <input
            type="search"
            placeholder="Search PU, division, intervention..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          />
        </div>
      </div>
    </div>
  );
}
