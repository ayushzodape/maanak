# Legacy Fixture Architecture Audit

This audit separates the existing synthetic AI Studio surfaces from the live
server-backed scan path. It is a migration plan only; no legacy surface is
deleted by this document.

## Findings

| Surface | Current role | Visually valuable | Used by live scan path | Risk of misleading users | Recommended treatment |
| --- | --- | --- | --- | --- | --- |
| `InspectionWorkbench` | Preloaded case workbench | Yes: evidence-dense review layout | No | High if its fixture findings look like live evidence | Keep as explicitly labelled demo fixture mode; do not use it as live result source |
| `PackageArtwork` | Synthetic package illustration and overlays | Yes: bounding-box interaction pattern | No | High: artwork can resemble source evidence | Retain only for fixture mode; keep live source images separate |
| `StatutoryRepository` | Fixture case repository view | Yes: table/filter interaction pattern | No; live history uses server API | Medium/high if fixture rows appear historical | Keep as demo-only until replaced by persisted history data |
| `InspectorOverrideModal` | Local state mutation of fixture findings | Limited: modal interaction pattern | No | High: suggests a user can alter canonical results | Keep only for fixture review; never expose it as a live canonical-result mutation |
| `src/data/sampleCases.ts` | Synthetic cases and legal-looking sample copy | Some presentation content | No | High: contains synthetic Rule 7/PDP-area and penalty-style claims | Isolate behind demo-fixture boundary and audit/remove misleading claims before live demo |
| `CustomScanModal` | Live API scan entry plus fixture presets | Yes: capture/source selection flow | Yes, for API-backed scans | Medium: preset path can be confused with LIVE | Preserve, but make mode/source distinction explicit in future flow |

## Current boundary

The server-backed path is:

```text
scan creation -> source image upload -> ExtractionAdapter -> observations
-> deterministic evaluator -> canonical result -> persisted history
```

The legacy path is local React state backed by `INITIAL_CASES`. It is already
labelled `DEMO FIXTURE MODE` in the application shell, but its content still
contains synthetic legal findings that should not be presented as real
screening evidence.

## Migration order

1. Keep all legacy components available for the demo-fixture path.
2. Ensure every fixture-originated record carries `mode: DEMO_FIXTURE` and is
   never sent to the live evaluator or live evidence viewer.
3. Replace live-facing history/dashboard data sources with the authenticated
   server history API only.
4. Replace synthetic package artwork in live result views with the retained
   uploaded source image and its actual evidence references.
5. Remove or rewrite fixture copy that implies legal penalties, official
   findings, certified measurements, or verified Rule 7 conclusions.
6. Delete legacy surfaces only after the live scan, evidence, result, report,
   and history flow has been validated with real package photographs.

## Not yet executed

- No legacy component has been deleted.
- No legal rule has been inferred from fixture data.
- Rule 7 remains blocked for unresolved applicability/measurement cases.
- Real-product validation and deployed mobile validation are still required.
