import * as XLSX from "xlsx";

/** Excel columns in Lists / main sheet are 1-based (A=1). Main data starts at column B. */
const MAIN_SHEET_FIRST_COL = 2;
const MAIN_DATA_START_ROW = 8;

const COL = {
  sno: excelColIndex("B"),
  region: excelColIndex("C"),
  division: excelColIndex("D"),
  puName: excelColIndex("E"),
  puAreaHa: excelColIndex("F"),
  totalHHs: excelColIndex("G"),
  population: excelColIndex("H"),
  agriculture: excelColIndex("I"),
  waterBody: excelColIndex("J"),
  settlement: excelColIndex("K"),
  forest: excelColIndex("L"),
  grassland: excelColIndex("M"),
  barrenLand: excelColIndex("N"),
  landUseTotal: excelColIndex("O"),
  existingInterventionArea: excelColIndex("P"),
};

function excelColIndex(colLetter) {
  let n = 0;
  const s = colLetter.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    n = n * 26 + (s.charCodeAt(i) - 64);
  }
  return n - MAIN_SHEET_FIRST_COL;
}

function slugId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toNumber(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function inferUnit(interventionName) {
  const name = String(interventionName).toLowerCase();
  if (name.includes("seedling")) return "seedlings";
  if (name.includes("(km)")) return "km";
  if (name.includes("(cft)")) return "cft";
  if (name.includes("(ha)")) return "ha";
  if (name.includes("training") || name.includes("traning")) return "participants";
  if (name.includes("tool kit") || name.includes("tools")) return "units";
  if (name.includes("project")) return "projects";
  return "units";
}

function inferCategory(interventionName) {
  const name = String(interventionName).toLowerCase();
  if (name.includes("training") || name.includes("traning")) return "Training";
  if (name.includes("nursery") || name.includes("seedling")) return "Nursery";
  if (name.includes("fire")) return "Fire Protection";
  if (name.includes("spring shed")) return "Spring Shed";
  if (name.includes("warden") || name.includes("community")) return "Community Institution";
  if (name.includes("livelihood") || name.includes("vdc") || name.includes("fodder")) return "Livelihood";
  if (name.includes("plantation") || name.includes("wood lot") || name.includes("enrichment")) return "Plantation";
  return "Other";
}

function validatePuLandUse(puName, landUse) {
  const warnings = [];
  const sum =
    landUse.agricultureHa +
    landUse.waterBodyHa +
    landUse.settlementHa +
    landUse.forestHa +
    landUse.grasslandHa +
    landUse.barrenLandHa;
  if (landUse.totalHa > 0 && Math.abs(sum - landUse.totalHa) > 0.5) {
    warnings.push(
      `${puName}: land-use total (${landUse.totalHa}) differs from category sum (${sum.toFixed(2)}).`
    );
  }
  return warnings;
}

function parseReportDateFromFilename(filename) {
  const match = String(filename).match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return new Date().toISOString().slice(0, 10);
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function findSheetName(sheetNames, pattern) {
  const lower = pattern.toLowerCase();
  return sheetNames.find((name) => name.toLowerCase().includes(lower)) || null;
}

export function isBtaspWorkbook(workbook) {
  if (!workbook?.SheetNames?.length) return false;
  const names = workbook.SheetNames.map((n) => n.toLowerCase());
  return (
    names.some((n) => n.includes("over all monitoring")) &&
    names.some((n) => n === "lists" || n.includes("list"))
  );
}

export function readWorkbookFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const name = file.name.toLowerCase();
        const workbook =
          name.endsWith(".csv") || name.endsWith(".txt")
            ? XLSX.read(reader.result, { type: "string", cellDates: true })
            : XLSX.read(new Uint8Array(reader.result), { type: "array", cellDates: true });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    if (file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

function parseInterventionColumns(workbook) {
  const listsName = findSheetName(workbook.SheetNames, "lists");
  if (!listsName) {
    throw new Error('Missing "Lists" sheet (intervention column map).');
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[listsName], { defval: "" });
  return rows
    .filter((row) => row.Intervention)
    .map((row) => ({
      name: String(row.Intervention).trim(),
      qntCol: Number(row.QntCol),
      progressCol: Number(row.ProgressCol),
      balanceCol: Number(row.BalanceCol),
      mbCol: row.MBCol ? Number(row.MBCol) : null,
      fbCol: row.FBCol ? Number(row.FBCol) : null,
    }))
    .filter((row) => row.name && row.qntCol && row.progressCol);
}

function listColToIndex(excelColNumber) {
  return excelColNumber - MAIN_SHEET_FIRST_COL;
}

export function parseBtaspWorkbook(workbook, filename = "") {
  const mainName = findSheetName(workbook.SheetNames, "over all monitoring");
  if (!mainName) {
    throw new Error('Missing "Over all Monitoring sheet".');
  }

  const interventions = parseInterventionColumns(workbook);
  if (!interventions.length) {
    throw new Error("No interventions found in Lists sheet.");
  }

  const sheet = workbook.Sheets[mainName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const reportDate = parseReportDateFromFilename(filename);

  const divisionMap = new Map();
  const planningUnitMap = new Map();
  const interventionMap = new Map();
  const targets = [];
  const progressUpdates = [];
  const validationWarnings = [];

  let lastRegion = "";
  let lastDivision = "";

  for (let rowIndex = MAIN_DATA_START_ROW - 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (!row?.length) continue;

    const puName = String(row[COL.puName] ?? "").trim();
    if (!puName) {
      validationWarnings.push(`Row ${rowIndex + 1}: skipped — PU name is empty.`);
      continue;
    }

    const region = String(row[COL.region] ?? "").trim() || lastRegion;
    const divisionName = String(row[COL.division] ?? "").trim() || lastDivision;
    if (region) lastRegion = region;
    if (divisionName) lastDivision = divisionName;
    if (!region) validationWarnings.push(`${puName}: region missing after forward-fill.`);
    if (!divisionName) {
      validationWarnings.push(`${puName}: forest division missing after forward-fill.`);
      continue;
    }

    const divisionId = slugId(divisionName);
    const planningUnitId = `${divisionId}_${slugId(puName)}`;

    if (!divisionMap.has(divisionId)) {
      divisionMap.set(divisionId, { id: divisionId, name: divisionName, region });
    }

    if (!planningUnitMap.has(planningUnitId)) {
      const landUse = {
        agricultureHa: toNumber(row[COL.agriculture]),
        waterBodyHa: toNumber(row[COL.waterBody]),
        settlementHa: toNumber(row[COL.settlement]),
        forestHa: toNumber(row[COL.forest]),
        grasslandHa: toNumber(row[COL.grassland]),
        barrenLandHa: toNumber(row[COL.barrenLand]),
        totalHa: toNumber(row[COL.landUseTotal]),
      };
      planningUnitMap.set(planningUnitId, {
        id: planningUnitId,
        name: puName,
        divisionId,
        divisionName,
        region,
        areaHa: toNumber(row[COL.puAreaHa]),
        totalHouseholds: toNumber(row[COL.totalHHs]),
        population: toNumber(row[COL.population]),
        landUse,
        existingInterventionAreaHa: toNumber(row[COL.existingInterventionArea]),
      });
      validationWarnings.push(...validatePuLandUse(puName, landUse));
    }

    for (const intervention of interventions) {
      const interventionId = slugId(intervention.name);
      const hasMB = intervention.mbCol != null;
      const hasFB = intervention.fbCol != null;

      if (!interventionMap.has(interventionId)) {
        interventionMap.set(interventionId, {
          id: interventionId,
          name: intervention.name,
          unit: inferUnit(intervention.name),
          category: inferCategory(intervention.name),
          hasMaleFemaleBeneficiaries: hasMB || hasFB,
        });
      }

      const qnt = toNumber(row[listColToIndex(intervention.qntCol)]);
      const progress = toNumber(row[listColToIndex(intervention.progressCol)]);
      const balance = intervention.balanceCol
        ? toNumber(row[listColToIndex(intervention.balanceCol)])
        : Math.max(qnt - progress, 0);
      const maleB = hasMB ? toNumber(row[listColToIndex(intervention.mbCol)]) : undefined;
      const femaleB = hasFB ? toNumber(row[listColToIndex(intervention.fbCol)]) : undefined;

      if (qnt > 0) {
        targets.push({
          id: newId(),
          planningUnitId,
          interventionId,
          targetValue: qnt,
          balanceValue: balance,
          maleBeneficiaries: maleB,
          femaleBeneficiaries: femaleB,
          source: "workbook",
          fiscalYear: reportDate.slice(0, 4),
        });
      }

      if (progress > 0) {
        progressUpdates.push({
          id: newId(),
          planningUnitId,
          interventionId,
          date: reportDate,
          achievedIncrement: progress,
          achievedCumulative: progress,
          balanceValue: balance,
          maleBeneficiaries: maleB,
          femaleBeneficiaries: femaleB,
          source: "workbook",
          remarks: "BTASP workbook snapshot import",
        });
      }
    }
  }

  const summaryName = findSheetName(workbook.SheetNames, "summary");
  let summaryCount = 0;
  if (summaryName) {
    const summaryRows = XLSX.utils.sheet_to_json(workbook.Sheets[summaryName], { defval: "" });
    summaryCount = summaryRows.filter((r) => r.Intervention && !String(r.Intervention).startsWith("Total")).length;
  }

  return {
    divisions: [...divisionMap.values()],
    planningUnits: [...planningUnitMap.values()],
    interventionsMaster: [...interventionMap.values()],
    targets,
    progressUpdates,
    meta: {
      reportDate,
      regions: [...new Set([...planningUnitMap.values()].map((p) => p.region).filter(Boolean))],
      interventionCount: interventions.length,
      planningUnitCount: planningUnitMap.size,
      divisionCount: divisionMap.size,
      targetCount: targets.length,
      progressCount: progressUpdates.length,
      summaryInterventions: summaryCount,
      sheets: workbook.SheetNames,
      validationWarnings,
    },
  };
}

/** Merge workbook import into existing data, preserving manual entries and docs. */
export function mergeBtaspImport(existing, parsed) {
  const manualEntries = existing.manualEntries || [];
  const docs = existing.docs || [];
  const technicalGuidance = existing.technicalGuidance || [];
  const interventionImplementationGuidance = existing.interventionImplementationGuidance || [];

  const manualTargets = (existing.targets || []).filter((t) => t.source === "manual");
  const manualProgress = (existing.progressUpdates || []).filter((p) => p.source === "manual" || p.source === "correction");

  return {
    divisions: parsed.divisions,
    planningUnits: parsed.planningUnits,
    interventionsMaster: parsed.interventionsMaster,
    targets: [...parsed.targets, ...manualTargets],
    progressUpdates: [...parsed.progressUpdates, ...manualProgress],
    manualEntries,
    docs,
    technicalGuidance,
    interventionImplementationGuidance,
  };
}

export async function importBtaspWorkbook(file, existingData = null) {
  const workbook = await readWorkbookFromFile(file);
  if (!isBtaspWorkbook(workbook)) {
    return {
      ok: false,
      message: 'Not a BTASP workbook. Expected sheets "Over all Monitoring sheet" and "Lists".',
    };
  }

  const parsed = parseBtaspWorkbook(workbook, file.name);
  const { meta } = parsed;

  const data = existingData
    ? mergeBtaspImport(existingData, parsed)
    : {
        divisions: parsed.divisions,
        planningUnits: parsed.planningUnits,
        interventionsMaster: parsed.interventionsMaster,
        targets: parsed.targets,
        progressUpdates: parsed.progressUpdates,
        manualEntries: [],
        docs: [],
        technicalGuidance: [],
        interventionImplementationGuidance: [],
      };

  return {
    ok: true,
    mode: "btasp_workbook",
    data,
    message:
      `Imported BTASP workbook (${file.name}): ${meta.divisionCount} divisions, ` +
      `${meta.planningUnitCount} planning units, ${meta.interventionCount} interventions, ` +
      `${meta.targetCount} targets, ${meta.progressCount} progress values. Report date: ${meta.reportDate}.`,
    meta,
  };
}
