import { createRule, Rule, RuleApplicability } from '../domain';

/**
 * This is deliberately a small, verified declaration-presence subset. It
 * contains no thresholds or inferred legal requirements. Applicability gaps
 * remain explicit until the legal source is verified and encoded.
 */
export const RULESET_VERSION = 'lmpc-2011-core-declarations-verified-subset-1';
const verificationDate = '2026-09-06T00:00:00.000Z';

interface DeclarationRuleConfig {
  readonly id: string;
  readonly title: string;
  readonly field: string;
  readonly applicability?: RuleApplicability;
}

const declarationRules: readonly DeclarationRuleConfig[] = [
  { id: 'LMPC_RULE_6_MANUFACTURER', title: 'Manufacturer/packer/importer declaration', field: 'manufacturer' },
  { id: 'LMPC_RULE_6_GENERIC_NAME', title: 'Generic name declaration', field: 'generic_name' },
  { id: 'LMPC_RULE_6_NET_QUANTITY', title: 'Net quantity declaration', field: 'net_quantity' },
  {
    id: 'LMPC_RULE_6_PACKING_DATE',
    title: 'Month/year of manufacture, packing, or import',
    field: 'date_mfg',
    applicability: {
      exemptCategories: ['SMALL_SACHET'],
      exemptionReason: 'Small retail packages (<= 10g / 10ml) are exempt from detailed date declaration under LMPC Rule 26(a).',
    },
  },
  {
    id: 'LMPC_RULE_6_MRP',
    title: 'Maximum retail price declaration',
    field: 'mrp',
    applicability: {
      exemptCategories: ['SMALL_SACHET', 'INDUSTRIAL_BULK'],
      exemptionReason: 'Exempt from retail MRP declaration under LMPC Rule 26(a) (packages <= 10g) / Rule 3 (industrial/institutional consumer packages).',
    },
  },
  {
    id: 'LMPC_RULE_6_CONSUMER_CARE',
    title: 'Consumer-care declaration',
    field: 'consumer_care',
    applicability: {
      exemptCategories: ['SMALL_SACHET', 'INDUSTRIAL_BULK'],
      exemptionReason: 'Exempt from consumer care declaration under LMPC Rule 26(a) / Rule 3 (not for retail individual sale).',
    },
  },
];

export const VERIFIED_RULE_DEFINITIONS: readonly Rule[] = declarationRules.map(
  ({ id, title, field, applicability }) => createRule({
    id,
    title,
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6 core declaration subset',
    sourceVersion: RULESET_VERSION,
    effectiveFrom: null,
    verifiedOn: verificationDate,
    verificationStatus: 'VERIFIED',
    logic: { kind: 'DECLARATION_PRESENCE', field },
    applicability,
    knownGaps: [
      'This subset does not encode all exemptions or context-specific applicability.',
      'Imported-product country-of-origin and e-commerce-specific requirements require separate verified rule definitions.',
    ],
  }),
);

/** Rule 7(2)/(3), based on the consolidated DCA corpus PDF in docs/legal_corpus. */
export const RULE_7 = createRule({
  id: 'LMPC_RULE_7_CHARACTER_HEIGHT',
  title: 'Rule 7 character-height screening',
  source: 'docs/legal_corpus/lmpc_rules_2011_consolidated_dca.pdf — Rule 7(2), Rule 7(3), Table-I',
  sourceVersion: 'GSR-629-E-rule-7-current-2018-01-01',
  effectiveFrom: null,
  verifiedOn: verificationDate,
  verificationStatus: 'VERIFIED',
  logic: {
    kind: 'CHARACTER_HEIGHT_AREA',
    fields: { panelArea: 'principal_display_panel_area_cm2', characterHeight: 'character_height_mm', characterWidth: 'character_width_mm', markingMethod: 'container_marking_method', packageScope: 'package_scope' },
  },
  applicability: {
    exemptCategories: ['SMALL_SACHET', 'INDUSTRIAL_BULK'],
    exemptionReason: 'Rule 7 minimum character height tables apply specifically to standard retail packaged commodities.',
  },
  knownGaps: [
    'Ordinary phone photographs are not certified measurement evidence.',
    'Reliable millimetre measurement requires a physical scale reference; ordinary photographs are not certified measurement evidence.',
    'Rule 26 and commodity-specific exemptions require separate verified applicability inputs.',
  ],
});

/** Compatibility fixture for tests and historical demo data; never active. */
export const BLOCKED_RULE_7 = createRule({
  ...RULE_7,
  id: 'LMPC_RULE_7_CHARACTER_HEIGHT_BLOCKED_LEGACY',
  sourceVersion: 'legacy-blocked-rule-7',
  verificationStatus: 'BLOCKED',
  logic: { kind: 'BLOCKED', field: 'character_height', reason: 'Legacy fixture placeholder; use the current PDF-backed Rule 7 definition.' },
});

export const CURRENT_RULE_DEFINITIONS: readonly Rule[] = [
  ...VERIFIED_RULE_DEFINITIONS,
  RULE_7,
];
