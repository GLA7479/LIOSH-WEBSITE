/**
 * Geometry-only: diagram metadata + per-step emphasis for the explanation modal.
 * No Math/Science imports.
 */

export function getGeometryDiagramSpec(question) {
  if (!question?.params || !question.topic) return null;
  const { topic, shape, params: p } = question;

  if (topic === "area") {
    switch (shape) {
      case "square":
        if (typeof p.side !== "number") return null;
        return { kind: "square", mode: "area", side: p.side };
      case "rectangle":
        if (typeof p.length !== "number" || typeof p.width !== "number") return null;
        return { kind: "rectangle", mode: "area", length: p.length, width: p.width };
      case "triangle":
        if (typeof p.base !== "number" || typeof p.height !== "number") return null;
        return { kind: "triangle", mode: "area", base: p.base, height: p.height };
      case "parallelogram":
        if (typeof p.base !== "number" || typeof p.height !== "number") return null;
        return { kind: "parallelogram", mode: "area", base: p.base, height: p.height };
      case "trapezoid":
        if (
          typeof p.base1 !== "number" ||
          typeof p.base2 !== "number" ||
          typeof p.height !== "number"
        )
          return null;
        return {
          kind: "trapezoid",
          mode: "area",
          base1: p.base1,
          base2: p.base2,
          height: p.height,
        };
      case "circle":
        if (typeof p.radius !== "number") return null;
        return { kind: "circle", mode: "area", radius: p.radius };
      default:
        return null;
    }
  }

  if (topic === "perimeter") {
    switch (shape) {
      case "square":
        if (typeof p.side !== "number") return null;
        return { kind: "square", mode: "perimeter", side: p.side };
      case "rectangle":
        if (typeof p.length !== "number" || typeof p.width !== "number") return null;
        return { kind: "rectangle", mode: "perimeter", length: p.length, width: p.width };
      case "triangle":
        if (
          typeof p.side1 !== "number" ||
          typeof p.side2 !== "number" ||
          typeof p.side3 !== "number"
        )
          return null;
        return {
          kind: "triangle_perimeter",
          mode: "perimeter",
          side1: p.side1,
          side2: p.side2,
          side3: p.side3,
        };
      case "circle":
        if (typeof p.radius !== "number") return null;
        return { kind: "circle", mode: "perimeter", radius: p.radius };
      default:
        return null;
    }
  }

  return null;
}

/**
 * Emphasis drives stroke/fill highlight on the diagram for the current step index.
 * Aligns with typical 4-step flow: נוסחה → הצבה → חישוב → תוצאה.
 */
export function getDiagramEmphasisForStep(question, stepIndex, totalSteps) {
  const spec = getGeometryDiagramSpec(question);
  if (!spec || typeof stepIndex !== "number" || stepIndex < 0) return "neutral";

  const i = stepIndex;
  const last = totalSteps > 0 ? totalSteps - 1 : 3;

  switch (spec.kind) {
    case "square":
      if (i === 0) return "formula";
      if (i === 1 || i === 2) return "side";
      if (i >= last) return "result";
      return "neutral";
    case "rectangle":
      if (i === 0) return "formula";
      if (i === 1) return "length_width";
      if (i === 2) return "length_width";
      if (i >= last) return "result";
      return "neutral";
    case "triangle":
      if (i === 0) return "formula";
      if (i === 1) return "base_height";
      if (i === 2) return "base_height";
      if (i >= last) return "result";
      return "neutral";
    case "parallelogram":
      if (i === 0) return "formula";
      if (i === 1 || i === 2) return "base_height";
      if (i >= last) return "result";
      return "neutral";
    case "trapezoid":
      if (i === 0) return "formula";
      if (i === 1 || i === 2) return "bases_height";
      if (i >= last) return "result";
      return "neutral";
    case "circle":
      if (i === 0) return "formula";
      if (i === 1 || i === 2) return "radius";
      if (i === last) return spec.mode === "perimeter" ? "rim" : "result";
      return "neutral";
    case "triangle_perimeter":
      if (i === 0) return "formula";
      if (i === 1 || i === 2) return "all_sides";
      if (i >= last) return "result";
      return "neutral";
    default:
      return "neutral";
  }
}
