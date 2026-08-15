"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import CapacityEventDrawer from "@/components/capacityBuilding/CapacityEventDrawer";
import { getPlanItemMetrics, statusLabel } from "@/lib/capacityBuilding/metrics";

export default function CapacityEventPage() {
  const { data, setData } = useData();
  const [drawer, setDrawer] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    return [...(data.capacityEvents || [])]
      .map((event) => {
        const plan = data.capacityPlanItems.find((p) => p.id === event.planItemId);
        return { ...event, plan };
      })
      .sort((a, b) => String(b.eventDateStart || "").localeCompare(String(a.eventDateStart || "")));
  }, [data]);

  const filtered = statusFilter === "all" ? rows : rows.filter((e) => e.status === statusFilter);
  const drawerMetrics = drawer ? getPlanItemMetrics(data, drawer.id) : null;

  return (
    <main className="container ntfp-module">
      <div className="breadcrumb">
        <Link href="/capacity-building">Capacity Building</Link> / Events Register
      </div>

      <div className="page-header-banner">
        <div>
          <h1>Events Register</h1>
          <p className="sub">
            Completed, scheduled and postponed event records against the Capacity Building Plan.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/capacity-building" className="btn-secondary">
            Back to Groups
          </Link>
        </div>
      </div>

      <section className="grid">
        <div className="card col-12 card-header-row">
          <h3>Recorded Events ({filtered.length})</h3>
          <div className="filter-pill-group">
            {["all", "completed", "scheduled", "postponed", "cancelled"].map((status) => (
              <button
                key={status}
                type="button"
                className={`pill-btn ${statusFilter === status ? "active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" ? "All" : statusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="card col-12">
          {filtered.length === 0 ? (
            <p className="sub">
              No events recorded yet. Open a capacity activity and use Record Event to add the first
              one.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Code</th>
                    <th>Activity</th>
                    <th>Status</th>
                    <th>Venue</th>
                    <th>Participants</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id}>
                      <td>
                        {event.eventDateStart}
                        {event.eventDateEnd ? ` – ${event.eventDateEnd}` : ""}
                      </td>
                      <td>{event.plan?.moduleCode || "—"}</td>
                      <td>{event.plan?.trainingSubject || event.planItemId}</td>
                      <td>
                        <span className={`status-badge status-${event.status}`}>
                          {statusLabel(event.status)}
                        </span>
                      </td>
                      <td>{event.venue || "—"}</td>
                      <td>{event.actualParticipants ?? "—"}</td>
                      <td>
                        {event.plan ? (
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setDrawer(event.plan)}
                          >
                            Add another
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card col-12">
          <h3>Record a new event</h3>
          <p className="small muted">
            Choose an activity from the plan, then complete the event form in the side drawer.
          </p>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="col-span-2">
              <label>Capacity Building Activity</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const item = data.capacityPlanItems.find((p) => p.id === e.target.value);
                  if (item) setDrawer(item);
                  e.target.value = "";
                }}
              >
                <option value="">Select activity to record…</option>
                {data.capacityPlanItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.moduleCode} — {item.trainingSubject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {drawer && drawerMetrics ? (
        <CapacityEventDrawer
          key={drawer.id}
          item={drawer}
          events={drawerMetrics.events || []}
          data={data}
          setData={setData}
          mode="record"
          onClose={() => setDrawer(null)}
        />
      ) : null}
    </main>
  );
}
