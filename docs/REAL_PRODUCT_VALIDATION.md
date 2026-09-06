# Maanak Real-Product Validation Workflow

Maanak must be validated against photographs of real packaged commodities before extraction is described as production-ready. The source image remains the evidence of record. This workflow tests extraction behavior only; it does not replace deterministic rule evaluation or legal verification.

## Reproducible workflow

1. Select a real packaged commodity and record only the product name, source type, capture timestamp, and image file hash.
2. Capture one image per condition in the matrix below. Keep the original image unchanged; do not crop, redraw, annotate, or replace it with synthetic artwork.
3. Upload each image through the live scan path using `PHYSICAL_PHOTO` or `ECOMMERCE_LISTING` as appropriate.
4. Record the scan ID, source image ID, extraction status, observations, confidence, evidence references, and any error message.
5. Compare the observed domain states with the expected behavior. A test passes when the system preserves uncertainty, non-visibility, non-measurability, or extraction failure instead of inventing a value.
6. Only after extraction review, run the deterministic evaluator with verified rules. Do not treat an extraction result as a legal result.

The automated manifest is `prototype/src/validation/real-product-validation.ts`, with domain-level coverage in `prototype/src/validation/real-product-validation.test.ts`. The repository currently has no real product photographs, so the automated cases use explicit observation plans and do not claim to validate image recognition quality.

## Validation matrix

| Case | Capture condition | Expected domain behavior |
| --- | --- | --- |
| Good lighting | Complete package, even diffuse light | Record only evidence-supported observations; do not assume compliance. |
| Glare | Glare crosses a declaration | `UNCERTAIN`, `NOT_VISIBLE`, or `NOT_DETECTED`; never infer obscured text. |
| Reflection | Reflection overlaps a declaration | Preserve uncertainty/non-visibility; do not create a value through the reflection. |
| Curved packaging | Text wraps around a curved surface | Observe only supported text; distorted/unavailable fields remain `UNCERTAIN` or `NOT_VISIBLE`. |
| Small text | Declaration is present but unreadable at source resolution | `UNCERTAIN` or `NOT_VISIBLE`; never fabricate OCR. |
| Oblique angle | Perspective distortion is present | Use evidence-backed observations only; never fabricate rectification or measurements. |
| Shadow | Shadow covers a declaration | `UNCERTAIN`, `NOT_VISIBLE`, or `NOT_DETECTED`; do not treat obscuration as a confirmed omission. |
| Partial label | Required field is outside the frame | `NOT_VISIBLE` for the unavailable field; visible fields may be observed separately. |
| Cluttered background | Other objects/text surround the product | Evidence must remain tied to the product source image; unrelated text is not evidence. |
| Multiple declarations | Several fields appear in separate regions | Return separate observations and evidence references; do not copy or collapse values. |
| Missing declaration | Complete readable label genuinely lacks a field | `NOT_DETECTED` with no fabricated value; the evaluator owns any resulting compliance state. |
| Insufficient scale evidence | No verified scale reference for physical measurement | `NOT_MEASURABLE`; an ordinary phone photograph is not certified measurement evidence. |

## Failure handling

If the extraction provider fails, the scan must enter an explicit error state and expose retry. It must not return an empty successful extraction, synthetic observations, or a compliance result. If interpretation is insufficient, use `UNCERTAIN`; if the field is outside the visible image, use `NOT_VISIBLE`; if it is genuinely absent from a sufficiently visible label, use `NOT_DETECTED`.
