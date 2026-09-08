import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canSubmitScan,
  initialScanEntryState,
  ScanFlowTransitionError,
  transitionScanEntry,
  validateImageFile,
} from './scan-flow';

test('requires source type, product name, and image before submission', () => {
  let state = initialScanEntryState;
  assert.equal(canSubmitScan(state), false);
  state = transitionScanEntry(state, { type: 'SELECT_SOURCE', sourceType: 'PHYSICAL_PHOTO' });
  state = transitionScanEntry(state, { type: 'SET_PRODUCT_NAME', productName: 'Example product' });
  assert.equal(canSubmitScan(state), false);
  state = transitionScanEntry(state, { type: 'IMAGE_SELECTED' });
  assert.equal(canSubmitScan(state), true);
});

test('validates supported image types and size', () => {
  assert.equal(validateImageFile({ type: 'image/jpeg', size: 100 }), null);
  assert.match(validateImageFile({ type: 'text/plain', size: 100 }) || '', /valid product image/);
  assert.match(validateImageFile({ type: 'image/png', size: 0 }) || '', /empty/);
  assert.match(validateImageFile({ type: 'image/png', size: 30 * 1024 * 1024 + 1 }) || '', /30 MB/);
});

test('supports upload failure and retry', () => {
  let state = transitionScanEntry(initialScanEntryState, { type: 'SELECT_SOURCE', sourceType: 'ECOMMERCE_LISTING' });
  state = transitionScanEntry(state, { type: 'SET_PRODUCT_NAME', productName: 'Listing image' });
  state = transitionScanEntry(state, { type: 'IMAGE_SELECTED' });
  state = transitionScanEntry(state, { type: 'UPLOAD_STARTED' });
  state = transitionScanEntry(state, { type: 'UPLOAD_FAILED', message: 'Network unavailable' });
  assert.equal(state.status, 'ERROR');
  assert.equal(state.errorMessage, 'Network unavailable');
  state = transitionScanEntry(state, { type: 'RETRY' });
  assert.equal(state.status, 'IDLE');
});

test('moves a successful upload to processing without creating a result', () => {
  let state = transitionScanEntry(initialScanEntryState, { type: 'SELECT_SOURCE', sourceType: 'PHYSICAL_PHOTO' });
  state = transitionScanEntry(state, { type: 'SET_PRODUCT_NAME', productName: 'Physical product' });
  state = transitionScanEntry(state, { type: 'IMAGE_SELECTED' });
  state = transitionScanEntry(state, { type: 'UPLOAD_STARTED' });
  state = transitionScanEntry(state, { type: 'UPLOAD_SUCCEEDED', scanId: 'scan_123' });
  assert.equal(state.status, 'ANALYZING');
  assert.equal(state.scanId, 'scan_123');
});

test('rejects invalid state transitions', () => {
  assert.throws(
    () => transitionScanEntry(initialScanEntryState, { type: 'UPLOAD_SUCCEEDED', scanId: 'scan_123' }),
    ScanFlowTransitionError,
  );
  assert.throws(
    () => transitionScanEntry(initialScanEntryState, { type: 'UPLOAD_STARTED' }),
    /required before upload/,
  );
});
