import { createRequire } from 'node:module';

// Export verification only: no worker, model downloads, or inference required.
try {
  const sdk = await import('@qvac/sdk');
  const version = createRequire(import.meta.url)('@qvac/sdk/package').version;
  const required = ['loadModel', 'diffusion', 'upscale', 'unloadModel', 'heartbeat', 'close'];
  let missing = false;
  for (const name of required) {
    const type = typeof sdk[name];
    console.log(`${type === 'function' ? '✓' : '✗'} ${name}: ${type}`);
    missing ||= type !== 'function';
  }
  if (missing) throw new Error('Required QVAC SDK exports are missing. Run npm install and retry.');
  if (version !== '0.19.1') throw new Error(`Expected @qvac/sdk v0.19.1, found v${version}. Run npm install.`);
  console.log(`\nAll ${required.length} SDK functions used by FRAME are present (@qvac/sdk v${version}).`);
  console.log('Run npm run doctor for the worker and npm run smoke for real inference.');
} catch (error) {
  console.error(`SDK verification failed: ${error.message}\nInstall dependencies with npm install first.`);
  process.exitCode = 1;
}
