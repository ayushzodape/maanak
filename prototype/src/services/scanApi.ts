import { CanonicalScanResult, ComplianceResult, EvidenceImage, Scan, SourceType } from '../domain';

export interface ScanHistoryEntry {
  readonly scan: Scan;
  readonly result: CanonicalScanResult;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly role: 'INSPECTOR';
}

export interface ScanApiClient {
  login(username: string, password: string): Promise<AuthenticatedUser>;
  getSession(): Promise<AuthenticatedUser>;
  logout(): Promise<void>;
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

export function createScanApiClient(baseUrl = '', onUnauthorized?: () => void): ScanApiClient {
  return {
    async login(username, password) {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await parseResponse<{ user: AuthenticatedUser }>(response, onUnauthorized);
      return payload.user;
    },

    async getSession() {
      const response = await fetch(`${baseUrl}/auth/session`, { credentials: 'include' });
      const payload = await parseResponse<{ user: AuthenticatedUser }>(response, onUnauthorized);
      return payload.user;
    },

    async logout() {
      const response = await fetch(`${baseUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
      if (!response.ok) await parseResponse<unknown>(response, onUnauthorized);
    },

    async createScan(input) {
      const response = await fetch(`${baseUrl}/scans`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      return parseResponse<Scan>(response, onUnauthorized);
    },

    async uploadSourceImage(scanId, image, capturedAt) {
      const headers: Record<string, string> = { 'content-type': image.type || 'application/octet-stream' };
      if (capturedAt) headers['x-captured-at'] = capturedAt;
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}/images`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: image,
      });
      return parseResponse<{ image: EvidenceImage; scan: Scan }>(response, onUnauthorized);
    },

    async getScan(scanId) {
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}`, { credentials: 'include' });
      return parseResponse<Scan>(response, onUnauthorized);
    },

    async saveResult(scanId, result) {
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}/result`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(result),
      });
      return parseResponse<{ scan: Scan; result: CanonicalScanResult }>(response, onUnauthorized);
    },

    async getResult(scanId) {
      const response = await fetch(`${baseUrl}/scans/${encodeURIComponent(scanId)}/result`, { credentials: 'include' });
      return parseResponse<CanonicalScanResult>(response, onUnauthorized);
    },

    async listHistory(filters = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
      const response = await fetch(`${baseUrl}/scans${params.toString() ? `?${params}` : ''}`, { credentials: 'include' });
      const payload = await parseResponse<{ items: ScanHistoryEntry[] }>(response, onUnauthorized);
      return payload.items;
    },
  };
}

async function parseResponse<T>(response: Response, onUnauthorized?: () => void): Promise<T> {
  const payload = await response.json() as T | ScanApiErrorPayload;
  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.();
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
