import path from 'node:path';
import { stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { configureRuntime, MODEL_DIR, MODELS, OUTPUT_DIR } from './config.js';
import { compileScene, FORMATS } from './scene.js';

export async function assertModels(kind = 'render') {
  for (const model of [MODELS[kind === 'upscale' ? 'upscale' : 'diffusion']]) {
    const found = await stat(path.join(MODEL_DIR, model.file)).catch(() => null);
    if (found?.size !== model.bytes) throw new Error(`Model missing or incomplete: ${model.file}. Run npm run setup while online, then retry.`);
  }
}
export function preserveColorPng(bytes) {
  const buffer = Buffer.from(bytes);
  PNG.sync.read(buffer);
  return buffer; // Preserve QVAC's original RGB channels, without a filter.
}
export async function render(job, emit = console.log) {
  configureRuntime();
  await assertModels(job.kind);
  const sdk = await import('@qvac/sdk');
  let modelId;
  try {
    emit({ phase: 'initializing', message: 'Starting local QVAC worker…' });
    await sdk.heartbeat();
    const isUpscale = job.kind === 'upscale';
    emit({ phase: 'loading', message: `Loading ${isUpscale ? 'Real-ESRGAN' : 'SDXL 1.0'} from disk…` });
    modelId = await sdk.loadModel({
      modelSrc: path.join(MODEL_DIR, MODELS[isUpscale ? 'upscale' : 'diffusion'].file),
      modelType: 'sdcpp-generation',
      modelConfig: isUpscale
        ? { mode: 'upscale', device: process.env.FRAME_DEVICE || 'gpu', upscaler: { tile_size: 128 } }
        : { prediction: 'eps', device: process.env.FRAME_DEVICE || 'gpu', threads: 4, clip_on_cpu: true, vae_tiling: true, flash_attn: true }
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
        negative_prompt: 'black and white, monochrome, grayscale, oversaturated, cartoon, illustration, text, watermark, blurry, distorted, deformed',
        width: FORMATS[scene.format][0], height: FORMATS[scene.format][1],
        steps: scene.steps, cfg_scale: 5.5, sampling_method: 'dpm++2m', scheduler: 'karras', seed: scene.seed
      });
      const progress = (async () => {
        for await (const tick of run.progressStream) emit({ phase: 'diffusion', message: `Diffusion step ${tick.step}/${tick.totalSteps}`, step: tick.step, totalSteps: tick.totalSteps });
      })();
      [buffers, stats] = await Promise.all([run.outputs, run.stats, progress]);
    }
    if (!buffers?.[0]?.length) throw new Error('QVAC returned no image. Check the terminal log.');
    emit({ phase: 'saving', message: 'Saving full-color concept frame…' });
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(path.join(OUTPUT_DIR, `${job.id}.png`), preserveColorPng(buffers[0]));
    const result = { id: job.id, sourceId: job.sourceId, scene: job.scene, kind: job.kind, createdAt: new Date().toISOString(), sdk: '0.19.1', model: isUpscale ? 'RealESRGAN_x4plus' : 'SDXL 1.0 Q4_0', colorMode: 'natural', modelSha256: MODELS[isUpscale ? 'upscale' : 'diffusion'].sha256, compiledPrompt: compileScene(job.scene), stats };
    await writeFile(path.join(OUTPUT_DIR, `${job.id}.json`), JSON.stringify(result, null, 2));
    return result;
  } finally {
    try { if (modelId) await sdk.unloadModel({ modelId, clearStorage: false }); }
    finally { await sdk.close(); }
  }
}
