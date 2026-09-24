import os from 'node:os';
import { createRequire } from 'node:module';
import { configureRuntime } from '../src/config.js';
import { describeError } from '../src/errors.js';
configureRuntime();
console.log(`FRAME diagnostics | ${process.platform}/${process.arch} | Node ${process.version}`);
console.log(`RAM: ${(os.totalmem() / 2 ** 30).toFixed(1)} GiB | SDK: ${createRequire(import.meta.url)('@qvac/sdk/package').version}`);
console.log(`Worker: ${process.env.QVAC_WORKER_PATH}\nRPC startup allowance: ${process.env.QVAC_RPC_INIT_TIMEOUT_MS} ms`);
const watchdog = setTimeout(() => { console.error('Worker diagnostic exceeded startup allowance. Check native runtime dependencies.'); process.exit(1); }, Number(process.env.QVAC_RPC_INIT_TIMEOUT_MS) + 15000);
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
