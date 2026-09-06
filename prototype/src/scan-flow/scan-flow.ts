import { SourceType } from '../domain';

export const MAX_SCAN_IMAGE_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_SCAN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ScanImageType = (typeof SUPPORTED_SCAN_IMAGE_TYPES)[number];

export type ScanEntryStatus =
  | 'IDLE'
  | 'CAPTURING'
  | 'UPLOADING'
  | 'ANALYZING'
  | 'EXTRACTING'
  | 'EVALUATING'
  | 'GENERATING_REPORT'
  | 'COMPLETE'
  | 'ERROR'
  | 'UNCERTAIN'
  | 'NOT_MEASURABLE';

export interface ScanEntryState {
  readonly status: ScanEntryStatus;
  readonly sourceType: SourceType | null;
  readonly productName: string;
  readonly imageSelected: boolean;
  readonly scanId: string | null;
  readonly errorMessage: string | null;
}

export type ScanEntryEvent =
  | { type: 'SELECT_SOURCE'; sourceType: SourceType }
  | { type: 'SET_PRODUCT_NAME'; productName: string }
  | { type: 'IMAGE_SELECTED' }
  | { type: 'UPLOAD_STARTED' }
  | { type: 'UPLOAD_SUCCEEDED'; scanId: string }
  | { type: 'UPLOAD_FAILED'; message: string }
  | { type: 'RETRY' }
  | { type: 'CANCEL' };

export class ScanFlowTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanFlowTransitionError';
  }
}

export const initialScanEntryState: ScanEntryState = {
  status: 'IDLE',
  sourceType: null,
  productName: '',
  imageSelected: false,
  scanId: null,
  errorMessage: null,
};

export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!SUPPORTED_SCAN_IMAGE_TYPES.includes(file.type as ScanImageType)) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }
  if (file.size <= 0) {
    return 'The selected image is empty.';
  }
  if (file.size > MAX_SCAN_IMAGE_BYTES) {
    return 'The selected image must be 10 MB or smaller.';
  }
  return null;
}

export function canSubmitScan(state: ScanEntryState): boolean {
  return state.status === 'IDLE' &&
    state.sourceType !== null &&
    state.productName.trim().length > 0 &&
    state.imageSelected;
}

export function transitionScanEntry(state: ScanEntryState, event: ScanEntryEvent): ScanEntryState {
  switch (event.type) {
    case 'SELECT_SOURCE':
      if (state.status !== 'IDLE' && state.status !== 'ERROR') {
        throw invalidTransition(state.status, event.type);
      }
      return { ...state, sourceType: event.sourceType, errorMessage: null };
    case 'SET_PRODUCT_NAME':
      if (state.status !== 'IDLE' && state.status !== 'ERROR') {
        throw invalidTransition(state.status, event.type);
      }
      return { ...state, productName: event.productName, errorMessage: null };
    case 'IMAGE_SELECTED':
      if (state.status !== 'IDLE' && state.status !== 'ERROR') {
        throw invalidTransition(state.status, event.type);
      }
      return { ...state, imageSelected: true, errorMessage: null };
    case 'UPLOAD_STARTED':
      if (!canSubmitScan(state) && !(state.status === 'ERROR' && state.imageSelected && state.sourceType)) {
        throw new ScanFlowTransitionError('source type, product name, and a valid image are required before upload');
      }
      return { ...state, status: 'UPLOADING', errorMessage: null };
    case 'UPLOAD_SUCCEEDED':
      if (state.status !== 'UPLOADING') {
        throw invalidTransition(state.status, event.type);
      }
      if (!event.scanId.trim()) {
        throw new ScanFlowTransitionError('uploaded scan must have an ID');
      }
      return { ...state, status: 'ANALYZING', scanId: event.scanId, errorMessage: null };
    case 'UPLOAD_FAILED':
      if (state.status !== 'UPLOADING') {
        throw invalidTransition(state.status, event.type);
      }
      return { ...state, status: 'ERROR', errorMessage: event.message };
    case 'RETRY':
      if (state.status !== 'ERROR') {
        throw invalidTransition(state.status, event.type);
      }
      return { ...state, status: 'IDLE', errorMessage: null };
    case 'CANCEL':
      if (state.status === 'UPLOADING' || state.status === 'ANALYZING' || state.status === 'EXTRACTING' || state.status === 'EVALUATING') {
        throw invalidTransition(state.status, event.type);
      }
      return initialScanEntryState;
  }
}

function invalidTransition(status: ScanEntryStatus, event: ScanEntryEvent['type']): ScanFlowTransitionError {
  return new ScanFlowTransitionError(`cannot apply ${event} while scan is ${status}`);
}
