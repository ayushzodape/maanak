import assert from 'node:assert/strict';
import test from 'node:test';
import { processImageForUpload } from './image-processor';

test('processImageForUpload falls back gracefully in non-DOM environments', async () => {
  const dummyFile = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });
  const result = await processImageForUpload(dummyFile);

  assert.equal(result, dummyFile);
  assert.equal(result.name, 'test.jpg');
});
