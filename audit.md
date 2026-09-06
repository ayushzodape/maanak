# Maanak Prototype — Brutal Gap Audit

**Audit date:** 2026-09-06
**Scope:** `prototype/` and the canonical specifications listed in the request.
**Audit posture:** Evidence in code wins. A polished screen is not counted as a working feature. “Implemented” means it works against the specified data boundary and failure modes, not merely that a component or field exists.

## 1. Executive verdict

The current prototype is a static, in-memory React case-review simulator with a strong institutional visual shell. It is not yet the specified Maanak product. There is no backend, no real AI extraction, no deterministic production rule pipeline, no persisted scan repository, no real mobile scan flow, no authentication, and no truthful five-state result model.

The most dangerous aspect is not that features are absent; it is that several absent or simulated features are presented as if they were completed statutory inspection capabilities. The custom upload flow creates a result from manually entered fields and hard-coded heuristics. The seed data presents synthetic OCR, measurements, source evidence, penalties, official notices, government identity, and calibration claims as real-looking inspection output.

### Scores

| Area | Score | Verdict |
|---|---:|---|
| Product completeness | **12/100** | Review UI exists; the core scan-to-report product does not. |
| Functional correctness | **18/100** | Some local interactions work, but canonical statuses, Rule 7 logic, persistence, and evidence boundaries are wrong or absent. |
| UX | **34/100** | Desktop workbench is coherent; the specified mobile-first flow and critical states are missing. |
| Demo readiness | **8/100** | Cannot scan a real product live; no backend or extraction path is present. |
| Innovation | **10/100** | Evidence-chain visuals and a caliper are present, but the intended innovations are not implemented. |
| Technical reliability | **15/100** | No service boundary or persistence; local checks could not run because dependencies are not installed. |

**Overall verdict: 16/100.** This is a visual prototype of an enforcement workbench, not a demo-ready digital compliance screening system.

## 2. Requirement matrix

Status values used here: `IMPLEMENTED_CORRECTLY`, `PARTIALLY_IMPLEMENTED`, `IMPLEMENTED_INCORRECTLY`, `MISSING`, `CANNOT_VERIFY`.

| ID | Requirement | Current Status | Evidence | Severity | Fix |
|---|---|---|---|---|---|
| CORE-001 | Screening tool must not claim legal authority or official government-report status. | IMPLEMENTED_INCORRECTLY | `prototype/src/components/Header.tsx`, `App.tsx`, `NoticeGeneratorModal.tsx`, `index.html`, and `metadata.json` use “Government of India,” “National Portal,” “Official Notice,” “government-grade,” and similar claims. | P0 | Replace claims with truthful digital-compliance-screening language; preserve institutional visual tone. |
| CORE-002 | Enforcement officials are the target user; no consumer/manufacturer product. | IMPLEMENTED_INCORRECTLY | `Header.tsx` exposes `ENTERPRISE_COMPLIANCE_AUDITOR` / “Packer Self-Auditor”; `HelplineModal.tsx` simulates consumer complaints. | P0 | Restrict role/context to the canonical enforcement scope and remove unrelated user-facing flows. |
| CORE-003 | No physical measurement without scale; use `NOT_MEASURABLE`. | IMPLEMENTED_INCORRECTLY | `types.ts` has no `NOT_MEASURABLE`; `CustomScanModal.tsx` accepts arbitrary mm input and generates PASS/FAIL; `PackageArtwork.tsx` calls the caliper visual. | P0 | Require real scale evidence; otherwise emit and display `NOT_MEASURABLE`. |
| CORE-004 | Versioned rule data and traceable rule clauses. | IMPLEMENTED_INCORRECTLY | The UI uses `src/data/statutoryRules.ts`; values and legal text are bundled in frontend code, with no `rule_id`, source version, effective date, or server-side evaluator. | P0 | Put canonical versioned rule records behind a deterministic evaluator and persist the rule version used. |
| SCAN-001 | Native mobile camera/file capture reaches backend intact. | MISSING | No `capture="environment"`, no backend, no upload request; `CustomScanModal.tsx` only reads a local file into a preview. | P0 | Add native camera input, validation, upload state, storage, and scan record creation. |
| SCAN-002 | Explicit physical/e-commerce source selection changes applicable rules. | MISSING | No source-type field in `PackageEvidence`; `CustomScanModal.tsx` offers upload/manual/preset modes, not the required source choice; all generated cases use `OFFLINE_RETAIL`. | P1 | Add required `PHYSICAL_PHOTO`/`E_COMMERCE_LISTING` selection and pass it into evaluation. |
| AI-001 | Real vision extraction creates observations, never verdicts; failures degrade honestly. | MISSING | No `@google/genai` usage, `fetch`, API route, extraction service, observation normalizer, or `NOT_DETECTED` handling. Seed cases are hand-written in `sampleCases.ts`. | P0 | Implement server-side extraction plus normalization and failure fallback. |
| AI-002 | Extraction reports physical scale-reference availability. | MISSING | `types.ts` has no observation/scale-reference model; measurement fields are manually entered or seeded. | P1 | Add scale-reference observation fields and populate only from extraction/evidence. |
| RULE-001 | Deterministic five-state evaluation. | IMPLEMENTED_INCORRECTLY | `types.ts` defines only four non-canonical statuses; `CustomScanModal.tsx:116` calculates status directly from manual booleans; no rule engine exists. | P0 | Build evaluator with `PASS`, `FAIL`, `UNCERTAIN`, `NOT_APPLICABLE`, `NOT_MEASURABLE`. |
| RULE-002 | `UNCERTAIN` is genuinely producible. | MISSING | `ComplianceStatus` excludes it and no source contains `UNCERTAIN` logic. | P0 | Add low-confidence/ambiguous-evidence paths and tests. |
| RULE-003 | Rule 7 uses corrected net-quantity-keyed Table-I; never PDP-area fabricated table. | IMPLEMENTED_INCORRECTLY | `src/data/statutoryRules.ts` defines `RULE_7_TABLE_I` by `pdpAreaSqCm`; `StatutoryCompendium.tsx`, `CustomScanModal.tsx`, seed records, and UI all use PDP area. | P0 | Remove PDP-area lookup from this rule path and use verified net quantity tiers. |
| RULE-004 | Table-II gap returns safe `NOT_APPLICABLE`, not an invented threshold. | MISSING | No canonical `NOT_APPLICABLE`; the frontend calculator uses area thresholds for all cases. | P0 | Add explicit unit/category applicability handling and explanatory gap reason. |
| RULE-005 | Rule files document source, version, verification, and known gaps. | CANNOT_VERIFY | Frontend `statutoryRules.ts` has citations but no rule-file metadata model or verification fields. | P1 | Use versioned rule JSON/data records with required metadata and audit them. |
| EVID-001 | Completed scans retain a retrievable source image. | MISSING | No image storage or scan record; `PackageEvidence` stores `packageSvgId`, not a source image ID. | P0 | Persist uploaded evidence and link it to the scan/evaluations. |
| EVID-002 | Tapping a finding reveals the actual evidence region. | IMPLEMENTED_INCORRECTLY | `InspectionWorkbench.tsx` links a finding to `PackageArtwork.tsx` synthetic artwork and CSS boxes; no source image or crop is displayed. | P1 | Overlay evidence boxes on the stored source image and provide whole-image fallback. |
| RPT-001 | Shared canonical JSON + PDF + editable report with disclaimer. | IMPLEMENTED_INCORRECTLY | Only browser JSON download exists in `InspectionWorkbench.tsx`; `NoticeGeneratorModal.tsx` uses `window.print()` for a simulated notice; no PDF/DOCX generation or canonical report service. | P0 | Generate all formats from one evaluated scan record and display the disclaimer before export. |
| HIST-001 | Completed scans persist and reopen identically. | MISSING | `App.tsx` keeps `cases` in React state initialized from `INITIAL_CASES`; refresh loses custom cases and no database/API exists. | P0 | Persist scan lifecycle/results and reopen by ID. |
| HIST-002 | Search/filter by product, status, date. | PARTIALLY_IMPLEMENTED | `StatutoryRepository.tsx` filters in-memory seeded cases by text/status/category; no date filter or persisted retrieval. | P1 | Move query to repository API and add date/no-result behavior. |
| DASH-001 | Dashboard aggregates the same repository as history/results. | IMPLEMENTED_INCORRECTLY | `EnforcementDashboard.tsx` computes some counts from `cases` but hard-codes violation stats and circle rates. | P1 | Derive every metric from persisted canonical records; add loading/error/empty states. |
| AUTH-001 | Two-role authentication is server-enforced. | MISSING | `Header.tsx` is a client-side role `<select>`; no login, session, server, or permission checks exist. | P1 | Add minimal server auth and reject unauthorized actions server-side. |
| UX-001 | Home/scan-entry landing screen with one-tap scan. | MISSING | `App.tsx` opens directly on `InspectionWorkbench`; no Home screen or scan-entry state. | P0 | Add Home using the existing header/card language and a dominant scan CTA. |
| UX-002 | Capture screen requires source type before submit. | MISSING | `CustomScanModal.tsx` has preset/manual/upload modes and no required source selector or native capture. | P0 | Add explicit source selection, product name, capture, preview, and validation. |
| UX-003 | Honest processing states and retry path. | MISSING | No async scan pipeline, processing component, loading states, error state, or retry path. | P0 | Model and display upload/analyze/extract/evaluate/error states. |
| UX-004 | Result screen leads with canonical overall status and never masks FAIL. | IMPLEMENTED_INCORRECTLY | Workbench has a verdict hero, but uses non-canonical statuses and seed/manual results; no `UNCERTAIN`/`NOT_MEASURABLE`; overall rollup can be edited client-side. | P0 | Render immutable evaluator output with all five states and individual findings. |
| UX-005 | Report export screen with visible disclaimer and mobile download/share. | MISSING | JSON anchor download and browser print only; no export screen, PDF/DOCX, disclaimer gate, or failure feedback. | P0 | Add export state and real generated file/share behavior. |
| UX-006 | Persisted history with empty and no-results states. | PARTIALLY_IMPLEMENTED | Repository table and text/status/category filtering exist, but only against five seeded in-memory cases; no explicit no-results rendering beyond a generic table branch and no persistence. | P1 | Connect to repository API and implement loading, empty, and no-results states explicitly. |
| UX-007 | Dashboard with graceful loading/partial-failure behavior. | IMPLEMENTED_INCORRECTLY | Dashboard visual layout exists, but data is synchronous local state and hard-coded metrics; no loading or failure degradation. | P1 | Add repository-backed loading/error/partial data handling. |
| UX-008 | Login/role-context screen with expiry/error handling. | MISSING | No login component, auth state, session expiry, or credential error handling. | P1 | Add minimal login/session flow consistent with prototype modal/card language. |
| DEMO-001 | Live unstaged real-product scan on phone. | MISSING | No native camera, backend, AI extraction, or deployment path. | P0 | Complete and test SCAN-001 + AI-001 on a real phone/product. |
| DEMO-002 | Narrate natural `NOT_MEASURABLE`/`UNCERTAIN` result. | MISSING | Those statuses cannot be represented in `types.ts` or produced by the UI. | P0 | Implement honest measurement/uncertainty path and seed/test a real case. |
| DEMO-003 | Public deployment/tunnel works on mobile data. | CANNOT_VERIFY | `vite.config.ts` only configures local Vite; no deployment/tunnel configuration or reachable service exists. | P0 | Deploy the actual service and verify from phone mobile data. |
| DEMO-004 | Pre-seeded history plus recorded fallback video. | PARTIALLY_IMPLEMENTED | Five seed cases exist in `sampleCases.ts`; no explicit fixture/live distinction and no fallback video in the repository. | P1 | Mark fixtures internally and prepare verified fallback media. |
| INNOV-001 | Barcode-based scale estimation. | MISSING | No barcode detector, barcode fields, scale assumptions, confidence, or limitations. | P1 | Build only after core extraction/evaluation and preserve `NOT_MEASURABLE`. |
| INNOV-002 | Evidence-backed explanations as first-class presentation. | PARTIALLY_IMPLEMENTED | `DeclarationAuditItem` has `algorithmicFinding`, `evidenceDetails`, and citations; actual evidence is synthetic and no canonical observation/evaluation chain exists. | P1 | Bind explanations to persisted source image, observation, rule version, and evidence. |
| INNOV-003 | Multilingual explanations. | MISSING | No language selector, translation layer, or Hindi/Marathi content. | P2 | Add after canonical English findings are reliable. |
| INNOV-004 | Manufacturer/brand trend view. | MISSING | Dashboard shows hard-coded circle/violation analytics, not manufacturer trends from history. | P2 | Build only after persisted multi-scan history exists. |
| INNOV-005 | Clearly-labelled illustrative compliant example. | MISSING | No compliant-example generator or “ILLUSTRATIVE COMPLIANT EXAMPLE” label. | P2 | Defer until core result and rule explanations are reliable. |
| INNOV-006 | Tamper-evident evidence hash chain. | IMPLEMENTED_INCORRECTLY | Seed `sha256Digest` values and UI labels exist, but no hashing of uploaded evidence, append-only chain, or verification exists. | P3 | Implement only after real evidence persistence; call it tamper-evident, not blockchain. |
| INNOV-007 | Shelf scanning. | MISSING | No multi-product detection/cropping flow. | P3 | Do not build before the single-product pipeline is reliable. |
| LEGAL-001 | Re-verify SIH theme/deadline from dated official evidence. | CANNOT_VERIFY | This is not implemented in the prototype and cannot be established from frontend code. | P0 | Resolve separately before using claims in pitch/UI. |
| LEGAL-002 | Resolve post-2017 length/area/number height rule gap. | CANNOT_VERIFY | Prototype assumes PDP-area thresholds instead of representing the unresolved gap. | P0 | Obtain verified legal answer or keep the path safely non-applicable/uncertain. |
| LEGAL-003 | Confirm prescribed enforcement report/notice format. | CANNOT_VERIFY | `NoticeGeneratorModal.tsx` invents a Form VIII-like official notice but no verified template source is linked. | P1 | Verify source or relabel as a non-official screening report. |
| LEGAL-004 | Verify exact February 2026 e-commerce amendment. | CANNOT_VERIFY | `Header.tsx`, footer, and `statutoryRules.ts` present GSR 128(E) as enforced/current without gazette verification. | P1 | Verify against gazette or remove current-law assertion. |

### Requirement-matrix conclusions

- **Correctly implemented against the canonical product:** effectively none of the end-to-end P0 requirements.
- **Partially implemented:** repository-like filtering, dashboard shell, evidence/explanation fields, and fixture seeding.
- **Incorrectly implemented:** product identity, measurement, Rule 7, statuses, report behavior, dashboard metrics, and evidence presentation.
- **Missing:** the actual scan pipeline, AI extraction, persistence, authentication, processing/error states, canonical result model, and nearly every innovation.

## 3. Top 10 problems

1. **No real scan pipeline.** A phone cannot submit a real product image to any backend because no backend or native camera path exists. `prototype/src/components/CustomScanModal.tsx` only creates local preview data.
2. **The custom “scan” is a manual result generator.** Product text, tax phrase, email presence, PDP dimensions, and measured height are user-controlled inputs; booleans and string heuristics directly determine the generated status.
3. **The prototype claims official authority.** Header, metadata, footer, notice modal, and document text make the UI look like a Government of India enforcement portal and official notice system. This conflicts directly with Maanak’s product identity.
4. **Rule 7 is the wrong rule model.** The frontend uses PDP-area tiers and a caliper to produce exact millimetre compliance. The canonical correction says the verified Table-I is keyed to declared net quantity and unsupported measurement must remain `NOT_MEASURABLE`.
5. **Canonical uncertainty is impossible.** `ComplianceStatus` has four custom values and no `UNCERTAIN` or `NOT_MEASURABLE`. A poor image, ambiguous declaration, or absent scale cannot be represented honestly.
6. **Evidence is not evidence.** Bounding boxes point to `PackageArtwork` synthetic illustrations, not uploaded source images. There is no source image ID, stored image, evidence crop, or retrieval path.
7. **All persistence is fake.** `App.tsx` stores cases in React memory. Custom scans disappear on refresh; dashboard, repository, and workbench are merely synchronized local state during one session.
8. **Dashboard numbers are not trustworthy.** `EnforcementDashboard.tsx` computes headline counts from local cases but uses hard-coded violation statistics and circle rates unrelated to the actual five seed records.
9. **Reports are not the required reports.** The only real export is a JSON data URL. The notice modal prints a simulated document and even labels it official; there is no shared canonical PDF/DOCX report generation.
10. **No failure-mode story.** There are no upload failures, extraction timeouts, camera permission errors, network errors, processing states, retries, empty repository state, session expiry, or partial dashboard failures to demonstrate.

## 4. What is already good

These are real implementation positives, but they do not close the product gaps:

- The React app is componentized into coherent surfaces: `Header`, `InspectionWorkbench`, `PackageArtwork`, `StatutoryRepository`, `EnforcementDashboard`, and modal components.
- The prototype has a consistent visual language: navy institutional shell, blue primary actions, white bordered cards, compact metadata, Lucide icons, semantic status colors, and responsive grid classes.
- The workbench presents a useful evidence narrative structure: detected text → rule → metric → inspector action.
- The repository supports local text/status/category filtering and opens a detail drawer.
- The dashboard headline counts are at least computed from the local `cases` array, even though several secondary metrics are hard-coded.
- The UI uses text labels and icons with status colors rather than relying exclusively on color.
- The frontend excludes `.env*` from Git except `.env.example`, which is directionally correct for secret handling.
- `sampleCases.ts` and `statutoryRules.ts` are separated from component rendering, making a future data-boundary correction possible without a full visual rewrite.
- The project has a mobile-responsive CSS intent (`grid-cols-1`, `lg:*`, overflow handling), even though the specified mobile journey and mobile validation are absent.

## 5. What is fake or superficial

### Hardcoded or synthetic data

- All initial cases in `prototype/src/data/sampleCases.ts` are hand-authored fixtures.
- OCR strings, confidence values, citations, evidence details, measurements, hashes, inspectors, addresses, penalties, complaint records, circle statistics, and activity entries are synthetic or hard-coded.
- `PackageArtwork.tsx` renders illustrative package art, not a source photograph.
- `EnforcementDashboard.tsx` hard-codes violation prevalence and circle-rate data.

### Simulated AI and results

- No AI invocation exists despite `@google/genai` and server-side-Gemini metadata in the project configuration.
- `CustomScanModal.tsx` treats manually entered fields and checkboxes as if they were extracted observations.
- It calculates `isMrpOk`, `isHeightOk`, and `isCareOk`, then directly sets overall status to compliant/non-compliant.
- The app never produces an observation object with field, value, unit, confidence, observation status, image ID, and bounding box.

### Visual-only features

- The “Physical Label Visualizer” is an SVG/CSS illustration with overlay boxes.
- “Rule 7 Caliper” is an interactive slider over manually supplied values, not a validated measurement pipeline.
- The “statutory evidence and explainability chain” is presentation only; there is no persisted chain from result to rule to observation to source image.
- SHA-256 labels are display strings; custom cases use random hex via `Math.random()`, not a hash of evidence.
- The notice preview looks official but is browser-rendered text and `window.print()`, not an official authorized template or generated compliance report.
- The role switcher changes client state only and does not enforce access.
- The helpline integration is a local modal with sample complaints; it is not an external integration.

### Misleading UI/content

- “Government of India,” “National Legal Metrology Packaged Commodities Portal,” “Official Document,” “Print Official Notice,” “ISO/IEC 17025 Calibrated,” “calibrated optical instruments,” and “GSR 128(E) E-Commerce Enforced” overstate authority, measurement validity, or legal verification.
- The footer says the statutory basis includes `GSR 128(E) 2024`, while the canonical legal-status document says the February 2026 amendment is unconfirmed.
- Seed copy claims ROC/MCA verification, FSSAI/AGMARK verification, and exact sensor-calibrated optical measurement without connected source evidence.
- The prototype’s four status labels (`COMPLIANT`, `NON_COMPLIANT`, `NEEDS_REVIEW`, `STATUTORILY_EXEMPT`) look like canonical decisions but are not the specified five-state rule results.

## 6. P0 fix list — smallest honest demo-ready slice

This is the minimum path to an honest demo, not a full production build:

1. Remove or relabel all official-authority, legal-determination, calibration, and current-law claims. Add a clear digital compliance screening disclaimer.
2. Add a minimal server/API boundary and a native mobile file input with `accept="image/*" capture="environment"`.
3. Add required source selection for physical photo vs. e-commerce listing and product name capture.
4. Implement a real extraction adapter that accepts the uploaded image, returns structured observations only, and degrades to `NOT_DETECTED`/error state on failure.
5. Implement a deterministic evaluator separate from extraction with versioned rule records and all five canonical result states.
6. Remove the PDP-area Rule 7 calculation from the compliance path. Without a valid scale reference, return `NOT_MEASURABLE`; do not show a precise phone-photo measurement.
7. Persist the image, scan, observations, evaluations, source type, rule version, and evidence references so the result can be reopened.
8. Replace synthetic artwork as the evidence source with the actual uploaded image and show at least one finding’s real highlighted region.
9. Add explicit processing, extraction failure, retry, uncertain, and not-measurable states.
10. Generate at least canonical JSON plus one human-readable export from the same result object, with disclaimer visible before download.
11. Mark all preloaded cases as demo fixtures internally and label them as such if shown.
12. Test the complete flow on a real packaged product and a real phone over a reachable deployment/tunnel. Prepare an explicitly labelled recorded fallback.

Until items 1–10 exist, the prototype should not be presented as a live AI statutory compliance scan.

## 7. P1 product fix list

After the P0 slice is truthful and repeatable:

- Add full e-commerce rule-subset behavior and verify the amendment source before displaying it.
- Add persisted searchable history with product/status/date filters, empty/no-result states, and failed-scan records.
- Make the dashboard read only from the same repository and add loading/error/partial-data handling.
- Add evidence viewer behavior for whole-image and localized bounding-box evidence.
- Add minimal server-enforced inspector/admin authentication and session expiry.
- Add evidence-backed explanation presentation and report traceability.
- Add barcode scale estimation only as an explicitly estimated, assumption-limited enhancement to `NOT_MEASURABLE`.
- Add real-product validation coverage for glare, reflections, curved packaging, small text, poor lighting, shadows, oblique angles, partial labels, and clutter.

## 8. Do not build yet

Do not spend time on these before the P0 pipeline is reliable:

- Shelf scanning / multi-product detection.
- Manufacturer or brand trend analytics.
- Multilingual explanations.
- Corrective “what compliant looks like” generation.
- Tamper-evident hash chaining.
- External helpline, e-Jagriti, or government-system integrations.
- Elaborate Form VIII/legal-notice generation.
- More synthetic package artwork or additional preset cases.
- Full production-grade permissions and enterprise administration.
- Offline queued scans or consumer trust badges.

These are either downstream of persistence/evaluation, explicitly future scope, or distractions from the mobile single-product scan path.

## 9. Recommended build order

1. **Truth and scope cleanup:** remove misleading claims; define canonical scan, observation, evaluation, evidence, and report boundaries.
2. **Minimal service boundary:** add API structure, environment-based server secret handling, health/error responses, and a minimal repository interface.
3. **Mobile capture:** implement native camera/file input, source selection, product name, file validation, and preview.
4. **Evidence persistence:** store the original image and create a scan record before analysis; retain failure states.
5. **Extraction adapter:** implement real vision extraction with normalized observation statuses, confidence, evidence boxes, and safe failure fallback.
6. **Deterministic rules:** load versioned rule data; implement Rule 6 subset, corrected Rule 7 behavior, applicability, uncertainty, and measurement limits; add boundary tests.
7. **Canonical result screen:** adapt the workbench visual language to display immutable five-state evaluations, evidence, limitations, and no masked failures.
8. **Report export:** generate canonical JSON and a human-readable export from one object; verify disclaimer and rule/evidence traceability.
9. **Real-product validation:** run varied physical products through the entire pipeline; record extraction failures and measurement limits honestly.
10. **History/repository:** persist and reopen completed/failed scans; add search/filter and explicit empty/no-result states.
11. **Dashboard:** derive counts and recent activity from repository records; add loading/error/empty behavior.
12. **Authentication:** add minimal server-enforced roles only after the core flow works.
13. **P1 innovations:** evidence-backed explanations, then barcode estimation, then multilingual/trend features only when their prerequisites are real.
14. **Demo hardening:** deploy publicly, test phone mobile data, seed clearly labelled fixtures, and prepare an explicitly labelled offline fallback recording.

## Verification notes

- The repository contains no `MAANAK_CODEX_MASTER_PLAN.md`; the audit proceeded using the provided `AGENTS.md` instructions and the requested canonical specs.
- `npm run lint` in `prototype/` could not run: `tsc` is not installed because dependencies are absent.
- `npm run build` in `prototype/` could not run: `vite` is not installed because dependencies are absent.
- No product files were changed for this audit. This report is the only file created by this task.
