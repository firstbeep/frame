import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MODEL_DIR = path.join(ROOT, '.cache', 'models');
export const OUTPUT_DIR = path.join(ROOT, 'outputs');
export const MODELS = {
  diffusion: {
    file: 'stable-diffusion-xl-base-1.0-Q4_0.gguf',
    url: 'https://huggingface.co/gpustack/stable-diffusion-xl-base-1.0-GGUF/resolve/5f58340891db3ef66a79758c2dcddad92b1de169/stable-diffusion-xl-base-1.0-Q4_0.gguf',
    bytes: 3940010720,
    sha256: '4ab9818c9b3428eca96834c51fe294885608480991463f55bd9be53c822567c3'
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
  // Let qvac.config.json control the handshake unless the user explicitly overrides it.
}
