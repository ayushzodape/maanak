import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createEvidenceImage } from '../domain';
import { GeminiExtractionAdapter } from '../extraction/gemini-extraction-adapter';

async function runRealImageTest() {
  console.log('--- Real Image Processing & Extraction Verification ---');

  const imagePath = '/home/ayush/.gemini/antigravity/brain/f663c4d2-0cbc-4490-826d-bda8ad1760bb/.user_uploaded/media_1788892896120.jpg';
  if (!existsSync(imagePath)) {
    console.log('Sample image not found at', imagePath);
    return;
  }

  const imageBytes = readFileSync(imagePath);
  console.log(`Loaded real sample image (${(imageBytes.length / 1024).toFixed(1)} KB)`);

  const evidenceImage = createEvidenceImage({
    id: 'test_real_img_1',
    storageKey: 'scans/test_scan_1/images/img_1.png',
    mimeType: 'image/png',
    byteSize: imageBytes.length,
    sha256: 'a1b2c3d4e5f6',
    capturedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    console.log('GEMINI_API_KEY is not set in environment. Skipping live API call (Adapter configuration check passed).');
    const adapter = new GeminiExtractionAdapter({
      apiKey: 'dummy_test_key',
      loadImageBytes: () => imageBytes,
    });
    assert.ok(adapter);
    console.log('✅ GeminiExtractionAdapter instantiates correctly with image loader.');
    return;
  }

  console.log('GEMINI_API_KEY found! Testing live extraction with gemini-2.5-flash model...');
  const adapter = new GeminiExtractionAdapter({
    apiKey,
    loadImageBytes: () => imageBytes,
  });

  const observations = await adapter.extract(evidenceImage);
  console.log(`Received ${observations.length} observations from Gemini 2.5 Flash:`);
  for (const obs of observations) {
    console.log(`  - [${obs.status}] ${obs.field}: ${JSON.stringify(obs.value)} (confidence: ${obs.confidence})`);
    if (obs.evidence?.boundingBox) {
      console.log(`    Bounding Box: x=${obs.evidence.boundingBox.x}, y=${obs.evidence.boundingBox.y}, w=${obs.evidence.boundingBox.width}, h=${obs.evidence.boundingBox.height}`);
    }
  }
}

runRealImageTest().catch((err) => {
  console.error('Real image test error:', err);
  if (err.cause) console.error('Error cause:', err.cause);
});
