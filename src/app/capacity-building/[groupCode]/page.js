"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "@/context/DataContext";
import CapacityActivityCard from "@/components/capacityBuilding/CapacityActivityCard";
import CapacityEventDrawer from "@/components/capacityBuilding/CapacityEventDrawer";
import ProgressBar from "@/components/ProgressBar";
import {
  getPlanItemMetrics,
  getPlanItemsForGroup,
  statusLabel,
} from "@/lib/capacityBuilding/metrics";

export default function CapacityGroupDetailPage() {
  const params = useParams();
  const groupCode = decodeURIComponent(params.groupCode);
  const { data, setData } = useData();
  const [view, setView] = useState("cards");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);

  const items = useMemo(() => getPlanItemsForGroup(data, groupCode), [data, groupCode]);
  const groupName = items[0]?.moduleGroupName || groupCode;
  const groupCodeLabel = items[0]?.moduleGroupCode || groupCode;

  const itemMetrics = useMemo(
    () => items.map((item) => ({ item, metrics: getPlanItemMetrics(data, item.id) })),
    [data, items]
  );

  const totals = useMemo(() => {
    return itemMetrics.reduce(
      (acc, row) => {
        acc.planned += row.item.plannedEvents || 0;
        acc.completed += row.metrics?.completedEvents || 0;
        acc.remaining += row.metrics?.remainingEvents || 0;
        acc.participants += row.item.plannedParticipants || 0;
        return acc;
      },
      { planned: 0, completed: 0, remaining: 0, participants: 0 }
    );
  }, [itemMetrics]);

  const progress = totals.planned ? (totals.completed / totals.planned) * 100 : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itemMetrics;
    return itemMetrics.filter(
      (row) =>
        row.item.moduleCode?.toLowerCase().includes(q) ||
        row.item.trainingSubject?.toLowerCase().includes(q) ||
        row.item.participantType?.toLowerCase().includes(q) ||
        row.item.placeLevel?.toLowerCase().includes(q)
    );
  }, [itemMetrics, search]);

  const drawerItem = drawer
    ? itemMetrics.find((row) => row.item.id === drawer.planItemId)
    : null;

  return (
    <main className="container ntfp-module">
      <div className="breadcrumb">
        <Link href="/capacity-building">Capacity Building</Link> / {groupCodeLabel}
      </div>

      <div className="page-header-banner">
        <div>
          <h1>{groupName}</h1>
          <p className="sub">
            {totals.planned} planned events · {totals.completed} completed · {totals.remaining} remaining
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/capacity-building/manual-entry" className="btn-secondary">
            Manual Entry
          </Link>
          <Link href="/capacity-building/events" className="btn-secondary">
            Events Register
          </Link>
        </div>
      </div>

      <section className="grid">
        <div className="card col-3 stat-card">
          <div className="stat-label">Planned Events</div>
          <p className="stat-value">{totals.planned}</p>
        </div>
        <div className="card col-3 stat-card stat-physical">
          <div className="stat-label">Completed</div>
          <p className="stat-value">{totals.completed}</p>
        </div>
        <div className="card col-3 stat-card">
          <div className="stat-label">Remaining</div>
          <p className="stat-value">{totals.remaining}</p>
        </div>
        <div className="card col-3 stat-card">
          <div className="stat-label">Progress</div>
          <p className="stat-value">{progress.toFixed(1)}%</p>
          <ProgressBar percent={progress} />
        </div>
      </section>

      <section className="grid">
        <div className="card col-12 card-header-row">
          <div>
            <h3>Activities ({filtered.length})</h3>
            <p className="small muted">
              Card view is the default. Use table view for a dense Excel-style register.
            </p>
          </div>
          <div className="capacity-toolbar">
            <input
              type="search"
              className="capacity-search"
              placeholder="Search training subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="filter-pill-group">
              <button
                type="button"
                className={`pill-btn ${view === "cards" ? "active" : ""}`}
                onClick={() => setView("cards")}
              >
                Card View
              </button>
              <button
                type="button"
                className={`pill-btn ${view === "table" ? "active" : ""}`}
                onClick={() => setView("table")}
              >
                Table View
              </button>
            </div>
          </div>
        </div>

        {view === "cards" ? (
          filtered.map(({ item, metrics }) => (
            <div key={item.id} className="col-6">
              <CapacityActivityCard
                item={item}
                metrics={metrics}
                onRecord={() => setDrawer({ planItemId: item.id, mode: "record" })}
                onViewLog={() => setDrawer({ planItemId: item.id, mode: "log" })}
              />
            </div>
          ))
        ) : (
          <div className="card col-12">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Module Code</th>
                    <th>Training Subject</th>
                    <th>Planned</th>
                    <th>Completed</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ item, metrics }) => (
                    <tr key={item.id}>
                      <td>{item.moduleCode}</td>
                      <td>{item.trainingSubject}</td>
                      <td>{item.plannedEvents}</td>
                      <td>{metrics?.completedEvents || 0}</td>
                      <td>{metrics?.remainingEvents || 0}</td>
                      <td>
                        <span className={`status-badge status-${metrics?.status || "not_started"}`}>
                          {statusLabel(metrics?.status || "not_started")}
                        </span>
                      </td>
                      <td>{(metrics?.progressPercent || 0).toFixed(1)}%</td>
                      <td>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setDrawer({ planItemId: item.id, mode: "record" })}
                        >
                          Record Event
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {drawerItem ? (
        <CapacityEventDrawer
          key={`${drawer.planItemId}-${drawer.mode}`}
          item={drawerItem.item}
          events={drawerItem.metrics?.events || []}
          data={data}
          setData={setData}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
        />
      ) : null}
    </main>
  );
}
