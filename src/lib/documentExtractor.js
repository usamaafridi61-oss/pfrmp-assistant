/** Extract and index implementation guidance from uploaded documents (spec §8.3–8.4). */

import { getInterventionTopic } from "@/lib/guidance";

/** Workbook intervention → guideline keyword synonyms */
export const INTERVENTION_SYNONYMS = {
  block_plantation_ha_10x10: ["block plantation", "10x10", "spacing", "afforestation"],
  block_plantation_ha_8x8: ["block plantation", "8x8", "moist temperate", "afforestation"],
  enrichment_planting_20_of_ha_ha: ["enrichment", "gap filling", "understocked"],
  fire_lines_km: ["fire line", "fire break", "fire protection"],
  women_nursery: ["nursery", "women nursery", "seedling raising"],
  spring_shed_close_planting_ha: ["spring shed", "close planting", "watershed"],
  spring_shed_trenches_cft: ["trenches", "water conservation", "spring shed"],
  spring_shed_ditches_cft: ["ditches", "spring shed", "water conservation"],
  farm_forestry_seedlings: ["farm forestry", "seedlings", "private land"],
  community_wardens_existing_plantation_and_enclosures: [
    "community warden",
    "watch and ward",
    "enclosure protection",
  ],
  wardens_for_new_btasp_plantations: ["warden", "new plantation", "protection"],
  wood_lots_ha: ["wood lot", "woodlot", "farmer"],
  seedlings_purchase_private_nursery: ["private nursery", "seedling purchase", "quality"],
  provide_fodder_ha: ["fodder", "grass", "livestock"],
  no_of_fire_fighting_tool_kit: ["fire fighting", "tool kit", "fire equipment"],
  tools_for_the_communit_wardns: ["community warden", "tools", "equipment"],
  women_livelihood_project: ["women livelihood", "livelihood", "income"],
  vdc_project: ["vdc", "village development", "community"],
  bonus_for_plantation_ha: ["bonus", "plantation", "survival"],
  cmlst_traning: ["cmlst", "training", "community"],
  basic_forest_management_training: ["forest management", "training"],
  nursery_raising_traing: ["nursery raising", "training", "potting"],
  spring_shed_management_training: ["spring shed", "management", "training"],
  training_pre_and_post_harvest_ntfps: ["ntfp", "harvest", "post-harvest"],
  training_for_rotational_grazing: ["rotational grazing", "grazing", "livestock"],
  update_of_planation_and_enclouser_journals: ["journal", "plantation journal", "enclosure journal"],
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSection(sectionText, intervention) {
  const normalized = normalizeText(sectionText);
  const nameNorm = normalizeText(intervention.name);
  let score = 0;

  if (normalized.includes(nameNorm)) score += 10;
  nameNorm.split(/\s+/).forEach((word) => {
    if (word.length > 3 && normalized.includes(word)) score += 1;
  });

  const synonyms = INTERVENTION_SYNONYMS[intervention.id] || [];
  synonyms.forEach((kw) => {
    if (normalized.includes(kw.toLowerCase())) score += 3;
  });

  return score;
}

function splitIntoSections(text) {
  const lines = String(text || "").split(/\r?\n/);
  const sections = [];
  let current = { title: "Introduction", lines: [] };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const isHeading =
      trimmed.length > 0 &&
      trimmed.length < 120 &&
      (/^\d+[\.\)]\s/.test(trimmed) ||
        /^[A-Z][A-Za-z0-9\s\-–—]{2,60}$/.test(trimmed) ||
        trimmed === trimmed.toUpperCase());

    if (isHeading && current.lines.length > 0) {
      sections.push({
        title: current.title,
        text: current.lines.join("\n").trim(),
      });
      current = { title: trimmed, lines: [] };
    } else {
      current.lines.push(line);
    }
  });

  if (current.lines.length > 0) {
    sections.push({ title: current.title, text: current.lines.join("\n").trim() });
  }

  return sections.filter((s) => s.text.length > 40);
}

function extractListItems(text, patterns) {
  const items = [];
  patterns.forEach((pattern) => {
    const re = new RegExp(pattern, "gim");
    let match;
    while ((match = re.exec(text)) !== null) {
      const line = match[1]?.trim();
      if (line && line.length > 5 && line.length < 500) items.push(line);
    }
  });
  return [...new Set(items)].slice(0, 20);
}

function buildGuidanceFromSection(section, intervention, doc) {
  const text = section.text;
  const topic = getInterventionTopic(intervention.id);
  const now = new Date().toISOString();

  const steps = extractListItems(text, [
    /(?:^|\n)\s*(?:\d+[\.\)]|[-•*])\s+(.+)/g,
    /(?:step\s*\d+[:\.]?\s*)(.+)/gi,
  ]);

  const precautions = extractListItems(text, [
    /(?:precaution|caution|warning|safety)[:\s]+(.+)/gi,
    /(?:do not|avoid|must not)\s+(.+)/gi,
  ]);

  const monitoringChecklist = extractListItems(text, [
    /(?:monitor|check|verify|record|inspect)[:\s]+(.+)/gi,
    /(?:indicator|evidence|document)[:\s]+(.+)/gi,
  ]);

  const seasonMatch = text.match(/(?:season|timing|period)[:\s]+([^\n.]{5,80})/i);
  const spacingMatch = text.match(/(?:spacing|layout|pit)[:\s]+([^\n.]{3,60})/i);
  const speciesMatch = text.match(/(?:species|plant)[:\s]+([^\n.]{5,120})/i);

  const summary = text.slice(0, 400).replace(/\s+/g, " ").trim();
  const objectiveMatch = text.match(/(?:objective|purpose|aim)[:\s]+([^\n.]{10,200})/i);

  return {
    technical: {
      id: newId(),
      interventionId: intervention.id,
      title: section.title || intervention.name,
      sourceDocumentId: doc.id,
      sourceDocumentTitle: doc.title,
      sourceSection: section.title,
      topic,
      recommendedSeason: seasonMatch?.[1]?.trim(),
      spacing: spacingMatch?.[1]?.trim(),
      species: speciesMatch ? speciesMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [],
      applicableConditions: extractListItems(text, [/(?:site|location|where)[:\s]+(.+)/gi])[0],
      steps,
      precautions,
      monitoringChecklist,
      approved: false,
    },
    implementation: {
      id: newId(),
      interventionId: intervention.id,
      interventionName: intervention.name,
      summary,
      objective: objectiveMatch?.[1]?.trim() || summary.slice(0, 200),
      whenToImplement: seasonMatch?.[1]?.trim(),
      whereToImplement: extractListItems(text, [/(?:site selection|location|where)[:\s]+(.+)/gi])[0],
      whoShouldImplement: extractListItems(text, [/(?:responsible|community|field staff|who)[:\s]+(.+)/gi])[0],
      prerequisites: extractListItems(text, [/(?:prerequisite|before|prior)[:\s]+(.+)/gi]),
      stepByStepMethod: steps,
      toolsAndInputs: extractListItems(text, [/(?:tool|material|input|equipment)[:\s]+(.+)/gi]),
      technicalStandards: extractListItems(text, [/(?:standard|specification|dimension)[:\s]+(.+)/gi]),
      qualityChecks: extractListItems(text, [/(?:quality|check)[:\s]+(.+)/gi]),
      commonMistakes: extractListItems(text, [/(?:mistake|error|avoid)[:\s]+(.+)/gi]),
      safetyAndEnvironmentalPrecautions: precautions,
      communityResponsibilities: extractListItems(text, [/(?:community)[:\s]+(.+)/gi]),
      monitoringIndicators: monitoringChecklist,
      evidenceRequired: extractListItems(text, [/(?:evidence|record|photo|journal)[:\s]+(.+)/gi]),
      season: seasonMatch?.[1]?.trim(),
      spacing: spacingMatch?.[1]?.trim(),
      recommendedSpecies: speciesMatch
        ? speciesMatch[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [],
      sourceDocumentId: doc.id,
      sourceDocumentTitle: doc.title,
      sourceSections: [section.title],
      extractedAt: now,
      approved: false,
    },
  };
}

export function matchSectionsToInterventions(sections, interventionsMaster) {
  const matches = new Map();

  interventionsMaster.forEach((intervention) => {
    let best = null;
    let bestScore = 0;

    sections.forEach((section) => {
      const score = scoreSection(section.text, intervention);
      if (score > bestScore) {
        bestScore = score;
        best = section;
      }
    });

    if (best && bestScore >= 3) {
      matches.set(intervention.id, { section: best, score: bestScore });
    }
  });

  return matches;
}

export function extractGuidanceFromText(text, doc, interventionsMaster) {
  const sections = splitIntoSections(text);
  const matches = matchSectionsToInterventions(sections, interventionsMaster);
  const technicalGuidance = [];
  const interventionImplementationGuidance = [];

  matches.forEach(({ section }, interventionId) => {
    const intervention = interventionsMaster.find((i) => i.id === interventionId);
    if (!intervention) return;
    const built = buildGuidanceFromSection(section, intervention, doc);
    technicalGuidance.push(built.technical);
    interventionImplementationGuidance.push(built.implementation);
  });

  return { technicalGuidance, interventionImplementationGuidance };
}

export async function extractTextFromDoc(doc) {
  if (doc.extractedText) return doc.extractedText;

  const dataUrl = doc.dataUrl || "";
  if (!dataUrl) return "";

  if (doc.fileName?.toLowerCase().endsWith(".txt")) {
    const base64 = dataUrl.split(",")[1];
    if (base64) {
      try {
        return atob(base64);
      } catch {
        return "";
      }
    }
  }

  return doc.pastedText || "";
}

export async function indexDocument(doc, interventionsMaster) {
  const text = await extractTextFromDoc(doc);
  if (!text || text.length < 100) {
    return {
      ok: false,
      message: "No extractable text. Paste guideline text on the document or upload a .txt file.",
      technicalGuidance: [],
      interventionImplementationGuidance: [],
    };
  }

  const result = extractGuidanceFromText(text, doc, interventionsMaster);
  return {
    ok: true,
    message: `Indexed ${result.interventionImplementationGuidance.length} intervention(s) from "${doc.title}".`,
    ...result,
  };
}

export function mergeIndexedGuidance(existing, newTechnical, newImplementation, replaceForDocId) {
  const technicalGuidance = (existing.technicalGuidance || []).filter(
    (g) => g.sourceDocumentId !== replaceForDocId
  );
  const interventionImplementationGuidance = (existing.interventionImplementationGuidance || []).filter(
    (g) => g.sourceDocumentId !== replaceForDocId
  );

  return {
    technicalGuidance: [...technicalGuidance, ...newTechnical],
    interventionImplementationGuidance: [...interventionImplementationGuidance, ...newImplementation],
  };
}

export function getPartialMatches(interventionId, interventionsMaster, allGuidance) {
  const intervention = interventionsMaster.find((i) => i.id === interventionId);
  if (!intervention) return [];

  const synonyms = INTERVENTION_SYNONYMS[interventionId] || [];
  return allGuidance
    .filter((g) => g.interventionId !== interventionId)
    .filter((g) => {
      const hay = normalizeText(
        `${g.interventionName} ${g.summary} ${(g.sourceSections || []).join(" ")}`
      );
      return synonyms.some((kw) => hay.includes(kw.toLowerCase()));
    })
    .slice(0, 3);
}
