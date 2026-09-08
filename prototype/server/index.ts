import 'dotenv/config';
import { createApp } from './app';
import { FileScanRepository } from './repository';
import { join } from 'node:path';
import { ExtractionAdapter, GeminiExtractionAdapter, GroqExtractionAdapter, UnavailableExtractionAdapter } from '../src/extraction';
import { CascadingExtractionAdapter } from '../src/extraction/cascading-extraction-adapter';

const port = Number(process.env.PORT || 3001);
const dataDirectory = process.env.MAANAK_DATA_DIR || join(process.cwd(), '.maanak-data');
const repository = new FileScanRepository(dataDirectory);

function loadImageBytes(image: { storageKey: string; id: string }) {
  const scanId = image.storageKey.split('/')[1];
  return scanId ? repository.getImageBytes(scanId, image.id) : undefined;
}

function buildLiveExtractionAdapter(): ExtractionAdapter {
  const adapters: ExtractionAdapter[] = [];

  if (process.env.GEMINI_API_KEY) {
    adapters.push(new GeminiExtractionAdapter({
      apiKey: process.env.GEMINI_API_KEY,
      loadImageBytes,
    }));
  }
  if (process.env.GROQ_API_KEY) {
    adapters.push(new GroqExtractionAdapter(
      process.env.GROQ_API_KEY,
      loadImageBytes,
      process.env.GROQ_VISION_MODEL,
    ));
  }

  if (adapters.length === 0) return new UnavailableExtractionAdapter();
  if (adapters.length === 1) return adapters[0];
  return new CascadingExtractionAdapter(adapters);
}

const liveExtractionAdapter = buildLiveExtractionAdapter();
const server = createApp(repository, undefined, liveExtractionAdapter).listen(port, '0.0.0.0', () => {
  console.log(`Maanak scan API listening on port ${port}`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close((error) => {
    if (error) {
      console.error('Error during server close:', error);
      process.exit(1);
    }
    console.log('Server closed.');
    process.exit(0);
  });
  // Force shutdown after 5 seconds if connections don't close
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
