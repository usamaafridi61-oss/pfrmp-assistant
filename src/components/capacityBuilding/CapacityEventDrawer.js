"use client";

import { useEffect, useMemo, useState } from "react";
import { getUniqueRegions } from "@/lib/metrics";
import { statusLabel } from "@/lib/capacityBuilding/metrics";
import { useAuth } from "@/context/AuthContext";
import {
  deleteCapacityEvent,
  eventToForm,
  formToCapacityEvent,
  upsertCapacityEvent,
} from "@/lib/capacityBuilding/records";
import AdminEntryActions from "@/components/AdminEntryActions";

const EMPTY_FORM = eventToForm();

export default function CapacityEventDrawer({
  item,
  events = [],
  data,
  setData,
  mode = "record",
  editingEvent = null,
  onClose,
}) {
  const { isAdmin, user, canWrite } = useAuth();
  const createdBy = user?.displayName || user?.username || "User";
  const [editing, setEditing] = useState(editingEvent);
  const [form, setForm] = useState(editingEvent ? eventToForm(editingEvent) : EMPTY_FORM);
  const [view, setView] = useState(editingEvent ? "record" : mode);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEditing(editingEvent);
    setForm(editingEvent ? eventToForm(editingEvent) : eventToForm());
    setView(editingEvent ? "record" : mode);
  }, [editingEvent, mode, item?.id]);

  const regions = useMemo(() => getUniqueRegions(data.planningUnits || []), [data.planningUnits]);
  const divisions = useMemo(() => {
    const all = data.divisions || [];
    if (!form.regionId) return all;
    return all.filter((d) => d.region === form.regionId);
  }, [data.divisions, form.regionId]);
  const planningUnits = useMemo(() => {
    let pus = data.planningUnits || [];
    if (form.regionId) pus = pus.filter((p) => p.region === form.regionId);
    if (form.divisionId) pus = pus.filter((p) => p.divisionId === form.divisionId);
    return pus;
  }, [data.planningUnits, form.regionId, form.divisionId]);

  function handleSubmit(e) {
    e.preventDefault();
    const event = formToCapacityEvent(form, {
      planItemId: item.id,
      previous: editing,
      createdBy,
    });
    setData((prev) => upsertCapacityEvent(prev, event));
    setForm(eventToForm({ status: form.status }));
    setEditing(null);
    setMessage(editing ? "Event updated." : "Event saved.");
    setView("log");
  }

  const sortedEvents = [...events].sort((a, b) =>
    String(b.eventDateStart || "").localeCompare(String(a.eventDateStart || ""))
  );

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="progress-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="drawer-kicker">
              {view === "log" ? "Event Log" : editing ? "Edit Event" : "Record Event"}
            </p>
            <span className="activity-code-badge">{item.moduleCode}</span>
            <h3>{item.trainingSubject}</h3>
            <p className="small muted">{item.moduleGroupName}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="filter-pill-group" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className={`pill-btn ${view === "record" ? "active" : ""}`}
            onClick={() => setView("record")}
          >
            Record Event
          </button>
          <button
            type="button"
            className={`pill-btn ${view === "log" ? "active" : ""}`}
            onClick={() => setView("log")}
          >
            View Event Log ({events.length})
          </button>
        </div>

        {view === "log" ? (
          sortedEvents.length === 0 ? (
            <p className="small muted">No events recorded for this activity yet.</p>
          ) : (
            <div className="list">
              {sortedEvents.map((event) => (
                <div key={event.id} className="item">
                  <div className="item-header">
                    <strong>{event.eventDateStart}</strong>
                    <span className={`status-badge status-${event.status}`}>
                      {statusLabel(event.status)}
                    </span>
                  </div>
                  <p className="small muted">
                    {event.venue || "Venue not set"}
                    {event.actualParticipants
                      ? ` · ${event.actualParticipants} participants`
                      : ""}
                  </p>
                  {event.remarks ? <p className="small">{event.remarks}</p> : null}
                  <AdminEntryActions
                    isAdmin={isAdmin}
                    onEdit={() => {
                      setEditing(event);
                      setForm(eventToForm(event));
                      setView("record");
                    }}
                    onDelete={() => {
                      setData((prev) => deleteCapacityEvent(prev, event.id));
                      if (editing?.id === event.id) {
                        setEditing(null);
                        setForm(eventToForm());
                      }
                    }}
                    deleteLabel="this event"
                  />
                </div>
              ))}
            </div>
          )
        ) : !canWrite ? (
          <p className="small muted">This account can view the event log but cannot record events.</p>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-grid drawer-form-grid">
              <div>
                <label>Event Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="postponed">Postponed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label>Start Date</label>
                <input
                  type="date"
                  value={form.eventDateStart}
                  onChange={(e) => setForm({ ...form, eventDateStart: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>End Date</label>
                <input
                  type="date"
                  value={form.eventDateEnd}
                  onChange={(e) => setForm({ ...form, eventDateEnd: e.target.value })}
                />
              </div>
              <div>
                <label>Region</label>
                <select
                  value={form.regionId}
                  onChange={(e) =>
                    setForm({ ...form, regionId: e.target.value, divisionId: "", planningUnitId: "" })
                  }
                >
                  <option value="">—</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Forest Division</label>
                <select
                  value={form.divisionId}
                  onChange={(e) => setForm({ ...form, divisionId: e.target.value, planningUnitId: "" })}
                >
                  <option value="">—</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Planning Unit</label>
                <select
                  value={form.planningUnitId}
                  onChange={(e) => setForm({ ...form, planningUnitId: e.target.value })}
                >
                  <option value="">—</option>
                  {planningUnits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Venue</label>
                <input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              </div>
              <div>
                <label>Facilitator(s)</label>
                <input
                  value={form.facilitatorNames}
                  placeholder="Comma separated"
                  onChange={(e) => setForm({ ...form, facilitatorNames: e.target.value })}
                />
              </div>
              <div>
                <label>Actual Participants</label>
                <input
                  type="number"
                  min="0"
                  value={form.actualParticipants}
                  onChange={(e) => setForm({ ...form, actualParticipants: e.target.value })}
                />
              </div>
              <div>
                <label>Male Participants</label>
                <input
                  type="number"
                  min="0"
                  value={form.maleParticipants}
                  onChange={(e) => setForm({ ...form, maleParticipants: e.target.value })}
                />
              </div>
              <div>
                <label>Female Participants</label>
                <input
                  type="number"
                  min="0"
                  value={form.femaleParticipants}
                  onChange={(e) => setForm({ ...form, femaleParticipants: e.target.value })}
                />
              </div>
              <div>
                <label>Attendance Sheet</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setForm({ ...form, attendanceSheetName: e.target.files?.[0]?.name || "" })
                  }
                />
              </div>
              <div>
                <label>Event Report</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setForm({ ...form, eventReportName: e.target.files?.[0]?.name || "" })
                  }
                />
              </div>
              <div>
                <label>Photos</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setForm({
                      ...form,
                      photoNames: Array.from(e.target.files || [])
                        .map((f) => f.name)
                        .join(", "),
                    })
                  }
                />
              </div>
              <div>
                <label>Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              {editing ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditing(null);
                    setForm(eventToForm());
                    setView("log");
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
              <button type="submit" className="btn-primary">
                {editing ? "Update Event" : "Save Event"}
              </button>
            </div>
            {message ? <p className="form-message">{message}</p> : null}
          </form>
        )}
      </aside>
    </div>
  );
}
