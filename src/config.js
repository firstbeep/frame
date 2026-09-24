import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MODEL_DIR = path.join(ROOT, '.cache', 'models');
export const OUTPUT_DIR = path.join(ROOT, 'outputs');
export const MODELS = {
  diffusion: {
    file: 'stable-diffusion-v2-1-Q8_0.gguf',
    url: 'https://huggingface.co/gpustack/stable-diffusion-v2-1-GGUF/resolve/12ddc22724f6da35f0b6006e459fae66eaf56931/stable-diffusion-v2-1-Q8_0.gguf',
    bytes: 2322705024,
    sha256: '7b73fa47b4d1401bdf3a0898827fac94bced6633bf64ef7fe55492b6115cc74b'
  },
  upscale: {
    file: 'RealESRGAN_x4plus.pth',
    url: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
    bytes: 67040989,
    sha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1'
  }
};
export function configureRuntime() {
  process.env.QVAC_CONFIG_PATH ||= path.join(ROOT, 'qvac.config.json');
  process.env.QVAC_WORKER_PATH ||= path.join(ROOT, 'qvac', 'worker.entry.mjs');
  process.env.QVAC_RPC_INIT_TIMEOUT_MS ||= '120000';
}
