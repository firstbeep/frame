import os from 'node:os';
import { createRequire } from 'node:module';
import { configureRuntime, ROOT } from '../src/config.js';
import { describeError } from '../src/errors.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
configureRuntime();
console.log(`FRAME diagnostics | ${process.platform}/${process.arch} | Node ${process.version}`);
console.log(`RAM: ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB | SDK: ${createRequire(import.meta.url)('@qvac/sdk/package').version}`);
const configured = JSON.parse(readFileSync(path.join(ROOT, 'qvac.config.json'),'utf8')).rpcInitTimeoutMs;
const timeout = Number(process.env.QVAC_RPC_INIT_TIMEOUT_MS || configured || 30000);
console.log(`Worker: ${process.env.QVAC_WORKER_PATH}\nRPC startup allowance: ${timeout} ms`);
const watchdog = setTimeout(() => { console.error('Worker diagnostic exceeded startup allowance. Check native runtime dependencies.'); process.exit(1); }, timeout + 15000);
let sdk;
try {
  sdk = await import('@qvac/sdk');
  for (const key of ['loadModel', 'diffusion', 'upscale', 'unloadModel', 'heartbeat', 'close']) {
    if (typeof sdk[key] !== 'function') throw new Error(`Missing SDK function: ${key}`);
  }
  console.log(await sdk.heartbeat());
  console.log('PASS: real QVAC worker handshake and diffusion addon import. Model rendering is checked by npm run smoke.');
} catch (error) {
  console.error(describeError(error));
  process.exitCode = 1;
} finally {
  await sdk?.close();
  clearTimeout(watchdog);
}
