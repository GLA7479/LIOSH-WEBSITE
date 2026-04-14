# Evidence Band Dictionary v1

Maps **contract bands** (E0–E4) to measurable inputs. Implementation may derive bands from existing fields (`dataSufficiencyLevel`, `evidenceStrength`, `conclusionStrength`, `isEarlySignalOnly`, `isStablePattern`, DEv2 `confidence.level`, `outputGating.cannotConcludeYet`).

---

## Band definitions

### E0 — Insufficient

| Signal | Typical sources |
|--------|-----------------|
| `q < 4` OR no questions | Row diagnostics |
| `dataSufficiencyLevel === "low"` with `q < 4` | Sufficiency |
| DEv2 `insufficient_data` or `cannotConcludeYet` with no alternative | `confidence-policy`, `output-gating` |
| Subject: zero scored rows | Aggregation |

**Parent narrative:** observation / “נאסוף עוד” only.

---

### E1 — Early / weak signal

| Signal | Typical sources |
|--------|-----------------|
| `4 <= q < 8` OR `evidenceStrength === "low"` OR `confidence01 < 0.22` | Row diagnostics |
| `isEarlySignalOnly === true` | Row diagnostics |
| DEv2 `early_signal_only` or `low` with `probeOnly` | Output gating |
| `conclusionStrength === "withheld"` | Diagnostic restraint |

**Parent narrative:** hypotheses, single-session caveats, no “יציב / סופי”.

---

### E2 — Cautious

| Signal | Typical sources |
|--------|-----------------|
| `dataSufficiencyLevel === "medium"` OR `evidenceStrength === "medium"` | Row diagnostics |
| `conclusionStrength === "tentative"` or restraint `likely` / `weak` | Diagnostic restraint |
| `q >= 8` but not stable pattern | Row |

**Parent narrative:** “נראה”, “סביר”, “כדאי לעקוב”, conditional actions.

---

### E3 — Stable (row/topic)

| Signal | Typical sources |
|--------|-----------------|
| `isStablePattern === true` | Row diagnostics (`strong` + q>=14 + stability + confidence floors) |
| OR `dataSufficiencyLevel === "strong"` with `evidenceStrength === "strong"` and `q >= 12` | Sufficiency + evidence |
| `conclusionStrength === "moderate"` or `"strong"` with restraint `confirmed` / clear | Restraint |

**Parent narrative:** clear direction for **that row/topic**; still avoid “סגור לחלוטין” without E4.

---

### E4 — High (rare; row or exceptional subject/overall)

| Signal | Typical sources |
|--------|-----------------|
| DEv2 `confidence === "high"` AND `recurrenceFull` AND not `cannotConcludeYet` | Engine v2 |
| Row: `conclusionStrength === "strong"` AND `q >= 18` AND gates not blocking (see gate doc) | Composite |
| Overall: **only** if subject/overall readiness policy marks full readiness | Policy doc |

**Parent narrative:** strongest allowed phrasing set in language matrix.

---

## Combination rule (precedence)

When signals disagree, band = **minimum** of contributing tiers:

`effectiveBand = min(band(sufficiency), band(evidenceStrength), band(conclusionStrength), band(DEv2 if present), band(gateCap from gate-to-text-binding-v1.md))`

---

## Mapping table (implementation hint)

| evidenceStrength | dataSufficiency | conclusionStrength | Typical band |
|------------------|-------------------|----------------------|--------------|
| low | low | withheld | E0–E1 |
| medium | medium | tentative | E1–E2 |
| strong | strong | moderate | E2–E3 |
| strong | strong | strong | E3–E4 (cap by gates) |

---

## Sign-off

- [ ] Bands are mutually exclusive in output labeling  
- [ ] Precedence rule accepted  
- [ ] **Approved by:** _________________ **Date:** _________________
