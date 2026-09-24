import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { MODELS, MODEL_DIR } from '../src/config.js';

async function checksum(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
await mkdir(MODEL_DIR, { recursive: true });
try {
  for (const model of Object.values(MODELS)) {
    const destination = path.join(MODEL_DIR, model.file);
    if (await stat(destination).catch(() => null)) {
      if (await checksum(destination) === model.sha256) {
        console.log(`Verified cached ${model.file}`);
        continue;
      }
      throw new Error(`${destination} has an incorrect checksum. Move it aside and rerun setup.`);
    }
    const partial = `${destination}.part`;
    let offset = (await stat(partial).catch(() => null))?.size || 0;
    if (offset > model.bytes) { await rm(partial); offset = 0; }
    if (offset < model.bytes) {
      console.log(`Downloading ${model.file} (${(model.bytes / 1e9).toFixed(2)} GB); resumes on retry.`);
      const response = await fetch(model.url, { headers: offset ? { Range: `bytes=${offset}-` } : {}, signal: AbortSignal.timeout(3600000) });
      if (!response.ok) throw new Error(`Download HTTP ${response.status}: ${model.url}`);
      if (response.status !== 206) offset = 0;
      if (response.status === 206 && !response.headers.get('content-range')?.startsWith(`bytes ${offset}-`)) throw new Error('Invalid resume response');
      let received = offset;
      let last = -1;
      const progress = new Transform({ transform(chunk, _, callback) {
        received += chunk.length;
        const percent = Math.floor(received / model.bytes * 100);
        if (percent >= last + 5) { console.log(`${model.file}: ${percent}%`); last = percent; }
        callback(null, chunk);
      } });
      await pipeline(Readable.fromWeb(response.body), progress, createWriteStream(partial, { flags: offset ? 'a' : 'w' }));
    }
    if ((await stat(partial)).size !== model.bytes || await checksum(partial) !== model.sha256) {
      await rm(partial);
      throw new Error(`Checksum/size mismatch for ${model.file}; retry setup.`);
    }
    await rename(partial, destination);
    console.log(`SHA-256 verified: ${model.file}`);
  }
  console.log('Models ready. Rendering now uses local file paths only. Run npm run smoke, then npm start.');
} catch (error) {
  console.error(`Setup failed: ${error.message}\nPartial downloads are kept. Retry npm run setup when connected.`);
  process.exitCode = 1;
}
