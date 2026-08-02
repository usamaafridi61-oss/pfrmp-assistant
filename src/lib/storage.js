export const DEFAULT_DATA = {
  divisions: [],
  planningUnits: [],
  interventionsMaster: [],
  targets: [],
  progressUpdates: [],
  manualEntries: [],
  docs: [],
  technicalGuidance: [],
  interventionImplementationGuidance: [],
};

export function normalizeData(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_DATA };
  }
  return {
    divisions: Array.isArray(raw.divisions) ? raw.divisions : [],
    planningUnits: Array.isArray(raw.planningUnits) ? raw.planningUnits : [],
    interventionsMaster: Array.isArray(raw.interventionsMaster) ? raw.interventionsMaster : [],
    targets: Array.isArray(raw.targets) ? raw.targets : [],
    progressUpdates: Array.isArray(raw.progressUpdates) ? raw.progressUpdates : [],
    manualEntries: Array.isArray(raw.manualEntries) ? raw.manualEntries : [],
    docs: Array.isArray(raw.docs) ? raw.docs : [],
    technicalGuidance: Array.isArray(raw.technicalGuidance) ? raw.technicalGuidance : [],
    interventionImplementationGuidance: Array.isArray(raw.interventionImplementationGuidance)
      ? raw.interventionImplementationGuidance
      : [],
  };
}

export async function loadData() {
  if (typeof window === "undefined") return DEFAULT_DATA;

  try {
    const res = await fetch("/api/data");
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return normalizeData(data);
  } catch (e) {
    console.error("loadData error:", e);
    return DEFAULT_DATA;
  }
}

export async function saveData(payload) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("saveData error:", e);
  }
}

export function createManualEntry(form, previousEntry = null) {
  const now = new Date().toISOString();
  return {
    id: previousEntry?.id || crypto.randomUUID(),
    planningUnitId: form.planningUnitId,
    divisionId: form.divisionId,
    interventionId: form.interventionId,
    entryType: form.entryType,
    date: form.date,
    targetValue: form.targetValue != null ? Number(form.targetValue) : undefined,
    achievedValue: form.achievedValue != null ? Number(form.achievedValue) : undefined,
    balanceValue: form.balanceValue != null ? Number(form.balanceValue) : undefined,
    maleBeneficiaries: form.maleBeneficiaries != null ? Number(form.maleBeneficiaries) : undefined,
    femaleBeneficiaries: form.femaleBeneficiaries != null ? Number(form.femaleBeneficiaries) : undefined,
    remarks: form.remarks || "",
    attachmentIds: form.attachmentIds || [],
    createdAt: previousEntry?.createdAt || now,
    updatedAt: now,
    createdBy: form.createdBy || "User",
    previousValue: previousEntry
      ? {
          targetValue: previousEntry.targetValue,
          achievedValue: previousEntry.achievedValue,
          balanceValue: previousEntry.balanceValue,
        }
      : undefined,
  };
}

export function applyManualEntry(data, entry) {
  const manualEntries = [...data.manualEntries];
  const idx = manualEntries.findIndex((m) => m.id === entry.id);
  if (idx >= 0) manualEntries[idx] = entry;
  else manualEntries.push(entry);

  let targets = [...data.targets];
  let progressUpdates = [...data.progressUpdates];

  if (entry.entryType === "target") {
    targets.push({
      id: crypto.randomUUID(),
      planningUnitId: entry.planningUnitId,
      interventionId: entry.interventionId,
      targetValue: entry.targetValue,
      balanceValue: entry.balanceValue,
      maleBeneficiaries: entry.maleBeneficiaries,
      femaleBeneficiaries: entry.femaleBeneficiaries,
      source: "manual",
    });
  } else if (entry.entryType === "progress") {
    progressUpdates.push({
      id: crypto.randomUUID(),
      planningUnitId: entry.planningUnitId,
      interventionId: entry.interventionId,
      date: entry.date,
      achievedIncrement: entry.achievedValue,
      achievedCumulative: entry.achievedValue,
      balanceValue: entry.balanceValue,
      maleBeneficiaries: entry.maleBeneficiaries,
      femaleBeneficiaries: entry.femaleBeneficiaries,
      source: "manual",
      enteredBy: entry.createdBy,
      remarks: entry.remarks,
    });
  } else if (entry.entryType === "correction") {
    progressUpdates.push({
      id: crypto.randomUUID(),
      planningUnitId: entry.planningUnitId,
      interventionId: entry.interventionId,
      date: entry.date,
      achievedIncrement: entry.achievedValue ?? 0,
      achievedCumulative: entry.achievedValue ?? 0,
      balanceValue: entry.balanceValue,
      maleBeneficiaries: entry.maleBeneficiaries,
      femaleBeneficiaries: entry.femaleBeneficiaries,
      source: "correction",
      enteredBy: entry.createdBy,
      remarks: entry.remarks,
    });
  }

  return { ...data, manualEntries, targets, progressUpdates };
}
