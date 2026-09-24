import http from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { fork, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, OUTPUT_DIR } from './config.js';
import { assertModels } from './render.js';
import { validateScene } from './scene.js';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
async function body(req) {
  let data = '';
  for await (const chunk of req) { data += chunk; if (data.length > 8192) throw new Error('Request too large.'); }
  return JSON.parse(data || '{}');
}
export function createStudioServer() {
  let active = null;
  let worker = null;
  let timer = null;
  const jobs = new Map();
  const terminate = () => {
    if (!worker) return;
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(worker.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else { try { process.kill(-worker.pid, 'SIGKILL'); } catch {} }
  };
  function launch(job) {
    active = job.id;
    jobs.set(job.id, { ...job, status: 'running', phase: 'initializing', message: 'Starting local worker…', logs: [] });
    while (jobs.size > 30) jobs.delete(jobs.keys().next().value);
    const child = fork(path.join(ROOT, 'src', 'runner.js'), [], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true, detached: process.platform !== 'win32' });
    worker = child;
    const state = jobs.get(job.id);
    const log = chunk => { const line = chunk.toString(); process.stdout.write(line); state.logs.push(line.slice(-2000)); state.logs = state.logs.slice(-30); };
    child.stdout.on('data', log); child.stderr.on('data', log);
    child.on('message', event => {
      if (state.status !== 'running') return;
      if (event.type === 'progress') Object.assign(state, event);
      else if (event.type === 'complete') Object.assign(state, { status: 'complete', message: 'Panel ready', result: event.result });
      else if (event.type === 'failed') Object.assign(state, { status: 'failed', message: event.message });
    });
    child.on('error', error => Object.assign(state, { status: 'failed', message: error.message }));
    child.on('close', code => {
      if (state.status === 'running') Object.assign(state, { status: 'failed', message: `Worker exited (${code}). Run npm run doctor and inspect the terminal.` });
      clearTimeout(timer); timer = null; worker = null; active = null;
    });
    timer = setTimeout(() => { Object.assign(state, { status: 'failed', message: 'Render exceeded 30 minutes. Check GPU drivers; try fewer steps or CPU mode.' }); terminate(); }, 1800000);
    child.send(job);
    return state;
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
    try {
      const host = req.headers.host || '';
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return json(res, 403, { error: 'Local requests only.' });
      if (req.headers.origin && req.headers.origin !== `http://${host}`) return json(res, 403, { error: 'Cross-origin requests are blocked.' });
      const url = new URL(req.url, `http://${host}`);
      if (req.method === 'GET' && url.pathname === '/api/status') {
        let modelError = null; try { await assertModels(); } catch (e) { modelError = e.message; }
        return json(res, 200, { sdk: '0.19.1', modelsReady: !modelError, modelError, active });
      }
      if (req.method === 'GET' && url.pathname === '/api/panels') {
        await mkdir(OUTPUT_DIR, { recursive: true });
        const files = (await readdir(OUTPUT_DIR)).filter(f => ID.test(f.replace(/\.json$/, '')) && f.endsWith('.json'));
        const panels = (await Promise.all(files.map(f => readFile(path.join(OUTPUT_DIR, f), 'utf8').then(JSON.parse).catch(() => null)))).filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return json(res, 200, panels);
      }
      if (req.method === 'GET' && url.pathname.startsWith('/api/jobs/')) {
        const job = jobs.get(url.pathname.split('/').pop());
        return json(res, job ? 200 : 404, job || { error: 'Job not found. Check the storyboard for completed panels.' });
      }
      if (req.method === 'POST' && ['/api/render', '/api/upscale'].includes(url.pathname)) {
        if (active) return json(res, 409, { error: 'A render is already running. Wait or stop it first.' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'JSON required.' });
        const input = await body(req);
        await assertModels();
        let scene;
        if (url.pathname === '/api/upscale') {
          if (!ID.test(input.sourceId)) throw new Error('Invalid panel ID.');
          const source = JSON.parse(await readFile(path.join(OUTPUT_DIR, `${input.sourceId}.json`), 'utf8'));
          if (source.kind !== 'render') throw new Error('Select an original panel; repeated 4× upscales are disabled.');
          scene = validateScene(source.scene);
        } else scene = validateScene(input);
        return json(res, 202, launch({ id: randomUUID(), kind: url.pathname === '/api/upscale' ? 'upscale' : 'render', sourceId: input.sourceId, scene }));
      }
      if (req.method === 'POST' && url.pathname === '/api/cancel') {
        if (active) { Object.assign(jobs.get(active), { status: 'cancelled', message: 'Render stopped. Completed panels are saved.' }); terminate(); }
        return json(res, 200, { ok: true });
      }
      if (req.method === 'GET' && url.pathname.startsWith('/outputs/')) {
        const name = url.pathname.slice('/outputs/'.length);
        if (!/\.(png|json)$/.test(name) || !ID.test(name.replace(/\.(png|json)$/, ''))) return json(res, 404, { error: 'Not found' });
        const data = await readFile(path.join(OUTPUT_DIR, name));
        res.writeHead(200, { 'Content-Type': name.endsWith('.png') ? 'image/png' : 'application/json', 'Cache-Control': 'no-store' }); res.end(data); return;
      }
      const assets = { '/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css' };
      if (req.method === 'GET' && Object.hasOwn(assets, url.pathname)) {
        const file = assets[url.pathname];
        const data = await readFile(path.join(ROOT, 'public', file));
        res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html', 'Cache-Control': 'no-cache' }); res.end(data); return;
      }
      json(res, 404, { error: 'Not found' });
    } catch (error) { json(res, error.code === 'ENOENT' ? 404 : 400, { error: error.message }); }
  });
  server.stopWorker = terminate;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3210);
  const server = createStudioServer();
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${port} is busy. Stop the other instance or set PORT=3211.` : e.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`FRAME · Cinematic Pre-Viz & Storyboard Studio\nOpen http://127.0.0.1:${port}\nAll inference runs locally. Ctrl+C to stop.`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.stopWorker(); server.close(); setTimeout(() => process.exit(0), 1500).unref(); });
}
