import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ensureModel } from '../src/models.js';

// Exercise real HTTP and filesystem behavior with tiny model fixtures.
for (const mode of ['fresh', 'resume', 'range-ignored', 'corrupt']) {
  test(`model setup: ${mode} download is verified before use`, async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'frame-model-test-'));
    const bytes = Buffer.from('a complete model fixture');
    const requests = [];
    const server = http.createServer((req, res) => {
      requests.push(req.headers.range);
      if (mode === 'resume') {
        res.writeHead(206, { 'Content-Range': `bytes 5-${bytes.length - 1}/${bytes.length}` });
        res.end(bytes.subarray(5));
      } else res.end(mode === 'corrupt' ? Buffer.alloc(bytes.length) : bytes);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const model = {
      file: 'fixture.bin', bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      url: `http://127.0.0.1:${server.address().port}/model`
    };
    const options = { log: () => {}, attempts: 1 };
    try {
      if (mode === 'resume' || mode === 'range-ignored') await writeFile(path.join(directory, 'fixture.bin.part'), bytes.subarray(0, 5));
      if (mode === 'corrupt') {
        await assert.rejects(ensureModel(model, directory, options), /Checksum\/size mismatch/);
        assert.equal(await stat(path.join(directory, model.file)).catch(() => null), null);
      } else {
        await ensureModel(model, directory, options);
        assert.deepEqual(await readFile(path.join(directory, model.file)), bytes);
        assert.equal(requests[0], mode === 'fresh' ? undefined : 'bytes=5-');
        // An unreachable URL proves a verified cache works offline.
        await ensureModel({ ...model, url: 'http://127.0.0.1:1/unreachable' }, directory, options);
        assert.equal(requests.length, 1);
        await writeFile(path.join(directory, model.file), Buffer.alloc(bytes.length));
        await assert.rejects(ensureModel(model, directory, options), /incorrect checksum/);
        assert.equal(requests.length, 1, 'A damaged cache must not silently fetch or be accepted');
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
      assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
      assert.ok(path.basename(directory).startsWith('frame-model-test-'));
      await rm(directory, { recursive: true, force: true });
    }
  });
}
