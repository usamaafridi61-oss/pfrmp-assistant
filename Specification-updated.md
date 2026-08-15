# PFRMP Assistant — Additional Modules Specification

## Purpose of this file

This is a **separate companion specification** for the PFRMP Assistant application.

It does **not replace, repeat, modify, or redefine** the existing `specification.md` file.

The existing `specification.md` will remain the source of truth for the current BTASP monitoring workbook, existing interventions, planning-unit screens, current dashboards, manual data entry, guideline references, and all already implemented app behavior.

**Revision note:** The NTFP specification now treats the standard Excel Action Plan format as the source for actions, units, quantities, planned budgets and implementation tracking. The previous rule to ignore NTFP Action Plan budget/cost columns is superseded. The importer is additionally required to pass the supplied Walnut Excel regression fixture (10 Main Actions, 42 executable activities, PKR 52,400,000), map action text strictly from the Action column, handle formula cells safely, and reject numeric-only/malformed imports.

This file defines only the following **new modules and integrations**:

1. **NTFP Value Chains**
2. **Capacity Building**
3. **GIS / Google Maps / Google Earth Engine Integration**

Cursor should treat this file as an **additive implementation specification**. All existing app functions should remain unchanged unless this document explicitly requires a connection with one of the new modules.

---

# 1. Navigation and Existing Overall Icon View

Add three separate primary navigation items:

```text
NTFP Value Chains
Capacity Building
GIS / Spatial Map
```

The **existing overall icon view must remain the same**. Do not redesign, resize, recolor, reorder or replace the current home/dashboard icons while implementing these modules.

If shortcuts to the new modules are added to the icon view, reuse the same existing icon-card component, size, spacing, typography and hover behavior so the new shortcuts look native to the current app.

The internal pages of the three new modules may use the improved UI design defined later in this file.

---

# 2. NTFP Value Chains Module

The NTFP module will monitor six BTASP value chains:

1. Honey Value Chain
2. Walnut Value Chain
3. Black Persimmon Value Chain
4. Wild Pomegranate / Anardana Value Chain
5. Medicinal Plant Value Chain 1 — to be identified
6. Medicinal Plant Value Chain 2 — to be identified

The first four value chains have already been developed as value-chain themes. Detailed Action Plans are currently available for Honey and Walnut. The two medicinal plant value chains still require species/value-chain identification before a Value Chain Report and Action Plan can be prepared.

The NTFP module must track the complete development and implementation sequence:

```text
Species / Value Chain Identification
        ↓
Value Chain Report
        ↓
Action Plan Excel Upload
        ↓
Action Plan Import + Budget Validation
        ↓
Activity Implementation
        ↓
Physical Progress + Financial Progress + Evidence
        ↓
Progress History / Reporting
```

## 2.1 Standard Action Plan Principle

The uploaded `Walnut_Value_Chain_Action_Plan(1).xlsx` defines the **standard reusable NTFP Action Plan Excel structure** for the application.

The importer must be generic. The same parser must work for all current and future NTFP value chains without application-code changes.

Do not write Walnut-specific parsing logic.

All future Action Plans should follow the same general structure:

```text
S. No
Action
Unit
Unit Cost (PKRs)
Qty.
Estimated Budget (PKRs)
```

Allow reasonable header aliases and formatting differences, but preserve the same semantic fields.

---

# 3. Value-Chain Development Status

Do not use one generic `Identified / Not Identified` field.

Use separate status fields so the user can see exactly what has and has not been completed.

## 3.1 Value Chain Report Status

```ts
type ValueChainReportStatus =
  | "not_started"
  | "under_preparation"
  | "completed"
  | "approved";
```

UI labels:

```text
Value Chain Report: Not Started
Value Chain Report: Under Preparation
Value Chain Report: Completed
Value Chain Report: Approved
```

## 3.2 Action Plan Status

```ts
type ActionPlanStatus =
  | "not_started"
  | "under_preparation"
  | "available";
```

`available` means that an approved/current Action Plan is available in the application. If an Excel file has been uploaded, it must also have passed import review before becoming the current active Action Plan version.

## 3.3 Implementation Status

```ts
type ValueChainImplementationStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "delayed";
```

## 3.4 Medicinal Plant Identification Status

Only the two medicinal plant value chains require this extra stage.

```ts
type MedicinalValueChainIdentificationStatus =
  | "pending"
  | "assessment_underway"
  | "shortlisted"
  | "confirmed";
```

---

# 4. Initial Value-Chain Records and Objectives

| Value Chain | Short Objective | Value Chain Report | Action Plan |
|---|---|---|---|
| Honey | Improve technical beekeeping, technology support, women participation, beekeeper institutions, processing, branding, marketing and bee flora. | Completed | Available |
| Walnut | Improve production/trade information, nursery capacity, walnut-tree management, quality planting material, packaging, value addition and market expansion. | Completed | Available |
| Black Persimmon | Develop an organized value chain around production/collection, post-harvest handling, value addition, enterprise development and market linkages. | Completed | Not Available |
| Wild Pomegranate / Anardana | Improve sustainable production/collection, post-harvest handling, processing/value addition, producer organization and market access. | Completed | Not Available |
| Medicinal Plant Value Chain 1 | Identify a priority medicinal plant, prepare its Value Chain Report and Action Plan, then monitor implementation. | Not Started | Not Started |
| Medicinal Plant Value Chain 2 | Identify a second priority medicinal plant, prepare its Value Chain Report and Action Plan, then monitor implementation. | Not Started | Not Started |

For medicinal plant records also show:

```text
Species / Value Chain Identification: Pending
```

All objectives should be editable by an authorized user.

Do not invent detailed Action Plan activities for a value chain whose approved Action Plan has not been uploaded.

---

# 5. NTFP Dashboard

The NTFP dashboard must combine **value-chain development status, Action Plan budget, and implementation progress** without becoming a finance-only dashboard.

Primary KPI cards:

```text
Total Value Chains
Value Chain Reports Completed
Reports Under Preparation
Action Plans Available
Action Plans Under Preparation
Medicinal Value Chains Pending
Total Planned Action Plan Budget
Total Activities
Activities Completed
Activities In Progress
Activities Remaining
Delayed Activities
Overall Physical Progress
```

When actual expenditure data exists, also show:

```text
Actual Expenditure
Budget Utilization
Remaining Budget
```

Financial cards should be hidden or shown as `No expenditure data` when no actual expenditure has been recorded. Do not display zero expenditure as if it has been formally reported unless zero was explicitly recorded.

Value-chain card example:

```text
WALNUT VALUE CHAIN

Improve production, nursery capacity, tree management,
quality planting material, value addition and market access.

Value Chain Report     ● Completed
Action Plan            ● Available
Implementation         ● In Progress

Planned Budget         PKR 52.40 M
Activities             18 / 42 completed
Physical Progress      █████░░░░░ 43%
Last Update            14 Aug 2026

[Open Value Chain]   [Update Progress]
```

Medicinal plant card example:

```text
MEDICINAL PLANT VALUE CHAIN 1

Species / Value Chain  ● Identification Pending
Value Chain Report     ○ Not Started
Action Plan            ○ Not Started
Implementation         ○ Not Started

[Update Identification]   [Open Record]
```

Do not overload value-chain cards with unit costs, line-item budgets, or evidence. Those belong in the Action Plan detail page.

---

# 6. Manual Update System for Value-Chain Development

Provide one main action:

```text
[Update Value Chain]
```

The user chooses the update type.

## 6.1 Update Value Chain Report

```text
Value Chain
Report Status
Date
Remarks
Upload Draft / Final Report
```

## 6.2 Update Action Plan Status / Upload Action Plan

```text
Value Chain
Action Plan Status
Date
Remarks
Upload Action Plan Excel
```

When an Excel Action Plan is uploaded, do not immediately convert it into the active plan.

Required workflow:

```text
Upload Excel
    ↓
Parse Standard Structure
    ↓
Validate Actions / Units / Quantities / Budgets
    ↓
Show Import Review
    ↓
User Confirms
    ↓
Create New Action Plan Version
    ↓
Set as Active Plan
```

## 6.3 Update Medicinal Plant Identification

```text
Identification Status
Common / Local Name
Scientific Name
Assessment Area
Region
Forest Division
Assessment Date
Assessment Team
Remarks
Supporting Document
```

When `Identification Status = Confirmed`, allow the user to rename the existing placeholder record rather than creating a new unrelated record.

Example:

```text
Medicinal Plant Value Chain 1
        ↓
Valeriana jatamansi Value Chain
```

The historical identification/update records must remain attached.

## 6.4 Status History

```ts
interface ValueChainStatusUpdate {
  id: string;
  valueChainId: string;
  updateType:
    | "identification"
    | "value_chain_report"
    | "action_plan"
    | "implementation";
  previousValue?: string;
  newValue: string;
  date: string;
  remarks?: string;
  attachmentIds?: string[];
  createdBy: string;
  createdAt: string;
}
```

---

# 7. NTFP Master Data Model

```ts
interface NtfpValueChain {
  id: string;
  sequence: number;
  name: string;
  scientificName?: string;
  objective: string;

  identificationStatus:
    | "not_required"
    | "pending"
    | "assessment_underway"
    | "shortlisted"
    | "confirmed";

  valueChainReportStatus:
    | "not_started"
    | "under_preparation"
    | "completed"
    | "approved";

  actionPlanStatus:
    | "not_started"
    | "under_preparation"
    | "available";

  implementationStatus:
    | "not_started"
    | "in_progress"
    | "completed"
    | "delayed";

  assessmentArea?: string;
  regionIds?: string[];
  divisionIds?: string[];

  valueChainReportDocumentId?: string;
  activeActionPlanVersionId?: string;
  identificationDocumentIds?: string[];

  totalPlannedBudgetPKR?: number;
  actualExpenditurePKR?: number;
  overallPhysicalProgressPercent?: number;

  remarks?: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}
```

Financial summary fields are derived from the active Action Plan and progress/expenditure records; they must not be manually maintained independently where a derived value is possible.

---

# 8. Standard NTFP Action Plan Excel Format

The standard NTFP Action Plan workbook uses six core columns:

```text
S. No
Action
Unit
Unit Cost (PKRs)
Qty.
Estimated Budget (PKRs)
```

The current Walnut Action Plan contains:

```text
Main Action rows
Sub-Action rows
Additional line-item rows where S. No may be blank
Sub-Total rows
Grand Total row
```

The Walnut source workbook has 10 Main Actions and a Grand Total of **PKR 52,400,000**. This value is a validation reference for that uploaded workbook only; do not hardcode it as a generic value-chain budget.

## 8.1 Header Aliases

Allow minor variations without requiring exact capitalization or punctuation.

Examples:

```text
S. No / S.No / S. No. / Serial No.
Qty. / Qty / Quantity
Unit Cost (PKRs) / Unit Cost / Unit Cost PKR
Estimated Budget (PKRs) / Estimated Budget / Budget / Planned Budget
```

The importer should trim whitespace and normalize common header variants.

## 8.2 Main Actions

Rows such as:

```text
1
2
3
4
```

with an Action title and normally blank Unit/Cost/Quantity fields represent **Main Actions / Action Groups**.

## 8.3 Sub-Actions

Rows such as:

```text
1.1
1.2
1.3
2.1
2.2
```

represent implementation activities under their parent Main Action.

## 8.4 Additional Line Items

If the `S. No` cell is blank but the `Action` cell contains a meaningful activity between a numbered sub-action and the current Main Action subtotal, preserve that row as an additional child activity of the current Main Action.

Example from the Walnut format:

```text
4.2 Awareness sessions / practical demonstration ...
    Provision of Management kits
4.3 Exposure visits ...
```

`Provision of Management kits` must become an activity record. It must not be lost because its `S. No` cell is blank.

Generate an internal stable line identifier without changing the displayed source wording.

## 8.5 Sub-Total Rows

Rows labelled `Sub-Total`, `Subtotal`, or equivalent represent the planned budget subtotal for the current Main Action.

Store the source subtotal and also calculate the subtotal from child activities.

## 8.6 Grand Total Rows

Rows such as:

```text
G Total in PKRs
Grand Total
Total
```

at the end of the plan represent the source Action Plan total.

Store the source total and calculate an independent total from imported activity budgets.

---

# 9. NTFP Action Plan Import Workflow

Accepted primary format:

```text
XLSX
```

CSV may be supported as a secondary format when it preserves the standard columns. PDF/DOCX may remain attachable as reference documents but must not be treated as equivalent to the standard structured Excel importer unless a reliable extraction workflow is explicitly implemented later.

Importer workflow:

```text
1. Read workbook safely.
2. Detect the relevant Action Plan worksheet.
3. Detect the real header row.
4. Map standard columns using header aliases.
5. Detect Main Actions.
6. Detect numbered Sub-Actions.
7. Detect blank-code additional line items.
8. Detect Sub-Total rows.
9. Detect Grand Total row.
10. Read Unit.
11. Read Unit Cost.
12. Read Planned Quantity.
13. Read Estimated Budget.
14. Validate formula/derived budget where possible.
15. Validate Main Action subtotals.
16. Validate Grand Total.
17. Show Import Review.
18. Save only after user confirmation.
19. Create a versioned Action Plan record.
20. Set the selected version as active.
```

## 9.1 Import Review UI

Example:

```text
WALNUT VALUE CHAIN
Action Plan Import Review

Main Actions                 10
Implementation Activities   42
Source Grand Total           PKR 52,400,000
Calculated Grand Total       PKR 52,400,000

✓ Standard columns detected
✓ Action hierarchy detected
✓ Units detected
✓ Quantities detected
✓ Budget validation passed

[Review Actions]   [Cancel]   [Import Action Plan]
```

For other value chains, values must come from the uploaded workbook.

## 9.2 Validation Warnings

Do not silently modify inconsistent source data.

Example:

```text
Budget Validation Warning

The calculated Action Plan budget does not match the total
contained in the uploaded Excel file.

Excel Total:       PKR ______
Calculated Total:  PKR ______
Difference:        PKR ______

[Review Differences]   [Cancel Import]   [Import with Warning]
```

Importing with a warning must require explicit user confirmation and an optional remark.

## 9.3 Excel Formula Handling

Where the workbook provides values or formulas, derive/check:

```text
Estimated Budget = Unit Cost × Qty.
```

Do not overwrite the source Estimated Budget automatically if it differs. Retain the source value and report the validation difference.

## 9.4 CRITICAL IMPORTER IMPLEMENTATION RULE — ACTION TEXT MUST COME FROM THE ACTION COLUMN

This rule is mandatory because a failed importer that reads only numeric cells produces unusable results.

After the header row is detected, the importer must map columns **by normalized header name**, not by data type, column position guesses, numeric density, or the first non-empty value.

For the standard workbook the canonical mapping is:

```text
S. No                     -> sourceCode
Action                    -> activityTitle / mainActionTitle
Unit                      -> unit
Unit Cost (PKRs)          -> unitCostPKR
Qty.                      -> plannedQuantity
Estimated Budget (PKRs)   -> estimatedBudgetPKR
```

**The value displayed as the Action/Activity name must always come from the `Action` column.**

Never display any of the following as an activity title:

```text
S. No value
Unit Cost
Quantity
Estimated Budget
Excel row number
formula result
```

If the detected `Action` column is missing, blank for most executable rows, or resolves to numeric-only values, the import must fail with a clear mapping error instead of creating records.

Example validation error:

```text
Action Plan Import Failed

The Action column could not be read correctly.
No activities were saved.

Detected columns:
S. No -> A
Action -> B
Unit -> C
Unit Cost -> D
Qty -> E
Estimated Budget -> F

[Review Column Mapping] [Cancel]
```

## 9.5 Exact Row Classification Algorithm

After column mapping, classify each data row using the following order. The order matters.

Normalize `sourceCode` as trimmed text before classification. Do not coerce codes such as `1.1` into numeric quantities.

```ts
function classifyNtfpRow(row) {
  const code = String(row.sourceCode ?? "").trim();
  const title = String(row.action ?? "").trim();
  const normalizedCode = code.toLowerCase().replace(/[\s_-]+/g, "");

  if (!code && !title) return "empty";

  if (/^(g?total|grandtotal|gtotalinpkrs)$/i.test(normalizedCode)) {
    return "grand_total";
  }

  if (/^subtotal$/i.test(normalizedCode)) {
    return "subtotal";
  }

  if (/^\d+$/.test(code) && title) {
    return "main_action";
  }

  if (/^\d+\.\d+$/.test(code) && title) {
    return "activity";
  }

  if (!code && title && currentMainActionId) {
    return "additional_activity";
  }

  return "metadata_or_unknown";
}
```

Important:

- `1`, `2`, `3` etc. are Main Action codes, not quantities.
- `1.1`, `1.2`, `3.4` etc. are source activity codes and must be preserved as text.
- A blank `S. No` does not mean a row should be discarded if the Action cell contains a real activity.
- `Sub-Total` rows are not activities.
- `G Total in PKRs` is not an activity.
- Footer/source-note rows after the Grand Total are metadata and must not be imported.

## 9.6 Required Numeric Parsing

Only the following mapped fields may be parsed as numeric plan values:

```text
Unit Cost (PKRs)
Qty.
Estimated Budget (PKRs)
```

Use robust numeric parsing:

```ts
function parsePlanNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const cleaned = String(value)
    .replace(/PKR|PKRs|Rs\.?/gi, "")
    .replace(/,/g, "")
    .trim();

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}
```

Do not sum the `S. No` column. Do not sum action codes. Do not use Qty as budget. Do not treat a row count or code count as currency.

## 9.7 Formula Cells and Cached Values

The standard Excel may store Estimated Budget and subtotal/total cells as formulas.

Example:

```text
F4 = D4 * E4
F9 = SUM(F4:F8)
```

The importer must not treat the formula string itself as the budget.

For an executable activity:

```ts
calculatedActivityBudget = unitCostPKR * plannedQuantity;
```

Use the cached Excel value from `Estimated Budget` when available, but always calculate `unitCostPKR * plannedQuantity` independently for validation. If a formula cell has no cached value in the runtime/library being used, use the independently calculated value for the imported numeric budget while preserving the original formula/source cell metadata if needed.

For subtotal and grand-total rows, calculate totals from imported child activity budgets even if formula evaluation is unavailable.

Therefore the app must work correctly even when the JavaScript Excel library does **not** evaluate formulas.

## 9.8 Mandatory Walnut Regression Fixture

The uploaded `Walnut_Value_Chain_Action_Plan(1).xlsx` is the mandatory regression fixture for the generic NTFP importer.

A correct import of this file must produce exactly:

```text
Worksheet:               Walnut Action Plan
Header row:              2
Main Actions:            10
Executable Activities:   42
Additional blank-code activities: 1
Sub-Total rows:          10
Grand Total rows:        1
Calculated Grand Total:  PKR 52,400,000
Source Grand Total:      PKR 52,400,000
```

Expected Main Action budgets:

```text
1   PKR  2,550,000
2   PKR  2,350,000
3   PKR 12,200,000
4   PKR  5,800,000
5   PKR  1,800,000
6   PKR 13,100,000
7   PKR  2,000,000
8   PKR  2,100,000
9   PKR  6,500,000
10  PKR  4,000,000
-----------------------
TOTAL PKR 52,400,000
```

Expected activity counts by Main Action:

```text
Action 1  -> 5 activities
Action 2  -> 5 activities
Action 3  -> 5 activities
Action 4  -> 4 activities (includes blank-code "Provision of Management kits")
Action 5  -> 4 activities
Action 6  -> 8 activities
Action 7  -> 2 activities
Action 8  -> 4 activities
Action 9  -> 3 activities
Action 10 -> 2 activities
TOTAL     -> 42 activities
```

Mandatory title checks:

```text
1.1 -> Development of data collection mechanism
1.2 -> Development of data collection tools
3.3 -> Capacity building training for private nursery owners and government owned nurseries
4.2 -> Awareness sessions on improved walnut trees management/Training and practical demonstration in pruning, irrigation, and pest control.
blank code under Action 4 -> Provision of Management kits
6.8 -> Formation and strengthening of Farmers Enterprise Groups (FEGs)
9.2 -> Organizing Exhibition/mela
10.2 -> Support package for association (bottles, packing box, printing material, auto press machine, etc.)
```

Mandatory numeric checks:

```text
1.1 Unit Cost = 250,000; Qty = 1; Budget = 250,000
3.4 Unit Cost = 30,000; Qty = 50; Budget = 1,500,000
blank-code Management kits Unit Cost = 10,000; Qty = 200; Budget = 2,000,000
5.3 Unit Cost = 500; Qty = 2,000; Budget = 1,000,000
6.8 Unit Cost = 1,200,000; Qty = 3; Budget = 3,600,000
9.2 Unit Cost = 1,500,000; Qty = 2; Budget = 3,000,000
10.2 Unit Cost = 300,000; Qty = 10; Budget = 3,000,000
```

If any of these regression checks fail, the Walnut import is considered broken and the Action Plan must not be activated.

A result such as:

```text
Actions displayed only as numbers
Total budget = 270
Missing Action column text
Main Actions shown as executable activities
Subtotals shown as activities
```

is an explicit **failed import**, not an acceptable partial import.

## 9.9 Import Preview Must Show Real Action Text

The Import Review must show at least the first 10 parsed rows before the user can confirm import.

Example:

```text
Code   Action                                                        Unit                         Qty   Budget
1      Systematic mechanism for documenting walnut tree populations  Main Action                    -        -
1.1    Development of data collection mechanism                      Stakeholder meeting/Report     1   250,000
1.2    Development of data collection tools                          Tools                          1   100,000
1.3    Data collection, compilation and organization                 Survey                         2 1,000,000
...
```

If the preview shows numeric-only Action values, disable the Import button and show a mapping/parser error.

## 9.10 Safe Replace Behavior for a Previously Broken Import

When a value chain already contains a malformed Action Plan import, provide:

```text
[Re-import Action Plan]
```

Re-import workflow:

```text
1. Parse the newly uploaded/current source file using the corrected importer.
2. Run all validation checks.
3. Show the full Import Review.
4. If the existing active version contains no valid progress/evidence, allow replacing that malformed version after user confirmation.
5. If the existing version contains progress/evidence, create a new corrected version and offer explicit mapping/carry-forward by matching valid action codes.
6. Never attach old progress to the wrong numeric-only records automatically.
```

---

# 10. NTFP Action Plan Hierarchy and Data Models

## 10.1 Action Plan Version

```ts
interface NtfpActionPlanVersion {
  id: string;
  valueChainId: string;
  versionNumber: number;
  status: "draft" | "active" | "superseded" | "archived";

  sourceFileId: string;
  sourceFileName: string;
  sourceSheetName?: string;

  sourceGrandTotalPKR?: number;
  calculatedGrandTotalPKR?: number;
  validationDifferencePKR?: number;
  validationStatus: "passed" | "warning" | "failed";

  remarks?: string;
  uploadedBy: string;
  uploadedAt: string;
  activatedAt?: string;
}
```

## 10.2 Main Action / Action Group

```ts
interface NtfpActionGroup {
  id: string;
  valueChainId: string;
  actionPlanVersionId: string;

  actionCode: string;
  title: string;
  sequence: number;

  sourceSubtotalPKR?: number;
  calculatedSubtotalPKR?: number;

  progressPercent: number;
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  remainingActivities: number;
  delayedActivities: number;
}
```

## 10.3 Activity / Line Item

```ts
interface NtfpActionActivity {
  id: string;
  valueChainId: string;
  actionPlanVersionId: string;
  actionGroupId: string;

  actionCode?: string;
  generatedLineCode?: string;
  sourceRow?: number;
  sequence: number;

  activityTitle: string;
  description?: string;
  unit?: string;

  unitCostPKR?: number;
  plannedQuantity?: number;
  estimatedBudgetPKR?: number;

  completedQuantity?: number;
  manualProgressPercent?: number;
  progressPercent: number;

  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "delayed"
    | "cancelled";

  actualExpenditurePKR?: number;

  regionId?: string;
  divisionId?: string;
  planningUnitId?: string;
  locationText?: string;

  remarks?: string;
  evidenceAttachmentIds?: string[];

  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}
```

Rows with zero Unit Cost / zero Qty / zero Budget are valid and must still be imported when they represent a legitimate activity, for example activities described as covered under another action.

---

# 11. NTFP Action Plan Detail UI

The user should not need to reopen Excel to understand the Action Plan.

Recommended top summary:

```text
WALNUT VALUE CHAIN

Planned Budget          PKR 52.40 M
Physical Progress       43%
Activities Completed    18 / 42
In Progress             9
Remaining               15
Delayed                 value
```

When expenditure exists:

```text
Actual Expenditure      PKR value
Budget Utilization      value %
Remaining Budget        PKR value
```

Use expandable Main Action cards rather than a giant raw spreadsheet.

Example collapsed Action Group:

```text
1. Systematic Mechanism for Documenting Walnut Tree Populations and Production

Planned Budget       PKR 2,550,000
Activities           5
Completed            2
In Progress          1
Remaining            2
Physical Progress    48%

[View Activities]
```

Expanded activity view:

```text
Code | Action | Unit | Unit Cost | Planned Qty | Budget | Completed Qty | Progress | Status | Action
```

Each row must have:

```text
[Update Progress]
```

On mobile, render activities as stacked cards rather than forcing a wide horizontal table.

---

# 12. Physical Progress Recording

The core monitoring concept is:

```text
ACTION PLAN
     ↓
PLANNED ACTION
     ↓
PLANNED QUANTITY + PLANNED BUDGET
     ↓
ACTUAL IMPLEMENTATION
     ↓
PHYSICAL PROGRESS + EVIDENCE
```

The user must be able to answer immediately:

```text
What was planned?
What was the planned quantity?
How much was budgeted?
Has implementation started?
How much has been completed?
What remains?
What evidence exists?
```

## 12.1 Update Progress Drawer

Use a right-side drawer on desktop and a full-height bottom sheet/modal on mobile.

Example:

```text
UPDATE ACTION PROGRESS

Value Chain
Walnut

Action
3.3 Capacity building training for nursery operators

Planned Unit
Training (25 person/training)

Planned Quantity
2

Completed Quantity
1

Physical Progress
50%

Status
In Progress

Date
____________

Region
____________

Forest Division
____________

Planning Unit
____________

Location
____________

Remarks
____________

Evidence
[Upload Photos / Report / Document]

Actual Expenditure
____________   optional

[Cancel]      [Save Progress]
```

## 12.2 Progress History

Every progress update must be appended to history rather than overwriting the previous update.

```ts
interface NtfpActivityProgressUpdate {
  id: string;
  activityId: string;
  date: string;

  completedQuantity?: number;
  manualProgressPercent?: number;
  resultingProgressPercent: number;
  status: "not_started" | "in_progress" | "completed" | "delayed" | "cancelled";

  actualExpenditureIncrementPKR?: number;
  actualExpenditureCumulativePKR?: number;

  regionId?: string;
  divisionId?: string;
  planningUnitId?: string;
  locationText?: string;

  remarks?: string;
  evidenceAttachmentIds?: string[];

  createdBy: string;
  createdAt: string;
}
```

Do not silently replace historical quantities, progress, expenditure, remarks, or evidence.

## 12.3 Evidence Types

Allow attachments such as:

```text
Photos
Progress Report
Training Report
Attendance Sheet
Procurement Document
Distribution Record
Field Verification
Market Assessment
Survey / Database Output
Other Supporting Document
```

---

# 13. Budget and Financial Progress

Budget is now an explicit part of the NTFP Action Plan module.

For each executable activity preserve:

```text
Unit
Unit Cost
Planned Quantity
Estimated Budget
```

Actual expenditure is a monitoring field and may be optional until financial data is available.

## 13.1 Keep Physical and Financial Progress Separate

Never calculate physical progress from expenditure.

Example:

```text
Physical Progress       60%
Budget Utilization      35%
```

These values can legitimately differ.

Spending 80% of the budget does not mean an activity is 80% physically complete.

## 13.2 Budget Calculations

Where sufficient values exist:

```ts
plannedBudgetPKR = estimatedBudgetPKR;

budgetUtilizationPercent =
  plannedBudgetPKR && plannedBudgetPKR > 0 && actualExpenditurePKR != null
    ? (actualExpenditurePKR / plannedBudgetPKR) * 100
    : undefined;

remainingBudgetPKR =
  actualExpenditurePKR != null
    ? plannedBudgetPKR - actualExpenditurePKR
    : undefined;
```

Do not cap actual expenditure at planned budget. Over-expenditure should remain visible and trigger a warning.

## 13.3 Over-Budget Warning

If:

```text
Actual Expenditure > Planned Budget
```

show:

```text
Budget Overrun
Actual expenditure exceeds the planned budget by PKR ______.
```

Do not block progress recording automatically.

---

# 14. Progress and Aggregation Logic

## 14.1 Activity Physical Progress

When a measurable planned quantity exists and quantity-based monitoring is meaningful:

```ts
progressPercent =
  plannedQuantity && plannedQuantity > 0 && completedQuantity != null
    ? Math.min((completedQuantity / plannedQuantity) * 100, 100)
    : manualProgressPercent ?? 0;
```

If quantity is zero, absent, text-only, or not meaningful for completion measurement, allow manual physical progress percentage.

Status should not be inferred only from percentage; the user can explicitly mark delayed/cancelled where needed.

## 14.2 Remaining Quantity

Where numeric quantities exist:

```ts
remainingQuantity = Math.max(plannedQuantity - completedQuantity, 0);
```

## 14.3 Main Action Progress

Default Main Action physical progress:

```ts
mainActionProgress = average(latest progressPercent of active child activities);
```

Also display:

```text
Completed Activities / Total Activities
In Progress Activities
Remaining Activities
Delayed Activities
```

Do not use budget weighting for physical progress unless a separate future project rule explicitly requires it.

## 14.4 Overall Value-Chain Progress

Default overall physical progress:

```ts
overallValueChainProgress =
  average(latest progressPercent for all active Action Plan activities);
```

Keep this separate from overall budget utilization.

## 14.5 Main Action Budget

```ts
calculatedMainActionBudget = sum(estimatedBudgetPKR of child activities);
```

Compare with the Excel `Sub-Total` row when available.

## 14.6 Action Plan Grand Total

```ts
calculatedActionPlanBudget = sum(estimatedBudgetPKR of all imported activities);
```

Compare with the workbook Grand Total when available.

---

# 15. NTFP Detail Page

Tabs:

```text
Overview
Action Plan
Progress
Budget
Documents
History
```

## 15.1 Overview

Show:

```text
Objective
Species / Product
Value Chain Report Status
Action Plan Status
Action Plan Version
Implementation Status
Total Planned Budget
Overall Physical Progress
Activities Completed / Total
Last Update
```

If actual expenditure exists, also show:

```text
Actual Expenditure
Budget Utilization
Remaining Budget
```

## 15.2 Action Plan

Primary structure:

```text
Main Action expandable cards
    ↓
Activity rows / cards
```

Desktop table columns:

```text
Code
Action
Unit
Unit Cost
Planned Qty
Estimated Budget
Completed Qty
Progress
Status
Last Update
Action
```

Allow column hiding on smaller desktop widths.

## 15.3 Progress

Show:

```text
Progress by Main Action
Completed vs Remaining Activities
Delayed Activities
Recent Progress Updates
Evidence Timeline
```

## 15.4 Budget

Show:

```text
Planned Budget by Main Action
Actual Expenditure by Main Action
Budget Utilization
Remaining Budget
Activities Over Budget
```

Only display actual-expenditure charts when expenditure data exists.

---

# 16. Action Plan Versioning and Future Value Chains

Every revised Action Plan upload must create a new plan version or an explicit user-approved revision.

Never silently destroy the previous plan.

Example:

```text
Action Plan Version 1
Action Plan Version 2
Action Plan Version 3
```

Store:

```text
Version
Upload Date
Uploaded By
Source File
Source Grand Total
Calculated Grand Total
Validation Status
Remarks
Status
```

## 16.1 Carrying Progress Forward

When a revised Action Plan contains matching Action Codes, offer a review screen that can carry historical progress links forward.

Do not automatically transfer progress when:

```text
Action meaning changed materially
Action Code was reassigned
Quantity/unit changed in a way that changes interpretation
User chooses not to carry forward
```

Historical progress must remain attached to the original plan version even when references are carried forward.

## 16.2 Standard Format for All Future NTFP Value Chains

The same standard importer must work for:

```text
Honey
Walnut
Black Persimmon
Wild Pomegranate / Anardana
Medicinal Plant Value Chain 1
Medicinal Plant Value Chain 2
Any future NTFP Value Chain
```

Required generic flow:

```text
Upload Standard Excel
        ↓
Detect Columns
        ↓
Detect Main Actions
        ↓
Detect Sub-Actions / Line Items
        ↓
Read Units / Costs / Quantities / Budgets
        ↓
Validate Subtotals / Grand Total
        ↓
Import Version
        ↓
Track Physical Progress
        ↓
Track Optional Actual Expenditure
        ↓
Evidence + Reporting
```

Do not require code changes simply because a new value-chain name is introduced.

## 16.3 Value Chains Without an Action Plan

For Black Persimmon, Anardana, medicinal plants, or any other value chain with no approved Action Plan, show:

```text
Value Chain Report: Completed / current status
Action Plan: Not Available
Implementation: Not Started

No approved Action Plan has been uploaded.
Upload the standard NTFP Action Plan Excel file when it becomes available.

[Upload Action Plan]
```

Do not invent actions or budgets.

---

# 17. NTFP Reports

NTFP reports should include both physical and financial plan information.

Core report fields:

```text
Value Chain
Value Chain Report Status
Action Plan Status
Action Plan Version
Implementation Status
Main Action
Action Code
Activity
Unit
Unit Cost
Planned Quantity
Completed Quantity
Estimated Budget
Actual Expenditure where available
Physical Progress
Budget Utilization where available
Status
Last Update
Evidence
```

Recommended reports:

```text
Value Chain Summary
Action Plan Budget Summary
Main Action Summary
Activity-wise Planned vs Completed
Physical Progress by Value Chain
Physical Progress by Main Action
Completed vs Remaining Activities
Delayed Activities
Progress Over Time
Budget Utilization by Value Chain
Budget Utilization by Main Action
Over-Budget Activities
Evidence Register
Action Plan Version History
```

Charts:

```text
Physical Progress by Value Chain
Completed vs Remaining Activities
Main Action Physical Progress
Progress Over Time
Planned Budget by Main Action
Planned vs Actual Expenditure where actual data exists
Delayed Activities
```

Physical-progress charts and financial-progress charts must remain clearly labelled as different measures.

---

# 18. Capacity Building Module

The Capacity Building module must use the **uploaded BTASP Global Capacity Building Plan** as the master source of planned events.

The current plan contains **551 planned events** under nine groups.

The app must answer:

```text
Which activities are planned?
How many events are planned for each activity?
How many are completed?
How many remain?
Which events are scheduled?
Which activities have not started?
Where were completed events held?
Who participated?
What evidence is available?
```

The activity names and planned event counts must come from the Excel plan, not from generic categories.

---

# 19. Capacity Building Plan — Exact Event Register

The following is the initial master register from the uploaded Capacity Building Plan.

**Overall planned events: 551**

### BTASP 1 - Capacity Building for Territorial Forest Department

**Planned total:** 24 events; 620 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-1.1 | Understanding of project outputs and Interventions | Workshop | Conservator to SDFOs | Regional level | 1 | 2 | 50 |
| BTASP-1.2 | Training on Financial reporting and compliance of BTASP | Workshop and on the job training | DFO & Accountants of DFO Office | Regional level | 2 | 2 | 52 |
| BTASP-1.3 | Project Management and Cycle | Workshop | CCF, CF and DFO | Provincial level | 2 | 1 | 22 |
| BTASP-1.4 | Monitoring and evaluation of project intervention | On the job training | Field Staff of DFO Office | Regional level | 2 | 2 | 48 |
| BTASP-1.5 | Use of GPS and GIS technology in NRM | On the job training | DFO and SDFOs | Regional level | 2 | 2 | 50 |
| BTASP-1.6 | Training on BTASP Implementation Guidelines | Workshop and on the job training | DFO and SDFOs | Regional level | 2 | 2 | 50 |
| BTASP-1.7 | Forest Fire Prevention & Fire Management | Workshop / Practical Training / Equipment | Staff of DFO Office | Circle level | 2 | 3 | 75 |
| BTASP-1.8 | ESMF, Tools + Implementation + reporting | Workshop / Practical Training | CF, DFO and SDFO | Regional level | 2 | 2 | 60 |
| BTASP-1.9 | Community Mobilisation and PRA tools | Workshop / Practical Training | DFO + CDOs | Provincial level | 2 | 2 | 60 |
| BTASP-1.10 | Report Writing Preparation of Participatory Forestry Resource Management Plan (PFRMP) | Workshop | DFO, SDFO and CDO | Regional level | 2 | 2 | 52 |
| BTASP-1.11 | Conflict Management, DO NO Harm- approach | Workshop | DFO and CDOs | Provincial level | 1 | 1 | 26 |
| BTASP-1.12 | Climate Change Adaptation and Mitigation - with special focus on communal forest interventions | Workshop | CF, DFO | Provinsical Lever | 2 | 1 | 25 |
| BTASP-1.13 | Rangeland mgt., Sustainable Community Forestry, | Workshop / Practical Training | DFO & SDFO | Regional level | 2 | 2 | 50 |

### BTASP 2 - Para-Professional Staff (Deputy Ranger , Forester, FFEs, Forest Guard)

**Planned total:** 14 events; 420 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-2.1 | Forest Fire Management | On the job training | Forester + F Guard+ CDOs + VDC/WO | Regional level | 2 | 2 | 60 |
| BTASP-2.2 | E&S Safeguards tools, risk assessments & reporting | Workshop / Practical Training | Forester + F Guard+ CDOs + VDC/WO | Regional Level | 2 | 2 | 60 |
| BTASP-2.3 | Plantation & Nursery raising & management according to BTASP implementation guidelines | On the job training | Forester + F Guard+ CDOs + VDC/WO | Regional Level | 2 | 2 | 60 |
| BTASP-2.4 | Basic Forestry (Sustainable Management of Communal Forest) Forest Inventory | On the job training | Forester + F Guard+ CDOs + VDC/WO | Regional Level | 4 | 2 | 60 |
| BTASP-2.5 | Accounts & Procedure | On the job training | Accountant and Clerical Staff of DFO Office | Regional Level | 2 | 2 | 60 |
| BTASP-2.6 | Climate Change Adaptation and Mitigation - with special focus on communal forest interventions | Workshop/Pract ical Sessions | Forester + F Guard+ CDOs + VDC/WO | Regional Level | 1 | 2 | 60 |
| BTASP-2.7 | Refresher on seed collection, storage and quality control | On the job training | Forester + F Guard+ VDC/WO | Regional Level | 1 | 2 | 60 |

### BTASP 3 - Capacity Building  for CEDGAD (Peshawar)

**Planned total:** 5 events; 125 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-3.1 | PRA, Communication training for CEDGAD | On the job training | AD & CDOs | Regional level | 3 | 2 | 50 |
| BTASP-3.2 | Training on FPIC and ESMF process for CEDGAD | Workshop / Practical Training | AD & CDOs | Regional level | 2 | 2 | 50 |
| BTASP-3.3 | Risk Assessment and Mitigation Measures | Workshop / Practical Training | AD & CDOs | Provincial level | 1 | 1 | 25 |

### BTASP 4 - Capacity Building for Community Organisations

**Planned total:** 409 events; 6645 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-4.1 (a) | Community Management & Leadership Skills (CMLST) | On the job training | VDC Office Bearers | PU Level | 2 | 100 | 1000 |
| BTASP-4.1 (b) | Community Management & Leadership Skills (CMLST) | On the job training | WO Office Bearers | PU Level | 2 | 100 | 1000 |
| BTASP-4.2 | FPIC, ESMF & GRM Basic understanding | Sessions | VDC/WO (13 events for men and 13 for Women) | Divisional Level | 1 | 26 | 780 |
| BTASP-4.3 | Training on Local NTFPs (Pre and Post Harvest Training) | On the job training | NTFPs collectors | PU Level | 2 | 100 | 2000 |
| BTASP-4.4 | NTFP's value addition of the six selected NTFPs | Workshop and on the job training | NTFPs Directorate and Local Entrepreneurs | Regional level | 3 | 2 | 50 |
| BTASP-4.5 | Spring shed Management (6 days training in 3 sessions, Each session 2 days) | On the job training | Forest Guard + Forest Warden + VDC Representative | Divisional Leven | 2 | 39 | 780 |
| BTASP-4.6 | Climate Change Adaptation and Mitigation - with special focus on communal forest interventions | TOT training VDC and WO | Forest Guard + Forest Warden + VDC Representative | Circle level | 2 | 3 | 60 |
| BTASP-4.7 | Basic Forestry (Sustainable Management of Communal Forest) (6 days training in 3 sessions, Each session 2 days) | On the job training | Forest Guard + Forest Warden + VDC Representative | Divisional Leven | 4 | 39 | 975 |

### BTASP 5 - Capacity Building of Direct Beneficiaries

**Planned total:** 42 events; 1195 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-5.1 | Nursery raising and Management | On the job training | Nursery owners/ operatives | Divisional Level | 2 | 13 | 325 |
| BTASP-5.2 | Roles & Responsibilities of Community Wardens | On the job training | Community Wardens | Divisional Level | 2 | 13 | 390 |
| BTASP-5.3 | Women Livelihood improvement | On the job training | WO Nominations | Circle level | 2 | 4 | 120 |
| BTASP-5.4 | Grafting & Fruit Orchard (For Potential PUs only) | On the job training | VDC/WO Nominations | Circle level | 2 | 4 | 120 |
| BTASP-5.5 | Apiculture (For Potential PUs only) | On the job training | VDC/WO Nominations | Circle level | 2 | 4 | 120 |
| BTASP-5.6 | Handicraft (For Potential PUs only) | On the job training | WO Nominations | Circle level | 2 | 4 | 120 |

### BTASP 6 - Training for PMU project managers

**Planned total:** 9 events; 155 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-6.1 | Project administration, Procedure and Reporting | Workshop | CCF/ PMU /PIC/ | Provincial Level | 2 | 1 | 15 |
| BTASP-6.2 | ESMF, Tools + Implementation + reporting GRM Mgt. | Workshop | CCF/ PMU /PIC/ | Provincial Level | 1 | 1 | 15 |
| BTASP-6.3 | Climate Change Adaptation and Mitigation - with special focus on communal forest interventions | Workshop | CCF/ PMU /PIC/ | Provincial Level | 1 | 1 | 15 |
| BTASP-6.4 | Leadership and International Project Management | Workshop | DFO / PMU | Provincial Level | 2 | 1 | 10 |
| BTASP-6.5 | Internation project management and Implementation | Workshop | CF/ DFO / PMU | Provincial Level | 2 | 1 | 10 |
| BTASP-6.6 | KfW Tender procedures | Workshop | PMU /PIC | Provincial Level | 1 | 1 | 15 |
| BTASP-6.7 | Training on Accounting Software (ERP) | Workshop/On the job training | PIC | Regional level | 2 | 3 | 75 |

### BTASP 7 - Exchange visits

**Planned total:** 16 events; 212 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-7.1 | Exchange visits VDC/WO to Model villages in KP | Exchange visit | VDC and WO | Provincial level | 1 | 10 | 100 |
| BTASP-7.2 | Exchange visits community forest mgt and fire prevention | Exchange visit | DFOs/PMU | Provincial level | 7 | 1 | 20 |
| BTASP-7.3 | Exchange visits NTFP's value addition | Exchange Visit | DFOs/PMU | Provincial level | 7 | 1 | 20 |
| BTASP-7.4 | Exchange visits DFOs/SDFO & CDOs with other terrestrials’ teams (DFOs) 3x a year | Exchange visit | DFO/SDFO/CDO | Divisional Level | 4 | 3 | 60 |
| BTASP-7.5 | Exchange visit international KfW forest project | Exchange visit | DFO/PMU | international | 10 | 1 | 12 |

### BTASP 8 - Operational Meetings & Workshops

**Planned total:** 21 events; 245 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-8.1 | Steering committee meetings | Meetings | PMU, CF, CCF, Director ISU | Provincial level | 1 | 4 | 40 |
| BTASP-8.2 | Bi-annual progress review / visits in one Division | Meetings | PMU, DFO, PIC, CF, ISU | Provincial level | 1 | 6 | 80 |
| BTASP-8.3 | Monthly Progress Meetings | Meetings / Online | PMU, DFO, PIC, ISU | Provincial level | 1 | 10 | 100 |
| BTASP-8.4 | Annual Planning Meeting | Meetings | PMU, DFO, PIC, CF, ISU | Provincial level | 1 | 1 | 25 |

### BTASP 9 - Management Information System

**Planned total:** 11 events; 155 participant places.

| Code | Training / Extension Subject | Intervention Type | Participant Type | Place / Level | Days/Event | Planned Events | Planned Participants |
|---|---|---|---|---|---:|---:|---:|
| BTASP-9.1 | Field monitoring and gadget use | tbd. | Forest Guards & VDC/WO | Circle level | 2 | 3 | 75 |
| BTASP-9.2 | 1st Level MIS use and operations DFO | tbd. | DFO, SDFO | Regional Level | 2 | 2 | 20 |
| BTASP-9.3 | 2nd Level MIS use and operations (PMU, CF, ) | tbd. | PMU, CF | Provincial Level | 2 | 2 | 20 |
| BTASP-9.4 | 3rd Level MIS use and operation (CCF + Secretertiat) | tbd. | CCF and higher Admin | Provincial Level | 2 | 2 | 20 |
| BTASP-9.5 | MIS Administration | tbd. | MIS Administrators | Provincial Level | 2 | 2 | 20 |



---

# 20. Capacity Building Tracking Logic

Each Excel activity row becomes one `CapacityBuildingPlanItem`.

Example:

```text
BTASP-4.3
Training on Local NTFPs (Pre and Post Harvest Training)

Planned Events   100
Completed         32
Remaining         68
Status            In Progress

[Record Event] [View Events]
```

Do not create hundreds of blank event records in advance.

Use:

```text
Plan Item = target from Excel
Actual Event Record = one scheduled/completed event entered by the user
```

---

# 21. Capacity Building Data Model

```ts
interface CapacityBuildingPlanItem {
  id: string;
  moduleGroupCode: string;
  moduleGroupName: string;
  moduleCode: string;
  trainingSubject: string;
  interventionType?: string;
  facilitatorType?: string;
  facilitatorsPerEvent?: number;
  participantType?: string;
  participantsPerEvent?: number;
  placeLevel?: string;
  daysPerEvent?: number;
  plannedEvents: number;
  plannedParticipants?: number;

  // The Excel plan contains cost columns. They may remain imported as
  // optional metadata, but event completion is the primary tracker.
  costPerEventPKR?: number;
  totalPlannedCostPKR?: number;
  totalPlannedCostEUR?: number;

  sourceRow?: number;
  createdAt: string;
  updatedAt: string;
}

interface CapacityBuildingEvent {
  id: string;
  planItemId: string;
  eventSequence?: number;
  status: "scheduled" | "completed" | "postponed" | "cancelled";
  eventDateStart: string;
  eventDateEnd?: string;
  regionId?: string;
  divisionId?: string;
  planningUnitId?: string;
  venue?: string;
  facilitatorNames?: string[];
  actualParticipants?: number;
  maleParticipants?: number;
  femaleParticipants?: number;
  remarks?: string;
  attendanceSheetAttachmentId?: string;
  eventReportAttachmentId?: string;
  photoAttachmentIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

---

# 22. Done / Not Done Logic and Event Entry

```ts
completedEvents = events.filter(e => e.status === "completed").length;
remainingEvents = Math.max(plannedEvents - completedEvents, 0);
eventProgressPercent = plannedEvents > 0
  ? Math.min((completedEvents / plannedEvents) * 100, 100)
  : 0;
```

Derived status:

```text
0 completed + no schedule = Not Started
scheduled but not completed = Scheduled
some completed = In Progress
completed >= planned = Completed
postponed records = Postponed indicator
```

Every activity has:

```text
[Record Event]
```

Event form:

```text
Capacity Building Activity
Event Status
Start Date
End Date
Region
Forest Division
Planning Unit
Venue
Facilitator(s)
Actual Participants
Male Participants
Female Participants
Attendance Sheet
Event Report
Photos
Remarks
```

---

# 23. Capacity Building Dashboard and UI

Primary cards:

```text
Planned Events        551
Completed Events      value
Remaining Events      value
Scheduled Events      value
Overall Completion    value %
Planned Participants  value
Actual Participants   value
```

Group totals from the current Excel plan:

```text
BTASP 1 - Territorial Forest Department                  24
BTASP 2 - Para-Professional Staff                        14
BTASP 3 - CEDGAD                                          5
BTASP 4 - Community Organisations                       409
BTASP 5 - Direct Beneficiaries                           42
BTASP 6 - PMU Project Managers                            9
BTASP 7 - Exchange Visits                                16
BTASP 8 - Operational Meetings & Workshops               21
BTASP 9 - Management Information System                  11
TOTAL                                                    551
```

Default activity view should be a clean card/accordion view rather than a giant Excel-style grid.

Example:

```text
BTASP-4.3
Training on Local NTFPs (Pre and Post Harvest Training)

PU Level · NTFP Collectors · 2 days/event

100 Planned    32 Completed    68 Remaining
██████░░░░░░░░░░ 32%

[Record Event] [View Event Log]
```

Allow `[Card View] [Table View]` on desktop.

---

# 24. Capacity Building Import Rules

Import the full Excel plan exactly as supplied:

```text
Module #
Training / Extension Subject
Intervention Type
Facilitator Type
Facilitator per Event
Participant Type
Participants per Event
Place / Level
Days per Event
Number of Events
Total Participants
Cost per Event
Total Cost PKR
Total Cost EURO
```

Importer:

```text
1. Detect the real header row.
2. Detect nine group rows.
3. Carry the current group into following activity rows.
4. Read every BTASP activity code.
5. Preserve exact activity title.
6. Import event count and participant target.
7. Preserve source row number.
8. Import cost fields as optional metadata.
9. Validate current plan event total = 551.
10. Show Import Review before saving.
11. Preserve plan versions when a revised Excel plan is uploaded.
```

---

# 25. Capacity Building Calendar and Reports

Calendar views:

```text
Month
Week
Agenda
```

Status colors:

```text
Blue    Scheduled
Green   Completed
Amber   Postponed
Grey    Not Yet Scheduled
Red     Delayed where a due date exists
```

Reports:

```text
Plan Group Summary
Activity-wise Planned vs Completed Events
Remaining Events
Completed Event Register
Participant Summary
Region / Division / PU Summary
Upcoming Events
Postponed Events
Evidence Register
```

# 26. GIS / Spatial Map Module

## 26.1 Objective

The GIS module should allow the PFRMP Assistant to display spatial information for:

```text
Planning Unit Boundaries
Plantation Sites
Existing Plantations
Enclosures
Spring-shed Areas
Spring Points
Fire Lines
Nurseries
NTFP Sites
Other Project Interventions
```

The user should be able to upload a shapefile, KML, KMZ or GeoJSON and immediately view it on an interactive map.

---

# 27. Recommended GIS Architecture

Use two separate layers of functionality:

```text
1. Google Maps / interactive web mapping
2. Google Earth Engine / remote-sensing analysis
```

These should not be the same dependency.

### Google Maps / interactive map

Use for:

```text
Displaying PU boundaries
Displaying plantation polygons
Displaying points and lines
Layer visibility
Satellite basemap
Feature popups
Measuring area
Showing coordinates
Linking a map feature to app records
```

### Google Earth Engine

Use for:

```text
NDVI
Vegetation condition
Vegetation change
Satellite imagery comparisons
Land-cover analysis
Zonal statistics inside plantation polygons
```

If Earth Engine is temporarily unavailable, spatial uploads and normal maps must still work.

---

# 28. GIS Map Screen

Add:

```text
GIS / Spatial Map
```

Recommended layout:

```text
--------------------------------------------------------------
| Layers Panel |                                            |
|              |                                            |
| PU Boundary  |             GOOGLE SATELLITE MAP           |
| Plantation   |                                            |
| Spring Shed  |                                            |
| Fire Lines   |                                            |
| NTFP Sites   |                                            |
|              |                                            |
--------------------------------------------------------------
```

Top filters:

```text
Region
Forest Division
Planning Unit
Layer Type
Intervention
Date
```

Map type:

```text
Satellite
Terrain
Road
```

---

# 29. GIS Layer Types

Minimum types:

```ts
type SpatialLayerType =
  | "pu_boundary"
  | "plantation_site"
  | "existing_plantation"
  | "enclosure"
  | "spring_shed"
  | "spring_point"
  | "fire_line"
  | "nursery"
  | "ntfp_site"
  | "value_chain_cluster"
  | "other";
```

---

# 30. Spatial Layer Upload

Add button:

```text
[Upload Spatial Layer]
```

Form:

```text
Layer Name
Layer Type

Region
Forest Division
Planning Unit

Related Project Activity / Intervention

File
```

Supported formats:

```text
ZIP Shapefile
GeoJSON
KML
KMZ
GPX
CSV with coordinates
```

---

# 31. Shapefile Upload

Preferred upload:

```text
Timri_Plantation.zip
```

The ZIP should normally contain:

```text
.shp
.shx
.dbf
.prj
```

Server workflow:

```text
1. Validate ZIP.
2. Safely extract spatial files.
3. Read CRS from .prj.
4. Convert spatial data to WGS84 / EPSG:4326.
5. Validate geometry.
6. Calculate area / length.
7. Convert to GeoJSON for frontend display.
8. Show map preview.
9. User confirms.
10. Store layer.
```

If CRS cannot be identified reliably:

```text
Coordinate System Could Not Be Determined

Please select the correct CRS before continuing.
```

Do not silently guess an unknown projected CRS.

---

# 32. Spatial Data Model

```ts
{
  id: string;

  name: string;

  layerType:
    | "pu_boundary"
    | "plantation_site"
    | "existing_plantation"
    | "enclosure"
    | "spring_shed"
    | "spring_point"
    | "fire_line"
    | "nursery"
    | "ntfp_site"
    | "value_chain_cluster"
    | "other";

  regionId?: string;
  divisionId?: string;
  planningUnitId?: string;

  relatedRecordId?: string;

  sourceFormat:
    | "shp"
    | "geojson"
    | "kml"
    | "kmz"
    | "gpx"
    | "csv_coordinates";

  sourceCrs?: string;
  displayCrs: "EPSG:4326";

  geometryType:
    | "Point"
    | "MultiPoint"
    | "LineString"
    | "MultiLineString"
    | "Polygon"
    | "MultiPolygon";

  featureCount: number;

  totalAreaHa?: number;
  totalLengthKm?: number;

  bounds: [
    number,
    number,
    number,
    number
  ];

  originalFileId: string;

  geoJsonFileId?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

# 33. Immediate Spatial Calculations

When a file is uploaded, calculate automatically:

For polygons:

```text
Area in hectares
Centroid latitude
Centroid longitude
Bounding box
```

For lines:

```text
Length in kilometres
Start coordinate
End coordinate
```

For points:

```text
Latitude
Longitude
```

---

# 34. Map Feature Popup

Example plantation polygon:

```text
TIMRI PLANTATION BLOCK 01

Planning Unit:
Timri

Forest Division:
Siran

Area:
12.45 ha

Layer:
Plantation Site

[Open Record]
[Run Vegetation Analysis]
```

PU boundary popup:

```text
TIMRI PLANNING UNIT

Area
Forest Division
Region

[Open PU]
```

NTFP site popup:

```text
HONEY VALUE CHAIN SITE

Value Chain:
Honey

Location:
...

[Open Value Chain]
```

---

# 35. Spatial Validation

Where PU boundary data is available, automatically check whether uploaded sites fall inside the selected PU.

Example:

```text
Spatial Validation

Plantation polygon area:       18.70 ha
Inside Timri PU:               17.90 ha
Outside Timri PU:               0.80 ha

Outside boundary:               4.3%

Warning:
Part of this plantation lies outside the selected PU.
```

Do not reject automatically.

Allow user to:

```text
Review
Correct PU
Accept with Remarks
Cancel Upload
```

---

# 36. GIS Layer Panel

Example:

```text
LAYERS

[x] Planning Unit Boundaries
[x] Plantation Sites
[ ] Existing Plantations
[ ] Spring-shed
[ ] Spring Points
[ ] Fire Lines
[ ] Nurseries
[ ] NTFP Sites
```

Each layer should have:

```text
Show / Hide
Zoom to Layer
Details
Download
Delete if authorized
```

---

# 37. Export to Google Earth

Add:

```text
Export KML
Export KMZ
```

This allows a user to open the same project layer in Google Earth.

Example:

```text
[Export to KML]
```

Downloaded KML should retain useful attributes such as:

```text
Planning Unit
Forest Division
Area
Intervention Type
Site Name
Remarks
```

---

# 38. Google Earth Engine Integration

## 38.1 Purpose

Google Earth Engine will provide satellite-based analysis for spatial project sites.

It should be optional.

Normal map display should not require Earth Engine.

---

# 39. Earth Engine Analysis Button

For a polygon layer:

```text
[Vegetation Analysis]
```

Open:

```text
VEGETATION CHANGE ASSESSMENT

Site:
Timri Plantation Block 01

Baseline Period:
From _______
To   _______

Comparison Period:
From _______
To   _______

Satellite Dataset:
Sentinel-2 Surface Reflectance

Analysis:
[x] NDVI
[x] Vegetation Change
[ ] Land Cover

[Run Analysis]
```

---

# 40. Sentinel-2 Recommendation

Recommended Google Earth Engine collection:

```text
COPERNICUS/S2_SR_HARMONIZED
```

For NDVI:

```ts
NDVI = (B8 - B4) / (B8 + B4);
```

Analysis should:

```text
Filter images to polygon
Filter by date
Mask clouds
Create representative baseline composite
Create representative comparison composite
Calculate NDVI
Calculate NDVI difference
Calculate zonal statistics
Store results
```

---

# 41. Vegetation Change Result

Example:

```text
VEGETATION CHANGE

Site:
Timri Plantation 01

Baseline Mean NDVI:
0.42

Current Mean NDVI:
0.57

Mean Change:
+0.15

Area Showing Improvement:
8.60 ha

Area Showing Decline:
1.10 ha

Valid Satellite Coverage:
94%
```

Show:

```text
Baseline Map
Current Map
Change Map
```

---

# 42. Vegetation Analysis Data Model

```ts
{
  id: string;

  spatialLayerId: string;

  analysisType:
    | "ndvi"
    | "ndvi_change"
    | "vegetation_change"
    | "land_cover";

  status:
    | "queued"
    | "running"
    | "completed"
    | "failed";

  baselineStart?: string;
  baselineEnd?: string;

  comparisonStart?: string;
  comparisonEnd?: string;

  dataset?: string;

  meanBaselineNdvi?: number;
  meanCurrentNdvi?: number;
  meanNdviChange?: number;

  areaImprovedHa?: number;
  areaDeclinedHa?: number;

  validCoveragePercent?: number;

  errorMessage?: string;

  createdAt: string;
  completedAt?: string;
}
```

---

# 43. Vegetation Analysis History

For every plantation or intervention polygon:

```text
Analysis Date | Baseline | Comparison | NDVI Change | Status
```

The app can therefore show vegetation trends over time.

---

# 44. Important Remote-Sensing Warning

Display the following note on vegetation-analysis screens:

```text
Satellite-based vegetation indices are supporting monitoring evidence.

An increase in NDVI does not by itself confirm seedling survival,
stocking density, species composition or plantation quality.

Field verification remains necessary.
```

---

# 45. Earth Engine Failure Handling

If Earth Engine is unavailable:

```text
Earth Engine Analysis Temporarily Unavailable
```

The following must continue working:

```text
Spatial upload
Shapefile display
KML display
PU boundaries
Plantation map
Area calculations
Layer visibility
Feature popups
KML/KMZ export
```

---

# 46. GIS Backend Design

Suggested services:

```text
spatialImportService
geometryValidationService
geoJsonConversionService
kmlExportService
earthEngineService
vegetationAnalysisService
```

Suggested API routes:

```text
POST   /api/spatial/layers/upload

GET    /api/spatial/layers
GET    /api/spatial/layers/:id

GET    /api/spatial/layers/:id/geojson

POST   /api/spatial/layers/:id/validate

GET    /api/spatial/layers/:id/export/kml
GET    /api/spatial/layers/:id/export/kmz

POST   /api/spatial/layers/:id/analysis/vegetation
GET    /api/spatial/analysis/:id
GET    /api/spatial/layers/:id/analyses
```

---

# 47. UI Design Requirements — Make New Modules More Beautiful Without Changing the Existing Icon View

## 47.1 Core rule

The current overall icon view remains unchanged.

The new module screens should look cleaner and more modern while still matching the existing PFRMP Assistant.

Recommended palette:

```text
Primary Forest Green      #1F6B45
Deep Forest               #174C34
Soft Green Background     #EEF6F1
Warm Gold Accent          #C79A3B
Soft Gold                 #FBF6E8
Page Background           #F6F8F6
Card Background           #FFFFFF
Border                    #E3E8E4
Primary Text              #1F2933
Secondary Text            #667085
Success                   #2E8B57
Information               #3B82F6
Warning                   #D89B2B
Danger                    #C94A4A
Neutral                   #98A2B3
```

Use white space and neutral surfaces. Do not make every component green.

---

# 48. Common Module Layout

```text
┌──────────────────────────────────────────────────────────┐
│ Module Title                              Page Actions    │
│ One-line explanation                                    │
├──────────────────────────────────────────────────────────┤
│ KPI Card │ KPI Card │ KPI Card │ KPI Card               │
├──────────────────────────────────────────────────────────┤
│ Search / Filters / View Toggle                          │
├──────────────────────────────────────────────────────────┤
│ Main Content                                             │
└──────────────────────────────────────────────────────────┘
```

Use:

```text
16–20 px card radius
subtle border
soft shadow
clear spacing
large KPI number
small descriptive label
compact status chips
```

---

# 49. NTFP UI

Desktop: two or three value-chain summary cards per row on the NTFP landing page.

Each value-chain card contains:

```text
Value Chain Name
Short Objective
Value Chain Report Status
Action Plan Status
Implementation Status
Planned Action Plan Budget when available
Activity Progress
Physical Progress
Last Update
Open
Update Progress
```

Medicinal plant cards additionally show Species / Value Chain Identification Status.

Use a short lifecycle strip:

```text
Identification → Report → Action Plan → Implementation
```

Completed stages use a check mark; current stage is highlighted; future stages are muted.

Inside a value chain, use an **Action Plan monitoring layout**, not a raw Excel replica.

Recommended structure:

```text
Summary KPIs
    ↓
Main Action accordions/cards
    ↓
Activity rows/cards
    ↓
Progress / Budget / Evidence drawer
```

Main Action cards should show:

```text
Main Action Code + Name
Planned Budget
Activities
Completed
In Progress
Remaining
Physical Progress
```

Expanded activities should show the imported standard Excel fields:

```text
Code
Action
Unit
Unit Cost
Planned Qty
Estimated Budget
Completed Qty
Physical Progress
Status
```

Actual expenditure and budget utilization should appear only when expenditure has been recorded.

Use compact currency formatting in summary cards, for example:

```text
PKR 52.40 M
```

while detail views and exports may show full values.

Do not make the NTFP screen look like a large spreadsheet. Preserve hierarchy, use whitespace, progress bars, status chips, expandable groups and a right-side update drawer.

---

# 50. Capacity Building UI

Use collapsible group panels.

Example group header:

```text
Capacity Building for Community Organisations
409 planned events
125 completed · 284 remaining
Progress 30.6%
```

Expanded activities should use cards with three large counters:

```text
Planned | Completed | Remaining
```

Buttons:

```text
Record Event
View Event Log
```

This should be the default view. A dense table can remain available as an optional secondary view.

---

# 51. Manual Entry UX

Use a right-side drawer instead of a completely separate page.

NTFP example:

```text
UPDATE ACTION PROGRESS

Value Chain      Walnut
Activity         3.3 Capacity building training
Planned Unit     Training (25 person/training)
Planned Qty      2
Planned Budget   PKR 600,000

Completed Qty    [1]
Physical Progress 50%
Status            [In Progress ▼]
Date              [14-08-2026]
Region            [........ ▼]
Division          [........ ▼]
PU                [........ ▼]
Remarks           [................]
Evidence          [Upload]
Actual Expenditure [........] optional

[Cancel] [Save Update]
```

Do not derive Physical Progress from Actual Expenditure.

Capacity example:

```text
RECORD EVENT

Activity         BTASP-4.3
Status           [Completed ▼]
Date             [14-08-2026]
Division         [Siran ▼]
PU               [Timri ▼]
Venue            [................]
Participants     [25]
Attendance       [Upload]
Report           [Upload]
Photos           [Upload]

[Cancel] [Save Event]
```

---

# 52. React / Tailwind-Style UI Guidance

Adapt these examples to the component library already used by the application. Do not introduce a conflicting UI framework only for the new modules.

```tsx
function ValueChainCard({ chain }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            NTFP Value Chain
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {chain.name}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {chain.objective}
      </p>

      <div className="mt-5 space-y-2">
        <StatusRow label="Value Chain Report" value={chain.valueChainReportStatus} />
        <StatusRow label="Action Plan" value={chain.actionPlanStatus} />
        <StatusRow label="Implementation" value={chain.implementationStatus} />
      </div>

      {chain.totalPlannedBudgetPKR != null && (
        <div className="mt-5 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Planned Action Plan Budget</p>
          <p className="mt-1 font-semibold text-slate-900">
            {formatPKR(chain.totalPlannedBudgetPKR)}
          </p>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-500">Physical Progress</span>
          <span className="font-semibold text-slate-800">
            {chain.overallPhysicalProgressPercent ?? 0}%
          </span>
        </div>
        <ProgressBar value={chain.overallPhysicalProgressPercent ?? 0} />
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="primary">Open</Button>
        <Button variant="secondary">Update Progress</Button>
      </div>
    </article>
  );
}
```

Capacity activity:

```tsx
function CapacityActivityCard({ item }) {
  const completed = item.completedEvents;
  const remaining = Math.max(item.plannedEvents - completed, 0);
  const progress = item.plannedEvents > 0
    ? Math.min((completed / item.plannedEvents) * 100, 100)
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700">{item.moduleCode}</span>
          <h3 className="mt-1 max-w-3xl font-semibold text-slate-900">{item.trainingSubject}</h3>
          <p className="mt-2 text-sm text-slate-500">
            {item.placeLevel} · {item.daysPerEvent} days/event · {item.participantType}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric label="Planned" value={item.plannedEvents} />
        <Metric label="Completed" value={completed} />
        <Metric label="Remaining" value={remaining} />
      </div>

      <div className="mt-5"><ProgressBar value={progress} /></div>

      <div className="mt-5 flex gap-2">
        <Button variant="primary">Record Event</Button>
        <Button variant="secondary">View Events</Button>
      </div>
    </section>
  );
}
```

---

# 53. Status Styling

```ts
const statusStyles = {
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  available: "bg-blue-50 text-blue-700 ring-blue-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  under_preparation: "bg-amber-50 text-amber-700 ring-amber-200",
  scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
  postponed: "bg-amber-50 text-amber-700 ring-amber-200",
  delayed: "bg-red-50 text-red-700 ring-red-200",
  not_started: "bg-slate-100 text-slate-600 ring-slate-200",
  pending: "bg-slate-100 text-slate-600 ring-slate-200",
};
```

---

# 54. Search, Filters and Responsiveness

NTFP filters:

```text
Search Value Chain / Activity
Value Chain Report Status
Action Plan Status
Implementation Status
Region
Division
```

Capacity filters:

```text
Search Training Subject
Capacity Group
Status
Participant Type
Place / Level
Region
Division
PU
```

GIS filters:

```text
Layer Type
Region
Division
PU
Related Activity
```

Desktop:

```text
Sidebar visible
2–3 NTFP cards per row
Capacity group accordion/cards
GIS split map + layer panel
```

Mobile:

```text
1 card per row
Filters in drawer
Tables become stacked cards
Map full screen with floating controls
```

---

# 55. Cross-Module Links

Allow optional linking:

```text
NTFP Activity -> GIS Site
Capacity Building Event -> GIS Event Location
NTFP Training Activity -> Capacity Building Event
```

Suggested references:

```ts
ntfpValueChainId?: string;
ntfpActivityId?: string;
capacityBuildingPlanItemId?: string;
capacityBuildingEventId?: string;
spatialLayerId?: string;
```

Do not double-count progress when linked records represent the same activity.

---

# 56. New Module Import Screen

This is additive and does not replace the existing app import system.

```text
NEW MODULE DATA IMPORT

[NTFP Action Plan]
[Capacity Building Plan]
[Spatial Layer]
```

For NTFP Action Plans:

```text
Use the standard six-column NTFP Excel structure.
Import Action hierarchy, Unit, Unit Cost, Qty and Estimated Budget.
Detect Main Actions, Sub-Actions, additional line items, Sub-Totals and Grand Total.
Show an Import Review before saving.
Validate calculated budgets against source totals.
Create a versioned Action Plan.
Never silently replace the previous Action Plan.
```

For Capacity Building, import the full plan structure and all 551 planned-event targets.

---

# 57. Acceptance Criteria — NTFP

```text
NTFP Value Chains is a separate navigation item.
Six initial value-chain records exist.
Each value chain has a short objective.
Value Chain Report Status is separate from Action Plan Status.
Implementation Status is separate.
Medicinal Plant 1 and 2 support identification updates.
Confirmed medicinal plant names can replace placeholders without losing history.

The Walnut Action Plan Excel format is treated as the standard reusable NTFP Action Plan format.
The importer is generic and contains no Walnut-specific parsing requirement.
The same importer can be used for every future NTFP value chain using the standard format.

The importer recognizes S. No, Action, Unit, Unit Cost, Qty and Estimated Budget.
The importer recognizes Main Actions and numbered Sub-Actions.
Blank-code but meaningful Action rows are preserved as child line items.
Sub-Total rows are recognized and validated.
Grand Total rows are recognized and validated.
The current Walnut workbook validates against a source Grand Total of PKR 52,400,000.
The current Walnut workbook imports exactly 10 Main Actions and 42 executable activities.
The importer maps the Action title from the Action column and never from S. No, Qty, Unit Cost, Budget, row number or formula result.
The importer preserves the blank-code `Provision of Management kits` row as an executable child activity under Main Action 4.
The Walnut regression fixture validates all 10 expected Main Action subtotals.
The Import Review displays real action text before activation.
Numeric-only action previews fail validation and cannot be activated.
A malformed result such as total budget 270 fails acceptance.
Formula cells do not require client-side formula evaluation because budgets are independently calculated from Unit Cost × Qty and totals from child rows.
Previously malformed imports can be safely re-imported without silently attaching historical progress to the wrong rows.

Action Plan budget/cost fields are imported and displayed.
Unit, Unit Cost, Planned Quantity and Estimated Budget are retained per activity.
Physical Progress and Financial Progress are tracked separately.
Physical Progress is never inferred from expenditure.
Actual Expenditure is optional until financial information is available.
Budget Utilization is calculated only when expenditure data exists.
Over-budget activities remain visible and generate a warning.

Each executable activity supports Status, Completed Quantity, Progress, Remarks and Evidence.
Quantity-based progress is calculated when a meaningful numeric target exists.
Manual progress is allowed where quantity-based progress is not meaningful.
Progress history is retained instead of overwriting previous updates.
Evidence remains linked to the related activity/update.

Main Action cards aggregate child activity progress and planned budget.
The Value Chain summary shows total planned budget and overall physical progress.
Actual expenditure/budget utilization appears only when actual data exists.
The user can understand the Action Plan without reopening the source Excel.

Each revised Action Plan creates a new version or explicit reviewed revision.
Previous Action Plan versions and historical progress are never silently destroyed.
Value chains without an approved Action Plan show an upload workflow and do not contain invented activities or budgets.
```

---

# 58. Acceptance Criteria — Capacity Building

```text
Capacity Building is a separate navigation item.
The uploaded Global Capacity Building Plan is the master event plan.
All nine groups are available.
All activity/event types from the Excel plan are included.
Current planned-event total validates to 551.
Each activity shows its exact planned event count.
Completed events can be recorded individually.
Completed / Remaining values update automatically.
Activity statuses include Not Started, Scheduled, In Progress, Completed and Postponed.
Event records can store location, participants, evidence and remarks.
Dashboard prioritizes planned/completed/remaining events.
```

---

# 59. Acceptance Criteria — UI

```text
Existing overall icon view remains unchanged.
New module pages match the existing app design language.
NTFP cards are easy to scan.
Capacity activity progress is understandable without opening Excel.
Manual updates use a drawer/modal.
GIS keeps the map as the dominant screen element.
Desktop, tablet and mobile layouts are usable.
```

---

# 60. Source Material

The new modules use the supplied project material for:

```text
Honey Value Chain Action Plan
Walnut Value Chain Action Plan
Walnut standard NTFP Action Plan Excel structure (reusable for future value chains)
BTASP Global Capacity Building Plan
PFRMP / BTASP spatial monitoring requirements
```

The original documents should remain attachable to the related records for traceability.

# 61. GIS Technology Notes

Recommended implementation basis:

```text
Google Maps JavaScript API:
Use the Data layer / GeoJSON for interactive vector display.

Google Earth Engine:
Use for satellite-based remote-sensing analysis.

Recommended Sentinel-2 dataset:
COPERNICUS/S2_SR_HARMONIZED
```

For large spatial data, avoid placing the complete geometry in repeated Earth Engine request payloads. Store or ingest the spatial layer appropriately and reference it from the server-side analysis process.

All Earth Engine credentials must remain on the backend/server side.

---

# End of specification.md
