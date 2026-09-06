# Maanak Design Reference

## Purpose and authority

The existing AI Studio prototype is the visual source of truth for Maanak. The
canonical specifications in `docs/spec/` are the product and behavior source of
truth. Future implementation should place specified functionality inside this
visual system.

Preserve the prototype's visual identity. Correct misleading content,
technically impossible behavior, legal-rule drift, accessibility problems, and
responsive failures without replacing the visual language.

## A. Design system extracted from the prototype

### Visual personality

- Institutional, evidence-first, government-workbench feel: serious, dense,
  traceable, and operational rather than consumer-oriented.
- Light cool-gray application canvas (`slate-100`-like) with white content
  surfaces and a dark navy header/footer (`slate-900`-like).
- Blue is the primary action and active-navigation color (`blue-600`/`blue-700`).
- Amber/gold is used for statutory emphasis, national accent details, and tools.
- Status colors are semantic: emerald for compliant, rose/red for
  contravention, amber for review, and indigo for statutory exemption. Status
  must also include text and an icon; color alone is not sufficient.
- A thin saffron/white/green tricolor rule is used as a restrained institutional
  accent at the top of the header.

### Typography

- The prototype loads Plus Jakarta Sans for interface text, Cinzel for the
  `मानक`/MAANAK brand treatment, and JetBrains Mono for identifiers, citations,
  timestamps, measurements, hashes, and OCR text.
- Interface typography is compact and semibold/bold, with uppercase tracked
  eyebrow labels and dark navy headings.
- Serif treatment is reserved for the document/notice preview and selected
  brand or institutional marks; it is not the general application font.

### Layout and spacing

- Centered `max-w-7xl` shell with responsive horizontal padding (`px-4` to
  `sm:px-6`), compact vertical rhythm, and repeated `space-y-4`/`space-y-6`
  sections.
- White cards use small-to-medium rounded corners (`rounded`, `rounded-lg`),
  thin `slate-200` borders, and restrained `shadow-sm` elevation.
- Dense desktop layouts use 12-column grids. The workbench is a 5/7 evidence
  and audit split at large widths, collapsing to one column below `lg`.
- The evidence canvas can remain sticky near the top of the viewport on the
  workbench. Tables and navigation may scroll horizontally when necessary.
- Modals use a dark translucent backdrop with blur, a dark header, a scrollable
  body, and a clear footer action area.

### Components and interaction language

- Sticky two-tier header: institutional identity and role controls above a
  horizontal icon-plus-label navigation bar.
- Active navigation is a filled blue rounded tab; inactive navigation is muted
  light text with a dark hover surface. Small badges show repository counts or
  live status.
- Primary buttons are compact, filled blue (or rose for a contravention action)
  with white text, an icon, modest radius, and a small shadow. Secondary
  actions are outlined or slate-filled. Destructive/high-consequence actions
  must remain visually distinct and require appropriate confirmation.
- Case selectors are compact rounded pills with a dark selected state and a
  small status dot.
- Evidence cards combine a heading, rule/citation metadata, detected OCR text,
  confidence, legal requirement, canonical finding, and an evidence action.
- The workbench's central reusable pattern is the explainability chain:
  detected string → statutory rule → algorithmic metric → human review.
- The package visualizer uses a dotted inspection canvas, a framed package
  illustration, and colored bounding boxes with small field labels. Selecting a
  box highlights/scrolls to its corresponding finding.
- Tables use a pale header row, compact rows, mono case identifiers, category
  chips, and a right-aligned action column.
- Dashboard cards use short uppercase labels, mono numerals, small supporting
  badges, horizontal progress bars, and a recent-activity feed.
- Notices and adjudication use centered, focused modal dialogs with dark
  institutional headers, generous document whitespace, and explicit close,
  cancel, and primary actions.
- Existing motion is subtle: `transition-colors`, `transition-all`, short
  progress transitions, toast fade/slide-in, modal fade/zoom-in, and drawer
  slide-in-from-right. Preserve motion as feedback, not decoration.

### Content and state treatment

- Keep technical metadata visible where it establishes traceability: case ID,
  rule citation, source/version, confidence, evidence reference, timestamp, and
  cryptographic digest.
- Results should lead with the canonical status, then explain the rule,
  observation, evidence, and limitation. Unknown or unmeasurable states must
  remain visibly unresolved.
- Empty, loading, error, retry, and partial-data states should use the same card,
  border, icon, and status-badge language as the prototype.

## B. Screens currently implemented in the prototype

These are the screens/states present in `prototype/src/`, including modal and
drawer states. They are not necessarily compliant with the canonical product
behavior yet.

1. **Inspection Workbench** — active case ribbon; dual-pane package/evidence
   visualizer; bounding-box toggle; Rule 7 caliper; verdict hero; declaration
   audit cards; evidence chain; inspector adjudication entry point.
2. **Statutory Repository** — search/filter toolbar; case table; status chips;
   case detail drawer; notice action.
3. **Enforcement Intelligence Dashboard** — summary metric cards; violation
   prevalence bars; circle-rate list; live inspection/action feed.
4. **Statutory Compendium & Rule 7 Tool** — PDP calculator; Rule 7 matrix;
   aspect-ratio and exemption reference cards.
5. **Form VIII Notice Generator modal** — scrollable document preview, copy,
   print, close, and document footer actions.
6. **Statutory Officer Adjudication modal** — finding summary, four decision
   choices, justification, notes, PIN, and signed-override action.
7. **Custom Commodity Scan modal** — preset/manual/upload modes and generated
   in-memory sample case flow.
8. **Helpline modal** — sample complaint list and case-link action.

The supplied screenshots show the workbench, repository, dashboard (including
its lower activity section), compendium, notice modal, and adjudication modal.

## C. Reusable components discovered

- `Header` — institutional masthead, tricolor accent, role switcher, primary
  navigation, helpline action, live-status badge.
- `InspectionWorkbench` — case ribbon, visualizer/audit split, verdict and
  declaration presentation, evidence chain, exports/actions.
- `PackageArtwork` — package illustrations, inspection canvas, bounding-box
  overlays, selected state, and caliper presentation.
- `StatutoryRepository` — search/filter controls, repository table, status
  badges, detail drawer, and row actions.
- `EnforcementDashboard` — metric cards, progress bars, rate rows, and activity
  feed.
- `StatutoryCompendium` — reference header, calculator cards, statutory matrix,
  and explanatory rule panels.
- `NoticeGeneratorModal` — modal shell plus document-preview pattern.
- `InspectorOverrideModal` — modal shell plus decision-card/form pattern.
- `CustomScanModal` and `HelplineModal` — modal shell, upload/form controls,
  preset cards, and alert/info strips.
- Shared patterns rather than a formal design-system package: status badges,
  mono metadata, white bordered cards, dark section headers, icon-led actions,
  backdrop overlays, toasts, and responsive grid containers.

## D. Missing screens/states required by the product specification

The canonical UX specification defines eight functional screens. The current
prototype does not provide these as a complete, truthful flow:

1. **Home / Scan Entry** — one-tap scan entry for a logged-in enforcement
   official.
2. **Capture / Source Selection** — physical photo vs. e-commerce listing,
   product name, native camera/file capture, preview, and required source choice.
3. **Processing** — honest `UPLOADING`, `ANALYZING`, `EXTRACTING`, and
   `EVALUATING` states with failure and retry paths.
4. **Canonical Compliance Result** — result screen driven by the five-state
   model: `PASS`, `FAIL`, `UNCERTAIN`, `NOT_APPLICABLE`, and `NOT_MEASURABLE`.
   The workbench is a visual precursor, not a compliant implementation of this
   screen.
5. **Report Export** — disclaimer-visible PDF/editable/JSON export state with
   real mobile download/share feedback.
6. **Scan History** — persisted, searchable/filterable history with explicit
   empty and no-results states. The repository is currently in-memory sample
   data.
7. **Dashboard** — same-repository aggregate counts and recent activity with
   graceful partial-load failure. The current dashboard uses hard-coded
   violation/circle statistics in places.
8. **Login / Role Context** — minimal server-enforced session and role context.

Also missing or incomplete across those screens: real vision extraction,
retrievable evidence images tied to findings, a genuinely producible
`UNCERTAIN` path, source-specific rule subsets, persistence, and the real mobile
camera path (`capture="environment"`).

## E. Visual/content inconsistencies to fix during implementation

These are corrections required by the canonical specifications; they do not
justify a new visual style.

- **Official-authority implication:** Prototype copy says “Government of India,”
  “National ... Portal,” “Official Document,” “Print Official Notice,” and
  “government-grade.” Maanak must be described as digital compliance screening,
  not an official inspection system or legal authority. Retain the institutional
  visual tone only where the wording is truthful.
- **Unsupported calibration claim:** “ISO/IEC 17025 Calibrated” and “calibrated
  optical instruments” must not appear for ordinary phone-photo evidence.
  Measurement UI must show estimate/reference/confidence/assumptions or
  `NOT_MEASURABLE`.
- **Rule 7 drift:** The prototype calculator and sample data key character
  height to PDP area and show a 1/1.5/2/3/4/6 mm table. The canonical verified
  Rule 7 Table-I is keyed to declared net quantity in weight/volume; the
  unresolved length/area/number gap must remain `NOT_APPLICABLE` or otherwise
  explicitly uncertain. Do not reintroduce the superseded PDP-area table.
- **Status vocabulary drift:** Prototype statuses (`COMPLIANT`,
  `NON_COMPLIANT`, `NEEDS_REVIEW`, `STATUTORILY_EXEMPT`) must be mapped to the
  canonical result model without hiding individual `FAIL`, `UNCERTAIN`, or
  `NOT_MEASURABLE` findings. Preserve their semantic color treatment only as a
  presentation mapping.
- **Legal-data freshness:** “GSR 128(E) E-Commerce Enforced” and footer legal
  claims need source/version/effective-date verification before being presented
  as current law. The legal status document currently marks the February 2026
  amendment as unconfirmed.
- **User scope:** “Packer Self-Auditor (Enterprise)” conflicts with the
  canonical primary-user decision that enforcement officials are the target.
  Preserve the role-control visual pattern, but implement only verified roles.
- **Human override semantics:** Adjudication is a useful visual pattern, but a
  human override must be clearly separated from the deterministic screening
  result and auditable; it must not silently rewrite the AI observation or legal
  rule interpretation.
- **Evidence truthfulness:** Sample OCR, addresses, ROC checks, exact optical
  measurements, penalty estimates, and complaint integrations must be labelled
  as fixtures/demo data or replaced with real evidence. Never make synthetic
  evidence look like a live scan.
- **Mobile-first behavior:** Existing layouts are desktop-first in the captured
  prototype. Preserve the dense card language while adding touch-sized controls,
  one-column result flow, native camera capture, readable badges, and no
  accidental horizontal overflow.
- **Accessibility:** Keep icons and text alongside semantic color, add visible
  focus states and labels to icon-only controls, and ensure modal/drawer focus
  and close behavior are usable by keyboard and touch.

## F. Proposed implementation strategy

1. **Treat this document as the visual contract.** Reuse the existing Tailwind
   classes, loaded fonts, Lucide iconography, card geometry, status treatment,
   header/footer, modal shells, and evidence-chain pattern.
2. **Build the P0 flow in the prototype language:** Home → capture/source
   selection → processing → canonical result → report export. Use the existing
   workbench as the reference for evidence density, not as the final product
   data model.
3. **Connect behavior to product truth:** native mobile capture; explicit source
   type; structured observations; deterministic versioned rules; all five result
   states; evidence links; honest measurement limitations; and visible retry/error
   states.
4. **Replace in-memory fixture plumbing with shared persistence** before wiring
   history and dashboard. Dashboard counts, repository rows, and reports must
   read the same canonical scan records.
5. **Preserve and adapt existing secondary surfaces:** repository/history,
   dashboard, compendium/reference, evidence viewer, and report modal. Remove or
   relabel unsupported official/legal/calibration claims while retaining their
   layout and interaction patterns.
6. **Validate in the intended order:** typecheck/lint, unit tests for rule and
   status invariants, integration tests for image → observation → evaluation →
   report, responsive checks on a phone viewport, and real packaged-product
   photos covering glare, curvature, small text, shadows, oblique angles, and
   partial labels.
7. **Keep demo-safe mode explicit.** Fixture cases may seed the repository, but
   the UI and internal metadata must distinguish demo fixtures from live AI
   analysis.

## Preservation rule

Product truth (`docs/spec/`) determines what Maanak does. Visual truth (the AI
Studio prototype documented here) determines how it looks and feels. When they
conflict, change behavior/content to satisfy product truth while preserving the
prototype's visual language.
