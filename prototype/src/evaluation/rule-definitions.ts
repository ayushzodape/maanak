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

/** Rule 7 is intentionally blocked: the superseded PDP-area model is not used. */
export const BLOCKED_RULE_7 = createRule({
  id: 'LMPC_RULE_7_CHARACTER_HEIGHT',
  title: 'Rule 7 character-height screening',
  source: 'docs/spec/LEGAL_RESEARCH_STATUS.md — Rule 7 legal gap record',
  sourceVersion: 'blocked-pending-applicable-measurement-implementation',
  effectiveFrom: null,
  verifiedOn: verificationDate,
  verificationStatus: 'BLOCKED',
  logic: {
    kind: 'BLOCKED',
    field: 'character_height',
    reason: 'No verified applicable measurement implementation is available; the superseded PDP-area model is prohibited.',
  },
  knownGaps: [
    'Ordinary phone photographs are not certified measurement evidence.',
    'Requirements for length, area, or number declarations remain unresolved in the repository legal research.',
    'Do not reintroduce the PDP-area/caliper calculation.',
  ],
});

export const CURRENT_RULE_DEFINITIONS: readonly Rule[] = [
  ...VERIFIED_RULE_DEFINITIONS,
  BLOCKED_RULE_7,
];
