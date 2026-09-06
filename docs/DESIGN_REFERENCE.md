# Maanak Design Reference

The AI Studio prototype is the primary visual/design reference for Maanak.
The canonical product specifications in `docs/spec/` determine behavior and
content. Implementation must combine both sources without redesigning the
product.

## Preserve

- institutional dark-navy header/footer and restrained saffron/white/green
  accent;
- blue primary actions and active navigation;
- cool light-gray page background and white bordered cards;
- compact Plus Jakarta Sans interface typography, Cinzel brand treatment, and
  JetBrains Mono technical metadata;
- small rounded corners, thin borders, restrained shadows, and compact spacing;
- icon-plus-label navigation, status badges, case pills, evidence cards, and
  modal/drawer patterns;
- evidence-dense workbench hierarchy and the visual chain of detected string →
  statutory rule → metric → human review;
- semantic status colors paired with text/icons, never color alone;
- subtle transitions and modal/drawer motion as interaction feedback;
- responsive one-column collapse and touch-usable controls.

## Correct without redesigning

Visual fidelity does not preserve false claims or impossible behavior. Correct
the prototype where required by product truth:

- describe Maanak as **Digital Compliance Screening**, never as an official
  government inspection system;
- remove unsupported government certification, legal-authority, calibration,
  and official-report claims;
- use source photographs as evidence of record, not synthetic package art;
- show canonical `PASS`, `FAIL`, `UNCERTAIN`, `NOT_APPLICABLE`, and
  `NOT_MEASURABLE` results;
- keep AI observations separate from deterministic legal evaluation;
- label demo fixtures and illustrative examples clearly;
- represent missing evidence and unresolved legal requirements honestly;
- do not present ordinary phone photographs as certified measurement evidence;
- do not use the incorrect PDP-area Rule 7 model.

## Implementation rule

When a required screen is absent, reuse the prototype’s existing card, header,
modal, status, spacing, typography, and evidence patterns. Do not introduce a
new palette, generic SaaS dashboard, Material/Bootstrap system, or unrelated
visual language merely because it is easier to implement.
