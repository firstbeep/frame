import { MODELS, MODEL_DIR } from '../src/config.js';
import { ensureModel } from '../src/models.js';

try {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--render-only')) throw new Error('Usage: npm run setup [-- --render-only]');
  const renderOnly = args.includes('--render-only');
  console.log(renderOnly
    ? 'Preparing FRAME: checking SDXL (first start downloads 3.94 GB).'
    : 'Preparing SDXL and the optional 4x upscaler for offline use.');
  for (const model of renderOnly ? [MODELS.diffusion] : Object.values(MODELS)) {
    await ensureModel(model, MODEL_DIR);
  }
  console.log(renderOnly
    ? 'SDXL file verified. Starting the studio; the model loads when you render.\nFor optional 4x upscaling, run npm run setup once.'
    : 'Both models verified. Run npm start, or npm run smoke to test real inference.');
} catch (error) {
  console.error(`Setup failed: ${error.message}\nPartial downloads are kept. Retry npm start or npm run setup when connected.`);
  process.exitCode = 1;
}
