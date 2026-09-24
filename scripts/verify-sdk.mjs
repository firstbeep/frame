import { createRequire } from 'node:module';

// Export verification only: no worker, model downloads, or inference required.
try {
  const sdk = await import('@qvac/sdk');
  const version = createRequire(import.meta.url)('@qvac/sdk/package').version;
  const required = ['loadModel', 'unloadModel', 'completion', 'diffusion', 'textToSpeech'];
  const usedBeyondRequested = ['upscale', 'heartbeat', 'close'];
  let missing = false;
  for (const name of required) {
    const type = typeof sdk[name];
    console.log(`${type === 'function' ? '✓' : '✗'} ${name}: ${type}`);
    missing ||= type !== 'function';
  }
  for (const name of usedBeyondRequested) {
    const type = typeof sdk[name];
    console.log(`${type === 'function' ? '✓' : '✗'} ${name}: ${type}`);
    missing ||= type !== 'function';
  }
  if (missing) throw new Error('Required QVAC SDK exports are missing. Run npm install and retry.');
  if (version !== '0.19.1') throw new Error(`Expected @qvac/sdk v0.19.1, found v${version}. Run npm install.`);
  console.log(`\nAll 5 QVAC SDK functions present (@qvac/sdk v${version}).`);
  console.log('FRAME also uses upscale, heartbeat, and close. completion and textToSpeech are export checks only.');
  console.log('Run npm run doctor for the worker and npm run smoke for real inference.');
} catch (error) {
  console.error(`SDK verification failed: ${error.message}\nInstall dependencies with npm install first.`);
  process.exitCode = 1;
}
