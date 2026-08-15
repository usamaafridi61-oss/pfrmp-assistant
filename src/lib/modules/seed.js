import { createSeedCapacityPlanItems, isMalformedCapacityPlan } from "@/lib/capacityBuilding/seed";
import { isMalformedNtfpActionItems } from "@/lib/ntfp/validate";

const now = () => new Date().toISOString();

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const NTFP_STATUS = {
  IDENTIFICATION_PENDING: "identification_pending",
  ACTION_PLAN_PENDING: "action_plan_pending",
  ACTION_PLAN_AVAILABLE: "action_plan_available",
};

export const VALUE_CHAIN_SEED = [
  {
    slug: "honey",
    name: "Honey Value Chain",
    status: NTFP_STATUS.ACTION_PLAN_AVAILABLE,
    valueChainReportStatus: "completed",
    actionPlanStatus: "available",
    implementationStatus: "in_progress",
    actionPlanPeriod: "Jan 2026 – Apr 2026",
    commonName: "Honey (Beri & Palosa)",
    scientificName: "Apis mellifera / Apis cerana",
    objective:
      "Improve technical beekeeping, technology support, women participation, beekeeper institutions, processing, branding, marketing and bee flora.",
    geographicArea: "Khyber Pakhtunkhwa (Swat, Karak, Kohat, Peshawar, Hazara)",
    forestDivision: "Multiple Divisions",
  },
  {
    slug: "walnut",
    name: "Walnut Value Chain",
    status: NTFP_STATUS.ACTION_PLAN_AVAILABLE,
    valueChainReportStatus: "completed",
    actionPlanStatus: "available",
    implementationStatus: "in_progress",
    actionPlanPeriod: "Jan 2026 – Dec 2026",
    commonName: "Walnut (Akhrot)",
    scientificName: "Juglans regia",
    objective:
      "Improve production/trade information, nursery capacity, walnut-tree management, quality planting material, packaging, value addition and market expansion.",
    geographicArea: "Highland Forest Regions (Swat, Gallies, Kaghan, Siran, Alpuri, Buner)",
    forestDivision: "Swat, Gallies, Kaghan, Siran, Alpuri, Buner",
  },
  {
    slug: "black-persimmon",
    name: "Black Persimmon Value Chain",
    status: NTFP_STATUS.ACTION_PLAN_PENDING,
    valueChainReportStatus: "completed",
    actionPlanStatus: "not_started",
    implementationStatus: "not_started",
    commonName: "Black Persimmon (Tor Amlok)",
    scientificName: "Diospyros lotus",
    objective:
      "Develop an organized value chain around production/collection, post-harvest handling, value addition, enterprise development and market linkages.",
    geographicArea: "Malakand, Hazara Regions",
    forestDivision: "Malakand, Lower Swat, Upper Swat",
  },
  {
    slug: "wild-pomegranate-anardana",
    name: "Wild Pomegranate / Anardana Value Chain",
    status: NTFP_STATUS.ACTION_PLAN_PENDING,
    valueChainReportStatus: "completed",
    actionPlanStatus: "not_started",
    implementationStatus: "not_started",
    commonName: "Wild Pomegranate (Dharona / Anardana)",
    scientificName: "Punica granatum",
    objective:
      "Improve sustainable production/collection, post-harvest handling, processing/value addition, producer organization and market access.",
    geographicArea: "Sub-tropical Scrub & Lower Pine Zones",
    forestDivision: "Haripur, Torgher, Buner",
  },
  {
    slug: "medicinal-plant-1",
    name: "Medicinal Plant Value Chain 1",
    status: NTFP_STATUS.IDENTIFICATION_PENDING,
    medicinalIdentificationStatus: "pending",
    valueChainReportStatus: "not_started",
    actionPlanStatus: "not_started",
    implementationStatus: "not_started",
    objective:
      "Identify a priority medicinal plant, prepare its Value Chain Report and Action Plan, then monitor implementation.",
    isEditablePlaceholder: true,
  },
  {
    slug: "medicinal-plant-2",
    name: "Medicinal Plant Value Chain 2",
    status: NTFP_STATUS.IDENTIFICATION_PENDING,
    medicinalIdentificationStatus: "pending",
    valueChainReportStatus: "not_started",
    actionPlanStatus: "not_started",
    implementationStatus: "not_started",
    objective:
      "Identify a second priority medicinal plant, prepare its Value Chain Report and Action Plan, then monitor implementation.",
    isEditablePlaceholder: true,
  },
];

export const HONEY_GROUPS = [
  "Promote Business Development Service Providers",
  "Technical Beekeeping Training – Apis mellifera",
  "Technical Training in Apis cerana with technology package",
  "Integrating Women in honey value chain",
  "Development and strengthening of Beekeepers Association",
  "Business Management Skills Training",
  "Training on honey processing and exports for wholesalers",
  "Support for branding and labelling",
  "Plantation of suitable plants for increasing bee flora",
];

export const HONEY_ACTIVITIES = {
  "Promote Business Development Service Providers": [
    { title: "Identification of BDS providers", unit: "Providers", cost: 150000, qty: 10, timeline: "Jan – Feb 2026", status: "completed" },
    { title: "Training of BDS providers in modern apiculture support", unit: "Training", cost: 250000, qty: 4, timeline: "Feb – Mar 2026", status: "in_progress" },
    { title: "Exposure visits to advanced commercial beekeeping hubs", unit: "Visit", cost: 350000, qty: 2, timeline: "Mar – Apr 2026", status: "not_started" },
  ],
  "Technical Beekeeping Training – Apis mellifera": [
    { title: "Identification and selection of target beekeepers", unit: "List/Cluster", cost: 100000, qty: 12, timeline: "Jan 2026", status: "completed" },
    { title: "Identification of certified Master Trainers", unit: "Trainers", cost: 120000, qty: 6, timeline: "Jan 2026", status: "completed" },
    { title: "Technical training in seasonal hive management & disease control", unit: "Event", cost: 300000, qty: 15, timeline: "Feb – Mar 2026", status: "in_progress" },
    { title: "Provision of modern technology support packages (extractors, smokers, suits)", unit: "Package", cost: 80000, qty: 150, timeline: "Mar – Apr 2026", status: "not_started" },
  ],
  "Technical Training in Apis cerana with technology package": [
    { title: "Identification of traditional Apis cerana forest beekeepers", unit: "Cluster", cost: 100000, qty: 8, timeline: "Jan 2026", status: "completed" },
    { title: "Technical training in scientific Apis cerana colony management", unit: "Training", cost: 250000, qty: 10, timeline: "Feb – Mar 2026", status: "in_progress" },
    { title: "Distribution of standardized Apis cerana hive boxes & technology kits", unit: "Kit", cost: 65000, qty: 100, timeline: "Mar – Apr 2026", status: "not_started" },
  ],
  "Integrating Women in honey value chain": [
    { title: "Formation and mobilization of women beekeeper clusters", unit: "Cluster", cost: 120000, qty: 10, timeline: "Jan – Feb 2026", status: "completed" },
    { title: "Specialized training for women in honey extraction, filtration, and bottling", unit: "Training", cost: 220000, qty: 10, timeline: "Feb – Mar 2026", status: "in_progress" },
    { title: "Provision of customized lightweight bee boxes and protective equipment for women", unit: "Set", cost: 75000, qty: 120, timeline: "Mar – Apr 2026", status: "not_started" },
  ],
  "Development and strengthening of Beekeepers Association": [
    { title: "Organizational capacity assessment and registration of Beekeepers Association", unit: "Assessment", cost: 200000, qty: 1, timeline: "Jan 2026", status: "completed" },
    { title: "Leadership, governance, and financial sustainability workshops", unit: "Workshop", cost: 300000, qty: 3, timeline: "Feb – Mar 2026", status: "not_started" },
    { title: "Establishment of regional honey aggregation and quality verification desks", unit: "Center", cost: 600000, qty: 3, timeline: "Mar – Apr 2026", status: "not_started" },
  ],
  "Business Management Skills Training": [
    { title: "Development of honey enterprise business management training curriculum", unit: "Manual", cost: 350000, qty: 1, timeline: "Jan 2026", status: "completed" },
    { title: "Training of beekeepers in cost accounting, inventory, and micro-financing", unit: "Training", cost: 200000, qty: 8, timeline: "Feb – Apr 2026", status: "in_progress" },
  ],
  "Training on honey processing and exports for wholesalers": [
    { title: "Technical training on moisture reduction, HMF management, and lab testing standards", unit: "Training", cost: 400000, qty: 4, timeline: "Feb – Mar 2026", status: "not_started" },
    { title: "Workshops on international phytosanitary compliance and export packaging", unit: "Workshop", cost: 450000, qty: 2, timeline: "Mar – Apr 2026", status: "not_started" },
  ],
  "Support for branding and labelling": [
    { title: "Design of KP Flora origin branding, tamper-evident seals, and nutrition labels", unit: "Brand Pack", cost: 500000, qty: 1, timeline: "Jan – Feb 2026", status: "completed" },
    { title: "Provision of food-grade glass jars and subsidized barcode/QR labels to producers", unit: "Batch", cost: 150000, qty: 20, timeline: "Feb – Apr 2026", status: "in_progress" },
    { title: "Promotional campaigns and participation in Provincial Honey Festival", unit: "Event", cost: 800000, qty: 2, timeline: "Apr 2026", status: "not_started" },
  ],
  "Plantation of suitable plants for increasing bee flora": [
    { title: "Identification of high-nectar multi-season flora species for plantation zones", unit: "Study", cost: 250000, qty: 1, timeline: "Jan 2026", status: "completed" },
    { title: "Establishment of bee-flora demonstration groves in target planning units", unit: "Grove (Ha)", cost: 300000, qty: 10, timeline: "Feb – Apr 2026", status: "in_progress" },
    { title: "Distribution of bee-friendly nectar seedlings (Acacia modesta, Robinia, Ziziphus)", unit: "Seedlings (x1000)", cost: 50000, qty: 50, timeline: "Feb – Apr 2026", status: "in_progress" },
  ],
};

export const WALNUT_GROUPS = [
  "Systematic mechanism for documenting walnut tree populations and production",
  "Collecting Walnut Trade Flow Data",
  "Strengthening Capacity of Nursery Operators (Government / Private)",
  "Effective management of walnut trees",
  "Commercial production and distribution of certified walnut plants to farmers",
  "Introducing Walnut Kernels in consumer packaging with organic labeling",
  "Developing Market Expansion Strategy for Walnut Kernels in Bulk Selling",
  "Explore the feasibility of developing value-added walnut products",
  "Promoting walnut uses in the food industry",
  "Participation in trade shows / exhibitions / melas to showcase walnut products",
];

export const WALNUT_ACTIVITIES = {
  "Systematic mechanism for documenting walnut tree populations and production": [
    { title: "Identification and baseline survey of walnut tree populations across target forest divisions", unit: "Survey Report", cost: 800000, qty: 4, timeline: "Jan – Mar 2026", status: "completed" },
    { title: "Digital inventory and production volume estimation methodology development", unit: "Methodology", cost: 600000, qty: 1, timeline: "Feb – Apr 2026", status: "in_progress" },
    { title: "Training of field staff in GPS documentation and GIS inventory mapping", unit: "Training", cost: 350000, qty: 6, timeline: "Mar – May 2026", status: "not_started" },
  ],
  "Collecting Walnut Trade Flow Data": [
    { title: "Mapping of local, regional, and national walnut trade channels and market intermediaries", unit: "Mapping Study", cost: 750000, qty: 2, timeline: "Jan – Apr 2026", status: "completed" },
    { title: "Price monitoring and seasonal trade volume data collection across major hub markets", unit: "Quarterly Bulletin", cost: 300000, qty: 4, timeline: "Jan – Dec 2026", status: "in_progress" },
    { title: "Publication and dissemination of annual trade flow and market intelligence reports", unit: "Report", cost: 400000, qty: 2, timeline: "Jun – Dec 2026", status: "not_started" },
  ],
  "Strengthening Capacity of Nursery Operators (Government / Private)": [
    { title: "Assessment of existing public and private walnut nurseries in Swat, Kaghan, Gallies, Dir", unit: "Assessment", cost: 500000, qty: 1, timeline: "Jan – Feb 2026", status: "completed" },
    { title: "Hands-on training in chip budding, cleft grafting, and nursery sanitary management", unit: "Training Batch", cost: 300000, qty: 8, timeline: "Feb – May 2026", status: "in_progress" },
    { title: "Provision of specialized nursery toolkits and grafting knives to certified nurserymen", unit: "Toolkit", cost: 25000, qty: 100, timeline: "Mar – Jun 2026", status: "not_started" },
  ],
  "Effective management of walnut trees": [
    { title: "Establishment of Farmer Extension Groups (FEGs) in major walnut producing valleys", unit: "FEG Group", cost: 150000, qty: 20, timeline: "Feb – Apr 2026", status: "in_progress" },
    { title: "Training of farmers in canopy management, pruning, disease control (Anthracnose/Blight)", unit: "Training Event", cost: 200000, qty: 15, timeline: "Mar – Jul 2026", status: "not_started" },
    { title: "Demonstration of improved post-harvest de-hulling, washing, and solar drying", unit: "Demo Site", cost: 450000, qty: 8, timeline: "Jul – Oct 2026", status: "not_started" },
  ],
  "Commercial production and distribution of certified walnut plants to farmers": [
    { title: "Establishment of mother scion-wood orchards for high-yield thin-shelled varieties", unit: "Scion Orchard", cost: 1200000, qty: 3, timeline: "Jan – Jun 2026", status: "in_progress" },
    { title: "Mass propagation and distribution of certified grafted walnut saplings to community farmers", unit: "Saplings (x1000)", cost: 400000, qty: 40, timeline: "Mar – Dec 2026", status: "not_started" },
  ],
  "Introducing Walnut Kernels in consumer packaging with organic labeling": [
    { title: "Design of vacuum consumer packaging, brand visual identity, and organic certification protocols", unit: "Brand Standard", cost: 600000, qty: 1, timeline: "Jan – Apr 2026", status: "completed" },
    { title: "Establishment of community-level vacuum packaging and grading micro-units", unit: "Packing Unit", cost: 1500000, qty: 4, timeline: "Apr – Sep 2026", status: "not_started" },
    { title: "Support to women producer groups in kernel grading, nitrogen flushing, and retail boxing", unit: "Workshop", cost: 250000, qty: 6, timeline: "Aug – Nov 2026", status: "not_started" },
  ],
  "Developing Market Expansion Strategy for Walnut Kernels in Bulk Selling": [
    { title: "Buyer-seller business roundtables linking KP walnut producers to major retail/confectionery chains", unit: "B2B Event", cost: 500000, qty: 3, timeline: "May – Oct 2026", status: "not_started" },
    { title: "Development of digital e-commerce directory and supplier catalog for KP walnut enterprises", unit: "Portal/Catalog", cost: 400000, qty: 1, timeline: "Apr – Jul 2026", status: "in_progress" },
  ],
  "Explore the feasibility of developing value-added walnut products": [
    { title: "Feasibility study and laboratory testing of cold-pressed walnut oil and walnut flour extraction", unit: "Feasibility Study", cost: 800000, qty: 1, timeline: "Jan – Jun 2026", status: "completed" },
    { title: "Pilot production of cold-pressed cosmetic and culinary walnut oil with local enterprise partners", unit: "Pilot Line", cost: 1800000, qty: 2, timeline: "Jul – Dec 2026", status: "not_started" },
  ],
  "Promoting walnut uses in the food industry": [
    { title: "Culinary and nutritional promotional campaigns highlighting health benefits of KP walnuts", unit: "Campaign", cost: 600000, qty: 2, timeline: "May – Nov 2026", status: "not_started" },
    { title: "Partnership agreements with national bakery, confectionery, and gourmet food manufacturers", unit: "Partnership MoUs", cost: 300000, qty: 5, timeline: "Jun – Dec 2026", status: "not_started" },
  ],
  "Participation in trade shows / exhibitions / melas to showcase walnut products": [
    { title: "Sponsorship and setup of KP Pavilion at National Agri-Expo, Islamabad & Lahore", unit: "Expo Pavilion", cost: 1200000, qty: 2, timeline: "Sep – Nov 2026", status: "not_started" },
    { title: "Annual Khyber Pakhtunkhwa Provincial Walnut Festival and Farmer Awards", unit: "Festival Event", cost: 1500000, qty: 1, timeline: "Oct 2026", status: "not_started" },
  ],
};

function buildActionItems(valueChainId, groups, activitiesMap) {
  const timestamp = now();
  const items = [];

  groups.forEach((groupName, gIdx) => {
    const groupCode = String(gIdx + 1);
    const parentId = newId();

    items.push({
      id: parentId,
      valueChainId,
      actionCode: groupCode,
      parentActionCode: undefined,
      actionGroup: groupName,
      actionTitle: groupName,
      status: "not_started",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const activities = activitiesMap[groupName] || [];
    activities.forEach((act, aIdx) => {
      const actCode = `${groupCode}.${aIdx + 1}`;
      items.push({
        id: newId(),
        valueChainId,
        actionCode: actCode,
        parentActionCode: groupCode,
        actionGroup: groupName,
        actionTitle: act.title,
        unit: act.unit,
        unitCostPKR: act.cost,
        targetQuantity: act.qty,
        plannedBudgetPKR: act.cost * act.qty,
        plannedStartDate: "2026-01-01",
        plannedEndDate: "2026-12-31",
        timelineLabel: act.timeline || "2026",
        status: act.status || "not_started",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  });

  return items;
}

export function createSeedValueChains() {
  const timestamp = now();
  return VALUE_CHAIN_SEED.map((vc) => ({
    id: vc.slug,
    slug: vc.slug,
    name: vc.name,
    status: vc.status,
    valueChainReportStatus: vc.valueChainReportStatus || "not_started",
    actionPlanStatus: vc.actionPlanStatus || "not_started",
    implementationStatus: vc.implementationStatus || "not_started",
    medicinalIdentificationStatus: vc.medicinalIdentificationStatus,
    actionPlanPeriod: vc.actionPlanPeriod,
    commonName: vc.commonName,
    scientificName: vc.scientificName,
    objective: vc.objective,
    geographicArea: vc.geographicArea,
    forestDivision: vc.forestDivision,
    isEditablePlaceholder: Boolean(vc.isEditablePlaceholder),
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function createSeedActionPlans(chains) {
  const timestamp = now();
  const versions = [];

  const honey = chains.find((c) => c.slug === "honey");
  if (honey) {
    versions.push({
      id: newId(),
      valueChainId: honey.id,
      title: "BTASP Honey Value Chain Action Plan",
      versionLabel: "Version 1.0 (Official)",
      plannedBudgetPKR: 54400000,
      isCurrent: true,
      uploadedAt: timestamp,
      status: "approved",
    });
  }

  const walnut = chains.find((c) => c.slug === "walnut");
  if (walnut) {
    versions.push({
      id: newId(),
      valueChainId: walnut.id,
      title: "BTASP Walnut Value Chain Action Plan",
      versionLabel: "Version 1.0 (Official)",
      plannedBudgetPKR: 52400000,
      isCurrent: true,
      uploadedAt: timestamp,
      status: "approved",
    });
  }

  return versions;
}

export function createSeedActionItems(chains) {
  let allItems = [];
  const honey = chains.find((c) => c.slug === "honey");
  if (honey) {
    allItems = allItems.concat(buildActionItems(honey.id, HONEY_GROUPS, HONEY_ACTIVITIES));
  }

  const walnut = chains.find((c) => c.slug === "walnut");
  if (walnut) {
    allItems = allItems.concat(buildActionItems(walnut.id, WALNUT_GROUPS, WALNUT_ACTIVITIES));
  }

  return allItems;
}

export function ensureModuleDefaults(raw) {
  const next = { ...raw };
  const arrays = [
    "ntfpValueChains",
    "ntfpActionPlanVersions",
    "ntfpActionItems",
    "ntfpProgressRecords",
    "ntfpStatusUpdates",
    "capacityPlans",
    "capacityPlanItems",
    "capacityEvents",
    "capacityParticipants",
    "spatialLayers",
  ];

  arrays.forEach((key) => {
    if (!Array.isArray(next[key])) next[key] = [];
  });

  if (next.ntfpValueChains.length === 0) {
    next.ntfpValueChains = createSeedValueChains();
    next.ntfpActionPlanVersions = createSeedActionPlans(next.ntfpValueChains);
    next.ntfpActionItems = createSeedActionItems(next.ntfpValueChains);
  }

  // Ensure all 6 value chains exist and have updated objective and status properties
  const seedChains = createSeedValueChains();
  seedChains.forEach((sc) => {
    const existing = next.ntfpValueChains.find((c) => c.id === sc.id || c.slug === sc.slug);
    if (!existing) {
      next.ntfpValueChains.push(sc);
    } else {
      // Sync official objectives and statuses if missing
      if (!existing.objective) existing.objective = sc.objective;
      if (!existing.valueChainReportStatus) existing.valueChainReportStatus = sc.valueChainReportStatus;
      if (!existing.actionPlanStatus) existing.actionPlanStatus = sc.actionPlanStatus;
      if (!existing.implementationStatus) existing.implementationStatus = sc.implementationStatus;
    }
  });

  // Ensure walnut and honey have pristine, properly hierarchical action items
  const walnut = next.ntfpValueChains.find((c) => c.slug === "walnut");
  const honey = next.ntfpValueChains.find((c) => c.slug === "honey");

  if (walnut) {
    const walnutItems = next.ntfpActionItems.filter((i) => i.valueChainId === walnut.id);
    const hasCleanWalnut =
      walnutItems.length > 0 &&
      walnutItems.some((i) => i.actionCode === "1" && !i.parentActionCode) &&
      walnutItems.some((i) => i.actionCode === "1.1" && i.parentActionCode === "1") &&
      !isMalformedNtfpActionItems(walnutItems);

    if (!hasCleanWalnut) {
      const cleanWalnut = buildActionItems(walnut.id, WALNUT_GROUPS, WALNUT_ACTIVITIES);
      next.ntfpActionItems = [
        ...next.ntfpActionItems.filter((i) => i.valueChainId !== walnut.id),
        ...cleanWalnut,
      ];
      walnut.status = NTFP_STATUS.ACTION_PLAN_AVAILABLE;
      walnut.actionPlanPeriod = "Jan 2026 – Dec 2026";

      next.ntfpActionPlanVersions = (next.ntfpActionPlanVersions || []).map((v) => {
        if (v.valueChainId !== walnut.id) return v;
        const validBudget = (v.plannedBudgetPKR || 0) >= 10000;
        return {
          ...v,
          isCurrent: validBudget && (v.versionLabel === "Version 1" || v.title === "Walnut Action Plan"),
          status: validBudget && (v.versionLabel === "Version 1" || v.title === "Walnut Action Plan") ? "active" : "superseded",
        };
      });
      const restored = next.ntfpActionPlanVersions.find((v) => v.valueChainId === walnut.id && v.isCurrent);
      if (restored) walnut.activeActionPlanVersionId = restored.id;
    }
  }

  if (honey) {
    const honeyItems = next.ntfpActionItems.filter((i) => i.valueChainId === honey.id);
    const hasCleanHoney =
      honeyItems.length > 0 &&
      honeyItems.some((i) => i.actionCode === "1" && !i.parentActionCode) &&
      honeyItems.some((i) => i.actionCode === "1.1" && i.parentActionCode === "1");

    if (!hasCleanHoney) {
      const cleanHoney = buildActionItems(honey.id, HONEY_GROUPS, HONEY_ACTIVITIES);
      next.ntfpActionItems = [
        ...next.ntfpActionItems.filter((i) => i.valueChainId !== honey.id),
        ...cleanHoney,
      ];
      honey.status = NTFP_STATUS.ACTION_PLAN_AVAILABLE;
      honey.actionPlanPeriod = "Jan 2026 – Apr 2026";
    }
  }

  if (isMalformedCapacityPlan(next.capacityPlanItems)) {
    next.capacityPlanItems = createSeedCapacityPlanItems();
  }

  return next;
}
