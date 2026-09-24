import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { PNG } from 'pngjs';
import { validateScene, compileScene } from '../src/scene.js';
import { preserveColorPng } from '../src/render.js';
import { buildBoard } from '../public/board.js';
import { describeError } from '../src/errors.js';
import { createStudioServer } from '../src/server.js';
test('scene input rejects unsafe resource sizes and preserves a deterministic shot', () => {
  for (const input of [{prompt:''}, {prompt:'x', steps:100}, {prompt:'x', seed:-1}, {prompt:'x', shot:'__proto__'}, {prompt:'x', format:'huge'}]) assert.throws(() => validateScene(input));
  const scene = validateScene({prompt:'  A stool\n beside a window  ', seed:123});
  assert.equal(scene.seed, 123); assert.match(compileScene(scene), /A stool beside a window, medium photograph/);
  assert.match(compileScene(scene),/natural daylight/); assert.doesNotMatch(compileScene(scene),/black and white|monochrome/);
});
test('PNG export preserves every RGB and alpha byte without a monochrome filter', () => {
  const source = new PNG({ width:2, height:1 }); source.data.set([255,0,0,255,0,255,0,128]);
  const original = PNG.sync.write(source);
  const output = preserveColorPng(original);
  assert.deepEqual(output, original);
  const result = PNG.sync.read(output);
  assert.equal(result.width, 2); assert.deepEqual(result.data,source.data);
});
test('portable crew board escapes descriptions and includes embedded images and notes', () => {
  const html = buildBoard('<script>alert(1)</script>',[{id:'example',sdk:'0.19.1',scene:{title:'A & B',prompt:'<img onerror="bad">',notes:'Window left\nBounce right'},imageData:'data:image/png;base64,aGVsbG8='}]);
  assert.doesNotMatch(html,/<script>|<img onerror=/); assert.match(html,/A &amp; B/); assert.match(html,/Window left\nBounce right/); assert.match(html,/data:image\/png;base64/);
  assert.throws(()=>buildBoard('test',[{imageData:'https://external.example/image.png'}]));
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
