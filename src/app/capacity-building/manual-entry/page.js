"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import CapacityManualEntryForm from "@/components/capacityBuilding/CapacityManualEntryForm";
import AdminEntryActions from "@/components/AdminEntryActions";
import { deleteCapacityEvent } from "@/lib/capacityBuilding/records";
import { statusLabel } from "@/lib/capacityBuilding/metrics";

export default function CapacityManualEntryPage() {
  const { data, setData } = useData();
  const { canWrite, isAdmin, user } = useAuth();
  const [editingEvent, setEditingEvent] = useState(null);
  const createdBy = user?.displayName || user?.username || "User";

  const rows = useMemo(() => {
    return [...(data.capacityEvents || [])]
      .sort((a, b) => String(b.eventDateStart || "").localeCompare(String(a.eventDateStart || "")))
      .slice(0, 80)
      .map((event) => ({
        event,
        plan: data.capacityPlanItems.find((item) => item.id === event.planItemId),
      }));
  }, [data]);

  return (
    <main className="container">
      <div className="breadcrumb">
        <Link href="/capacity-building">Capacity Building</Link> / Manual Data Entry
      </div>

      <div className="page-header-banner">
        <div>
          <h1>Capacity Building Manual Entry</h1>
          <p className="sub">
            Record scheduled or completed events against the Global Capacity Building Plan.
            {isAdmin ? " Administrators can edit or delete a submitted event from the list below." : ""}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/capacity-building/events" className="btn-secondary">
            Events Register
          </Link>
        </div>
      </div>

      <section className="grid">
        {canWrite ? (
          <div className="card col-12">
            <h3>{editingEvent ? "Edit Event" : "New Event"}</h3>
            <CapacityManualEntryForm
              data={data}
              setData={setData}
              editingEvent={editingEvent}
              createdBy={createdBy}
              onSuccess={() => setEditingEvent(null)}
              onCancel={() => setEditingEvent(null)}
            />
          </div>
        ) : (
          <div className="card col-12">
            <p className="sub">This account can view submitted events but cannot add new ones.</p>
          </div>
        )}

        <div className="card col-12">
          <h3>Submitted Events</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Code</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th>Venue</th>
                  <th>Participants</th>
                  {isAdmin ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ event, plan }) => (
                  <tr key={event.id}>
                    <td>
                      {event.eventDateStart}
                      {event.eventDateEnd ? ` – ${event.eventDateEnd}` : ""}
                    </td>
                    <td>{plan?.moduleCode || "—"}</td>
                    <td>{plan?.trainingSubject || event.planItemId}</td>
                    <td>
                      <span className={`status-badge status-${event.status}`}>
                        {statusLabel(event.status)}
                      </span>
                    </td>
                    <td>{event.venue || "—"}</td>
                    <td>{event.actualParticipants ?? "—"}</td>
                    {isAdmin ? (
                      <td>
                        <AdminEntryActions
                          isAdmin={isAdmin}
                          onEdit={() => {
                            setEditingEvent(event);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          onDelete={() => {
                            setData(deleteCapacityEvent(data, event.id));
                            if (editingEvent?.id === event.id) setEditingEvent(null);
                          }}
                          deleteLabel="this capacity-building event"
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="small">No events recorded yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
