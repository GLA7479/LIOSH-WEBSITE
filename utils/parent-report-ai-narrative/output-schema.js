/**
 * Structured output schema for the parent-report AI narrative writer.
 *
 * Shape:
 * {
 *   summary: string,
 *   strengths: [{ textHe: string, sourceId: string }],
 *   focusAreas: [{ textHe: string, sourceId: string }],
 *   homeTips: string[],
 *   cautionNote: string
 * }
 *
 * `sourceId` values are validated post-hoc against the closed enum derived from the Insight Packet
 * (`availableStrengthSourceIds` / `availableFocusSourceIds`). The OpenAI `text.format=json_object`
 * mode guarantees JSON parseability; the renderer reads only `textHe` from strengths/focusAreas
 * and never displays `sourceId`.
 */

export const NARRATIVE_OUTPUT_SHAPE = Object.freeze({
  fields: ["summary", "strengths", "focusAreas", "homeTips", "cautionNote"],
  limits: Object.freeze({
    summaryMaxChars: 600,
    bulletMaxChars: 160,
    cautionMaxChars: 280,
    minStrengths: 0,
    maxStrengths: 3,
    minFocusAreas: 0,
    maxFocusAreas: 3,
    minHomeTips: 2,
    maxHomeTips: 3,
  }),
});

/**
 * Returns a JSON-Schema-shaped object that some OpenAI-compatible endpoints accept under
 * `text.format = { type: "json_schema", schema: ..., strict: true }`. We do NOT rely on schema
 * enforcement at the model side: the validator in `validate-narrative-output.js` is authoritative.
 *
 * @param {string[]} availableStrengthSourceIds
 * @param {string[]} availableFocusSourceIds
 */
export function buildNarrativeJsonSchema(availableStrengthSourceIds, availableFocusSourceIds) {
  const strengthEnum = Array.isArray(availableStrengthSourceIds) ? availableStrengthSourceIds : [];
  const focusEnum = Array.isArray(availableFocusSourceIds) ? availableFocusSourceIds : [];

  const strengthsSchema = {
    type: "array",
    minItems: 0,
    maxItems: NARRATIVE_OUTPUT_SHAPE.limits.maxStrengths,
    items: {
      type: "object",
      additionalProperties: false,
      required: ["textHe", "sourceId"],
      properties: {
        textHe: { type: "string", maxLength: NARRATIVE_OUTPUT_SHAPE.limits.bulletMaxChars },
        sourceId: strengthEnum.length > 0
          ? { type: "string", enum: strengthEnum }
          : { type: "string" },
      },
    },
  };

  const focusSchema = {
    type: "array",
    minItems: 0,
    maxItems: NARRATIVE_OUTPUT_SHAPE.limits.maxFocusAreas,
    items: {
      type: "object",
      additionalProperties: false,
      required: ["textHe", "sourceId"],
      properties: {
        textHe: { type: "string", maxLength: NARRATIVE_OUTPUT_SHAPE.limits.bulletMaxChars },
        sourceId: focusEnum.length > 0
          ? { type: "string", enum: focusEnum }
          : { type: "string" },
      },
    },
  };

  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "strengths", "focusAreas", "homeTips", "cautionNote"],
    properties: {
      summary: { type: "string", maxLength: NARRATIVE_OUTPUT_SHAPE.limits.summaryMaxChars },
      strengths: strengthsSchema,
      focusAreas: focusSchema,
      homeTips: {
        type: "array",
        minItems: NARRATIVE_OUTPUT_SHAPE.limits.minHomeTips,
        maxItems: NARRATIVE_OUTPUT_SHAPE.limits.maxHomeTips,
        items: { type: "string", maxLength: NARRATIVE_OUTPUT_SHAPE.limits.bulletMaxChars },
      },
      cautionNote: { type: "string", maxLength: NARRATIVE_OUTPUT_SHAPE.limits.cautionMaxChars },
    },
  };
}

export function emptyNarrativeOutput() {
  return {
    summary: "",
    strengths: [],
    focusAreas: [],
    homeTips: [],
    cautionNote: "",
  };
}
