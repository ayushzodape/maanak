/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Legacy demo fixture citation data
 * This module is not a production legal ruleset. Do not use it for live results.
 * Grounded in Legal Metrology Act, 2009 and LMPC Rules, 2011 (as amended)
 */

export interface Rule7Threshold {
  maxAreaSqCm: number;
  minAreaSqCm: number;
  label: string;
  minHeightStandardMm: number;
  minHeightBlowMouldedMm: number;
  description: string;
}

/**
 * @deprecated DO NOT USE for live evaluation. The canonical Rule 7 logic is in
 * src/evaluation/evaluator.ts using verified thresholds from the DCA consolidated
 * PDF (GSR 629(E)). This table exists only for legacy fixture display.
 *
 * AGENTS.md Rule 8: "An earlier research handoff contained an incorrect/fabricated
 * Rule 7 table. DO NOT reintroduce that table."
 */
export const RULE_7_TABLE_I: Rule7Threshold[] = [
  {
    minAreaSqCm: 0,
    maxAreaSqCm: 50,
    label: "A < 50 cm²",
    minHeightStandardMm: 1.0,
    minHeightBlowMouldedMm: 1.5,
    description: "Small packages with principal display panel area less than 50 square centimeters."
  },
  {
    minAreaSqCm: 50,
    maxAreaSqCm: 100,
    label: "50 ≤ A < 100 cm²",
    minHeightStandardMm: 1.5,
    minHeightBlowMouldedMm: 3.0,
    description: "Packages with PDP area 50 cm² or more but less than 100 cm²."
  },
  {
    minAreaSqCm: 100,
    maxAreaSqCm: 500,
    label: "100 ≤ A < 500 cm²",
    minHeightStandardMm: 2.5,
    minHeightBlowMouldedMm: 4.0,
    description: "Packages with PDP area 100 cm² or more but less than 500 cm²."
  },
  {
    minAreaSqCm: 500,
    maxAreaSqCm: 2500,
    label: "500 ≤ A < 2500 cm²",
    minHeightStandardMm: 4.0,
    minHeightBlowMouldedMm: 6.0,
    description: "Packages with PDP area 500 cm² or more but less than 2500 cm²."
  },
  {
    minAreaSqCm: 2500,
    maxAreaSqCm: 99999,
    label: "A ≥ 2500 cm²",
    minHeightStandardMm: 6.0,
    minHeightBlowMouldedMm: 6.0,
    description: "Large packages with PDP area 2500 cm² or more."
  }
];

/**
 * @deprecated Use the canonical evaluateRule7() in src/evaluation/evaluator.ts instead.
 */
export function getRequiredNumeralHeight(pdpAreaSqCm: number, isBlowMoulded = false): number {
  for (const tier of RULE_7_TABLE_I) {
    if (pdpAreaSqCm < tier.maxAreaSqCm) {
      return isBlowMoulded ? tier.minHeightBlowMouldedMm : tier.minHeightStandardMm;
    }
  }
  return 6.0;
}

export const STATUTORY_CITATIONS = {
  LM_ACT_SEC_18: {
    act: "Legal Metrology Act, 2009",
    section: "Section 18(1)",
    title: "Prohibition of manufacture, packing, sale of non-standard packaged commodities",
    text: "No person shall manufacture, pack, sell, distribute, deliver, offer, expose or possess for sale by retail or wholesale any commodity in packaged form unless such package bears thereon such declarations and indications in such manner as may be prescribed."
  },
  LM_ACT_SEC_36: {
    act: "Legal Metrology Act, 2009",
    section: "Section 36(1)",
    title: "Penalty for selling, etc., of non-standard packages",
    text: "Whoever manufactures, packs, imports, sells, distributes, delivers or possesses for sale any non-standard package shall be punished with fine which may extend to ₹25,000 for the first offense, for the second offense to ₹50,000 and for the subsequent offense with fine which may extend to ₹1,00,000 or with imprisonment for a term which may extend to one year or with both.",
    firstOffenseMaxFine: 25000,
    secondOffenseMaxFine: 50000,
    subsequentOffenseMaxFine: 100000
  },
  LMPC_RULE_6_1_A: {
    rule: "Rule 6(1)(a)",
    title: "Manufacturer / Packer / Importer Details",
    text: "The name and complete address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer and for any imported package the name and address of the importer shall be mentioned."
  },
  LMPC_RULE_6_1_B: {
    rule: "Rule 6(1)(b)",
    title: "Generic or Common Name of Commodity",
    text: "The common or generic names of the commodity contained in the package and in case of packages with more than one product, the name and number or quantity of each product shall be mentioned on the package."
  },
  LMPC_RULE_6_1_C: {
    rule: "Rule 6(1)(c)",
    title: "Net Quantity & Unit of Measurement",
    text: "The net quantity, in terms of standard unit of weight or measure, of the commodity contained in the package shall be declared. If the number of items is packed, the number or count shall be mentioned."
  },
  LMPC_RULE_6_1_D: {
    rule: "Rule 6(1)(d)",
    title: "Month and Year of Manufacture / Packing / Import",
    text: "The month and year in which the commodity is manufactured or pre-packed or imported shall be mentioned in the prescribed format."
  },
  LMPC_RULE_6_1_E: {
    rule: "Rule 6(1)(e)",
    title: "Maximum Retail Price (MRP) & Unit Sale Price",
    text: "The retail sale price of the package shall clearly be declared as 'Maximum or Max. Retail Price ₹... (inclusive of all taxes)' or 'MRP ₹... incl. of all taxes'. For packages containing net weight/volume above standard units, the Unit Sale Price (USP) per g/ml/kg/l must also be declared."
  },
  LMPC_RULE_6_1_N: {
    rule: "Rule 6(1)(n)",
    title: "Consumer Care Grievance Redressal Mechanism",
    text: "The name, address, telephone number and e-mail address of the person who can be or the office which can be contacted, in case of consumer complaints, shall be mentioned on the package."
  },
  LMPC_RULE_7: {
    rule: "Rule 7 & Table-I",
    title: "Principal Display Panel Area & Minimum Character Height",
    text: "The minimum height of numerals and letters for net quantity declarations shall correspond strictly to the area of the Principal Display Panel (PDP) as mandated in Table-I. Furthermore, under Rule 7(3), the width of any numeral shall not be less than one-third of its height (excluding numeral 1)."
  },
  LMPC_RULE_26_A: {
    rule: "Rule 26(a)",
    title: "Statutory Exemption for Small Net Quantities",
    text: "Nothing in these rules shall apply to packages containing commodities with a net weight or measure of 10 grams or 10 milliliters or less, provided that if any declaration is made, it shall conform to the standards."
  },
  GSR_128_E: {
    rule: "GSR 128(E) / Rule 6(10A)",
    title: "E-Commerce Digital Display & Country of Origin (Feb 2024)",
    text: "Every marketplace e-commerce entity and seller shall display on the primary digital product page all mandatory declarations under Rule 6, specifically highlighting the Country of Origin, Manufacturer details, and true MRP before purchase checkout."
  }
};
