/** Intervention guidance lookup — text from uploaded docs only (spec §8, §12). */

import { getPartialMatches } from "@/lib/documentExtractor";

const INTERVENTION_TOPICS = {
  community_wardens_existing_plantation_and_enclosures: "plantation",
  update_of_planation_and_enclouser_journals: "plantation",
  enrichment_planting_20_of_ha_ha: "plantation",
  block_plantation_ha_10x10: "plantation",
  block_plantation_ha_8x8: "plantation",
  wood_lots_ha: "plantation",
  farm_forestry_seedlings: "plantation",
  wardens_for_new_btasp_plantations: "plantation",
  women_nursery: "nursery",
  seedlings_purchase_private_nursery: "nursery",
  provide_fodder_ha: "other",
  spring_shed_close_planting_ha: "spring_shed",
  spring_shed_trenches_cft: "spring_shed",
  spring_shed_ditches_cft: "spring_shed",
  fire_lines_km: "fire_line",
  no_of_fire_fighting_tool_kit: "fire_line",
  tools_for_the_communit_wardns: "other",
  women_livelihood_project: "livelihood",
  vdc_project: "livelihood",
  bonus_for_plantation_ha: "plantation",
  cmlst_traning: "training",
  basic_forest_management_training: "training",
  nursery_raising_traing: "training",
  spring_shed_management_training: "training",
  training_pre_and_post_harvest_ntfps: "training",
  training_for_rotational_grazing: "training",
};

export const DOCUMENT_CATEGORIES = [
  "Implementation Guidelines",
  "PFRMP Manual",
  "Plantation guideline",
  "Nursery guideline",
  "Fire-line guideline",
  "Spring-shed guideline",
  "Training material",
  "Other supporting document",
];

export function getInterventionTopic(interventionId) {
  return INTERVENTION_TOPICS[interventionId] || "other";
}

export function getImplementationGuidance(interventionId, data) {
  const { interventionImplementationGuidance = [], interventionsMaster = [] } = data;
  const approved = interventionImplementationGuidance.filter(
    (g) => g.interventionId === interventionId && g.approved !== false
  );
  if (approved.length > 0) return approved;

  const pending = interventionImplementationGuidance.filter((g) => g.interventionId === interventionId);
  if (pending.length > 0) return pending;

  return [];
}

export function getGuidanceForIntervention(interventionId, technicalGuidance = [], docs = []) {
  const linked = technicalGuidance.filter(
    (g) => g.interventionId === interventionId && g.approved !== false
  );
  if (linked.length > 0) return linked;

  const topic = getInterventionTopic(interventionId);
  const relatedDocs = docs.filter(
    (d) =>
      d.category?.toLowerCase().includes(topic.replace("_", " ")) ||
      d.category === "Implementation Guidelines" ||
      d.category === "PFRMP Manual"
  );

  if (relatedDocs.length === 0) {
    return [
      {
        id: "pending",
        interventionId,
        title: "Guidance pending extraction",
        sourceDocumentTitle: "Upload Implementation Guidelines or PFRMP Manual",
        topic,
        steps: [],
        precautions: [],
        monitoringChecklist: [],
        pending: true,
      },
    ];
  }

  return relatedDocs.map((doc) => ({
    id: `doc-ref-${doc.id}`,
    interventionId,
    title: doc.title,
    sourceDocumentId: doc.id,
    sourceDocumentTitle: doc.title,
    topic,
    steps: [],
    precautions: [],
    monitoringChecklist: [],
    pending: true,
    message: "Guidance pending extraction from uploaded document.",
  }));
}

export function getGuidanceStatus(data, interventionId) {
  const impl = getImplementationGuidance(interventionId, data);
  if (impl.length > 0 && impl.some((g) => g.stepByStepMethod?.length > 0 || g.summary?.length > 50)) {
    return impl.some((g) => g.approved) ? "approved" : "extracted";
  }
  const tech = data.technicalGuidance?.filter((g) => g.interventionId === interventionId) || [];
  if (tech.length > 0) return "partial";
  const relatedDocs = data.docs?.filter(
    (d) => d.category === "Implementation Guidelines" || d.category === "PFRMP Manual"
  );
  if (relatedDocs?.length > 0) return "pending";
  return "missing";
}

export function getRelatedGuidanceSuggestions(interventionId, data) {
  return getPartialMatches(
    interventionId,
    data.interventionsMaster || [],
    data.interventionImplementationGuidance || []
  );
}

export function interventionHasBeneficiaries(intervention) {
  return intervention?.hasMaleFemaleBeneficiaries === true;
}
