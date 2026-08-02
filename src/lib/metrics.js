/** Effective target/achieved merge per spec §9.4 */

function latestByKey(rows, keyFn) {
  const map = new Map();
  rows.forEach((row) => {
    const key = keyFn(row);
    const existing = map.get(key);
    if (!existing || String(row.date || "") >= String(existing.date || "")) {
      map.set(key, row);
    }
  });
  return map;
}

function filterProgressBySnapshot(progressUpdates, snapshotDate) {
  if (!snapshotDate || snapshotDate === "all") {
    return progressUpdates;
  }
  return progressUpdates.filter((p) => p.date === snapshotDate);
}

export function getWorkbookProgressMap(progressUpdates, snapshotDate = "all") {
  const filtered = filterProgressBySnapshot(
    progressUpdates.filter((p) => p.source === "workbook" || !p.source),
    snapshotDate
  );
  return latestByKey(filtered, (p) => `${p.planningUnitId}::${p.interventionId}`);
}

export function getManualAdjustments(manualEntries) {
  const targetAdj = new Map();
  const progressAdj = new Map();
  const corrections = new Map();

  manualEntries.forEach((entry) => {
    const key = `${entry.planningUnitId}::${entry.interventionId}`;
    if (entry.entryType === "target") {
      targetAdj.set(key, (targetAdj.get(key) || 0) + (entry.targetValue || 0));
    } else if (entry.entryType === "progress") {
      const existing = progressAdj.get(key) || { achieved: 0, male: 0, female: 0 };
      existing.achieved += entry.achievedValue || 0;
      existing.male += entry.maleBeneficiaries || 0;
      existing.female += entry.femaleBeneficiaries || 0;
      progressAdj.set(key, existing);
    } else if (entry.entryType === "correction") {
      corrections.set(key, entry);
    }
  });

  return { targetAdj, progressAdj, corrections };
}

export function getEffectivePuIntervention(data, planningUnitId, interventionId, filters = {}) {
  const { targets, progressUpdates, manualEntries } = data;
  const snapshotDate = filters.snapshotDate || "all";
  const key = `${planningUnitId}::${interventionId}`;

  const importedTarget = targets
    .filter((t) => t.planningUnitId === planningUnitId && t.interventionId === interventionId && (t.source === "workbook" || !t.source))
    .reduce((sum, t) => sum + t.targetValue, 0);

  const { targetAdj, progressAdj, corrections } = getManualAdjustments(manualEntries);
  const manualTarget = targetAdj.get(key) || 0;
  const correction = corrections.get(key);

  let effectiveTarget = importedTarget + manualTarget;
  if (correction?.targetValue != null) effectiveTarget = correction.targetValue;

  const wbProgress = getWorkbookProgressMap(progressUpdates, snapshotDate).get(key);
  let effectiveAchieved = wbProgress?.achievedCumulative ?? wbProgress?.achievedIncrement ?? 0;

  const manualProg = progressAdj.get(key);
  if (manualProg) effectiveAchieved += manualProg.achieved;
  if (correction?.achievedValue != null) effectiveAchieved = correction.achievedValue;

  const effectiveRemaining = Math.max(effectiveTarget - effectiveAchieved, 0);
  const progressPct = effectiveTarget > 0 ? (effectiveAchieved / effectiveTarget) * 100 : effectiveAchieved > 0 ? 100 : 0;

  const targetRow = targets.find(
    (t) => t.planningUnitId === planningUnitId && t.interventionId === interventionId
  );

  let maleBeneficiaries = targetRow?.maleBeneficiaries ?? wbProgress?.maleBeneficiaries ?? 0;
  let femaleBeneficiaries = targetRow?.femaleBeneficiaries ?? wbProgress?.femaleBeneficiaries ?? 0;
  if (manualProg) {
    maleBeneficiaries += manualProg.male;
    femaleBeneficiaries += manualProg.female;
  }
  if (correction?.maleBeneficiaries != null) maleBeneficiaries = correction.maleBeneficiaries;
  if (correction?.femaleBeneficiaries != null) femaleBeneficiaries = correction.femaleBeneficiaries;

  const hasManual = manualEntries.some(
    (m) => m.planningUnitId === planningUnitId && m.interventionId === interventionId
  );

  return {
    target: effectiveTarget,
    achieved: effectiveAchieved,
    remaining: effectiveRemaining,
    progressPct,
    maleBeneficiaries,
    femaleBeneficiaries,
    source: hasManual ? (correction ? "correction" : "manual") : "workbook",
    hasTarget: effectiveTarget > 0,
    status: getProgressStatus(effectiveTarget, effectiveAchieved),
  };
}

export function getProgressStatus(target, achieved) {
  if (target <= 0 && achieved <= 0) return "no_target";
  if (achieved <= 0) return "not_started";
  if (achieved > target && target > 0) return "over_achieved";
  if (achieved >= target) return "completed";
  return "in_progress";
}

export function getInterventionSummaries(data, filters = {}) {
  const { interventionsMaster, planningUnits } = data;
  const puSet = getFilteredPuSet(planningUnits, filters);

  return interventionsMaster.map((intv) => {
    let target = 0;
    let achieved = 0;
    let male = 0;
    let female = 0;
    let puCovered = 0;

    puSet.forEach((puId) => {
      const m = getEffectivePuIntervention(data, puId, intv.id, filters);
      if (m.hasTarget || m.achieved > 0) {
        puCovered += 1;
        target += m.target;
        achieved += m.achieved;
        male += m.maleBeneficiaries;
        female += m.femaleBeneficiaries;
      }
    });

    const remaining = Math.max(target - achieved, 0);
    const progressPct = target > 0 ? (achieved / target) * 100 : 0;

    return {
      ...intv,
      target,
      achieved,
      remaining,
      progressPct,
      puCovered,
      maleBeneficiaries: male,
      femaleBeneficiaries: female,
      status: getProgressStatus(target, achieved),
    };
  });
}

export function getFilteredPuSet(planningUnits, filters = {}) {
  const { region, divisionId, planningUnitId } = filters;
  let pus = planningUnits;
  if (region && region !== "all") pus = pus.filter((p) => p.region === region);
  if (divisionId && divisionId !== "all") pus = pus.filter((p) => p.divisionId === divisionId);
  if (planningUnitId && planningUnitId !== "all") pus = pus.filter((p) => p.id === planningUnitId);
  return new Set(pus.map((p) => p.id));
}

export function getProgramTotals(data, filters = {}) {
  const summaries = getInterventionSummaries(data, filters);
  const filtered = filters.interventionId && filters.interventionId !== "all"
    ? summaries.filter((s) => s.id === filters.interventionId)
    : summaries;

  const target = filtered.reduce((a, b) => a + b.target, 0);
  const achieved = filtered.reduce((a, b) => a + b.achieved, 0);
  const remaining = Math.max(target - achieved, 0);
  const progress = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;

  return { target, achieved, remaining, progress };
}

export function getPuInterventionRows(data, planningUnitId, filters = {}) {
  const { interventionsMaster } = data;
  return interventionsMaster
    .map((intv) => {
      const m = getEffectivePuIntervention(data, planningUnitId, intv.id, filters);
      return { ...intv, ...m };
    })
    .filter((row) => row.hasTarget || row.achieved > 0);
}

export function getInterventionPuRows(data, interventionId, filters = {}) {
  const { planningUnits, divisions } = data;
  const puSet = getFilteredPuSet(planningUnits, filters);

  return planningUnits
    .filter((pu) => puSet.has(pu.id))
    .map((pu) => {
      const div = divisions.find((d) => d.id === pu.divisionId);
      const m = getEffectivePuIntervention(data, pu.id, interventionId, filters);
      return {
        planningUnitId: pu.id,
        planningUnitName: pu.name,
        divisionId: pu.divisionId,
        divisionName: div?.name || pu.divisionName || "",
        region: pu.region,
        ...m,
      };
    })
    .filter((row) => row.hasTarget || row.achieved > 0);
}

export function getDivisionSummaries(data, divisionId) {
  const { planningUnits, interventionsMaster } = data;
  const pus = planningUnits.filter((p) => p.divisionId === divisionId);

  const interventions = interventionsMaster.map((intv) => {
    let target = 0;
    let achieved = 0;
    pus.forEach((pu) => {
      const m = getEffectivePuIntervention(data, pu.id, intv.id, {});
      target += m.target;
      achieved += m.achieved;
    });
    return {
      ...intv,
      target,
      achieved,
      remaining: Math.max(target - achieved, 0),
      progressPct: target > 0 ? (achieved / target) * 100 : 0,
    };
  });

  return { planningUnits: pus, interventions };
}

export function getProgressTimeline(data, planningUnitId, interventionId) {
  const { progressUpdates, manualEntries } = data;
  const wb = progressUpdates
    .filter((p) => p.planningUnitId === planningUnitId && p.interventionId === interventionId)
    .map((p) => ({
      date: p.date,
      cumulative: p.achievedCumulative ?? p.achievedIncrement,
      source: p.source || "workbook",
    }));

  const manual = manualEntries
    .filter(
      (m) =>
        m.planningUnitId === planningUnitId &&
        m.interventionId === interventionId &&
        (m.entryType === "progress" || m.entryType === "correction")
    )
    .map((m) => ({
      date: m.date,
      cumulative: m.achievedValue ?? 0,
      source: m.entryType === "correction" ? "correction" : "manual",
    }));

  return [...wb, ...manual].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function getUniqueRegions(planningUnits) {
  return [...new Set(planningUnits.map((p) => p.region).filter(Boolean))].sort();
}

export function getUniqueSnapshotDates(progressUpdates) {
  return [...new Set(progressUpdates.map((p) => p.date).filter(Boolean))].sort().reverse();
}

export function getDivisionProgressSummaries(data, filters = {}) {
  const { divisions, planningUnits } = data;
  const puSet = getFilteredPuSet(planningUnits, filters);

  return divisions
    .map((div) => {
      const pus = planningUnits.filter((p) => p.divisionId === div.id && puSet.has(p.id));
      let target = 0;
      let achieved = 0;
      pus.forEach((pu) => {
        data.interventionsMaster.forEach((intv) => {
          const m = getEffectivePuIntervention(data, pu.id, intv.id, filters);
          target += m.target;
          achieved += m.achieved;
        });
      });
      return {
        id: div.id,
        label: div.name,
        target,
        achieved,
        remaining: Math.max(target - achieved, 0),
        progressPct: target > 0 ? (achieved / target) * 100 : 0,
      };
    })
    .filter((d) => d.target > 0 || d.achieved > 0)
    .sort((a, b) => b.target - a.target);
}
