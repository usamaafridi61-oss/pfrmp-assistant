import * as XLSX from "xlsx";
import { normalizeKey } from "@/lib/import";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toNumber(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

const COLUMN_MAP = {
  module: ["module_#", "module", "module_no"],
  training: ["training_/_extension_subject", "training_extension_subject", "training_subject"],
  intervention: ["intervention_type"],
  facilitator_type: ["facilitator_type"],
  facilitators_per_event: ["facilitator_per_event", "facilitators_per_event"],
  participant_type: ["participant_type"],
  participants_per_event: ["participants_per_event"],
  place: ["place_/_level", "place_level", "place"],
  days: ["days_per_event"],
  events: ["number_of_events", "events"],
  total_participants: ["total_participants"],
  cost_per_event: ["cost_per_event_in_pkrs", "cost_per_event_pkr"],
  total_pkr: ["total_cost_in_pkrs", "total_cost_pkr"],
  total_eur: ["total_cost_in_euro", "total_cost_eur"],
};

function pick(row, keys) {
  for (const key of keys) {
    const val = row[normalizeKey(key)];
    if (val !== undefined && val !== "") return val;
  }
  return "";
}

function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(new Uint8Array(reader.result), { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function normalizeHeaderRow(row) {
  return row.map((cell) => normalizeKey(cell));
}

function findHeaderIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
    const normalized = normalizeHeaderRow(rows[i]);
    if (normalized.some((c) => c.includes("training")) && normalized.some((c) => c.includes("module"))) {
      return i;
    }
  }
  return 0;
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i];
  });
  return obj;
}

function isActivityCode(value) {
  return /^BTASP-\d+/i.test(String(value || "").trim());
}

function isGroupRow(moduleCell, trainingCell) {
  const moduleText = String(moduleCell || "").trim();
  const trainingText = String(trainingCell || "").trim();
  if (isActivityCode(moduleText) || isActivityCode(trainingText)) return false;
  if (/^BTASP\s+\d+/i.test(moduleText)) return true;
  if (/^BTASP\s+\d+/i.test(trainingText) && !/\d+\.\d+/.test(trainingText)) return true;
  return false;
}

function groupFromCells(moduleCell, trainingCell) {
  const moduleText = String(moduleCell || "").trim();
  const trainingText = String(trainingCell || "").trim();
  const name = trainingText || moduleText;
  const match = name.match(/BTASP\s*-?\s*(\d+)/i);
  return {
    moduleGroupName: name,
    moduleGroupCode: match ? `BTASP-${match[1]}` : name.slice(0, 20),
  };
}

export async function parseCapacityBuildingPlan(file) {
  const rows = await readWorkbook(file);
  const headerIndex = findHeaderIndex(rows);
  const headers = normalizeHeaderRow(rows[headerIndex]);
  const timestamp = new Date().toISOString();
  const items = [];
  const warnings = [];

  let currentGroupCode = "";
  let currentGroupName = "";
  let lastItem = null;

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rowToObject(headers, rows[i]);
    const moduleCode = String(pick(row, COLUMN_MAP.module)).trim();
    const trainingSubject = String(pick(row, COLUMN_MAP.training)).trim();

    if (!moduleCode && !trainingSubject) continue;

    if (isGroupRow(moduleCode, trainingSubject)) {
      const group = groupFromCells(moduleCode, trainingSubject);
      currentGroupName = group.moduleGroupName;
      currentGroupCode = group.moduleGroupCode;
      continue;
    }

    if (!moduleCode && trainingSubject && lastItem) {
      lastItem.trainingSubject = `${lastItem.trainingSubject} ${trainingSubject}`.trim();
      continue;
    }

    const plannedEvents = toNumber(pick(row, COLUMN_MAP.events)) || 0;
    const totalPkr = toNumber(pick(row, COLUMN_MAP.total_pkr)) || 0;

    if (String(trainingSubject).toLowerCase().includes("total") && !moduleCode) {
      continue;
    }

    const item = {
      id: newId(),
      moduleGroupCode: currentGroupCode,
      moduleGroupName: currentGroupName,
      moduleCode: moduleCode || `ROW-${i + 1}`,
      trainingSubject,
      interventionType: pick(row, COLUMN_MAP.intervention) || undefined,
      facilitatorType: pick(row, COLUMN_MAP.facilitator_type) || undefined,
      facilitatorsPerEvent: toNumber(pick(row, COLUMN_MAP.facilitators_per_event)),
      participantType: pick(row, COLUMN_MAP.participant_type) || undefined,
      participantsPerEvent: toNumber(pick(row, COLUMN_MAP.participants_per_event)),
      placeLevel: pick(row, COLUMN_MAP.place) || undefined,
      daysPerEvent: toNumber(pick(row, COLUMN_MAP.days)),
      plannedEvents,
      plannedParticipants: toNumber(pick(row, COLUMN_MAP.total_participants)),
      costPerEventPKR: toNumber(pick(row, COLUMN_MAP.cost_per_event)),
      totalPlannedCostPKR: totalPkr,
      totalPlannedCostEUR: toNumber(pick(row, COLUMN_MAP.total_eur)),
      sourceRow: i + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    items.push(item);
    lastItem = item;
  }

  const totals = {
    plannedEvents: items.reduce((s, i) => s + (i.plannedEvents || 0), 0),
    plannedCostPKR: items.reduce((s, i) => s + (i.totalPlannedCostPKR || 0), 0),
    plannedCostEUR: items.reduce((s, i) => s + (i.totalPlannedCostEUR || 0), 0),
  };

  const expected = { plannedEvents: 551, plannedCostPKR: 175276525, plannedCostEUR: 584255 };
  if (Math.abs(totals.plannedEvents - expected.plannedEvents) > 5) {
    warnings.push(
      `Validation Warning: Total planned events (${totals.plannedEvents}) differs from expected workbook total (${expected.plannedEvents}).`
    );
  }
  if (Math.abs(totals.plannedCostPKR - expected.plannedCostPKR) > 1000) {
    warnings.push(
      `Validation Warning: Total planned cost PKR (${totals.plannedCostPKR.toLocaleString()}) differs from expected (${expected.plannedCostPKR.toLocaleString()}).`
    );
  }

  return { items, totals, warnings };
}

export function applyCapacityImport(data, parsed) {
  return {
    ...data,
    capacityPlanItems: parsed.items,
  };
}
