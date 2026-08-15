import { NTFP_STATUS } from "@/lib/modules/seed";

function isLeafActivity(item) {
  return Boolean(item.parentActionCode);
}

function getLatestProgress(records, actionItemId) {
  const rows = records
    .filter((r) => r.actionItemId === actionItemId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return rows[0] || null;
}

export function computeActivityMetrics(item, progressRecords = []) {
  const itemRecords = progressRecords.filter((r) => r.actionItemId === item.id);
  const latest = getLatestProgress(progressRecords, item.id);
  const cumulativeQty =
    latest?.cumulativeCompletedQuantity ??
    itemRecords.reduce((sum, r) => sum + (r.completedQuantity || 0), 0);
  const cumulativeExp =
    latest?.cumulativeExpenditurePKR ??
    itemRecords.reduce((sum, r) => sum + (r.actualExpenditurePKR || 0), 0);

  const target = item.targetQuantity ?? item.plannedQuantity ?? 0;
  const budget = item.plannedBudgetPKR || item.estimatedBudgetPKR || 0;
  const hasMeaningfulQuantity = target > 0;

  const physicalProgressPercent = hasMeaningfulQuantity
    ? Math.min(100, (cumulativeQty / target) * 100)
    : latest?.manualProgressPercent ?? latest?.progressPercent ?? item.manualProgressPercent ?? 0;

  const hasExpenditure = cumulativeExp > 0 || itemRecords.some((r) => r.actualExpenditurePKR != null);
  const financialProgressPercent =
    budget > 0 && hasExpenditure ? (cumulativeExp / budget) * 100 : undefined;

  let status = item.status || "not_started";
  if (latest?.status) {
    status = latest.status;
  } else if (physicalProgressPercent >= 100) {
    status = "completed";
  } else if (physicalProgressPercent > 0) {
    status = "in_progress";
  } else {
    status = "not_started";
  }

  const remainingQuantity = hasMeaningfulQuantity ? Math.max(0, target - cumulativeQty) : null;

  return {
    cumulativeQty,
    cumulativeExp,
    physicalProgressPercent,
    financialProgressPercent,
    hasExpenditure,
    status,
    achieved: cumulativeQty,
    balance: remainingQuantity ?? 0,
    remainingQuantity,
    budgetUtilizationPercent: financialProgressPercent,
    remainingBudgetPKR: hasExpenditure ? budget - cumulativeExp : undefined,
    isOverBudget: hasExpenditure && budget > 0 && cumulativeExp > budget,
  };
}

export function getValueChainSummary(data, valueChainId) {
  const chain = data.ntfpValueChains.find((c) => c.id === valueChainId);
  if (!chain) return null;

  const allItems = data.ntfpActionItems.filter((i) => i.valueChainId === valueChainId);
  const items = allItems.filter(isLeafActivity);
  const groups = allItems.filter((i) => !i.parentActionCode);
  const progressRecords = data.ntfpProgressRecords.filter((r) => r.valueChainId === valueChainId);
  const currentVersion = (data.ntfpActionPlanVersions || []).find(
    (v) => v.valueChainId === valueChainId && v.isCurrent
  );

  let plannedBudget = 0;
  let actualExpenditure = 0;
  let completed = 0;
  let inProgress = 0;
  let delayed = 0;
  let remaining = 0;
  let physicalSum = 0;
  let hasAnyExpenditure = false;

  items.forEach((item) => {
    const m = computeActivityMetrics(item, progressRecords);
    plannedBudget += item.plannedBudgetPKR || item.estimatedBudgetPKR || 0;
    actualExpenditure += m.cumulativeExp;
    if (m.hasExpenditure) hasAnyExpenditure = true;
    if (m.status === "completed") completed += 1;
    else if (m.status === "delayed") delayed += 1;
    else if (m.status === "in_progress") inProgress += 1;
    else remaining += 1;
    physicalSum += m.physicalProgressPercent;
  });

  const totalActivities = items.length;
  const physicalProgress = totalActivities ? physicalSum / totalActivities : 0;
  const financialProgress =
    hasAnyExpenditure && plannedBudget > 0 ? (actualExpenditure / plannedBudget) * 100 : undefined;

  const lastUpdate =
    progressRecords
      .map((r) => r.date || r.createdAt)
      .sort()
      .reverse()[0] ||
    chain.lastUpdatedAt ||
    chain.updatedAt;

  return {
    chain,
    currentVersion,
    groups,
    totalActivities,
    completedActivities: completed,
    inProgressActivities: inProgress,
    remainingActivities: remaining,
    delayedActivities: delayed,
    overdueActivities: delayed,
    plannedBudget: currentVersion?.calculatedGrandTotalPKR || currentVersion?.plannedBudgetPKR || plannedBudget,
    actualExpenditure: hasAnyExpenditure ? actualExpenditure : undefined,
    hasAnyExpenditure,
    physicalProgress,
    financialProgress,
    budgetUtilization: financialProgress,
    remainingBudget: hasAnyExpenditure ? plannedBudget - actualExpenditure : undefined,
    items,
    progressRecords,
    lastUpdate,
  };
}

export function getNtfpDashboardSummary(data) {
  const chains = data.ntfpValueChains || [];
  const reportsCompleted = chains.filter((c) =>
    ["completed", "approved"].includes(c.valueChainReportStatus)
  );
  const reportsUnderPrep = chains.filter((c) => c.valueChainReportStatus === "under_preparation");
  const actionPlansAvailable = chains.filter(
    (c) => c.actionPlanStatus === "available" || c.status === NTFP_STATUS.ACTION_PLAN_AVAILABLE
  );
  const actionPlansUnderPrep = chains.filter((c) => c.actionPlanStatus === "under_preparation");
  const medicinalPending = chains.filter(
    (c) =>
      c.isEditablePlaceholder ||
      c.medicinalIdentificationStatus === "pending" ||
      c.status === NTFP_STATUS.IDENTIFICATION_PENDING
  );

  let totalPlannedBudget = 0;
  let actualExpenditure = 0;
  let hasAnyExpenditure = false;
  let physicalSum = 0;
  let chainCount = 0;
  let totalActivities = 0;
  let completedActivities = 0;
  let inProgressActivities = 0;
  let remainingActivities = 0;
  let delayedActivities = 0;

  chains.forEach((chain) => {
    const summary = getValueChainSummary(data, chain.id);
    if (!summary) return;
    totalActivities += summary.totalActivities;
    completedActivities += summary.completedActivities;
    inProgressActivities += summary.inProgressActivities;
    remainingActivities += summary.remainingActivities;
    delayedActivities += summary.delayedActivities;

    if (summary.totalActivities === 0) return;
    chainCount += 1;
    totalPlannedBudget += summary.plannedBudget;
    if (summary.hasAnyExpenditure) {
      hasAnyExpenditure = true;
      actualExpenditure += summary.actualExpenditure || 0;
    }
    physicalSum += summary.physicalProgress;
  });

  return {
    totalValueChains: chains.length,
    reportsCompletedCount: reportsCompleted.length,
    reportsUnderPreparationCount: reportsUnderPrep.length,
    actionPlansAvailableCount: actionPlansAvailable.length,
    actionPlansUnderPreparationCount: actionPlansUnderPrep.length,
    actionPlansPendingCount: chains.filter(
      (c) => c.actionPlanStatus === "not_started" || c.status === NTFP_STATUS.ACTION_PLAN_PENDING
    ).length,
    identificationPendingCount: medicinalPending.length,
    medicinalPendingCount: medicinalPending.length,
    totalPlannedBudget,
    actualExpenditure: hasAnyExpenditure ? actualExpenditure : undefined,
    hasAnyExpenditure,
    budgetUtilization:
      hasAnyExpenditure && totalPlannedBudget > 0
        ? (actualExpenditure / totalPlannedBudget) * 100
        : undefined,
    remainingBudget: hasAnyExpenditure ? totalPlannedBudget - actualExpenditure : undefined,
    totalActivities,
    completedActivities,
    inProgressActivities,
    remainingActivities,
    delayedActivities,
    overallPhysicalProgress: chainCount ? physicalSum / chainCount : 0,
    overallFinancialProgress:
      hasAnyExpenditure && totalPlannedBudget > 0
        ? (actualExpenditure / totalPlannedBudget) * 100
        : undefined,
    overdueActions: delayedActivities,
    chainSummaries: chains.map((c) => getValueChainSummary(data, c.id)),
  };
}

export function statusLabel(status) {
  const map = {
    identification_pending: "Identification Pending",
    action_plan_pending: "Action Plan Pending",
    action_plan_available: "Action Plan Available",
    not_started: "Not Started",
    under_preparation: "Under Preparation",
    available: "Available",
    in_progress: "In Progress",
    completed: "Completed",
    approved: "Approved",
    delayed: "Delayed",
    cancelled: "Cancelled",
    pending: "Pending",
    assessment_underway: "Assessment Underway",
    shortlisted: "Shortlisted",
    confirmed: "Confirmed",
    not_required: "Not Required",
  };
  return map[status] || status;
}

export function statusColor(status) {
  if (
    status === "completed" ||
    status === "approved" ||
    status === "action_plan_available" ||
    status === "available" ||
    status === "confirmed"
  ) {
    return "green";
  }
  if (status === "in_progress" || status === "under_preparation" || status === "assessment_underway") {
    return "blue";
  }
  if (
    status === "action_plan_pending" ||
    status === "delayed" ||
    status === "shortlisted" ||
    status === "not_started"
  ) {
    return "amber";
  }
  if (status === "identification_pending" || status === "pending") return "grey";
  if (status === "cancelled") return "red";
  return "blue";
}

export function formatPKR(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `PKR ${Math.round(Number(value)).toLocaleString()}`;
}

/** Compact currency for summary cards, e.g. PKR 52.40 M */
export function formatPKRCompact(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)} B`;
  if (abs >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(2)} M`;
  if (abs >= 1_000) return `PKR ${(n / 1_000).toFixed(1)} K`;
  return `PKR ${Math.round(n).toLocaleString()}`;
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}
