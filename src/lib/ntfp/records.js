function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getNtfpLeafActivities(items = [], valueChainId) {
  const chainItems = valueChainId
    ? items.filter((item) => item.valueChainId === valueChainId)
    : items;
  const leaves = chainItems.filter((item) => item.parentActionCode);
  if (leaves.length) return leaves;
  return chainItems.filter((item) => item.actionTitle);
}

export function getNtfpGroups(items = [], valueChainId) {
  return items.filter((item) => item.valueChainId === valueChainId && !item.parentActionCode);
}

function sortProgress(a, b) {
  const dateCmp = String(a.date || "").localeCompare(String(b.date || ""));
  if (dateCmp !== 0) return dateCmp;
  return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
}

export function recalcNtfpProgressForItem(records = [], actionItemId, targetQuantity = 0) {
  const others = records.filter((record) => record.actionItemId !== actionItemId);
  const ofItem = records.filter((record) => record.actionItemId === actionItemId).sort(sortProgress);
  let qty = 0;
  let exp = 0;
  const updated = ofItem.map((record) => {
    qty += Number(record.completedQuantity) || 0;
    exp += Number(record.actualExpenditurePKR) || 0;
    const resultingProgressPercent =
      targetQuantity > 0
        ? Math.min(100, (qty / targetQuantity) * 100)
        : record.manualProgressPercent ?? record.resultingProgressPercent ?? 0;
    return {
      ...record,
      cumulativeCompletedQuantity: qty,
      cumulativeExpenditurePKR: exp,
      resultingProgressPercent,
    };
  });
  return [...others, ...updated];
}

export function createNtfpProgressRecord(form, { chainId, actionItem, previous, createdBy }) {
  const timestamp = new Date().toISOString();
  const addQty = form.completedQuantity === "" ? 0 : Number(form.completedQuantity) || 0;
  const addExp =
    form.actualExpenditurePKR === "" || form.actualExpenditurePKR == null
      ? 0
      : Number(form.actualExpenditurePKR) || 0;
  const manualPct =
    form.manualProgressPercent === "" || form.manualProgressPercent == null
      ? undefined
      : Number(form.manualProgressPercent);

  return {
    id: previous?.id || newId(),
    valueChainId: chainId,
    actionItemId: actionItem.id,
    date: form.date,
    completedQuantity: addQty,
    manualProgressPercent: manualPct,
    status: form.status || "in_progress",
    actualExpenditurePKR: addExp,
    locationText: form.locationText || undefined,
    remarks: form.remarks || "",
    source: previous?.source || "manual",
    createdAt: previous?.createdAt || timestamp,
    createdBy: previous?.createdBy || createdBy || "User",
    updatedAt: timestamp,
    updatedBy: previous ? createdBy : undefined,
  };
}

export function upsertNtfpProgress(data, record) {
  const item = (data.ntfpActionItems || []).find((row) => row.id === record.actionItemId);
  const target = item?.targetQuantity || item?.plannedQuantity || 0;
  let records = [...(data.ntfpProgressRecords || [])];
  const idx = records.findIndex((row) => row.id === record.id);
  if (idx >= 0) records[idx] = record;
  else records.push(record);
  records = recalcNtfpProgressForItem(records, record.actionItemId, target);
  const timestamp = record.updatedAt || record.createdAt;
  return {
    ...data,
    ntfpProgressRecords: records,
    ntfpValueChains: (data.ntfpValueChains || []).map((chain) =>
      chain.id === record.valueChainId
        ? { ...chain, lastUpdatedAt: timestamp, updatedAt: timestamp }
        : chain
    ),
  };
}

export function deleteNtfpProgress(data, recordId) {
  const existing = (data.ntfpProgressRecords || []).find((row) => row.id === recordId);
  if (!existing) return data;
  const item = (data.ntfpActionItems || []).find((row) => row.id === existing.actionItemId);
  const target = item?.targetQuantity || item?.plannedQuantity || 0;
  const remaining = data.ntfpProgressRecords.filter((row) => row.id !== recordId);
  return {
    ...data,
    ntfpProgressRecords: recalcNtfpProgressForItem(remaining, existing.actionItemId, target),
  };
}

export function createNtfpManualActivity(data, form, createdBy = "User") {
  const timestamp = new Date().toISOString();
  const valueChainId = form.valueChainId;
  const items = [...(data.ntfpActionItems || [])];
  const groups = getNtfpGroups(items, valueChainId);
  let parent = groups.find((group) => group.actionCode === form.parentActionCode);

  if (!parent) {
    parent = {
      id: newId(),
      valueChainId,
      actionCode: "M",
      parentActionCode: undefined,
      actionGroup: "Manual entries",
      actionTitle: "Manual entries",
      status: "not_started",
      source: "manual",
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy,
    };
    items.push(parent);
  }

  const siblings = items.filter(
    (item) => item.valueChainId === valueChainId && item.parentActionCode === parent.actionCode
  );
  const qty = form.targetQuantity === "" ? undefined : Number(form.targetQuantity);
  const unitCost = form.unitCostPKR === "" ? undefined : Number(form.unitCostPKR);
  const budget =
    form.plannedBudgetPKR === ""
      ? unitCost != null && qty != null
        ? unitCost * qty
        : undefined
      : Number(form.plannedBudgetPKR);

  const activity = {
    id: newId(),
    valueChainId,
    actionCode: `${parent.actionCode}.${siblings.length + 1}`,
    parentActionCode: parent.actionCode,
    actionGroup: parent.actionTitle,
    actionTitle: form.actionTitle.trim(),
    unit: form.unit || undefined,
    unitCostPKR: unitCost,
    targetQuantity: qty,
    plannedQuantity: qty,
    plannedBudgetPKR: budget ?? 0,
    estimatedBudgetPKR: budget ?? 0,
    status: "not_started",
    source: "manual",
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy,
  };
  items.push(activity);

  return {
    data: {
      ...data,
      ntfpActionItems: items,
      ntfpValueChains: (data.ntfpValueChains || []).map((chain) =>
        chain.id === valueChainId
          ? {
              ...chain,
              actionPlanStatus: "available",
              status: chain.status === "identification_pending" ? chain.status : "action_plan_available",
              implementationStatus: chain.implementationStatus || "not_started",
              updatedAt: timestamp,
              lastUpdatedAt: timestamp,
            }
          : chain
      ),
    },
    activity,
  };
}
