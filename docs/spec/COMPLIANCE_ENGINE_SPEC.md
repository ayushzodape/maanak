# COMPLIANCE_ENGINE_SPEC.md — Maanak

**Status:** Canonical. This is the single most important document in the spec set — the compliance engine's correctness and honesty is what the entire product's credibility rests on, per the innovation and risk analysis already established.

---

## Observation model

Maanak's pipeline separates **observation** from **judgment**, deliberately, as an architectural principle established early in this project's research (not a technology preference — a direct response to the finding that no existing tool combines template-free, statute-specific, evidence-traceable compliance checking, and that overclaiming legal certainty is the single biggest credibility risk in this problem domain):

```
Evidence (image)
   → AI/vision extraction  [OBSERVES ONLY]
   → Declaration records (structured, but not yet judged)
   → Deterministic rule engine  [JUDGES ONLY]
   → RuleEvaluation records (PASS/FAIL/UNCERTAIN/NOT_APPLICABLE/NOT_MEASURABLE, cited to a specific rule)
```

Nothing downstream of the rule engine may alter a `RuleEvaluation`'s status. Nothing upstream of it (extraction, OCR, any LLM call) may output a status at all — only observations.

## AI extraction responsibilities

The AI/vision component is responsible for, and **only** for:

- Detecting whether a given declaration type is visually present in the evidence.
- Transcribing the visible text of a detected declaration.
- Reporting a confidence score for its own detection.
- Reporting `NOT_DETECTED` when a declaration is not visible — never inferring that it's "probably there but off-frame" or similarly filling a gap.
- For net quantity specifically: extracting the numeric value and unit, since this drives the Rule 7 height lookup.
- For font-height evaluation specifically: reporting whether a usable physical scale reference (a barcode, a reference object, or user-supplied dimensions) is present in the evidence, and if so, the observed character height in whatever unit is derivable — the AI does not decide whether this makes the declaration compliant, only whether a measurement is possible at all.

**The AI extraction component must never:**
- Output a compliance verdict of any kind (no "looks compliant," no implied pass/fail).
- Invent, guess, or "helpfully" complete a value it cannot actually read from the image.
- Convert an estimated pixel measurement into a millimetre value and present it as legally required.
- Apply legal reasoning of any kind (e.g., deciding a product is exempt) — that is the rule engine's job, based on structured category/scope data, not the AI's inference from an image.

## Deterministic rule-engine responsibilities

The rule engine is the **only** component permitted to produce a `RuleEvaluation`. It is responsible for:

- Loading the current, versioned rule data (never hardcoded inline logic).
- Determining rule applicability (is this package in scope at all; does this specific rule apply to this declaration type and category).
- Comparing an observed `Declaration` against the applicable rule's requirement.
- Producing a status, a confidence score, a plain-text reason, and a citation to the exact rule ID for every check it performs.
- Refusing to guess when the required input (e.g., a physical scale reference) is missing — returning `NOT_MEASURABLE` rather than fabricating a result.
- Rolling up individual evaluations into an overall scan status, without letting a PASS anywhere mask a FAIL elsewhere.

## Status definitions

| Status | Meaning | Example |
|---|---|---|
| **PASS** | The declaration was detected and meets the applicable rule's requirement, with adequate confidence. | Net quantity "500 g" detected; declared unit and format both valid. |
| **FAIL** | The declaration was detected but does not meet the requirement, OR a required declaration was not detected at all. | Consumer-care information not detected anywhere on the package. |
| **UNCERTAIN** | The declaration was detected, but evidence quality (blur, glare, partial occlusion) is insufficient to confidently judge compliance. | MRP text partially obscured by a price sticker; content unreadable enough to judge format. |
| **NOT_APPLICABLE** | The rule does not apply to this package at all — an exemption, an out-of-scope category, or (per the known Rule 7 Table-II gap) a case this ruleset does not yet cover. | A ≤10g sachet exempt under Rule 26; a length/area/number-declared commodity for which the applicable height rule is an unresolved research gap. |
| **NOT_MEASURABLE** | A measurement-dependent rule applies and a value would be needed, but no reliable physical scale reference exists in the evidence to produce a trustworthy measurement. | Font-height check on a plain photo with no barcode or reference object in frame. |

**`NOT_MEASURABLE` and `UNCERTAIN` must never be silently converted to a forced PASS or FAIL anywhere in the product** — not in the rule engine, not in report generation, not in the dashboard rollup. This is a hard constraint, not a style preference: it is the direct, deliberate answer to the most likely and most damaging judge/reviewer objection this product will face ("how do you know it's non-compliant and not just an extraction error?").

## Evidence requirements

Every `RuleEvaluation` must be traceable to:
1. The specific `Declaration` it evaluated (or explicitly none, if the rule concerns presence/absence).
2. The specific evidence image (and ideally a bounding box/crop) that supports the finding.
3. The specific `rule_id`, resolvable to a specific clause in the versioned rule data.

A finding with no evidence reference is not acceptable for anything beyond an internal debugging state — it must not reach the official-facing result screen or a generated report.

## Confidence requirements

- Every `Declaration` carries an extraction-level confidence score.
- Every `RuleEvaluation` carries its own confidence score, which may differ from (and should generally be derived from, but not blindly copy) the underlying declaration's extraction confidence — a rule engine can be highly confident about *presence/absence* even when the underlying OCR text quality is mediocre, and conversely a clean OCR read doesn't automatically mean the rule was correctly applied.
- Confidence thresholds determine routing to `UNCERTAIN`/`NOT_MEASURABLE`, but the specific numeric thresholds are an implementation detail to be tuned against real test images — **not yet fixed as a canonical number in this document**, since no systematic evaluation against a real test set has been done yet (see `LEGAL_RESEARCH_STATUS.md` and `PRODUCT_SCOPE.md`).

## Legal-source/version requirements

- Every rule used by the engine must originate from a versioned file under `rules/packaged_commodities/`, with `source_document`, `source_clause`, `effective_from`, and (where applicable) `effective_to` and amendment lineage populated.
- A rule file's content must be traceable to a specific verification pass — see the `verification_note` / `known_gaps` fields already present in the Rule 6 and Rule 7 files, and `LEGAL_RESEARCH_STATUS.md` for what has and has not been independently confirmed.
- **No rule value may be added to the engine without a documented source.** This constraint exists because it was already violated once during this project (a fabricated, PDP-area-keyed Rule 7 table was introduced by an external document and had to be corrected) — see `LEGAL_RESEARCH_STATUS.md` for the full account. That correction is the reason this requirement is written as a hard rule rather than a best practice.
