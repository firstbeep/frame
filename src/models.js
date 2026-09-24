import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

async function checksum(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

// Verified files never need a network request; partial downloads are resumable.
export async function ensureModel(model, directory, { log = console.log, attempts = 4, retryDelayMs = 2000 } = {}) {
  await mkdir(directory, { recursive: true });
  const destination = path.join(directory, model.file);
  if (await stat(destination).catch(() => null)) {
    if (await checksum(destination) !== model.sha256) {
      throw new Error(`${destination} has an incorrect checksum. Move it aside and rerun npm run setup.`);
    }
    log(`Verified cached ${model.file}`);
    return;
  }
  const partial = `${destination}.part`;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      let offset = (await stat(partial).catch(() => null))?.size || 0;
      if (offset > model.bytes) { await rm(partial); offset = 0; }
      if (offset < model.bytes) {
        log(`Downloading ${model.file} (${(model.bytes / 1e9).toFixed(2)} GB); resumes on retry.`);
        const response = await fetch(model.url, {
          headers: offset ? { Range: `bytes=${offset}-` } : {},
          signal: AbortSignal.timeout(3600000)
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`Download HTTP ${response.status}: ${model.url}`);
        }
        if (response.status !== 206) offset = 0;
        if (response.status === 206 && !response.headers.get('content-range')?.startsWith(`bytes ${offset}-`)) {
          await response.body?.cancel();
          throw new Error('Invalid resume response');
        }
        let received = offset;
        let last = -1;
        const progress = new Transform({ transform(chunk, _, callback) {
          received += chunk.length;
          const percent = Math.floor(received / model.bytes * 100);
          if (percent >= last + 5) { log(`${model.file}: ${percent}%`); last = percent; }
          callback(null, chunk);
        } });
        await pipeline(Readable.fromWeb(response.body), progress, createWriteStream(partial, { flags: offset ? 'a' : 'w' }));
      }
      if ((await stat(partial)).size !== model.bytes || await checksum(partial) !== model.sha256) {
        await rm(partial);
        throw new Error(`Checksum/size mismatch for ${model.file}; retry setup.`);
      }
      await rename(partial, destination);
      log(`SHA-256 verified: ${model.file}`);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      log(`Download/check attempt ${attempt} failed: ${error.message}. Resuming in ${attempt * retryDelayMs / 1000}s…`);
      await new Promise(resolve => setTimeout(resolve, attempt * retryDelayMs));
    }
  }
}
