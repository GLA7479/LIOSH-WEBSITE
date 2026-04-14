import { TAXONOMY_BY_ID } from "./taxonomy-registry.js";

/**
 * @param {string|null} taxonomyId
 */
export function buildProbePlan(taxonomyId) {
  if (!taxonomyId || !TAXONOMY_BY_ID[taxonomyId]) {
    return {
      probeType: "structural_transfer",
      objectiveHe: "הפרדה בין פער יסוד לבעיית נושא",
      specificationHe: "משימה מקבילה באותו עקרון עם מורכבות מופחתת",
      stoppingRuleHe: "שני רצפים עקביים או שיפור יציב",
      escalationRuleHe: "אין שיפור לאחר שני מחזורים",
    };
  }
  const row = TAXONOMY_BY_ID[taxonomyId];
  return {
    probeType: "blueprint_row_probe",
    objectiveHe: "להבחין בין קושי יסודי לבין קושי ספציפי של הנושא",
    specificationHe: row.probeHe,
    stoppingRuleHe: "עמידה בסף חזרתיות של השורה או דחיית ההשערה",
    escalationRuleHe: row.escalationHe,
    taxonomyId: row.id,
  };
}
