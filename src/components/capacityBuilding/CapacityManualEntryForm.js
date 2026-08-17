"use client";

import { useEffect, useMemo, useState } from "react";
import { getUniqueRegions } from "@/lib/metrics";
import {
  eventToForm,
  formToCapacityEvent,
  upsertCapacityEvent,
} from "@/lib/capacityBuilding/records";

const EMPTY = eventToForm();

export default function CapacityManualEntryForm({
  data,
  setData,
  editingEvent = null,
  createdBy = "User",
  onSuccess,
  onCancel,
}) {
  const [planItemId, setPlanItemId] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editingEvent) {
      const plan = data.capacityPlanItems.find((item) => item.id === editingEvent.planItemId);
      setPlanItemId(editingEvent.planItemId || "");
      setGroupCode(plan?.moduleGroupCode || "");
      setForm(eventToForm(editingEvent));
      setMessage("");
    } else {
      setPlanItemId("");
      setGroupCode("");
      setForm(eventToForm());
    }
  }, [editingEvent, data.capacityPlanItems]);

  const groups = useMemo(() => {
    const map = new Map();
    (data.capacityPlanItems || []).forEach((item) => {
      if (!map.has(item.moduleGroupCode)) {
        map.set(item.moduleGroupCode, item.moduleGroupName);
      }
    });
    return [...map.entries()].map(([code, name]) => ({ code, name }));
  }, [data.capacityPlanItems]);

  const activities = useMemo(() => {
    const items = data.capacityPlanItems || [];
    if (!groupCode) return items;
    return items.filter((item) => item.moduleGroupCode === groupCode);
  }, [data.capacityPlanItems, groupCode]);

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
    if (!planItemId) {
      setMessage("Select a capacity-building activity.");
      return;
    }
    if (!form.eventDateStart) {
      setMessage("Enter a start date.");
      return;
    }
    const event = formToCapacityEvent(form, {
      planItemId,
      previous: editingEvent,
      createdBy,
    });
    setData(upsertCapacityEvent(data, event));
    setMessage(editingEvent ? "Event updated." : "Event saved.");
    if (!editingEvent) {
      setForm(eventToForm({ status: form.status }));
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="manual-entry-form">
      {editingEvent ? (
        <p className="small muted">Editing a submitted capacity-building event.</p>
      ) : null}
      <div className="form-grid">
        <div>
          <label>Module group</label>
          <select
            value={groupCode}
            onChange={(e) => {
              setGroupCode(e.target.value);
              setPlanItemId("");
            }}
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group.code} value={group.code}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label>Activity *</label>
          <select value={planItemId} onChange={(e) => setPlanItemId(e.target.value)} required>
            <option value="">Select activity</option>
            {activities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.moduleCode} — {item.trainingSubject}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Event status *</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label>Start date *</label>
          <input
            type="date"
            value={form.eventDateStart}
            onChange={(e) => setForm({ ...form, eventDateStart: e.target.value })}
            required
          />
        </div>
        <div>
          <label>End date</label>
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
          <label>Forest division</label>
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
          <label>Planning unit</label>
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
          <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
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
          <label>Actual participants</label>
          <input
            type="number"
            min="0"
            value={form.actualParticipants}
            onChange={(e) => setForm({ ...form, actualParticipants: e.target.value })}
          />
        </div>
        <div>
          <label>Male participants</label>
          <input
            type="number"
            min="0"
            value={form.maleParticipants}
            onChange={(e) => setForm({ ...form, maleParticipants: e.target.value })}
          />
        </div>
        <div>
          <label>Female participants</label>
          <input
            type="number"
            min="0"
            value={form.femaleParticipants}
            onChange={(e) => setForm({ ...form, femaleParticipants: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label>Remarks</label>
          <textarea
            rows={2}
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </div>
      </div>
      <div className="form-actions-row">
        <button type="submit">{editingEvent ? "Update Event" : "Save Event"}</button>
        {editingEvent ? (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
