/**
 * Inline styles for Hebrew UI strings that embed digits / operators / Latin math.
 * Matches step-explanation modal list: RTL paragraph + Unicode "plaintext" bidi heuristic
 * so mixed Hebrew + formulas stay readable without flipping the whole layout LTR.
 */
export const learningMixedHebrewMathStyle = Object.freeze({
  direction: "rtl",
  unicodeBidi: "plaintext",
});
