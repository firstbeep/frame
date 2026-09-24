import { createRequire } from 'node:module';

// Export verification only: no worker, model downloads, or inference required.
// These exports are present even though FRAME uses only the image operations.
try {
  const sdk = await import('@qvac/sdk');
  const version = createRequire(import.meta.url)('@qvac/sdk/package').version;
  const required = ['loadModel', 'unloadModel', 'upscale', 'diffusion', 'close'];
  let missing = false;
  for (const name of required) {
    const type = typeof sdk[name];
    console.log(`${type === 'function' ? '✓' : '✗'} ${name}: ${type}`);
    missing ||= type !== 'function';
  }
  if (missing) throw new Error('Required QVAC SDK exports are missing. Run npm ci and retry.');
  if (version !== '0.19.1') throw new Error(`Expected @qvac/sdk v0.19.1, found v${version}. Run npm ci.`);
  console.log(`\nAll 5 QVAC SDK functions present (@qvac/sdk v${version}).`);
  if (typeof sdk.upscale !== 'function') throw new Error('FRAME also requires the upscale export.');
  console.log('✓ upscale: function (also used by FRAME)');
  console.log('Export checks passed. Run npm run doctor for the worker and npm run smoke for real inference.');
} catch (error) {
  console.error(`SDK verification failed: ${error.message}\nInstall dependencies with npm ci first.`);
  process.exitCode = 1;
}
