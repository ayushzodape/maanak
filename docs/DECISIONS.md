# Maanak Decisions and Guardrails

**Recorded:** 2026-09-06

This document records decisions that implementation must preserve. It does not
create new legal requirements.

## D-001 — Product identity

Maanak is **Digital Compliance Screening**: preliminary decision support for
packaged-commodity label screening. It is not an official government
inspection system, official report generator, legal authority, certified
measurement instrument, or substitute for an authorized inspector.

## D-002 — Responsibility boundary

The permanent pipeline boundary is:

```text
AI observes -> Rules decide -> Evidence explains
```

AI output is limited to structured observations and extraction metadata. Legal
results are produced separately by deterministic rule evaluation. Explanation
generation is downstream and cannot modify the canonical evaluation.

## D-003 — Canonical observation states

The only canonical observation states are:

- `OBSERVED`
- `NOT_DETECTED`
- `UNCERTAIN`
- `NOT_VISIBLE`
- `NOT_MEASURABLE`

An observation must not contain `PASS` or `FAIL` as a legal decision.

## D-004 — Canonical compliance states

The only canonical compliance states are:

- `PASS`
- `FAIL`
- `UNCERTAIN`
- `NOT_APPLICABLE`
- `NOT_MEASURABLE`

These states belong to deterministic evaluation, not to AI extraction.

## D-005 — Evidence of record

The original source image is the evidence of record. Findings must be
traceable through result → rule → observation → evidence → source image.
Synthetic package artwork, fixture OCR, generated text, and illustrative
examples must be explicitly marked and must never masquerade as live evidence.

## D-006 — Measurement honesty

An ordinary phone photograph is not certified measurement evidence. No exact
physical measurement may be asserted without an adequate physical scale
reference. An estimate must expose its reference, assumptions, confidence, and
limitations. If reliable measurement is unavailable, return
`NOT_MEASURABLE`; never guess a PASS or FAIL.

## D-007 — Rule 7 protection

The currently implemented PDP-area Rule 7 model is incorrect for the canonical
product and must not be used as the compliance source. The superseded or
fabricated PDP-area table must not be reintroduced. Rule 7 behavior must use
only verified, versioned legal data. The unresolved length/area/number legal
gap must remain blocked or safely represented as specified; it must not be
filled with an invented threshold.

## D-008 — Legal-source discipline

No fabricated legal citation, threshold, amendment, effective date, or
verification status may enter product behavior or user-facing copy. Missing or
uncertain legal requirements are `BLOCKED` until verified. They are not
resolved by model memory, plausible numbers, or visual prototype content.

## D-009 — Claim discipline

The product must not claim government certification, official inspection
status, legal certainty, certified calibration, or certified measurement unless
verified documentation explicitly supports the claim. “Digital compliance
screening,” “screening estimate,” and “tamper-evident evidence history” are the
approved framing directions where applicable.

## D-010 — Visual preservation

The existing AI Studio prototype is the visual truth. Preserve its visual
language—navy/blue institutional shell, compact bordered cards, semantic
status badges, typography, iconography, navigation, evidence-dense workbench,
modal patterns, and motion—while correcting behavior and claims to satisfy
canonical product truth.

## D-011 — Fixture and demo labeling

Preloaded cases may be used for demo-safe mode, but fixtures must be internally
distinguishable from live scans. A fixture must not be described as live AI
analysis or real inspection evidence.

## D-012 — Scope protection

Implementation priority remains the reliable single-product flow:

```text
real product -> source image -> observation -> deterministic evaluation
-> evidence-backed result -> report -> history
```

Shelf scanning, consumer-facing features, external integrations, and other
future ideas must not displace this path.
