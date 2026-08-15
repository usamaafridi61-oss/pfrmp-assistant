import * as XLSX from "xlsx";
import { parseNtfpActionPlanFromBuffer } from "../src/lib/ntfp/import.js";

function rowsForGroup(code, title, activities) {
  const out = [[code, title, "", "", "", ""]];
  let subtotal = 0;
  activities.forEach((act) => {
    const budget = act.cost * act.qty;
    subtotal += budget;
    out.push([act.code || "", act.title, act.unit, act.cost, act.qty, budget]);
  });
  out.push(["", "Sub-Total", "", "", "", subtotal]);
  return { rows: out, subtotal, count: activities.length };
}

const groups = [
  {
    code: 1,
    title: "Systematic mechanism for documenting walnut tree populations and production",
    activities: [
      { code: "1.1", title: "Development of data collection mechanism", unit: "Stakeholder meeting/Report", cost: 250000, qty: 1 },
      { code: "1.2", title: "Development of data collection tools", unit: "Tools", cost: 200000, qty: 1 },
      { code: "1.3", title: "Field data collection", unit: "Survey", cost: 700000, qty: 1 },
      { code: "1.4", title: "Database development", unit: "System", cost: 700000, qty: 1 },
      { code: "1.5", title: "Reporting", unit: "Report", cost: 700000, qty: 1 },
    ],
  },
  {
    code: 2,
    title: "Collecting Walnut Trade Flow Data",
    activities: [
      { code: "2.1", title: "Market mapping", unit: "Study", cost: 470000, qty: 1 },
      { code: "2.2", title: "Price monitoring", unit: "Bulletin", cost: 470000, qty: 1 },
      { code: "2.3", title: "Trader interviews", unit: "Survey", cost: 470000, qty: 1 },
      { code: "2.4", title: "Data analysis", unit: "Report", cost: 470000, qty: 1 },
      { code: "2.5", title: "Dissemination", unit: "Report", cost: 470000, qty: 1 },
    ],
  },
  {
    code: 3,
    title: "Strengthening Capacity of Nursery Operators (Government / Private)",
    activities: [
      { code: "3.1", title: "Nursery assessment", unit: "Assessment", cost: 200000, qty: 1 },
      { code: "3.2", title: "Curriculum development", unit: "Manual", cost: 500000, qty: 1 },
      { code: "3.3", title: "Capacity building training for private nursery owners and government owned nurseries", unit: "Training", cost: 4750000, qty: 2 },
      { code: "3.4", title: "Provision of nursery inputs", unit: "Kit", cost: 30000, qty: 50 },
      { code: "3.5", title: "Follow-up support", unit: "Visit", cost: 500000, qty: 1 },
    ],
  },
  {
    code: 4,
    title: "Effective management of walnut trees",
    activities: [
      { code: "4.1", title: "FEG formation", unit: "Group", cost: 200000, qty: 4 },
      { code: "4.2", title: "Awareness sessions on improved walnut trees management/Training and practical demonstration in pruning, irrigation, and pest control.", unit: "Training", cost: 300000, qty: 1 },
      { code: "", title: "Provision of Management kits", unit: "Kit", cost: 10000, qty: 200 },
      { code: "4.3", title: "Exposure visits", unit: "Visit", cost: 2700000, qty: 1 },
    ],
  },
  {
    code: 5,
    title: "Commercial production and distribution of certified walnut plants to farmers",
    activities: [
      { code: "5.1", title: "Scion orchard", unit: "Orchard", cost: 200000, qty: 1 },
      { code: "5.2", title: "Certification", unit: "Process", cost: 300000, qty: 1 },
      { code: "5.3", title: "Plant distribution", unit: "Plant", cost: 500, qty: 2000 },
      { code: "5.4", title: "Farmer support", unit: "Package", cost: 300000, qty: 1 },
    ],
  },
  {
    code: 6,
    title: "Introducing Walnut Kernels in consumer packaging with organic labeling",
    activities: [
      { code: "6.1", title: "Brand design", unit: "Pack", cost: 500000, qty: 1 },
      { code: "6.2", title: "Packaging unit 1", unit: "Unit", cost: 1500000, qty: 1 },
      { code: "6.3", title: "Packaging unit 2", unit: "Unit", cost: 1500000, qty: 1 },
      { code: "6.4", title: "Packaging unit 3", unit: "Unit", cost: 1500000, qty: 1 },
      { code: "6.5", title: "Packaging unit 4", unit: "Unit", cost: 1500000, qty: 1 },
      { code: "6.6", title: "Label printing", unit: "Batch", cost: 1500000, qty: 1 },
      { code: "6.7", title: "Women group support", unit: "Workshop", cost: 1500000, qty: 1 },
      { code: "6.8", title: "Formation and strengthening of Farmers Enterprise Groups (FEGs)", unit: "Group", cost: 1200000, qty: 3 },
    ],
  },
  {
    code: 7,
    title: "Developing Market Expansion Strategy for Walnut Kernels in Bulk Selling",
    activities: [
      { code: "7.1", title: "Buyer roundtables", unit: "Event", cost: 1000000, qty: 1 },
      { code: "7.2", title: "Supplier catalog", unit: "Catalog", cost: 1000000, qty: 1 },
    ],
  },
  {
    code: 8,
    title: "Explore the feasibility of developing value-added walnut products",
    activities: [
      { code: "8.1", title: "Feasibility study", unit: "Study", cost: 525000, qty: 1 },
      { code: "8.2", title: "Lab testing", unit: "Test", cost: 525000, qty: 1 },
      { code: "8.3", title: "Pilot line 1", unit: "Line", cost: 525000, qty: 1 },
      { code: "8.4", title: "Pilot line 2", unit: "Line", cost: 525000, qty: 1 },
    ],
  },
  {
    code: 9,
    title: "Promoting walnut uses in the food industry",
    activities: [
      { code: "9.1", title: "Campaign", unit: "Campaign", cost: 500000, qty: 1 },
      { code: "9.2", title: "Organizing Exhibition/mela", unit: "Event", cost: 1500000, qty: 2 },
      { code: "9.3", title: "Partnerships", unit: "MoU", cost: 3000000, qty: 1 },
    ],
  },
  {
    code: 10,
    title: "Participation in trade shows / exhibitions / melas to showcase walnut products",
    activities: [
      { code: "10.1", title: "Expo pavilion", unit: "Pavilion", cost: 1000000, qty: 1 },
      { code: "10.2", title: "Support package for association (bottles, packing box, printing material, auto press machine, etc.)", unit: "Package", cost: 300000, qty: 10 },
    ],
  },
];

const aoa = [
  ["Walnut Value Chain Action Plan", "", "Unit", "Unit Cost (PKRs)", "Qty.", "Estimated Budget (PKRs)"],
  ["S. No", "Action", "Unit", "Unit Cost (PKRs)", "Qty.", "Estimated Budget (PKRs)"],
];

let grand = 0;
let activityCount = 0;
groups.forEach((g) => {
  const built = rowsForGroup(g.code, g.title, g.activities);
  aoa.push(...built.rows);
  grand += built.subtotal;
  activityCount += built.count;
});
aoa.push(["", "G Total in PKRs", "", "", "", grand]);

const sheet = XLSX.utils.aoa_to_sheet(aoa);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, sheet, "Walnut Action Plan");
const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

const parsed = parseNtfpActionPlanFromBuffer(buffer, "Walnut_Value_Chain_Action_Plan.xlsx");

const titles = Object.fromEntries(
  parsed.items.filter((i) => i.parentActionCode).map((i) => [i.actionCode, i.actionTitle])
);
const act11 = parsed.items.find((i) => i.actionCode === "1.1");
const kits = parsed.items.find((i) => /management kits/i.test(i.actionTitle || ""));
const act34 = parsed.items.find((i) => i.actionCode === "3.4");
const act68 = parsed.items.find((i) => i.actionCode === "6.8");
const act92 = parsed.items.find((i) => i.actionCode === "9.2");
const act102 = parsed.items.find((i) => i.actionCode === "10.2");

const checks = {
  headerRow: parsed.headerRow,
  sheetName: parsed.sheetName,
  validationStatus: parsed.validationStatus,
  groupCount: parsed.groupCount,
  activityCount: parsed.activityCount,
  calculatedGrandTotalPKR: parsed.calculatedGrandTotalPKR,
  sourceGrandTotalPKR: parsed.sourceGrandTotalPKR,
  title11: titles["1.1"],
  title12: titles["1.2"],
  title33: titles["3.3"],
  title42: titles["4.2"],
  kitsTitle: kits?.actionTitle,
  kitsBudget: kits?.plannedBudgetPKR,
  act11: { cost: act11?.unitCostPKR, qty: act11?.targetQuantity, budget: act11?.plannedBudgetPKR },
  act34: { cost: act34?.unitCostPKR, qty: act34?.targetQuantity, budget: act34?.plannedBudgetPKR },
  act68: { cost: act68?.unitCostPKR, qty: act68?.targetQuantity, budget: act68?.plannedBudgetPKR },
  act92: { cost: act92?.unitCostPKR, qty: act92?.targetQuantity, budget: act92?.plannedBudgetPKR },
  act102: { cost: act102?.unitCostPKR, qty: act102?.targetQuantity, budget: act102?.plannedBudgetPKR },
};

const failed = [];
if (parsed.headerRow !== 2) failed.push(`headerRow ${parsed.headerRow} != 2`);
if (parsed.groupCount !== 10) failed.push(`groups ${parsed.groupCount} != 10`);
if (parsed.activityCount !== 42) failed.push(`activities ${parsed.activityCount} != 42`);
if (parsed.calculatedGrandTotalPKR !== 52400000) failed.push(`total ${parsed.calculatedGrandTotalPKR} != 52400000`);
if (titles["1.1"] !== "Development of data collection mechanism") failed.push("1.1 title");
if (titles["1.2"] !== "Development of data collection tools") failed.push("1.2 title");
if (!/Capacity building training for private nursery/.test(titles["3.3"] || "")) failed.push("3.3 title");
if (!/Awareness sessions on improved walnut trees management/.test(titles["4.2"] || "")) failed.push("4.2 title");
if (kits?.plannedBudgetPKR !== 2000000) failed.push("kits budget");
if (act11?.plannedBudgetPKR !== 250000) failed.push("1.1 budget");
if (act34?.plannedBudgetPKR !== 1500000) failed.push("3.4 budget");
if (act68?.plannedBudgetPKR !== 3600000) failed.push("6.8 budget");
if (act92?.plannedBudgetPKR !== 3000000) failed.push("9.2 budget");
if (act102?.plannedBudgetPKR !== 3000000) failed.push("10.2 budget");
if (parsed.validationStatus === "failed") failed.push("import marked failed");

console.log(JSON.stringify({ checks, failed, activityCount }, null, 2));
if (failed.length) {
  console.error("REGRESSION FAILED");
  process.exit(1);
}
console.log("REGRESSION PASSED");
