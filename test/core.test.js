import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { PNG } from 'pngjs';
import { validateScene, compileScene } from '../src/scene.js';
import { monochrome } from '../src/render.js';
import { describeError } from '../src/errors.js';
import { createStudioServer } from '../src/server.js';
test('scene input rejects unsafe resource sizes and preserves a deterministic shot', () => {
  for (const input of [{prompt:''}, {prompt:'x', steps:100}, {prompt:'x', seed:-1}, {prompt:'x', shot:'__proto__'}, {prompt:'x', format:'huge'}]) assert.throws(() => validateScene(input));
  const scene = validateScene({prompt:'  A stool\n beside a window  ', seed:123});
  assert.equal(scene.seed, 123); assert.match(compileScene(scene), /A stool beside a window, wide establishing shot/);
});
test('PNG finishing preserves size and alpha while producing monochrome pixels', () => {
  const source = new PNG({ width:2, height:1 }); source.data.set([255,0,0,255,0,255,0,128]);
  const result = PNG.sync.read(monochrome(PNG.sync.write(source)));
  assert.equal(result.width, 2); assert.equal(result.data[0],result.data[1]); assert.equal(result.data[1],result.data[2]); assert.equal(result.data[7],128);
});
test('RPC diagnostic retains underlying worker crash details', () => {
  const error = new Error('RPC initialization timed out', {cause:new Error('Missing native DLL')});
  const result = describeError(error); assert.match(result,/Missing native DLL/); assert.match(result,/npm run doctor/); assert.match(result,/not fixed by waiting longer/);
});
test('server binds loopback, rejects foreign origins, and serves no filesystem traversal', async () => {
  const server = createStudioServer();
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base)).status,200);
    const status = await fetch(`${base}/api/status`); assert.equal((await status.json()).sdk,'0.19.1');
    assert.equal((await fetch(`${base}/api/render`,{method:'POST',headers:{Origin:'https://evil.example'}})).status,403);
    assert.equal((await fetch(`${base}/outputs/package.json`)).status,404);
    assert.equal((await fetch(`${base}/api/jobs/nope`)).status,404);
    const foreignHostStatus = await new Promise((resolve,reject) => {
      http.get(base,{headers:{Host:'evil.example:3210'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);
    });
    assert.equal(foreignHostStatus,403);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
