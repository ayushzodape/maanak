# PRODUCT_SCOPE.md — Maanak

Three scopes, reconstructed from the MVP-triage discussion and the Codex build-guide milestone sequencing already established. **This document also states, honestly, what currently exists in the prototype versus what has only been specified** — that comparison is the whole reason this spec set exists.

---

## MVP / MUST HAVE

The product does not function as a demonstrable compliance tool without these. All are traceable to either the official brief directly or a hard architectural rule established during this project.

- Image capture/upload of a physical package photo (`F1`).
- Declaration extraction into the structured `Declaration` schema (`F3`) — real AI/vision extraction, not the mock sample data currently in the prototype.
- Deterministic rule evaluation producing `RuleEvaluation` records with rule citations (`F4`).
- The full five-state status model actually exercised in practice: PASS / FAIL / UNCERTAIN / NOT_APPLICABLE / NOT_MEASURABLE — not just defined, but genuinely producible (see **Known Gap #1** below).
- A compliance result view showing per-declaration outcomes with citations (`F5`).
- At minimum a JSON report and one human-readable export (`F7`).
- A minimal persisted repository — at least one prior scan retrievable live (`F8`, minimal form).

## DEMO / SHOULD HAVE

Materially strengthens the submission and the live demo, but the product is still coherent without them.

- The e-commerce/product-listing input path (`F2`, e-commerce branch).
- Evidence viewing tied to a specific finding (`F6`).
- Both PDF and DOCX export, not just one (`F7`, full form).
- A basic dashboard: counts + recent-activity table (`F10`, basic form).
- Search/filter over scan history (`F9`).
- A minimal, real two-role auth implementation (`F11`) — present because the brief requires it, deliberately kept minimal because it is not where this product's differentiation lives.
- `INNOV-001` (barcode-based scale estimation), `INNOV-002` (evidence-backed explanations as a first-class presentation discipline), and `INNOV-003` (multilingual explanations) — the three innovation items previously recommended as worth committing to, on the basis that they are genuinely non-obvious, cheap relative to their value, and directly tied to the stated problem rather than decorative.

## FUTURE / NICE TO HAVE

Good ideas, correctly kept out of the build given the time available. Recorded here so they are not forgotten, and so nobody re-litigates why they're excluded.

- `INNOV-004` (manufacturer/brand trend view) — real value, but needs enough accumulated real scan volume to be honestly demonstrable, which the prototype does not yet have.
- `INNOV-005` (corrective "what compliant looks like" generator).
- `INNOV-006` (tamper-evident hash-chaining of evidence).
- `INNOV-007` (multi-product shelf scanning) — explicitly high-risk for a live demo; attempt only with the entire MVP+DEMO scope solid and meaningful time remaining.
- Full production-grade permissions/security.
- Any integration with `emaap.gov.in` or a real state Legal Metrology system.
- Tamper/sticker-overlay detection (a materially different, harder computer-vision problem than declaration-presence checking).
- Offline queued-scan mode; a public QR-linked consumer trust badge — both explicitly discussed and placed in "mention in the pitch, do not build" territory, since consumers are not this product's target user and offline support is a genuinely different engineering effort than anything else in scope.

---

## Honest Current Implementation Status (brutal-honesty section, as requested)

This is what actually exists in the prototype right now, independent of what has been specified above. **Do not read the specification documents in this set as a description of the current prototype — they describe the intended product.**

| Area | Actual status |
|---|---|
| Rule 6 declaration data | **Real**, encoded as versioned JSON, sourced and cross-checked. |
| Rule 7 height data | **Real and corrected** — the fabricated PDP-area table was caught and replaced with the verified Table-I. |
| Deterministic rule engine (`backend/rule_engine/`) | **Real and tested** — the one piece of the whole system that is genuinely working end-to-end, against mock input. |
| Report generation (JSON/PDF/DOCX) | **Real and tested** — working, against mock input. |
| AI/vision extraction | **Not implemented.** The prototype uses a hand-written JSON file (`sample_data/sample_scan_input.json`) standing in for real extraction. This is the single largest gap between the current prototype and the specified product. |
| Image capture / mobile frontend / any UI at all | **Not implemented.** No frontend code exists yet. Everything in `UX_SPEC.md` is a specification for future work, not a description of anything built. |
| Backend API (FastAPI or otherwise) | **Not implemented.** No HTTP server exists yet; the vertical slice runs as a local script, not a service. |
| Database / persistence | **Schema only.** `backend/db/schema.sql` defines the target schema; nothing is wired to a live database. The vertical slice's `Scan` object is in-memory only and is discarded after each run. |
| Dashboard, search/retrieval, auth | **Not implemented** — specified, not built. |
| All seven `INNOV-*` items | **Not implemented** — discussed and specified, none built. |

### Known Gaps Found While Writing This Spec Set (new findings, not previously stated)

1. **The `UNCERTAIN` status is defined but never actually produced by the current rule engine.** `backend/rule_engine/engine.py` as it exists today only ever emits `PASS`, `FAIL`, `NOT_APPLICABLE`, or `NOT_MEASURABLE`. No current logic path produces `UNCERTAIN` (e.g., for low-confidence-but-technically-detected declarations, or category-ambiguous applicability). This is a real gap between the compliance model as specified (`COMPLIANCE_ENGINE_SPEC.md`) and the code as written — it needs either new evaluation logic or an explicit decision that `UNCERTAIN` is not yet needed at the current scope.
2. **`evidence_image_id` and `evidence_bbox` exist in the target database schema (`schema.sql`) but not in the in-memory `RuleEvaluation` data model (`backend/rule_engine/models.py`).** The Python dataclass is missing fields the schema already anticipates. This must be reconciled before `F6` (evidence viewing) can be implemented against real evaluation records, not just against the schema design.

These two items should be treated as immediate engineering to-dos, not just documentation notes — they are the kind of drift this whole spec set exists to catch.
