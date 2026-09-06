# UX_SPEC.md — Maanak

**Status:** Canonical. Describes information architecture and interaction flow only — **no visual design (colors, typography, layout system) is specified here**, per explicit instruction. Screens are named by function, not by final UI label.

---

## Screen 1 — Home / Scan Entry

- **Purpose:** The default landing screen for a logged-in official; the entry point to a new scan.
- **What the user sees:** A primary call-to-action to start a scan, and a short list of recent scans below it.
- **Primary action:** "Scan a product."
- **Secondary actions:** Open a specific recent scan; navigate to Dashboard; search.
- **Information hierarchy:** The scan action dominates the screen — this is the single most common action and should require no scrolling or extra taps to reach. Recent scans are secondary, below the fold if needed.
- **Important states:** Empty state (no scans yet) vs. populated state.
- **Errors:** N/A at this screen (errors surface at capture/processing).
- **Loading states:** Recent-scans list may show a brief loading indicator.
- **Mobile behavior:** This is the primary intended surface — single column, large tap target for the scan action, thumb-reachable.
- **Desktop behavior:** Same content, may show more recent-scan rows given the extra space; not the primary intended surface for this screen (officials in the field are on mobile) but must not break.

## Screen 2 — Capture / Source Selection

- **Purpose:** Get a photo into the system and record which source type it is (F1, F2).
- **What the user sees:** A source-type choice (physical photo / e-commerce listing), a product-name field, and the capture action.
- **Primary action:** Trigger the phone's native camera (mobile) or file picker (desktop).
- **Secondary actions:** Retake/reselect the image before submitting; cancel back to Home.
- **Information hierarchy:** Source-type selection must be resolved before or alongside capture — it must not be possible to submit a scan with an ambiguous source type, since it changes which rules apply (F2).
- **Important states:** No image selected yet → image selected, awaiting confirmation → submitted.
- **Errors:** No image selected when submit is attempted; unsupported file type; camera permission denied (mobile).
- **Loading states:** Brief state while the image uploads, before extraction begins (extraction itself is Screen 3).
- **Mobile behavior:** Tapping capture opens the native camera app directly (see the architecture note in `PRODUCT_SCOPE.md`/prototype notes on why a file-input capture trigger is preferred over an in-page live camera stream for reliability). Returns to this screen with the photo shown for confirmation before submit.
- **Desktop behavior:** Standard file picker; same confirmation step before submit.

## Screen 3 — Processing

- **Purpose:** Communicate that extraction and evaluation are happening, without letting the official think the app has frozen.
- **What the user sees:** A loading indicator; ideally a short, honest description of what's happening (not a marketing flourish) — e.g., "Reading declarations," "Checking against Legal Metrology rules."
- **Primary action:** None — this screen is transitional.
- **Secondary actions:** Cancel (should be possible if processing takes unexpectedly long).
- **Information hierarchy:** N/A — single-purpose screen.
- **Important states:** In progress → complete (auto-advances to Screen 4) → failed (see Errors).
- **Errors:** Extraction API failure, timeout, or malformed response — must surface a clear message and route to a state where the official can retry, not a silent hang.
- **Loading states:** This screen *is* the loading state for the pipeline.
- **Mobile behavior:** Must remain responsive/interruptible even on a slow mobile connection; should not block the whole UI thread.
- **Desktop behavior:** Same behavior; no functional difference expected.

## Screen 4 — Compliance Result

- **Purpose:** The core value-delivery screen — show what was found and what it means.
- **What the user sees:** An overall status (PASS / FAIL / NEEDS_REVIEW, rolled up per `COMPLIANCE_ENGINE_SPEC.md`), then a per-declaration breakdown: declaration type, observed value, required value, status, and a plain-text reason citing the specific rule.
- **Primary action:** Generate/download report (→ Screen 5).
- **Secondary actions:** Tap an individual check to view its supporting evidence (F6); start a new scan; return Home.
- **Information hierarchy:** Overall status first and most prominent, then per-check detail in a scannable list — an official should be able to grasp the headline result in under two seconds, then drill into specifics if needed. A FAIL on any individual check must be visually distinguishable even if the overall status is not a hard FAIL (e.g., a NEEDS_REVIEW rollup must not visually read identically to a clean PASS).
- **Important states:** All-PASS; contains at least one FAIL; contains UNCERTAIN/NOT_MEASURABLE entries; extraction produced no usable declarations at all (very poor image).
- **Errors:** No declarations detected at all — this should present as a distinct state ("could not read this label — try retaking the photo") rather than a wall of FAILs, since it's an image-quality problem, not a compliance problem.
- **Loading states:** N/A (arrived at post-loading from Screen 3).
- **Mobile behavior:** Single-column, scrollable list of checks; status badges must be legible at small size and not rely on color alone (per general accessibility practice — color-blind-safe distinction matters more here than in a typical app, since a misread status is a compliance-relevant error).
- **Desktop behavior:** Same content; may show checks in a wider table format given more horizontal space, consistent with the report layout already built (`backend/reports/pdf_report.py`).

## Screen 5 — Report Export

- **Purpose:** Produce a durable artifact of the result (F7).
- **What the user sees:** Options to download PDF and/or the editable format; the disclaimer text visible before export, not buried only inside the file.
- **Primary action:** Download PDF.
- **Secondary actions:** Download editable format; download raw JSON (for technical/audit use, lower visual priority).
- **Information hierarchy:** PDF is the primary expected artifact for an inspector's own records; the editable format is secondary but must be present per the brief's explicit requirement.
- **Important states:** Not yet generated → generating → ready → generated previously (if re-visited).
- **Errors:** Generation failure — must not silently fail; the official should know if a report didn't generate.
- **Loading states:** Brief generation indicator.
- **Mobile behavior:** Must trigger a real file download/share sheet on mobile browsers, not just open an unreadable inline preview.
- **Desktop behavior:** Standard file download.

## Screen 6 — Scan History

- **Purpose:** Browse and search past scans (F8, F9).
- **What the user sees:** A list/table of past scans with product name, date, and status at a glance; a search/filter control.
- **Primary action:** Open a specific past scan (returns to Screen 4 for that record).
- **Secondary actions:** Search by product name; filter by status.
- **Information hierarchy:** Status must be scannable at a glance across the whole list (an official reviewing history cares first about "what failed," not chronology alone).
- **Important states:** Empty (no scans yet); populated; filtered-with-no-results.
- **Errors:** Search returns nothing — show that explicitly, don't show a blank ambiguous screen.
- **Loading states:** List loading indicator for a large history.
- **Mobile behavior:** Simple scrollable list, tap to open.
- **Desktop behavior:** May render as a denser table; this screen is reasonably used on desktop for review work, unlike Screens 2–4 which are mobile-primary.

## Screen 7 — Dashboard

- **Purpose:** Aggregate monitoring view for enforcement officials (F10).
- **What the user sees:** Counts by status (PASS/FAIL/NEEDS_REVIEW), a recent-activity table; in a later iteration, manufacturer/brand trend information (see `INNOVATION_SPEC.md`, `INNOV-004`).
- **Primary action:** None single dominant action — this is a monitoring surface, not a task-flow screen. Tapping a count or row navigates to the relevant filtered history (Screen 6) or scan (Screen 4).
- **Secondary actions:** Navigate to a specific scan or filtered history from any element.
- **Information hierarchy:** Aggregate counts most prominent; detail table below.
- **Important states:** Zero-data empty state; populated state.
- **Errors:** Data load failure — should degrade gracefully, not block the whole screen.
- **Loading states:** Standard loading indicator while counts/table populate.
- **Mobile behavior:** Usable but secondary — this screen is expected to be used more on desktop/tablet for review sessions than in the field.
- **Desktop behavior:** Primary intended surface for this screen; may show more detail/columns than the mobile version.

## Screen 8 — Login / Role Context

- **Purpose:** Minimal authentication and role assignment (F11).
- **What the user sees:** A simple login form; post-login, the app reflects the user's role (e.g., an ADMIN sees additional controls an INSPECTOR does not).
- **Primary action:** Log in.
- **Secondary actions:** None significant for the prototype scope.
- **Information hierarchy:** Minimal by design — this is explicitly not where product effort should concentrate (see `PRODUCT_SCOPE.md`).
- **Important states:** Logged out; logged in; session expired (should route back here, not silently fail subsequent requests).
- **Errors:** Invalid credentials — clear, non-technical error message.
- **Loading states:** Brief auth-check indicator.
- **Mobile behavior:** Single-column form, large tap targets for the login button.
- **Desktop behavior:** Same, no material difference expected.
