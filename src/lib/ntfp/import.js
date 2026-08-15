import * as XLSX from "xlsx";
import { isNumericOnlyTitle } from "@/lib/ntfp/validate";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parsePlanNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const cleaned = String(value)
    .replace(/PKR|PKRs|Rs\.?/gi, "")
    .replace(/,/g, "")
    .trim();

  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function cellText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

export function normalizeNtfpHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[().]/g, "")
    .replace(/[\s\-/]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const HEADER_ALIASES = {
  serial: ["s_no", "sno", "sr_no", "srno", "serial_no", "serial_number", "action_code"],
  action: ["action", "actions", "action_title", "activity", "activities", "activity_title", "title", "description"],
  unit: ["unit", "units", "target_unit", "metric", "uom"],
  unitCost: ["unit_cost_pkrs", "unit_cost_pkr", "unit_cost", "cost_per_unit", "unit_rate"],
  quantity: ["qty", "quantity", "planned_quantity", "target_quantity", "target_qty"],
  budget: [
    "estimated_budget_pkrs",
    "estimated_budget_pkr",
    "estimated_budget",
    "planned_budget_pkr",
    "planned_budget",
    "budget",
    "total_cost",
    "total_pkr",
  ],
};

function isDedicatedActionHeader(h) {
  if (!h || h.length > 28) return false;
  if (/value_chain|walnut|honey|persimmon|pomegranate|medicinal/.test(h)) return false;
  return (
    /^(action|actions|activity|activities|action_title|activity_title|title|description)$/.test(h) ||
    /^(action|activity)s?_/.test(h)
  );
}

function headerMatches(h, aliases, kind) {
  if (!h) return false;
  if (kind === "action" && !isDedicatedActionHeader(h)) return false;
  if (kind === "unit" && /cost|pkr|budget|qty|quantity/.test(h)) return false;
  if (kind === "serial" && /action|activity|budget|cost|qty|quantity|unit/.test(h)) return false;
  if (aliases.includes(h)) return true;
  return aliases.some((alias) => alias.length >= 3 && (h === alias || h.startsWith(`${alias}_`) || h.endsWith(`_${alias}`)));
}

function matchHeaderIndex(headers, aliases, kind) {
  for (let i = 0; i < headers.length; i += 1) {
    if (headerMatches(headers[i], aliases, kind)) return i;
  }
  return -1;
}

function uniqueColumnMap(headers) {
  const serialIdx = matchHeaderIndex(headers, HEADER_ALIASES.serial, "serial");
  const actionIdx = matchHeaderIndex(headers, HEADER_ALIASES.action, "action");
  const unitIdx = matchHeaderIndex(headers, HEADER_ALIASES.unit, "unit");
  const unitCostIdx = matchHeaderIndex(headers, HEADER_ALIASES.unitCost, "unitCost");
  const qtyIdx = matchHeaderIndex(headers, HEADER_ALIASES.quantity, "quantity");
  const budgetIdx = matchHeaderIndex(headers, HEADER_ALIASES.budget, "budget");

  const used = new Map();
  const assign = (key, idx) => {
    if (idx < 0) return -1;
    if (used.has(idx)) return -1;
    used.set(idx, key);
    return idx;
  };

  return {
    serialIdx: assign("serial", serialIdx),
    actionIdx: assign("action", actionIdx),
    unitIdx: assign("unit", unitIdx),
    unitCostIdx: assign("unitCost", unitCostIdx),
    qtyIdx: assign("quantity", qtyIdx),
    budgetIdx: assign("budget", budgetIdx),
    headers,
  };
}

function scoreColumnMap(map) {
  if (map.actionIdx < 0) return 0;
  return (
    (map.serialIdx >= 0 ? 3 : 0) +
    5 +
    (map.unitIdx >= 0 ? 1 : 0) +
    (map.unitCostIdx >= 0 ? 2 : 0) +
    (map.qtyIdx >= 0 ? 2 : 0) +
    (map.budgetIdx >= 0 ? 3 : 0)
  );
}

function excelColumnLetter(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function readExcelCell(cell) {
  if (!cell) return { text: "", number: null, formula: null };
  const formula = cell.f ? String(cell.f) : null;
  let value = cell.v;
  if (value === undefined || value === null || value === "") {
    if (cell.w) value = cell.w;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { text: String(value), number: value, formula };
  }
  const text = cellText(value);
  return { text, number: parsePlanNumber(value), formula };
}

function readSheetMatrix(sheet) {
  const ref = sheet["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const rows = [];
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const addr = XLSX.utils.encode_cell({ r, c });
      row.push(readExcelCell(sheet[addr]));
    }
    rows.push(row);
  }
  return rows;
}

function isSubTotalLabel(text) {
  return /sub[\s_-]*totals?/i.test(text);
}

function isGrandTotalLabel(text) {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return /^(gtotal|grandtotal|total|gtotalinpkrs|grandtotalinpkrs)$/i.test(normalized) || /gtotalinpkrs/i.test(normalized);
}

function isIntegerCode(code) {
  return /^\d+$/.test(code);
}

function isSubActionCode(code) {
  return /^\d+(\.\d+)+$/.test(code);
}

function parentCodeFrom(code) {
  const parts = String(code).split(".");
  return parts.slice(0, -1).join(".");
}

function mappingSummary(columnMap) {
  const label = (idx, name) =>
    idx >= 0 ? `${name} -> ${excelColumnLetter(idx)}` : `${name} -> not detected`;
  return [
    label(columnMap.serialIdx, "S. No"),
    label(columnMap.actionIdx, "Action"),
    label(columnMap.unitIdx, "Unit"),
    label(columnMap.unitCostIdx, "Unit Cost"),
    label(columnMap.qtyIdx, "Qty"),
    label(columnMap.budgetIdx, "Estimated Budget"),
  ].join("\n");
}

export function detectNtfpHeaderRow(matrix) {
  let best = null;

  for (let i = 0; i < Math.min(matrix.length, 30); i += 1) {
    const headers = (matrix[i] || []).map((cell) => normalizeNtfpHeader(cell?.text ?? cell));
    const columnMap = uniqueColumnMap(headers);
    const score = scoreColumnMap(columnMap);
    if (score < 8 || columnMap.actionIdx < 0) continue;
    if (!best || score > best.score) {
      best = { headerIndex: i, columnMap, score };
    }
  }

  return best;
}

function pickSheet(workbook) {
  return (
    workbook.SheetNames.find((s) => /action|plan|matrix|walnut|honey/i.test(s)) || workbook.SheetNames[0]
  );
}

export function parseNtfpWorkbookBuffer(buffer, fileName = "action-plan.xlsx") {
  const name = String(fileName || "").toLowerCase();
  const workbook = name.endsWith(".csv") || name.endsWith(".txt")
    ? XLSX.read(buffer, { type: typeof buffer === "string" ? "string" : "array" })
    : XLSX.read(buffer, {
        type: buffer instanceof ArrayBuffer || buffer instanceof Uint8Array ? "array" : "buffer",
        cellFormula: true,
        cellNF: true,
        cellDates: false,
      });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("The uploaded file has no sheets.");
  }

  const sheetName = pickSheet(workbook);
  const sheet = workbook.Sheets[sheetName];
  const matrix = readSheetMatrix(sheet);

  if (!matrix.length) {
    throw new Error("The worksheet contains no readable rows.");
  }

  const detected = detectNtfpHeaderRow(matrix);
  if (!detected) {
    throw new Error(
      "Could not detect the standard Action Plan header row (S. No, Action, Unit, Unit Cost, Qty, Estimated Budget). Make sure the header row contains those column titles and the Action column is named Action — not a document title."
    );
  }

  const { headerIndex, columnMap } = detected;
  const dataRows = [];

  for (let r = headerIndex + 1; r < matrix.length; r += 1) {
    const row = matrix[r] || [];
    const serialCell = columnMap.serialIdx >= 0 ? row[columnMap.serialIdx] : null;
    const actionCell = row[columnMap.actionIdx];
    const unitCell = columnMap.unitIdx >= 0 ? row[columnMap.unitIdx] : null;
    const unitCostCell = columnMap.unitCostIdx >= 0 ? row[columnMap.unitCostIdx] : null;
    const qtyCell = columnMap.qtyIdx >= 0 ? row[columnMap.qtyIdx] : null;
    const budgetCell = columnMap.budgetIdx >= 0 ? row[columnMap.budgetIdx] : null;

    const serial = cellText(serialCell?.text);
    const action = cellText(actionCell?.text);
    const unit = cellText(unitCell?.text);
    const unitCost = unitCostCell?.number ?? parsePlanNumber(unitCostCell?.text);
    const quantity = qtyCell?.number ?? parsePlanNumber(qtyCell?.text);
    let budget = budgetCell?.number ?? parsePlanNumber(budgetCell?.text);
    const budgetFormula = budgetCell?.formula || null;

    if (budget == null && budgetFormula && unitCost != null && quantity != null) {
      budget = unitCost * quantity;
    }

    if (!serial && !action && unitCost == null && quantity == null && budget == null) {
      continue;
    }

    dataRows.push({
      sourceRow: r + 1,
      serial,
      action,
      unit,
      unitCost,
      quantity,
      budget,
      budgetFormula,
    });
  }

  return {
    sheetName,
    headerIndex,
    columnMap,
    rows: dataRows,
    fileName,
  };
}

export function readActionPlanWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const name = file.name.toLowerCase();
        const result = name.endsWith(".csv") || name.endsWith(".txt")
          ? parseNtfpWorkbookBuffer(reader.result, file.name)
          : parseNtfpWorkbookBuffer(new Uint8Array(reader.result), file.name);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file from disk."));

    if (file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

function failedImport(workbook, message, extra = {}) {
  return {
    items: [],
    calculatedBudget: 0,
    calculatedGrandTotalPKR: 0,
    sourceGrandTotalPKR: null,
    validationDifferencePKR: null,
    validationStatus: "failed",
    mappingError: message,
    groupCount: 0,
    activityCount: 0,
    groupsWithSourceSubtotal: 0,
    warnings: [message],
    formulaMismatches: [],
    subtotalMismatches: [],
    features: extra.features || {},
    featureChecks: extra.featureChecks || [],
    previewGroups: [],
    detectedColumns: extra.detectedColumns || (workbook ? mappingSummary(workbook.columnMap) : ""),
    sheetName: workbook?.sheetName,
    sourceFileName: workbook?.fileName,
    rowCount: workbook?.rows?.length || 0,
    headerRow: workbook ? workbook.headerIndex + 1 : null,
  };
}

export async function parseNtfpActionPlanFile(file) {
  const workbook = await readActionPlanWorkbook(file);
  return buildParsedActionPlan(workbook);
}

export function parseNtfpActionPlanFromBuffer(buffer, fileName = "action-plan.xlsx") {
  return buildParsedActionPlan(parseNtfpWorkbookBuffer(buffer, fileName));
}

function buildParsedActionPlan(workbook) {
  const timestamp = new Date().toISOString();
  const items = [];
  const warnings = [];
  const formulaMismatches = [];
  const subtotalMismatches = [];

  let currentGroupCode = null;
  let currentGroupName = null;
  let blankLineCounter = 0;
  let sourceGrandTotalPKR = null;
  let groupsWithSourceSubtotal = 0;
  let passedGrandTotal = false;

  const features = {
    standardColumnsDetected: true,
    actionHierarchyDetected: false,
    unitsDetected: false,
    quantitiesDetected: false,
    unitCostsDetected: false,
    budgetsDetected: false,
    subTotalsDetected: false,
    grandTotalDetected: false,
    blankLineItemsPreserved: false,
  };

  workbook.rows.forEach((row) => {
    const { serial, action, unit, unitCost, quantity, budget, sourceRow } = row;
    const code = String(serial || "").trim();
    const title = String(action || "").trim();

    if (!code && !title) return;
    if (passedGrandTotal) return;

    if (isGrandTotalLabel(title) || isGrandTotalLabel(code)) {
      sourceGrandTotalPKR = budget ?? unitCost ?? quantity ?? sourceGrandTotalPKR;
      features.grandTotalDetected = sourceGrandTotalPKR != null;
      passedGrandTotal = true;
      return;
    }

    if (isSubTotalLabel(title) || isSubTotalLabel(code)) {
      features.subTotalsDetected = true;
      if (currentGroupCode) {
        const group = items.find((i) => !i.parentActionCode && i.actionCode === currentGroupCode);
        if (group && budget != null) {
          group.sourceSubtotalPKR = budget;
          groupsWithSourceSubtotal += 1;
        }
      }
      return;
    }

    if (unit) features.unitsDetected = true;
    if (quantity != null) features.quantitiesDetected = true;
    if (unitCost != null) features.unitCostsDetected = true;
    if (budget != null) features.budgetsDetected = true;

    if (code && isIntegerCode(code) && title) {
      currentGroupCode = code;
      currentGroupName = title;
      blankLineCounter = 0;
      features.actionHierarchyDetected = true;
      items.push({
        id: newId(),
        actionCode: currentGroupCode,
        parentActionCode: undefined,
        actionGroup: currentGroupName,
        actionTitle: currentGroupName,
        status: "not_started",
        sourceRow,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return;
    }

    if (code && isSubActionCode(code) && title) {
      const mainCode = parentCodeFrom(code).split(".")[0];
      currentGroupCode = mainCode;
      blankLineCounter = 0;

      if (!items.some((i) => !i.parentActionCode && i.actionCode === currentGroupCode)) {
        currentGroupName = `Main Action ${currentGroupCode}`;
        items.push({
          id: newId(),
          actionCode: currentGroupCode,
          parentActionCode: undefined,
          actionGroup: currentGroupName,
          actionTitle: currentGroupName,
          status: "not_started",
          sourceRow,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      const parentGroup = items.find((i) => !i.parentActionCode && i.actionCode === currentGroupCode);
      currentGroupName = parentGroup?.actionTitle || currentGroupName;

      let estimatedBudgetPKR = budget;
      const calculated = unitCost != null && quantity != null ? unitCost * quantity : null;
      if (calculated != null && budget != null && Math.abs(calculated - budget) > 1) {
        formulaMismatches.push({
          actionCode: code,
          title,
          unitCost,
          quantity,
          sourceBudget: budget,
          calculated,
        });
      }
      if (estimatedBudgetPKR == null && calculated != null) {
        estimatedBudgetPKR = calculated;
      }

      features.actionHierarchyDetected = true;
      items.push({
        id: newId(),
        actionCode: code,
        parentActionCode: currentGroupCode,
        actionGroup: currentGroupName,
        actionTitle: title,
        unit: unit || undefined,
        unitCostPKR: unitCost ?? undefined,
        targetQuantity: quantity ?? undefined,
        plannedQuantity: quantity ?? undefined,
        plannedBudgetPKR: estimatedBudgetPKR ?? 0,
        estimatedBudgetPKR: estimatedBudgetPKR ?? 0,
        status: "not_started",
        sourceRow,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return;
    }

    if (!code && title && currentGroupCode) {
      blankLineCounter += 1;
      features.blankLineItemsPreserved = true;
      features.actionHierarchyDetected = true;
      let estimatedBudgetPKR = budget;
      if (estimatedBudgetPKR == null && unitCost != null && quantity != null) {
        estimatedBudgetPKR = unitCost * quantity;
      }
      items.push({
        id: newId(),
        actionCode: `${currentGroupCode}.L${blankLineCounter}`,
        generatedLineCode: `${currentGroupCode}.L${blankLineCounter}`,
        parentActionCode: currentGroupCode,
        actionGroup: currentGroupName,
        actionTitle: title,
        unit: unit || undefined,
        unitCostPKR: unitCost ?? undefined,
        targetQuantity: quantity ?? undefined,
        plannedQuantity: quantity ?? undefined,
        plannedBudgetPKR: estimatedBudgetPKR ?? 0,
        estimatedBudgetPKR: estimatedBudgetPKR ?? 0,
        status: "not_started",
        sourceRow,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  });

  const groups = items.filter((i) => !i.parentActionCode);
  const activities = items.filter((i) => Boolean(i.parentActionCode));

  groups.forEach((group) => {
    const children = activities.filter((i) => i.parentActionCode === group.actionCode);
    const calculated = children.reduce((sum, i) => sum + (i.plannedBudgetPKR || 0), 0);
    group.calculatedSubtotalPKR = calculated;
    group.totalActivities = children.length;
    if (group.sourceSubtotalPKR != null && Math.abs(group.sourceSubtotalPKR - calculated) > 100) {
      subtotalMismatches.push({
        actionCode: group.actionCode,
        title: group.actionTitle,
        source: group.sourceSubtotalPKR,
        calculated,
        difference: calculated - group.sourceSubtotalPKR,
      });
    }
  });

  const calculatedGrandTotalPKR = activities.reduce((sum, i) => sum + (i.plannedBudgetPKR || 0), 0);
  const numericTitles = activities.filter((i) => isNumericOnlyTitle(i.actionTitle));

  if (activities.length === 0) {
    return failedImport(
      workbook,
      "No detailed activities could be parsed. Check that the file uses the standard Action Plan columns: S. No, Action, Unit, Unit Cost, Qty, Estimated Budget.",
      { detectedColumns: mappingSummary(workbook.columnMap) }
    );
  }

  if (numericTitles.length >= Math.max(3, activities.length * 0.4)) {
    return failedImport(
      workbook,
      `Action Plan Import Failed\n\nThe Action column could not be read correctly.\nNo activities were saved.\n\nDetected columns:\n${mappingSummary(workbook.columnMap)}\n\nActivities must use the Action column text, not S. No / 1.1 / 1.2 codes.`,
      { detectedColumns: mappingSummary(workbook.columnMap) }
    );
  }

  if (calculatedGrandTotalPKR > 0 && calculatedGrandTotalPKR < 10000 && activities.length > 10) {
    return failedImport(
      workbook,
      `Action Plan Import Failed\n\nThe Estimated Budget column was not read correctly (calculated total PKR ${calculatedGrandTotalPKR.toLocaleString()}). Budgets must come from Unit Cost × Qty or the Estimated Budget column, never from S. No values.`,
      { detectedColumns: mappingSummary(workbook.columnMap) }
    );
  }

  if (formulaMismatches.length > 0) {
    warnings.push(
      `${formulaMismatches.length} activit${formulaMismatches.length === 1 ? "y has" : "ies have"} Unit Cost × Qty that differs from Estimated Budget. Source budget values were retained.`
    );
  }

  if (subtotalMismatches.length > 0) {
    warnings.push(
      `${subtotalMismatches.length} Main Action subtotal(s) differ from the sum of child activities.`
    );
  }

  let validationDifferencePKR = null;
  let validationStatus = "passed";

  if (sourceGrandTotalPKR != null) {
    validationDifferencePKR = calculatedGrandTotalPKR - sourceGrandTotalPKR;
    if (Math.abs(validationDifferencePKR) > 100) {
      validationStatus = "warning";
      warnings.push(
        `Calculated Action Plan budget (PKR ${calculatedGrandTotalPKR.toLocaleString()}) does not match the Excel Grand Total (PKR ${sourceGrandTotalPKR.toLocaleString()}). Difference: PKR ${validationDifferencePKR.toLocaleString()}.`
      );
    }
  }

  const featureChecks = [
    { key: "standardColumnsDetected", label: "Standard columns detected", passed: true },
    { key: "actionHierarchyDetected", label: "Action hierarchy detected", passed: features.actionHierarchyDetected },
    { key: "unitsDetected", label: "Units detected", passed: features.unitsDetected },
    { key: "quantitiesDetected", label: "Quantities detected", passed: features.quantitiesDetected },
    { key: "unitCostsDetected", label: "Unit costs detected", passed: features.unitCostsDetected },
    { key: "budgetsDetected", label: "Budgets detected", passed: features.budgetsDetected },
    { key: "subTotalsDetected", label: "Sub-totals detected", passed: features.subTotalsDetected },
    { key: "grandTotalDetected", label: "Grand total detected", passed: features.grandTotalDetected },
    {
      key: "blankLineItemsPreserved",
      label: "Blank-code line items preserved",
      passed: features.blankLineItemsPreserved,
      optional: true,
    },
    {
      key: "budgetValidation",
      label: validationStatus === "passed" ? "Budget validation passed" : "Budget validation warning",
      passed: validationStatus === "passed",
    },
  ];

  const previewGroups = groups.map((group) => {
    const groupActivities = activities.filter((i) => i.parentActionCode === group.actionCode);
    return {
      actionCode: group.actionCode,
      title: group.actionTitle,
      activityCount: groupActivities.length,
      plannedBudgetPKR: group.calculatedSubtotalPKR || 0,
      sourceSubtotalPKR: group.sourceSubtotalPKR,
      activities: groupActivities.map((a) => ({
        actionCode: a.actionCode,
        title: a.actionTitle,
        unit: a.unit,
        unitCostPKR: a.unitCostPKR,
        plannedQuantity: a.targetQuantity,
        estimatedBudgetPKR: a.plannedBudgetPKR,
      })),
    };
  });

  return {
    items,
    calculatedBudget: calculatedGrandTotalPKR,
    calculatedGrandTotalPKR,
    sourceGrandTotalPKR,
    validationDifferencePKR,
    validationStatus,
    mappingError: null,
    detectedColumns: mappingSummary(workbook.columnMap),
    groupCount: groups.length,
    activityCount: activities.length,
    groupsWithSourceSubtotal,
    warnings,
    formulaMismatches,
    subtotalMismatches,
    features,
    featureChecks,
    previewGroups,
    sheetName: workbook.sheetName,
    sourceFileName: workbook.fileName,
    rowCount: workbook.rows.length,
    headerRow: workbook.headerIndex + 1,
  };
}

export function applyNtfpImport(data, valueChainId, parsed, options = {}) {
  if (!parsed || parsed.validationStatus === "failed" || parsed.mappingError) {
    throw new Error(parsed?.mappingError || "Action Plan import failed validation. No activities were saved.");
  }

  const timestamp = new Date().toISOString();
  const warnings = [...(parsed.warnings || [])];
  const documentTotal = options.documentTotal;
  const importRemark = options.importRemark || "";

  if (documentTotal != null && Math.abs(Number(documentTotal) - parsed.calculatedBudget) > 100) {
    warnings.push(
      `Calculated Budget (PKR ${parsed.calculatedBudget.toLocaleString()}) differs from specified total (PKR ${Number(documentTotal).toLocaleString()}).`
    );
  }

  const versionId = newId();
  const items = parsed.items.map((item) => ({ ...item, valueChainId, actionPlanVersionId: versionId }));

  const existingVersions = (data.ntfpActionPlanVersions || []).filter((v) => v.valueChainId === valueChainId);
  const versionNumber = existingVersions.length + 1;

  const versions = (data.ntfpActionPlanVersions || []).map((v) =>
    v.valueChainId === valueChainId ? { ...v, isCurrent: false, status: "superseded" } : v
  );

  versions.push({
    id: versionId,
    valueChainId,
    title: parsed.sourceFileName || "Imported Action Plan",
    versionLabel: `Version ${versionNumber}`,
    versionNumber,
    status: "active",
    sourceFileName: parsed.sourceFileName,
    sourceSheetName: parsed.sheetName,
    sourceGrandTotalPKR: parsed.sourceGrandTotalPKR ?? undefined,
    calculatedGrandTotalPKR: parsed.calculatedGrandTotalPKR,
    validationDifferencePKR: parsed.validationDifferencePKR ?? undefined,
    validationStatus: parsed.validationStatus || "passed",
    plannedBudgetPKR: parsed.calculatedBudget,
    isCurrent: true,
    remarks: importRemark || undefined,
    uploadedAt: timestamp,
    activatedAt: timestamp,
  });

  const chains = (data.ntfpValueChains || []).map((c) =>
    c.id === valueChainId
      ? {
          ...c,
          status: "action_plan_available",
          actionPlanStatus: "available",
          implementationStatus: c.implementationStatus === "not_started" ? "in_progress" : c.implementationStatus,
          activeActionPlanVersionId: versionId,
          actionPlanPeriod: c.actionPlanPeriod || new Date().getFullYear().toString(),
          updatedAt: timestamp,
          lastUpdatedAt: timestamp,
        }
      : c
  );

  const remainingItems = (data.ntfpActionItems || []).filter((i) => i.valueChainId !== valueChainId);

  const statusUpdate = {
    id: newId(),
    valueChainId,
    updateType: "action_plan",
    previousValue: data.ntfpValueChains.find((c) => c.id === valueChainId)?.actionPlanStatus,
    newValue: "available",
    date: timestamp.slice(0, 10),
    remarks: importRemark || `Imported ${parsed.activityCount} activities from ${parsed.sourceFileName}`,
    createdBy: "system",
    createdAt: timestamp,
  };

  return {
    data: {
      ...data,
      ntfpValueChains: chains,
      ntfpActionPlanVersions: versions,
      ntfpActionItems: [...remainingItems, ...items],
      ntfpStatusUpdates: [...(data.ntfpStatusUpdates || []), statusUpdate],
    },
    warnings,
    versionId,
  };
}
