/**
 * Shared assertions: parent-facing HTML must not leak internal / dev / enum tokens.
 * Used by parent-copilot-parent-render-suite and parent-copilot-phase6-hebrew-robustness-suite.
 */

import assert from "node:assert/strict";

/** Substrings that must never appear in parent-facing rendered HTML. */
export const FORBIDDEN_PARENT_FACING_SUBSTRINGS = [
  "AI Hybrid",
  "reviewHybrid",
  "Parent Copilot",
  "debug",
  "canonical",
  "AiHybridInternalReviewerPanel",
  "ai-hybrid-internal-reviewer",
  "mleo_internal_hybrid_reviewer",
  "INTERNAL_HYBRID_REVIEWER_UI",
  "NEXT_PUBLIC_INTERNAL_HYBRID_REVIEWER",
];

/** Raw engine / contract codes in visible text (parent Hebrew surfaces). */
export const RAW_ENUM_LEAK_RE = /\b(knowledge_gap|insufficient_evidence|advance_level|maintain_and_strengthen|WE\d+|RI\d+)\b/i;

/**
 * @param {string} html
 * @param {string} label
 */
export function assertParentFacingHtmlHasNoLeaks(html, label) {
  const h = String(html || "");
  for (const token of FORBIDDEN_PARENT_FACING_SUBSTRINGS) {
    assert.ok(!h.includes(token), `${label} must not include: ${token}`);
  }
  assert.ok(!RAW_ENUM_LEAK_RE.test(h), `${label} must not include raw enum-like tokens (RI*/WE*/engine)`);
}
