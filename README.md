# FRAME — local shoot planner

FRAME helps a small production team agree on a visual direction before a product or location shoot. Write a brief for a specific shot, choose light and camera distance, then render a **natural-color concept image on your own computer**. Select useful frames and export a self-contained crew board with the image, props, lighting notes, and action for each shot. The board opens offline and can be printed or saved as PDF from a browser.

![FRAME running with a real SDXL color frame](docs/evidence/studio.png)

These are planning references. A generated image may get product details, text, people, scale, or physical layout wrong; confirm them on set.

## Features

- Three practical starting briefs: skincare product hero, café location, and outdoor brand film.
- SDXL 1.0 Q4_0 concept rendering in natural color, with camera, light, aspect ratio, steps, and reproducible seed controls.
- Real diffusion progress and clear worker errors, including RPC startup problems.
- Original full-color PNGs, optional Real-ESRGAN 4× upscale, and JSON shot metadata.
- Shot title and crew notes stored with each frame. Notes guide the crew; they are not sent to the image model.
- Saved local gallery, reusable brief, and a portable printable board with embedded images and selected shots in order.
- Localhost-only interface. No cloud AI, API key, analytics, or remote browser assets.

## QVAC dependency and calls

`@qvac/sdk` is an exact **`0.19.1` dependency** in `package.json` and `package-lock.json`. FRAME calls `loadModel`, `diffusion`, `upscale`, `unloadModel`, `heartbeat`, and `close`. `loadModel` loads a verified model from a local path; `diffusion` generates the concept frame; `upscale` enlarges a selected original frame. The other functions release resources and check the local worker. Rendering and upscaling use QVAC on-device. See [src/render.js](src/render.js).

`npm run verify` checks five requested SDK exports—`loadModel`, `unloadModel`, `completion`, `diffusion`, and `textToSpeech`—and also checks `upscale`. **`completion` and `textToSpeech` are export checks only; FRAME does not use them for inference.** `npm run doctor` tests the real worker connection; `npm run smoke` performs actual image inference.

## Requirements

- Node.js 22.17+ and npm 10.9+.
- Windows 10/11 x64 with Vulkan 1.4 GPU drivers and Microsoft Visual C++ 2015–2022 x64 runtime; or a [QVAC-supported macOS/Linux host](https://docs.qvac.tether.io/getting-started/system-requirements/). Windows x64 with an RTX 4050 was tested.
- For SDXL on a laptop, plan for roughly 16 GB RAM, a capable GPU with around 6 GB VRAM, and 12 GB free storage. Other hardware may take much longer or need CPU mode.
- Internet during initial install and model setup. SDXL weights are 3.94 GB; the optional ESRGAN upscaler is 67 MB. Inference then loads local files.

## Install from a fresh clone

```sh
git clone https://github.com/firstbeep/frame.git
cd frame
node --version
npm --version
npm ci
npm run verify
npm run doctor
npm run setup
```

Use `npm ci` to honor the committed lockfile. Keep npm optional dependencies and install scripts enabled so the platform's Bare/native packages install. `npm run setup` downloads fixed model versions into `.cache/models/`, verifies their SHA-256 hashes, and resumes interrupted downloads automatically. It may take several minutes. The old SD 2.1 model is no longer required; an existing `.cache/models/` copy can remain without affecting SDXL.

## Run and use

```sh
npm start
```

Open **http://127.0.0.1:3210**. Select a shoot brief or type your own short description. Add a shot title and crew notes, choose camera and lighting, and click **Render scene**. Progress appears in the page and terminal. Download the resulting PNG, or use **Upscale 4×** on an original frame. Check the frames for accuracy, select the ones your crew needs, set a project name, and click **Export printable board**. Open the downloaded HTML file and use your browser's Print command for paper or PDF.

Frames and JSON shot notes persist in `outputs/`. See an [exported crew board](docs/evidence/crew-board.html) from the real browser test. The app allows one job at a time and can reconnect after a browser refresh. **Stop render** terminates the active worker. Press Ctrl+C in the terminal to stop the server.

## Tests and proof

```sh
npm test
npm run test:startup
npm run smoke
```

`npm test` checks scene bounds, untouched color PNG output, safe portable board export, error diagnostics, and server boundaries. `npm run test:startup` deliberately triggers and recovers from a real RPC initialization timeout. `npm run smoke` loads the local SDXL model, renders a color product frame, loads Real-ESRGAN, and upscales the generated image. It exits nonzero if real inference fails. See [the verification report](docs/VERIFICATION.md) and [an actual output with metadata](docs/evidence/shot-notes.json).

Optional browser checks:

```sh
npx playwright install chromium
npm run test:ui
```

To run the real Render-button/browser integration test, set `FRAME_E2E=1` before `npm run test:ui` (PowerShell: `$env:FRAME_E2E = "1"`). It refreshes the screenshot above after a successful real render.

The screenshot and example panel in `docs/evidence/` show actual QVAC output. The SDK reports sampling steps but does not stream intermediate image previews. The interface displays the image once QVAC returns its PNG. A fast demo on one GPU does not guarantee a 15-second render on reviewer hardware.

## Offline and privacy

Finish npm installation and model setup while connected. FRAME sends prompts only to the local server on `127.0.0.1`; QVAC loads local model paths during inference. Images, briefs, and boards remain on the local machine. “Offline” means internet is unnecessary after setup; the browser still makes localhost requests. The supplied test report does not claim a system-wide network-disconnection test.

## Troubleshooting

| Problem | Action |
| --- | --- |
| **RPC initialization timeout** (sometimes written “RCP”) | Run `npm run doctor`; keep the full error and worker cause. Confirm Node version, native optional packages, Vulkan 1.4 drivers, and the VC++ x64 runtime on Windows. FRAME's SDK config allows 500,000 ms for a slow handshake. A worker crash or missing DLL needs a dependency/driver fix; more waiting will not fix it. You can override only genuinely slow startup with `QVAC_RPC_INIT_TIMEOUT_MS=600000` (PowerShell: `$env:QVAC_RPC_INIT_TIMEOUT_MS="600000"`). |
| Setup download interrupted | Run `npm run setup` again. Partial downloads resume automatically and completed files are hash-checked. |
| Render disabled | Finish `npm run setup`, then refresh the page. |
| GPU memory error | Close other GPU applications, choose Wide instead of Square, or try `FRAME_DEVICE=cpu npm start` (PowerShell: `$env:FRAME_DEVICE="cpu"; npm start`). Windows still requires Vulkan. |
| Slow render | SDXL uses more compute than the old model; a 28-step 1024×1024 frame took around 45 seconds for generation on the tested RTX 4050, plus model loading. Try Draft (20 steps). |
| Port 3210 busy | Stop the previous server or set `PORT=3211` and visit `http://127.0.0.1:3211`. |
| `qvac doctor` not found | That is a separate CLI. Use FRAME's `npm run doctor`. |

Model weights are **not** covered by FRAME's [MIT license](LICENSE); see [model sources and licenses](docs/MODELS.md). The public repo and X post are linked in [the reviewer audit](docs/REVIEWER-AUDIT.md). The organizer alone determines bounty eligibility; the specific rejection reason has not been provided to us.
