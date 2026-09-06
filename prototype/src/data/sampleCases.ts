/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Realistic Packaged Commodity Case Records
 * Grounded in actual Indian Market Inspection scenarios
 */

import { PackageEvidence } from '../types';
import { STATUTORY_CITATIONS } from './statutoryRules';

export const INITIAL_CASES: PackageEvidence[] = [
  {
    caseId: "CASE-2026-DL-8491",
    productName: "Ananda Pure Kachi Ghani Mustard Oil",
    brand: "Ananda Agro Foods Ltd.",
    category: "EDIBLE_OILS",
    packagingType: "PET Bottle (Blow-Moulded & Labelled)",
    netQuantityDeclared: "1 Litre (910 g)",
    pdpDimensions: {
      heightCm: 26.0,
      widthCm: 12.0,
      areaSqCm: 312.0
    },
    imageResolution: "3840 x 2160 (4K UHD)",
    sensorDpi: 450,
    sha256Digest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    inspectionCircle: "North Delhi Circle - Subzi Mandi Division",
    inspectorName: "Rajesh Kumar Sharma (LMO-4091)",
    timestamp: "2026-09-02T11:42:00+05:30",
    inspectionPlace: "M/s Garg Kirana Stores, Azadpur Mandi, Delhi 110033",
    overallStatus: "NON_COMPLIANT",
    summaryVerdict: "Multiple contraventions under Rule 6(1)(e), Rule 6(1)(n), and Rule 7 Table-I. Actionable under Section 18(1) read with Section 36(1) of Legal Metrology Act, 2009.",
    legalNoticeEligible: true,
    statutoryPenaltyEstimate: 25000,
    channel: "OFFLINE_RETAIL",
    retailerName: "M/s Garg Kirana Stores",
    packageSvgId: "mustard_oil",
    rule7Measurement: {
      pdpAreaSqCm: 312.0,
      measuredNumeralHeightMm: 2.8,
      requiredNumeralHeightMm: 4.0,
      ratioWidthToHeight: 0.42,
      isPass: false,
      deficitMm: 1.2,
      packagingType: "STANDARD_PRINT",
      statutoryTier: "200 < A ≤ 1000 cm² (Req: ≥ 4.0 mm)"
    },
    boundingBoxes: [
      {
        id: "box-mrp",
        x: 62,
        y: 65,
        width: 32,
        height: 12,
        fieldKey: "mrp",
        label: "MRP Declaration",
        status: "NON_COMPLIANT",
        detectedText: "MRP: Rs. 185.00\nPKD: 08/2026"
      },
      {
        id: "box-net-qty",
        x: 18,
        y: 64,
        width: 38,
        height: 14,
        fieldKey: "net_quantity",
        label: "Net Quantity (Rule 7)",
        status: "NON_COMPLIANT",
        detectedText: "NET VOL: 1 Litre (910g)\nHeight: 2.8mm"
      },
      {
        id: "box-mfg",
        x: 10,
        y: 22,
        width: 80,
        height: 15,
        fieldKey: "manufacturer",
        label: "Manufacturer & FSSAI",
        status: "COMPLIANT",
        detectedText: "Mfd & Packed by: Ananda Agro Foods Ltd., Plot 14, Phase II, RIICO Ind. Area, Alwar (Raj.) Lic. 10014013000788"
      },
      {
        id: "box-consumer-care",
        x: 55,
        y: 80,
        width: 40,
        height: 14,
        fieldKey: "consumer_care",
        label: "Consumer Care",
        status: "NON_COMPLIANT",
        detectedText: "For feedback call: 0144-2884190\n(Email missing)"
      },
      {
        id: "box-generic",
        x: 15,
        y: 40,
        width: 70,
        height: 12,
        fieldKey: "generic_name",
        label: "Generic Name",
        status: "COMPLIANT",
        detectedText: "MUSTARD OIL (KACHI GHANI)"
      }
    ],
    declarations: [
      {
        id: "decl-mrp",
        fieldKey: "mrp",
        declarationName: "Maximum Retail Price (MRP) & Unit Sale Price",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(e)",
        requiredFormat: "MRP ₹... (inclusive of all taxes) + Unit Sale Price (₹/Litre or ₹/kg)",
        detectedText: "MRP: Rs. 185.00 (No tax qualification; USP omitted)",
        status: "NON_COMPLIANT",
        confidence: 99.1,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_E.rule,
          clauseSummary: "Mandatory qualification '(incl. of all taxes)' and Unit Sale Price missing.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_E.text,
          penalProvision: "Actionable under Section 36(1) (Penalty up to ₹25,000 for first violation)."
        },
        algorithmicFinding: "FAIL: The declaration 'MRP: Rs. 185.00' lacks statutory suffix '(inclusive of all taxes)' or '(incl. of all taxes)'. Unit Sale Price (USP: ₹185.00/L) also not declared.",
        evidenceDetails: "OCR bounding box #box-mrp located on lower-right quadrant. Exact text parsed: 'MRP: Rs. 185.00 PKD: 08/2026'. Zero regex match for /incl|inclusive.*all.*tax/i.",
        boundingBoxId: "box-mrp"
      },
      {
        id: "decl-net-qty",
        fieldKey: "net_quantity",
        declarationName: "Net Quantity & Character Numeral Height",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(c) & Rule 7 Table-I",
        requiredFormat: "Minimum numeral height of 4.0 mm for PDP Area between 200 cm² and 1000 cm²",
        detectedText: "NET VOL: 1 Litre (910g) [Numeral height = 2.8 mm]",
        status: "NON_COMPLIANT",
        confidence: 98.6,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_7.rule,
          clauseSummary: "Numeral height 2.8 mm fails minimum 4.0 mm statutory threshold for PDP 312 cm².",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_7.text,
          penalProvision: "Non-standard declaration under Section 18(1) punishable under Section 36(1)."
        },
        algorithmicFinding: "FAIL: Calculated PDP area is 312.0 cm² (26.0 cm × 12.0 cm). Table-I mandates min 4.0 mm height for numerals. Optical caliper measurement confirms numeral '1' is 2.8 mm (deficit: 1.2 mm / -30%).",
        evidenceDetails: "Physical calibration: 450 DPI sensor yields 17.7 pixels/mm. The detected numeral '1' measures 49.6 pixels = 2.80 mm. Non-compliant by 1.2 mm.",
        boundingBoxId: "box-net-qty"
      },
      {
        id: "decl-consumer-care",
        fieldKey: "consumer_care",
        declarationName: "Consumer Care & Grievance Mechanism",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(n)",
        requiredFormat: "Name, address, telephone number AND e-mail address of grievance officer",
        detectedText: "For feedback call: 0144-2884190 (No email or contact designation)",
        status: "NON_COMPLIANT",
        confidence: 97.4,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_N.rule,
          clauseSummary: "Mandatory consumer grievance email address is omitted from the label.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_N.text,
          penalProvision: "Violation of mandatory declaration under Rule 6(1)(n)."
        },
        algorithmicFinding: "FAIL: Telephone contact detected, but no electronic email address or grievance officer address provided as required by amendment.",
        evidenceDetails: "Text in #box-consumer-care: 'For feedback call: 0144-2884190'. No RFC 5322 email string detected.",
        boundingBoxId: "box-consumer-care"
      },
      {
        id: "decl-mfg",
        fieldKey: "manufacturer",
        declarationName: "Name & Address of Manufacturer / Packer",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(a)",
        requiredFormat: "Complete corporate name and physical premises address with state & pin code",
        detectedText: "Mfd & Packed by: Ananda Agro Foods Ltd., Plot 14, Phase II, RIICO Ind. Area, Alwar (Raj.) 301030",
        status: "COMPLIANT",
        confidence: 99.4,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_A.rule,
          clauseSummary: "Complete manufacturer and packer name and physical address present.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_A.text,
          penalProvision: "In full compliance with statutory declaration."
        },
        algorithmicFinding: "PASS: Complete name and physical location with industrial postal code verified against ROC database.",
        evidenceDetails: "Entity active on MCA portal; address complete with state and postal code.",
        boundingBoxId: "box-mfg"
      },
      {
        id: "decl-generic",
        fieldKey: "generic_name",
        declarationName: "Generic Name of Commodity",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(b)",
        requiredFormat: "Common or generic name prominent on principal display panel",
        detectedText: "MUSTARD OIL (KACHI GHANI)",
        status: "COMPLIANT",
        confidence: 99.8,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_B.rule,
          clauseSummary: "Unambiguous generic name declared prominently.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_B.text,
          penalProvision: "In full compliance with statutory declaration."
        },
        algorithmicFinding: "PASS: Generic name 'MUSTARD OIL' appears in bold capital letters exceeding 5.0 mm height on main face.",
        evidenceDetails: "Dominant heading on label panel. Verified against AGMARK & FSSAI standards.",
        boundingBoxId: "box-generic"
      },
      {
        id: "decl-date",
        fieldKey: "date_mfg",
        declarationName: "Month & Year of Manufacture / Packing",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(d)",
        requiredFormat: "MM/YYYY or Month Year clearly stamped",
        detectedText: "PKD: 08/2026 (Batch #AKG-8812)",
        status: "COMPLIANT",
        confidence: 98.9,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_D.rule,
          clauseSummary: "Clear month and year of pre-packing stamped.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_D.text,
          penalProvision: "Compliant."
        },
        algorithmicFinding: "PASS: Date declaration '08/2026' matches standard MM/YYYY format.",
        evidenceDetails: "Legible laser-inkjet print located adjacent to MRP box.",
        boundingBoxId: "box-mrp"
      }
    ]
  },
  {
    caseId: "CASE-2026-MH-3312",
    productName: "Kisan Fresh Pasteurised Table Butter",
    brand: "Kisan Dairy Producers Cooperative Ltd.",
    category: "DAIRY",
    packagingType: "Printed Wax-Coated Paperboard Carton",
    netQuantityDeclared: "500 g",
    pdpDimensions: {
      heightCm: 15.0,
      widthCm: 16.0,
      areaSqCm: 240.0
    },
    imageResolution: "4000 x 3000",
    sensorDpi: 400,
    sha256Digest: "f4a1c5b882da5f9b4c0926715f532a26532467b7f168018e69d08e9d99bb840a",
    inspectionCircle: "Mumbai Port Zone - Ward G/North",
    inspectorName: "Smt. Priya V. Deshmukh (LMO-2104)",
    timestamp: "2026-09-03T14:15:00+05:30",
    inspectionPlace: "Reliance Retail Hub, Kurla West, Mumbai 400070",
    overallStatus: "COMPLIANT",
    summaryVerdict: "Full statutory compliance verified under all sub-rules of Rule 6 and Rule 7 Table-I. No contraventions detected.",
    legalNoticeEligible: false,
    statutoryPenaltyEstimate: 0,
    channel: "OFFLINE_RETAIL",
    retailerName: "Reliance Retail Hub",
    packageSvgId: "table_butter",
    rule7Measurement: {
      pdpAreaSqCm: 240.0,
      measuredNumeralHeightMm: 4.2,
      requiredNumeralHeightMm: 4.0,
      ratioWidthToHeight: 0.48,
      isPass: true,
      deficitMm: 0,
      packagingType: "STANDARD_PRINT",
      statutoryTier: "200 < A ≤ 1000 cm² (Req: ≥ 4.0 mm)"
    },
    boundingBoxes: [
      {
        id: "box-kb-mrp",
        x: 58,
        y: 62,
        width: 38,
        height: 18,
        fieldKey: "mrp",
        label: "MRP & Unit Sale Price",
        status: "COMPLIANT",
        detectedText: "MRP ₹ 275.00 (incl. of all taxes)\nUSP: ₹ 0.55 / g"
      },
      {
        id: "box-kb-qty",
        x: 12,
        y: 64,
        width: 38,
        height: 14,
        fieldKey: "net_quantity",
        label: "Net Weight (Rule 7)",
        status: "COMPLIANT",
        detectedText: "Net Weight: 500 g\nNumeral Height: 4.2 mm"
      },
      {
        id: "box-kb-mfg",
        x: 10,
        y: 18,
        width: 80,
        height: 16,
        fieldKey: "manufacturer",
        label: "Packer & Lic",
        status: "COMPLIANT",
        detectedText: "Mfd by: Kisan Dairy Cooperative Ltd., Anand Road, Kaira 388001. Lic. No. 10012021000045"
      },
      {
        id: "box-kb-care",
        x: 10,
        y: 82,
        width: 80,
        height: 12,
        fieldKey: "consumer_care",
        label: "Consumer Cell",
        status: "COMPLIANT",
        detectedText: "Toll Free: 1800-258-3333 | care@kisandairy.coop"
      }
    ],
    declarations: [
      {
        id: "kb-decl-mrp",
        fieldKey: "mrp",
        declarationName: "Maximum Retail Price (MRP) & Unit Sale Price",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(e)",
        requiredFormat: "MRP ₹... (inclusive of all taxes) + Unit Sale Price",
        detectedText: "MRP ₹ 275.00 (incl. of all taxes) | Unit Sale Price: ₹ 0.55 / g",
        status: "COMPLIANT",
        confidence: 99.6,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_E.rule,
          clauseSummary: "Properly declared with inclusive tax statement and exact unit price.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_E.text,
          penalProvision: "None - Compliant."
        },
        algorithmicFinding: "PASS: Tax disclaimer present and Unit Sale Price mathematically verified (₹275.00 / 500g = ₹0.55/g).",
        evidenceDetails: "Crisp typography in high contrast dark blue on yellow panel.",
        boundingBoxId: "box-kb-mrp"
      },
      {
        id: "kb-decl-qty",
        fieldKey: "net_quantity",
        declarationName: "Net Quantity & Numeral Height",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(c) & Rule 7 Table-I",
        requiredFormat: "Minimum 4.0 mm numeral height for PDP 240 cm²",
        detectedText: "Net Weight: 500 g [Measured Numeral Height = 4.2 mm]",
        status: "COMPLIANT",
        confidence: 99.2,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_7.rule,
          clauseSummary: "Measured numeral height 4.2 mm exceeds the statutory threshold of 4.0 mm.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_7.text,
          penalProvision: "None - Compliant."
        },
        algorithmicFinding: "PASS: Measured height 4.2 mm (+5% safety margin above statutory 4.0 mm threshold).",
        evidenceDetails: "Sensor measurement: 66.2 px @ 400 DPI = 4.20 mm. Width-to-height ratio 0.48 complies with Rule 7(3).",
        boundingBoxId: "box-kb-qty"
      },
      {
        id: "kb-decl-care",
        fieldKey: "consumer_care",
        declarationName: "Consumer Care & Grievance Mechanism",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(n)",
        requiredFormat: "Name, address, toll-free telephone and working email",
        detectedText: "Customer Care Officer, Kisan Dairy Ltd, Anand 388001. Toll Free: 1800-258-3333, care@kisandairy.coop",
        status: "COMPLIANT",
        confidence: 99.8,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_N.rule,
          clauseSummary: "Complete multi-channel grievance contact information provided.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_N.text,
          penalProvision: "None - Compliant."
        },
        algorithmicFinding: "PASS: Toll free number active and verified domain email declared.",
        evidenceDetails: "Both voice telephone and official email verified present.",
        boundingBoxId: "box-kb-care"
      }
    ]
  },
  {
    caseId: "CASE-2026-KA-1109",
    productName: "NeutraCare Electrolyte Energy Boost Sachet",
    brand: "NeutraCare Formulations",
    category: "PHARMACEUTICALS",
    packagingType: "Multi-layered Foil Sachet (Small Pack)",
    netQuantityDeclared: "8 g",
    pdpDimensions: {
      heightCm: 7.0,
      widthCm: 5.0,
      areaSqCm: 35.0
    },
    imageResolution: "2400 x 3000",
    sensorDpi: 450,
    sha256Digest: "9a823fc193a6c117b189a8cf6152a4918e95c479bfd0a51838612ca058444a63",
    inspectionCircle: "Bengaluru South - Jayanagar Ward",
    inspectorName: "K. Venkatesh (LMO-3155)",
    timestamp: "2026-09-04T09:30:00+05:30",
    inspectionPlace: "Apollo Pharmacy, 4th Block Jayanagar, Bengaluru 560011",
    overallStatus: "STATUTORILY_EXEMPT",
    summaryVerdict: "Package is STATUTORILY EXEMPT under Rule 26(a) of LMPC Rules, 2011 as net quantity declared is 8 g (≤ 10 g). Mandatory chapter II provisions not applicable.",
    legalNoticeEligible: false,
    statutoryPenaltyEstimate: 0,
    channel: "OFFLINE_RETAIL",
    retailerName: "Apollo Pharmacy",
    packageSvgId: "electrolyte_sachet",
    rule7Measurement: {
      pdpAreaSqCm: 35.0,
      measuredNumeralHeightMm: 1.6,
      requiredNumeralHeightMm: 1.0,
      ratioWidthToHeight: 0.5,
      isPass: true,
      packagingType: "STANDARD_PRINT",
      statutoryTier: "A ≤ 50 cm² (Exempt under Rule 26(a) <= 10g)"
    },
    boundingBoxes: [
      {
        id: "box-nc-qty",
        x: 20,
        y: 40,
        width: 60,
        height: 20,
        fieldKey: "net_quantity",
        label: "Net Qty (8g - Exempt)",
        status: "STATUTORILY_EXEMPT",
        detectedText: "Net Wt: 8 g\nRule 26(a) Exemption Applicable"
      }
    ],
    declarations: [
      {
        id: "nc-decl-exemption",
        fieldKey: "exemption_status",
        declarationName: "Statutory Scope & Rule 26 Exemption",
        statutoryRule: "LMPC Rules 2011 - Rule 26(a)",
        requiredFormat: "Net quantity <= 10 grams is exempt from mandatory chapter II declarations",
        detectedText: "Net Wt: 8 g (Exempt)",
        status: "STATUTORILY_EXEMPT",
        confidence: 99.9,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: "Section 18 Exemption Clause",
          rule: STATUTORY_CITATIONS.LMPC_RULE_26_A.rule,
          clauseSummary: "Rule 26(a) exempts packages containing 10 grams or 10 milliliters or less.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_26_A.text,
          penalProvision: "Not liable under Section 36(1) due to statutory exemption."
        },
        algorithmicFinding: "EXEMPT: Declared net weight is 8.0 g. Under Rule 26(a), commodities of 10g/10ml or less are statutorily exempt from standard package size and declaration rules.",
        evidenceDetails: "Confirmed net weight declaration: '8 g'. Certified laboratory scale tare validation concordant.",
        boundingBoxId: "box-nc-qty"
      }
    ]
  },
  {
    caseId: "CASE-2026-WB-7721",
    productName: "GlowRadiance Advanced 15% Vitamin C Serum (30ml)",
    brand: "GlowRadiance Skincare Labs (Imported)",
    category: "COSMETICS",
    packagingType: "E-Commerce Digital Listing & Amber Dropper Bottle",
    netQuantityDeclared: "30 ml",
    pdpDimensions: {
      heightCm: 18.0,
      widthCm: 10.0,
      areaSqCm: 180.0
    },
    imageResolution: "2048 x 2048 Digital Screenshot",
    sensorDpi: 300,
    sha256Digest: "b7289f31502f6ef8292c420235adcf2e34279b392bc13d5cf486e245585b736b",
    inspectionCircle: "Kolkata E-Commerce Enforcement Cell - Cyber Wing",
    inspectorName: "Anirban Sen (LMO-6188)",
    timestamp: "2026-09-04T16:00:00+05:30",
    inspectionPlace: "E-Commerce Marketplace URL (ASIN: B09X87KLLM)",
    overallStatus: "NEEDS_REVIEW",
    summaryVerdict: "Digital Listing contravenes GSR 128(E) / Rule 6(10A). Country of Origin and Importer Registration Address omitted from the primary digital display panel.",
    legalNoticeEligible: true,
    statutoryPenaltyEstimate: 25000,
    channel: "E_COMMERCE_PORTAL",
    retailerName: "QuickMart Global Retail India Pvt. Ltd.",
    packageSvgId: "cosmetic_serum",
    rule7Measurement: {
      pdpAreaSqCm: 180.0,
      measuredNumeralHeightMm: 2.2,
      requiredNumeralHeightMm: 2.0,
      ratioWidthToHeight: 0.44,
      isPass: true,
      packagingType: "STANDARD_PRINT",
      statutoryTier: "50 < A ≤ 200 cm² (Req: ≥ 2.0 mm)"
    },
    boundingBoxes: [
      {
        id: "box-gr-origin",
        x: 15,
        y: 70,
        width: 70,
        height: 18,
        fieldKey: "country_of_origin",
        label: "Origin & Importer (Missing)",
        status: "NEEDS_REVIEW",
        detectedText: "Country of Origin: [MISSING ON DIGITAL PDP]\nImporter: GlowRadiance India"
      },
      {
        id: "box-gr-mrp",
        x: 55,
        y: 45,
        width: 40,
        height: 15,
        fieldKey: "mrp",
        label: "Digital MRP",
        status: "COMPLIANT",
        detectedText: "M.R.P.: ₹ 899.00 (incl. of all taxes)\n(₹ 29.97 / ml)"
      }
    ],
    declarations: [
      {
        id: "gr-decl-origin",
        fieldKey: "country_of_origin",
        declarationName: "Country of Origin & Digital Listing Compliance",
        statutoryRule: "GSR 128(E) / LMPC Rule 6(10A)",
        requiredFormat: "Prominent disclosure of Country of Origin and registered importer on digital marketplace primary display",
        detectedText: "Origin unspecified on main listing face. Hidden under secondary expandable tab.",
        status: "NEEDS_REVIEW",
        confidence: 94.2,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: "Section 18(1) read with E-Commerce Guidelines",
          rule: STATUTORY_CITATIONS.GSR_128_E.rule,
          clauseSummary: "Country of origin must be stated prominently on digital product page before checkout.",
          fullStatutoryText: STATUTORY_CITATIONS.GSR_128_E.text,
          penalProvision: "E-commerce platform and seller liable under Section 36(1)."
        },
        algorithmicFinding: "REVIEW: The product is manufactured abroad (Republic of Korea), but 'Country of Origin' is not displayed on the primary product view pane. Requires officer verification of backend seller declarations.",
        evidenceDetails: "DOM scrape of product listing shows 'origin' attribute empty in primary buy-box metadata.",
        boundingBoxId: "box-gr-origin"
      }
    ]
  },
  {
    caseId: "CASE-2026-DL-9943",
    productName: "Swasthya Special Ayurvedic Chyawanprash",
    brand: "Swasthya Ayur Laboratories Pvt. Ltd.",
    category: "PACKAGED_FOODS",
    packagingType: "HDPE Wide-Mouth Jar",
    netQuantityDeclared: "1000",
    pdpDimensions: {
      heightCm: 22.0,
      widthCm: 14.0,
      areaSqCm: 308.0
    },
    imageResolution: "3840 x 2160",
    sensorDpi: 400,
    sha256Digest: "c18a992e541b6cf0594a11f2a58b88d3e91129b012678da4b189281a9544bb11",
    inspectionCircle: "South Delhi Circle - Saket Administrative Complex",
    inspectorName: "Vipin C. Nair (LMO-1802)",
    timestamp: "2026-09-05T08:20:00+05:30",
    inspectionPlace: "Nature Mart Supermarket, GK-II, New Delhi 110048",
    overallStatus: "NON_COMPLIANT",
    summaryVerdict: "Contravention of Rule 6(1)(c) and Rule 13: Net quantity declared as bare numeral '1000' with statutory unit of measurement ('g' or 'kg') missing.",
    legalNoticeEligible: true,
    statutoryPenaltyEstimate: 25000,
    channel: "OFFLINE_RETAIL",
    retailerName: "Nature Mart Supermarket",
    packageSvgId: "chyawanprash_jar",
    rule7Measurement: {
      pdpAreaSqCm: 308.0,
      measuredNumeralHeightMm: 4.5,
      requiredNumeralHeightMm: 4.0,
      ratioWidthToHeight: 0.45,
      isPass: true,
      deficitMm: 0,
      packagingType: "STANDARD_PRINT",
      statutoryTier: "200 < A ≤ 1000 cm² (Req: ≥ 4.0 mm)"
    },
    boundingBoxes: [
      {
        id: "box-sw-qty",
        x: 18,
        y: 65,
        width: 35,
        height: 14,
        fieldKey: "net_quantity",
        label: "Net Qty (Unit Missing)",
        status: "NON_COMPLIANT",
        detectedText: "Net Quantity: 1000\n[UNIT SYMBOL 'g' MISSING]"
      },
      {
        id: "box-sw-mrp",
        x: 55,
        y: 65,
        width: 38,
        height: 16,
        fieldKey: "mrp",
        label: "MRP Declaration",
        status: "COMPLIANT",
        detectedText: "MRP ₹ 395.00 (incl. of all taxes)\nPKD: 07/2026"
      }
    ],
    declarations: [
      {
        id: "sw-decl-qty",
        fieldKey: "net_quantity",
        declarationName: "Standard Unit of Weight (Rule 13)",
        statutoryRule: "LMPC Rules 2011 - Rule 6(1)(c) & Rule 13",
        requiredFormat: "Net quantity must include standard unit symbol (e.g. '1 kg' or '1000 g')",
        detectedText: "Net Quantity: 1000 (Omitted 'g' / 'kg')",
        status: "NON_COMPLIANT",
        confidence: 99.3,
        citation: {
          act: STATUTORY_CITATIONS.LM_ACT_SEC_18.act,
          section: STATUTORY_CITATIONS.LM_ACT_SEC_18.section,
          rule: STATUTORY_CITATIONS.LMPC_RULE_6_1_C.rule,
          clauseSummary: "Rule 13 mandates net quantity shall be expressed in terms of standard unit of mass.",
          fullStatutoryText: STATUTORY_CITATIONS.LMPC_RULE_6_1_C.text,
          penalProvision: "Violation of statutory declaration standards under Section 36(1)."
        },
        algorithmicFinding: "FAIL: Net quantity declaration reads 'Net Quantity: 1000'. The statutory symbol for grams ('g') or kilograms ('kg') is missing, violating Rule 13.",
        evidenceDetails: "High confidence OCR confirms characters '1 0 0 0' followed by whitespace and barcode margin.",
        boundingBoxId: "box-sw-qty"
      }
    ]
  }
];
