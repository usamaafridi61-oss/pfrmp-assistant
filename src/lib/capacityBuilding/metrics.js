export const CAPACITY_STATUS_LABELS = {
  not_started: "Not Started",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  postponed: "Postponed",
  cancelled: "Cancelled",
  delayed: "Delayed",
};

export function getDerivedActivityStatus(item, events = []) {
  const planned = item?.plannedEvents || 0;
  const completed = events.filter((e) => e.status === "completed").length;
  const scheduled = events.filter((e) => e.status === "scheduled" || e.status === "planned").length;
  const postponed = events.filter((e) => e.status === "postponed").length;

  if (planned > 0 && completed >= planned) return "completed";
  if (completed > 0) return "in_progress";
  if (scheduled > 0) return "scheduled";
  if (postponed > 0) return "postponed";
  return "not_started";
}

export function getEventsForPlanItem(data, planItemId) {
  return (data.capacityEvents || []).filter((e) => e.planItemId === planItemId);
}

export function getCapacityDashboardSummary(data) {
  const planItems = data.capacityPlanItems || [];
  const events = data.capacityEvents || [];

  let plannedEvents = 0;
  let plannedParticipants = 0;
  let plannedBudget = 0;
  let actualParticipants = 0;
  let actualExpenditure = 0;

  planItems.forEach((item) => {
    plannedEvents += item.plannedEvents || 0;
    plannedParticipants += item.plannedParticipants || 0;
    plannedBudget += item.totalPlannedCostPKR || 0;
  });

  const completed = events.filter((e) => e.status === "completed");
  const scheduled = events.filter((e) => e.status === "scheduled" || e.status === "planned");
  const completedEvents = completed.length;
  completed.forEach((e) => {
    actualParticipants += e.actualParticipants || 0;
    actualExpenditure += e.actualCostPKR || 0;
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = scheduled.filter((e) => e.eventDateStart >= today).length;
  const delayed = scheduled.filter((e) => e.eventDateStart && e.eventDateStart < today).length;

  return {
    plannedEvents,
    completedEvents,
    remainingEvents: Math.max(0, plannedEvents - completedEvents),
    scheduledEvents: scheduled.length,
    eventCompletionPercent: plannedEvents ? (completedEvents / plannedEvents) * 100 : 0,
    plannedParticipants,
    actualParticipants,
    participantProgressPercent: plannedParticipants
      ? (actualParticipants / plannedParticipants) * 100
      : 0,
    plannedBudget,
    actualExpenditure,
    budgetUtilizationPercent: plannedBudget ? (actualExpenditure / plannedBudget) * 100 : 0,
    upcomingEvents: upcoming,
    delayedEvents: delayed,
    hasAnyExpenditure: actualExpenditure > 0,
    groupCount: getCapacityGroupSummaries(data).length,
  };
}

export function getCapacityGroupSummaries(data) {
  const groups = new Map();

  (data.capacityPlanItems || []).forEach((item) => {
    const key = item.moduleGroupCode || item.moduleGroupName || "other";
    if (!groups.has(key)) {
      groups.set(key, {
        moduleGroupCode: item.moduleGroupCode,
        moduleGroupName: item.moduleGroupName,
        plannedEvents: 0,
        plannedParticipants: 0,
        plannedBudget: 0,
        planItemIds: [],
        activityCount: 0,
      });
    }
    const g = groups.get(key);
    g.plannedEvents += item.plannedEvents || 0;
    g.plannedParticipants += item.plannedParticipants || 0;
    g.plannedBudget += item.totalPlannedCostPKR || 0;
    g.planItemIds.push(item.id);
    g.activityCount += 1;
  });

  return [...groups.values()].map((group) => {
    const events = (data.capacityEvents || []).filter((e) => group.planItemIds.includes(e.planItemId));
    const completed = events.filter((e) => e.status === "completed");
    const scheduled = events.filter((e) => e.status === "scheduled" || e.status === "planned");
    const actualParticipants = completed.reduce((s, e) => s + (e.actualParticipants || 0), 0);
    const actualExpenditure = completed.reduce((s, e) => s + (e.actualCostPKR || 0), 0);
    const remainingEvents = Math.max(0, group.plannedEvents - completed.length);

    let status = "not_started";
    if (group.plannedEvents > 0 && completed.length >= group.plannedEvents) status = "completed";
    else if (completed.length > 0) status = "in_progress";
    else if (scheduled.length > 0) status = "scheduled";

    return {
      ...group,
      completedEvents: completed.length,
      remainingEvents,
      scheduledEvents: scheduled.length,
      actualParticipants,
      actualExpenditure,
      progressPercent: group.plannedEvents ? (completed.length / group.plannedEvents) * 100 : 0,
      status,
    };
  });
}

export function getPlanItemsForGroup(data, groupCode) {
  return (data.capacityPlanItems || []).filter(
    (item) => item.moduleGroupCode === groupCode || item.moduleGroupName === groupCode
  );
}

export function getPlanItemMetrics(data, planItemId) {
  const item = (data.capacityPlanItems || []).find((p) => p.id === planItemId);
  if (!item) return null;

  const events = getEventsForPlanItem(data, planItemId);
  const completed = events.filter((e) => e.status === "completed");
  const scheduled = events.filter((e) => e.status === "scheduled" || e.status === "planned");

  return {
    item,
    events,
    completedEvents: completed.length,
    remainingEvents: Math.max(0, (item.plannedEvents || 0) - completed.length),
    scheduledEvents: scheduled.length,
    actualParticipants: completed.reduce((s, e) => s + (e.actualParticipants || 0), 0),
    actualExpenditure: completed.reduce((s, e) => s + (e.actualCostPKR || 0), 0),
    progressPercent: item.plannedEvents ? (completed.length / item.plannedEvents) * 100 : 0,
    status: getDerivedActivityStatus(item, events),
  };
}

export function formatPKR(value) {
  return `PKR ${Math.round(value || 0).toLocaleString()}`;
}

export function statusLabel(status) {
  return CAPACITY_STATUS_LABELS[status] || status || "Not Started";
}
