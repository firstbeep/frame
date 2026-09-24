import { randomUUID } from 'node:crypto';
import { render } from '../src/render.js';
import { validateScene } from '../src/scene.js';
import { describeError } from '../src/errors.js';
const id = randomUUID();
const scene = validateScene({ prompt: 'A single minimalist metal stool beside a wooden table with dark sunglasses, empty concrete room, a shaft of sunlight through a tall window', steps: 12 });
const watchdog = setTimeout(() => { console.error('Smoke test exceeded 30 minutes. Check device and terminal diagnostics.'); process.exit(1); }, 1800000);
try {
  console.log('REAL INFERENCE TEST: loadModel + diffusion + upscale. No mock output.');
  await render({ id, kind: 'render', scene }, e => console.log(e.message));
  console.log(`PASS diffusion: outputs/${id}.png`);
  const upscaledId = randomUUID();
  await render({ id: upscaledId, sourceId: id, kind: 'upscale', scene }, e => console.log(e.message));
  console.log(`PASS upscale: outputs/${upscaledId}.png`);
} catch (error) { console.error(describeError(error)); process.exitCode = 1; }
finally { clearTimeout(watchdog); }
