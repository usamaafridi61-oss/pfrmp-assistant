"use client";

import { useEffect, useMemo, useState } from "react";
import { applyManualEntry, createManualEntry } from "@/lib/storage";
import { getEffectivePuIntervention } from "@/lib/metrics";

const EMPTY = {
  divisionId: "",
  planningUnitId: "",
  interventionId: "",
  entryType: "progress",
  date: new Date().toISOString().slice(0, 10),
  targetValue: "",
  achievedValue: "",
  balanceValue: "",
  maleBeneficiaries: "",
  femaleBeneficiaries: "",
  remarks: "",
};

function entryToForm(entry) {
  return {
    divisionId: entry.divisionId || "",
    planningUnitId: entry.planningUnitId || "",
    interventionId: entry.interventionId || "",
    entryType: entry.entryType || "progress",
    date: entry.date || new Date().toISOString().slice(0, 10),
    targetValue: entry.targetValue ?? "",
    achievedValue: entry.achievedValue ?? "",
    balanceValue: entry.balanceValue ?? "",
    maleBeneficiaries: entry.maleBeneficiaries ?? "",
    femaleBeneficiaries: entry.femaleBeneficiaries ?? "",
    remarks: entry.remarks || "",
  };
}

export default function ManualEntryForm({
  data,
  setData,
  defaults = {},
  editingEntry = null,
  createdBy = "User",
  onSuccess,
  onCancel,
}) {
  const [form, setForm] = useState({ ...EMPTY, ...defaults });
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editingEntry) {
      setForm(entryToForm(editingEntry));
      setConfirmOverride(false);
      setMessage("");
    } else {
      setForm({ ...EMPTY, ...defaults, date: new Date().toISOString().slice(0, 10) });
    }
  }, [editingEntry]);

  const pusInDivision = useMemo(
    () => data.planningUnits.filter((p) => p.divisionId === form.divisionId),
    [data.planningUnits, form.divisionId]
  );

  const currentMetrics = useMemo(() => {
    if (!form.planningUnitId || !form.interventionId) return null;
    return getEffectivePuIntervention(data, form.planningUnitId, form.interventionId);
  }, [data, form.planningUnitId, form.interventionId]);

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "divisionId") next.planningUnitId = "";
      if (field === "targetValue" || field === "achievedValue") {
        const t = Number(field === "targetValue" ? value : prev.targetValue) || 0;
        const a = Number(field === "achievedValue" ? value : prev.achievedValue) || 0;
        next.balanceValue = Math.max(t - a, 0);
      }
      return next;
    });
  }

  function validate() {
    if (!form.divisionId) return "Select a forest division.";
    if (!form.planningUnitId) return "Select a planning unit.";
    if (!form.interventionId) return "Select an intervention.";
    if (!form.date) return "Enter a date.";
    const nums = ["targetValue", "achievedValue", "balanceValue", "maleBeneficiaries", "femaleBeneficiaries"];
    for (const key of nums) {
      if (form[key] !== "" && Number(form[key]) < 0) return "Numeric values cannot be negative.";
    }
    if (form.entryType === "target" && !form.targetValue) return "Target value is required.";
    if (form.entryType === "progress" && !form.achievedValue) return "Achieved value is required.";
    if (form.entryType === "correction" && !form.targetValue && !form.achievedValue) {
      return "Correction requires target or achieved value.";
    }
    const target = Number(form.targetValue) || currentMetrics?.target || 0;
    const achieved = Number(form.achievedValue) || 0;
    if (achieved > target && target > 0 && !confirmOverride) {
      return "Achieved exceeds target — check override to confirm.";
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }
    const entry = createManualEntry(
      { ...form, createdBy: editingEntry?.createdBy || createdBy },
      editingEntry
    );
    setData(applyManualEntry(data, entry));
    setMessage(editingEntry ? "Manual entry updated." : "Manual entry saved.");
    setConfirmOverride(false);
    if (!editingEntry) {
      setForm({ ...EMPTY, ...defaults, date: new Date().toISOString().slice(0, 10) });
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="manual-entry-form">
      {editingEntry ? (
        <p className="small muted">Editing a submitted entry. Save to replace the stored values.</p>
      ) : null}
      <div className="form-grid">
        <div>
          <label>Forest Division *</label>
          <select value={form.divisionId} onChange={(e) => updateField("divisionId", e.target.value)} required>
            <option value="">Select division</option>
            {data.divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Planning Unit *</label>
          <select value={form.planningUnitId} onChange={(e) => updateField("planningUnitId", e.target.value)} required disabled={!form.divisionId}>
            <option value="">Select planning unit</option>
            {pusInDivision.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Intervention *</label>
          <select value={form.interventionId} onChange={(e) => updateField("interventionId", e.target.value)} required>
            <option value="">Select intervention</option>
            {data.interventionsMaster.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Entry Type *</label>
          <select value={form.entryType} onChange={(e) => updateField("entryType", e.target.value)}>
            <option value="target">Target</option>
            <option value="progress">Progress</option>
            <option value="correction">Correction</option>
          </select>
        </div>
        <div>
          <label>Date *</label>
          <input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} required />
        </div>
        {(form.entryType === "target" || form.entryType === "correction") && (
          <div>
            <label>Target value {form.entryType !== "progress" ? "*" : ""}</label>
            <input type="number" min="0" step="any" value={form.targetValue} onChange={(e) => updateField("targetValue", e.target.value)} />
          </div>
        )}
        {(form.entryType === "progress" || form.entryType === "correction") && (
          <div>
            <label>Achieved value {form.entryType !== "target" ? "*" : ""}</label>
            <input type="number" min="0" step="any" value={form.achievedValue} onChange={(e) => updateField("achievedValue", e.target.value)} />
          </div>
        )}
        <div>
          <label>Balance (auto-calculated)</label>
          <input type="number" min="0" step="any" value={form.balanceValue} onChange={(e) => updateField("balanceValue", e.target.value)} />
        </div>
        <div>
          <label>Male beneficiaries</label>
          <input type="number" min="0" step="1" value={form.maleBeneficiaries} onChange={(e) => updateField("maleBeneficiaries", e.target.value)} />
        </div>
        <div>
          <label>Female beneficiaries</label>
          <input type="number" min="0" step="1" value={form.femaleBeneficiaries} onChange={(e) => updateField("femaleBeneficiaries", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label>Remarks</label>
          <textarea value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} rows={2} />
        </div>
      </div>
      {currentMetrics && (
        <p className="small">
          Current effective: Target {currentMetrics.target} | Achieved {currentMetrics.achieved} | Remaining {currentMetrics.remaining}
        </p>
      )}
      <label className="checkbox-row">
        <input type="checkbox" checked={confirmOverride} onChange={(e) => setConfirmOverride(e.target.checked)} />
        Confirm override when achieved exceeds target
      </label>
      <div className="form-actions-row">
        <button type="submit">{editingEntry ? "Update Entry" : "Save Manual Entry"}</button>
        {editingEntry ? (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
}
