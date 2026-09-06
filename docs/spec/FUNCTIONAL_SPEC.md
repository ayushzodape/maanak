# FUNCTIONAL_SPEC.md — Maanak

**Status:** Canonical. Twelve major features, each traced back to the official SIH26034 brief or an architecture decision made during this session. Features are labeled `F1`–`F12` here for internal cross-referencing with `UX_SPEC.md` and `DEMO_SPEC.md`. `CANONICAL_PRODUCT_REQUIREMENTS.md` assigns each one a domain-prefixed canonical ID (`SCAN-001`, `AI-001`, `RULE-001`, etc., per the ID scheme specified for that document) and is the authoritative mapping — treat these `F#` labels as this document's internal shorthand, not the canonical ID.

---

## F1 — Image Capture & Upload

- **Purpose:** Get a usable photograph of a packaged commodity (or a product-listing image) into the system.
- **User interaction:** Official taps a "Scan a product" action; on mobile this opens the phone's native camera directly (not a live in-browser camera stream — see `UX_SPEC.md` for the reasoning); on desktop this is a file picker.
- **Inputs:** A JPEG/PNG image, a product name/label the official enters, and a source-type selection (see F2).
- **Outputs:** A stored evidence image, associated with a new scan record.
- **States:** Idle → capturing/selecting → uploading → uploaded (ready for extraction).
- **Edge cases:** No image selected; image file too large; corrupted/unreadable file; camera permission denied.
- **Acceptance criteria:** A real photo taken on a phone, of a real product, results in a stored image linked to a scan record, with no crash on a blurry, angled, or poorly-lit photo.
- **Priority:** P0

## F2 — Source Type Selection

- **Purpose:** Distinguish a physical package photo from an e-commerce listing image, because they are different evidence types with different applicable rules (e.g., e-commerce listings are exempt from the date-of-manufacture declaration).
- **User interaction:** A toggle/selector shown before or alongside image capture.
- **Inputs:** One of `PHYSICAL_PHOTO`, `E_COMMERCE_LISTING` (the two in-scope types for this build — `SCANNED_LABEL`, `DOCUMENT`, `MANUAL_ENTRY` exist in the data model for future extensibility but are not required user-facing options for MVP).
- **Outputs:** `source_type` field stored on the scan record; this must never be silently mixed or defaulted incorrectly.
- **States:** N/A (a single selection, not a multi-step flow).
- **Edge cases:** Official forgets to select a type — the interaction should require a choice rather than silently defaulting to `PHYSICAL_PHOTO`, since defaulting wrongly on an e-commerce screenshot would apply the wrong rule set.
- **Acceptance criteria:** A scan of an e-commerce listing screenshot is evaluated against the e-commerce-appropriate rule subset, not the physical-package rule subset.
- **Priority:** P1 (P0 for physical photo path alone; the e-commerce path specifically is P1 — see `PRODUCT_SCOPE.md`)

## F3 — Declaration Extraction (AI)

- **Purpose:** Turn a raw image into structured `Declaration` records (one per detected field: manufacturer, net quantity, MRP, date, consumer care, etc.).
- **User interaction:** Automatic, no direct user interaction — happens after F1.
- **Inputs:** The evidence image, the source type.
- **Outputs:** A list of `Declaration` objects, each with a type, raw text, normalized value where applicable, a confidence score, and a presence status (`DETECTED` / `NOT_DETECTED`).
- **States:** Not started → extracting → complete → failed.
- **Edge cases:** Declaration physically present but illegible; declaration absent; duplicate/conflicting declarations (e.g., two different MRPs visible); extraction API failure or timeout.
- **Acceptance criteria:** Every field the extraction step reports as present is actually visible in the source image — extraction must never report a value it cannot see (see `COMPLIANCE_ENGINE_SPEC.md` for the responsibility boundary). On API failure, the system must degrade to an all-`NOT_DETECTED` result rather than crash.
- **Priority:** P0

## F4 — Rule-Based Compliance Evaluation

- **Purpose:** Deterministically decide PASS/FAIL/UNCERTAIN/NOT_APPLICABLE/NOT_MEASURABLE for each declaration, against the versioned LMPC rule data.
- **User interaction:** Automatic, follows F3.
- **Inputs:** The `Declaration` list from F3, the active versioned ruleset.
- **Outputs:** A list of `RuleEvaluation` records — one per applicable rule check — each citing the exact rule ID/clause, the observed value, the required value, the status, a confidence score, and a plain-text reason.
- **States:** Pending → evaluated.
- **Edge cases:** A declaration type has no applicable rule for this product category (→ `NOT_APPLICABLE`); a measurement-dependent rule (font height) has no scale reference in the evidence (→ `NOT_MEASURABLE`, never a guess); conflicting evidence.
- **Acceptance criteria:** Every `RuleEvaluation` traces to a specific `rule_id` that exists in the versioned rule files; no evaluation is ever produced by logic outside `backend/rule_engine/`.
- **Priority:** P0

## F5 — Compliance Result Display

- **Purpose:** Present the evaluation outcome to the official in a way they can act on immediately.
- **User interaction:** Read-only view, reached automatically after F4 completes; tapping a check may reveal the evidence crop that supports it (see F6).
- **Inputs:** The `RuleEvaluation` list and overall scan status/confidence.
- **Outputs:** A rendered result screen (see `UX_SPEC.md`).
- **States:** Loading → result ready.
- **Edge cases:** All-`UNCERTAIN` result (very poor image); mixed result (some PASS, some FAIL, some NOT_MEASURABLE) — the overall status must never mask an individual FAIL.
- **Acceptance criteria:** A test scan with one deliberately missing declaration shows that declaration as FAIL with a specific reason, not folded into a vague overall score.
- **Priority:** P0

## F6 — Evidence Attachment & Viewing

- **Purpose:** Let the official (and, later, a reviewer) see exactly what evidence produced a given finding — this is the auditability requirement from the brief ("attachment of photographs and supporting evidence").
- **User interaction:** Tap/click a specific check to see the associated evidence image (ideally cropped/highlighted to the relevant region).
- **Inputs:** `evidence_image_id` / `evidence_bbox` on the relevant `RuleEvaluation`.
- **Outputs:** A view of the evidence tied to that specific finding.
- **States:** N/A.
- **Edge cases:** Evidence region not localized (whole-image fallback should still work); missing evidence image reference.
- **Acceptance criteria:** For any FAIL or PASS result, the official can see the actual photo evidence, not just a text claim.
- **Priority:** P1 (full bounding-box highlighting is P1; being able to see the source image at all is P0 as part of F1/F5)

## F7 — Report Generation (JSON / PDF / editable format)

- **Purpose:** Produce a durable, exportable artifact of a scan result, per the brief's explicit requirement for "digital compliance reports in PDF and editable formats."
- **User interaction:** "Download report" action from the result screen.
- **Inputs:** The completed scan record (declarations + evaluations + violations).
- **Outputs:** A JSON file (canonical, machine-readable), a PDF, and an editable-format file (DOCX, per the working assumption documented in `LEGAL_RESEARCH_STATUS.md`).
- **States:** Not generated → generating → available.
- **Edge cases:** Report requested before evaluation completes; report regeneration after a re-scan.
- **Acceptance criteria:** PDF and DOCX are both generated from the same underlying report data structure and never contain conflicting information; both carry the required disclaimer text.
- **Priority:** P0 (JSON + at least one export format) / P1 (both PDF and DOCX)

## F8 — Scan Repository / History

- **Purpose:** Persist every scan so it can be reopened, referenced, and aggregated — the brief's "repository of scanned products and compliance history."
- **User interaction:** A "Recent scans" list, tap to reopen a past result.
- **Inputs:** Every completed scan.
- **Outputs:** A persisted, queryable record per scan.
- **States:** N/A.
- **Edge cases:** Very large history (pagination); a scan that failed mid-pipeline (should still be recorded, in a clearly-marked failed state, not silently dropped).
- **Acceptance criteria:** A scan performed earlier in a demo can be reopened and shows the identical result it originally produced.
- **Priority:** P0 (minimal — at least one prior scan retrievable) / P1 (full history browsing)

## F9 — Search & Retrieval

- **Purpose:** Find a previously scanned product without scrolling a full list — explicit brief requirement.
- **User interaction:** A search/filter control over the scan history.
- **Inputs:** Search text (product name), and/or filters (status, date range).
- **Outputs:** A filtered list of matching scans.
- **States:** N/A.
- **Edge cases:** No matches; partial/fuzzy product-name matches.
- **Acceptance criteria:** Searching by a product name used in an earlier scan returns that scan.
- **Priority:** P1

## F10 — Dashboard for Enforcement Officials

- **Purpose:** Aggregate view of compliance status across scans — explicit brief requirement, and the basis for the manufacturer-trend innovation discussed separately (`INNOV-004`).
- **User interaction:** A dashboard screen showing counts and a recent-activity table; read-only for the base version.
- **Inputs:** All scan records in the repository.
- **Outputs:** Aggregate counts (PASS/FAIL/NEEDS_REVIEW), a recent-scans table.
- **States:** Loading → populated → empty (no scans yet).
- **Edge cases:** Zero scans; a scan with a NEEDS_REVIEW-only result should still be counted, not dropped from aggregation.
- **Acceptance criteria:** After performing 3 scans with different outcomes, the dashboard's counts correctly reflect all 3, and the dashboard and the individual scan results never disagree (they must read from the same repository — see `COMPLIANCE_ENGINE_SPEC.md`).
- **Priority:** P1 (basic counts + table) / P2 (trend analytics, filtering)

## F11 — Role-Based Access / Authentication

- **Purpose:** Explicit brief requirement ("role-based user access and secure authentication").
- **User interaction:** A login step before scanning/dashboard access; role determines what's visible (e.g., an INSPECTOR role can scan; an ADMIN role can additionally manage users).
- **Inputs:** Credentials; a role assigned to each user.
- **Outputs:** An authenticated session scoped to a role.
- **States:** Logged out → logged in → session expired.
- **Edge cases:** A role attempting an action outside its permissions must be blocked, not silently allowed.
- **Acceptance criteria:** At minimum two distinct roles exist and are genuinely enforced (an unauthenticated or wrong-role request is rejected, not just hidden in the UI).
- **Priority:** P2 for the prototype/demo (present and real, but deliberately minimal — see `PRODUCT_SCOPE.md` for why this is not where hackathon time should concentrate)

## F12 — Rule Versioning & Traceability

- **Purpose:** Not a user-facing screen, but a hard requirement underlying every other feature: every compliance decision must be traceable to a specific, versioned rule clause, and rule data must never be hardcoded into application logic.
- **User interaction:** Indirect — this is what makes F4's citations and F6/F7's auditability real rather than cosmetic.
- **Inputs:** Versioned rule JSON files under `rules/packaged_commodities/`.
- **Outputs:** Every `RuleEvaluation` record references a `rule_id` resolvable back to a specific rule file and clause.
- **States:** N/A.
- **Edge cases:** A rule amendment changes a threshold — old evaluations must remain attributable to the rule version active at the time they were made, not silently reinterpreted under a newer version.
- **Acceptance criteria:** For any given `RuleEvaluation`, a reviewer can trace `rule_id` → the exact JSON rule file → the exact clause of the LMPC Rules it encodes.
- **Priority:** P0 (this is architectural, not optional)
