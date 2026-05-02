/**
 * MCQ cells may be plain strings/numbers or lightweight objects (additive).
 * Object shape: { label?, value, distractorFamily?, errorTag?, explanationHe? }
 */

/**
 * @param {unknown} cell
 */
export function mcqCellValue(cell) {
  if (cell != null && typeof cell === "object" && "value" in cell) {
    return /** @type {{ value: unknown }} */ (cell).value;
  }
  return cell;
}

/**
 * @param {unknown} cell
 */
export function mcqCellLabel(cell) {
  if (cell != null && typeof cell === "object" && "label" in cell) {
    const lab = /** @type {{ label?: unknown }} */ (cell).label;
    if (lab != null && String(lab).trim() !== "") return String(lab);
  }
  const v = mcqCellValue(cell);
  return v == null ? "" : String(v);
}
