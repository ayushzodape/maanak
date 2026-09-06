import 'dotenv/config';
import { createApp } from './app';
import { FileScanRepository } from './repository';
import { join } from 'node:path';
import { GeminiExtractionAdapter } from '../src/extraction';

const port = Number(process.env.PORT || 3001);
const dataDirectory = process.env.MAANAK_DATA_DIR || join(process.cwd(), '.maanak-data');
const repository = new FileScanRepository(dataDirectory);
const liveExtractionAdapter = new GeminiExtractionAdapter({
  apiKey: process.env.GEMINI_API_KEY,
  loadImageBytes: (image) => {
    const scanId = image.storageKey.split('/')[1];
    return scanId ? repository.getImageBytes(scanId, image.id) : undefined;
  },
});
createApp(repository, undefined, liveExtractionAdapter).listen(port, '0.0.0.0', () => {
  console.log(`Maanak scan API listening on port ${port}`);
});
