import { createApp } from './app';
import { FileScanRepository } from './repository';
import { join } from 'node:path';

const port = Number(process.env.PORT || 3001);
const dataDirectory = process.env.MAANAK_DATA_DIR || join(process.cwd(), '.maanak-data');
createApp(new FileScanRepository(dataDirectory)).listen(port, '0.0.0.0', () => {
  console.log(`Maanak scan API listening on port ${port}`);
});
