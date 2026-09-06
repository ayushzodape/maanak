import { createRule, Rule } from '../domain';

/**
 * This is deliberately a small, verified declaration-presence subset. It
 * contains no thresholds or inferred legal requirements. Applicability gaps
 * remain explicit until the legal source is verified and encoded.
 */
export const RULESET_VERSION = 'lmpc-2011-core-declarations-verified-subset-1';
const verificationDate = '2026-09-06T00:00:00.000Z';

const declarationRules = [
  ['LMPC_RULE_6_MANUFACTURER', 'Manufacturer/packer/importer declaration', 'manufacturer'],
  ['LMPC_RULE_6_GENERIC_NAME', 'Generic name declaration', 'generic_name'],
  ['LMPC_RULE_6_NET_QUANTITY', 'Net quantity declaration', 'net_quantity'],
  ['LMPC_RULE_6_PACKING_DATE', 'Month/year of manufacture, packing, or import', 'date_mfg'],
  ['LMPC_RULE_6_MRP', 'Maximum retail price declaration', 'mrp'],
  ['LMPC_RULE_6_CONSUMER_CARE', 'Consumer-care declaration', 'consumer_care'],
] as const;

export const VERIFIED_RULE_DEFINITIONS: readonly Rule[] = declarationRules.map(
  ([id, title, field]) => createRule({
    id,
    title,
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6 core declaration subset',
    sourceVersion: RULESET_VERSION,
    effectiveFrom: null,
    verifiedOn: verificationDate,
    verificationStatus: 'VERIFIED',
    logic: { kind: 'DECLARATION_PRESENCE', field },
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
