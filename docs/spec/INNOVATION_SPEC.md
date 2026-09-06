# INNOVATION_SPEC.md — Maanak

**Status:** Canonical record of the innovation discussion already held in this session. **None of these have been formally locked in by the product owner yet** — the earlier discussion produced a recommendation, not a decision. This document preserves that distinction: "recommended priority" is this assistant's earlier assessment; final priority is the owner's call, to be recorded in `CANONICAL_PRODUCT_REQUIREMENTS.md` once decided. No new innovation ideas are introduced here.

---

## INNOV-001 — Barcode-based visual scale estimation

- **Why it matters:** The single hardest, most honestly-scoped limitation in the product is the font-height check's `NOT_MEASURABLE` state — a casual photo has no built-in physical scale. Nearly every packaged product already carries an EAN-13/UPC-A barcode, which GS1 standardizes at 37.29mm × 25.93mm at 100% magnification (real-world printed magnification ranges 80–200% of that, per GS1 specification, confirmed during this session's research). If a barcode is visible in the same photo, its known nominal size can serve as an approximate, "free" scale reference — no extra user action, no separate reference object needed.
- **Whether it belongs in the prototype:** Recommended yes, as an enhancement to the existing `NOT_MEASURABLE` path — not a replacement for it. It should convert some `NOT_MEASURABLE` results into a *lower-confidence estimated* PASS/FAIL, never into a confidently-asserted one.
- **Priority (recommended):** P1 — high value, moderate cost, directly strengthens the product's honesty story rather than working against it.
- **Implementation risk:** Barcode detection and orientation/perspective correction add a real CV step; magnification variance (80–200%) means this is fundamentally an *estimate*, and the UI/report must never present it with the same confidence as a true calibrated measurement.
- **What must be true before building it:** F3 (extraction) and F4 (rule evaluation) must already be working reliably on the non-barcode path first — this is an enhancement layered on a working `NOT_MEASURABLE` state, not a replacement for building that state correctly.

## INNOV-002 — Evidence-backed explanations

- **Why it matters:** A bare "Rule 6(1)(g) — FAIL" citation is technically correct but not immediately actionable for the person receiving it. Grounding every explanation explicitly in both the cited rule *and* the specific evidence that produced the finding (not just a rule number, but "here is the text we read, here is why it doesn't satisfy the rule") is what makes the audit trail (`COMPLIANCE_ENGINE_SPEC.md` → Evidence requirements) actually legible to a human, not just technically present in the data model.
- **Whether it belongs in the prototype:** Recommended yes — this is largely already implied by F4/F6 as specified; the "innovation" here is treating evidence-grounding as a first-class explanation requirement rather than an optional detail view.
- **Priority (recommended):** P1
- **Implementation risk:** Low — this is mostly a presentation/report-template discipline on top of data that's already being captured (`evidence_image_id`, `evidence_bbox`, `reason` fields already exist in the schema), not new extraction or rule-engine capability.
- **What must be true before building it:** F4 and F6 must be functioning — this is a refinement of their output, not a standalone feature.

## INNOV-003 — Multilingual explanations

- **Why it matters:** Much of the retail/enforcement workforce this tool is meant to support communicates more naturally in Hindi or a regional language than English. Generating the plain-language explanation (INNOV-002) in the official's or the seller's preferred language turns a technically-correct report into something that can actually be read aloud at the point of interaction, closing a real workflow gap identified during stakeholder/workflow research.
- **Whether it belongs in the prototype:** Recommended as a should-have, not a must-have — genuinely useful, but downstream of INNOV-002 existing at all.
- **Priority (recommended):** P2
- **Implementation risk:** Low-moderate — an additional generation/translation step per explanation; risk is mainly about translation quality/accuracy for legal terminology, not technical difficulty.
- **What must be true before building it:** INNOV-002 (evidence-backed explanations) must exist first, in English, and be verified accurate — translating an unreliable explanation just produces an unreliable explanation in two languages.

## INNOV-004 — Manufacturer/brand trends

- **Why it matters:** Per-scan pass/fail is useful but doesn't address the actual stated problem (manual inspection doesn't scale, enforcement coverage is low). Aggregating scan history by manufacturer/brand — "this manufacturer has failed the same check in 3 of its last 5 scanned products" — turns the repository (F8) into a prioritization tool for genuinely scarce inspector time, which is a materially different value proposition than a one-off checker.
- **Whether it belongs in the prototype:** Recommended yes, as an extension of the dashboard (F10) — but only once a real repository with multiple real scans exists to aggregate.
- **Priority (recommended):** P2
- **Implementation risk:** Low technically (it's a query over existing data), but requires enough real scan volume to be a meaningful demo — with only 3–4 seeded demo scans, a "trend" is not statistically real and should be presented carefully (as a capability demonstration, not an actual finding) if shown before real usage volume exists.
- **What must be true before building it:** F8 (repository) and F10 (dashboard base) must exist and hold multiple scans, ideally including more than one scan of the same manufacturer, before this is demonstrable honestly.

## INNOV-005 — Corrective "what compliant looks like"

- **Why it matters:** Every reviewed existing tool (commercial or government) stops at detection. Generating a mocked example of a correctly-formatted version of a failed declaration (e.g., a properly formatted MRP statement, shown next to the non-compliant one) reframes the product from purely punitive/detective toward corrective/educational — a genuinely different value proposition than anything found in the competitive landscape research.
- **Whether it belongs in the prototype:** Optional — a strong pitch differentiator, not required by the brief.
- **Priority (recommended):** P2 (only if F4/F5 are solid with time to spare)
- **Implementation risk:** Moderate — this is a generative step, and it must be very tightly templated so it never implies the generated example is what *this specific product's* label actually needs to say verbatim (a formatting example, not a legal ruling on the correct content).
- **What must be true before building it:** F4 (rule evaluation) must reliably identify *which* rule was failed and *why*, since the corrective example has to be scoped to the specific failure, not a generic template.

## INNOV-006 — Tamper-evident evidence

- **Why it matters:** The repository schema already stores a `sha256` hash per evidence image. Extending this into an append-only hash chain (each record's hash incorporating the previous one) gives the evidence trail real tamper-evidence — the substantive property that "blockchain" claims are usually reaching for, without the unjustified buzzword the product's own risk analysis already warned against.
- **Whether it belongs in the prototype:** Optional, low-cost addition if time allows — not required by the brief, and not something to feature prominently in the pitch beyond a factual mention (it should not be oversold as more than it is: deterministic hashing, not a distributed ledger).
- **Priority (recommended):** P3
- **Implementation risk:** Low — the hashing infrastructure already exists in the schema; this is an incremental extension, not new architecture.
- **What must be true before building it:** F8 (repository) must be wired to real persistence — there's no chain to build over an in-memory, non-persisted scan.

## INNOV-007 — Shelf scanning (multi-product)

- **Why it matters:** This is the single strongest possible demonstration of "manual inspection doesn't scale, this does" — one photo, multiple products, multiple compliance results. It's also the most different from what a typical single-product scan-and-check tool looks like.
- **Whether it belongs in the prototype:** **Not recommended for the core build.** This was explicitly flagged, when discussed, as real added complexity (multi-object detection, per-crop pipeline reuse) layered on top of everything else, with a specific caution that a half-working version live on stage is worse than not attempting it.
- **Priority (recommended):** P3, attempt only if F1–F7 are fully solid with meaningful time remaining before demo day.
- **Implementation risk:** High — requires reliable multi-object detection and per-object cropping before the existing single-product pipeline (F3/F4) can even be reused; failure mode is a confusing, partial, or crashing result on the highest-visibility demo moment if attempted and not fully working.
- **What must be true before building it:** The entire single-product pipeline (F1–F7) must be reliable and already tested against real, varied products — this is an extension of a working core, not a parallel effort.

---

## Not innovation items — explicitly excluded from this document

Two ideas were raised during the innovation discussion and explicitly placed in a "pitch/roadmap only, do not build" category rather than the prototype scope: an offline queued-scan mode for poor-connectivity field use, and a public QR-linked "last verified" trust badge for consumers. They are recorded here only to note that they were considered and deliberately excluded from the build, per the same discussion — not because they lack merit, but because they were assessed as too heavy for the current build window and outside this product's confirmed user scope (consumers are explicitly not a target user — see `PRODUCT_SPEC.md`).
