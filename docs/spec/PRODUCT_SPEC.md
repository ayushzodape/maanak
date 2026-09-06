# PRODUCT_SPEC.md — Maanak

*Reconstructed from research and decisions already established in this conversation. Nothing here is a new proposal.*

## What Maanak Is

Maanak is a decision-support software system, built for SIH26034, that screens packaged commodities for compliance with the **Legal Metrology (Packaged Commodities) Rules, 2011**. It accepts an image — a photograph of a physical package/label, or an e-commerce product listing image — extracts the mandatory declarations printed or displayed on it, evaluates each against versioned, citation-traceable legal rules, and produces a compliance result, evidence trail, and exportable report.

Maanak is explicitly **not** a legal authority. It is a screening and triage tool that surfaces likely-compliant, likely-non-compliant, and genuinely uncertain cases for a human official to review — built directly on the earlier finding that no existing government or commercial system does template-free, statute-specific compliance checking of an arbitrary, already-in-market package.

## Who It Is For

**Primary user: enforcement officials** (Legal Metrology inspectors and related enforcement roles within the Department of Consumer Affairs' Legal Metrology apparatus). This was explicitly confirmed by the official SIH26034 problem statement text, which repeatedly names "enforcement officials," "dashboards for enforcement officials," and "role-based user access" — and never names consumers or manufacturers as users.

**Explicitly not the target user (confirmed, not inferred):**
- Consumers — no consumer-facing "scan before you buy" feature is in scope.
- Manufacturers/packers/importers — no pre-print self-check QA tool is in scope. (This segment is already served by mature commercial products, per the earlier competitive-landscape research — building for it would be redundant, not differentiated.)

## Core Problem

Manual, visual inspection of packaged-commodity labels by a small enforcement workforce cannot scale to the volume and variety of packaged goods sold across Indian retail and e-commerce. Non-compliance — missing declarations, incorrect font sizes, improperly formatted MRP — goes undetected until a complaint or spot-check, because checking today is entirely manual and inspector-driven.

## Core User Journey

1. An enforcement official opens Maanak on a mobile phone (web app, no install required).
2. They capture a photo of a physical package/label, or supply a product-listing image, and enter a product name.
3. Maanak extracts the mandatory declarations from the image (an AI/vision step — see `COMPLIANCE_ENGINE_SPEC.md`).
4. Maanak deterministically evaluates each declaration against the versioned rule data and returns a per-declaration result: **PASS / FAIL / UNCERTAIN / NOT_APPLICABLE / NOT_MEASURABLE**, each citing the specific rule clause it was checked against.
5. The official reviews the result, sees which parts of the image support each finding, and can generate a downloadable compliance report (PDF and an editable format).
6. The scan is saved to a searchable history; aggregated results surface on a dashboard.

## What the Product Must Do

Directly from the official SIH26034 brief (confirmed authoritative scope anchor):
- Scan and analyze images of packaged commodities (physical labels and product listings).
- Detect mandatory declarations prescribed under the Legal Metrology Rules.
- Check correctness, completeness, and placement of declarations.
- Identify missing or non-compliant declarations.
- Check readability and font-size requirements.
- Generate compliance reports and violation summaries, in PDF and an editable format.
- Maintain a repository of scanned products and compliance history, with search/retrieval.
- Provide dashboards for enforcement officials.

## What It Must NOT Claim to Do

These constraints were established across the legal-domain research, the compliance-engine architecture discussion, and the corrected-Rule-7 episode, and are treated as hard product boundaries, not stylistic preferences:

- **Must not claim to be an official government inspection report or a legal determination.** The established report-design principle is: *"Digital Compliance / Screening Report,"* never *"Official Government Inspection Report,"* unless a competent authority confirms that exact template (unconfirmed — see `LEGAL_RESEARCH_STATUS.md`).
- **Must not assert a precise physical measurement (e.g., font height in millimetres) without an actual scale reference in the evidence.** Where no reliable scale reference exists, the result must be `NOT_MEASURABLE` — never a guessed PASS or FAIL. This is a hard architectural rule, established after an earlier draft's fabricated measurement table was caught and corrected.
- **Must not claim exhaustive legal coverage.** Only a defined subset of Rule 6 and the corrected Rule 7 are currently encoded; every rule file carries an explicit `known_gaps` field, and the product must not imply it checks every LMPC provision.
- **Must not let AI/vision extraction output a compliance verdict.** Extraction only populates observed declarations; only the deterministic rule engine decides PASS/FAIL/UNCERTAIN/NOT_APPLICABLE/NOT_MEASURABLE. This separation was established as a non-negotiable architectural principle early in the design discussion and repeated at every subsequent stage.
- **Must not claim certainty it doesn't have.** Any result involving low extraction confidence, ambiguous rule applicability, or insufficient image quality must be visibly marked for human review, not silently resolved.

# CANONICAL PRODUCT REQUIREMENTS — Maanak

This is the single source of truth for comparing the current prototype against the intended product, as established across this entire project's research, legal analysis, architecture decisions, and prototype planning. Every row traces back to a specific earlier decision — nothing here is a new requirement.

**Status legend** (used honestly, not aspirationally):
- **IMPLEMENTED AND TESTED** — real code exists and has been run successfully.
- **PARTIALLY IMPLEMENTED** — some real code/data exists but the requirement is not fully met.
- **SCHEMA ONLY** — the target data structure exists (e.g., in `schema.sql`) but nothing reads/writes it yet.
- **NOT IMPLEMENTED** — specified, nothing built.
- **DECIDED** — a product/scope decision, not a code artifact — "implemented" doesn't apply.
- **UNRESOLVED** — an open research question, not a build task.
- **NOT YET APPLICABLE / NOT YET POSSIBLE** — depends on another unimplemented requirement first.

| ID | Requirement | Priority | Source/Reason | Acceptance Criteria | Status |
|---|---|---|---|---|---|
| CORE-001 | Product must never claim to be a legal authority or an official government report — decision-support/screening framing only. | P0 | Regulatory safety principle, `PRODUCT_SPEC.md` | No UI or report text asserts a legal determination or official-report status. | PARTIALLY IMPLEMENTED — disclaimer text exists in `report_data.py`; no UI exists yet to check. |
| CORE-002 | Primary and only user is enforcement officials — not consumers, not manufacturers. | P0 | Official SIH26034 brief, `PRODUCT_SPEC.md` | No consumer- or manufacturer-facing feature exists anywhere in the product. | DECIDED |
| CORE-003 | Never assert a physical measurement (e.g., font height in mm) without a real scale reference in evidence; return `NOT_MEASURABLE` instead. | P0 | Corrected-Rule-7 episode, `COMPLIANCE_ENGINE_SPEC.md` | `measurement.py` returns `NOT_MEASURABLE` whenever `scale_reference_available` is false. | IMPLEMENTED AND TESTED |
| CORE-004 | All rule data versioned, never hardcoded inline; every decision traceable to a specific `rule_id`/clause. | P0 | Architecture principle, reinforced by the fabricated-table incident | Every `RuleEvaluation` references a `rule_id` resolvable to a specific JSON file and clause. | IMPLEMENTED for Rule 6/Rule 7; not yet extended to other declarations/amendments |
| SCAN-001 | Mobile image capture via native camera (file input with `capture="environment"`), not a live in-page camera stream. | P0 | Codex build guide decision; official brief, "image upload and scanning functionality" | A real phone photo, taken via the native camera, reaches the backend intact. | NOT IMPLEMENTED |
| SCAN-002 | Source-type selection (physical photo / e-commerce listing), stored and never silently mixed or defaulted. | P1 (P0 for the physical-photo path alone) | `FUNCTIONAL_SPEC.md` F2; official brief names "product listings" explicitly | A scan of an e-commerce screenshot is evaluated against the e-commerce-appropriate rule subset, not the physical-package one. | PARTIALLY IMPLEMENTED — `SourceType` enum exists in `models.py`; no UI selection flow; no actual rule-subset differentiation by source type in `engine.py` yet. |
| AI-001 | Vision-based declaration extraction populating the `Declaration` schema; never outputs a compliance verdict; reports `NOT_DETECTED` rather than guessing. | P0 | Core "AI observes, rules decide" architecture principle, established from the start of this project | Extraction never asserts a value not actually visible in the image; degrades to all-`NOT_DETECTED` on API failure rather than crashing. | NOT IMPLEMENTED — `sample_data/sample_scan_input.json` stands in for this. |
| AI-002 | Extraction reports whether a usable physical scale reference is present, supporting `NOT_MEASURABLE` logic and `INNOV-001`. | P1 | `COMPLIANCE_ENGINE_SPEC.md` | `Declaration.scale_reference_available` is populated truthfully by real extraction, not hand-set sample data. | NOT IMPLEMENTED — field exists in the data model and sample data only. |
| RULE-001 | Deterministic evaluation of declarations against versioned rule data, producing the five-state status model. | P0 | Core architecture | Every `RuleEvaluation` traces to a specific `rule_id`. | PARTIALLY IMPLEMENTED — PASS/FAIL/NOT_APPLICABLE/NOT_MEASURABLE work and are tested; see RULE-002. |
| RULE-002 | `UNCERTAIN` must be a genuinely producible outcome (e.g., low-confidence detection, category-ambiguous applicability), not just a defined enum value. | P0 | `COMPLIANCE_ENGINE_SPEC.md` status definitions | At least one realistic input scenario produces an `UNCERTAIN` result from `engine.py`. | **NOT IMPLEMENTED** — gap found while writing this spec set: no current code path ever produces `UNCERTAIN`. |
| RULE-003 | Rule 7 height lookup must use the corrected, net-quantity-keyed Table-I; the fabricated PDP-area table must never be reintroduced. | P0 | `LEGAL_RESEARCH_STATUS.md` §5 | `rule-7.json` contains only the verified table; `measurement.py` implements the net-quantity-keyed lookup. | IMPLEMENTED AND TESTED |
| RULE-004 | The Table-II gap (length/area/number-declared commodities) must yield `NOT_APPLICABLE` with an explanatory reason, never an invented threshold. | P0 (safety behavior) | `LEGAL_RESEARCH_STATUS.md` §2 | A non-weight/volume unit yields `NOT_APPLICABLE` with a reason referencing the unresolved gap. | IMPLEMENTED AND TESTED |
| RULE-005 | Every rule-data file must carry a documented source and a `known_gaps`/`verification_note` field. | P1 | Fabricated-table incident | All rule JSON files include these fields. | IMPLEMENTED for `rule-6.json` and `rule-7.json`. |
| EVID-001 | Every completed scan has at least one retrievable evidence image, attached and stored. | P0/P1 | Official brief, "attachment of photographs and supporting evidence" | A completed scan's evidence image can be retrieved after the fact. | SCHEMA ONLY — **gap found:** `evidence_image_id`/`evidence_bbox` exist in `schema.sql` but not in the `RuleEvaluation` dataclass in `models.py`. |
| EVID-002 | Tapping/clicking a specific check reveals the evidence region that supports it. | P1 | Handoff doc's own MVP recommendation | Tapping a check shows the relevant image region, not just a text claim. | NOT IMPLEMENTED |
| RPT-001 | Canonical JSON + PDF + editable-format (DOCX) report, both files generated from one shared data structure, disclaimer always present, never labeled an official report. | P0 | Official brief; regulatory safety principle | PDF and DOCX never disagree; disclaimer text present in both. | IMPLEMENTED AND TESTED (against mock scan data) |
| HIST-001 | Every completed scan persisted and retrievable later. | P0 (minimal) / P1 (full browsing) | Official brief, "repository... compliance history" | A scan performed earlier can be reopened with an identical result. | SCHEMA ONLY — `vertical_slice.py` discards the `Scan` object after writing output files; nothing is persisted. |
| HIST-002 | Search/filter over scan history by product name/status/date. | P1 | Official brief, "search and retrieval facility" | Searching an existing product name returns that scan. | NOT IMPLEMENTED |
| DASH-001 | Aggregate dashboard (status counts + recent-activity table), reading from the same repository as reports/history. | P1 | Official brief; single-source-of-truth architecture principle | Dashboard counts exactly match individually-viewable scan records. | NOT IMPLEMENTED |
| AUTH-001 | Minimal, genuinely server-enforced two-role access control (inspector/admin). | P2 (deliberately minimal) | Official brief, "role-based user access and secure authentication" | A wrong-role request is rejected server-side, not just hidden in the UI. | NOT IMPLEMENTED — roles exist only as a `CHECK` constraint enum in `schema.sql`. |
| UX-001 | Home/Scan-entry screen as default landing surface; scan action reachable in one tap. | P0 | `UX_SPEC.md` Screen 1 | Scan action reachable with no scroll from app open. | NOT IMPLEMENTED |
| UX-002 | Capture/source-selection screen; source type must be resolved before submission is possible. | P0/P1 | `UX_SPEC.md` Screen 2 | Cannot submit a scan without a source-type selection. | NOT IMPLEMENTED |
| UX-003 | Processing screen with honest status text and a retry path on failure. | P0 | `UX_SPEC.md` Screen 3 | An induced API failure surfaces a clear retry state, not a frozen UI. | NOT IMPLEMENTED |
| UX-004 | Compliance result screen — overall status first, individual FAIL never masked by an overall rollup, color-blind-safe status distinction. | P0 | `UX_SPEC.md` Screen 4 | A mixed-result scan visibly shows the individual FAIL even when overall status reads NEEDS_REVIEW. | NOT IMPLEMENTED |
| UX-005 | Report export screen; disclaimer visible before download; real mobile file download/share behavior. | P0/P1 | `UX_SPEC.md` Screen 5 | PDF download triggers a real mobile save/share, not an inline unreadable preview. | NOT IMPLEMENTED |
| UX-006 | Scan history screen; status scannable at a glance; explicit empty/no-results states. | P1 | `UX_SPEC.md` Screen 6 | A filtered search with no matches shows an explicit "no results." | NOT IMPLEMENTED |
| UX-007 | Dashboard screen; desktop-primary but usable on mobile; graceful degradation on data-load failure. | P1 | `UX_SPEC.md` Screen 7 | Dashboard doesn't fully block on a partial data-load failure. | NOT IMPLEMENTED |
| UX-008 | Minimal login/role-context screen. | P2 | `UX_SPEC.md` Screen 8 | Session expiry routes back to login rather than silently failing subsequent requests. | NOT IMPLEMENTED |
| DEMO-001 | Live, unstaged scan of a real product on a real phone during the demo. | P0 (demo) | `DEMO_SPEC.md` ideal sequence | Presenter photographs a product physically present in the room, live. | NOT YET POSSIBLE — depends on SCAN-001, AI-001. |
| DEMO-002 | Deliberate, narrated surfacing of a `NOT_MEASURABLE`/`UNCERTAIN` result during the live demo. | P0 (demo) | `DEMO_SPEC.md`; compliance-engine honesty principle | Presenter shows and narrates at least one such result live. | NOT YET POSSIBLE — additionally blocked on RULE-002. |
| DEMO-003 | Public-tunnel or real deployment used for the demo network path, not same-WiFi local-IP reachability. | P0 (demo reliability) | Codex build guide, demo-day risk analysis | Demo app verified reachable from a phone on mobile data, not just venue WiFi. | NOT YET APPLICABLE — no deployment exists to test. |
| DEMO-004 | Pre-seeded scan history/dashboard and a recorded fallback video, prepared in advance. | P1 (demo) | `DEMO_SPEC.md` pre-demo checklist | Dashboard is non-empty on first view before any live scan; fallback video plays offline. | NOT YET APPLICABLE |
| INNOV-001 | Barcode-based visual scale estimation. | P1 (recommended, not yet locked in) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md` for full acceptance framing. | NOT IMPLEMENTED |
| INNOV-002 | Evidence-backed explanations as a first-class presentation discipline. | P1 (recommended) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md`. | PARTIALLY IMPLEMENTED — the `reason` field exists and is populated; the human-legibility discipline is not yet enforced in any UI/report layout. |
| INNOV-003 | Multilingual explanations. | P2 (recommended) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md`. | NOT IMPLEMENTED |
| INNOV-004 | Manufacturer/brand trend view. | P2 (recommended) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md`. | NOT IMPLEMENTED — blocked on HIST-001. |
| INNOV-005 | Corrective "what compliant looks like" generator. | P2 (recommended, conditional) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md`. | NOT IMPLEMENTED |
| INNOV-006 | Tamper-evident evidence hash-chaining. | P3 (recommended) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md`. | NOT IMPLEMENTED — blocked on HIST-001/EVID-001. |
| INNOV-007 | Shelf scanning (multi-product). | P3 (recommended, not for core build) | `INNOVATION_SPEC.md` | See `INNOVATION_SPEC.md`. | NOT IMPLEMENTED |
| LEGAL-001 | Re-verify SIH26034 theme and deadline against a live, dated portal screenshot. | P0 | `LEGAL_RESEARCH_STATUS.md` §2 | A dated screenshot/PDF replaces the current conflicting claims. | UNRESOLVED |
| LEGAL-002 | Determine what governs minimum character height for length/area/number-declared commodities post-Table-II-omission. | P0 | `LEGAL_RESEARCH_STATUS.md` §2 | A confirmed answer is encoded into `rule-7.json`, replacing the current `NOT_APPLICABLE` placeholder. | UNRESOLVED |
| LEGAL-003 | Confirm whether Legal Metrology enforcement uses a prescribed report/violation-notice format Maanak's report should mirror. | P1 | `LEGAL_RESEARCH_STATUS.md` §2 | A confirmed template reference, or a documented decision to proceed without one. | UNRESOLVED |
| LEGAL-004 | Confirm the exact gazette text/date of the Feb 2026 e-commerce country-of-origin amendment before citing it in pitch material. | P1 | `LEGAL_RESEARCH_STATUS.md` §2 | Gazette-sourced confirmation, or removal of the claim from pitch material. | UNRESOLVED |

---

## How to use this table

Diff your actual codebase against the **Status** column, item by item. Any row where your prototype's real behavior doesn't match the stated **Acceptance Criteria** is drift — either the code needs to catch up, or this document needs a deliberate, recorded update (never a silent one). The two **NOT IMPLEMENTED** findings under RULE-002 and EVID-001 were discovered by cross-checking the sub-specs against the actual prototype code while writing this table — that cross-checking is exactly the exercise you should repeat every time the prototype changes materially.
