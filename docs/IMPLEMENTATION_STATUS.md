# Maanak Implementation Status

**Status date:** 2026-09-06  
**Repository state:** Core scan, extraction, deterministic evaluation, reporting, persistence, history, dashboard, and minimal session boundaries are implemented in `prototype/`. Real-provider and legal-coverage gaps remain explicit.

## Canonical product identity

Maanak is a **Digital Compliance Screening** system for preliminary,
evidence-first screening of packaged commodities. It supports enforcement
officials; it is not an official government inspection system, legal authority,
certified measurement instrument, or replacement for an authorized inspector.

## Non-negotiable architecture

```text
AI observes -> Rules decide -> Evidence explains
```

- AI/vision may extract visible declarations, regions, confidence, visibility,
  and possible scale references.
- AI/vision must never generate the legal PASS/FAIL result.
- Deterministic, versioned rules produce the canonical compliance result.
- Explanations may clarify an existing result but may not alter its result,
  rule, evidence, confidence, or legal interpretation.
- Source images are the evidence of record. Synthetic artwork, mock OCR, or
  generated examples must never be presented as live evidence.

## Canonical states

### Observation states

```text
OBSERVED
NOT_DETECTED
UNCERTAIN
NOT_VISIBLE
NOT_MEASURABLE
```

Observations describe what was extracted from evidence. They do not contain a
legal verdict.

### Compliance states

```text
PASS
FAIL
UNCERTAIN
NOT_APPLICABLE
NOT_MEASURABLE
```

Missing evidence must not silently become `PASS`. Insufficient confidence,
ambiguous interpretation, or unresolved applicability must remain
`UNCERTAIN`. A measurement-dependent check without reliable scale evidence
must be `NOT_MEASURABLE`.

## Current implementation snapshot

The current `prototype/` is a React/Tailwind client with a small Express API,
file-backed scan repository, deterministic evaluation boundary, and minimal
server-enforced session boundary. Live extraction remains unavailable until an
approved provider is configured.

### Existing prototype behavior

- Legacy workbench, fixture repository, and fixture analytics remain backed by
  `prototype/src/data/sampleCases.ts`; they are visibly marked as synthetic
  and are not the live scan/history path.
- Live scans create a server record, persist the uploaded source image, run the
  configured extraction adapter, persist observations, evaluate verified rules,
  and persist the canonical result before display.
- Scan history and dashboard read completed entries from `GET /scans`; each
  entry includes its persisted canonical result.
- JSON and human-readable screening exports are generated from one canonical
  result. Official notices, browser-print reporting, and certified claims are
  not supported.

These behaviors are prototype fixtures and UI scaffolding, not completed
Digital Compliance Screening functionality.

## Guardrails for implementation

The following must never be introduced or retained as unqualified product
claims:

- official government inspection or legal-determination claims;
- government certification or approval claims;
- fabricated legal citations, thresholds, amendments, or effective dates;
- fabricated calibration or certification claims;
- fabricated physical measurements;
- synthetic evidence represented as a real source image or live finding;
- AI-generated legal verdicts;
- conversion of uncertainty or missing evidence into `PASS`.

Ordinary phone photographs cannot be treated as certified measurement evidence.
Any visual measurement must identify its reference, assumptions, estimated
value, confidence, and limitations. Without adequate scale evidence, the result
is `NOT_MEASURABLE`.

Rule 7 must not use the currently implemented PDP-area model. The superseded or
unverified PDP-area table must not be reintroduced. Only verified rule data may
be encoded; unresolved legal requirements are blockers, not implementation
guesses.

## Visual preservation

The AI Studio prototype remains the visual/design reference. Preserve its
institutional navy and blue shell, compact evidence-dense cards, semantic
status treatment, typography, iconography, navigation, modal patterns, and
responsive layout language. Functional corrections must be implemented inside
that visual system; no generic redesign is authorized.

## Definition of implementation progress

A feature is not considered implemented because a screen, type, field, fixture,
or button exists. Progress requires the relevant behavior, data boundary,
failure state, tests, and validation described by the canonical specifications.
