import { CanonicalScanResult, EvidenceImage, Scan, SourceType } from '../domain';

export interface ScanApiClient {
  createScan(input: { productName: string; sourceType: SourceType; ruleVersion: string }): Promise<Scan>;
  uploadSourceImage(scanId: string, image: Blob, capturedAt?: string): Promise<{ image: EvidenceImage; scan: Scan }>;
  getScan(scanId: string): Promise<Scan>;
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
