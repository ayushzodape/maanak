# DEMO_SPEC.md — Maanak

**Status:** Canonical. Reconstructed from the demo-planning and testing-checklist discussion already established for the mobile-phone, real-product, live web-app demo.

---

## Demo constraints (fixed, not negotiable)

- Device: a real mobile phone, held by the presenter.
- Software: the deployed web app, opened in the phone's mobile browser (not a native app, not a laptop-only demo).
- Subject: a real packaged product, physically present in the room — not a pre-loaded sample image.
- Duration: 3–5 minutes total.
- Network: must not depend on venue WiFi allowing phone-to-laptop local traffic — see the tunnel/hosting guidance already established (public tunnel or a real deployment, not same-WiFi local IP, as the demo-day default).

## Ideal demo sequence (target: ~4 minutes)

1. **Open on Home (Screen 1).** (~10s) Presenter briefly states what the app does in one sentence — the core problem, not a feature list: *"Manual label checking doesn't scale. This scans a product and checks it against the actual Legal Metrology Rules, live."*
2. **Start a scan (Screen 2).** (~20s) Tap "Scan a product," select Physical Photo as source type, enter a product name, tap capture — the phone's native camera opens.
3. **Photograph a real product, live, unstaged.** (~30s) Presenter deliberately does **not** use a pre-selected, perfectly clean sample — this is the single strongest credibility signal in the whole demo, per the earlier discussion of what would convince a judge. Confirm the photo, submit.
4. **Processing (Screen 3).** (~10–20s) Brief, visible processing state — acceptable and expected to take a few seconds; do not apologize for it.
5. **Result (Screen 4).** (~60–90s) This is the core of the demo:
   - Show the overall status.
   - Walk through at least one PASS (with rule citation) and, if the chosen product genuinely has one, one FAIL.
   - **Deliberately surface a NOT_MEASURABLE or UNCERTAIN result if the product produces one naturally** (e.g., font-height check with no scale reference in frame). This is the moment that pre-empts the most likely and most damaging judge objection ("how do you know it's non-compliant and not just an extraction error?") — do not skip past it or treat it as a flaw to hide.
   - Tap into one evidence view (F6) to show the finding is grounded in the actual photo, not an assertion.
6. **Report export (Screen 5).** (~20s) Download the PDF live; show the disclaimer text is present.
7. **Dashboard (Screen 7).** (~30s) Switch to the dashboard (can be shown on a laptop/projector rather than the phone, since this screen is desktop-primary) to show the pre-seeded scan history plus the live scan just performed, demonstrating the repository/monitoring requirement in one view.
8. **Close.** (~15s) One sentence tying back to the actual stated problem: this doesn't replace an inspector's judgment, it triages and evidences what currently takes manual, unaided checking.

## What this sequence is designed to prove

- The tool works on a real, unstaged product (not a cherry-picked sample).
- Every finding is cited to a specific rule, not a vague "AI says."
- The tool is honest about its own limits (the NOT_MEASURABLE/UNCERTAIN moment) rather than always asserting confident certainty.
- The repository/dashboard requirement from the brief is real, not just claimed in a slide.

## Fallback sequence (if live capture fails on stage)

Triggered by: camera permission failure, network failure, extraction API failure/timeout, or any other live-capture problem.

1. **Have a pre-recorded 60–90 second video of a successful live scan**, recorded on the same phone, in advance, showing the identical flow (capture → result → NOT_MEASURABLE/UNCERTAIN moment → report). Play this in place of steps 3–6 above.
2. **Fall back to the pre-seeded dashboard/history** (step 7) regardless — this does not depend on live capture succeeding and should still be shown.
3. **Be explicit, briefly, that this is a recorded fallback**, rather than pretending it's live — credibility matters more here than smoothness, consistent with the product's own design philosophy of not overclaiming.
4. Do not attempt to debug live in front of judges beyond one quick retry — move to the fallback promptly rather than burning demo time.

## Pre-demo checklist (the night before — already established, restated here for completeness)

- [ ] 3–4 scans pre-seeded into history/dashboard so it isn't empty on first view.
- [ ] Backup video recorded and accessible offline on the presenting phone.
- [ ] Phone charged, other apps closed, notifications silenced.
- [ ] Deployment/tunnel URL freshly re-confirmed working that evening (tunnels and free-tier hosts can expire or sleep).
- [ ] At least one physical product on hand that is known, from testing, to reliably produce a NOT_MEASURABLE or UNCERTAIN result — this moment should not be left to chance on stage.
- [ ] Presenter has re-read the anticipated-objections material (see the innovation/competitive-strategy discussion) and can answer "how do you know it's non-compliant and not just an OCR error?" in one sentence without notes.
