import path from 'node:path';
import { stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { configureRuntime, MODEL_DIR, MODELS, OUTPUT_DIR } from './config.js';
import { compileScene } from './scene.js';

export async function assertModels() {
  for (const model of Object.values(MODELS)) {
    const found = await stat(path.join(MODEL_DIR, model.file)).catch(() => null);
    if (found?.size !== model.bytes) throw new Error(`Model missing or incomplete: ${model.file}. Run npm run setup while online, then retry.`);
  }
}
export function monochrome(bytes) {
  const png = PNG.sync.read(Buffer.from(bytes));
  for (let i = 0; i < png.data.length; i += 4) {
    const gray = Math.round(.2126 * png.data[i] + .7152 * png.data[i + 1] + .0722 * png.data[i + 2]);
    png.data[i] = png.data[i + 1] = png.data[i + 2] = gray;
  }
  return PNG.sync.write(png);
}
export async function render(job, emit = console.log) {
  configureRuntime();
  await assertModels();
  const sdk = await import('@qvac/sdk');
  let modelId;
  try {
    emit({ phase: 'initializing', message: 'Starting local QVAC worker…' });
    await sdk.heartbeat();
    const isUpscale = job.kind === 'upscale';
    emit({ phase: 'loading', message: `Loading ${isUpscale ? 'Real-ESRGAN' : 'Stable Diffusion 2.1'} from disk…` });
    modelId = await sdk.loadModel({
      modelSrc: path.join(MODEL_DIR, MODELS[isUpscale ? 'upscale' : 'diffusion'].file),
      modelType: 'sdcpp-generation',
      modelConfig: isUpscale
        ? { mode: 'upscale', device: process.env.FRAME_DEVICE || 'gpu', upscaler: { tile_size: 128 } }
        : { prediction: 'v', device: process.env.FRAME_DEVICE || 'gpu', threads: 4 }
    });
    let buffers;
    let stats;
    if (isUpscale) {
      emit({ phase: 'upscaling', message: 'Local ESRGAN 4× pass; this can take several minutes…' });
      const run = sdk.upscale({ modelId, image: new Uint8Array(await readFile(path.join(OUTPUT_DIR, `${job.sourceId}.png`))), repeats: 1 });
      [buffers, stats] = await Promise.all([run.outputs, run.stats]);
    } else {
      const scene = job.scene;
      const run = sdk.diffusion({
        modelId, prompt: compileScene(scene),
        negative_prompt: 'color, oversaturated, cartoon, illustration, drawing, text, watermark, low quality, blurry, distorted objects',
        width: scene.format === 'wide' ? 768 : 512, height: scene.format === 'wide' ? 448 : 512,
        steps: scene.steps, cfg_scale: 7, seed: scene.seed
      });
      const progress = (async () => {
        for await (const tick of run.progressStream) emit({ phase: 'diffusion', message: `Diffusion step ${tick.step}/${tick.totalSteps}`, step: tick.step, totalSteps: tick.totalSteps });
      })();
      [buffers, stats] = await Promise.all([run.outputs, run.stats, progress]);
    }
    if (!buffers?.[0]?.length) throw new Error('QVAC returned no image. Check the terminal log.');
    emit({ phase: 'saving', message: 'Developing monochrome panel…' });
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(path.join(OUTPUT_DIR, `${job.id}.png`), monochrome(buffers[0]));
    const result = { id: job.id, sourceId: job.sourceId, scene: job.scene, kind: job.kind, createdAt: new Date().toISOString(), sdk: '0.19.1', compiledPrompt: compileScene(job.scene), stats };
    await writeFile(path.join(OUTPUT_DIR, `${job.id}.json`), JSON.stringify(result, null, 2));
    return result;
  } finally {
    try { if (modelId) await sdk.unloadModel({ modelId, clearStorage: false }); }
    finally { await sdk.close(); }
  }
}
