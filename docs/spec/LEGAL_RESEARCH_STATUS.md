# LEGAL_RESEARCH_STATUS.md — Maanak

**Purpose of this document:** to separate what has actually been confirmed from what has merely been asserted, at some point, during this project. This document does not resolve open questions — it names them. Where earlier research turned out to be wrong, it is marked **SUPERSEDED**, not quietly dropped.

---

## 1. Verified Facts

| Fact | Basis |
|---|---|
| The Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011 govern mandatory declarations on packaged commodities, administered by the Department of Consumer Affairs. | Cross-checked across primary/near-primary government and legal-reference sources. |
| Rule 6 requires (at minimum): manufacturer/packer/importer name & address, country of origin (imported goods), generic name, net quantity, month/year of manufacture/packing/import, MRP inclusive of taxes, consumer-care details. | Cross-checked, consistent across sources; also independently corroborated by the official SIH26034 brief text, which names the same core set. |
| Rule 7 Table-I (current, post-2017 amendment G.S.R. 629(E)) sets minimum character height by **declared net quantity in weight/volume**: ≤200 g/ml → 1mm normal / 2mm blown-formed-molded; 200–500 g/ml → 2mm / 4mm; >500 g/ml → 4mm / 6mm. Applies to both numerals and letters since the amendment. | Cross-checked against two independent transcriptions of the amended Rules text (Indian Kanoon annotated version + an independent bare-text transcription); **not** fetched from the gazette PDF itself. |
| Rule 7(3): letter/numeral width must generally be ≥ one-third of height, with exceptions for the numeral "1" and the letters i/I/l. | Same sourcing as above. |
| **Table-II (the earlier, PDP-area-keyed height table) was omitted by the 2017 amendment and does not currently apply as originally written.** | Same sourcing as above. This directly supersedes an earlier draft — see §5. |
| `emaap.gov.in` is the real national Legal Metrology portal (Centralized Legal Metrology System / CLMS). | Confirmed via direct search. |
| BIS Care app and e-Jagriti exist, and serve different purposes (BIS licence/hallmark verification; consumer dispute filing, respectively) — neither does LMPC label-compliance scanning. | Confirmed via direct search of each product's stated function. |
| EAN-13/UPC-A barcodes have a GS1-standardized nominal size of 37.29mm × 25.93mm at 100% magnification; real-world printed magnification commonly ranges 80–200% of that. | Confirmed via direct search of GS1 specification material, specifically re-verified before use in `INNOVATION_SPEC.md` (INNOV-001) given the earlier Rule 7 fabrication incident. |
| The official SIH26034 Background / Description / Expected Solution / Key Functional Requirements text (as supplied directly by the product owner) confirms: enforcement officials as the named user, e-commerce/product-listing images as an explicit in-scope input, and font-size/readability checking as a named functional requirement. | Supplied directly by the product owner. **Not independently fetched from sih.gov.in by this assistant** — sih.gov.in blocks automated fetches. Treated as authoritative because it was supplied by the person with actual portal access, not because it was independently verified. |

## 2. Facts Requiring Verification (open, not resolved)

| Item | Conflict / gap |
|---|---|
| SIH26034 theme | Three independent third-party structured mirrors of sih.gov.in show "Agriculture, FoodTech & Rural Development." A later product-owner-supplied document claimed "Miscellaneous." **Neither has been independently confirmed against a live portal screenshot. Unresolved.** |
| SIH26034 idea-submission deadline | Third-party mirrors consistently showed 20 September 2026. A later product-owner-supplied document claimed 30 September 2026. **Neither confirmed directly by this assistant (sih.gov.in fetch is blocked). Unresolved — re-check the live portal.** |
| Portal submission count ("1/500") | Asserted in a product-owner-supplied document; not independently verifiable by this assistant at all (a live, point-in-time portal figure). Treat as unverified. |
| Whether Legal Metrology enforcement already uses a prescribed violation-notice/inspection-report format (a claim about the Maharashtra Legal Metrology portal) | Searched; found the general Maharashtra Legal Metrology organisation page and the national `emaap.gov.in` portal, but **not** the specific "Inspection Report" FAQ/workflow described. Not confirmed, not disproven. |
| What now governs minimum character height for commodities declared by **length, area, or number** (rather than weight/volume), given Table-II was omitted in 2017 | **Genuinely unknown.** Not found in any source consulted. This is the single largest unresolved legal gap in the current rule data — `rule-7.json`'s `known_gaps` field names it explicitly, and the rule engine currently returns `NOT_APPLICABLE` for this case rather than guessing. |
| February 2026 e-commerce amendment (referenced as G.S.R. 128(E)) requiring country-of-origin display for imported products sold online, and its exact effective date(s) | Sourced from secondary legal-news commentary (not the gazette notification itself). Exact text/date not independently confirmed. |
| Status of a separately-referenced 2024 proposed amendment extending declaration requirements to packages over 25kg/25L | Unclear whether this is the same amendment thread as the above or a separate one — not disambiguated. |
| Rule 7 commencement-date discrepancy (some secondary sources cite 1 April 2011, others cite different dates for different sub-provisions) | Not resolved against the gazette text directly. |
| What "editable format" means in the official brief's "PDF and editable formats" requirement | Not specified in the brief. `DOCX` was adopted as a working assumption (see `FUNCTIONAL_SPEC.md`, F7), not a confirmed requirement. |
| Exact role/permission model implied by "role-based user access and secure authentication" | Not specified in the brief beyond the phrase itself. A minimal two-role (inspector/admin) model was adopted as a working assumption, not a confirmed requirement. |

## 3. Assumptions (explicitly labeled — not derived from a primary source)

- That the sponsoring unit within the Department of Consumer Affairs is specifically the Legal Metrology Division — reasonable given subject matter, but not explicitly named in the brief.
- That "enforcement officials" in the brief means individual field inspectors specifically, rather than a broader category including supervisory/administrative roles. The brief supports "enforcement officials" as the user category; it does not specify seniority or role granularity.
- That a minimal two-role auth model (inspector/admin) satisfies the brief's role-based access requirement for a prototype — this is a scoping decision made in this project, not something the brief specifies.
- That DOCX is an acceptable interpretation of "editable format" — a reasonable but unconfirmed reading.
- All MVP/DEMO/FUTURE prioritization in `PRODUCT_SCOPE.md` reflects this project's own product judgment about what's achievable in the available time — it is not something SIH or the Department specified.

## 4. Unresolved Legal Questions (distinct from "needs a web search" — these need actual legal/domain expertise or a primary-text read the assistant has not done)

- The full text and scope of Rule 26 exemptions (small packages, hotel/restaurant food, handloom thread, DPCO items, etc.) has only been described narratively, never fully encoded as structured rule data.
- The unit-sale-price rounding sub-rule (referenced in third-party FAQ material) has not been encoded and its exact current text has not been confirmed.
- The e-commerce declaration-duplication sub-rule (which declarations must be mirrored on a listing, and which — e.g., date of manufacture — are explicitly excused) has been described narratively but not encoded as structured, versioned rule data.
- Whether the Food Safety and Standards Act's own labeling/font provisions override or supplement LMPC Rule 7 specifically for food items has never been resolved — flagged early in this project's research and never closed out.

## 5. Superseded / Corrected Information (explicitly do not carry forward)

- **SUPERSEDED — fabricated Rule 7 table.** An externally-supplied architecture document, part-way through this project, presented a Rule 7 minimum-height table keyed to Principal Display Panel (PDP) area (bins such as "A ≤ 50 cm² → 1.0mm," etc.). This table was checked against two independent primary-adjacent sources and **did not match either the current Table-I or the historical (now-omitted) Table-II** — it appears to have been invented or conflated, not transcribed from any real version of the Rules. **It has been fully removed from all rule data and must never be reintroduced.** The corrected table appears in §1 above and in `rules/packaged_commodities/2011/rule-7.json`.
- **SUPERSEDED — early framing of font-size checking as a low-priority stretch goal.** Before the official brief was supplied, an earlier working draft of the project's scope treated font-size/readability checking as a "P3 stretch goal," reasoning that it was legally required but rarely central to a demo. Once the official brief was supplied, it explicitly named "font size and readability analysis" as a Key Functional Requirement — this superseded the earlier prioritization. (The underlying technical difficulty assessment — that a photo has no inherent physical scale — was **not** superseded; it remains correct and is now addressed via the `NOT_MEASURABLE` state and, optionally, `INNOV-001`.)
- **SUPERSEDED — early uncertainty about the primary user.** Before the official brief, the project's own analysis treated the primary user (inspector vs. consumer vs. manufacturer) as an open, unresolved question, and scored multiple concepts accordingly. The official brief resolved this definitively in favor of enforcement officials; the consumer- and manufacturer-facing concepts were retroactively marked "not a target user," not merely deprioritized.
- **Refined, not corrected — "eMaap."** Early references to a national Legal Metrology digitization portal used the informal name "eMaap" without a confirmed domain. This was refined (not corrected — the underlying claim was not wrong) to the specific, confirmed `emaap.gov.in` (CLMS) once directly verified.
