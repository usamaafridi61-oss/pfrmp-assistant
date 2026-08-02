import * as XLSX from "xlsx";
import { importBtaspWorkbook, isBtaspWorkbook, readWorkbookFromFile } from "@/lib/btaspWorkbook";

export const IMPORT_CONFIG = {
  btasp_workbook: {
    label: "BTASP Monitoring Workbook (full)",
    required: [],
    description:
      'Imports "Over all Monitoring sheet" + "Lists" (e.g. BTASP internal monitoring workbook).',
  },
  divisions: { label: "Forest Divisions", required: ["division_id", "division_name"] },
  planning_units: { label: "Planning Units", required: ["planning_unit_id", "planning_unit_name", "division_id"] },
  interventions_master: { label: "PFRMP Interventions Master", required: ["intervention_id", "intervention_name"] },
  targets: { label: "Targets", required: ["planning_unit_id", "intervention_id", "target_value"] },
  progress_updates: { label: "Progress Updates", required: ["planning_unit_id", "intervention_id", "date", "achieved_increment"] },
};

export function normalizeKey(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatExcelDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && value > 0) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const month = String(parsed.m).padStart(2, "0");
      const day = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${month}-${day}`;
    }
  }
  return String(value ?? "").trim();
}

export function normalizeRows(rawRows) {
  return rawRows.map((row) => {
    const item = {};
    Object.keys(row).forEach((key) => {
      item[normalizeKey(key)] = row[key];
    });
    return item;
  });
}

export function getRowColumns(rows) {
  const columns = new Set();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });
  return [...columns];
}

export function parseWorkbookFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const name = file.name.toLowerCase();
        const workbook =
          name.endsWith(".csv") || name.endsWith(".txt")
            ? XLSX.read(reader.result, { type: "string" })
            : XLSX.read(new Uint8Array(reader.result), { type: "array" });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("Workbook has no sheets."));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(normalizeRows(rawRows));
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

export function buildImportRecords(importType, rows) {
  switch (importType) {
    case "divisions":
      return rows
        .map((r) => ({
          id: String(r.division_id ?? "").trim(),
          name: String(r.division_name ?? "").trim(),
        }))
        .filter((r) => r.id && r.name);
    case "planning_units":
      return rows
        .map((r) => ({
          id: String(r.planning_unit_id ?? "").trim(),
          name: String(r.planning_unit_name ?? "").trim(),
          divisionId: String(r.division_id ?? "").trim(),
        }))
        .filter((r) => r.id && r.name && r.divisionId);
    case "interventions_master":
      return rows
        .map((r) => ({
          id: String(r.intervention_id ?? "").trim(),
          name: String(r.intervention_name ?? "").trim(),
          unit: String(r.unit || "unit").trim(),
        }))
        .filter((r) => r.id && r.name);
    case "targets":
      return rows
        .map((r) => ({
          id: newId(),
          planningUnitId: String(r.planning_unit_id ?? "").trim(),
          interventionId: String(r.intervention_id ?? "").trim(),
          targetValue: toNumber(r.target_value),
          fiscalYear: String(r.fiscal_year || "").trim(),
        }))
        .filter((r) => r.planningUnitId && r.interventionId && r.targetValue > 0);
    case "progress_updates":
      return rows
        .map((r) => ({
          id: newId(),
          planningUnitId: String(r.planning_unit_id ?? "").trim(),
          interventionId: String(r.intervention_id ?? "").trim(),
          date: formatExcelDate(r.date),
          achievedIncrement: toNumber(r.achieved_increment),
          partnerName: String(r.partner_name || "").trim(),
          remarks: String(r.remarks || "").trim(),
        }))
        .filter((r) => r.planningUnitId && r.interventionId && r.date && r.achievedIncrement > 0);
    default:
      return [];
  }
}

const DATA_KEY_BY_IMPORT_TYPE = {
  divisions: "divisions",
  planning_units: "planningUnits",
  interventions_master: "interventionsMaster",
  targets: "targets",
  progress_updates: "progressUpdates",
};

export function getDataKeyForImportType(importType) {
  return DATA_KEY_BY_IMPORT_TYPE[importType];
}

export async function runImport(importType, file, existingData = null) {
  const config = IMPORT_CONFIG[importType];
  if (!config) {
    return { ok: false, message: "Unknown import type." };
  }

  if (importType === "btasp_workbook") {
    return importBtaspWorkbook(file, existingData);
  }

  const workbook = await readWorkbookFromFile(file);
  if (isBtaspWorkbook(workbook)) {
    return {
      ok: false,
      message:
        'This file is a BTASP monitoring workbook. Select dataset "BTASP Monitoring Workbook (full)" and import again.',
    };
  }

  const rows = await parseWorkbookFile(file);
  if (!rows.length) {
    return { ok: false, message: "File has no data rows." };
  }

  const columns = getRowColumns(rows);
  const missing = config.required.filter((col) => !columns.includes(col));
  if (missing.length) {
    return {
      ok: false,
      message: `Missing required columns: ${missing.join(", ")}. Found: ${columns.join(", ") || "(none)"}.`,
    };
  }

  const records = buildImportRecords(importType, rows);
  if (!records.length) {
    return {
      ok: false,
      message: `No valid records found in ${rows.length} row(s). Check that required fields are filled and match the selected dataset (${config.label}).`,
    };
  }

  const dataKey = getDataKeyForImportType(importType);
  return {
    ok: true,
    dataKey,
    records,
    message: `Imported ${records.length} record(s) into ${config.label} (${rows.length} row(s) in file).`,
  };
}
