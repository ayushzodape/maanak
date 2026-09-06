0. READ FIRST
Maanak is an AI-assisted, evidence-first digital compliance screening system for packaged commodities. Before making changes, read:
MAANAK_CODEX_MASTER_PLAN.md
docs/spec/PRODUCT_SPEC.md — if present
docs/spec/FUNCTIONAL_SPEC.md — if present
docs/spec/COMPLIANCE_ENGINE_SPEC.md — if present
docs/spec/UX_SPEC.md — if present
docs/spec/DEMO_SPEC.md — if present
docs/spec/INNOVATION_SPEC.md — if present
docs/design/DESIGN_REFERENCE.md — if present
relevant existing source code and tests
If any of these documents conflict, STOP and identify the conflict instead of silently choosing one.
1. PRODUCT IDENTITY
Name
Maanak
Product definition
Maanak helps users perform preliminary digital compliance screening of packaged commodities using photographs, AI-assisted visual extraction, evidence, and deterministic rule evaluation. The core system is:
REAL PRODUCT
    ↓
PHOTO
    ↓
AI OBSERVATION
    ↓
STRUCTURED EXTRACTION
    ↓
EVIDENCE + CONFIDENCE
    ↓
DETERMINISTIC RULE ENGINE
    ↓
COMPLIANCE RESULT
    ↓
EXPLANATION
    ↓
REPORT / HISTORY
The product is NOT:
an official government inspection system
a replacement for an authorized inspector
a certified measurement instrument
an LLM that decides whether something is legally compliant
Use the term:
digital compliance screening

when describing the product. Do not claim government approval, official inspection status, legal certification, or certified measurement unless such a claim is explicitly supported by verified documentation.
2. SOURCE-OF-TRUTH HIERARCHY
When sources conflict, use this priority order:
1. Verified legal / official sources
For legal requirements, current official government sources and verified legal documents take precedence.
2. Canonical product specifications
The specification documents in docs/spec/ define what Maanak is supposed to do.
3. Existing tested behavior
Existing tests and validated behavior are important evidence, but must not override an explicitly corrected specification.
4. AI Studio prototype
The AI Studio prototype is the PRIMARY VISUAL DESIGN REFERENCE. It defines the intended:
visual language
color palette
typography
spacing
cards
buttons
navigation
information hierarchy
interaction style
visual personality
animation style
DO NOT redesign Maanak simply because you personally prefer another aesthetic.
5. AI-generated suggestions
Suggestions from Codex, Claude, ChatGPT, or other models are proposals, not sources of truth.
3. DESIGN RULE — VERY IMPORTANT
The existing AI Studio prototype is intentionally preferred by the product owner. Preserve its visual identity. When implementing functionality:
PRODUCT SPEC
    +
AI STUDIO VISUAL DESIGN
    ↓
IMPLEMENTATION
Do NOT replace the design with a generic:
SaaS dashboard
Material UI look
Bootstrap look
generic AI startup look
generic glassmorphism
generic dark-mode dashboard
developer-created redesign
unless explicitly requested. If a required screen does not exist in the AI Studio prototype:
identify the existing design patterns,
reuse those patterns,
create the new screen consistently.
If the prototype has visually attractive but functionally incorrect behavior:
preserve the visual language,
correct the behavior.
4. CORE ARCHITECTURAL PRINCIPLE
AI observes.
Rules decide.
Evidence explains.
This is non-negotiable. AI may:
read text
detect declarations
identify package regions
detect barcodes
estimate confidence
identify whether information is visible
produce structured observations
generate human-readable explanations from an already-determined finding
AI must NOT:
directly determine the legal verdict
invent missing declarations
silently fill unknown values
reinterpret legal rules
override the deterministic rule engine
turn uncertainty into PASS
claim certified measurement without valid evidence
5. OBSERVATION MODEL
AI output must be normalized into a structured observation model. Example:
{
  "field": "mrp",
  "value": 120,
  "unit": "INR",
  "confidence": 0.97,
  "status": "OBSERVED",
  "evidence": {
    "image_id": "img_123",
    "bbox": [120, 330, 420, 390]
  }
}
Supported observation states should include:
OBSERVED
NOT_DETECTED
UNCERTAIN
NOT_VISIBLE
NOT_MEASURABLE
Do not invent additional semantic states without a reason.
6. COMPLIANCE RESULT MODEL
The deterministic rules layer must use:
PASS
FAIL
UNCERTAIN
NOT_APPLICABLE
NOT_MEASURABLE
Definitions:
PASS
The available evidence is sufficient and the applicable deterministic rule is satisfied.
FAIL
The available evidence is sufficient and the applicable deterministic rule is violated.
UNCERTAIN
Evidence exists, but confidence or interpretation is insufficient for a reliable determination.
NOT_APPLICABLE
The rule does not apply to the product/context.
NOT_MEASURABLE
The rule requires a measurement that cannot reliably be obtained from available evidence. Never convert uncertainty into PASS merely to improve the demo.
7. LEGAL RULE ENGINE
Legal rules must be:
deterministic
versioned
auditable
traceable to their source
separated from AI-generated observations
Every rule should record, where applicable:
rule_id
source
source_version
effective_from
verified_on
verification_status
logic
known_gaps
Never invent a legal threshold. Never rely on an LLM's memory of a regulation as the final authority. Never copy an unverified number into the rule engine merely because it appears plausible. If a legal question remains unresolved, represent that uncertainty explicitly.
8. RULE 7 WARNING
An earlier research handoff contained an incorrect/fabricated Rule 7 table. DO NOT reintroduce that table. The correct implementation must use the verified legal source and current applicable version. If there is uncertainty regarding requirements for a particular declaration type or commodity category:
DO NOT GUESS.
Document the gap and return an appropriate uncertain/not-applicable state.
9. EVIDENCE REQUIREMENTS
Important findings must be traceable to evidence. Where possible, store:
image_id
bounding_box
source_image
confidence
extraction_method
timestamp
hash
A user should be able to understand:
"Why did Maanak reach this result?"

by following:
RESULT
 ↓
RULE
 ↓
OBSERVATION
 ↓
EVIDENCE
 ↓
SOURCE IMAGE
10. CONFIDENCE
Confidence represents confidence in the observation/extraction, not legal certainty. Bad:
confidence = 95%
therefore product is 95% compliant
Good:
MRP extraction confidence = 95%

Rule result = PASS
Keep these concepts separate.
11. MEASUREMENT
Do not pretend an ordinary phone photograph is a certified measurement. If Maanak estimates physical dimensions using a visual reference, label the result as an estimate. For barcode-based scale estimation:
estimated
+
assumptions
+
confidence
+
limitations
must be visible in the relevant result. If the available evidence is insufficient:
NOT_MEASURABLE
is preferable to guessing.
12. BARCODE SCALE-REFERENCE FEATURE
Barcode-based scale estimation is an innovation feature. It must be treated as:
screening estimate
not:
certified measurement
The system should communicate:
reference used
estimated scale
estimated measurement
confidence
assumptions
limitations
If assumptions fail, return:
NOT_MEASURABLE
13. EXPLANATION LAYER
The technical result comes first. Example:
Rule result:
FAIL

Reason:
Consumer-care declaration not detected.
Only after the canonical finding exists may AI generate:
plain-language explanation
Hindi explanation
Marathi explanation
corrective guidance
Generated explanations must NOT alter:
rule result
rule ID
evidence
confidence
legal interpretation
14. MULTILINGUAL CONTENT
Supported languages may include:
English
Hindi
Marathi
Translations must preserve the canonical meaning. Do not allow translation generation to reinterpret legal requirements. The canonical finding remains the source.
15. MANUFACTURER / BRAND HISTORY
Historical scan data may be used to show:
number of scans
PASS/FAIL/UNCERTAIN distribution
recurring issues
product history
manufacturer/brand trends
Do not imply that historical trends constitute proof of wrongdoing. Use language such as:
recurring screening finding
rather than:
manufacturer is violating the law
unless legally established by an authorized process.
16. CORRECTIVE EXAMPLES
The "What compliant looks like" feature is illustrative. Any generated example must be clearly labelled:
ILLUSTRATIVE COMPLIANT EXAMPLE
It must not appear to be an officially approved government label.
17. TAMPER-EVIDENT EVIDENCE
Maanak may use cryptographic hashes to make evidence history tamper-evident. Do not call this blockchain unless an actual blockchain implementation exists. Prefer:
tamper-evident evidence history

or:
cryptographically verifiable evidence trail

18. SHELF SCANNING
Shelf scanning is a future/stretch feature. Do not prioritize it over:
reliable single-product scanning
extraction
evidence
deterministic rules
result presentation
reporting
demo reliability
A partially working shelf scanner is less valuable than a reliable single-product workflow.
19. MOBILE-FIRST REQUIREMENT
The primary live demo is:
MOBILE PHONE
    ↓
WEB APP
    ↓
REAL PRODUCT
The mobile scanning experience is therefore P0. Prefer simple, reliable browser camera capture over complicated camera infrastructure unless there is a demonstrated need. The first reliable implementation should support:
<input
  type="file"
  accept="image/*"
  capture="environment"
/>
unless the existing application already has a superior reliable approach.
20. REAL-PRODUCT VALIDATION
Do not declare visual extraction complete using only:
mock JSON
synthetic images
placeholder data
perfect screenshots
Test against real packaged products. Important failure conditions include:
glare
reflections
curved packaging
small text
poor lighting
shadows
oblique angles
partial labels
cluttered backgrounds
multiple declarations
Real-world validation is required for the scanning pipeline.
21. DEMO-SAFE MODE
Maanak should eventually support:
LIVE MODE
Real phone + real product + real analysis.
DEMO-SAFE MODE
Preloaded evidence/images using the same application pipeline wherever possible. Demo-safe mode must not falsely represent simulated results as live AI analysis. Clearly distinguish demo fixtures from live scans internally.
22. ERROR HANDLING
Never hide failures. Important states include:
IDLE
CAPTURING
UPLOADING
ANALYZING
EXTRACTING
EVALUATING
GENERATING_REPORT
COMPLETE
ERROR
UNCERTAIN
NOT_MEASURABLE
Users should understand what is happening. Avoid indefinite spinners. Every asynchronous operation should have:
loading state
success state
failure state
retry path where appropriate
23. SECURITY
Never commit:
API keys
secrets
passwords
private tokens
credentials
Secrets must remain server-side. Do not expose model-provider API keys to the browser. Use environment variables. Verify .gitignore before committing.
24. DATA PRIVACY
Treat uploaded product images and scan records as potentially sensitive operational data. Do not add unnecessary collection of:
user information
location
device identifiers
personal information
without a clear product requirement. Only collect what is needed.
25. CODE QUALITY
Prefer:
simple architecture
existing project patterns
small functions
clear types
explicit data boundaries
testable modules
minimal dependencies
Avoid:
unnecessary abstractions
premature microservices
speculative architecture
dependency proliferation
large rewrites without justification
Do not refactor unrelated code while implementing a feature.
26. DEPENDENCY RULE
Before introducing a new dependency:
check whether the repository already provides equivalent functionality,
determine whether the dependency is necessary,
consider bundle size and security,
explain why it is needed.
Do not add a library simply because it is fashionable.
27. TESTING REQUIREMENTS
Every meaningful behavior should have appropriate tests.
Rule engine
Test:
PASS
FAIL
UNCERTAIN
NOT_APPLICABLE
NOT_MEASURABLE
boundary values
invalid inputs
missing observations
Extraction
Test representative real-world images where possible.
Integration
Test:
image
 ↓
extraction
 ↓
normalized observation
 ↓
rules
 ↓
result
UI
Test important states and user flows.
28. TEST INVARIANTS
The following must remain true:
Invariant 1
AI output alone cannot determine a legal verdict.
Invariant 2
Missing evidence cannot silently become PASS.
Invariant 3
The same normalized input + same rule version must produce the same rule result.
Invariant 4
Explanation generation cannot modify the canonical result.
Invariant 5
Legal rules must have identifiable versions/sources.
Invariant 6
Evidence must remain traceable.
29. GIT DISCIPLINE
Keep changes small and focused. Before significant work:
git status
After implementation:
git diff
Review the diff. Do not modify unrelated files. Prefer commits such as:
feat: add product scan flow
feat: add evidence viewer
feat: add rule evaluation
test: add rule boundary cases
fix: handle extraction uncertainty
Avoid giant mixed commits.
30. CODEX WORKFLOW
For substantial tasks, follow:
EXPLORE
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
TEST
  ↓
REVIEW
  ↓
COMMIT
Do not immediately modify a large unfamiliar codebase. Before implementation, inspect relevant files. For major changes, explain the intended approach before editing.
31. TASK BOUNDARIES
A task should normally implement ONE coherent capability. Good:
Implement the mobile product image upload flow.
Good:
Implement Rule 7 threshold evaluation.
Bad:
Finish the entire Maanak application.
Break large goals into milestones.
32. WHEN REQUIREMENTS ARE AMBIGUOUS
Do not guess when ambiguity affects:
legal interpretation
data model
security
compliance result
user-facing claims
major architecture
destructive changes
Ask for clarification or identify the ambiguity explicitly. For low-risk implementation details, use existing repository conventions.
33. WHEN A PREVIOUS AI DECISION LOOKS WRONG
Do not blindly preserve it. Identify:
CURRENT BEHAVIOR
EXPECTED BEHAVIOR
SOURCE OF EXPECTED BEHAVIOR
PROPOSED CHANGE
Then fix it with tests. Previous AI output is not automatically correct.
34. DESIGN REVIEW RULE
When changing UI, compare against:
docs/design/
and the AI Studio reference. Preserve:
visual hierarchy
typography
color
spacing
component language
navigation
interaction patterns
Do not redesign merely because a different style is easier to implement. However, correct:
misleading behavior
inaccessible interactions
broken responsive behavior
impossible states
fake functionality
contradictions with the product specification
35. UI QUALITY BAR
The mobile experience should feel like a real product, not a prototype assembled from disconnected components. Important:
responsive layouts
readable typography
clear primary actions
accessible contrast
touch-friendly controls
useful loading states
meaningful empty states
clear errors
consistent spacing
no accidental horizontal overflow
36. DO NOT OVERBUILD
Before implementing a feature ask:
Is it required by the product specification?
Is it required for the demo?
Does it improve the core inspection workflow?
Does it materially improve differentiation?
If the answer is no to all four: Do not prioritize it.
37. PRIORITY ORDER
When tradeoffs occur, prioritize:
P0 — Core scan works reliably
P0 — AI extraction works reliably
P0 — Deterministic rule evaluation works
P0 — Results are explainable
P0 — Mobile demo works
P0 — Report works

P1 — Evidence viewer
P1 — History
P1 — Multilingual explanation
P1 — Manufacturer trends

P2 — Barcode scale estimation
P2 — Corrective visualization
P2 — Tamper-evident history

P3 — Shelf scanning
P3 — Offline mode
P3 — Consumer-facing features
P3 — External integrations
The actual priority may be updated by the canonical product scope.
38. DEFINITION OF DONE
Do not call a task complete merely because code was written. A task is complete when appropriate:
implementation
+
tests
+
typecheck
+
lint
+
build
+
manual validation
have passed. For visual changes:
implementation
+
responsive check
+
reference comparison
must also pass. For scanning changes:
implementation
+
automated tests
+
real-product validation
is required.
39. FINAL RESPONSE FORMAT FOR CODEX
After completing a task, report:
What changed
Short summary.
Files changed
List files.
Tests
List commands/results.
Validation
Explain manual or real-product validation.
Remaining issues
List known limitations.
Risks
List anything that should be reviewed. Do not claim success if a required check failed.
40. CORE PHILOSOPHY
Maanak should be:
HONEST
EVIDENCE-DRIVEN
DETERMINISTIC
EXPLAINABLE
MOBILE-FIRST
VISUALLY DISTINCTIVE
PRACTICAL
DEMO-RELIABLE
The goal is not to make the AI appear omniscient. The goal is to make the system trustworthy. When Maanak knows:
PASS
say PASS. When it knows:
FAIL
say FAIL. When it cannot know:
UNCERTAIN
or:
NOT_MEASURABLE
say so. That behavior is a core product feature, not a failure.