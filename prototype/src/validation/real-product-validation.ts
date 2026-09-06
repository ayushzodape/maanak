import { ObservationStatus } from '../domain';

export type RealProductValidationCondition =
  | 'GOOD_LIGHTING'
  | 'GLARE'
  | 'REFLECTION'
  | 'CURVED_PACKAGING'
  | 'SMALL_TEXT'
  | 'OBLIQUE_ANGLE'
  | 'SHADOW'
  | 'PARTIAL_LABEL'
  | 'CLUTTERED_BACKGROUND'
  | 'MULTIPLE_DECLARATIONS'
  | 'MISSING_DECLARATION'
  | 'INSUFFICIENT_SCALE_EVIDENCE';

export interface RealProductValidationCase {
  readonly id: string;
  readonly condition: RealProductValidationCondition;
  readonly captureInstruction: string;
  readonly expectedObservationStatuses: readonly ObservationStatus[];
  readonly expectedDomainOutcome: string;
}

/**
 * Acceptance criteria for photographs of real packaged commodities.
 *
 * This manifest deliberately does not contain OCR values, confidence scores,
 * measurements, or compliance outcomes. Those must come from an approved
 * extraction adapter and deterministic evaluator during validation.
 */
export const REAL_PRODUCT_VALIDATION_MATRIX: readonly RealProductValidationCase[] = [
  {
    id: 'good-lighting',
    condition: 'GOOD_LIGHTING',
    captureInstruction: 'Photograph the complete package in even, diffuse light with declarations facing the camera.',
    expectedObservationStatuses: ['OBSERVED', 'NOT_DETECTED', 'UNCERTAIN'],
    expectedDomainOutcome: 'Record only declarations supported by source evidence; do not assume visibility or compliance.',
  },
  {
    id: 'glare',
    condition: 'GLARE',
    captureInstruction: 'Capture a package with glare crossing one or more declarations.',
    expectedObservationStatuses: ['UNCERTAIN', 'NOT_VISIBLE', 'NOT_DETECTED'],
    expectedDomainOutcome: 'Do not read obscured text as a value; preserve uncertainty or non-visibility.',
  },
  {
    id: 'reflection',
    condition: 'REFLECTION',
    captureInstruction: 'Capture reflective packaging where a reflection overlaps a declaration.',
    expectedObservationStatuses: ['UNCERTAIN', 'NOT_VISIBLE', 'NOT_DETECTED'],
    expectedDomainOutcome: 'Do not infer text through the reflection or turn an unreadable field into PASS.',
  },
  {
    id: 'curved-packaging',
    condition: 'CURVED_PACKAGING',
    captureInstruction: 'Capture a cylindrical or curved package with text wrapping around its surface.',
    expectedObservationStatuses: ['OBSERVED', 'UNCERTAIN', 'NOT_VISIBLE'],
    expectedDomainOutcome: 'Keep extracted text tied to evidence; mark distorted or unavailable fields uncertain/not visible.',
  },
  {
    id: 'small-text',
    condition: 'SMALL_TEXT',
    captureInstruction: 'Capture declarations that are present but too small to read reliably at source resolution.',
    expectedObservationStatuses: ['UNCERTAIN', 'NOT_VISIBLE', 'NOT_DETECTED'],
    expectedDomainOutcome: 'Do not invent OCR text; insufficient interpretive confidence remains UNCERTAIN.',
  },
  {
    id: 'oblique-angle',
    condition: 'OBLIQUE_ANGLE',
    captureInstruction: 'Capture the package from an oblique angle with perspective distortion.',
    expectedObservationStatuses: ['OBSERVED', 'UNCERTAIN', 'NOT_VISIBLE'],
    expectedDomainOutcome: 'Accept an observation only when supported; do not fabricate rectification or measurements.',
  },
  {
    id: 'shadow',
    condition: 'SHADOW',
    captureInstruction: 'Capture a package with a shadow falling over a declaration.',
    expectedObservationStatuses: ['UNCERTAIN', 'NOT_VISIBLE', 'NOT_DETECTED'],
    expectedDomainOutcome: 'Treat shadow-obscured text as uncertain or not visible, not as a missing legal declaration by default.',
  },
  {
    id: 'partial-label',
    condition: 'PARTIAL_LABEL',
    captureInstruction: 'Capture only part of the package label, with at least one declaration outside the frame.',
    expectedObservationStatuses: ['NOT_VISIBLE', 'UNCERTAIN', 'OBSERVED'],
    expectedDomainOutcome: 'Fields outside the frame are NOT_VISIBLE; visible fields may still be observed with evidence.',
  },
  {
    id: 'cluttered-background',
    condition: 'CLUTTERED_BACKGROUND',
    captureInstruction: 'Capture a product against a busy background with other objects nearby.',
    expectedObservationStatuses: ['OBSERVED', 'UNCERTAIN', 'NOT_VISIBLE'],
    expectedDomainOutcome: 'Separate the product source image from background objects; do not create evidence for unrelated text.',
  },
  {
    id: 'multiple-declarations',
    condition: 'MULTIPLE_DECLARATIONS',
    captureInstruction: 'Capture a package containing several declarations in different regions of the image.',
    expectedObservationStatuses: ['OBSERVED', 'UNCERTAIN', 'NOT_DETECTED'],
    expectedDomainOutcome: 'Return separate field observations with their own evidence references; do not collapse fields or copy values.',
  },
  {
    id: 'missing-declaration',
    condition: 'MISSING_DECLARATION',
    captureInstruction: 'Capture a complete, readable label where a required declaration is genuinely absent.',
    expectedObservationStatuses: ['NOT_DETECTED'],
    expectedDomainOutcome: 'Represent the absent field as NOT_DETECTED with no fabricated value; evaluation remains rule-owned.',
  },
  {
    id: 'insufficient-scale-evidence',
    condition: 'INSUFFICIENT_SCALE_EVIDENCE',
    captureInstruction: 'Capture a package without a verified scale reference suitable for physical measurement.',
    expectedObservationStatuses: ['NOT_MEASURABLE'],
    expectedDomainOutcome: 'Physical measurement is NOT_MEASURABLE; an ordinary phone photograph is not certified measurement evidence.',
  },
];

export const EXTRACTION_FAILURE_EXPECTATION = {
  condition: 'EXTRACTION_FAILURE',
  expectedDomainOutcome: 'Return an explicit extraction error and expose retry; do not return synthetic observations.',
} as const;
