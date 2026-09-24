# Model provenance

The filenames, byte sizes, and hashes below were verified against `@qvac/inference`'s registry shipped with the `@qvac/sdk@0.19.1` install. `scripts/setup.js` uses fixed URLs and SHA-256 validation; `src/render.js` only loads local files.

| Model | Size | SHA-256 |
| --- | ---: | --- |
| Stable Diffusion 2.1 Q8_0 | 2,322,705,024 bytes | `7b73fa47b4d1401bdf3a0898827fac94bced6633bf64ef7fe55492b6115cc74b` |
| RealESRGAN_x4plus | 67,040,989 bytes | `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1` |

- [SD 2.1 quantized model source](https://huggingface.co/gpustack/stable-diffusion-v2-1-GGUF/tree/12ddc22724f6da35f0b6006e459fae66eaf56931): fixed repository revision. See its model card and upstream Stable Diffusion license (Open RAIL family) for use restrictions.
- [Real-ESRGAN official release](https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.1.0): fixed release asset. See the [upstream project license](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE).

Models are not bundled in Git or covered by FRAME's MIT license. Local generated evidence was produced with these models; no stock photos or cloud-generated substitutes are used.
