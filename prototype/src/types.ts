/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maanak - Packaged Commodity Compliance Verification
 * Types & Interfaces for Legal Metrology & LMPC Compliance Engine
 */

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW' | 'STATUTORILY_EXEMPT';

export type UserRole = 
  | 'LEGAL_METROLOGY_OFFICER' 
  | 'ZONAL_INSPECTOR' 
  | 'CONTROLLER_OF_LEGAL_METROLOGY' 
  | 'ENTERPRISE_COMPLIANCE_AUDITOR';

export interface BoundingBox {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  fieldKey: string;
  label: string;
  status: ComplianceStatus;
  detectedText: string;
}

export interface RuleCitation {
  act: string; // e.g. "Legal Metrology Act, 2009"
  section: string; // e.g. "Section 18(1) read with Section 36(1)"
  rule: string; // e.g. "LMPC Rules, 2011 - Rule 6(1)(e)"
  clauseSummary: string;
  fullStatutoryText: string;
  penalProvision: string;
}

export interface DeclarationAuditItem {
  id: string;
  fieldKey: string;
  declarationName: string;
  statutoryRule: string;
  requiredFormat: string;
  detectedText: string;
  status: ComplianceStatus;
  confidence: number; // 0 - 100
  citation: RuleCitation;
  algorithmicFinding: string;
  evidenceDetails: string;
  boundingBoxId: string;
  isOverridden?: boolean;
  overrideDetails?: {
    officerId: string;
    officerName: string;
    previousStatus: ComplianceStatus;
    newStatus: ComplianceStatus;
    reason: string;
    timestamp: string;
    remarks: string;
  };
}

export interface Rule7Measurement {
  pdpAreaSqCm: number;
  measuredNumeralHeightMm: number;
  requiredNumeralHeightMm: number;
  ratioWidthToHeight: number;
  isPass: boolean;
  deficitMm?: number;
  packagingType: 'STANDARD_PRINT' | 'BLOW_MOULDED' | 'PERFORATED';
  statutoryTier: string;
}

export interface PackageEvidence {
  caseId: string;
  productName: string;
  brand: string;
  category: 'EDIBLE_OILS' | 'DAIRY' | 'COSMETICS' | 'PACKAGED_FOODS' | 'BEVERAGES' | 'PHARMACEUTICALS';
  packagingType: string;
  netQuantityDeclared: string;
  pdpDimensions: {
    heightCm: number;
    widthCm: number;
    areaSqCm: number;
  };
  imageResolution: string;
  sensorDpi: number;
  sha256Digest: string;
  inspectionCircle: string;
  inspectorName: string;
  timestamp: string;
  inspectionPlace: string;
  overallStatus: ComplianceStatus;
  summaryVerdict: string;
  legalNoticeEligible: boolean;
  statutoryPenaltyEstimate: number; // in INR
  declarations: DeclarationAuditItem[];
  rule7Measurement?: Rule7Measurement;
  boundingBoxes: BoundingBox[];
  packageSvgId: string; // references SVG artwork
  notes?: string;
  channel: 'OFFLINE_RETAIL' | 'E_COMMERCE_PORTAL' | 'MANUFACTURING_PREMISES';
  retailerName?: string;
}
