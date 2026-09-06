import { CanonicalScanResult, ComplianceResult, EvidenceImage, Scan, SourceType } from '../domain';

export interface ScanHistoryEntry {
  readonly scan: Scan;
  readonly result: CanonicalScanResult;
}

export interface ScanApiClient {
  createScan(input: { productName: string; sourceType: SourceType; ruleVersion: string; mode?: 'LIVE' | 'DEMO_FIXTURE' }): Promise<Scan>;
  uploadSourceImage(scanId: string, image: Blob, capturedAt?: string): Promise<{ image: EvidenceImage; scan: Scan }>;
  getScan(scanId: string): Promise<Scan>;
  saveResult(scanId: string, result: CanonicalScanResult): Promise<{ scan: Scan; result: CanonicalScanResult }>;
  getResult(scanId: string): Promise<CanonicalScanResult>;
  listHistory(filters?: { productName?: string; result?: ComplianceResult; from?: string; to?: string }): Promise<ScanHistoryEntry[]>;
}

export interface ScanApiErrorPayload {
  error?: { code?: string; message?: string };
}

export class ScanApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ScanApiError';
    this.status = status;
    this.code = code;
  }
}

export function createScanApiClient(baseUrl = ''): ScanApiClient {
  return {
    async createScan(input) {
      const response = await fetch(`${baseUrl}/scans`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      return parseResponse<Scan>(response);
    },

    async uploadSourceImage(scanId, image, capturedAt) {
      const headers: Record<string, string> = { 'content-type': image.type || 'application/octet-stream' };
      if (capturedAt) headers['x-captured-at'] = capturedAt;
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}/images`, {
        method: 'POST',
        headers,
        body: image,
      });
      return parseResponse<{ image: EvidenceImage; scan: Scan }>(response);
    },

    async getScan(scanId) {
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}`);
      return parseResponse<Scan>(response);
    },

    async saveResult(scanId, result) {
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}/result`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(result),
      });
      return parseResponse<{ scan: Scan; result: CanonicalScanResult }>(response);
    },

    async getResult(scanId) {
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}/result`);
      return parseResponse<CanonicalScanResult>(response);
    },

    async listHistory(filters = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
      const response = await fetch(`${baseUrl}/scans${params.toString() ? `?${params}` : ''}`);
      const payload = await parseResponse<{ items: ScanHistoryEntry[] }>(response);
      return payload.items;
    },
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json() as T | ScanApiErrorPayload;
  if (!response.ok) {
    const error = payload as ScanApiErrorPayload;
    throw new ScanApiError(
      response.status,
      error.error?.code || 'API_ERROR',
      error.error?.message || 'scan API request failed',
    );
  }
  return payload as T;
}

/** No compliance result is manufactured here; evaluation is not implemented yet. */
export type ScanApiResult = Scan | CanonicalScanResult;
