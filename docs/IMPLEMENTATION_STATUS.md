# Maanak Implementation Status

**Status date:** 2026-09-06  
**Repository state:** Documentation guardrails established; application behavior unchanged.

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

The current `prototype/` is a frontend-only React/Tailwind case-review UI.
It has no backend, persistence, real extraction service, deterministic
application rule engine, authentication, or source-image repository.

### Existing prototype behavior

- Seed cases are loaded from `prototype/src/data/sampleCases.ts`.
- State is held in `prototype/src/App.tsx` and is lost on refresh.
- The custom scan modal creates a result from manually entered fields and
  hard-coded heuristics.
- `PackageArtwork.tsx` renders synthetic package artwork with overlay boxes.
- The repository and dashboard read local in-memory cases; some dashboard
  metrics are hard-coded.
- JSON download and browser print are available; canonical PDF/DOCX report
  generation is not present.

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
