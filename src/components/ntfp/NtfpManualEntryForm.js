"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createNtfpManualActivity,
  createNtfpProgressRecord,
  getNtfpGroups,
  getNtfpLeafActivities,
  upsertNtfpProgress,
} from "@/lib/ntfp/records";
import { computeActivityMetrics, statusLabel } from "@/lib/ntfp/metrics";

const EMPTY_PROGRESS = {
  valueChainId: "",
  actionItemId: "",
  date: new Date().toISOString().slice(0, 10),
  completedQuantity: "",
  manualProgressPercent: "",
  status: "in_progress",
  actualExpenditurePKR: "",
  locationText: "",
  remarks: "",
};

const EMPTY_ACTIVITY = {
  valueChainId: "",
  parentActionCode: "",
  actionTitle: "",
  unit: "",
  targetQuantity: "",
  unitCostPKR: "",
  plannedBudgetPKR: "",
};

function recordToForm(record) {
  return {
    valueChainId: record.valueChainId || "",
    actionItemId: record.actionItemId || "",
    date: record.date || new Date().toISOString().slice(0, 10),
    completedQuantity: record.completedQuantity ?? "",
    manualProgressPercent: record.manualProgressPercent ?? "",
    status: record.status || "in_progress",
    actualExpenditurePKR: record.actualExpenditurePKR ?? "",
    locationText: record.locationText || "",
    remarks: record.remarks || "",
  };
}

export default function NtfpManualEntryForm({
  data,
  setData,
  editingRecord = null,
  createdBy = "User",
  onSuccess,
  onCancel,
}) {
  const [form, setForm] = useState(EMPTY_PROGRESS);
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY);
  const [showActivity, setShowActivity] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editingRecord) {
      setForm(recordToForm(editingRecord));
      setShowActivity(false);
      setMessage("");
    } else {
      setForm({ ...EMPTY_PROGRESS, date: new Date().toISOString().slice(0, 10) });
    }
  }, [editingRecord]);

  const activities = useMemo(
    () => getNtfpLeafActivities(data.ntfpActionItems, form.valueChainId),
    [data.ntfpActionItems, form.valueChainId]
  );
  const groups = useMemo(
    () => getNtfpGroups(data.ntfpActionItems, activityForm.valueChainId || form.valueChainId),
    [data.ntfpActionItems, activityForm.valueChainId, form.valueChainId]
  );
  const selectedItem = activities.find((item) => item.id === form.actionItemId);
  const currentMetrics = selectedItem
    ? computeActivityMetrics(selectedItem, data.ntfpProgressRecords)
    : null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.valueChainId) {
      setMessage("Select a value chain.");
      return;
    }
    if (!form.actionItemId) {
      setMessage("Select an activity.");
      return;
    }
    if (!form.date) {
      setMessage("Enter a date.");
      return;
    }
    if (form.completedQuantity === "" && form.manualProgressPercent === "") {
      setMessage("Enter completed quantity or a progress percent.");
      return;
    }
    const record = createNtfpProgressRecord(form, {
      chainId: form.valueChainId,
      actionItem: selectedItem,
      previous: editingRecord,
      createdBy,
    });
    setData(upsertNtfpProgress(data, record));
    setMessage(editingRecord ? "NTFP progress updated." : "NTFP progress saved.");
    if (!editingRecord) {
      setForm((prev) => ({
        ...EMPTY_PROGRESS,
        valueChainId: prev.valueChainId,
        date: new Date().toISOString().slice(0, 10),
      }));
    }
    onSuccess?.();
  }

  function handleAddActivity(e) {
    e.preventDefault();
    const valueChainId = activityForm.valueChainId || form.valueChainId;
    if (!valueChainId) {
      setMessage("Select a value chain before adding an activity.");
      return;
    }
    if (!activityForm.actionTitle.trim()) {
      setMessage("Enter an activity title.");
      return;
    }
    const result = createNtfpManualActivity(
      data,
      { ...activityForm, valueChainId },
      createdBy
    );
    setData(result.data);
    setForm((prev) => ({
      ...prev,
      valueChainId,
      actionItemId: result.activity.id,
    }));
    setActivityForm(EMPTY_ACTIVITY);
    setShowActivity(false);
    setMessage("Activity added. You can now record progress against it.");
  }

  return (
    <div className="manual-entry-form">
      {editingRecord ? (
        <p className="small muted">Editing a submitted NTFP progress record.</p>
      ) : null}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Value Chain *</label>
            <select
              value={form.valueChainId}
              onChange={(e) =>
                setForm({ ...form, valueChainId: e.target.value, actionItemId: "" })
              }
              required
            >
              <option value="">Select value chain</option>
              {(data.ntfpValueChains || []).map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Activity *</label>
            <select
              value={form.actionItemId}
              onChange={(e) => setForm({ ...form, actionItemId: e.target.value })}
              required
              disabled={!form.valueChainId}
            >
              <option value="">Select activity</option>
              {activities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.actionCode} — {item.actionTitle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <div>
            <label>Completed quantity</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.completedQuantity}
              onChange={(e) => setForm({ ...form, completedQuantity: e.target.value })}
            />
          </div>
          <div>
            <label>Progress percent</label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={form.manualProgressPercent}
              onChange={(e) => setForm({ ...form, manualProgressPercent: e.target.value })}
            />
          </div>
          <div>
            <label>Expenditure (PKR)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.actualExpenditurePKR}
              onChange={(e) => setForm({ ...form, actualExpenditurePKR: e.target.value })}
            />
          </div>
          <div>
            <label>Location</label>
            <input
              value={form.locationText}
              onChange={(e) => setForm({ ...form, locationText: e.target.value })}
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
        {currentMetrics ? (
          <p className="small">
            Current: {currentMetrics.achieved} completed · {statusLabel(currentMetrics.status)} ·{" "}
            {currentMetrics.physicalProgressPercent.toFixed(1)}% physical
            {selectedItem?.unit ? ` · Unit ${selectedItem.unit}` : ""}
          </p>
        ) : null}
        <div className="form-actions-row">
          <button type="submit">{editingRecord ? "Update Progress" : "Save Progress"}</button>
          {editingRecord ? (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {!editingRecord ? (
        <div className="manual-extra-block">
          {showActivity ? (
            <form onSubmit={handleAddActivity}>
              <h4>Add activity</h4>
              <p className="small muted">
                Use this when the activity is not in the imported Action Plan.
              </p>
              <div className="form-grid">
                <div>
                  <label>Value Chain *</label>
                  <select
                    value={activityForm.valueChainId || form.valueChainId}
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        valueChainId: e.target.value,
                        parentActionCode: "",
                      })
                    }
                    required
                  >
                    <option value="">Select value chain</option>
                    {(data.ntfpValueChains || []).map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Main action</label>
                  <select
                    value={activityForm.parentActionCode}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, parentActionCode: e.target.value })
                    }
                  >
                    <option value="">Manual entries</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.actionCode}>
                        {group.actionCode}. {group.actionTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label>Activity title *</label>
                  <input
                    value={activityForm.actionTitle}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, actionTitle: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label>Unit</label>
                  <input
                    value={activityForm.unit}
                    onChange={(e) => setActivityForm({ ...activityForm, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label>Target quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={activityForm.targetQuantity}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, targetQuantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Unit cost (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={activityForm.unitCostPKR}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, unitCostPKR: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Planned budget (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={activityForm.plannedBudgetPKR}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, plannedBudgetPKR: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-actions-row">
                <button type="submit">Add Activity</button>
                <button type="button" className="btn-secondary" onClick={() => setShowActivity(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn-secondary" onClick={() => setShowActivity(true)}>
              Add activity not in the Action Plan
            </button>
          )}
        </div>
      ) : null}

      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
