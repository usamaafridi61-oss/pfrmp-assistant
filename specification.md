# PFRMP Assistant — BTASP Workbook & App Specification

This document describes the **PFRMP Assistant / BTASP internal monitoring workbook** format, how the app imports it, and the required app features for monitoring, manual data entry, planning-unit profiles, intervention dashboards, and reference guidance from the **Implementation Guidelines** and **PFRMP Manual**.

Example workbook: `BTASP internal monitoring work book DrWA.UA 14-05-2026.xlsx`

---

## 1. Workbook overview

| Sheet | Purpose |
|---|---|
| **Over all Monitoring sheet** | Master matrix: all planning units (PUs) × all interventions with Qnt / Progress / Balance (+ M-B, F-B where applicable) |
| **Lists** | Machine-readable map: intervention name → Excel column numbers |
| **PU wise interventions** | Pivot view for one selected intervention, showing targets/progress per PU |
| **Summary** | Province/program totals per intervention |
| **Graphs** | Simple dashboard metrics for a selected intervention |

The app’s primary import path uses **Over all Monitoring sheet** + **Lists**.

---

## 2. Geography & scale

| Entity | Count in example workbook |
|---|---:|
| Regions | 3 (`Region-1`, `Region-2`, `Region-3`) |
| Forest divisions | 13 |
| Planning units (PUs) | 100 |
| Interventions | 26 |

### Divisions in example file

Peshawar, Gallies, Haripur, Siran, Hazara Tribal (Battgrm), Kaghan, Agror Tanawal, Torgher, Malakand, Lower Swat, Upper Swat, Alpuri, Buner.

---

## 3. “Over all Monitoring sheet” layout

- **Title rows:** rows 1–7.
- **Column headers:** row 7.
- **Data starts:** row 8.
- **First PU in example:** Ghari Chandan, Peshawar.
- **Merged/blank region and division cells:** continuation rows may have blank `Region` and `Forest Division`; importer must forward-fill the most recent non-empty region/division.

### Fixed columns

| Excel column | Field |
|---|---|
| B | S.No |
| C | Region |
| D | Forest Division |
| E | PU Name |
| F | PU Area (Ha) |
| G | Total HHs |
| H | Population |
| I | Agriculture |
| J | Water body |
| K | Settlement |
| L | Forest |
| M | Grass land |
| N | Barren land |
| O | Land use total |
| P | Existing intervention area |

From column **Q** onward, each intervention occupies up to five metrics:

- `Qnt.` / target quantity
- `Progress` / achieved cumulative progress
- `Balance` / remaining balance
- `M-B` / male beneficiaries, optional
- `F-B` / female beneficiaries, optional

Not every intervention has M-B/F-B columns.

---

## 4. “Lists” sheet — intervention column map

Each row defines one intervention and the **1-based Excel column numbers** for metrics.

| Field | Meaning |
|---|---|
| `Intervention` | Full intervention label; must match monitoring sheet |
| `QntCol` | Target quantity column |
| `ProgressCol` | Achieved/progress column |
| `BalanceCol` | Remaining balance column |
| `MBCol` | Male-beneficiary column, optional |
| `FBCol` | Female-beneficiary column, optional |

### Interventions in example workbook

1. Community Wardens Existing Plantation and Enclosures  
2. Update of Planation and Enclouser Journals  
3. Enrichment planting (20% of ha Ha)  
4. Block Plantation (Ha) 10x10  
5. Block Plantation (Ha) 8x8  
6. Wood Lots (ha)  
7. Farm Forestry - Seedlings  
8. Wardens for New BTASP Plantations  
9. Women Nursery  
10. Seedlings Purchase private Nursery  
11. Provide fodder (ha)  
12. Spring Shed Close Planting (Ha)  
13. Spring Shed Trenches(Cft)  
14. Spring shed ditches (cft)  
15. Fire Lines (km)  
16. No of fire fighting tool kit  
17. Tools for the communit Wardns  
18. Women Livelihood Project  
19. VDC Project  
20. Bonus for Plantation (ha)  
21. CMLST Traning  
22. Basic Forest Management Training  
23. Nursery raising Traing  
24. Spring Shed Management Training  
25. Training Pre- and post-harvest (NTFPs)  
26. Training for Rotational Grazing  

---

## 5. Data model

### 5.1 Core entities

| App entity | Source |
|---|---|
| `divisions` | Unique Forest Division + Region |
| `planningUnits` | Each PU Name + Division + Region + PU general information |
| `interventionsMaster` | `Lists` sheet intervention names |
| `targets` | Each PU × intervention where Qnt > 0 |
| `progressUpdates` | Each PU × intervention where Progress > 0 |
| `manualEntries` | Manual progress/target corrections entered by users |
| `documents` | Uploaded Implementation Guidelines, PFRMP Manual, PDFs, Word docs, or support files |
| `technicalGuidance` | Extracted/indexed guidance linked to interventions |

### 5.2 Suggested object fields

#### `divisions`

```ts
{
  id: string;
  name: string;
  region: string;
}
```

#### `planningUnits`

```ts
{
  id: string;
  name: string;
  divisionId: string;
  divisionName: string;
  region: string;
  areaHa: number;
  totalHouseholds: number;
  population: number;
  landUse: {
    agricultureHa: number;
    waterBodyHa: number;
    settlementHa: number;
    forestHa: number;
    grasslandHa: number;
    barrenLandHa: number;
    totalHa: number;
  };
  existingInterventionAreaHa: number;
}
```

#### `interventionsMaster`

```ts
{
  id: string;
  name: string;
  unit: string;
  category?: string;
  hasMaleFemaleBeneficiaries?: boolean;
  guidelineRefs?: string[];
}
```

#### `targets`

```ts
{
  id: string;
  planningUnitId: string;
  interventionId: string;
  targetValue: number;
  balanceValue?: number;
  maleBeneficiaries?: number;
  femaleBeneficiaries?: number;
  source: "workbook" | "manual";
  fiscalYear?: string;
}
```

#### `progressUpdates`

```ts
{
  id: string;
  planningUnitId: string;
  interventionId: string;
  date: string; // YYYY-MM-DD
  achievedIncrement: number;
  achievedCumulative: number;
  balanceValue: number;
  maleBeneficiaries?: number;
  femaleBeneficiaries?: number;
  source: "workbook" | "manual";
  enteredBy?: string;
  remarks?: string;
}
```

#### `manualEntries`

```ts
{
  id: string;
  planningUnitId: string;
  divisionId: string;
  interventionId: string;
  entryType: "target" | "progress" | "correction";
  date: string;
  targetValue?: number;
  achievedValue?: number;
  balanceValue?: number;
  maleBeneficiaries?: number;
  femaleBeneficiaries?: number;
  remarks?: string;
  attachmentIds?: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### `technicalGuidance`

```ts
{
  id: string;
  interventionId: string;
  title: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  topic: "plantation" | "nursery" | "fire_line" | "spring_shed" | "training" | "livelihood" | "other";
  recommendedSeason?: string;
  applicableConditions?: string;
  spacing?: string;
  species?: string[];
  steps: string[];
  precautions: string[];
  monitoringChecklist: string[];
}
```

---

## 6. Import rules

### 6.1 IDs

IDs are generated as URL-safe slugs.

Examples:

- Division `Peshawar` → `peshawar`
- PU `Ghari Chandan` in Peshawar → `peshawar_ghari_chandan`
- Intervention `Block Plantation (Ha) 10x10` → `block_plantation_ha_10x10`

### 6.2 Import process

1. Read `Lists`.
2. Build the intervention column map.
3. Read `Over all Monitoring sheet`.
4. Start at row 8.
5. Forward-fill blank Region and Forest Division cells.
6. Create/update divisions.
7. Create/update planning units, including:
   - PU area
   - total households
   - population
   - land-use breakup
   - existing intervention area
8. For every PU × intervention:
   - create target if `Qnt > 0`
   - create progress snapshot if `Progress > 0`
   - calculate remaining as `Qnt - Progress` unless workbook balance is provided
   - import M-B/F-B where present

### 6.3 Progress date

Filename pattern `DD-MM-YYYY` sets the snapshot date.

Example:

`BTASP internal monitoring work book DrWA.UA 14-05-2026.xlsx` → `2026-05-14`

### 6.4 Cumulative progress rule

The workbook stores **cumulative progress**, not incremental progress.

Each workbook import creates progress rows with:

```ts
achievedCumulative = Progress
achievedIncrement = Progress
```

For workbook imports, the app should treat the file as a full snapshot. Re-importing the same file should replace imported workbook data, except uploaded documents and manually entered records unless the user explicitly chooses to overwrite them.

---

## 7. Main dashboard requirements

The dashboard must show intervention-wise and planning-unit-wise monitoring.

### 7.1 Top-level totals

At the top, show:

- Total target
- Achieved target / achieved progress
- Remaining target
- Overall progress percentage

These totals must respond to filters for:

- Region
- Forest Division
- Planning Unit
- Intervention
- Date / snapshot

### 7.2 Intervention-wise summary

The app must show one row/card per intervention:

| Intervention | Total Target | Achieved | Remaining | Progress % | PUs Covered |
|---|---:|---:|---:|---:|---:|

Example interventions:

- Community Wardens Existing Plantation and Enclosures
- Block Plantation (Ha) 10x10
- Block Plantation (Ha) 8x8
- Fire Lines (km)
- Women Nursery
- Spring Shed Close Planting (Ha)

Each intervention row should be clickable.

### 7.3 Intervention detail page

When a user clicks an intervention, show:

1. Intervention title.
2. Total target, achieved, remaining, progress percentage.
3. Planning-unit-wise table for that intervention:

| Region | Division | Planning Unit | Target | Achieved | Remaining | M-B | F-B | Progress % |
|---|---|---|---:|---:|---:|---:|---:|---:|

4. Charts:
   - Target vs achieved bar chart by division.
   - Target vs achieved bar chart by planning unit.
   - Progress percentage chart.
   - Male/female beneficiary chart where M-B/F-B exist.
5. Technical guidance panel:
   - relevant guideline excerpts or summaries
   - recommended season
   - plantation spacing or model, where applicable
   - species recommendations, where applicable
   - monitoring checklist
   - implementation precautions

---

## 8. Planning Unit detail requirements

All planning units must be clickable from dashboards, tables, and intervention pages.

### 8.1 Planning Unit profile header

When a user clicks a planning unit, the first section must show general information:

| Field | Display |
|---|---|
| Planning Unit Name | PU name |
| Forest Division | Division |
| Region | Region |
| PU Area | hectares |
| Total Households | number |
| Population | number |
| Existing Intervention Area | hectares |

### 8.2 Land-use section

Show a land-use table and chart:

| Land use | Area (Ha) | Share % |
|---|---:|---:|
| Agriculture | value | % |
| Water body | value | % |
| Settlement | value | % |
| Forest | value | % |
| Grass land | value | % |
| Barren land | value | % |
| Total | value | 100% |

Chart requirement:

- Pie/donut chart for land-use composition.
- Bar chart option for land-use area comparison.

### 8.3 Planning Unit interventions section

After the general information and land-use section, show all interventions for that planning unit:

| Intervention | Target | Achieved | Remaining | M-B | F-B | Progress % |
|---|---:|---:|---:|---:|---:|---:|

For each intervention row:

- Show a progress bar.
- Provide a **View Graphs** action.
- Provide a **Manual Entry** action.
- Provide a **Guidance** action.

### 8.4 Planning Unit intervention graphics

When an intervention is selected inside a planning unit, show:

- Target vs achieved chart.
- Remaining target chart.
- Progress percentage gauge or donut.
- Timeline of progress snapshots.
- Beneficiary chart if M-B/F-B are available.
- Comparison with division average and program average.

---

## 9. Manual data entry requirements

The app must provide manual punching/data entry against interventions of different planning units in different forest divisions.

### 9.1 Manual entry location

Add a main menu item:

**Manual Data Entry**

Also allow manual entry from:

- Planning Unit detail page
- Intervention detail page
- Division page
- Target/progress table rows

### 9.2 Manual entry form

Required fields:

| Field | Type | Required |
|---|---|---|
| Forest Division | dropdown | yes |
| Planning Unit | dropdown filtered by division | yes |
| Intervention | dropdown | yes |
| Entry Type | target / progress / correction | yes |
| Date | date picker | yes |
| Target value | number | required for target/correction |
| Achieved value | number | required for progress/correction |
| Balance value | number | optional/calculated |
| Male beneficiaries | number | optional |
| Female beneficiaries | number | optional |
| Remarks | text | optional |
| Attachment/evidence | file upload | optional |

### 9.3 Manual entry validation

- Forest Division must exist.
- Planning Unit must belong to selected division.
- Intervention must exist in intervention master.
- Numeric values cannot be negative.
- Achieved value cannot exceed target unless user confirms an override.
- Balance should auto-calculate as `target - achieved`.
- Manual correction must preserve an audit trail.

### 9.4 Manual entry behavior

Manual entries must be stored separately from workbook-imported rows.

Recommended merge rule for dashboard calculations:

```ts
effectiveTarget = importedTarget + manualTargetAdjustments
effectiveAchieved = latestImportedCumulativeProgress + manualProgressAfterImport + manualCorrections
effectiveRemaining = max(effectiveTarget - effectiveAchieved, 0)
```

The app should show source badges:

- `Workbook`
- `Manual`
- `Correction`

### 9.5 Audit trail

Each manual entry must store:

- created date/time
- updated date/time
- created by
- source
- remarks
- previous value when edited
- attachment/evidence references

---

## 10. Documents, manuals, and guideline knowledge base

The app must store and use the uploaded **Implementation Guidelines** and **PFRMP Manual** as a technical knowledge base.

### 10.1 Document library

The app should support uploading:

- PDF
- DOCX
- XLSX
- images
- scanned pages where OCR is available

Document categories:

- Implementation Guidelines
- PFRMP Manual
- Plantation guideline
- Nursery guideline
- Fire-line guideline
- Spring-shed guideline
- Training material
- Other supporting document

### 10.2 Document indexing

After upload, the app should extract and index:

- title
- document category
- intervention names mentioned
- plantation techniques
- plantation spacing
- implementation season
- species
- site-selection rules
- nursery practices
- fire-line timing and method
- spring-shed interventions
- training requirements
- monitoring checklists

### 10.3 Intervention-guidance mapping

Each intervention should be linked to relevant guidance.

| Intervention type | Guidance to extract |
|---|---|
| Community Wardens Existing Plantation and Enclosures | role of wardens, monitoring duties, enclosure maintenance, survival reporting |
| Update of Plantation and Enclosure Journals | journal format, update frequency, required fields, verification steps |
| Enrichment planting | site selection, gap filling, species, season, spacing, survival checks |
| Block Plantation 10x10 | when to use 10x10 model, site conditions, spacing, pits, species, season, protection |
| Block Plantation 8x8 | when to use 8x8 model, site conditions, spacing, pits, species, season, protection |
| Wood Lots | suitable sites, farmer/community participation, species, planting season |
| Farm Forestry - Seedlings | seedling distribution, farmer records, species, survival monitoring |
| Wardens for New BTASP Plantations | selection, duties, reporting, attendance, plantation protection |
| Women Nursery | nursery establishment, species, sowing season, potting, watering, recordkeeping |
| Seedlings Purchase private Nursery | quality standards, species, size, inspection, transport |
| Provide fodder | fodder species, site, season, distribution/use rules |
| Spring Shed Close Planting | spring-shed site selection, planting density, protection, monitoring |
| Spring Shed Trenches | trench dimensions, layout, timing, safety, maintenance |
| Spring Shed Ditches | ditch design, location, timing, maintenance |
| Fire Lines | when to establish, width/length, location, maintenance season, fire-risk period |
| Fire fighting tool kit | kit contents, storage, users, inspection |
| Tools for community wardens | tools list, issuance, use, return/maintenance |
| Women Livelihood Project | eligible activities, beneficiaries, records, outputs |
| VDC Project | VDC selection, contribution, implementation, monitoring |
| Bonus for Plantation | eligibility, survival/performance basis, verification |
| CMLST Training | participants, curriculum, schedule, outputs |
| Basic Forest Management Training | training topics, participants, outputs |
| Nursery Raising Training | nursery techniques, sowing, pot filling, watering, disease control |
| Spring Shed Management Training | protection, trench/ditch care, planting care |
| Training Pre- and post-harvest (NTFPs) | harvesting, storage, value addition, marketing |
| Training for Rotational Grazing | grazing schedule, community rules, monitoring |

### 10.4 Required guidance display

For each intervention, show a **Guideline / Manual Reference** panel with:

- short technical summary
- season/timing
- site conditions
- implementation steps
- recommended species, where applicable
- spacing/model, where applicable
- monitoring checklist
- source document name
- page/section reference if available

### 10.5 Important note on exact guideline text

The specification requires the app to include guidance from the uploaded **Implementation Guidelines** and **PFRMP Manual**. Exact technical text, page numbers, species lists, and season rules must be extracted from the actual uploaded documents. Until those documents are parsed and indexed, the app should display “Guidance pending extraction” rather than inventing technical instructions.

---

## 11. Graphical representation requirements

The app must provide graphs at three levels.

### 11.1 Program level

- Total target vs achieved vs remaining.
- Intervention-wise progress.
- Division-wise progress.
- Top delayed interventions.
- Top completed interventions.

### 11.2 Intervention level

- Planning-unit-wise target vs achieved.
- Division-wise target vs achieved.
- Progress percentage.
- Male/female beneficiaries.
- Progress over time.

### 11.3 Planning Unit level

- Land-use chart.
- All interventions progress table.
- Intervention-wise target vs achieved chart.
- Remaining target chart.
- Timeline of progress snapshots.

---

## 12. Search and filtering

The app must support:

- Search by Planning Unit.
- Search by Forest Division.
- Search by Intervention.
- Filter by Region.
- Filter by Division.
- Filter by PU.
- Filter by Intervention category.
- Filter by progress status:
  - Not started
  - In progress
  - Completed
  - Over-achieved
  - No target
- Filter by source:
  - Workbook
  - Manual
  - Correction

---

## 13. Reporting requirements

The app should export:

### 13.1 Planning Unit profile report

Includes:

- general PU information
- land-use table/chart
- intervention table
- intervention graphs
- manual entries
- guideline references

### 13.2 Intervention report

Includes:

- total target, achieved, remaining
- planning-unit-wise data
- division-wise summary
- charts
- related technical guideline/manual text

### 13.3 Division report

Includes:

- all PUs in division
- all interventions in division
- target/achieved/remaining
- underperforming PUs/interventions
- manual updates

Export formats:

- PDF
- Excel
- CSV

---

## 14. Legacy flat CSV import

For partial updates, the app may still import simple tables with columns such as:

- `division_id`
- `division_name`
- `planning_unit_id`
- `planning_unit_name`
- `intervention_id`
- `intervention_name`
- `target_value`
- `achieved_increment`

However, the BTASP workbook must use:

**Excel Import → BTASP Monitoring Workbook (full)**

Do not use flat import for the full BTASP monitoring workbook.

---

## 15. UI navigation structure

Recommended app navigation:

1. **Dashboard**
2. **Interventions**
3. **Planning Units**
4. **Forest Divisions**
5. **Manual Data Entry**
6. **Excel Import**
7. **Guidelines / PFRMP Manual Library**
8. **Reports**

---

## 16. Acceptance criteria

The implementation is acceptable when:

- The app imports the full BTASP workbook using `Over all Monitoring sheet` + `Lists`.
- The app creates 13 divisions, 100 PUs, and 26 interventions from the example workbook.
- The app displays intervention-wise total target, achieved, remaining, and progress percentage.
- Each intervention opens a planning-unit-wise detail view.
- Each planning unit opens a profile page showing general information first.
- Planning unit profile includes population, households, area, land use, existing intervention area, and then interventions.
- Each planning unit intervention has graphical representation.
- Manual data entry works against division → planning unit → intervention.
- Manual entries are stored separately from imported workbook rows.
- Imported and manual values are merged correctly in dashboard totals.
- Uploaded Implementation Guidelines and PFRMP Manual are stored in the document library.
- Guidance from the manuals is linked to relevant interventions.
- The app shows guideline/manual reference panels for plantation techniques, 10x10 vs 8x8 block plantation, fire lines, nurseries, seasons, species, spring-shed works, trainings, and other interventions once the documents are parsed.
