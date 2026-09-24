# Model provenance

The filenames, sizes and SHA-256 hashes below match the model registry shipped with `@qvac/sdk@0.19.1`. `scripts/setup.js` pins URLs and verifies each download. `src/render.js` loads local paths.

| Model | Size | SHA-256 |
| --- | ---: | --- |
| Stable Diffusion XL 1.0 Q4_0 | 3,940,010,720 bytes | `4ab9818c9b3428eca96834c51fe294885608480991463f55bd9be53c822567c3` |
| RealESRGAN_x4plus | 67,040,989 bytes | `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1` |

- [SDXL 1.0 quantized source and model card](https://huggingface.co/gpustack/stable-diffusion-xl-base-1.0-GGUF) — Open RAIL++-M license. Its model card notes limitations with text, people, and complex spatial relationships.
- [Real-ESRGAN official release](https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.1.0) and [license](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE).

Model weights are downloaded at setup and excluded from Git. FRAME's MIT license covers app code, not model weights. Existing saved SD 2.1 frames remain accessible as legacy frames; new inference uses SDXL.
