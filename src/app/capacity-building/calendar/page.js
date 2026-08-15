"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { statusLabel } from "@/lib/capacityBuilding/metrics";

function monthKey(dateStr) {
  if (!dateStr) return "unscheduled";
  return String(dateStr).slice(0, 7);
}

function monthLabel(key) {
  if (key === "unscheduled") return "Not Yet Scheduled";
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export default function CapacityCalendarPage() {
  const { data } = useData();
  const [view, setView] = useState("month");

  const events = useMemo(() => {
    return [...(data.capacityEvents || [])]
      .map((event) => {
        const plan = data.capacityPlanItems.find((p) => p.id === event.planItemId);
        const today = new Date().toISOString().slice(0, 10);
        const delayed =
          (event.status === "scheduled" || event.status === "planned") &&
          event.eventDateStart &&
          event.eventDateStart < today;
        return { ...event, plan, delayed };
      })
      .sort((a, b) => String(a.eventDateStart || "9999").localeCompare(String(b.eventDateStart || "9999")));
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = monthKey(event.eventDateStart);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return [...map.entries()];
  }, [events]);

  const weekEvents = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    return events.filter(
      (e) => e.eventDateStart && e.eventDateStart >= startStr && e.eventDateStart < endStr
    );
  }, [events]);

  const visible = view === "week" ? [["This week", weekEvents]] : grouped;

  return (
    <main className="container ntfp-module">
      <div className="breadcrumb">
        <Link href="/capacity-building">Capacity Building</Link> / Calendar
      </div>

      <div className="page-header-banner">
        <div>
          <h1>Capacity Building Calendar</h1>
          <p className="sub">
            Scheduled, completed and postponed events from the Global Capacity Building Plan.
          </p>
        </div>
        <div className="filter-pill-group">
          <button
            type="button"
            className={`pill-btn ${view === "month" ? "active" : ""}`}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            type="button"
            className={`pill-btn ${view === "week" ? "active" : ""}`}
            onClick={() => setView("week")}
          >
            Week
          </button>
          <button
            type="button"
            className={`pill-btn ${view === "agenda" ? "active" : ""}`}
            onClick={() => setView("agenda")}
          >
            Agenda
          </button>
        </div>
      </div>

      <section className="grid">
        <div className="card col-12">
          {events.length === 0 ? (
            <p className="sub">No events recorded yet.</p>
          ) : view === "agenda" ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Status</th>
                    <th>Venue</th>
                    <th>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        {event.eventDateStart}
                        {event.eventDateEnd ? ` – ${event.eventDateEnd}` : ""}
                      </td>
                      <td>{event.plan?.trainingSubject || event.planItemId}</td>
                      <td>
                        <span
                          className={`status-badge status-${event.delayed ? "delayed" : event.status}`}
                        >
                          {event.delayed ? "Delayed" : statusLabel(event.status)}
                        </span>
                      </td>
                      <td>{event.venue || "—"}</td>
                      <td>{event.actualParticipants ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            visible.map(([key, monthEvents]) => (
              <div key={key} className="capacity-month-block">
                <h3>{typeof key === "string" && key.includes("-") ? monthLabel(key) : key}</h3>
                {monthEvents.length === 0 ? (
                  <p className="small muted">No events in this period.</p>
                ) : (
                  <div className="list">
                    {monthEvents.map((event) => (
                      <div key={event.id} className="item">
                        <div className="item-header">
                          <strong>
                            {event.eventDateStart} · {event.plan?.moduleCode || "Activity"}
                          </strong>
                          <span
                            className={`status-badge status-${event.delayed ? "delayed" : event.status}`}
                          >
                            {event.delayed ? "Delayed" : statusLabel(event.status)}
                          </span>
                        </div>
                        <p className="small">
                          {event.plan?.trainingSubject || event.planItemId}
                        </p>
                        <p className="small muted">
                          {event.venue || "Venue not set"}
                          {event.actualParticipants
                            ? ` · ${event.actualParticipants} participants`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
